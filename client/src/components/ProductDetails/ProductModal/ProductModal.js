import React from 'react';
import './ProductModal.css';

const ProductModal = ({ product, type, onClose, onAddToCart }) => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5506';

    const getImageUrl = (imagePath) => {
        if (!imagePath) {
            return type === 'wrapper'
                ? '/images/placeholder-wrapper.jpg'
                : '/images/placeholder-addon.jpg';
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

    const getAddonTypeLabel = (addonType) => {
        switch (addonType) {
            case 'soft_toy': return '🧸 Мягкая игрушка';
            case 'candy_box': return '🍬 Коробка конфет';
            case 'chocolate': return '🍫 Шоколад';
            case 'card': return '💌 Открытка';
            case 'perfume': return '💎 Парфюм';
            default: return '🎁 Дополнительный товар';
        }
    };

    if (!product) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn modal-close-btn-wrapper-addon" onClick={onClose}>
                    ×
                </button>

                <div className="modal-product-content">
                    {/* Левая колонка - изображение */}
                    <div className="modal-product-image">
                        <img
                            src={getImageUrl(product.image)}
                            alt={product.name}
                            className="modal-main-image"
                            onError={(e) => {
                                e.target.src = type === 'wrapper'
                                    ? '/images/placeholder-wrapper.jpg'
                                    : '/images/placeholder-addon.jpg';
                            }}
                        />
                        {product.originalPrice && product.originalPrice > product.price && (
                            <span className="modal-discount-badge">
                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
              </span>
                        )}
                    </div>

                    {/* Правая колонка - информация */}
                    <div className="modal-product-info">
                        <h2 className="modal-product-title">{product.name}</h2>

                        {/* Цена */}
                        <div className="modal-price-section">
                            {product.originalPrice && product.originalPrice > product.price ? (
                                <div className="modal-price-with-discount">
                  <span className="modal-original-price">
                    {formatPrice(product.originalPrice)}
                  </span>
                                    <span className="modal-current-price">
                    {formatPrice(product.price)}
                  </span>
                                </div>
                            ) : (
                                <span className="modal-current-price">
                  {formatPrice(product.price)}
                </span>
                            )}
                        </div>

                        {/* Описание */}
                        <div className="modal-description">
                            <p>{product.description ||
                            (type === 'wrapper'
                                ? 'Стильная упаковка для вашего букета'
                                : 'Отличное дополнение к вашему заказу')
                            }</p>
                        </div>

                        {/* Характеристики */}
                        <div className="modal-specs">
                            <div className="modal-spec-item">
                                <span className="modal-spec-label">Тип товара:</span>
                                <span className="modal-spec-value">
                  {type === 'wrapper'
                      ? '🎁 Обёртка для букета'
                      : getAddonTypeLabel(product.type)
                  }
                </span>
                            </div>

                            {product.material && (
                                <div className="modal-spec-item">
                                    <span className="modal-spec-label">Материал:</span>
                                    <span className="modal-spec-value">{product.material}</span>
                                </div>
                            )}

                            {product.size && (
                                <div className="modal-spec-item">
                                    <span className="modal-spec-label">Размер:</span>
                                    <span className="modal-spec-value">{product.size}</span>
                                </div>
                            )}

                            {product.weight && (
                                <div className="modal-spec-item">
                                    <span className="modal-spec-label">Вес:</span>
                                    <span className="modal-spec-value">{product.weight} г</span>
                                </div>
                            )}

                            {product.brand && (
                                <div className="modal-spec-item">
                                    <span className="modal-spec-label">Бренд:</span>
                                    <span className="modal-spec-value">{product.brand}</span>
                                </div>
                            )}

                            {/* Для обёрток - цвета */}
                            {type === 'wrapper' && product.colors && product.colors.length > 0 && (
                                <div className="modal-spec-item">
                                    <span className="modal-spec-label">Цвета:</span>
                                    <div className="modal-color-tags">
                                        {product.colors.map((color, index) => (
                                            <span
                                                key={index}
                                                className="modal-color-tag"
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

                        {/* Информация о наличии */}
                        <div className="modal-stock-info">
                            {product.quantity > 0 ? (
                                <span className="modal-in-stock">
                  ✓ В наличии ({product.quantity} шт.)
                </span>
                            ) : (
                                <span className="modal-out-of-stock">✗ Нет в наличии</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductModal;