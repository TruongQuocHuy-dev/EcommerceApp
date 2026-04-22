import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/client';

export interface Notification {
    _id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    link?: string;
    isRead: boolean;
    readAt?: string;
    createdAt: string;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
}

const initialState: NotificationState = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
};

// Async Thunks
export const fetchNotifications = createAsyncThunk(
    'notification/fetchNotifications',
    async (params: { page?: number; limit?: number } | void, { rejectWithValue }) => {
        try {
            const query = new URLSearchParams(params as any || {}).toString();
            const response = await api.get(`/notifications?${query}`);
            return response.data.data.notifications;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to fetch notifications'
            );
        }
    }
);

export const fetchUnreadCount = createAsyncThunk(
    'notification/fetchUnreadCount',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/notifications/unread-count');
            return response.data.data.count;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to fetch unread count'
            );
        }
    }
);

export const markAsRead = createAsyncThunk(
    'notification/markAsRead',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await api.patch(`/notifications/${id}/read`);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to mark notification as read'
            );
        }
    }
);

export const markAllAsRead = createAsyncThunk(
    'notification/markAllAsRead',
    async (_, { rejectWithValue }) => {
        try {
            await api.patch('/notifications/mark-all-read');
            return true;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to mark all notifications as read'
            );
        }
    }
);

export const deleteNotification = createAsyncThunk(
    'notification/deleteNotification',
    async (id: string, { rejectWithValue }) => {
        try {
            await api.delete(`/notifications/${id}`);
            return id;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || 'Failed to delete notification'
            );
        }
    }
);

const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
        clearNotificationError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch notifications
            .addCase(fetchNotifications.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.isLoading = false;
                state.notifications = action.payload;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Fetch unread count
            .addCase(fetchUnreadCount.fulfilled, (state, action) => {
                state.unreadCount = action.payload;
            })

            // Mark as read
            .addCase(markAsRead.fulfilled, (state, action) => {
                const updatedNotification = action.payload;
                const index = state.notifications.findIndex(n => n._id === updatedNotification._id);
                if (index !== -1) {
                    state.notifications[index] = updatedNotification;
                }
                if (state.unreadCount > 0) {
                    state.unreadCount -= 1;
                }
            })

            // Mark all as read
            .addCase(markAllAsRead.fulfilled, (state) => {
                state.notifications.forEach(n => {
                    n.isRead = true;
                });
                state.unreadCount = 0;
            })

            // Delete notification
            .addCase(deleteNotification.fulfilled, (state, action) => {
                const id = action.payload;
                const notification = state.notifications.find(n => n._id === id);
                if (notification && !notification.isRead && state.unreadCount > 0) {
                    state.unreadCount -= 1;
                }
                state.notifications = state.notifications.filter(n => n._id !== id);
            });
    },
});

export const { clearNotificationError } = notificationSlice.actions;
export default notificationSlice.reducer;
