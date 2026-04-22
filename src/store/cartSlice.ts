import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/client';

interface CartState {
  items: any[];
  totalAmount: number;
  discountedTotal: number;
  shopDiscount: any | null;
  systemDiscount: any | null;
  freeshippingDiscount: any | null;
  isLoading: boolean;
  error: any | null;
}

const initialState: CartState = {
  items: [],
  totalAmount: 0,
  discountedTotal: 0,
  shopDiscount: null,
  systemDiscount: null,
  freeshippingDiscount: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/cart');
      return response.data.data.cart;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity, skuId }: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/cart/add', { productId, quantity, skuId });
      return response.data.data.cart;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to cart');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity }: any, { rejectWithValue }) => {
    try {
      const response = await api.put(`/cart/update/${itemId}`, { quantity });
      return response.data.data.cart;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update cart');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (itemId: string, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/cart/remove/${itemId}`);
      return response.data.data.cart;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove item');
    }
  }
);

export const removeDiscount = createAsyncThunk(
  'cart/removeDiscount',
  async (scope: 'shop' | 'system' | 'freeship', { rejectWithValue }) => {
    try {
      const response = await api.delete('/cart/remove-discount', { data: { scope } });
      return response.data.data.cart;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove discount');
    }
  }
);

export const applyDiscount = createAsyncThunk(
  'cart/applyDiscount',
  async (code: string, { rejectWithValue }) => {
    try {
      const response = await api.post('/cart/apply-discount', { code });
      return response.data.data.cart;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Invalid discount code');
    }
  }
);

export const clearCartAsync = createAsyncThunk(
  'cart/clearCartAsync',
  async (_, { rejectWithValue }) => {
    try {
      await api.delete('/cart/clear');
      return null;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCart: (state) => {
      state.items = [];
      state.totalAmount = 0;
      state.discountedTotal = 0;
      state.shopDiscount = null;
      state.systemDiscount = null;
      state.freeshippingDiscount = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload?.items || [];
        state.totalAmount = action.payload?.totalAmount || 0;
        state.discountedTotal = action.payload?.discountedTotal || 0;
        state.shopDiscount = action.payload?.shopDiscount || null;
        state.systemDiscount = action.payload?.systemDiscount || null;
        state.freeshippingDiscount = action.payload?.freeshippingDiscount || null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload?.items || [];
        state.totalAmount = action.payload?.totalAmount || 0;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Cart Item
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.items = action.payload?.items || [];
        state.totalAmount = action.payload?.totalAmount || 0;
      })
      // Remove from Cart
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = action.payload?.items || [];
        state.totalAmount = action.payload?.totalAmount || 0;
      })
      // Apply Discount
      .addCase(applyDiscount.fulfilled, (state, action) => {
        state.discountedTotal = action.payload?.discountedTotal || 0;
        state.shopDiscount = action.payload?.shopDiscount || null;
        state.systemDiscount = action.payload?.systemDiscount || null;
        state.freeshippingDiscount = action.payload?.freeshippingDiscount || null;
      })
      .addCase(applyDiscount.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Remove Discount
      .addCase(removeDiscount.fulfilled, (state, action) => {
        state.discountedTotal = action.payload?.discountedTotal || 0;
        state.shopDiscount = action.payload?.shopDiscount || null;
        state.systemDiscount = action.payload?.systemDiscount || null;
        state.freeshippingDiscount = action.payload?.freeshippingDiscount || null;
      })
      .addCase(removeDiscount.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Clear Cart (async)
      .addCase(clearCartAsync.fulfilled, (state) => {
        state.items = [];
        state.totalAmount = 0;
        state.discountedTotal = 0;
        state.shopDiscount = null;
        state.systemDiscount = null;
        state.freeshippingDiscount = null;
      });
  },
});

export const { clearCart, clearError } = cartSlice.actions;
export default cartSlice.reducer;
