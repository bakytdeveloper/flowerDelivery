import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import {jwtDecode} from "jwt-decode";

export const useFavorites = () => {
    const [favorites, setFavorites] = useState([]);
    const { isAuthenticated, token } = useAuth();

    const addToFavorites = async (productId) => {
        if (!isAuthenticated) {
            toast.error('Для добавления в избранное необходимо авторизоваться');
            return false;
        }

        try {
            // ИСПРАВЛЕННЫЙ URL: убрали userId из пути
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/favorites`, {
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

            const result = await response.json();

            // Обрабатываем разные структуры ответа
            if (result.favorites && Array.isArray(result.favorites)) {
                setFavorites(result.favorites);
            } else if (Array.isArray(result)) {
                setFavorites(result);
            }

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

        try {
            // ИСПРАВЛЕННЫЙ URL: убрали userId из пути
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/favorites/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Ошибка при удалении из избранного');
            }

            const result = await response.json();

            // Обрабатываем разные структуры ответа
            if (result.favorites && Array.isArray(result.favorites)) {
                setFavorites(result.favorites);
            } else if (Array.isArray(result)) {
                setFavorites(result);
            } else {
                // Если сервер не возвращает обновленный список, фильтруем локально
                setFavorites(prev => prev.filter(fav => fav._id !== productId));
            }

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

        try {
            const decoded = jwtDecode(token);
            // Если это админ, не пытаемся получить профиль из базы
            if (decoded.role === 'admin') {
                const adminUser = {
                    _id: 'admin',
                    email: decoded.email,
                    name: 'Администратор',
                    role: 'admin'
                };
                return adminUser;
            }
            // ИСПРАВЛЕННЫЙ URL: убрали userId из пути
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/favorites`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке избранных');
            }

            const favoritesData = await response.json();

            // Обрабатываем разные структуры ответа
            if (Array.isArray(favoritesData)) {
                setFavorites(favoritesData);
            } else if (favoritesData.favorites && Array.isArray(favoritesData.favorites)) {
                setFavorites(favoritesData.favorites);
            } else {
                setFavorites([]);
            }
        } catch (error) {
            console.error('Error fetching favorites:', error);
            setFavorites([]);
        }
    }, [isAuthenticated, token]);

    return {
        favorites,
        addToFavorites,
        removeFromFavorites,
        toggleFavorite,
        isFavorite,
        fetchFavorites,
    };
};