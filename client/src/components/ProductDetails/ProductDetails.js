import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useFavorites } from '../../hooks/useFavorites';
import { useCart } from '../../contexts/CartContext';
import { occasionOptions, recipientOptions } from "../../constants/constants";
import ProductReviews from "../ProductReviews/ProductReviews";
import { toast } from 'react-toastify';
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
    const { addFlowerToCart, addAddonToCart } = useCart();

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5506';

    // Функция для получения корректного URL изображения
    const getImageUrl = (imagePath) => {
        if (!imagePath) {
            return '/images/placeholder-flower.jpg';
        }

        // Если это уже полный URL (включая base64)
        if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
            return imagePath;
        }

        // Если это путь к файлу на сервере
        if (imagePath.startsWith('/')) {
            return `${apiUrl}${imagePath}`;
        }

        // Если это относительный путь
        return `${apiUrl}/uploads/${imagePath}`;
    };

    // Функции для получения переведенных значений
    const getOccasionLabel = (occasionValue) => {
        const occasion = occasionOptions.find(opt => opt.value === occasionValue);
        return occasion ? occasion.label : occasionValue;
    };

    const getRecipientLabel = (recipientValue) => {
        const recipient = recipientOptions.find(opt => opt.value === recipientValue);
        return recipient ? recipient.label : recipientValue;
    };

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

            const response = await fetch(`${apiUrl}/api/products/${id}`);

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
            const response = await fetch(`${apiUrl}/api/products/wrappers/available`);

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
            const response = await fetch(`${apiUrl}/api/products/addons/available`);

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

    // Функция для добавления обёртки в корзину
    const handleAddWrapperToCart = async (wrapper) => {
        const result = await addFlowerToCart(product, quantity, {
            wrapper: {
                wrapperId: wrapper._id
            }
        });
        if (result.success) {
            toast.success('🎁 Товар с обёрткой добавлен в корзину!', {
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

    // Функция для добавления дополнения в корзину (как отдельного товара)
    const handleAddAddonToCart = async (addon) => {
        const result = await addAddonToCart(addon, 1);
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

    // Функция для добавления основного товара в корзину (без опций)
    const handleAddProductToCart = async () => {
        const result = await addFlowerToCart(product, quantity);
        if (result.success) {
            toast.success('🌸 Товар добавлен в корзину!', {
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

    const handleAddToFavorites = async () => {
        const success = await toggleFavorite(product._id, isFavorite(product._id));
        if (success) {
            if (isFavorite(product._id)) {
                toast.info('❤️ Товар удален из избранного', {
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: true,
                });
            } else {
                toast.success('❤️ Товар добавлен в избранное', {
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: true,
                });
            }
        } else {
            toast.error('Ошибка при обновлении избранного', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
            });
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
        // Скрываем секцию обёрток для букетов
        if (product?.type === 'bouquet') {
            return null;
        }

        if (loadingWrappers) {
            return (
                <section className="season-section">
                    <div className="container">
                        <h2 className="season-title">Обёртки</h2>
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
            <section className="season-section">
                <div className="container">
                    <div className="season-header">
                        <h2 className="season-title">Обёртки</h2>
                    </div>

                    <div className="season-container">
                        <button
                            className="scroll-btn scroll-btn-left d-none d-md-flex"
                            onClick={(e) => {
                                e.preventDefault();
                                const container = e.target.closest('.season-container').querySelector('.season-scroll-container');
                                container.scrollBy({ left: -300, behavior: 'smooth' });
                            }}
                            aria-label="Прокрутить влево"
                        >
                            ‹
                        </button>

                        <div className="season-scroll-container">
                            <div className="season-products-row">
                                {wrappers.map((wrapper) => (
                                    <div
                                        key={wrapper._id}
                                        className="season-product-card"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/wrapper/${wrapper._id}`)}
                                    >
                                        <div className="product-image-container">
                                            <img
                                                src={getImageUrl(wrapper.image)}
                                                alt={wrapper.name}
                                                className="product-image"
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.target.src = '/images/placeholder-wrapper.jpg';
                                                }}
                                            />
                                            {wrapper.originalPrice && wrapper.originalPrice > wrapper.price && (
                                                <span className="discount-badge">
                                                    -{Math.round((1 - wrapper.price / wrapper.originalPrice) * 100)}%
                                                </span>
                                            )}
                                        </div>

                                        <div className="cart-product-info">
                                            <h3 className="product-name-catalog">{wrapper.name}</h3>
                                            <p className="product-description-catalog">
                                                {wrapper.description?.length > 20
                                                    ? `${wrapper.description.slice(0, 20)}...`
                                                    : wrapper.description || 'Стильная упаковка для вашего букета'
                                                }
                                            </p>

                                            <div className="product-price-catalog">
                                                {wrapper.originalPrice && wrapper.originalPrice > wrapper.price ? (
                                                    <>
                                                        <span className="original-price-catalog">
                                                            {formatPrice(wrapper.originalPrice)}
                                                        </span>
                                                        <span className="current-price-catalog">
                                                            {formatPrice(wrapper.price)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="current-price-catalog">
                                                        {formatPrice(wrapper.price)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="product-actions-wrapper">
                                                <button
                                                    className="btn-add-to-cart"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAddWrapperToCart(wrapper);
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
                                const container = e.target.closest('.season-container').querySelector('.season-scroll-container');
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
                <section className="season-section">
                    <div className="container">
                        <h2 className="season-title">Дополнительные товары</h2>
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
            <section className="season-section">
                <div className="container">
                    <div className="season-header">
                        <h2 className="season-title">Дополнительные товары</h2>
                    </div>

                    <div className="season-container">
                        <button
                            className="scroll-btn scroll-btn-left d-none d-md-flex"
                            onClick={(e) => {
                                e.preventDefault();
                                const container = e.target.closest('.season-container').querySelector('.season-scroll-container');
                                container.scrollBy({ left: -300, behavior: 'smooth' });
                            }}
                            aria-label="Прокрутить влево"
                        >
                            ‹
                        </button>

                        <div className="season-scroll-container">
                            <div className="season-products-row">
                                {addons.map((addon) => (
                                    <div
                                        key={addon._id}
                                        className="season-product-card"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/addon/${addon._id}`)}
                                    >
                                        <div className="product-image-container">
                                            <img
                                                src={getImageUrl(addon.image)}
                                                alt={addon.name}
                                                className="product-image"
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.target.src = '/images/placeholder-addon.jpg';
                                                }}
                                            />
                                            {addon.originalPrice && addon.originalPrice > addon.price && (
                                                <span className="discount-badge">
                                                    -{Math.round((1 - addon.price / addon.originalPrice) * 100)}%
                                                </span>
                                            )}
                                            <span className="popular-badge">
                                                {addon.type === 'soft_toy' ? '🧸' :
                                                    addon.type === 'candy_box' ? '🍬' :
                                                        addon.type === 'chocolate' ? '🍫' :
                                                            addon.type === 'card' ? '💌' :
                                                                addon.type === 'perfume' ? '💎' : '🎁'}
                                            </span>
                                        </div>

                                        <div className="cart-product-info">
                                            <h3 className="product-name-catalog">{addon.name}</h3>
                                            <p className="product-description-catalog">
                                                {addon.description?.length > 20
                                                    ? `${addon.description.slice(0, 20)}...`
                                                    : addon.description || 'Отличное дополнение к вашему заказу'
                                                }
                                            </p>

                                            <div className="product-meta-catalog">
                                                <span className="product-occasion-catalog">
                                                    {addon.type === 'soft_toy' ? 'Мягкая игрушка' :
                                                        addon.type === 'candy_box' ? 'Коробка конфет' :
                                                            addon.type === 'chocolate' ? 'Шоколад' :
                                                                addon.type === 'card' ? 'Открытка' :
                                                                    addon.type === 'perfume' ? 'Парфюм' : 'Другое'}
                                                </span>
                                            </div>

                                            <div className="product-price-catalog">
                                                {addon.originalPrice && addon.originalPrice > addon.price ? (
                                                    <>
                                                        <span className="original-price-catalog">
                                                            {formatPrice(addon.originalPrice)}
                                                        </span>
                                                        <span className="current-price-catalog">
                                                            {formatPrice(addon.price)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="current-price-catalog">
                                                        {formatPrice(addon.price)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="product-actions-wrapper">
                                                <button
                                                    className="btn-add-to-cart"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAddAddonToCart(addon);
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
                                const container = e.target.closest('.season-container').querySelector('.season-scroll-container');
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
                                src={getImageUrl(product.images?.[selectedImageIndex])}
                                alt={product.name}
                                className="main-image"
                                onError={(e) => {
                                    e.target.src = '/images/placeholder-flower.jpg';
                                }}
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
                                            src={getImageUrl(image)}
                                            alt={`${product.name} ${index + 1}`}
                                            onError={(e) => {
                                                e.target.src = '/images/placeholder-flower.jpg';
                                            }}
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
                                <span className="popular-tag popular-tag-product-details">
                                    <span className="popular-badge-fire">🔥</span> Продано: <span style={{fontWeight:"bold"}}>{product.soldCount}</span>
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
                            {product.occasion && (
                                <div className="spec-item">
                                    <span className="spec-label">Повод:</span>
                                    <span className="spec-value">{getOccasionLabel(product.occasion)}</span>
                                </div>
                            )}
                            {product.recipient && (
                                <div className="spec-item">
                                    <span className="spec-label">Кому:</span>
                                    <span className="spec-value">{getRecipientLabel(product.recipient)}</span>
                                </div>
                            )}

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
                                    onClick={handleAddProductToCart}
                                    disabled={!product.quantity || product.quantity <= 0}
                                >
                                    {product.quantity > 0 ? '🛒  Добавить в корзину' : '❌ Нет в наличии'}
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

                {/* Секция обёрток (скрывается для букетов) */}
                <WrappersSection />

                {/* Секция дополнительных товаров */}
                <AddonsSection />

                <div className="product-reviews-section">
                    <ProductReviews productId={product?._id} />
                </div>

                {/* Дополнительная информация */}
                <div className="product-additional-info">
                    <div className="info-section">
                        <h3>🚚 Доставка</h3>
                        <p>Бесплатная доставка по городу при заказе от 5000 ₸. Срок доставка: 1-2 часа.</p>
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