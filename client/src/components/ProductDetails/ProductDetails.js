import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useFavorites } from '../../hooks/useFavorites';
import { useCart } from '../../contexts/CartContext';
import { occasionOptions, recipientOptions } from "../../constants/constants";
import ProductReviews from "../ProductReviews/ProductReviews";
import ProductModal from './ProductModal/ProductModal';

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
    const [modalProduct, setModalProduct] = useState(null);
    const [modalType, setModalType] = useState(null);

    // Состояния для вариантов
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedStemLength, setSelectedStemLength] = useState(null);
    const [availableVariants, setAvailableVariants] = useState({
        colors: [],
        stemLengths: []
    });

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5506';

    // Функция для получения корректного URL изображения
    const getImageUrl = (imagePath) => {
        if (!imagePath) {
            return '/images/placeholder-flower.jpg';
        }

        if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
            return imagePath;
        }

        if (imagePath.startsWith('/')) {
            return `${apiUrl}${imagePath}`;
        }

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

    // Прокрутка вверх при монтировании компонента
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

    // Загрузка вариантов товара
    const fetchProductVariants = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/products/${id}/variants`);
            if (response.ok) {
                const data = await response.json();
                setAvailableVariants({
                    colors: data.availableColors || [],
                    stemLengths: data.stemLengths || []
                });

                // Устанавливаем значения по умолчанию
                if (data.stemLengths && data.stemLengths.length > 0) {
                    setSelectedStemLength(data.stemLengths[0]);
                }
                if (data.type === 'single' && data.availableColors && data.availableColors.length > 0) {
                    setSelectedColor(data.availableColors[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching variants:', error);
        }
    };

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
                // Загружаем варианты после загрузки основного товара
                await fetchProductVariants();
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

    // Получение текущей цены с учетом выбранной длины
    const getCurrentPrice = () => {
        if (selectedStemLength) {
            return selectedStemLength.price;
        }
        return product?.price || 0;
    };

    // Расчет скидки
    const getDiscountPercentage = () => {
        if (selectedStemLength?.originalPrice && selectedStemLength.originalPrice > selectedStemLength.price) {
            return Math.round((1 - selectedStemLength.price / selectedStemLength.originalPrice) * 100);
        }
        if (product?.originalPrice && product.originalPrice > getCurrentPrice()) {
            return Math.round((1 - getCurrentPrice() / product.originalPrice) * 100);
        }
        return 0;
    };

    const handleQuantityChange = (change) => {
        const newQuantity = quantity + change;
        if (newQuantity >= 1 && newQuantity <= (product?.quantity || 10)) {
            setQuantity(newQuantity);
        }
    };

    // Добавление товара в корзину с учетом цвета и длины
    const handleAddProductToCart = async () => {
        if (!product) return;

        const productData = {
            productId: product._id,
            quantity: quantity,
            flowerType: product.type,
            selectedColor: product.type === 'single' ? selectedColor : undefined,
            selectedStemLength: selectedStemLength
        };

        const result = await addFlowerToCart(productData);
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

    // Функция для добавления обёртки в корзину
    const handleAddWrapperToCart = async (wrapper) => {
        if (!product) return;

        const productData = {
            productId: product._id,
            quantity: quantity,
            flowerType: product.type,
            selectedColor: product.type === 'single' ? selectedColor : undefined,
            selectedStemLength: selectedStemLength,
            wrapper: {
                wrapperId: wrapper._id
            }
        };

        const result = await addFlowerToCart(productData);
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

    // Функция для добавления дополнения в корзину
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

    const handleAddToFavorites = async () => {
        if (!product) return;

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

    // Функции для работы с модальным окном
    const openModal = (product, type) => {
        setModalProduct(product);
        setModalType(type);
    };

    const closeModal = () => {
        setModalProduct(null);
        setModalType(null);
    };

    // Компонент секции обёрток
    const WrappersSection = () => {
        if (product?.type === 'bouquet') {
            return null;
        }

        if (loadingWrappers) {
            return (
                <section className="wrappers-section">
                    <div className="container-wide">
                        <h2 className="section-title">Обёртки</h2>
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
            <section className="wrappers-section">
                <div className="container-wide">
                    <div className="section-header">
                        <h2 className="section-title">Обёртки</h2>
                    </div>

                    <div className="cards-scroll-container">
                        <div className="cards-scroll-wrapper">
                            {wrappers.map((wrapper) => (
                                <div
                                    key={wrapper._id}
                                    className="product-card-wrapper"
                                    onClick={() => openModal(wrapper, 'wrapper')}
                                >
                                    <div className="product-card-image-container">
                                        <img
                                            src={getImageUrl(wrapper.image)}
                                            alt={wrapper.name}
                                            className="product-card-image"
                                            loading="lazy"
                                            onError={(e) => {
                                                e.target.src = '/images/placeholder-wrapper.jpg';
                                            }}
                                        />
                                        {wrapper.originalPrice && wrapper.originalPrice > wrapper.price && (
                                            <span className="discount-badge-card">
                                                -{Math.round((1 - wrapper.price / wrapper.originalPrice) * 100)}%
                                            </span>
                                        )}
                                    </div>

                                    <div className="product-card-info">
                                        <h3 className="product-card-name">
                                            {wrapper.name.length > 15 ? wrapper.name.slice(0, 15) + '…' : wrapper.name}
                                        </h3>
                                        <p className="product-card-description">
                                            {wrapper.description?.length > 20
                                                ? `${wrapper.description.slice(0, 20)}...`
                                                : wrapper.description || 'Стильная упаковка для вашего букета'
                                            }
                                        </p>

                                        <div className="product-card-price">
                                            {wrapper.originalPrice && wrapper.originalPrice > wrapper.price ? (
                                                <>
                                                    <span className="original-price-card">
                                                        {formatPrice(wrapper.originalPrice)}
                                                    </span>
                                                    <span className="current-price-card">
                                                        {formatPrice(wrapper.price)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="current-price-card">
                                                    {formatPrice(wrapper.price)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="product-card-actions">
                                            <button
                                                className="btn-add-to-cart-card"
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
                </div>
            </section>
        );
    };

    // Компонент секции дополнительных товаров
    const AddonsSection = () => {
        if (loadingAddons) {
            return (
                <section className="addons-section">
                    <div className="container-wide">
                        <h2 className="section-title">Дополнительные товары</h2>
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
            <section className="addons-section">
                <div className="container-wide">
                    <div className="section-header">
                        <h2 className="section-title">Дополнительные товары</h2>
                    </div>

                    <div className="cards-scroll-container">
                        <div className="cards-scroll-wrapper">
                            {addons.map((addon) => (
                                <div
                                    key={addon._id}
                                    className="product-card-addon"
                                    onClick={() => openModal(addon, 'addon')}
                                >
                                    <div className="product-card-image-container">
                                        <img
                                            src={getImageUrl(addon.image)}
                                            alt={addon.name}
                                            className="product-card-image"
                                            loading="lazy"
                                            onError={(e) => {
                                                e.target.src = '/images/placeholder-addon.jpg';
                                            }}
                                        />
                                        {addon.originalPrice && addon.originalPrice > addon.price && (
                                            <span className="discount-badge-card">
                                                -{Math.round((1 - addon.price / addon.originalPrice) * 100)}%
                                            </span>
                                        )}
                                        <span className="addon-type-badge">
                                            {addon.type === 'soft_toy' ? '🧸' :
                                                addon.type === 'candy_box' ? '🍬' :
                                                    addon.type === 'chocolate' ? '🍫' :
                                                        addon.type === 'card' ? '💌' :
                                                            addon.type === 'perfume' ? '💎' : '🎁'}
                                        </span>
                                    </div>

                                    <div className="product-card-info">
                                        <h3 className="product-card-name">
                                            {addon.name.length > 15 ? addon.name.slice(0, 15) + '…' : addon.name}
                                        </h3>
                                        <p className="product-card-description">
                                            {addon.description?.length > 20
                                                ? `${addon.description.slice(0, 20)}...`
                                                : addon.description || 'Отличное дополнение к вашему заказу'
                                            }
                                        </p>

                                        <div className="product-card-meta">
                                            <span className="product-card-type">
                                                {addon.type === 'soft_toy' ? 'Мягкая игрушка' :
                                                    addon.type === 'candy_box' ? 'Коробка конфет' :
                                                        addon.type === 'chocolate' ? 'Шоколад' :
                                                            addon.type === 'card' ? 'Открытка' :
                                                                addon.type === 'perfume' ? 'Парфюм' : 'Другое'}
                                            </span>
                                        </div>

                                        <div className="product-card-price">
                                            {addon.originalPrice && addon.originalPrice > addon.price ? (
                                                <>
                                                    <span className="original-price-card">
                                                        {formatPrice(addon.originalPrice)}
                                                    </span>
                                                    <span className="current-price-card">
                                                        {formatPrice(addon.price)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="current-price-card">
                                                    {formatPrice(addon.price)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="product-card-actions">
                                            <button
                                                className="btn-add-to-cart-card"
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
                </div>
            </section>
        );
    };

    if (loading) {
        return (
            <div className="product-details-page">
                <div className="container-wide">
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
                <div className="container-wide">
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

    const discountPercentage = getDiscountPercentage();

    return (
        <div className="product-details-page">
            <div className="container-wide">
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

                            {/* ПЕРЕНЕСЕННЫЙ ПОПУЛЯРНЫЙ ТЕГ */}
                            {product.soldCount > 0 && (
                                <span className="popular-tag-on-image">
                                    <span className="popular-badge-fire">🔥</span> Продано: <span style={{fontWeight:"bold"}}>{product.soldCount}</span>
                                </span>
                            )}

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
                            {discountPercentage > 0 && (
                                <span className="discount-badge-large">
                                    -{discountPercentage}%
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
                            {/*{product.soldCount > 0 && (*/}
                            {/*    <span className="popular-tag popular-tag-product-details">*/}
                            {/*        <span className="popular-badge-fire">🔥</span> Продано: <span style={{fontWeight:"bold"}}>{product.soldCount}</span>*/}
                            {/*    </span>*/}
                            {/*)}*/}
                        </div>

                        {/* Обновленное отображение цены */}
                        <div className="product-price-section">
                            {selectedStemLength?.originalPrice && selectedStemLength.originalPrice > selectedStemLength.price ? (
                                <div className="price-with-discount">
                                    <span className="original-price-large">
                                        {formatPrice(selectedStemLength.originalPrice)}
                                    </span>
                                    <span className="current-price-large">
                                        {formatPrice(selectedStemLength.price)}
                                    </span>
                                    {/*{discountPercentage > 0 && (*/}
                                    {/*    <span className="discount-percentage">*/}
                                    {/*        -{discountPercentage}%*/}
                                    {/*    </span>*/}
                                    {/*)}*/}
                                </div>
                            ) : product.originalPrice && product.originalPrice > getCurrentPrice() ? (
                                <div className="price-with-discount">
                                    <span className="original-price-large">
                                        {formatPrice(product.originalPrice)}
                                    </span>
                                    <span className="current-price-large">
                                        {formatPrice(getCurrentPrice())}
                                    </span>
                                    {discountPercentage > 0 && (
                                        <span className="discount-percentage">
                                            -{discountPercentage}%
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className="current-price-large">
                                    {formatPrice(getCurrentPrice())}
                                </span>
                            )}
                        </div>

                        <div className="product-description-full">
                            <h3>Описание</h3>
                            <p>{product.description}</p>
                        </div>

                        {/* Сводка выбранных опций */}
                        {(selectedColor || selectedStemLength) && (
                            <div className="selected-options-summary">
                                <div className="selected-option-item">
                                    <span className="selected-option-label">Выбранная длина:</span>
                                </div>
                                {/*{selectedColor && (*/}
                                {/*    <div className="selected-option-item">*/}
                                {/*        <span className="selected-option-label">Цвет:</span>*/}
                                {/*        <span className="selected-option-value">*/}
                                {/*            <div*/}
                                {/*                className="selected-color-preview"*/}
                                {/*                style={{ backgroundColor: selectedColor.value }}*/}
                                {/*            />*/}
                                {/*            {selectedColor.name}*/}
                                {/*        </span>*/}
                                {/*    </div>*/}
                                {/*)}*/}
                                {selectedStemLength && (
                                    <div className="selected-option-item">
                                        <span className="selected-option-label">Длина стебля:</span>
                                        <span className="selected-option-value">
                                            {selectedStemLength.length} см
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Блок выбора цвета и длины стебля */}
                        {product.type === 'single' && availableVariants.stemLengths.length > 0  && (<div className="product-variants">
                            {/*/!* Выбор цвета (только для одиночных цветов) *!/*/}
                            {/*{product.type === 'single' &&  availableVariants.colors.length > 0 && (*/}
                            {/*    <div className="variant-section">*/}
                            {/*        <h4>Цвет:</h4>*/}
                            {/*        <div className="color-options">*/}
                            {/*            {availableVariants.colors.map((color, index) => (*/}
                            {/*                <div*/}
                            {/*                    key={index}*/}
                            {/*                    className={`color-option ${selectedColor?.value === color.value ? 'selected' : ''}`}*/}
                            {/*                    onClick={() => setSelectedColor(color)}*/}
                            {/*                >*/}
                            {/*                    <div*/}
                            {/*                        className="color-swatch"*/}
                            {/*                        style={{backgroundColor: color.value}}*/}
                            {/*                        title={color.name}*/}
                            {/*                    />*/}
                            {/*                    <span className="color-name">{color.name}</span>*/}
                            {/*                </div>*/}
                            {/*            ))}*/}
                            {/*        </div>*/}
                            {/*    </div>*/}
                            {/*)}*/}

                            {/* Выбор длины стебля */}
                            {product.type === 'single' && availableVariants.stemLengths.length > 0 && (
                                <div className="variant-section">
                                    <h4>Длина стебля:</h4>
                                    <div className="stem-length-options">
                                        {availableVariants.stemLengths.map((stem, index) => (
                                            <div
                                                key={index}
                                                className={`stem-option ${selectedStemLength?.length === stem.length ? 'selected' : ''}`}
                                                onClick={() => setSelectedStemLength(stem)}
                                            >
                                                <span className="stem-length">{stem.length} см</span>
                                                <div className="stem-price">
                                                    <span className="current-price">
                                                        {formatPrice(stem.price)}
                                                    </span>
                                                    {stem.originalPrice && stem.originalPrice > stem.price && (
                                                        <span className="stem-original-price">
                                                            {formatPrice(stem.originalPrice)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>)}

                        {/* Характеристики товара */}
                        <div className="product-specs">
                            <div className="spec-item">
                                <span className="spec-label">Тип:</span>
                                <span className="spec-value">
                                    {product.type === 'single' ? '💐 Штучный цветок' : '💮 Букет'}
                                </span>
                            </div>

                            {product.occasion && product.occasion.trim() !== '' && (
                                <div className="spec-item">
                                    <span className="spec-label">Повод:</span>
                                    <span className="spec-value">{getOccasionLabel(product.occasion)}</span>
                                </div>
                            )}

                            {product.recipient && product.recipient.trim() !== '' && (
                                <div className="spec-item">
                                    <span className="spec-label">Кому:</span>
                                    <span className="spec-value">{getRecipientLabel(product.recipient)}</span>
                                </div>
                            )}

                            {product.flowerNames && product.flowerNames.length > 0 && product.flowerNames.some(name => name && name.trim() !== '') && (
                                <div className="spec-item">
                                    <span className="spec-label">Виды цветов:</span>
                                    <span className="spec-value">
                                        {product.flowerNames.filter(name => name && name.trim() !== '').join(', ')}
                                    </span>
                                </div>
                            )}

                            {selectedStemLength && (
                                <div className="spec-item">
                                    <span className="spec-label">Длина стебля:</span>
                                    <span className="spec-value">{selectedStemLength.length} см</span>
                                </div>
                            )}

                            {selectedColor && (
                                <div className="spec-item">
                                    <span className="spec-label">Цвет:</span>
                                    <span className="spec-value">
                                            <div
                                                className="selected-color-preview"
                                                style={{ backgroundColor: selectedColor.value }}
                                            />
                                        {selectedColor.name}
                                        </span>
                                </div>
                            )}

                            {product.characteristics && product.characteristics.length > 0 && (
                                <>
                                    <div className="specs-divider"></div>
                                    <div className="specs-section-title">Дополнительные характеристики</div>
                                    {product.characteristics.map((char, index) => (
                                        <div key={index} className="spec-item">
                                            <span className="spec-label">{char.name}:</span>
                                            <span className="spec-value">{char.value}</span>
                                        </div>
                                    ))}
                                </>
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
                                        disabled={quantity <= 1}
                                    >
                                        -
                                    </button>
                                    <span className="quantity-display quantity-display-color">{quantity}</span>
                                    <button
                                        className="quantity-btn"
                                        onClick={() => handleQuantityChange(1)}
                                        disabled={quantity >= (product.quantity || 10)}
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

                {/* Секция обёрток */}
                <WrappersSection />

                {/* Секция дополнительных товаров */}
                <AddonsSection />

                {/* Модальное окно */}
                {modalProduct && (
                    <ProductModal
                        product={modalProduct}
                        type={modalType}
                        onClose={closeModal}
                    />
                )}

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