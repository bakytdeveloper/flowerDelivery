import React, { useEffect, useRef, useState, useCallback } from 'react';
import './Header.css';
import { Link, useLocation } from 'react-router-dom';
import { FaRegHeart, FaShoppingCart, FaUser, FaSearch, FaPhone, FaBars, FaTimes } from "react-icons/fa";
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext'; // ДОБАВИТЬ

// eslint-disable-next-line
import { sanitizeInput } from '../../utils/securityUtils';
import { useNavigate } from 'react-router-dom';
import CatalogModal from "../CatalogModal/CatalogModal";
import { toast } from 'react-toastify';

const Header = ({
                    onSearch,
                    searchTerm,
                    setSearchTerm,
                }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const profileRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const location = useLocation();
    const [activePage, setActivePage] = useState('');
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5506';
    const [showNoFavoritesModal, setShowNoFavoritesModal] = useState(false);
    // const [favoritesCount, setFavoritesCount] = useState(0);
    // const [cartItemsCount, setCartItemsCount] = useState(0);
    const navigate = useNavigate();
    const { isAuthenticated, userRole, token, logout, isLoading } = useAuth();

    // ИСПОЛЬЗУЕМ ОБЩЕЕ СОСТОЯНИЕ
    const { favoritesCount, cartItemsCount, updateFavoritesCount, updateCartCount } = useApp();

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

    // Обновляем счетчики при изменении аутентификации или location
    useEffect(() => {
        updateCartCount();
        if (isAuthenticated && userRole === 'customer') {
            updateFavoritesCount();
        }
    }, [isAuthenticated, userRole, location.pathname, updateCartCount, updateFavoritesCount]);

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
        // Разрешаем админу доступ к определенным страницам
        const allowedPaths = ['/admin', '/catalog', '/product', '/'];
        const currentPath = location.pathname;

        if (isAuthenticated && userRole === 'admin' &&
            !allowedPaths.some(path => currentPath.startsWith(path)) &&
            currentPath !== '/admin') {
            navigate("/admin");
        }
    }, [isAuthenticated, userRole, navigate, location.pathname]);

    // УДАЛЕНЫ ИНТЕРВАЛЫ - они вызывали бесконечные перерисовки

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

    // ИСПРАВЛЕННАЯ ФУНКЦИЯ: Клик по кнопке профиля
    const handleProfileButtonClick = () => {
        if (isAuthenticated) {
            setIsProfileOpen(!isProfileOpen);
        } else {
            navigate("/login");
        }
    };

    // Функции для dropdown меню
    const handleProfileClick = () => {
        if (userRole === 'admin') {
            navigate("/admin");
        } else {
            navigate("/profile");
        }
        setIsProfileOpen(false);
    };

    const handleLogoutClick = () => {
        logout();
        toast.success('Вы успешно вышли из системы');
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

    const handleCatalogClick = () => {
        setIsCatalogOpen(true);
    };

    const handleCloseCatalog = () => {
        setIsCatalogOpen(false);
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
                        <div className="header-logo-home">
                            <div
                                className="logo-home"
                                onClick={handleTitleClick}
                                role="button"
                                tabIndex={0}
                                onKeyPress={(e) => e.key === 'Enter' && handleTitleClick()}
                            >
                                <h1 className="logo-text-home">FLOWER<span className="logo-accent-home">KZ</span></h1>
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
                                    <span className="favorites-badge-count">{favoritesCount}</span>
                                )}
                                <span className="button-text">Избранное</span>
                            </div>

                            {/* Профиль */}
                            <div className="profile-container" ref={profileRef}>
                                <button
                                    className="profile-button"
                                    onClick={handleProfileButtonClick}
                                >
                                    <FaUser className="profile-icon" />
                                    <span className="profile-text">
                                        {isAuthenticated ? 'Профиль' : 'Войти'}
                                    </span>
                                </button>

                                {isProfileOpen && isAuthenticated && (
                                    <div className="profile-dropdown">
                                        <button
                                            onClick={handleProfileClick}
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
                                    </div>
                                )}
                            </div>

                            {/* Корзина - теперь используем cartItemsCount из контекста */}
                            <div
                                className="cart-button"
                                onClick={handleCartClick}
                                role="button"
                                tabIndex={0}
                                onKeyPress={(e) => e.key === 'Enter' && handleCartClick()}
                            >
                                <FaShoppingCart className="cart-icon" />
                                {cartItemsCount > 0 && (
                                    <span className="cart-badge">{cartItemsCount > 99 ? '99+' : cartItemsCount}</span>
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
                            className={`none-mobile nav-link ${activePage === 'home' ? 'active' : ''}`}
                        >
                            Главная
                        </Link>
                        <button
                            className="nav-link catalog-button"
                            onClick={handleCatalogClick}
                        >
                            Каталог
                        </button>
                        <Link
                            to="/about"
                            className={`nav-link ${activePage === 'about' ? 'active' : ''}`}
                        >
                            О нас
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

            {/* Модальное окно каталога */}
            <CatalogModal
                isOpen={isCatalogOpen}
                onClose={handleCloseCatalog}
            />

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