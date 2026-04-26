import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

// API Configuration
export const API_BASE_URL: string = ENV_API_BASE_URL || 'http://192.168.1.7:3000/api/v1'; // Local IP for physical device/emulator

// App Configuration
export const APP_NAME: string = 'E-Commerce App';

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// Payment Methods
export const PAYMENT_METHODS = {
  COD: 'COD',
  MOMO: 'momo',
  VNPAY: 'vnpay',
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];
