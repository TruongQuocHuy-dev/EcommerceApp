import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/client';

export interface Shop {
    _id: string;
    name: string;
    description: string;
    owner: string;
    logo: string;
    banner: string;
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
    };
    phone?: string;
    email?: string;
    businessType?: string;
    taxId?: string;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    rating: number;
    reviewCount: number;
    createdAt: string;
}

interface ShopState {
    publicShops: Shop[];
    myShop: Shop | null;
    isLoading: boolean;
    error: string | null;
    registrationSuccess: boolean;
}

const initialState: ShopState = {
    publicShops: [],
    myShop: null,
    isLoading: false,
    error: null,
    registrationSuccess: false,
};

// Async Thunks
export const fetchPublicShops = createAsyncThunk(
    'shop/fetchPublicShops',
    async (params: { page?: number; limit?: number; search?: string } | void, { rejectWithValue }) => {
        try {
            const query = new URLSearchParams(params as any).toString();
            const response = await api.get(`/shops/public?${query}`);
            return response.data.data.shops;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to fetch public shops'
            );
        }
    }
);

export const registerShop = createAsyncThunk(
    'shop/registerShop',
    async (shopData: any, { rejectWithValue }) => {
        try {
            const response = await api.post('/shops/register', shopData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to register shop'
            );
        }
    }
);

export const updateShop = createAsyncThunk(
    'shop/updateShop',
    async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/shops/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to update shop'
            );
        }
    }
);

export const fetchMyShop = createAsyncThunk(
    'shop/fetchMyShop',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/shops/my-shop');
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to fetch your shop'
            );
        }
    }
);

// We slice up the shop state
const shopSlice = createSlice({
    name: 'shop',
    initialState,
    reducers: {
        clearShopError: (state) => {
            state.error = null;
        },
        resetRegistrationStatus: (state) => {
            state.registrationSuccess = false;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch public shops
            .addCase(fetchPublicShops.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchPublicShops.fulfilled, (state, action) => {
                state.isLoading = false;
                state.publicShops = action.payload;
            })
            .addCase(fetchPublicShops.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Register shop
            .addCase(registerShop.pending, (state) => {
                state.isLoading = true;
                state.error = null;
                state.registrationSuccess = false;
            })
            .addCase(registerShop.fulfilled, (state, action) => {
                state.isLoading = false;
                state.myShop = action.payload;
                state.registrationSuccess = true;
            })
            .addCase(registerShop.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
                state.registrationSuccess = false;
            })

            // Update shop
            .addCase(updateShop.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateShop.fulfilled, (state, action) => {
                state.isLoading = false;
                state.myShop = action.payload; // Update myShop locally
            })
            .addCase(updateShop.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Fetch my shop
            .addCase(fetchMyShop.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchMyShop.fulfilled, (state, action) => {
                state.isLoading = false;
                state.myShop = action.payload;
            })
            .addCase(fetchMyShop.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearShopError, resetRegistrationStatus } = shopSlice.actions;
export default shopSlice.reducer;
