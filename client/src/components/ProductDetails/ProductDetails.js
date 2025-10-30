import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useFavorites } from '../../hooks/useFavorites';
import './ProductDetails.css';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [wrappers, setWrappers] = useState([]);
    const [addons, setAddons] = useState([]);
    const [loadingWrappers, setLoadingWrappers] = useState(false);
    const [loadingAddons, setLoadingAddons] = useState(false);
    const { toggleFavorite, isFavorite } = useFavorites();
    const location = useLocation();

    // Прокрутка вверх при монтировании компонента и изменении фильтров
    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }, [location.search]);

    useEffect(() => {
        fetchProductDetails();
        fetchWrappers();
        fetchAddons();
        // eslint-disable-next-line
    }, [id]);

    const fetchProductDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/products/${id}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Товар не найден');
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.product) {
                setProduct(data.product);
            } else {
                throw new Error(data.message || 'Ошибка при загрузке товара');
            }
        } catch (err) {
            console.error('Error fetching product details:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchWrappers = async () => {
        try {
            setLoadingWrappers(true);
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/products/wrappers/available`);

            if (response.ok) {
                const wrappersData = await response.json();
                setWrappers(wrappersData);
            }
        } catch (error) {
            console.error('Error fetching wrappers:', error);
        } finally {
            setLoadingWrappers(false);
        }
    };

    const fetchAddons = async () => {
        try {
            setLoadingAddons(true);
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/products/addons/available`);

            if (response.ok) {
                const addonsData = await response.json();
                setAddons(addonsData);
            }
        } catch (error) {
            console.error('Error fetching addons:', error);
        } finally {
            setLoadingAddons(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'KZT',
            minimumFractionDigits: 0
        }).format(price);
    };

    const handleQuantityChange = (change) => {
        const newQuantity = quantity + change;
        if (newQuantity >= 1 && newQuantity <= (product?.quantity || 10)) {
            setQuantity(newQuantity);
        }
    };

    const handleAddToCart = () => {
        console.log('Добавлено в корзину:', { product, quantity });
    };

    const handleAddToFavorites = async () => {
        const success = await toggleFavorite(product._id, isFavorite(product._id));
        if (success) {
            // Можно показать уведомление или обновить состояние
        }
    };

    const handleImageClick = (index) => {
        setSelectedImageIndex(index);
    };

    const handleNextImage = () => {
        if (product?.images?.length) {
            setSelectedImageIndex((prev) =>
                prev === product.images.length - 1 ? 0 : prev + 1
            );
        }
    };

    const handlePrevImage = () => {
        if (product?.images?.length) {
            setSelectedImageIndex((prev) =>
                prev === 0 ? product.images.length - 1 : prev - 1
            );
        }
    };

    // Компонент для секции обёрток
    const WrappersSection = () => {
        if (loadingWrappers) {
            return (
                <section className="hits-section">
                    <div className="container">
                        <h2 className="hits-title">Обёртки</h2>
                        <div className="loading-products">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Загрузка...</span>
                            </div>
                        </div>
                    </div>
                </section>
            );
        }

        if (!wrappers || wrappers.length === 0) {
            return null;
        }

        return (
            <section className="hits-section">
                <div className="container">
                    <div className="hits-header">
                        <h2 className="hits-title">Обёртки</h2>
                    </div>

                    <div className="hits-container">
                        <button
                            className="scroll-btn scroll-btn-left d-none d-md-flex"
                            onClick={(e) => {
                                e.preventDefault();
                                const container = e.target.closest('.hits-container').querySelector('.hits-scroll-container');
                                container.scrollBy({ left: -300, behavior: 'smooth' });
                            }}
                            aria-label="Прокрутить влево"
                        >
                            ‹
                        </button>

                        <div className="hits-scroll-container">
                            <div className="hits-products-row">
                                {wrappers.map((wrapper) => (
                                    <div
                                        key={wrapper._id}
                                        className="hits-product-card"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="product-image-container">
                                            <img
                                                src={wrapper.image || '/images/placeholder-flower.jpg'}
                                                alt={wrapper.name}
                                                className="product-image"
                                                loading="lazy"
                                            />
                                            {wrapper.originalPrice && wrapper.originalPrice > wrapper.price && (
                                                <span className="discount-badge">
                                                    -{Math.round((1 - wrapper.price / wrapper.originalPrice) * 100)}%
                                                </span>
                                            )}
                                        </div>

                                        <div className="cart-product-info">
                                            <h3 className="product-name">{wrapper.name}</h3>
                                            <p className="product-description">
                                                {wrapper.description?.length > 20
                                                    ? `${wrapper.description.slice(0, 20)}...`
                                                    : wrapper.description || 'Стильная упаковка для вашего букета'
                                                }
                                            </p>

                                            <div className="product-price">
                                                {wrapper.originalPrice && wrapper.originalPrice > wrapper.price ? (
                                                    <>
                                                        <span className="original-price">
                                                            {formatPrice(wrapper.originalPrice)}
                                                        </span>
                                                        <span className="current-price">
                                                            {formatPrice(wrapper.price)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="current-price">
                                                        {formatPrice(wrapper.price)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="product-actions">
                                                <button
                                                    className="btn-add-to-cart"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        console.log('Добавлена обёртка в корзину:', wrapper);
                                                    }}
                                                >
                                                    В корзину
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            className="scroll-btn scroll-btn-right d-none d-md-flex"
                            onClick={(e) => {
                                e.preventDefault();
                                const container = e.target.closest('.hits-container').querySelector('.hits-scroll-container');
                                container.scrollBy({ left: 300, behavior: 'smooth' });
                            }}
                            aria-label="Прокрутить вправо"
                        >
                            ›
                        </button>
                    </div>

                    <div className="scroll-indicators d-md-none">
                        <button
                            className="scroll-indicator-btn"
                            onClick={(e) => {
                                e.preventDefault();
                                const container = document.querySelector('.hits-section:first-of-type .hits-scroll-container');
                                container.scrollBy({ left: -300, behavior: 'smooth' });
                            }}
                            aria-label="Прокрутить влево"
                        >
                            ‹
                        </button>
                        <span className="scroll-hint">Проведите для прокрутки</span>
                        <button
                            className="scroll-indicator-btn"
                            onClick={(e) => {
                                e.preventDefault();
                                const container = document.querySelector('.hits-section:first-of-type .hits-scroll-container');
                                container.scrollBy({ left: 300, behavior: 'smooth' });
                            }}
                            aria-label="Прокрутить вправо"
                        >
                            ›
                        </button>
                    </div>
                </div>
            </section>
        );
    };

    // Компонент для секции дополнительных товаров
    const AddonsSection = () => {
        if (loadingAddons) {
            return (
                <section className="hits-section">
                    <div className="container">
                        <h2 className="hits-title">Дополнительные товары</h2>
                        <div className="loading-products">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Загрузка...</span>
                            </div>
                        </div>
                    </div>
                </section>
            );
        }

        if (!addons || addons.length === 0) {
            return null;
        }

        return (
            <section className="hits-section">
                <div className="container">
                    <div className="hits-header">
                        <h2 className="hits-title">Дополнительные товары</h2>
                    </div>

                    <div className="hits-container">
                        <button
                            className="scroll-btn scroll-btn-left d-none d-md-flex"
                            onClick={(e) => {
                                e.preventDefault();
                                const container = e.target.closest('.hits-container').querySelector('.hits-scroll-container');
                                container.scrollBy({ left: -300, behavior: 'smooth' });
                            }}
                            aria-label="Прокрутить влево"
                        >
                            ‹
                        </button>

                        <div className="hits-scroll-container">
                            <div className="hits-products-row">
                                {addons.map((addon) => (
                                    <div
                                        key={addon._id}
                                        className="hits-product-card"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="product-image-container">
                                            <img
                                                src={addon.image || '/images/placeholder-flower.jpg'}
                                                alt={addon.name}
                                                className="product-image"
                                                loading="lazy"
                                            />
                                            {addon.originalPrice && addon.originalPrice > addon.price && (
                                                <span className="discount-badge">
                                                    -{Math.round((1 - addon.price / addon.originalPrice) * 100)}%
                                                </span>
                                            )}
                                            <span className="popular-badge">
                                                {addon.typeLabel || 'Дополнение'}
                                            </span>
                                        </div>

                                        <div className="cart-product-info">
                                            <h3 className="product-name">{addon.name}</h3>
                                            <p className="product-description">
                                                {addon.description?.length > 20
                                                    ? `${addon.description.slice(0, 20)}...`
                                                    : addon.description || 'Отличное дополнение к вашему заказу'
                                                }
                                            </p>

                                            <div className="product-meta">
                                                <span className="product-occasion">
                                                    {addon.typeLabel || addon.type}
                                                </span>
                                            </div>

                                            <div className="product-price">
                                                {addon.originalPrice && addon.originalPrice > addon.price ? (
                                                    <>
                                                        <span className="original-price">
                                                            {formatPrice(addon.originalPrice)}
                                                        </span>
                                                        <span className="current-price">
                                                            {formatPrice(addon.price)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="current-price">
                                                        {formatPrice(addon.price)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="product-actions">
                                                <button
                                                    className="btn-add-to-cart"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        console.log('Добавлен доп. товар в корзину:', addon);
                                                    }}
                                                >
                                                    В корзину
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            className="scroll-btn scroll-btn-right d-none d-md-flex"
                            onClick={(e) => {
                                e.preventDefault();
                                const container = e.target.closest('.hits-container').querySelector('.hits-scroll-container');
                                container.scrollBy({ left: 300, behavior: 'smooth' });
                            }}
                            aria-label="Прокрутить вправо"
                        >
                            ›
                        </button>
                    </div>

                    <div className="scroll-indicators d-md-none">
                        <button
                            className="scroll-indicator-btn"
                            onClick={(e) => {
                                e.preventDefault();
                                const containers = document.querySelectorAll('.hits-section .hits-scroll-container');
                                const container = containers[containers.length - 1];
                                container.scrollBy({ left: -300, behavior: 'smooth' });
                            }}
                            aria-label="Прокрутить влево"
                        >
                            ‹
                        </button>
                        <span className="scroll-hint">Проведите для прокрутки</span>
                        <button
                            className="scroll-indicator-btn"
                            onClick={(e) => {
                                e.preventDefault();
                                const containers = document.querySelectorAll('.hits-section .hits-scroll-container');
                                const container = containers[containers.length - 1];
                                container.scrollBy({ left: 300, behavior: 'smooth' });
                            }}
                            aria-label="Прокрутить вправо"
                        >
                            ›
                        </button>
                    </div>
                </div>
            </section>
        );
    };

    if (loading) {
        return (
            <div className="product-details-page">
                <div className="container">
                    <div className="product-loading">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Загрузка...</span>
                        </div>
                        <p>Загрузка товара...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="product-details-page">
                <div className="container">
                    <div className="product-error">
                        <h2>Ошибка</h2>
                        <p>{error || 'Товар не найден'}</p>
                        <div className="error-actions">
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate('/catalog')}
                            >
                                Вернуться в каталог
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => window.location.reload()}
                            >
                                Обновить страницу
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="product-details-page">
            <div className="container">
                {/* Хлебные крошки */}
                <nav className="breadcrumb-nav">
                    <button
                        className="breadcrumb-back"
                        onClick={() => navigate(-1)}
                    >
                        ← Назад
                    </button>
                    <span className="breadcrumb-separator">/</span>
                    <button
                        className="breadcrumb-link"
                        onClick={() => navigate('/catalog')}
                    >
                        Каталог
                    </button>
                    <span className="breadcrumb-separator">/</span>
                    <span className="breadcrumb-current">{product.name}</span>
                </nav>

                <div className="product-details-content">
                    {/* Левая колонка - Галерея изображений */}
                    <div className="product-gallery">
                        <div className="main-image-container">
                            <img
                                src={product.images?.[selectedImageIndex] || '/images/placeholder-flower.jpg'}
                                alt={product.name}
                                className="main-image"
                            />
                            {product.images && product.images.length > 1 && (
                                <>
                                    <button
                                        className="gallery-nav-btn prev-btn"
                                        onClick={handlePrevImage}
                                    >
                                        ‹
                                    </button>
                                    <button
                                        className="gallery-nav-btn next-btn"
                                        onClick={handleNextImage}
                                    >
                                        ›
                                    </button>
                                </>
                            )}
                            {product.discountPercentage > 0 && (
                                <span className="discount-badge-large">
                                    -{product.discountPercentage}%
                                </span>
                            )}
                        </div>

                        {product.images && product.images.length > 1 && (
                            <div className="image-thumbnails">
                                {product.images.map((image, index) => (
                                    <div
                                        key={index}
                                        className={`thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                                        onClick={() => handleImageClick(index)}
                                    >
                                        <img
                                            src={image}
                                            alt={`${product.name} ${index + 1}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Правая колонка - Информация о товаре */}
                    <div className="product-info">
                        <div className="product-header">
                            <h1 className="product-title">{product.name}</h1>
                            {product.soldCount > 0 && (
                                <span className="popular-tag">
                                    🔥 Продано: {product.soldCount}
                                </span>
                            )}
                        </div>

                        <div className="product-price-section">
                            {product.originalPrice && product.originalPrice > product.price ? (
                                <div className="price-with-discount">
                                    <span className="original-price-large">
                                        {formatPrice(product.originalPrice)}
                                    </span>
                                    <span className="current-price-large">
                                        {formatPrice(product.price)}
                                    </span>
                                </div>
                            ) : (
                                <span className="current-price-large">
                                    {formatPrice(product.price)}
                                </span>
                            )}
                        </div>

                        <div className="product-description-full">
                            <h3>Описание</h3>
                            <p>{product.description}</p>
                        </div>

                        {/* Характеристики товара */}
                        <div className="product-specs">
                            <div className="spec-item">
                                <span className="spec-label">Тип:</span>
                                <span className="spec-value">
                                    {product.type === 'single' ? '💐 Одиночный цветок' : '💮 Букет'}
                                </span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">Повод:</span>
                                <span className="spec-value">{product.occasion}</span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">Кому:</span>
                                <span className="spec-value">{product.recipient}</span>
                            </div>
                            {product.flowerNames && product.flowerNames.length > 0 && (
                                <div className="spec-item">
                                    <span className="spec-label">Виды цветов:</span>
                                    <span className="spec-value">{product.flowerNames.join(', ')}</span>
                                </div>
                            )}
                            {product.stemLength && (
                                <div className="spec-item">
                                    <span className="spec-label">Длина стебля:</span>
                                    <span className="spec-value">{product.stemLength} см</span>
                                </div>
                            )}
                            {product.flowerColors && product.flowerColors.length > 0 && (
                                <div className="spec-item">
                                    <span className="spec-label">Цвета:</span>
                                    <div className="color-tags">
                                        {product.flowerColors.map((color, index) => (
                                            <span
                                                key={index}
                                                className="color-tag"
                                                style={{
                                                    backgroundColor: color.value,
                                                    border: color.value === '#FFFFFF' ? '1px solid #ccc' : 'none'
                                                }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Блок покупки */}
                        <div className="purchase-section">
                            <div className="quantity-selector">
                                <span className="quantity-label">Количество:</span>
                                <div className="quantity-controls">
                                    <button
                                        className="quantity-btn"
                                        onClick={() => handleQuantityChange(-1)}
                                    >
                                        -
                                    </button>
                                    <span className="quantity-display">{quantity}</span>
                                    <button
                                        className="quantity-btn"
                                        onClick={() => handleQuantityChange(1)}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="action-buttons">
                                <button
                                    className="btn-add-to-cart-large"
                                    onClick={handleAddToCart}
                                    disabled={!product.quantity || product.quantity <= 0}
                                >
                                    {product.quantity > 0 ? '🛒 Добавить в корзину' : '❌ Нет в наличии'}
                                </button>
                                <button
                                    className={`btn-favorite-large ${isFavorite(product._id) ? 'favorited' : ''}`}
                                    onClick={handleAddToFavorites}
                                >
                                    {isFavorite(product._id) ? '❤️ В избранном' : '♡ В избранное'}
                                </button>
                            </div>

                            <div className="stock-info">
                                {product.quantity > 0 ? (
                                    <span className="in-stock">✓ В наличии ({product.quantity} шт.)</span>
                                ) : (
                                    <span className="out-of-stock">✗ Нет в наличии</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Секция обёрток */}
                <WrappersSection />

                {/* Секция дополнительных товаров */}
                <AddonsSection />

                {/* Дополнительная информация */}
                <div className="product-additional-info">
                    <div className="info-section">
                        <h3>🚚 Доставка</h3>
                        <p>Бесплатная доставка по городу при заказе от 5000 ₸. Срок доставки: 1-2 часа.</p>
                    </div>
                    <div className="info-section">
                        <h3>🔄 Возврат</h3>
                        <p>Возврат и обмен возможен в течение 24 часов после получения заказа.</p>
                    </div>
                    <div className="info-section">
                        <h3>💐 Уход за цветами</h3>
                        <p>Рекомендуем менять воду ежедневно и подрезать стебли для продления свежести.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;