// import React, { useState, useEffect } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { useFavorites } from '../../hooks/useFavorites';
// import { useCart } from '../../contexts/CartContext';
// import './CatalogPage.css';
//
// const CatalogPage = () => {
//     const [products, setProducts] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [filters, setFilters] = useState({
//         type: '',
//         occasion: '',
//         recipient: '',
//         search: ''
//     });
//     const location = useLocation();
//     const navigate = useNavigate();
//     const { toggleFavorite, isFavorite } = useFavorites();
//     const { addToCart } = useCart();
//
//     // Прокрутка вверх при монтировании компонента и изменении фильтров
//     useEffect(() => {
//         window.scrollTo({
//             top: 0,
//             left: 0,
//             behavior: 'smooth'
//         });
//     }, [location.search]);
//
//     // Парсим параметры URL при загрузке и изменении location
//     useEffect(() => {
//         const searchParams = new URLSearchParams(location.search);
//         const newFilters = {
//             type: searchParams.get('type') || '',
//             occasion: searchParams.get('occasion') || '',
//             recipient: searchParams.get('recipient') || '',
//             search: searchParams.get('search') || ''
//         };
//
//         setFilters(newFilters);
//         fetchProducts(newFilters);
//     }, [location.search]);
//
//     const fetchProducts = async (filterParams) => {
//         try {
//             setLoading(true);
//             setError(null);
//
//             const queryParams = new URLSearchParams();
//
//             if (filterParams.type) queryParams.append('type', filterParams.type);
//             if (filterParams.occasion) queryParams.append('occasion', filterParams.occasion);
//             if (filterParams.recipient) queryParams.append('recipient', filterParams.recipient);
//             if (filterParams.search) queryParams.append('search', filterParams.search);
//
//             const url = `${process.env.REACT_APP_API_URL}/api/products?${queryParams.toString()}`;
//             const response = await fetch(url);
//
//             if (!response.ok) {
//                 throw new Error('Ошибка при загрузке товаров');
//             }
//
//             const data = await response.json();
//             setProducts(data.products || []);
//         } catch (err) {
//             setError(err.message);
//             console.error('Error fetching products:', err);
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     // Функция для обработки клика по карточке товара
//     const handleProductClick = (productId) => {
//         navigate(`/product/${productId}`);
//     };
//
//     // Функция для добавления в корзину
//     const handleAddToCart = async (e, product) => {
//         e.stopPropagation(); // Останавливаем всплытие события
//
//         const result = await addToCart(product, 1); // quantity по умолчанию 1
//         if (result.success) {
//             alert('Товар добавлен в корзину!');
//         } else {
//             alert(result.error);
//         }
//     };
//
//     // Функция для добавления/удаления из избранного
//     const handleToggleFavorite = async (e, product) => {
//         e.stopPropagation();
//         const success = await toggleFavorite(product._id, isFavorite(product._id));
//         if (success) {
//             // Можно обновить локальное состояние если нужно
//         }
//     };
//
//     const clearFilters = () => {
//         navigate('/catalog');
//     };
//
//     const formatPrice = (price) => {
//         return new Intl.NumberFormat('ru-RU', {
//             style: 'currency',
//             currency: 'KZT',
//             minimumFractionDigits: 0
//         }).format(price);
//     };
//
//     const getActiveFiltersText = () => {
//         const activeFilters = [];
//         if (filters.type) activeFilters.push(`Тип: ${filters.type === 'single' ? 'Одиночные' : 'Букеты'}`);
//         if (filters.occasion) activeFilters.push(`Повод: ${filters.occasion}`);
//         if (filters.recipient) activeFilters.push(`Кому: ${filters.recipient}`);
//         if (filters.search) activeFilters.push(`Поиск: "${filters.search}"`);
//
//         return activeFilters.length > 0 ? activeFilters.join(', ') : 'Все товары';
//     };
//
//     if (loading) {
//         return (
//             <div className="catalog-page">
//                 <div className="container">
//                     <div className="catalog-loading">
//                         <div className="spinner-border text-primary" role="status">
//                             <span className="visually-hidden">Загрузка...</span>
//                         </div>
//                         <p>Загрузка товаров...</p>
//                     </div>
//                 </div>
//             </div>
//         );
//     }
//
//     if (error) {
//         return (
//             <div className="catalog-page">
//                 <div className="container">
//                     <div className="catalog-error">
//                         <h2>Ошибка</h2>
//                         <p>{error}</p>
//                         <button
//                             className="btn btn-primary"
//                             onClick={() => window.location.reload()}
//                         >
//                             Попробовать снова
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         );
//     }
//
//     return (
//         <div className="catalog-page">
//             <div className="container">
//                 {/* Заголовок и фильтры */}
//                 <div className="catalog-header">
//                     <h1 className="catalog-title">Каталог цветов</h1>
//                     <div className="catalog-filters-info">
//                         <span className="active-filters">{getActiveFiltersText()}</span>
//                         {(filters.type || filters.occasion || filters.recipient || filters.search) && (
//                             <button
//                                 className="clear-filters-btn"
//                                 onClick={clearFilters}
//                             >
//                                 Очистить фильтры
//                             </button>
//                         )}
//                     </div>
//                 </div>
//
//                 {/* Результаты поиска */}
//                 <div className="catalog-results">
//                     <p className="results-count">
//                         Найдено товаров: <strong>{products.length}</strong>
//                     </p>
//
//                     {products.length === 0 ? (
//                         <div className="no-products">
//                             <h3>Товары не найдены</h3>
//                             <p>Попробуйте изменить параметры фильтрации</p>
//                             <button
//                                 className="btn btn-primary"
//                                 onClick={clearFilters}
//                             >
//                                 Показать все товары
//                             </button>
//                         </div>
//                     ) : (
//                         <div className="products-grid">
//                             {products.map((product) => (
//                                 <div
//                                     key={product._id}
//                                     className="product-card"
//                                     onClick={() => handleProductClick(product._id)}
//                                     style={{ cursor: 'pointer' }}
//                                 >
//                                     <div className="product-image-container">
//                                         <img
//                                             src={product.images?.[0] || '/images/placeholder-flower.jpg'}
//                                             alt={product.name}
//                                             className="product-image"
//                                         />
//                                         {product.discountPercentage > 0 && (
//                                             <span className="discount-badge">
//                                                 -{product.discountPercentage}%
//                                             </span>
//                                         )}
//                                         {product.soldCount > 0 && (
//                                             <span className="popular-badge">
//                                                 <span className="popular-badge-fire">🔥</span> Популярный
//                                             </span>
//                                         )}
//                                     </div>
//
//                                     <div className="cart-product-info">
//                                         <h3 className="product-name">{product.name}</h3>
//                                         <p className="product-description">
//                                             {product.description?.length > 20
//                                                 ? `${product.description.slice(0, 20)}...`
//                                                 : product.description
//                                             }
//                                         </p>
//
//                                         <div className="product-meta">
//                                             <span className={`product-type ${product.type}`}>
//                                                 {product.type === 'single' ? '💐 Одиночный' : '💮 Букет'}
//                                             </span>
//                                             <span className="product-occasion">
//                                                 {product.occasion}
//                                             </span>
//                                         </div>
//
//                                         <div className="product-price">
//                                             {product.originalPrice && product.originalPrice > product.price ? (
//                                                 <>
//                                                     <span className="original-price">
//                                                         {formatPrice(product.originalPrice)}
//                                                     </span>
//                                                     <span className="current-price">
//                                                         {formatPrice(product.price)}
//                                                     </span>
//                                                 </>
//                                             ) : (
//                                                 <span className="current-price">
//                                                     {formatPrice(product.price)}
//                                                 </span>
//                                             )}
//                                         </div>
//
//                                         <div className="product-actions">
//                                             <button
//                                                 className="btn-add-to-cart"
//                                                 onClick={(e) => handleAddToCart(e, product)}
//                                             >
//                                                 В корзину
//                                             </button>
//                                             <button
//                                                 className={`btn-favorite ${isFavorite(product._id) ? 'favorited' : ''}`}
//                                                 onClick={(e) => handleToggleFavorite(e, product)}
//                                             >
//                                                 {isFavorite(product._id) ? '❤️' : '♡'}
//                                             </button>
//                                         </div>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// };
//
// export default CatalogPage;




