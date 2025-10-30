// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../contexts/AuthContext';
// import { toast } from 'react-toastify';
// import './FavoritesPage.css';
//
// const FavoritesPage = () => {
//     const [favoriteProducts, setFavoriteProducts] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const navigate = useNavigate();
//     const { isAuthenticated, token } = useAuth();
//
//     // Прокрутка вверх при монтировании компонента
//     useEffect(() => {
//         window.scrollTo({
//             top: 0,
//             left: 0,
//             behavior: 'smooth'
//         });
//     }, []);
//
//     useEffect(() => {
//         if (!isAuthenticated) {
//             navigate('/login');
//             return;
//         }
//         fetchFavorites();
//         // eslint-disable-next-line
//     }, [isAuthenticated, navigate]);
//
//     const fetchFavorites = async () => {
//         try {
//             setLoading(true);
//             setError(null);
//
//             const decoded = JSON.parse(atob(token.split('.')[1]));
//             const userId = decoded.userId;
//
//             const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${userId}/favorites`, {
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                 },
//             });
//
//             if (!response.ok) {
//                 throw new Error('Ошибка при загрузке избранных товаров');
//             }
//
//             const favorites = await response.json();
//             setFavoriteProducts(favorites);
//         } catch (err) {
//             setError(err.message);
//             console.error('Error fetching favorites:', err);
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     const handleRemoveFromFavorites = async (productId) => {
//         try {
//             const decoded = JSON.parse(atob(token.split('.')[1]));
//             const userId = decoded.userId;
//
//             const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${userId}/favorites/${productId}`, {
//                 method: 'DELETE',
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                 },
//             });
//
//             if (!response.ok) {
//                 throw new Error('Ошибка при удалении из избранного');
//             }
//
//             setFavoriteProducts(prev => prev.filter(product => product._id !== productId));
//             toast.success('Товар удален из избранного');
//         } catch (error) {
//             console.error('Error removing from favorites:', error);
//             toast.error('Ошибка при удалении из избранного');
//         }
//     };
//
//     const handleProductClick = (productId) => {
//         navigate(`/product/${productId}`);
//     };
//
//     const handleAddToCart = (e, product) => {
//         e.stopPropagation();
//         console.log('Добавлено в корзину:', product);
//         toast.info('Товар добавлен в корзину');
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
//     if (loading) {
//         return (
//             <div className="favorites-page">
//                 <div className="container">
//                     <div className="favorites-loading">
//                         <div className="spinner-border text-primary" role="status">
//                             <span className="visually-hidden">Загрузка...</span>
//                         </div>
//                         <p>Загрузка избранных товаров...</p>
//                     </div>
//                 </div>
//             </div>
//         );
//     }
//
//     if (error) {
//         return (
//             <div className="favorites-page">
//                 <div className="container">
//                     <div className="favorites-error">
//                         <h2>Ошибка</h2>
//                         <p>{error}</p>
//                         <button
//                             className="btn btn-primary"
//                             onClick={fetchFavorites}
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
//         <div className="favorites-page">
//             <div className="container">
//
//                 {/* Заголовок как в каталоге */}
//                 <div className="favorites-header">
//                     {/* Хлебные крошки */}
//                     <nav className="breadcrumb-nav breadcrumb-nav-favorites">
//                         <button
//                             className="breadcrumb-back"
//                             onClick={() => navigate(-1)}
//                         >
//                             ← Назад
//                         </button>
//                         <span className="breadcrumb-separator">/</span>
//                         <button
//                             className="breadcrumb-link"
//                             onClick={() => navigate('/catalog')}
//                         >
//                             Каталог
//                         </button>
//                     </nav>
//                     <h1 className="favorites-title">Избранные товары</h1>
//                     <div className="favorites-info">
//                         <span className="favorites-count">
//                             {favoriteProducts.length > 0
//                                 ? `У вас ${favoriteProducts.length} избранных товаров`
//                                 : 'У вас пока нет избранных товаров'
//                             }
//                         </span>
//                     </div>
//                 </div>
//
//                 {/* Контент как в каталоге */}
//                 <div className="favorites-results">
//                     <p className="results-count">
//                         Найдено товаров: <strong>{favoriteProducts.length}</strong>
//                     </p>
//
//                     {favoriteProducts.length === 0 ? (
//                         <div className="no-products">
//                             <div className="empty-favorites-icon">💔</div>
//                             <h3>Список избранного пуст</h3>
//                             <p>Добавляйте товары в избранное, чтобы не потерять их</p>
//                             <button
//                                 className="btn btn-primary"
//                                 onClick={() => navigate('/catalog')}
//                             >
//                                 Перейти в каталог
//                             </button>
//                         </div>
//                     ) : (
//                         <div className="products-grid">
//                             {favoriteProducts.map((product) => (
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
//                                                 🔥 Популярный
//                                             </span>
//                                         )}
//                                         {/*<button*/}
//                                         {/*    className="remove-favorite-btn"*/}
//                                         {/*    onClick={(e) => {*/}
//                                         {/*        e.stopPropagation();*/}
//                                         {/*        handleRemoveFromFavorites(product._id);*/}
//                                         {/*    }}*/}
//                                         {/*    title="Удалить из избранного"*/}
//                                         {/*>*/}
//                                         {/*    ❌*/}
//                                         {/*</button>*/}
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
//                                                 className="btn-remove-favorite"
//                                                 onClick={(e) => {
//                                                     e.stopPropagation();
//                                                     handleRemoveFromFavorites(product._id);
//                                                 }}
//                                                 title="Удалить из избранного"
//                                             >
//                                                 Удалить
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
// export default FavoritesPage;






