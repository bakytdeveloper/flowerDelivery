import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState({
        items: [],
        total: 0,
        totalItems: 0
    });
    const [loading, setLoading] = useState(false);
    const { isAuthenticated, token } = useAuth();
    const apiUrl = process.env.REACT_APP_API_URL;

    // Загрузка корзины при монтировании
    useEffect(() => {
        fetchCart();
    }, [isAuthenticated, token]);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const headers = {};

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Добавляем sessionId для гостей
            const sessionId = sessionStorage.getItem('guestSessionId');
            if (!token && sessionId) {
                headers['X-Session-Id'] = sessionId;
            }

            const response = await fetch(`${apiUrl}/api/cart`, {
                headers: headers
            });

            if (response.ok) {
                const cartData = await response.json();
                setCart(cartData);
            } else if (response.status === 404) {
                setCart({ items: [], total: 0, totalItems: 0 });
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
        }
    };

    // Добавление товара в корзину
// contexts/CartContext.js - обновленная функция addToCart
    const addToCart = async (product, quantity = 1, options = {}) => {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const sessionId = sessionStorage.getItem('guestSessionId');
            if (!token && sessionId) {
                headers['X-Session-Id'] = sessionId;
            }

            const cartItem = {
                productId: product._id,
                quantity,
                flowerType: options.flowerType || product.type,
                flowerColor: options.flowerColor || (product.flowerColors?.[0] || null),
                wrapper: options.wrapper || null,
                addons: options.addons || []
            };

            const response = await fetch(`${apiUrl}/api/cart/add`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(cartItem)
            });

            if (response.ok) {
                const updatedCart = await response.json();
                setCart(updatedCart);
                return { success: true, cart: updatedCart };
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.message };
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            return { success: false, error: 'Ошибка при добавлении в корзину' };
        }
    };
    // Обновление количества товара
    const updateCartItem = async (itemId, quantity) => {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const sessionId = sessionStorage.getItem('guestSessionId');
            if (!token && sessionId) {
                headers['X-Session-Id'] = sessionId;
            }

            const response = await fetch(`${apiUrl}/api/cart/update/${itemId}`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify({ quantity })
            });

            if (response.ok) {
                const updatedCart = await response.json();
                setCart(updatedCart);
                return { success: true, cart: updatedCart };
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.message };
            }
        } catch (error) {
            console.error('Error updating cart item:', error);
            return { success: false, error: 'Ошибка при обновлении корзины' };
        }
    };

    // Удаление товара из корзины
    const removeFromCart = async (itemId) => {
        try {
            const headers = {};

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const sessionId = sessionStorage.getItem('guestSessionId');
            if (!token && sessionId) {
                headers['X-Session-Id'] = sessionId;
            }

            const response = await fetch(`${apiUrl}/api/cart/remove/${itemId}`, {
                method: 'DELETE',
                headers: headers
            });

            if (response.ok) {
                const updatedCart = await response.json();
                setCart(updatedCart);
                return { success: true, cart: updatedCart };
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.message };
            }
        } catch (error) {
            console.error('Error removing from cart:', error);
            return { success: false, error: 'Ошибка при удалении из корзины' };
        }
    };

    // Очистка корзины
    const clearCart = async () => {
        try {
            const headers = {};

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const sessionId = sessionStorage.getItem('guestSessionId');
            if (!token && sessionId) {
                headers['X-Session-Id'] = sessionId;
            }

            const response = await fetch(`${apiUrl}/api/cart/clear`, {
                method: 'DELETE',
                headers: headers
            });

            if (response.ok) {
                const updatedCart = await response.json();
                setCart(updatedCart);
                return { success: true, cart: updatedCart };
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.message };
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
            return { success: false, error: 'Ошибка при очистке корзины' };
        }
    };

    const value = {
        cart,
        loading,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};