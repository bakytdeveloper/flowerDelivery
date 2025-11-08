import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { toast } from 'react-toastify';
import './ProductDetails.css';

const AddonDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [addon, setAddon] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const { addAddonToCart } = useCart();

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5506';

    const getImageUrl = (imagePath) => {
        if (!imagePath) {
            return '/images/placeholder-addon.jpg';
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

    const getAddonTypeLabel = (type) => {
        switch (type) {
            case 'soft_toy': return '🧸 Мягкая игрушка';
            case 'candy_box': return '🍬 Коробка конфет';
            case 'chocolate': return '🍫 Шоколад';
            case 'card': return '💌 Открытка';
            case 'perfume': return '💎 Парфюм';
            default: return '🎁 Дополнительный товар';
        }
    };

    useEffect(() => {
        fetchAddonDetails();
    }, [id]);

    const fetchAddonDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${apiUrl}/api/products/addons/${id}`);
            if (!response.ok) {
                throw new Error('Дополнительный товар не найден');
            }

            const data = await response.json();
            setAddon(data);
        } catch (err) {
            console.error('Error fetching addon details:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (change) => {
        const newQuantity = quantity + change;
        if (newQuantity >= 1 && newQuantity <= (addon?.quantity || 10)) {
            setQuantity(newQuantity);
        }
    };

    const handleAddToCart = async () => {
        const result = await addAddonToCart(addon, quantity);
        if (result.success) {
            toast.success('🎀 Дополнительный товар добавлен в корзину!', {
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

    if (error || !addon) {
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
                    <span className="breadcrumb-current">{addon.name}</span>
                </nav>

                <div className="product-details-content">
                    {/* Левая колонка - Галерея изображений */}
                    <div className="product-gallery">
                        <div className="main-image-container">
                            <img
                                src={getImageUrl(addon.image)}
                                alt={addon.name}
                                className="main-image"
                                onError={(e) => {
                                    e.target.src = '/images/placeholder-addon.jpg';
                                }}
                            />
                            {addon.originalPrice && addon.originalPrice > addon.price && (
                                <span className="discount-badge-large">
                                    -{Math.round((1 - addon.price / addon.originalPrice) * 100)}%
                                </span>
                            )}
                            <span className="popular-tag popular-tag-product-details" style={{position: 'absolute', top: '1rem', right: '1rem'}}>
                                {addon.type === 'soft_toy' ? '🧸' :
                                    addon.type === 'candy_box' ? '🍬' :
                                        addon.type === 'chocolate' ? '🍫' :
                                            addon.type === 'card' ? '💌' :
                                                addon.type === 'perfume' ? '💎' : '🎁'}
                            </span>
                        </div>
                    </div>

                    {/* Правая колонка - Информация о товаре */}
                    <div className="product-info">
                        <div className="product-header">
                            <h1 className="product-title">{addon.name}</h1>
                            {addon.soldCount > 0 && (
                                <span className="popular-tag popular-tag-product-details">
                                    <span className="popular-badge-fire">🔥</span> Продано: <span style={{fontWeight:"bold"}}>{addon.soldCount}</span>
                                </span>
                            )}
                        </div>

                        <div className="product-price-section">
                            {addon.originalPrice && addon.originalPrice > addon.price ? (
                                <div className="price-with-discount">
                                    <span className="original-price-large">
                                        {formatPrice(addon.originalPrice)}
                                    </span>
                                    <span className="current-price-large">
                                        {formatPrice(addon.price)}
                                    </span>
                                </div>
                            ) : (
                                <span className="current-price-large">
                                    {formatPrice(addon.price)}
                                </span>
                            )}
                        </div>

                        <div className="product-description-full">
                            <h3>Описание</h3>
                            <p>{addon.description || 'Отличное дополнение к вашему заказу'}</p>
                        </div>

                        {/* Характеристики товара */}
                        <div className="product-specs">
                            <div className="spec-item">
                                <span className="spec-label">Тип товара:</span>
                                <span className="spec-value">{getAddonTypeLabel(addon.type)}</span>
                            </div>

                            {addon.material && (
                                <div className="spec-item">
                                    <span className="spec-label">Материал:</span>
                                    <span className="spec-value">{addon.material}</span>
                                </div>
                            )}

                            {addon.size && (
                                <div className="spec-item">
                                    <span className="spec-label">Размер:</span>
                                    <span className="spec-value">{addon.size}</span>
                                </div>
                            )}

                            {addon.weight && (
                                <div className="spec-item">
                                    <span className="spec-label">Вес:</span>
                                    <span className="spec-value">{addon.weight} г</span>
                                </div>
                            )}

                            {addon.brand && (
                                <div className="spec-item">
                                    <span className="spec-label">Бренд:</span>
                                    <span className="spec-value">{addon.brand}</span>
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
                                    <span className="quantity-display quantity-display-color">{quantity}</span>
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
                                    disabled={!addon.quantity || addon.quantity <= 0}
                                >
                                    {addon.quantity > 0 ? '🛒  Добавить в корзину' : '❌ Нет в наличии'}
                                </button>
                            </div>

                            <div className="stock-info">
                                {addon.quantity > 0 ? (
                                    <span className="in-stock">✓ В наличии ({addon.quantity} шт.)</span>
                                ) : (
                                    <span className="out-of-stock">✗ Нет в наличии</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Дополнительная информация */}
                <div className="product-additional-info">
                    <div className="info-section">
                        <h3>🎁 Особенности</h3>
                        <p>Этот товар станет прекрасным дополнением к вашему подарку, делая его более запоминающимся и особенным.</p>
                    </div>
                    <div className="info-section">
                        <h3>🚚 Доставка</h3>
                        <p>Бесплатная доставка при заказе от 5000 ₸. Товар доставляется вместе с основным заказом.</p>
                    </div>
                    <div className="info-section">
                        <h3>💡 Идея подарка</h3>
                        <p>Сочетайте этот товар с цветами для создания идеального подарка на любой праздник.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddonDetails;