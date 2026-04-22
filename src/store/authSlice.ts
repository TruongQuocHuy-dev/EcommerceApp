import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/client';
import Storage from '../utils/storage';
import { STORAGE_KEYS } from '../utils/constants';

interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: any | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: any, { rejectWithValue }) => {
    try {
      console.log('Login: sending request');
      const response = await api.post('/auth/login', { email, password });
      console.log('Login: response received', JSON.stringify(response.data));

      const { user, tokens } = response.data.data;
      console.log('Login: destructured data');

      await Storage.setTokens(tokens.accessToken, tokens.refreshToken);
      console.log('Login: tokens saved');

      await Storage.set(STORAGE_KEYS.USER_DATA, user);
      console.log('Login: user data saved');

      return user;
    } catch (error: any) {
      console.error('Login error full:', error);
      console.error('Login error response:', error.response);
      return rejectWithValue(
        error.response?.data?.message || 'Login failed'
      );
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ name, email, password }: any, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed'
      );
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: { name?: string; avatar?: string }, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.put('/profile', profileData);
      const updatedUser = response.data.data;

      dispatch(updateUser(updatedUser)); // Synchronously update state

      // Update local storage
      const userData = await Storage.get(STORAGE_KEYS.USER_DATA);
      const storageUser = userData ? (typeof userData === 'string' ? JSON.parse(userData) : userData) : {};
      await Storage.set(STORAGE_KEYS.USER_DATA, { ...storageUser, ...updatedUser });

      return updatedUser;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update profile'
      );
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
      await Storage.clearTokens();
      return null;
    } catch (error) {
      await Storage.clearTokens();
      return null;
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const { accessToken } = await Storage.getTokens();
      if (!accessToken) {
        return null;
      }

      const userData = await Storage.get(STORAGE_KEYS.USER_DATA);
      return userData;
    } catch (error) {
      return null;
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log('authSlice: login.fulfilled triggered');
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        console.log('authSlice: login.rejected triggered', action.error);
        state.isLoading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
