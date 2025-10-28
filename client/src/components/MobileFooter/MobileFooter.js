import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaSearch, FaHeart, FaShoppingCart, FaUser } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import './MobileFooter.css';

const MobileFooter = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, userRole, favoritesCount, cartItemsCount } = useAuth();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const handleProfileClick = () => {
        if (isAuthenticated) {
            if (userRole === 'admin') {
                navigate("/admin");
            } else {
                navigate("/profile");
            }
        } else {
            navigate("/login");
        }
    };

    const handleFavoritesClick = () => {
        if (isAuthenticated && favoritesCount > 0) {
            navigate('/favorites');
        } else {
            navigate('/');
        }
    };

    const handleCartClick = () => {
        navigate("/cart");
    };

    const handleHomeClick = () => {
        navigate("/");
    };

    const handleCatalogClick = () => {
        navigate("/catalog");
    };

    return (
        <footer className="mobile-footer">
            <div className="mobile-footer-content">
                {/* Главная */}
                <button
                    className={`footer-button ${isActive('/') ? 'active' : ''}`}
                    onClick={handleHomeClick}
                >
                    <FaHome className="footer-icon" />
                    <span className="footer-label">Главная</span>
                </button>

                {/* Каталог */}
                <button
                    className={`footer-button ${isActive('/catalog') ? 'active' : ''}`}
                    onClick={handleCatalogClick}
                >
                    <FaSearch className="footer-icon" />
                    <span className="footer-label">Каталог</span>
                </button>

                {/* Корзина */}
                <button
                    className={`footer-button ${isActive('/cart') ? 'active' : ''}`}
                    onClick={handleCartClick}
                >
                    <div className="footer-badge-container">
                        <FaShoppingCart className="footer-icon" />
                        {cartItemsCount > 0 && (
                            <span className="footer-badge">{cartItemsCount}</span>
                        )}
                    </div>
                    <span className="footer-label">Корзина</span>
                </button>

                {/* Избранное */}
                <button
                    className={`footer-button ${isActive('/favorites') ? 'active' : ''}`}
                    onClick={handleFavoritesClick}
                >
                    <div className="footer-badge-container">
                        <FaHeart className="footer-icon" />
                        {favoritesCount > 0 && (
                            <span className="footer-badge">{favoritesCount}</span>
                        )}
                    </div>
                    <span className="footer-label">Избранное</span>
                </button>

                {/* Войти/Профиль */}
                <button
                    className={`footer-button ${isActive('/login') || isActive('/profile') || isActive('/admin') ? 'active' : ''}`}
                    onClick={handleProfileClick}
                >
                    <FaUser className="footer-icon" />
                    <span className="footer-label">
                        {isAuthenticated ? 'Профиль' : 'Войти'}
                    </span>
                </button>
            </div>
        </footer>
    );
};

export default MobileFooter;