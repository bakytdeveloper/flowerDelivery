import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { toast } from 'react-toastify';
import './ProductDetails.css';

const WrapperDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [wrapper, setWrapper] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const { addFlowerToCart } = useCart();

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5506';

    const getImageUrl = (imagePath) => {
        if (!imagePath) {
            return '/images/placeholder-wrapper.jpg';
        }
        if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
            return imagePath;
        }
        if (imagePath.startsWith('/')) {
            return `${apiUrl}${imagePath}`;
        }
        return `${apiUrl}/uploads/${imagePath}`;
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'KZT',
            minimumFractionDigits: 0
        }).format(price);
    };

    useEffect(() => {
        fetchWrapperDetails();
    }, [id]);

    const fetchWrapperDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${apiUrl}/api/products/wrappers/${id}`);
            if (!response.ok) {
                throw new Error('Обёртка не найдена');
            }

            const data = await response.json();
            setWrapper(data);
        } catch (err) {
            console.error('Error fetching wrapper details:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (change) => {
        const newQuantity = quantity + change;
        if (newQuantity >= 1 && newQuantity <= (wrapper?.quantity || 10)) {
            setQuantity(newQuantity);
        }
    };

    const handleAddToCart = async () => {
        // Создаем временный объект продукта для совместимости с функцией добавления в корзину
        const tempProduct = {
            _id: wrapper._id,
            name: wrapper.name,
            price: wrapper.price,
            originalPrice: wrapper.originalPrice,
            image: wrapper.image,
            type: 'wrapper',
            quantity: wrapper.quantity
        };

        const result = await addFlowerToCart(tempProduct, quantity, {
            wrapper: {
                wrapperId: wrapper._id
            }
        });

        if (result.success) {
            toast.success('🎁 Обёртка добавлена в корзину!', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                icon: "🛒"
            });
        } else {
            toast.error(result.error, {
                position: "top-right",
                autoClose: 4000,
                hideProgressBar: false,
            });
        }
    };

    const handleImageClick = (index) => {
        setSelectedImageIndex(index);
    };

    const handleNextImage = () => {
        if (wrapper?.image) {
            setSelectedImageIndex(0);
        }
    };

    const handlePrevImage = () => {
        if (wrapper?.image) {
            setSelectedImageIndex(0);
        }
    };

    if (loading) {
        return (
            <div className="product-details-page">
                <div className="container">
                    <div className="product-loading">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Загрузка...</span>
                        </div>
                        <p>Загрузка обёртки...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !wrapper) {
        return (
            <div className="product-details-page">
                <div className="container">
                    <div className="product-error">
                        <h2>Ошибка</h2>
                        <p>{error || 'Обёртка не найдена'}</p>
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
                    <span className="breadcrumb-current">{wrapper.name}</span>
                </nav>

                <div className="product-details-content">
                    {/* Левая колонка - Галерея изображений */}
                    <div className="product-gallery">
                        <div className="main-image-container">
                            <img
                                src={getImageUrl(wrapper.image)}
                                alt={wrapper.name}
                                className="main-image"
                                onError={(e) => {
                                    e.target.src = '/images/placeholder-wrapper.jpg';
                                }}
                            />
                            {wrapper.originalPrice && wrapper.originalPrice > wrapper.price && (
                                <span className="discount-badge-large">
                                    -{Math.round((1 - wrapper.price / wrapper.originalPrice) * 100)}%
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Правая колонка - Информация об обёртке */}
                    <div className="product-info">
                        <div className="product-header">
                            <h1 className="product-title">{wrapper.name}</h1>
                            {wrapper.soldCount > 0 && (
                                <span className="popular-tag popular-tag-product-details">
                                    <span className="popular-badge-fire">🔥</span> Продано: <span style={{fontWeight:"bold"}}>{wrapper.soldCount}</span>
                                </span>
                            )}
                        </div>

                        <div className="product-price-section">
                            {wrapper.originalPrice && wrapper.originalPrice > wrapper.price ? (
                                <div className="price-with-discount">
                                    <span className="original-price-large">
                                        {formatPrice(wrapper.originalPrice)}
                                    </span>
                                    <span className="current-price-large">
                                        {formatPrice(wrapper.price)}
                                    </span>
                                </div>
                            ) : (
                                <span className="current-price-large">
                                    {formatPrice(wrapper.price)}
                                </span>
                            )}
                        </div>

                        <div className="product-description-full">
                            <h3>Описание</h3>
                            <p>{wrapper.description || 'Стильная упаковка для вашего букета'}</p>
                        </div>

                        {/* Характеристики обёртки */}
                        <div className="product-specs">
                            <div className="spec-item">
                                <span className="spec-label">Тип товара:</span>
                                <span className="spec-value">🎁 Обёртка для букета</span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">Материал:</span>
                                <span className="spec-value">{wrapper.material || 'Бумага премиум-класса'}</span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">Размер:</span>
                                <span className="spec-value">{wrapper.size || 'Универсальный'}</span>
                            </div>
                            {wrapper.colors && wrapper.colors.length > 0 && (
                                <div className="spec-item">
                                    <span className="spec-label">Цвета:</span>
                                    <div className="color-tags">
                                        {wrapper.colors.map((color, index) => (
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

                        {/*/!* Блок покупки *!/*/}
                        {/*<div className="purchase-section">*/}
                        {/*    <div className="quantity-selector">*/}
                        {/*        <span className="quantity-label">Количество:</span>*/}
                        {/*        <div className="quantity-controls">*/}
                        {/*            <button*/}
                        {/*                className="quantity-btn"*/}
                        {/*                onClick={() => handleQuantityChange(-1)}*/}
                        {/*            >*/}
                        {/*                -*/}
                        {/*            </button>*/}
                        {/*            <span className="quantity-display quantity-display-color">{quantity}</span>*/}
                        {/*            <button*/}
                        {/*                className="quantity-btn"*/}
                        {/*                onClick={() => handleQuantityChange(1)}*/}
                        {/*            >*/}
                        {/*                +*/}
                        {/*            </button>*/}
                        {/*        </div>*/}
                        {/*    </div>*/}

                        {/*    <div className="action-buttons">*/}
                        {/*        <button*/}
                        {/*            className="btn-add-to-cart-large"*/}
                        {/*            onClick={handleAddToCart}*/}
                        {/*            disabled={!wrapper.quantity || wrapper.quantity <= 0}*/}
                        {/*        >*/}
                        {/*            {wrapper.quantity > 0 ? '🛒  Добавить в корзину' : '❌ Нет в наличии'}*/}
                        {/*        </button>*/}
                        {/*    </div>*/}

                        {/*    <div className="stock-info">*/}
                        {/*        {wrapper.quantity > 0 ? (*/}
                        {/*            <span className="in-stock">✓ В наличии ({wrapper.quantity} шт.)</span>*/}
                        {/*        ) : (*/}
                        {/*            <span className="out-of-stock">✗ Нет в наличии</span>*/}
                        {/*        )}*/}
                        {/*    </div>*/}
                        {/*</div>*/}

                    </div>
                </div>

                {/* Дополнительная информация */}
                <div className="product-additional-info">
                    <div className="info-section">
                        <h3>🎀 Особенности</h3>
                        <p>Эта обёртка идеально подходит для создания элегантного и завершённого вида вашего букета. Качественные материалы обеспечивают сохранность цветов.</p>
                    </div>
                    <div className="info-section">
                        <h3>🚚 Доставка</h3>
                        <p>Бесплатная доставка при заказе от 5000 ₸. Обёртка доставляется вместе с заказом.</p>
                    </div>
                    <div className="info-section">
                        <h3>💡 Советы</h3>
                        <p>Рекомендуем выбирать обёртку, которая сочетается с цветовой гаммой вашего букета для гармоничного образа.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WrapperDetails;