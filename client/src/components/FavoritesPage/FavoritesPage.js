// FavoritesPage.js - АЛЬТЕРНАТИВНАЯ УПРОЩЕННАЯ ВЕРСИЯ
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './FavoritesPage.css';
import {useCart} from "../../contexts/CartContext";

const FavoritesPage = () => {
    const [favoriteProducts, setFavoriteProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { isAuthenticated, token } = useAuth();
    const { addToCart } = useCart();

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        fetchFavorites();
    }, [isAuthenticated, navigate, token]);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/favorites`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке избранных товаров');
            }

            const favorites = await response.json();
            setFavoriteProducts(Array.isArray(favorites) ? favorites : []);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching favorites:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromFavorites = async (productId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/favorites/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Ошибка при удалении из избранного');
            }

            // ПРОСТОЙ ПОДХОД: После удаления заново загружаем весь список
            await fetchFavorites();

            toast.success('Товар удален из избранного');
        } catch (error) {
            console.error('Error removing from favorites:', error);
            toast.error('Ошибка при удалении из избранного');
        }
    };

    // Остальной код компонента без изменений...
    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
    };

    // Функция для добавления в корзину
    const handleAddToCart = async (e, product) => {
        e.stopPropagation(); // Останавливаем всплытие события

        const result = await addToCart(product, 1); // quantity по умолчанию 1
        if (result.success) {
            toast.success('Товар добавлен в корзину! 🛒', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } else {
            toast.error(result.error || 'Ошибка при добавлении в корзину', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'KZT',
            minimumFractionDigits: 0
        }).format(price);
    };

    // Остальная разметка без изменений...
    return (
        <div className="favorites-page">
            <div className="container">
                {/* Заголовок */}
                <div className="favorites-header">
                    <nav className="breadcrumb-nav breadcrumb-nav-favorites">
                        <button className="breadcrumb-back" onClick={() => navigate(-1)}>
                            ← Назад
                        </button>
                        <span className="breadcrumb-separator">/</span>
                        <button className="breadcrumb-link" onClick={() => navigate('/catalog')}>
                            Каталог
                        </button>
                    </nav>
                    <h1 className="favorites-title">Избранные товары</h1>
                    <div className="favorites-info">
                        <span className="favorites-count">
                            {favoriteProducts.length > 0
                                ? `У вас ${favoriteProducts.length} избранных товаров`
                                : 'У вас пока нет избранных товаров'
                            }
                        </span>
                    </div>
                </div>

                {/* Контент */}
                <div className="favorites-results">
                    <p className="results-count">
                        Найдено товаров: <strong>{favoriteProducts.length}</strong>
                    </p>

                    {favoriteProducts.length === 0 ? (
                        <div className="no-products">
                            <div className="empty-favorites-icon">💔</div>
                            <h3>Список избранного пуст</h3>
                            <p>Добавляйте товары в избранное, чтобы не потерять их</p>
                            <button className="btn btn-primary" onClick={() => navigate('/catalog')}>
                                Перейти в каталог
                            </button>
                        </div>
                    ) : (
                        <div className="products-grid">
                            {favoriteProducts.map((product) => (
                                <div
                                    key={product._id}
                                    className="product-card"
                                    onClick={() => handleProductClick(product._id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {/* Карточка товара */}
                                    <div className="product-image-container">
                                        <img
                                            src={product.images?.[0] || '/images/placeholder-flower.jpg'}
                                            alt={product.name}
                                            className="product-image"
                                        />
                                        {product.discountPercentage > 0 && (
                                            <span className="discount-badge">
                                                -{product.discountPercentage}%
                                            </span>
                                        )}
                                        {product.soldCount > 0 && (
                                            <span className="popular-badge">
                                                🔥 Популярный
                                            </span>
                                        )}
                                    </div>

                                    <div className="cart-product-info">
                                        <h3 className="product-name">{product.name}</h3>
                                        <p className="product-description">
                                            {product.description?.length > 20
                                                ? `${product.description.slice(0, 20)}...`
                                                : product.description
                                            }
                                        </p>

                                        <div className="product-meta">
                                            <span className={`product-type ${product.type}`}>
                                                {product.type === 'single' ? '💐 Одиночный' : '💮 Букет'}
                                            </span>
                                            <span className="product-occasion">
                                                {product.occasion}
                                            </span>
                                        </div>

                                        <div className="product-price">
                                            {product.originalPrice && product.originalPrice > product.price ? (
                                                <>
                                                    <span className="original-price">
                                                        {formatPrice(product.originalPrice)}
                                                    </span>
                                                    <span className="current-price">
                                                        {formatPrice(product.price)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="current-price">
                                                    {formatPrice(product.price)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="product-actions">
                                            <button
                                                className="btn-add-to-cart"
                                                onClick={(e) => handleAddToCart(e, product)}
                                            >
                                                В корзину
                                            </button>
                                            <button
                                                className="btn-remove-favorite"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveFromFavorites(product._id);
                                                }}
                                                title="Удалить из избранного"
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FavoritesPage;