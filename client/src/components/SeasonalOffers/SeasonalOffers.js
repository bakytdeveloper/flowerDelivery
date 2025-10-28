import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './SeasonalOffers.css';

const SeasonalOffers = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const scrollContainerRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchBestSellingProducts();
    }, []);

    const fetchBestSellingProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/products/bestselling`);

            if (!response.ok) {
                throw new Error('Ошибка при загрузке хитов продаж');
            }

            let bestSellingProducts = await response.json();

            // Если нет проданных товаров, загружаем любые доступные
            if (!bestSellingProducts || bestSellingProducts.length === 0) {
                const fallbackResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/products/newest`);
                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    bestSellingProducts = fallbackData.products || [];
                }
            }

            setProducts(bestSellingProducts);
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
        const walk = (x - startX) * 2; // multiplier for faster scroll
        scrollContainerRef.current.scrollLeft = scrollLeftStart - walk;
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
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
                    <h2 className="season-title" style={{color:"white"}}>Хиты продаж</h2>
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
                    <h2 className="season-title" style={{color:"white"}}>Хиты продаж</h2>
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
                    <h2 className="season-title" style={{color:"white"}}>Сезонные предложения</h2>
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
                                            <span className="sold-badge">
                                                🔥 Продано: {product.soldCount}
                                            </span>
                                        )}
                                    </div>

                                    <div className="product-info">
                                        <h3 className="product-name">{product.name}</h3>
                                        <div className="product-meta">
                                            <span className="product-type">
                                                {product.type === 'single' ? 'Одиночный цветок' : 'Букет'}
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

                                        {product.averageRating > 0 && (
                                            <div className="product-rating">
                                                <span className="stars">
                                                    {'★'.repeat(Math.floor(product.averageRating))}
                                                    {'☆'.repeat(5 - Math.floor(product.averageRating))}
                                                </span>
                                                <span className="rating-value">
                                                    ({product.averageRating.toFixed(1)})
                                                </span>
                                            </div>
                                        )}
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