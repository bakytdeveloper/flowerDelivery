import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth должен использоваться внутри AuthProvider');
    }

    return context;
};

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [cartItems, setCartItems] = useState([]);
    const [user, setUser] = useState(null); // Добавляем состояние для user
    // eslint-disable-next-line
    const [favoritesCount, setFavoritesCount] = useState(0);
    // eslint-disable-next-line
    const [cartItemsCount, setCartItemsCount] = useState(0);

    // Функция для проверки валидности токена
    const validateToken = useCallback((token) => {
        if (!token) return false;
        try {
            const decoded = jwtDecode(token);
            // Проверяем expiration time если есть
            if (decoded.exp && Date.now() >= decoded.exp * 1000) {
                // console.log('Token expired');
                return false;
            }
            return true;
        } catch (error) {
            return false;
        }
    }, []);

    // В AuthContext.js обновляем функцию fetchUserInfo:
// Функция для получения информации о пользователе
    const fetchUserInfo = useCallback(async (token) => {
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
                setUser(adminUser);
                return adminUser;
            }
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                return userData;
            } else {
                console.error('Failed to fetch user info, status:', response.status);
                // Если endpoint не доступен, используем данные из токена
                const decoded = jwtDecode(token);
                const userFromToken = {
                    _id: decoded.userId || decoded._id,
                    email: decoded.email,
                    name: decoded.name,
                    role: decoded.role
                };
                setUser(userFromToken);
                return userFromToken;
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
            // В случае ошибки также используем данные из токена
            const decoded = jwtDecode(token);
            const userFromToken = {
                _id: decoded.userId || decoded._id,
                email: decoded.email,
                name: decoded.name,
                role: decoded.role
            };
            setUser(userFromToken);
            return userFromToken;
        }
    }, []);

    // Функция для очистки корзины
    const clearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    useEffect(() => {
        const storedToken = sessionStorage.getItem('token');
        const storedRole = sessionStorage.getItem('role');

        // console.log('AuthProvider mounted, storedToken:', !!storedToken, 'storedRole:', storedRole);

        if (storedToken && validateToken(storedToken)) {
            setToken(storedToken);
            setIsAuthenticated(true);
            setUserRole(storedRole);

            // Получаем информацию о пользователе
            fetchUserInfo(storedToken);

            // console.log('User authenticated on mount, isAuthenticated:', true);
        } else {
            // Удаляем невалидный токен
            if (storedToken) {
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('role');
                // console.log('Invalid token removed');
            }
            setIsAuthenticated(false);
            setUserRole(null);
            setToken(null);
            setUser(null);
            setCartItems([]);
        }

        setIsLoading(false);
    }, [validateToken, fetchUserInfo]);

    const login = useCallback(async (newToken, role) => {
        // console.log('Login called with token:', !!newToken, 'role:', role);

        if (validateToken(newToken)) {
            sessionStorage.setItem('token', newToken);
            sessionStorage.setItem('role', role);
            setToken(newToken);
            setIsAuthenticated(true);
            setUserRole(role);

            // Получаем информацию о пользователе после логина
            const userInfo = await fetchUserInfo(newToken);

            // console.log('Login successful, isAuthenticated set to true');
            return { success: true, user: userInfo };
        }
        // console.log('Login failed: invalid token');
        return { success: false, user: null };
    }, [validateToken, fetchUserInfo]);

    const logout = useCallback(() => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('status');
        setToken(null);
        setIsAuthenticated(false);
        setUserRole(null);
        setUser(null);
        setCartItems([]);
        // console.log('Logout successful, isAuthenticated set to false');
    }, []);

    const value = {
        isAuthenticated,
        userRole,
        token,
        user, // Добавляем user в контекст
        cartItems,
        setCartItems,
        login,
        logout,
        isLoading,
        clearCart,
        favoritesCount,
        cartItemsCount
    };

    // console.log('AuthProvider render, isAuthenticated:', isAuthenticated, 'userRole:', userRole, 'user:', user);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