import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './FavoritesPage.css';

const FavoritesPage = () => {
    const [favoriteProducts, setFavoriteProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { isAuthenticated, token } = useAuth();

    // Прокрутка вверх при монтировании компонента
    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        fetchFavorites();
        // eslint-disable-next-line
    }, [isAuthenticated, navigate]);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            setError(null);

            // ИСПРАВЛЕННЫЙ URL: убрали userId из пути
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/favorites`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке избранных товаров');
            }

            const favorites = await response.json();

            // Обрабатываем разные возможные структуры ответа
            let favoritesArray = [];

            if (Array.isArray(favorites)) {
                // Прямой массив товаров
                favoritesArray = favorites;
            } else if (favorites.favorites && Array.isArray(favorites.favorites)) {
                // Объект с полем favorites
                favoritesArray = favorites.favorites;
            } else if (favorites.data && Array.isArray(favorites.data)) {
                // Объект с полем data
                favoritesArray = favorites.data;
            }

            setFavoriteProducts(favoritesArray);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching favorites:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromFavorites = async (productId) => {
        try {
            // ИСПРАВЛЕННЫЙ URL: убрали userId из пути
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/favorites/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Ошибка при удалении из избранного');
            }

            const result = await response.json();

            // Обновляем состояние на основе ответа сервера
            if (result.favorites && Array.isArray(result.favorites)) {
                setFavoriteProducts(result.favorites);
            } else {
                // Или просто фильтруем локально
                setFavoriteProducts(prev => prev.filter(product => product._id !== productId));
            }

            toast.success('Товар удален из избранного');
        } catch (error) {
            console.error('Error removing from favorites:', error);
            toast.error('Ошибка при удалении из избранного');
        }
    };

    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
    };

    const handleAddToCart = (e, product) => {
        e.stopPropagation();
        console.log('Добавлено в корзину:', product);
        toast.info('Товар добавлен в корзину');
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
            <div className="favorites-page">
                <div className="container">
                    <div className="favorites-loading">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Загрузка...</span>
                        </div>
                        <p>Загрузка избранных товаров...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="favorites-page">
                <div className="container">
                    <div className="favorites-error">
                        <h2>Ошибка</h2>
                        <p>{error}</p>
                        <button
                            className="btn btn-primary"
                            onClick={fetchFavorites}
                        >
                            Попробовать снова
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="favorites-page">
            <div className="container">

                {/* Заголовок как в каталоге */}
                <div className="favorites-header">
                    {/* Хлебные крошки */}
                    <nav className="breadcrumb-nav breadcrumb-nav-favorites">
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
                    </nav>
                    <h1 className="favorites-title">Избранные товары</h1>
                    <div className="favorites-info">
                        <span className="favorites-count">
                            {favoriteProducts.length > 0
                                ? `У вас ${favoriteProducts.length} избранных товаров`
                                : 'У вас пока нет избранных товаров'
                            }
                        </span>
                    </div>
                </div>

                {/* Контент как в каталоге */}
                <div className="favorites-results">
                    <p className="results-count">
                        Найдено товаров: <strong>{favoriteProducts.length}</strong>
                    </p>

                    {favoriteProducts.length === 0 ? (
                        <div className="no-products">
                            <div className="empty-favorites-icon">💔</div>
                            <h3>Список избранного пуст</h3>
                            <p>Добавляйте товары в избранное, чтобы не потерять их</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate('/catalog')}
                            >
                                Перейти в каталог
                            </button>
                        </div>
                    ) : (
                        <div className="products-grid">
                            {favoriteProducts.map((product) => (
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
                                                🔥 Популярный
                                            </span>
                                        )}
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
                                            <button
                                                className="btn-remove-favorite"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveFromFavorites(product._id);
                                                }}
                                                title="Удалить из избранного"
                                            >
                                                Удалить
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

export default FavoritesPage;