import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export const useFavorites = () => {
    const [favorites, setFavorites] = useState([]);
    const { isAuthenticated, token } = useAuth();

    const getUserId = useCallback(() => {
        if (!isAuthenticated || !token) return null;
        try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            return decoded.userId;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }, [isAuthenticated, token]);

    const addToFavorites = async (productId) => {
        if (!isAuthenticated) {
            toast.error('Для добавления в избранное необходимо авторизоваться');
            return false;
        }

        const userId = getUserId();
        if (!userId) return false;

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${userId}/favorites`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId }),
            });

            if (!response.ok) {
                throw new Error('Ошибка при добавлении в избранное');
            }

            const updatedFavorites = await response.json();
            setFavorites(updatedFavorites);
            toast.success('Товар добавлен в избранное');
            return true;
        } catch (error) {
            console.error('Error adding to favorites:', error);
            toast.error('Ошибка при добавлении в избранное');
            return false;
        }
    };

    const removeFromFavorites = async (productId) => {
        if (!isAuthenticated) return false;

        const userId = getUserId();
        if (!userId) return false;

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${userId}/favorites/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Ошибка при удалении из избранного');
            }

            const updatedFavorites = await response.json();
            setFavorites(updatedFavorites);
            toast.success('Товар удален из избранного');
            return true;
        } catch (error) {
            console.error('Error removing from favorites:', error);
            toast.error('Ошибка при удалении из избранного');
            return false;
        }
    };

    const toggleFavorite = async (productId, isCurrentlyFavorite) => {
        if (isCurrentlyFavorite) {
            return await removeFromFavorites(productId);
        } else {
            return await addToFavorites(productId);
        }
    };

    const isFavorite = (productId) => {
        return favorites.some(fav => fav._id === productId);
    };

    const fetchFavorites = useCallback(async () => {
        if (!isAuthenticated) {
            setFavorites([]);
            return;
        }

        const userId = getUserId();
        if (!userId) return;

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${userId}/favorites`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке избранных');
            }

            const favoritesData = await response.json();
            setFavorites(favoritesData);
        } catch (error) {
            console.error('Error fetching favorites:', error);
            setFavorites([]);
        }
    }, [isAuthenticated, token, getUserId]);

    return {
        favorites,
        addToFavorites,
        removeFromFavorites,
        toggleFavorite,
        isFavorite,
        fetchFavorites,
    };
};