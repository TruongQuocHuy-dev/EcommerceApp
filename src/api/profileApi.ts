import api from './client';

export const profileApi = {
    getFavorites: async () => {
        const response = await api.get('/profile/favorites');
        return response.data.data;
    },

    addFavorite: async (productId: string) => {
        const response = await api.post('/profile/favorites', { productId });
        return response.data.data;
    },

    removeFavorite: async (productId: string) => {
        const response = await api.delete(`/profile/favorites/${productId}`);
        return response.data.data;
    }
};
