import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/client';

interface OrderItem {
    product: any;
    name: string;
    price: number;
    quantity: number;
    image: string;
    variationText?: string;
    skuCode?: string;
}

interface ShippingAddress {
    name: string;
    phone: string;
    address: string;
    city: string;
    province?: string;
    postalCode?: string;
}

interface PaymentInfo {
    method: string;
    status: string;
    paidAt?: string;
}

interface Order {
    id: string;
    orderNumber: string;
    items: OrderItem[];
    shippingAddress: ShippingAddress;
    totalAmount: number;
    subtotal?: number;
    discount?: {
        code: string;
        amount: number;
    };
    status: string;
    paymentInfo: PaymentInfo;
    seller?: any;
    customer?: any;
    notes?: string;
    isCancellable?: boolean;
    createdAt: string;
    updatedAt?: string;
}

interface Pagination {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

interface OrderState {
    orders: Order[];
    currentOrder: Order | null;
    pagination: Pagination | null;
    addresses: any[];
    isLoading: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    error: any | null;
}

const initialState: OrderState = {
    orders: [],
    currentOrder: null,
    pagination: null,
    addresses: [],
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    error: null,
};

// ===== Async Thunks =====

export const createOrder = createAsyncThunk(
    'order/createOrder',
    async (
        orderData: {
            shippingAddress?: ShippingAddress;
            addressId?: string;
            paymentMethod: string;
            notes?: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const response = await api.post('/orders', orderData);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to create order'
            );
        }
    }
);

export const fetchOrders = createAsyncThunk(
    'order/fetchOrders',
    async (
        params: { status?: string; page?: number; limit?: number; asSeller?: boolean } = {},
        { rejectWithValue }
    ) => {
        try {
            const queryParams = new URLSearchParams();
            if (params.status) queryParams.append('status', params.status);
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());
            if (params.asSeller) queryParams.append('asSeller', 'true');

            const response = await api.get(`/orders?${queryParams.toString()}`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to fetch orders'
            );
        }
    }
);

export const fetchOrderById = createAsyncThunk(
    'order/fetchOrderById',
    async (orderId: string, { rejectWithValue }) => {
        try {
            const response = await api.get(`/orders/${orderId}`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to fetch order details'
            );
        }
    }
);

export const cancelOrder = createAsyncThunk(
    'order/cancelOrder',
    async (orderId: string, { rejectWithValue }) => {
        try {
            const response = await api.delete(`/orders/${orderId}/cancel`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to cancel order'
            );
        }
    }
);

export const updateOrderStatus = createAsyncThunk(
    'order/updateOrderStatus',
    async (
        { orderId, status }: { orderId: string; status: string },
        { rejectWithValue }
    ) => {
        try {
            const response = await api.put(`/orders/${orderId}/status`, { status });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to update order status'
            );
        }
    }
);

// ===== Payment Thunks =====

export const createMomoPayment = createAsyncThunk(
    'order/createMomoPayment',
    async (orderId: string, { rejectWithValue }) => {
        try {
            const response = await api.post('/payments/momo/create', { orderId });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to create MoMo payment'
            );
        }
    }
);

export const createVnpayPayment = createAsyncThunk(
    'order/createVnpayPayment',
    async (
        { orderId, bankCode }: { orderId: string; bankCode?: string },
        { rejectWithValue }
    ) => {
        try {
            const response = await api.post('/payments/vnpay/create', {
                orderId,
                bankCode,
            });
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to create VNPay payment'
            );
        }
    }
);

export const checkPaymentStatus = createAsyncThunk(
    'order/checkPaymentStatus',
    async (orderId: string, { rejectWithValue }) => {
        try {
            const response = await api.get(`/payments/${orderId}/status`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to check payment status'
            );
        }
    }
);

// ===== Address Thunks =====

export const fetchDefaultAddress = createAsyncThunk(
    'order/fetchDefaultAddress',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/addresses/default');
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'No default address found'
            );
        }
    }
);

