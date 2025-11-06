import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../../hooks/useFavorites';
import './HitsSection.css';
import {useCart} from "../../contexts/CartContext";
import {toast} from "react-toastify";

const HitsSection = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const scrollContainerRef = useRef(null);
    const navigate = useNavigate();
    const { toggleFavorite, isFavorite, fetchFavorites } = useFavorites();
    const { addToCart } = useCart();

    useEffect(() => {
        fetchBestSellingProducts();
    }, []);

    // Загружаем избранные товары при монтировании
    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);


    const fetchBestSellingProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/products/bestselling`);

            if (!response.ok) {
                throw new Error('Ошибка при загрузке хитов продаж');
            }

            let bestSellingProducts = await response.json();

            // Убираем fallback логику, чтобы не было дублирования
            setProducts(bestSellingProducts || []);
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

    // Функция для добавления/удаления из избранного
    const handleToggleFavorite = async (e, product) => {
        e.stopPropagation();
        const success = await toggleFavorite(product._id, isFavorite(product._id));
        if (success) {
            // Обновляем локальное состояние после успешного действия
            await fetchFavorites();
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
                    <h2 className="season-title">Хиты продаж</h2>
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
                    <h2 className="season-title">Хиты продаж</h2>
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

    // ВАЖНО: Добавляем проверку на пустой массив
    if (!products || products.length === 0) {
        return null; // Секция скроется если нет товаров
    }


    return (
        <section className="season-section">
            <div className="container">
                <div className="season-header">
                    <h2 className="season-title">Хиты продаж</h2>
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
                                    className="season-product-card season-product-card-home"
                                    onClick={() => handleProductClick(product._id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="product-image-container-catalog">
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
                                                <span className="popular-badge-fire">🔥</span> Популярный
                                            </span>
                                        )}
                                    </div>

                                    <div className="cart-product-info-catalog">
                                        <h3 className="product-name-catalog">{product.name}</h3>
                                        <p className="product-description-catalog">
                                            {product.description?.length > 20
                                                ? `${product.description.slice(0, 20)}...`
                                                : product.description
                                            }
                                        </p>

                                        <div className="product-meta-catalog">
                                            <span className={`product-type-catalog ${product.type}`}>
                                                {product.type === 'single' ? '💐 Одиночный' : '💮 Букет'}
                                            </span>
                                            <span className="product-occasion-catalog">
                                                {product.occasion}
                                            </span>
                                        </div>

                                        <div className="product-price-catalog">
                                            {product.originalPrice && product.originalPrice > product.price ? (
                                                <>
                                                    <span className="original-price-catalog">
                                                        {formatPrice(product.originalPrice)}
                                                    </span>
                                                    <span className="current-price-catalog">
                                                        {formatPrice(product.price)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="current-price-catalog">
                                                    {formatPrice(product.price)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="product-actions-catalog">
                                            <button
                                                className="btn-add-to-cart-catalog"
                                                onClick={(e) => handleAddToCart(e, product)}
                                            >
                                                В корзину
                                            </button>
                                            <button
                                                className={`favorite-heart-btn-catalog ${isFavorite(product._id) ? 'favorited' : ''}`}
                                                onClick={(e) => handleToggleFavorite(e, product)}
                                                title={isFavorite(product._id) ? 'Удалить из избранного' : 'Добавить в избранное'}
                                            >
                                                {isFavorite(product._id) ? '❤️' : '🤍'}
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

                {/*/!* Индикаторы прокрутки для мобильных *!/*/}
                {/*<div className="scroll-indicators d-md-none">*/}
                {/*    <button*/}
                {/*        className="scroll-indicator-btn"*/}
                {/*        onClick={scrollLeft}*/}
                {/*        aria-label="Прокрутить влево"*/}
                {/*    >*/}
                {/*        ‹*/}
                {/*    </button>*/}
                {/*    <span className="scroll-hint">Проведите для прокрутки</span>*/}
                {/*    <button*/}
                {/*        className="scroll-indicator-btn"*/}
                {/*        onClick={scrollRight}*/}
                {/*        aria-label="Прокрутить вправо"*/}
                {/*    >*/}
                {/*        ›*/}
                {/*    </button>*/}
                {/*</div>*/}
            </div>
        </section>
    );
};

export default HitsSection;