import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFavorites } from '../../hooks/useFavorites';
import { useCart } from '../../contexts/CartContext';
import './CatalogPage.css';

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
    const location = useLocation();
    const navigate = useNavigate();
    const { toggleFavorite, isFavorite, fetchFavorites } = useFavorites();
    const { addToCart } = useCart();

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
        const newFilters = {
            type: searchParams.get('type') || '',
            occasion: searchParams.get('occasion') || '',
            recipient: searchParams.get('recipient') || '',
            search: searchParams.get('search') || ''
        };

        setFilters(newFilters);
        fetchProducts(newFilters);
    }, [location.search]);

    const fetchProducts = async (filterParams) => {
        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams();

            if (filterParams.type) queryParams.append('type', filterParams.type);
            if (filterParams.occasion) queryParams.append('occasion', filterParams.occasion);
            if (filterParams.recipient) queryParams.append('recipient', filterParams.recipient);
            if (filterParams.search) queryParams.append('search', filterParams.search);

            const url = `${process.env.REACT_APP_API_URL}/api/products?${queryParams.toString()}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Ошибка при загрузке товаров');
            }

            const data = await response.json();
            setProducts(data.products || []);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching products:', err);
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
            alert('Товар добавлен в корзину!');
        } else {
            alert(result.error);
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

    const clearFilters = () => {
        navigate('/catalog');
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
                    <p className="results-count">
                        Найдено товаров: <strong>{products.length}</strong>
                    </p>

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
                        <div className="products-grid">
                            {products.map((product) => (
                                <div
                                    key={product._id}
                                    className="product-card"
                                    onClick={() => handleProductClick(product._id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="product-image-container">
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

                                        {/* Кнопка избранного в углу карточки */}
                                        <button
                                            className={`favorite-heart-btn ${isFavorite(product._id) ? 'favorited' : ''}`}
                                            onClick={(e) => handleToggleFavorite(e, product)}
                                            title={isFavorite(product._id) ? 'Удалить из избранного' : 'Добавить в избранное'}
                                        >
                                            {isFavorite(product._id) ? '❤️' : '🤍'}
                                        </button>
                                    </div>

                                    <div className="cart-product-info">
                                        <h3 className="product-name">{product.name}</h3>
                                        <p className="product-description">
                                            {product.description?.length > 20
                                                ? `${product.description.slice(0, 20)}...`
                                                : product.description
                                            }
                                        </p>

                                        <div className="product-meta">
                                            <span className={`product-type ${product.type}`}>
                                                {product.type === 'single' ? '💐 Одиночный' : '💮 Букет'}
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

                                        <div className="product-actions">
                                            <button
                                                className="btn-add-to-cart"
                                                onClick={(e) => handleAddToCart(e, product)}
                                            >
                                                В корзину
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CatalogPage;