// src/components/Header/Header.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import './Header.css';
import { Link, useLocation } from 'react-router-dom';
import { FaRegHeart, FaShoppingCart, FaUser, FaSearch, FaPhone, FaBars, FaTimes } from "react-icons/fa";
import { useAuth } from '../../contexts/AuthContext';
import { safeJwtDecode, sanitizeInput } from '../../utils/securityUtils';
import { useNavigate } from 'react-router-dom';

const Header = ({
                    onSearch,
                    searchTerm,
                    setSearchTerm,
                    // cartItems
                }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const profileRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const location = useLocation();
    const [activePage, setActivePage] = useState('');
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5506';
    const [showNoFavoritesModal, setShowNoFavoritesModal] = useState(false);
    const [favoritesCount, setFavoritesCount] = useState(0);
    const [cartItemsCount, setCartItemsCount] = useState(0);
    const intervalRef = useRef(null);
    const cartIntervalRef = useRef(null);
    const navigate = useNavigate();
    const { isAuthenticated, userRole, token, logout, isLoading } = useAuth();

    // Режим работы магазина
    const workingHours = "Пн-Вс: 9:00 - 21:00";
    const phoneNumber = "+7 (705) 123-45-67";

    // Генерация или получение sessionId для гостей
    useEffect(() => {
        if (!isAuthenticated && !sessionStorage.getItem('guestSessionId')) {
            const guestSessionId = 'guest_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('guestSessionId', guestSessionId);
        }
    }, [isAuthenticated]);

    // Функция для получения количества товаров в корзине
    const fetchCartItemsCount = useCallback(async () => {
        try {
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
                const totalCount = cartData.items?.reduce((total, item) => total + item.quantity, 0) || 0;
                setCartItemsCount(totalCount);
            } else if (response.status === 404) {
                setCartItemsCount(0);
            }
        } catch (error) {
            console.error('Error fetching cart count:', error);
            setCartItemsCount(0);
        }
    }, [apiUrl, token]);

    // Функция для получения количества избранных товаров
    const fetchFavoritesCount = useCallback(async () => {
        if (!isAuthenticated || !token) {
            setFavoritesCount(0);
            return;
        }

        try {
            const decoded = safeJwtDecode(token);
            const userId = decoded?.userId;

            if (!userId) {
                console.error('Invalid token: userId not found');
                setFavoritesCount(0);
                return;
            }

            // Только для customers (админы не имеют избранного)
            if (userRole !== 'customer') {
                setFavoritesCount(0);
                return;
            }

            const response = await fetch(`${apiUrl}/api/users/${userId}/favorites`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const favorites = await response.json();
            setFavoritesCount(favorites.length || 0);
        } catch (error) {
            console.error('Error fetching favorites:', error);
            setFavoritesCount(0);
        }
    }, [token, apiUrl, isAuthenticated, userRole]);

    // Получаем количество избранных и корзины при изменении аутентификации
    useEffect(() => {
        if (isAuthenticated) {
            fetchFavoritesCount();
            fetchCartItemsCount();
        } else {
            setFavoritesCount(0);
            fetchCartItemsCount(); // Гости тоже имеют корзину
        }
    }, [isAuthenticated, fetchFavoritesCount, fetchCartItemsCount]);

    // Устанавливаем активную страницу
    useEffect(() => {
        const path = location.pathname;
        const activePages = {
            '/': 'home',
            '/catalog': 'catalog',
            '/about': 'about',
            '/promotions': 'promotions',
            '/payment': 'payment',
            '/cart': 'cart',
            '/favorites': 'favorites',
            '/login': 'login',
            '/profile': 'profile',
            '/admin': 'admin'
        };

        setActivePage(activePages[path] || '');
    }, [location.pathname]);

    // Закрытие dropdown при клике вне его
    useEffect(() => {
        function handleClickOutside(event) {
            if (profileRef.current && !profileRef.current?.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current?.contains(event.target) &&
                !event.target.closest('.mobile-menu-toggle')) {
                setIsMobileMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Закрытие мобильного меню при изменении маршрута
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // Перенаправление админа в админ-панель
    useEffect(() => {
        if (isAuthenticated && userRole === 'admin' && location.pathname !== '/admin') {
            navigate("/admin");
        }
    }, [isAuthenticated, userRole, navigate, location.pathname]);

    // Интервал для обновления счетчика корзины
    useEffect(() => {
        fetchCartItemsCount();

        if (cartIntervalRef.current) {
            clearInterval(cartIntervalRef.current);
        }

        cartIntervalRef.current = setInterval(fetchCartItemsCount, 5000);

        return () => {
            if (cartIntervalRef.current) {
                clearInterval(cartIntervalRef.current);
            }
        };
    }, [fetchCartItemsCount]);

    // Интервал для обновления избранного
    useEffect(() => {
        if (isAuthenticated && userRole === 'customer') {
            fetchFavoritesCount();

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            intervalRef.current = setInterval(fetchFavoritesCount, 5000);

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
        } else {
            setFavoritesCount(0);
        }
    }, [isAuthenticated, userRole, fetchFavoritesCount]);

    // Обработчики событий
    const handleSearchChange = (e) => {
        const sanitizedValue = sanitizeInput(e.target.value);
        setSearchTerm(sanitizedValue);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const sanitizedSearchTerm = sanitizeInput(searchTerm);
        onSearch(sanitizedSearchTerm);

        if (sanitizedSearchTerm.trim()) {
            navigate(`/catalog?search=${encodeURIComponent(sanitizedSearchTerm)}`);
        }
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        onSearch('');
    };

    const handleCartClick = () => {
        navigate("/cart");
    };

    const handleTitleClick = () => {
        setSearchTerm("");
        navigate("/");
    };

    const handleProfileClick = () => {
        setIsProfileOpen(!isProfileOpen);
    };

    const handleLoginClick = () => {
        if (isAuthenticated) {
            if (userRole === 'admin') {
                navigate("/admin");
            } else {
                navigate("/profile");
            }
        } else {
            navigate("/login");
        }
        setIsProfileOpen(false);
    };

    const handleLogoutClick = () => {
        logout();
        navigate("/");
        setIsProfileOpen(false);
    };

    const handlePhoneClick = () => {
        window.location.href = `tel:${phoneNumber.replace(/\D/g, '')}`;
    };

    const handleFavoritesClick = () => {
        if (favoritesCount > 0) {
            navigate('/favorites');
        } else {
            setShowNoFavoritesModal(true);
        }
    };

    const handleMobileMenuToggle = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleCloseModal = () => {
        setShowNoFavoritesModal(false);
    };

    const handleModalClick = (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            handleCloseModal();
        }
    };

    if (isLoading) {
        return <div className="header-loading">Загрузка...</div>;
    }

    return (
        <header className="header">
            {/* Верхняя панель с режимом работы и контактами */}
            <div className="header-top">
                <div className="container">
                    <div className="header-top-content">
                        <div className="working-hours">
                            <span>⏰ {workingHours}</span>
                        </div>
                        <div className="header-logo">
                            <div
                                className="logo"
                                onClick={handleTitleClick}
                                role="button"
                                tabIndex={0}
                                onKeyPress={(e) => e.key === 'Enter' && handleTitleClick()}
                            >
                                <h1 className="logo-text">FLOWER<span className="logo-accent">KZ</span></h1>
                            </div>
                        </div>
                        <div className="header-phone">
                            <button
                                className="phone-button"
                                onClick={handlePhoneClick}
                            >
                                <FaPhone className="phone-icon" />
                                <span>{phoneNumber}</span>
                            </button>
                        </div>
                        {/*/!* Кнопка бургер-меню для мобильных *!/*/}
                        {/*<button*/}
                        {/*    className="mobile-menu-toggle"*/}
                        {/*    onClick={handleMobileMenuToggle}*/}
                        {/*    aria-label="Открыть меню"*/}
                        {/*>*/}
                        {/*    {isMobileMenuOpen ? <FaTimes /> : <FaBars />}*/}
                        {/*</button>*/}
                    </div>
                </div>
            </div>

            {/* Основная шапка */}
            <div className="header-main">
                <div className="container">
                    <div className="header-content">

                        {/* Кнопка бургер-меню для мобильных */}
                        <button
                            className="mobile-menu-toggle"
                            onClick={handleMobileMenuToggle}
                            aria-label="Открыть меню"
                        >
                            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                        </button>

                        {/* Правая часть: поиск, избранное, профиль, корзина */}
                        <div className="header-actions">
                            {/* Поиск */}
                            <div className="search-container">
                                <form className="search-form" onSubmit={handleSearchSubmit}>
                                    <input
                                        type="text"
                                        placeholder="Поиск цветов..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        className="search-input"
                                        maxLength="100"
                                    />
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            className="clear-search"
                                            onClick={handleClearSearch}
                                        >
                                            ×
                                        </button>
                                    )}
                                    <button type="submit" className="search-button">
                                        <FaSearch className="search-icon" />
                                    </button>
                                </form>
                            </div>

                            {/* Избранное */}
                            <div
                                className="favorites-button"
                                onClick={handleFavoritesClick}
                                role="button"
                                tabIndex={0}
                                onKeyPress={(e) => e.key === 'Enter' && handleFavoritesClick()}
                            >
                                <FaRegHeart className={`favorites-icon ${favoritesCount > 0 ? 'has-favorites' : ''}`} />
                                {favoritesCount > 0 && (
                                    <span className="favorites-badge">{favoritesCount}</span>
                                )}
                                <span className="button-text">Избранное</span>
                            </div>

                            {/* Профиль */}
                            <div className="profile-container" ref={profileRef}>
                                <button
                                    className="profile-button"
                                    onClick={handleProfileClick}
                                >
                                    <FaUser className="profile-icon" />
                                    <span className="profile-text">
                                        {isAuthenticated ? 'Профиль' : 'Войти'}
                                    </span>
                                </button>

                                {isProfileOpen && (
                                    <div className="profile-dropdown">
                                        {isAuthenticated ? (
                                            <>
                                                <button
                                                    onClick={handleLoginClick}
                                                    className="dropdown-item"
                                                >
                                                    Мой профиль
                                                </button>
                                                {userRole === 'admin' && (
                                                    <Link
                                                        to="/admin"
                                                        className="dropdown-item"
                                                    >
                                                        Админ-панель
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={handleLogoutClick}
                                                    className="dropdown-item logout"
                                                >
                                                    Выйти
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={handleLoginClick}
                                                className="dropdown-item"
                                            >
                                                Войти / Регистрация
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Корзина */}
                            <div
                                className="cart-button"
                                onClick={handleCartClick}
                                role="button"
                                tabIndex={0}
                                onKeyPress={(e) => e.key === 'Enter' && handleCartClick()}
                            >
                                <FaShoppingCart className="cart-icon" />
                                {cartItemsCount > 0 && (
                                    <span className="cart-badge">{cartItemsCount}</span>
                                )}
                                <span className="button-text">Корзина</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Навигационная панель */}
            <nav className="header-nav" ref={mobileMenuRef}>
                <div className="container">
                    <div className={`nav-content ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                        <Link
                            to="/"
                            className={`nav-link ${activePage === 'home' ? 'active' : ''}`}
                        >
                            Главная
                        </Link>
                        <Link
                            to="/catalog"
                            className={`nav-link ${activePage === 'catalog' ? 'active' : ''}`}
                        >
                            Каталог
                        </Link>
                        <Link
                            to="/about"
                            className={`nav-link ${activePage === 'about' ? 'active' : ''}`}
                        >
                            О нас
                        </Link>
                        <Link
                            to="/promotions"
                            className={`nav-link ${activePage === 'promotions' ? 'active' : ''}`}
                        >
                            Акции
                        </Link>
                        <Link
                            to="/payment"
                            className={`nav-link ${activePage === 'payment' ? 'active' : ''}`}
                        >
                            Оплата
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Модальное окно для пустого избранного */}
            {showNoFavoritesModal && (
                <div className="modal-overlay" onClick={handleModalClick}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Информация</h2>
                            <button
                                className="modal-close"
                                onClick={handleCloseModal}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <h4>У вас нет избранных товаров.</h4>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="modal-button"
                                onClick={handleCloseModal}
                            >
                                ОК
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;