import React, {useEffect} from 'react';
import './ProductModal.css';
import {useLocation} from "react-router-dom";

const ProductModal = ({ product, type, onClose, onAddToCart }) => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5506';
    const location = useLocation();

    // Прокрутка вверх при монтировании компонента и изменении фильтров
    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }, [location.search]);

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
        <div className="modal-overlay-wrapper-addon" onClick={onClose}>
            <div className="modal-content-wrapper-addon" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn-wrapper-addon" onClick={onClose}>
                    ×
                </button>

                <div className="modal-product-content-wrapper-addon">
                    {/* Левая колонка - изображение */}
                    <div className="modal-product-image-wrapper-addon">
                        <img
                            src={getImageUrl(product.image)}
                            alt={product.name}
                            className="modal-main-image-wrapper-addon"
                            onError={(e) => {
                                e.target.src = type === 'wrapper'
                                    ? '/images/placeholder-wrapper.jpg'
                                    : '/images/placeholder-addon.jpg';
                            }}
                        />
                        {product.originalPrice && product.originalPrice > product.price && (
                            <span className="modal-discount-badge-wrapper-addon">
                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
              </span>
                        )}
                    </div>

                    {/* Правая колонка - информация */}
                    <div className="modal-product-info-wrapper-addon">
                        <h2 className="modal-product-title-wrapper-addon">{product.name}</h2>

                        {/* Цена */}
                        <div className="modal-price-section-wrapper-addon">
                            {product.originalPrice && product.originalPrice > product.price ? (
                                <div className="modal-price-with-discount-wrapper-addon">
                  <span className="modal-original-price-wrapper-addon">
                    {formatPrice(product.originalPrice)}
                  </span>
                                    <span className="modal-current-price-wrapper-addon">
                    {formatPrice(product.price)}
                  </span>
                                </div>
                            ) : (
                                <span className="modal-current-price-wrapper-addon">
                  {formatPrice(product.price)}
                </span>
                            )}
                        </div>

                        {/* Описание */}
                        <div className="modal-description-wrapper-addon">
                            <p>{product.description ||
                            (type === 'wrapper'
                                ? 'Стильная упаковка для вашего букета'
                                : 'Отличное дополнение к вашему заказу')
                            }</p>
                        </div>

                        {/* Характеристики */}
                        <div className="modal-specs-wrapper-addon">
                            <div className="modal-spec-item-wrapper-addon">
                                <span className="modal-spec-label-wrapper-addon">Тип товара:</span>
                                <span className="modal-spec-value-wrapper-addon">
                  {type === 'wrapper'
                      ? '🎁 Обёртка для букета'
                      : getAddonTypeLabel(product.type)
                  }
                </span>
                            </div>

                            {product.material && (
                                <div className="modal-spec-item-wrapper-addon">
                                    <span className="modal-spec-label-wrapper-addon">Материал:</span>
                                    <span className="modal-spec-value-wrapper-addon">{product.material}</span>
                                </div>
                            )}

                            {product.size && (
                                <div className="modal-spec-item-wrapper-addon">
                                    <span className="modal-spec-label-wrapper-addon">Размер:</span>
                                    <span className="modal-spec-value-wrapper-addon">{product.size}</span>
                                </div>
                            )}

                            {product.weight && (
                                <div className="modal-spec-item-wrapper-addon">
                                    <span className="modal-spec-label-wrapper-addon">Вес:</span>
                                    <span className="modal-spec-value-wrapper-addon">{product.weight} г</span>
                                </div>
                            )}

                            {product.brand && (
                                <div className="modal-spec-item-wrapper-addon">
                                    <span className="modal-spec-label-wrapper-addon">Бренд:</span>
                                    <span className="modal-spec-value-wrapper-addon">{product.brand}</span>
                                </div>
                            )}

                            {/* Для обёрток - цвета */}
                            {type === 'wrapper' && product.colors && product.colors.length > 0 && (
                                <div className="modal-spec-item-wrapper-addon">
                                    <span className="modal-spec-label-wrapper-addon">Цвета:</span>
                                    <div className="modal-color-tags-wrapper-addon">
                                        {product.colors.map((color, index) => (
                                            <span
                                                key={index}
                                                className="modal-color-tag-wrapper-addon"
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
                        <div className="modal-stock-info-wrapper-addon">
                            {product.quantity > 0 ? (
                                <span className="modal-in-stock-wrapper-addon">
                  ✓ В наличии ({product.quantity} шт.)
                </span>
                            ) : (
                                <span className="modal-out-of-stock-wrapper-addon">✗ Нет в наличии</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductModal;