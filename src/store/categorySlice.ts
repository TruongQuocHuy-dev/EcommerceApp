import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/client';

export interface Category {
    _id: string;
    id?: string;
    name: string;
    description?: string;
    image?: string;
    parent?: string | { _id: string; name: string };
    children?: Category[];
}

export interface CategoryState {
    categories: Category[];
    isLoading: boolean;
    error: string | null;
}

const initialState: CategoryState = {
    categories: [],
    isLoading: false,
    error: null,
};

// Async thunk to fetch categories
export const fetchCategories = createAsyncThunk(
    'category/fetchCategories',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/categories');
            return response.data.data.categories;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
        }
    }
);

const categorySlice = createSlice({
    name: 'category',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCategories.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.isLoading = false;
                state.categories = action.payload;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export default categorySlice.reducer;
