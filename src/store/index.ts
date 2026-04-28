import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import cartReducer from './cartSlice';
import productReducer from './productSlice';
import categoryReducer from './categorySlice';
import orderReducer from './orderSlice';
import reviewReducer from './reviewSlice';
import shopReducer from './shopSlice';
import notificationReducer from './notificationSlice';
import bannerReducer from './bannerSlice';
import discountReducer from './discountSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    product: productReducer,
    category: categoryReducer,
    order: orderReducer,
    review: reviewReducer,
    shop: shopReducer,
    notification: notificationReducer,
    banners: bannerReducer,
    discount: discountReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
