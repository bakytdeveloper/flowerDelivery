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
    const [user, setUser] = useState(null);

    // Функция для проверки валидности токена
    const validateToken = useCallback((token) => {
        if (!token) return false;
        try {
            const decoded = jwtDecode(token);
            if (decoded.exp && Date.now() >= decoded.exp * 1000) {
                return false;
            }
            return true;
        } catch (error) {
            return false;
        }
    }, []);

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

    // Функция для полной очистки состояния при выходе
    const clearAuthState = useCallback(() => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('status');
        sessionStorage.removeItem('guestSessionId'); // Очищаем guest session
        setToken(null);
        setIsAuthenticated(false);
        setUserRole(null);
        setUser(null);
        setCartItems([]);
    }, []);

    useEffect(() => {
        const storedToken = sessionStorage.getItem('token');
        const storedRole = sessionStorage.getItem('role');

        if (storedToken && validateToken(storedToken)) {
            setToken(storedToken);
            setIsAuthenticated(true);
            setUserRole(storedRole);
            fetchUserInfo(storedToken);
        } else {
            if (storedToken) {
                clearAuthState();
            }
        }

        setIsLoading(false);
    }, [validateToken, fetchUserInfo, clearAuthState]);

    const login = useCallback(async (newToken, role) => {
        if (validateToken(newToken)) {
            sessionStorage.setItem('token', newToken);
            sessionStorage.setItem('role', role);
            setToken(newToken);
            setIsAuthenticated(true);
            setUserRole(role);

            // Очищаем guest session при входе
            sessionStorage.removeItem('guestSessionId');

            const userInfo = await fetchUserInfo(newToken);
            return { success: true, user: userInfo };
        }
        return { success: false, user: null };
    }, [validateToken, fetchUserInfo]);

    const logout = useCallback(() => {
        clearAuthState();
    }, [clearAuthState]);

    const value = {
        isAuthenticated,
        userRole,
        token,
        user,
        cartItems,
        setCartItems,
        login,
        logout,
        isLoading,
        clearAuthState
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};