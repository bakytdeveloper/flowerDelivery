import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFavorites } from '../../hooks/useFavorites';
import { useCart } from '../../contexts/CartContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './CatalogPage.css';
import {occasionOptions} from "../../constants/constants";

const CatalogPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        type: '',
        occasion: '',
        recipient: '',
        search: ''
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 15
    });

    const location = useLocation();
    const navigate = useNavigate();
    const { toggleFavorite, isFavorite, fetchFavorites } = useFavorites();
    const { addToCart } = useCart();

    // Функции для получения переведенных значений
    const getOccasionLabel = (occasionValue) => {
        const occasion = occasionOptions.find(opt => opt.value === occasionValue);
        return occasion ? occasion.label : occasionValue;
    };

    // Прокрутка вверх при монтировании компонента и изменении фильтров
    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }, [location.search]);

    // Загружаем избранные товары при монтировании
    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    // Парсим параметры URL при загрузке и изменении location
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const page = parseInt(searchParams.get('page')) || 1;

        const newFilters = {
            type: searchParams.get('type') || '',
            occasion: searchParams.get('occasion') || '',
            recipient: searchParams.get('recipient') || '',
            search: searchParams.get('search') || ''
        };

        setFilters(newFilters);
        setPagination(prev => ({...prev, currentPage: page}));
        fetchProducts(newFilters, page);
    }, [location.search]);

    const fetchProducts = async (filterParams, page = 1) => {
        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams();

            if (filterParams.type) queryParams.append('type', filterParams.type);
            if (filterParams.occasion) queryParams.append('occasion', filterParams.occasion);
            if (filterParams.recipient) queryParams.append('recipient', filterParams.recipient);
            if (filterParams.search) queryParams.append('search', filterParams.search);

            queryParams.append('page', page);
            queryParams.append('limit', 15);

            const url = `${process.env.REACT_APP_API_URL}/api/products?${queryParams.toString()}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Ошибка при загрузке товаров');
            }

            const data = await response.json();
            setProducts(data.products || []);
            setPagination({
                currentPage: data.currentPage || 1,
                totalPages: data.totalPages || 1,
                totalCount: data.totalCount || 0,
                limit: data.limit || 15
            });
        } catch (err) {
            setError(err.message);
            console.error('Error fetching products:', err);
            toast.error('Ошибка при загрузке товаров');
        } finally {
            setLoading(false);
        }
    };

    // Функция для обработки клика по карточке товара
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
        const wasFavorite = isFavorite(product._id);
        const success = await toggleFavorite(product._id, wasFavorite);

        if (success) {
            if (wasFavorite) {
                toast.info('Товар удален из избранного', {
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
            } else {
                toast.success('Товар добавлен в избранное! ❤️', {
                    position: "top-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
            }
            // Обновляем локальное состояние после успешного действия
            await fetchFavorites();
        } else {
            toast.error('Ошибка при изменении избранного', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        }
    };

    const clearFilters = () => {
        navigate('/catalog');
        toast.info('Фильтры очищены', {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
        });
    };

    const handlePageChange = (newPage) => {
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('page', newPage);
        navigate(`/catalog?${searchParams.toString()}`);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'KZT',
            minimumFractionDigits: 0
        }).format(price);
    };

    const getActiveFiltersText = () => {
        const activeFilters = [];
        if (filters.type) activeFilters.push(`Тип: ${filters.type === 'single' ? 'Одиночные' : 'Букеты'}`);
        if (filters.occasion) activeFilters.push(`Повод: ${filters.occasion}`);
        if (filters.recipient) activeFilters.push(`Кому: ${filters.recipient}`);
        if (filters.search) activeFilters.push(`Поиск: "${filters.search}"`);

        return activeFilters.length > 0 ? activeFilters.join(', ') : 'Все товары';
    };

    // Функция для рендеринга пагинации
    const renderPagination = () => {
        if (pagination.totalPages <= 1) return null;

        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Кнопка "Назад"
        if (pagination.currentPage > 1) {
            pages.push(
                <button
                    key="prev"
                    className="pagination-btn"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                >
                    ←
                </button>
            );
        }

        // Первая страница
        if (startPage > 1) {
            pages.push(
                <button
                    key={1}
                    className="pagination-btn"
                    onClick={() => handlePageChange(1)}
                >
                    1
                </button>
            );
            if (startPage > 2) {
                pages.push(<span key="ellipsis1" className="pagination-ellipsis">...</span>);
            }
        }

        // Основные страницы
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    className={`pagination-btn ${pagination.currentPage === i ? 'active' : ''}`}
                    onClick={() => handlePageChange(i)}
                >
                    {i}
                </button>
            );
        }

        // Последняя страница
        if (endPage < pagination.totalPages) {
            if (endPage < pagination.totalPages - 1) {
                pages.push(<span key="ellipsis2" className="pagination-ellipsis">...</span>);
            }
            pages.push(
                <button
                    key={pagination.totalPages}
                    className="pagination-btn"
                    onClick={() => handlePageChange(pagination.totalPages)}
                >
                    {pagination.totalPages}
                </button>
            );
        }

        // Кнопка "Вперед"
        if (pagination.currentPage < pagination.totalPages) {
            pages.push(
                <button
                    key="next"
                    className="pagination-btn"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                >
                    →
                </button>
            );
        }

        return pages;
    };

    if (loading) {
        return (
            <div className="catalog-page">
                <div className="container">
                    <div className="catalog-loading">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Загрузка...</span>
                        </div>
                        <p>Загрузка товаров...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="catalog-page">
                <div className="container">
                    <div className="catalog-error">
                        <h2>Ошибка</h2>
                        <p>{error}</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => window.location.reload()}
                        >
                            Попробовать снова
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="catalog-page">
            <div className="container">
                {/* Заголовок и фильтры */}
                <div className="catalog-header">
                    <h1 className="catalog-title">Каталог цветов</h1>
                    <div className="catalog-filters-info">
                        <span className="active-filters">{getActiveFiltersText()}</span>
                        {(filters.type || filters.occasion || filters.recipient || filters.search) && (
                            <button
                                className="clear-filters-btn"
                                onClick={clearFilters}
                            >
                                Очистить фильтры
                            </button>
                        )}
                    </div>
                </div>

                {/* Результаты поиска */}
                <div className="catalog-results">
                    <div className="results-info">
                        <p className="results-count">
                            Найдено товаров: <strong>{pagination.totalCount}</strong>
                        </p>
                        {pagination.totalPages > 1 && (
                            <div className="pagination-info">
                                Страница {pagination.currentPage} из {pagination.totalPages}
                            </div>
                        )}
                    </div>

                    {products.length === 0 ? (
                        <div className="no-products">
                            <h3>Товары не найдены</h3>
                            <p>Попробуйте изменить параметры фильтрации</p>
                            <button
                                className="btn btn-primary"
                                onClick={clearFilters}
                            >
                                Показать все товары
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="products-grid products-grid-catalog">
                                {products.map((product) => (
                                    <div
                                        key={product._id}
                                        className="product-card-catalog"
                                        onClick={() => handleProductClick(product._id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="product-image-container product-image-container-catalog">
                                            <img
                                                src={product.images?.[0] || '/images/placeholder-flower.jpg'}
                                                alt={product.name}
                                                className="product-image"
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
                                                    {getOccasionLabel(product.occasion)}
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

                                                {/* Кнопка избранного теперь внизу рядом с кнопкой корзины */}
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

                            {/* Пагинация */}
                            {pagination.totalPages > 1 && (
                                <div className="pagination-container">
                                    <div className="pagination">
                                        {renderPagination()}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CatalogPage;