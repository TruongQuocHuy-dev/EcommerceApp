import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/client';

interface ProductState {
  products: any[];
  homeProducts: any[];
  currentProduct: any | null;
  searchResults: any[];
  pagination: any | null;
  isLoading: boolean;
  error: any | null;
}

const initialState: ProductState = {
  products: [],
  homeProducts: [],
  currentProduct: null,
  searchResults: [],
  pagination: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchProducts = createAsyncThunk(
  'product/fetchProducts',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/products?${queryString}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const fetchHomeProducts = createAsyncThunk(
  'product/fetchHomeProducts',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/products?${queryString}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch home products');
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'product/fetchProductById',
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/products/${productId}`);
      return response.data.data.product;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch product');
    }
  }
);

export const searchProducts = createAsyncThunk(
  'product/searchProducts',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/products?search=${encodeURIComponent(query)}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Search failed');
    }
  }
);
export const createProduct = createAsyncThunk(
  'product/createProduct',
  async (productData: any, { rejectWithValue }) => {
    try {
      const isFormData = productData instanceof FormData;
      const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {};
      const response = await api.post('/products', productData, { headers });
      return response.data.data;
    } catch (error: any) {
      // Handle multipart/form-data error or standard json
      const message = error.response?.data?.message || 'Failed to create product';
      return rejectWithValue(message);
    }
  }
);

export const updateProduct = createAsyncThunk(
  'product/updateProduct',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const isFormData = data instanceof FormData;
      const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {};
      const response = await api.put(`/products/${id}`, data, { headers });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update product');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'product/deleteProduct',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/products/${id}`);
      return id; // Return ID to remove from state
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete product');
    }
  }
);

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload?.products || [];
        state.pagination = action.payload?.pagination || null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Home Products
      .addCase(fetchHomeProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHomeProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.meta.arg.page > 1) {
          state.homeProducts = [...state.homeProducts, ...(action.payload?.products || [])];
        } else {
          state.homeProducts = action.payload?.products || [];
        }
        state.pagination = action.payload?.pagination || null;
      })
      .addCase(fetchHomeProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Product by ID
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Search Products
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.searchResults = action.payload?.products || [];
      })
      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products.unshift(action.payload.product); // Add to top of list
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.products.findIndex((p) => p._id === action.payload.product.id);
        if (index !== -1) {
          state.products[index] = { ...state.products[index], ...action.payload.product };
        }
        state.currentProduct = action.payload.product;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = state.products.filter((p) => p._id !== action.payload);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentProduct, clearSearchResults } = productSlice.actions;
export default productSlice.reducer;