export const fetchAddresses = createAsyncThunk(
    'order/fetchAddresses',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/addresses');
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to fetch addresses'
            );
        }
    }
);

export const addAddress = createAsyncThunk(
    'order/addAddress',
    async (addressData: any, { rejectWithValue }) => {
        try {
            const response = await api.post('/addresses', addressData);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to add address'
            );
        }
    }
);

export const updateAddress = createAsyncThunk(
    'order/updateAddress',
    async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/addresses/${id}`, data);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to update address'
            );
        }
    }
);

export const deleteAddress = createAsyncThunk(
    'order/deleteAddress',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await api.delete(`/addresses/${id}`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to delete address'
            );
        }
    }
);

export const setDefaultAddress = createAsyncThunk(
    'order/setDefaultAddress',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await api.put(`/addresses/${id}/set-default`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to set default address'
            );
        }
    }
);

// ===== Slice =====

const orderSlice = createSlice({
    name: 'order',
    initialState,
    reducers: {
        clearCurrentOrder: (state) => {
            state.currentOrder = null;
        },
        clearError: (state) => {
            state.error = null;
        },
        clearOrders: (state) => {
            state.orders = [];
            state.pagination = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Create Order
            .addCase(createOrder.pending, (state) => {
                state.isCreating = true;
                state.error = null;
            })
            .addCase(createOrder.fulfilled, (state, action) => {
                state.isCreating = false;
                state.currentOrder = action.payload.order;
            })
            .addCase(createOrder.rejected, (state, action) => {
                state.isCreating = false;
                state.error = action.payload;
            })

            // Fetch Orders
            .addCase(fetchOrders.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchOrders.fulfilled, (state, action) => {
                state.isLoading = false;
                const page = action.payload.pagination?.currentPage || 1;
                if (page === 1) {
                    state.orders = action.payload.orders || [];
                } else {
                    state.orders = [...state.orders, ...(action.payload.orders || [])];
                }
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchOrders.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Fetch Order By ID
            .addCase(fetchOrderById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchOrderById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentOrder = action.payload.order;
            })
            .addCase(fetchOrderById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })

            // Cancel Order
            .addCase(cancelOrder.pending, (state) => {
                state.isUpdating = true;
                state.error = null;
            })
            .addCase(cancelOrder.fulfilled, (state, action) => {
                state.isUpdating = false;
                if (state.currentOrder) {
                    state.currentOrder.status = 'cancelled';
                }
                // Update in orders list
                const idx = state.orders.findIndex(
                    (o) => o.id === action.payload?.id || o.id === action.meta.arg
                );
                if (idx !== -1) {
                    state.orders[idx].status = 'cancelled';
                }
            })
            .addCase(cancelOrder.rejected, (state, action) => {
                state.isUpdating = false;
                state.error = action.payload;
            })

            // Update Order Status (Seller)
            .addCase(updateOrderStatus.pending, (state) => {
                state.isUpdating = true;
                state.error = null;
            })
            .addCase(updateOrderStatus.fulfilled, (state, action) => {
                state.isUpdating = false;
                const updatedOrder = action.payload.order;
                if (state.currentOrder && state.currentOrder.id === updatedOrder.id) {
                    state.currentOrder.status = updatedOrder.status;
                    state.currentOrder.paymentInfo = updatedOrder.paymentInfo;
                }
                const idx = state.orders.findIndex((o) => o.id === updatedOrder.id);
                if (idx !== -1) {
                    state.orders[idx].status = updatedOrder.status;
                }
            })
            .addCase(updateOrderStatus.rejected, (state, action) => {
                state.isUpdating = false;
                state.error = action.payload;
            })

            // Addresses
            .addCase(fetchAddresses.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchAddresses.fulfilled, (state, action) => {
                state.isLoading = false;
                state.addresses = action.payload.addresses || [];
            })
            .addCase(fetchAddresses.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    },
});

export const { clearCurrentOrder, clearError, clearOrders } =
    orderSlice.actions;
export default orderSlice.reducer;
