import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../api/client';

export interface Banner {
    _id: string;
    title: string;
    image: string;
    link: string;
    isActive: boolean;
    order: number;
}

interface BannerState {
    banners: Banner[];
    isLoading: boolean;
    error: string | null;
}

const initialState: BannerState = {
    banners: [],
    isLoading: false,
    error: null,
};

export const fetchBanners = createAsyncThunk(
    'banners/fetchBanners',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/settings/banners');
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to fetch banners'
            );
        }
    }
);

const bannerSlice = createSlice({
    name: 'banners',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchBanners.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchBanners.fulfilled, (state, action: PayloadAction<Banner[]>) => {
                state.isLoading = false;
                // Only store active banners and sort them by order
                state.banners = action.payload
                    .filter(banner => banner.isActive !== false)
                    .sort((a, b) => (a.order || 0) - (b.order || 0));
            })
            .addCase(fetchBanners.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export default bannerSlice.reducer;
