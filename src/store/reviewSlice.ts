import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/client';

interface Review {
    id: string;
    user: {
        id: string;
        name: string;
    };
    rating: number;
    title: string;
    comment: string;
    helpfulVotes: number;
    isVerifiedPurchase: boolean;
    createdAt: string;
}

interface ReviewState {
    reviews: Review[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    } | null;
    isLoading: boolean;
    isSubmitting: boolean;
    error: string | null;
    submitError: string | null;
    submitSuccess: boolean;
}

const initialState: ReviewState = {
    reviews: [],
    pagination: null,
    isLoading: false,
    isSubmitting: false,
    error: null,
    submitError: null,
    submitSuccess: false,
};

// Create a review
export const createReview = createAsyncThunk(
    'review/createReview',
    async (
        { productId, rating, title, comment }: { productId: string; rating: number; title: string; comment: string },
        { rejectWithValue }
    ) => {
        try {
            const response = await api.post(`/products/${productId}/reviews`, {
                rating,
                title,
                comment,
            });
            return response.data.data.review;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Không thể gửi đánh giá');
        }
    }
);

// Get reviews for a product
export const fetchProductReviews = createAsyncThunk(
    'review/fetchProductReviews',
    async ({ productId, page = 1 }: { productId: string; page?: number }, { rejectWithValue }) => {
        try {
            const response = await api.get(`/products/${productId}/reviews`, {
                params: { page, limit: 10 },
            });
            return {
                data: response.data.data,
                page
            };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Không thể tải đánh giá');
        }
    }
);

const reviewSlice = createSlice({
    name: 'review',
    initialState,
    reducers: {
        resetReviewState: (state) => {
            state.submitSuccess = false;
            state.submitError = null;
            state.isSubmitting = false;
        },
        clearReviews: (state) => {
            state.reviews = [];
            state.pagination = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Create Review
            .addCase(createReview.pending, (state) => {
                state.isSubmitting = true;
                state.submitError = null;
                state.submitSuccess = false;
            })
            .addCase(createReview.fulfilled, (state, action) => {
                state.isSubmitting = false;
                state.submitSuccess = true;
                state.reviews.unshift(action.payload);
            })
            .addCase(createReview.rejected, (state, action) => {
                state.isSubmitting = false;
                state.submitError = action.payload as string;
            })
            // Fetch Reviews
            .addCase(fetchProductReviews.pending, (state, action) => {
                // Only show main loading state if it's the first page
                const isFirstPage = !action.meta.arg.page || action.meta.arg.page === 1;
                if (isFirstPage) {
                    state.isLoading = true;
                }
                state.error = null;
            })
            .addCase(fetchProductReviews.fulfilled, (state, action) => {
                state.isLoading = false;
                const { page, data } = action.payload;

                if (page === 1 || !page) {
                    state.reviews = data.reviews || [];
                } else if (data.reviews && data.reviews.length > 0) {
                    // Prevent duplicate reviews when appending (in case of StrictMode or fast double calls)
                    const existingIds = new Set(state.reviews.map(r => r.id));
                    const newReviews = data.reviews.filter((r: Review) => !existingIds.has(r.id));
                    state.reviews = [...state.reviews, ...newReviews];
                }

                state.pagination = data.pagination;
            })
            .addCase(fetchProductReviews.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { resetReviewState, clearReviews } = reviewSlice.actions;
export default reviewSlice.reducer;
