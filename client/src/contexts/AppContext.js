// contexts/AppContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

export const AppProvider = ({ children }) => {
    const [favoritesCount, setFavoritesCount] = useState(0);
    const [cartItemsCount, setCartItemsCount] = useState(0);
    const { isAuthenticated, token, userRole, logout } = useAuth();
    const apiUrl = process.env.REACT_APP_API_URL;

    // Функция для полного сброса состояния при выходе
    const resetAppState = useCallback(() => {
        setFavoritesCount(0);
        setCartItemsCount(0);
    }, []);

    // Функция для обновления счетчика избранных
    const updateFavoritesCount = useCallback(async () => {
        if (!isAuthenticated || !token || userRole !== 'customer') {
            setFavoritesCount(0);
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/api/users/favorites`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const favorites = await response.json();
                const count = Array.isArray(favorites) ? favorites.length : 0;
                setFavoritesCount(count);
            }
        } catch (error) {
            console.error('Error fetching favorites count:', error);
            setFavoritesCount(0);
        }
    }, [isAuthenticated, token, userRole, apiUrl]);

    // Функция для обновления счетчика корзины
    const updateCartCount = useCallback(async () => {
        try {
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            } else {
                const sessionId = sessionStorage.getItem('guestSessionId');
                if (sessionId) {
                    headers['X-Session-Id'] = sessionId;
                }
            }

            const response = await fetch(`${apiUrl}/api/cart`, {
                headers: headers
            });

            if (response.ok) {
                const cartData = await response.json();
                let totalCount = 0;

                if (cartData.cart) {
                    const flowerItemsCount = cartData.cart.flowerItems?.reduce((total, item) => total + item.quantity, 0) || 0;
                    const addonItemsCount = cartData.cart.addonItems?.reduce((total, item) => total + item.quantity, 0) || 0;
                    totalCount = flowerItemsCount + addonItemsCount;
                } else if (cartData.flowerItems || cartData.addonItems) {
                    const flowerItemsCount = cartData.flowerItems?.reduce((total, item) => total + item.quantity, 0) || 0;
                    const addonItemsCount = cartData.addonItems?.reduce((total, item) => total + item.quantity, 0) || 0;
                    totalCount = flowerItemsCount + addonItemsCount;
                }

                setCartItemsCount(totalCount);
            } else if (response.status === 404) {
                setCartItemsCount(0);
            }
        } catch (error) {
            console.error('Error fetching cart count:', error);
            setCartItemsCount(0);
        }
    }, [apiUrl, token]);

    // Функция для выхода с очисткой состояния
    const logoutWithCleanup = useCallback(() => {
        resetAppState();
        logout();
    }, [resetAppState, logout]);

    const value = {
        favoritesCount,
        cartItemsCount,
        updateFavoritesCount,
        updateCartCount,
        setFavoritesCount,
        setCartItemsCount,
        resetAppState,
        logout: logoutWithCleanup // Переопределяем logout
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};