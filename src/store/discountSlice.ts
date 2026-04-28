import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../api/client';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Voucher {
    id: string;
    name: string;
    code: string;
    description?: string;
    type: 'percentage' | 'fixed' | 'freeship';
    value: number;
    minOrderValue: number;
    maxDiscount?: number;
    startDate: string;
    endDate: string;
    usageLimit?: number;
    usageCount: number;
    usagePerUser: number;
    isActive: boolean;
    isValid: boolean;
    applicableProducts: string[];
    createdAt: string;
}

interface VoucherState {
    vouchers: Voucher[];
    isLoading: boolean;
    error: string | null;
}

const initialState: VoucherState = {
    vouchers: [],
    isLoading: false,
    error: null,
};

// ─── Async Thunks ────────────────────────────────────────────────────────────
export const fetchMyVouchers = createAsyncThunk(
    'discount/fetchMyVouchers',
    async (_, { rejectWithValue }) => {
        try {
            const res = await api.get('/discounts/seller/mine');
            return res.data.data.discounts as Voucher[];
        } catch (err: any) {
            return rejectWithValue(
                err.response?.data?.message || 'Failed to fetch vouchers'
            );
        }
    }
);

export const createVoucher = createAsyncThunk(
    'discount/createVoucher',
    async (data: Partial<Voucher>, { rejectWithValue }) => {
        try {
            const res = await api.post('/discounts/seller', data);
            return res.data.data.discount as Voucher;
        } catch (err: any) {
            return rejectWithValue(
                err.response?.data?.errors?.[0]?.msg ||
                err.response?.data?.message ||
                'Failed to create voucher'
            );
        }
    }
);

export const updateVoucher = createAsyncThunk(
    'discount/updateVoucher',
    async ({ id, data }: { id: string; data: Partial<Voucher> }, { rejectWithValue }) => {
        try {
            const res = await api.patch(`/discounts/seller/${id}`, data);
            return res.data.data.discount as Voucher;
        } catch (err: any) {
            return rejectWithValue(
                err.response?.data?.errors?.[0]?.msg ||
                err.response?.data?.message ||
                'Failed to update voucher'
            );
        }
    }
);

export const deleteVoucher = createAsyncThunk(
    'discount/deleteVoucher',
    async (id: string, { rejectWithValue }) => {
        try {
            await api.delete(`/discounts/seller/${id}`);
            return id;
        } catch (err: any) {
            return rejectWithValue(
                err.response?.data?.message || 'Failed to delete voucher'
            );
        }
    }
);

// ─── Slice ───────────────────────────────────────────────────────────────────
const discountSlice = createSlice({
    name: 'discount',
    initialState,
    reducers: {
        clearError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // fetchMyVouchers
        builder
            .addCase(fetchMyVouchers.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchMyVouchers.fulfilled, (state, action) => {
                state.isLoading = false;
                state.vouchers = action.payload;
            })
            .addCase(fetchMyVouchers.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // createVoucher
        builder
            .addCase(createVoucher.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createVoucher.fulfilled, (state, action) => {
                state.isLoading = false;
                state.vouchers.unshift(action.payload);
            })
            .addCase(createVoucher.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // updateVoucher
        builder
            .addCase(updateVoucher.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateVoucher.fulfilled, (state, action) => {
                state.isLoading = false;
                const idx = state.vouchers.findIndex(
                    (v) => v.id === action.payload.id
                );
                if (idx !== -1) state.vouchers[idx] = action.payload;
            })
            .addCase(updateVoucher.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // deleteVoucher — marks as inactive optimistically reflected via re-fetch
        builder
            .addCase(deleteVoucher.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteVoucher.fulfilled, (state, action) => {
                state.isLoading = false;
                state.vouchers = state.vouchers.filter((v) => v.id !== action.payload);
            })
            .addCase(deleteVoucher.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError } = discountSlice.actions;
export default discountSlice.reducer;
