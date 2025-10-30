import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../../hooks/useFavorites';
import './SeasonalOffers.css';

const SeasonalOffers = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const scrollContainerRef = useRef(null);
    const navigate = useNavigate();
    const { toggleFavorite, isFavorite } = useFavorites();

    useEffect(() => {
        fetchBestSellingProducts();
    }, []);

    const fetchBestSellingProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/products/newest`);

            if (!response.ok) {
                throw new Error('Ошибка при загрузке сезонных предложений');
            }

            const seasonalProducts = await response.json();
            setProducts(seasonalProducts || []);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching best selling products:', err);
        } finally {
            setLoading(false);
        }
    };

    // Функции для горизонтального скролла
    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({
                left: -300,
                behavior: 'smooth'
            });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({
                left: 300,
                behavior: 'smooth'
            });
        }
    };

    // Обработчики для touch events
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftStart, setScrollLeftStart] = useState(0);

    const handleTouchStart = (e) => {
        setIsDragging(true);
        setStartX(e.touches[0].pageX);
        setScrollLeftStart(scrollContainerRef.current.scrollLeft);
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.touches[0].pageX;
        const walk = (x - startX) * 2;
        scrollContainerRef.current.scrollLeft = scrollLeftStart - walk;
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
    };

    // Функция для добавления в корзину
    const handleAddToCart = (e, product) => {
        e.stopPropagation();
        console.log('Добавлено в корзину:', product);
        // TODO: Добавить логику добавления в корзину
    };

    // Функция для добавления/удаления из избранного
    const handleToggleFavorite = async (e, product) => {
        e.stopPropagation();
        const success = await toggleFavorite(product._id, isFavorite(product._id));
        if (success) {
            // Можно обновить локальное состояние если нужно
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'KZT',
            minimumFractionDigits: 0
        }).format(price);
    };

    if (loading) {
        return (
            <section className="season-section">
                <div className="container">
                    <h2 className="season-title">Сезонные предложения</h2>
                    <div className="loading-products">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Загрузка...</span>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="season-section">
                <div className="container">
                    <h2 className="season-title">Сезонные предложения</h2>
                    <div className="error-message">
                        <p>Не удалось загрузить хиты продаж</p>
                        <button
                            className="btn btn-primary"
                            onClick={fetchBestSellingProducts}
                        >
                            Попробовать снова
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    if (!products || products.length === 0) {
        return null;
    }

    return (
        <section className="season-section">
            <div className="container">
                <div className="season-header">
                    <h2 className="season-title">Сезонные предложения</h2>
                </div>

                <div className="season-container">
                    {/* Кнопка прокрутки влево для десктопа */}
                    <button
                        className="scroll-btn scroll-btn-left d-none d-md-flex"
                        onClick={scrollLeft}
                        aria-label="Прокрутить влево"
                    >
                        ‹
                    </button>

                    {/* Контейнер для карточек с горизонтальным скроллом */}
                    <div
                        className="season-scroll-container"
                        ref={scrollContainerRef}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="season-products-row">
                            {products.map((product) => (
                                <div
                                    key={product._id}
                                    className="season-product-card"
                                    onClick={() => handleProductClick(product._id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="product-image-container">
                                        <img
                                            src={product.images?.[0] || '/images/placeholder-flower.jpg'}
                                            alt={product.name}
                                            className="product-image"
                                            loading="lazy"
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
                                                className={`btn-favorite ${isFavorite(product._id) ? 'favorited' : ''}`}
                                                onClick={(e) => handleToggleFavorite(e, product)}
                                            >
                                                {isFavorite(product._id) ? '❤️' : '♡'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Кнопка прокрутки вправо для десктопа */}
                    <button
                        className="scroll-btn scroll-btn-right d-none d-md-flex"
                        onClick={scrollRight}
                        aria-label="Прокрутить вправо"
                    >
                        ›
                    </button>
                </div>

                {/* Индикаторы прокрутки для мобильных */}
                <div className="scroll-indicators d-md-none">
                    <button
                        className="scroll-indicator-btn"
                        onClick={scrollLeft}
                        aria-label="Прокрутить влево"
                    >
                        ‹
                    </button>
                    <span className="scroll-hint">Проведите для прокрутки</span>
                    <button
                        className="scroll-indicator-btn"
                        onClick={scrollRight}
                        aria-label="Прокрутить вправо"
                    >
                        ›
                    </button>
                </div>
            </div>
        </section>
    );
};

export default SeasonalOffers;