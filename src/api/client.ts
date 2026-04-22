import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { API_BASE_URL } from '../utils/constants';
import Storage from '../utils/storage';

interface TokenResponse {
  data: {
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    console.log('API Interceptor: getting token');
    const { accessToken } = await Storage.getTokens();
    const tokenPreview = accessToken ? accessToken.substring(0, 10) + '...' : 'none';
    console.log(`API Interceptor: token retrieved (${tokenPreview})`);

    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`);
    }
    console.log(`API Interceptor: sending ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: any) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken } = await Storage.getTokens();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post<TokenResponse>(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data.data.tokens;

        await Storage.setTokens(newAccessToken, newRefreshToken);

        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
        return api(originalRequest);
      } catch (refreshError) {
        await Storage.clearTokens();
        // Will be handled by auth state listener
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
