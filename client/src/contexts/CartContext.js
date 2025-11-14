// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { useAuth } from './AuthContext';
// import { useApp } from './AppContext'; // ДОБАВИТЬ
//
// const CartContext = createContext();
//
// export const useCart = () => {
//     const context = useContext(CartContext);
//     if (!context) {
//         throw new Error('useCart must be used within a CartProvider');
//     }
//     return context;
// };
//
//
// export const CartProvider = ({ children }) => {
//     const [cart, setCart] = useState({
//         flowerItems: [],
//         addonItems: [],
//         total: 0,
//         totalItems: 0
//     });
//     const [loading, setLoading] = useState(false);
//     const { isAuthenticated, token } = useAuth();
//     const { updateCartCount } = useApp(); // ДОБАВИТЬ
//     const apiUrl = process.env.REACT_APP_API_URL;
//
//     // Генерация sessionId для гостей
//     const getOrCreateSessionId = () => {
//         let sessionId = sessionStorage.getItem('guestSessionId');
//         if (!sessionId) {
//             sessionId = 'guest_' + Math.random().toString(36).substr(2, 9);
//             sessionStorage.setItem('guestSessionId', sessionId);
//         }
//         return sessionId;
//     };
//
//     // Загрузка корзины при монтировании
//     useEffect(() => {
//         fetchCart();
//         // eslint-disable-next-line
//     }, [isAuthenticated, token]);
//
//     const fetchCart = async () => {
//         try {
//             setLoading(true);
//             const headers = {};
//
//             if (token) {
//                 headers['Authorization'] = `Bearer ${token}`;
//             } else {
//                 const sessionId = getOrCreateSessionId();
//                 headers['X-Session-Id'] = sessionId;
//             }
//
//             const response = await fetch(`${apiUrl}/api/cart`, {
//                 headers: headers
//             });
//
//             if (response.ok) {
//                 const cartData = await response.json();
//                 setCart(cartData.cart || cartData);
//             } else if (response.status === 404) {
//                 setCart({ flowerItems: [], addonItems: [], total: 0, totalItems: 0 });
//             }
//         } catch (error) {
//             console.error('Error fetching cart:', error);
//         } finally {
//             setLoading(false);
//         }
//     };
//
//
//     // Добавление цветов в корзину
//     const addFlowerToCart = async (product, quantity = 1, options = {}) => {
//         try {
//             const headers = {
//                 'Content-Type': 'application/json'
//             };
//
//             if (token) {
//                 headers['Authorization'] = `Bearer ${token}`;
//             } else {
//                 const sessionId = getOrCreateSessionId();
//                 headers['X-Session-Id'] = sessionId;
//             }
//
//             const cartItem = {
//                 productId: product._id,
//                 quantity,
//                 flowerType: options.flowerType || product.type,
//                 flowerColor: options.flowerColor || (product.flowerColors?.[0] || null),
//                 wrapper: options.wrapper || null
//             };
//
//             const response = await fetch(`${apiUrl}/api/cart/flowers`, {
//                 method: 'POST',
//                 headers: headers,
//                 body: JSON.stringify(cartItem)
//             });
//
//             if (response.ok) {
//                 const result = await response.json();
//                 setCart(result.cart);
//
//                 // ОБНОВЛЯЕМ СЧЕТЧИК В ШАПКЕ
//                 updateCartCount();
//
//                 return { success: true, cart: result.cart };
//             } else {
//                 const errorData = await response.json();
//                 return { success: false, error: errorData.message };
//             }
//         } catch (error) {
//             console.error('Error adding flower to cart:', error);
//             return { success: false, error: 'Ошибка при добавлении в корзину' };
//         }
//     };
//
//
//     // Добавление дополнительного товара в корзину
//     const addAddonToCart = async (addon, quantity = 1) => {
//         try {
//             const headers = {
//                 'Content-Type': 'application/json'
//             };
//
//             if (token) {
//                 headers['Authorization'] = `Bearer ${token}`;
//             } else {
//                 const sessionId = getOrCreateSessionId();
//                 headers['X-Session-Id'] = sessionId;
//             }
//
//             const cartItem = {
//                 addonId: addon._id,
//                 quantity
//             };
//
//             const response = await fetch(`${apiUrl}/api/cart/addons`, {
//                 method: 'POST',
//                 headers: headers,
//                 body: JSON.stringify(cartItem)
//             });
//
//             if (response.ok) {
//                 const result = await response.json();
//                 setCart(result.cart);
//                 return { success: true, cart: result.cart };
//             } else {
//                 const errorData = await response.json();
//                 return { success: false, error: errorData.message };
//             }
//         } catch (error) {
//             console.error('Error adding addon to cart:', error);
//             return { success: false, error: 'Ошибка при добавлении в корзину' };
//         }
//     };
//
//
//     // Обновление количества товара в корзине
//     // Обновление количества товара в корзине
//     const updateCartItem = async (itemId, quantity, itemType) => {
//         try {
//             const headers = {
//                 'Content-Type': 'application/json'
//             };
//
//             if (token) {
//                 headers['Authorization'] = `Bearer ${token}`;
//             } else {
//                 const sessionId = getOrCreateSessionId();
//                 headers['X-Session-Id'] = sessionId;
//             }
//
//             const response = await fetch(`${apiUrl}/api/cart/items`, {
//                 method: 'PUT',
//                 headers: headers,
//                 body: JSON.stringify({ itemId, quantity, itemType })
//             });
//
//             if (response.ok) {
//                 const result = await response.json();
//                 setCart(result.cart);
//                 return { success: true, cart: result.cart };
//             } else {
//                 const errorData = await response.json();
//                 return { success: false, error: errorData.message };
//             }
//         } catch (error) {
//             console.error('Error updating cart item:', error);
//             return { success: false, error: 'Ошибка при обновлении корзины' };
//         }
//     };
//
//
// // Добавляем новую функцию для обновления обертки
// // В CartContext.js добавляем новую функцию
//     const updateWrapper = async (itemId, wrapper) => {
//         try {
//             const headers = {
//                 'Content-Type': 'application/json'
//             };
//
//             if (token) {
//                 headers['Authorization'] = `Bearer ${token}`;
//             } else {
//                 const sessionId = getOrCreateSessionId();
//                 headers['X-Session-Id'] = sessionId;
//             }
//
//             const response = await fetch(`${apiUrl}/api/cart/wrapper`, {
//                 method: 'PUT',
//                 headers: headers,
//                 body: JSON.stringify({ itemId, wrapper })
//             });
//
//             if (response.ok) {
//                 const result = await response.json();
//                 setCart(result.cart);
//                 return { success: true, cart: result.cart };
//             } else {
//                 const errorData = await response.json();
//                 return { success: false, error: errorData.message };
//             }
//         } catch (error) {
//             console.error('Error updating wrapper:', error);
//             return { success: false, error: 'Ошибка при обновлении обертки' };
//         }
//     };
//
//
//     // Удаление товара из корзины
//     const removeFromCart = async (itemId, itemType) => {
//         try {
//             const headers = {
//                 'Content-Type': 'application/json'
//             };
//
//             if (token) {
//                 headers['Authorization'] = `Bearer ${token}`;
//             } else {
//                 const sessionId = getOrCreateSessionId();
//                 headers['X-Session-Id'] = sessionId;
//             }
//
//             const response = await fetch(`${apiUrl}/api/cart/items`, {
//                 method: 'DELETE',
//                 headers: headers,
//                 body: JSON.stringify({ itemId, itemType })
//             });
//
//             if (response.ok) {
//                 const result = await response.json();
//                 setCart(result.cart);
//
//                 // ОБНОВЛЯЕМ СЧЕТЧИК В ШАПКЕ
//                 updateCartCount();
//
//                 return { success: true, cart: result.cart };
//             } else {
//                 const errorData = await response.json();
//                 return { success: false, error: errorData.message };
//             }
//         } catch (error) {
//             console.error('Error removing from cart:', error);
//             return { success: false, error: 'Ошибка при удалении из корзины' };
//         }
//     };
//
//
//     // Очистка корзины
//     const clearCart = async () => {
//         try {
//             const headers = {};
//
//             if (token) {
//                 headers['Authorization'] = `Bearer ${token}`;
//             } else {
//                 const sessionId = getOrCreateSessionId();
//                 headers['X-Session-Id'] = sessionId;
//             }
//
//             const response = await fetch(`${apiUrl}/api/cart/clear`, {
//                 method: 'DELETE',
//                 headers: headers
//             });
//
//             if (response.ok) {
//                 const result = await response.json();
//                 setCart(result.cart);
//                 return { success: true, cart: result.cart };
//             } else {
//                 const errorData = await response.json();
//                 return { success: false, error: errorData.message };
//             }
//         } catch (error) {
//             console.error('Error clearing cart:', error);
//             return { success: false, error: 'Ошибка при очистке корзины' };
//         }
//     };
//
//     // Совместимость со старым кодом (будет удалено после обновления всех компонентов)
//     const addToCart = async (product, quantity = 1, options = {}) => {
//         return await addFlowerToCart(product, quantity, options);
//     };
//
//     const value = {
//         cart,
//         loading,
//         addToCart, // для обратной совместимости
//         addFlowerToCart,
//         addAddonToCart,
//         updateCartItem,
//         removeFromCart,
//         clearCart,
//         updateWrapper, // Новая функция
//         refreshCart: fetchCart
//     };
//
//     return (
//         <CartContext.Provider value={value}>
//             {children}
//         </CartContext.Provider>
//     );
// };

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';

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
        flowerItems: [],
        addonItems: [],
        total: 0,
        totalItems: 0
    });
    const [loading, setLoading] = useState(false);
    const { isAuthenticated, token } = useAuth();
    const { updateCartCount } = useApp();
    const apiUrl = process.env.REACT_APP_API_URL;

    // Генерация sessionId для гостей
    const getOrCreateSessionId = () => {
        let sessionId = sessionStorage.getItem('guestSessionId');
        if (!sessionId) {
            sessionId = 'guest_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('guestSessionId', sessionId);
        }
        return sessionId;
    };

    // Загрузка корзины при монтировании
    useEffect(() => {
        fetchCart();
        // eslint-disable-next-line
    }, [isAuthenticated, token]);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const headers = {};

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            } else {
                const sessionId = getOrCreateSessionId();
                headers['X-Session-Id'] = sessionId;
            }

            const response = await fetch(`${apiUrl}/api/cart`, {
                headers: headers
            });

            if (response.ok) {
                const cartData = await response.json();
                setCart(cartData.cart || cartData);
                // Обновляем счетчик в шапке
                updateCartCount();
            } else if (response.status === 404) {
                setCart({ flowerItems: [], addonItems: [], total: 0, totalItems: 0 });
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
        }
    };

    // ОБНОВЛЕННАЯ ФУНКЦИЯ: Добавление цветов в корзину с поддержкой цветов и длин стеблей
    const addFlowerToCart = async (productData) => {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            } else {
                const sessionId = getOrCreateSessionId();
                headers['X-Session-Id'] = sessionId;
            }

            const response = await fetch(`${apiUrl}/api/cart/add-flower`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(productData)
            });

            if (response.ok) {
                const result = await response.json();
                setCart(result.cart);
                // ОБНОВЛЯЕМ СЧЕТЧИК В ШАПКЕ
                updateCartCount();
                return { success: true, cart: result.cart };
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.message };
            }
        } catch (error) {
            console.error('Error adding flower to cart:', error);
            return { success: false, error: 'Ошибка при добавлении в корзину' };
        }
    };

    // ФУНКЦИЯ ДЛЯ СТАРОГО КОДА (обратная совместимость)
    const addFlowerToCartLegacy = async (product, quantity = 1, options = {}) => {
        const productData = {
            productId: product._id,
            quantity,
            flowerType: options.flowerType || product.type,
            selectedColor: options.selectedColor || null,
            selectedStemLength: options.selectedStemLength || null,
            wrapper: options.wrapper || null
        };

        return await addFlowerToCart(productData);
    };

    // Добавление дополнительного товара в корзину
    const addAddonToCart = async (addon, quantity = 1) => {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            } else {
                const sessionId = getOrCreateSessionId();
                headers['X-Session-Id'] = sessionId;
            }

            const cartItem = {
                addonId: addon._id,
                quantity
            };

            const response = await fetch(`${apiUrl}/api/cart/addons`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(cartItem)
            });

            if (response.ok) {
                const result = await response.json();
                setCart(result.cart);
                // ОБНОВЛЯЕМ СЧЕТЧИК В ШАПКЕ
                updateCartCount();
                return { success: true, cart: result.cart };
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.message };
            }
        } catch (error) {
            console.error('Error adding addon to cart:', error);
            return { success: false, error: 'Ошибка при добавлении в корзину' };
        }
    };

    // Обновление количества товара в корзине
    const updateCartItem = async (itemId, quantity, itemType) => {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            } else {
                const sessionId = getOrCreateSessionId();
                headers['X-Session-Id'] = sessionId;
            }

            const response = await fetch(`${apiUrl}/api/cart/items`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify({ itemId, quantity, itemType })
            });

            if (response.ok) {
                const result = await response.json();
                setCart(result.cart);
                // ОБНОВЛЯЕМ СЧЕТЧИК В ШАПКЕ
                updateCartCount();
                return { success: true, cart: result.cart };
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.message };
            }
        } catch (error) {
            console.error('Error updating cart item:', error);
            return { success: false, error: 'Ошибка при обновлении корзины' };
        }
    };

    // Функция для обновления обертки
    const updateWrapper = async (itemId, wrapper) => {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            } else {
                const sessionId = getOrCreateSessionId();
                headers['X-Session-Id'] = sessionId;
            }

            const response = await fetch(`${apiUrl}/api/cart/wrapper`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify({ itemId, wrapper })
            });

            if (response.ok) {
                const result = await response.json();
                setCart(result.cart);
                return { success: true, cart: result.cart };
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.message };
            }
        } catch (error) {
            console.error('Error updating wrapper:', error);
            return { success: false, error: 'Ошибка при обновлении обертки' };
        }
    };

    // Удаление товара из корзины
    const removeFromCart = async (itemId, itemType) => {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            } else {
                const sessionId = getOrCreateSessionId();
                headers['X-Session-Id'] = sessionId;
            }

            const response = await fetch(`${apiUrl}/api/cart/items`, {
                method: 'DELETE',
                headers: headers,
                body: JSON.stringify({ itemId, itemType })
            });

            if (response.ok) {
                const result = await response.json();
                setCart(result.cart);
                // ОБНОВЛЯЕМ СЧЕТЧИК В ШАПКЕ
                updateCartCount();
                return { success: true, cart: result.cart };
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
            } else {
                const sessionId = getOrCreateSessionId();
                headers['X-Session-Id'] = sessionId;
            }

            const response = await fetch(`${apiUrl}/api/cart/clear`, {
                method: 'DELETE',
                headers: headers
            });

            if (response.ok) {
                const result = await response.json();
                setCart(result.cart);
                // ОБНОВЛЯЕМ СЧЕТЧИК В ШАПКЕ
                updateCartCount();
                return { success: true, cart: result.cart };
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.message };
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
            return { success: false, error: 'Ошибка при очистке корзины' };
        }
    };

    // Вспомогательная функция для получения информации о товаре в корзине
    const getCartItemInfo = (item) => {
        if (item.itemType === 'flower') {
            return {
                id: item._id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
                type: 'flower',
                selectedColor: item.selectedColor,
                selectedStemLength: item.selectedStemLength,
                flowerType: item.flowerType,
                wrapper: item.wrapper,
                itemTotal: item.itemTotal
            };
        } else if (item.itemType === 'addon') {
            return {
                id: item._id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image,
                type: 'addon',
                addonType: item.type,
                itemTotal: item.itemTotal
            };
        }
        return null;
    };

    // Совместимость со старым кодом
    const addToCart = async (product, quantity = 1, options = {}) => {
        return await addFlowerToCartLegacy(product, quantity, options);
    };

    const value = {
        cart,
        loading,
        // Основные функции
        addFlowerToCart, // Новая функция с поддержкой цветов и длин
        addAddonToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        updateWrapper,
        refreshCart: fetchCart,
        getCartItemInfo,

        // Для обратной совместимости
        addToCart,
        addFlowerToCartLegacy
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};