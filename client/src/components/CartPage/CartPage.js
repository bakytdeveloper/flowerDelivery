// import React, { useEffect, useState } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useCart } from '../../contexts/CartContext';
// import { useAuth } from '../../contexts/AuthContext';
// import { toast } from 'react-toastify';
// import './CartPage.css';
//
// const CartPage = () => {
//     const { cart, updateCartItem, removeFromCart, clearCart, updateWrapper, loading } = useCart();
//     const { isAuthenticated } = useAuth();
//     const navigate = useNavigate();
//     const [updatingItems, setUpdatingItems] = useState(new Set());
//     const [selectedWrapperImage, setSelectedWrapperImage] = useState(null);
//     const [showRemoveItemModal, setShowRemoveItemModal] = useState(false);
//     const [showClearCartModal, setShowClearCartModal] = useState(false);
//     const [showRemoveWrapperModal, setShowRemoveWrapperModal] = useState(false);
//     const [itemToRemove, setItemToRemove] = useState(null);
//     const [wrapperToRemove, setWrapperToRemove] = useState(null);
//     const location = useLocation();
//
//     const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5506';
//
//     // Функция для прокрутки наверх
//     const scrollToTop = () => {
//         window.scrollTo({
//             top: 0,
//             left: 0,
//             behavior: 'smooth'
//         });
//     };
//
//     // Прокрутка вверх при монтировании компонента и изменении фильтров
//     useEffect(() => {
//         scrollToTop();
//     }, [location.search]);
//
//     // Прокрутка наверх при открытии модальных окон
//     useEffect(() => {
//         if (showRemoveItemModal || showClearCartModal || showRemoveWrapperModal || selectedWrapperImage) {
//             scrollToTop();
//         }
//     }, [showRemoveItemModal, showClearCartModal, showRemoveWrapperModal, selectedWrapperImage]);
//
//     // Функция для получения корректного URL изображения
//     const getImageUrl = (imagePath) => {
//         if (!imagePath) {
//             return '/images/placeholder-addon.jpg';
//         }
//
//         // Если это уже полный URL (включая base64)
//         if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
//             return imagePath;
//         }
//
//         // Если это путь к файлу на сервере
//         if (imagePath.startsWith('/')) {
//             return `${apiUrl}${imagePath}`;
//         }
//
//         // Если это относительный путь
//         return `${apiUrl}/uploads/${imagePath}`;
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
//     // Функция для получения переведенного типа доп. товара
//     const getAddonTypeLabel = (type) => {
//         switch (type) {
//             case 'soft_toy': return '🧸 Мягкая игрушка';
//             case 'candy_box': return '🍬 Коробка конфет';
//             case 'chocolate': return '🍫 Шоколад';
//             case 'card': return '💌 Открытка';
//             case 'perfume': return '💎 Парфюм';
//             default: return '🎁 Дополнительный товар';
//         }
//     };
//
//     // Объединяем все товары для отображения
//     const allItems = [
//         ...cart.flowerItems.map(item => ({
//             ...item,
//             itemType: 'flower',
//             image: getImageUrl(item.image)
//         })),
//         ...cart.addonItems.map(item => ({
//             ...item,
//             itemType: 'addon',
//             image: getImageUrl(item.image),
//             typeLabel: getAddonTypeLabel(item.type)
//         }))
//     ];
//
//     const handleQuantityChange = async (itemId, newQuantity, itemType) => {
//         if (newQuantity < 1) return;
//
//         setUpdatingItems(prev => new Set(prev).add(`${itemId}-${itemType}`));
//
//         const result = await updateCartItem(itemId, newQuantity, itemType);
//
//         setUpdatingItems(prev => {
//             const newSet = new Set(prev);
//             newSet.delete(`${itemId}-${itemType}`);
//             return newSet;
//         });
//
//         if (!result.success) {
//             toast.error(result.error, {
//                 position: "top-right",
//                 autoClose: 3000,
//                 hideProgressBar: false,
//                 closeOnClick: true,
//                 pauseOnHover: true,
//                 draggable: true,
//             });
//         } else {
//             toast.success('Количество обновлено', {
//                 position: "top-right",
//                 autoClose: 2000,
//                 hideProgressBar: true,
//             });
//         }
//     };
//
//     // Удаление товара
//     const handleRemoveItemClick = (itemId, itemType) => {
//         setItemToRemove({ itemId, itemType });
//         setShowRemoveItemModal(true);
//     };
//
//     const confirmRemoveItem = async () => {
//         if (!itemToRemove) return;
//
//         const result = await removeFromCart(itemToRemove.itemId, itemToRemove.itemType);
//         setShowRemoveItemModal(false);
//         setItemToRemove(null);
//
//         if (result.success) {
//             toast.success('Товар удален из корзины', {
//                 position: "top-right",
//                 autoClose: 2000,
//                 hideProgressBar: true,
//             });
//         } else {
//             toast.error(result.error, {
//                 position: "top-right",
//                 autoClose: 3000,
//                 hideProgressBar: false,
//             });
//         }
//     };
//
//     // Очистка корзины
//     const handleClearCartClick = () => {
//         setShowClearCartModal(true);
//     };
//
//     const confirmClearCart = async () => {
//         const result = await clearCart();
//         setShowClearCartModal(false);
//
//         if (result.success) {
//             toast.success('Корзина очищена', {
//                 position: "top-right",
//                 autoClose: 2000,
//                 hideProgressBar: true,
//             });
//         } else {
//             toast.error(result.error, {
//                 position: "top-right",
//                 autoClose: 3000,
//                 hideProgressBar: false,
//             });
//         }
//     };
//
//     // Удаление обёртки
//     const handleRemoveWrapperClick = (itemId) => {
//         setWrapperToRemove(itemId);
//         setShowRemoveWrapperModal(true);
//     };
//
//     const confirmRemoveWrapper = async () => {
//         if (!wrapperToRemove) return;
//
//         const result = await updateWrapper(wrapperToRemove, null);
//         setShowRemoveWrapperModal(false);
//         setWrapperToRemove(null);
//
//         if (result.success) {
//             toast.success('Обёртка удалена', {
//                 position: "top-right",
//                 autoClose: 2000,
//                 hideProgressBar: true,
//             });
//         } else {
//             toast.error(result.error, {
//                 position: "top-right",
//                 autoClose: 3000,
//                 hideProgressBar: false,
//             });
//         }
//     };
//
//     const handleShowWrapperImage = (wrapper) => {
//         setSelectedWrapperImage({
//             ...wrapper,
//             image: getImageUrl(wrapper.image)
//         });
//     };
//
//     const handleCloseWrapperImage = () => {
//         setSelectedWrapperImage(null);
//     };
//
//     const handleCheckout = () => {
//         if (allItems.length === 0) {
//             toast.warning('Корзина пуста', {
//                 position: "top-center",
//                 autoClose: 3000,
//                 hideProgressBar: false,
//             });
//             return;
//         }
//         navigate('/checkout');
//     };
//
//     const handleContinueShopping = () => {
//         navigate('/catalog');
//     };
//
//     // Функция для расчета цены товара
//     const calculateItemPrice = (item) => {
//         if (item.itemType === 'addon') {
//             // Для дополнительных товаров: цена * количество
//             return (item.price || item.itemTotal || 0) * item.quantity;
//         } else {
//             // Для цветов: используем itemTotal * количество
//             return (item.itemTotal || 0) * item.quantity;
//         }
//     };
//
//     if (loading) {
//         return (
//             <div className="cart-page">
//                 <div className="container">
//                     <div className="cart-loading">
//                         <div className="spinner-border text-primary" role="status">
//                             <span className="visually-hidden">Загрузка...</span>
//                         </div>
//                         <p>Загрузка корзины...</p>
//                     </div>
//                 </div>
//             </div>
//         );
//     }
//
//     return (
//         <div className="cart-page">
//             <div className="container">
//                 <div className="cart-header">
//                     {/* Хлебные крошки */}
//                     <nav className="breadcrumb-nav">
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
//                     <div>
//                         <h1 className="cart-title-page">Корзина</h1>
//                     </div>
//                     {allItems.length > 0 && (
//                         <button
//                             className="btn-clear-cart"
//                             onClick={handleClearCartClick}
//                         >
//                             Очистить корзину
//                         </button>
//                     )}
//                 </div>
//
//                 {allItems.length === 0 ? (
//                     <div className="empty-cart">
//                         <div className="empty-cart-content">
//                             <div className="empty-cart-icon">🛒</div>
//                             <h2>Ваша корзина пуста</h2>
//                             <p>Добавьте товары из каталога, чтобы сделать заказ</p>
//                             <button
//                                 className="btn btn-primary"
//                                 onClick={handleContinueShopping}
//                             >
//                                 Перейти в каталог
//                             </button>
//                         </div>
//                     </div>
//                 ) : (
//                     <div className="cart-content">
//                         <div className="cart-items">
//                             {allItems.map((item) => (
//                                 <div key={`${item.itemType}-${item._id}`} className="cart-item">
//                                     <div className="item-image">
//                                         <img
//                                             src={item.image}
//                                             alt={item.name}
//                                             onError={(e) => {
//                                                 if (item.itemType === 'addon') {
//                                                     e.target.src = '/images/placeholder-addon.jpg';
//                                                 } else {
//                                                     e.target.src = '/images/placeholder-flower.jpg';
//                                                 }
//                                             }}
//                                         />
//                                         {item.itemType === 'addon' && (
//                                             <div className="item-type-badge addon-badge">
//                                                 Дополнение
//                                             </div>
//                                         )}
//                                     </div>
//
//                                     <div className="item-details">
//                                         <h3 className="item-name">{item.name}</h3>
//
//                                         {item.itemType === 'flower' && (
//                                             <div className="item-specs">
//                                                 <span className="item-type">
//                                                     {item.flowerType === 'single' ? '💐 Штучный цветок' : '💮 Букет'}
//                                                 </span>
//                                                 {item.flowerNames && item.flowerNames.length > 0 && (
//                                                     <span className="item-flowers">
//                                                         Цветы: {item.flowerNames.join(', ')}
//                                                     </span>
//                                                 )}
//                                                 {item.flowerColor && (
//                                                     <span className="item-color">
//                                                         Цвет: {item.flowerColor.name}
//                                                     </span>
//                                                 )}
//                                             </div>
//                                         )}
//
//                                         {item.itemType === 'addon' && (
//                                             <div className="item-specs">
//                                                 <span className="item-type">
//                                                     {item.typeLabel || getAddonTypeLabel(item.type)}
//                                                 </span>
//                                             </div>
//                                         )}
//
//                                         {/* Обновленное отображение обёртки (только для цветов) */}
//                                         {item.itemType === 'flower' && item.wrapper && item.wrapper.wrapperId && (
//                                             <div className="item-wrapper">
//                                                 <div className="wrapper-header">
//                                                     <span className="wrapper-label">Обёртка:</span>
//                                                     <span className="wrapper-name">{item.wrapper.name}</span>
//                                                     <span className="wrapper-price">
//                                                         {item.flowerType === 'single' ?
//                                                             `+${formatPrice(item.wrapper.price)} (за заказ)` :
//                                                             `+${formatPrice(item.wrapper.price)} за шт.`
//                                                         }
//                                                     </span>
//                                                 </div>
//
//                                                 <div className="wrapper-preview">
//                                                     <div
//                                                         className="wrapper-image-thumbnail"
//                                                         onClick={() => handleShowWrapperImage(item.wrapper)}
//                                                     >
//                                                         <img
//                                                             src={getImageUrl(item.wrapper.image)}
//                                                             alt={item.wrapper.name}
//                                                             onError={(e) => {
//                                                                 e.target.src = '/images/placeholder-wrapper.jpg';
//                                                             }}
//                                                         />
//                                                         <span className="wrapper-preview-text">👁️ Посмотреть</span>
//                                                     </div>
//                                                 </div>
//
//                                                 <div className="wrapper-controls">
//                                                     <button
//                                                         className="btn-remove-wrapper"
//                                                         onClick={() => handleRemoveWrapperClick(item._id)}
//                                                     >
//                                                         Удалить
//                                                     </button>
//                                                 </div>
//                                             </div>
//                                         )}
//                                     </div>
//
//                                     <div className="item-controls">
//                                         <div className="quantity-controls">
//                                             <button
//                                                 className="quantity-btn"
//                                                 onClick={() => handleQuantityChange(item._id, item.quantity - 1, item.itemType)}
//                                                 disabled={item.quantity <= 1 || updatingItems.has(`${item._id}-${item.itemType}`)}
//                                             >
//                                                 -
//                                             </button>
//                                             <span className="quantity-display">
//                                                 {updatingItems.has(`${item._id}-${item.itemType}`) ? (
//                                                     <div className="mini-spinner"></div>
//                                                 ) : (
//                                                     item.quantity
//                                                 )}
//                                             </span>
//                                             <button
//                                                 className="quantity-btn"
//                                                 onClick={() => handleQuantityChange(item._id, item.quantity + 1, item.itemType)}
//                                                 disabled={updatingItems.has(`${item._id}-${item.itemType}`)}
//                                             >
//                                                 +
//                                             </button>
//                                         </div>
//
//                                         <div className="item-price">
//                                             {formatPrice(calculateItemPrice(item))}
//                                         </div>
//
//                                         <button
//                                             className="btn-remove-item"
//                                             onClick={() => handleRemoveItemClick(item._id, item.itemType)}
//                                             disabled={updatingItems.has(`${item._id}-${item.itemType}`)}
//                                         >
//                                             🗑️
//                                         </button>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//
//                         <div className="cart-summary">
//                             <div className="summary-card">
//                                 <h3 className="summary-title">Итого</h3>
//
//                                 <div className="summary-row">
//                                     <span>Товары ({cart.totalItems} шт.)</span>
//                                     <span>{formatPrice(cart.total)}</span>
//                                 </div>
//
//                                 <div className="summary-row">
//                                     <span>Доставка</span>
//                                     <span className="free-shipping">Бесплатно</span>
//                                 </div>
//
//                                 <div className="summary-divider"></div>
//
//                                 <div className="summary-total">
//                                     <span>Общая сумма</span>
//                                     <span className="total-price">{formatPrice(cart.total)}</span>
//                                 </div>
//
//                                 {!isAuthenticated && (
//                                     <div className="guest-notice">
//                                         <p>💡 Для быстрого оформления заказа рекомендуем войти в систему</p>
//                                     </div>
//                                 )}
//
//                                 <button
//                                     className="btn-checkout"
//                                     onClick={handleCheckout}
//                                 >
//                                     Перейти к оформлению
//                                 </button>
//
//                                 <button
//                                     className="btn-continue-shopping"
//                                     onClick={handleContinueShopping}
//                                 >
//                                     Продолжить покупки
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </div>
//
//             {/* Модальное окно для просмотра картинки обертки */}
//             {selectedWrapperImage && (
//                 <div className="wrapper-image-modal-cart" onClick={handleCloseWrapperImage}>
//                     <div className="modal-content-wrapper-image-cart" onClick={(e) => e.stopPropagation()}>
//                         <button className="modal-close-wrapper-image-cart" onClick={handleCloseWrapperImage}>
//                             ×
//                         </button>
//                         <div className="modal-image-container-cart">
//                             <img
//                                 src={selectedWrapperImage.image}
//                                 alt={selectedWrapperImage.name}
//                                 onError={(e) => {
//                                     e.target.src = '/images/placeholder-wrapper.jpg';
//                                 }}
//                             />
//                         </div>
//                         <div className="modal-info-cart">
//                             <h3>{selectedWrapperImage.name}</h3>
//                             <p className="modal-price-cart">{formatPrice(selectedWrapperImage.price)}</p>
//                         </div>
//                     </div>
//                 </div>
//             )}
//
//             {/* Модальное окно удаления товара */}
//             {showRemoveItemModal && (
//                 <div className="modal-overlay-cart" onClick={() => setShowRemoveItemModal(false)}>
//                     <div className="confirmation-modal-cart" onClick={(e) => e.stopPropagation()}>
//                         <div className="modal-header-cart">
//                             <h3>Удаление товара</h3>
//                             <button className="modal-close-cart" onClick={() => setShowRemoveItemModal(false)}>×</button>
//                         </div>
//                         <div className="modal-body-cart">
//                             <p>Вы уверены, что хотите удалить этот товар из корзины?</p>
//                         </div>
//                         <div className="modal-footer-cart">
//                             <button
//                                 className="btn btn-outline-cart"
//                                 onClick={() => setShowRemoveItemModal(false)}
//                             >
//                                 Отмена
//                             </button>
//                             <button
//                                 className="btn btn-danger-cart"
//                                 onClick={confirmRemoveItem}
//                             >
//                                 Удалить
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//
//             {/* Модальное окно очистки корзины */}
//             {showClearCartModal && (
//                 <div className="modal-overlay-cart" onClick={() => setShowClearCartModal(false)}>
//                     <div className="confirmation-modal-cart" onClick={(e) => e.stopPropagation()}>
//                         <div className="modal-header-cart">
//                             <h3>Очистка корзины</h3>
//                             <button className="modal-close-cart" onClick={() => setShowClearCartModal(false)}>×</button>
//                         </div>
//                         <div className="modal-body-cart">
//                             <p>Вы уверены, что хотите очистить всю корзину?</p>
//                             <p className="warning-text-cart">Это действие нельзя отменить.</p>
//                         </div>
//                         <div className="modal-footer-cart">
//                             <button
//                                 className="btn btn-outline-cart"
//                                 onClick={() => setShowClearCartModal(false)}
//                             >
//                                 Отмена
//                             </button>
//                             <button
//                                 className="btn btn-danger-cart"
//                                 onClick={confirmClearCart}
//                             >
//                                 Очистить корзину
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//
//             {/* Модальное окно удаления обёртки */}
//             {showRemoveWrapperModal && (
//                 <div className="modal-overlay-cart" onClick={() => setShowRemoveWrapperModal(false)}>
//                     <div className="confirmation-modal-cart" onClick={(e) => e.stopPropagation()}>
//                         <div className="modal-header-cart">
//                             <h3>Удаление обёртки</h3>
//                             <button className="modal-close-cart" onClick={() => setShowRemoveWrapperModal(false)}>×</button>
//                         </div>
//                         <div className="modal-body-cart">
//                             <p>Вы уверены, что хотите удалить обёртку?</p>
//                         </div>
//                         <div className="modal-footer-cart">
//                             <button
//                                 className="btn btn-outline-cart"
//                                 onClick={() => setShowRemoveWrapperModal(false)}
//                             >
//                                 Отмена
//                             </button>
//                             <button
//                                 className="btn btn-danger-cart"
//                                 onClick={confirmRemoveWrapper}
//                             >
//                                 Удалить
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };
//
// export default CartPage;


import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './CartPage.css';

const CartPage = () => {
    const { cart, updateCartItem, removeFromCart, clearCart, updateWrapper, loading } = useCart();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [updatingItems, setUpdatingItems] = useState(new Set());
    const [selectedWrapperImage, setSelectedWrapperImage] = useState(null);
    const [showRemoveItemModal, setShowRemoveItemModal] = useState(false);
    const [showClearCartModal, setShowClearCartModal] = useState(false);
    const [showRemoveWrapperModal, setShowRemoveWrapperModal] = useState(false);
    const [itemToRemove, setItemToRemove] = useState(null);
    const [wrapperToRemove, setWrapperToRemove] = useState(null);
    const location = useLocation();

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5506';

    // Функция для прокрутки наверх
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    };

    // Прокрутка вверх при монтировании компонента и изменении фильтров
    useEffect(() => {
        scrollToTop();
    }, [location.search]);

    // Прокрутка наверх при открытии модальных окон
    useEffect(() => {
        if (showRemoveItemModal || showClearCartModal || showRemoveWrapperModal || selectedWrapperImage) {
            scrollToTop();
        }
    }, [showRemoveItemModal, showClearCartModal, showRemoveWrapperModal, selectedWrapperImage]);

    // Функция для получения корректного URL изображения
    const getImageUrl = (imagePath) => {
        if (!imagePath) {
            return '/images/placeholder-addon.jpg';
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

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'KZT',
            minimumFractionDigits: 0
        }).format(price);
    };

    // Функция для получения переведенного типа доп. товара
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

    // Объединяем все товары для отображения
    const allItems = [
        ...cart.flowerItems.map(item => ({
            ...item,
            itemType: 'flower',
            image: getImageUrl(item.image)
        })),
        ...cart.addonItems.map(item => ({
            ...item,
            itemType: 'addon',
            image: getImageUrl(item.image),
            typeLabel: getAddonTypeLabel(item.type)
        }))
    ];

    const handleQuantityChange = async (itemId, newQuantity, itemType) => {
        if (newQuantity < 1) return;

        setUpdatingItems(prev => new Set(prev).add(`${itemId}-${itemType}`));

        const result = await updateCartItem(itemId, newQuantity, itemType);

        setUpdatingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(`${itemId}-${itemType}`);
            return newSet;
        });

        if (!result.success) {
            toast.error(result.error, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } else {
            toast.success('Количество обновлено', {
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: true,
            });
        }
    };

    // Удаление товара
    const handleRemoveItemClick = (itemId, itemType) => {
        setItemToRemove({ itemId, itemType });
        setShowRemoveItemModal(true);
    };

    const confirmRemoveItem = async () => {
        if (!itemToRemove) return;

        const result = await removeFromCart(itemToRemove.itemId, itemToRemove.itemType);
        setShowRemoveItemModal(false);
        setItemToRemove(null);

        if (result.success) {
            toast.success('Товар удален из корзины', {
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: true,
            });
        } else {
            toast.error(result.error, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
            });
        }
    };

    // Очистка корзины
    const handleClearCartClick = () => {
        setShowClearCartModal(true);
    };

    const confirmClearCart = async () => {
        const result = await clearCart();
        setShowClearCartModal(false);

        if (result.success) {
            toast.success('Корзина очищена', {
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: true,
            });
        } else {
            toast.error(result.error, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
            });
        }
    };

    // Удаление обёртки
    const handleRemoveWrapperClick = (itemId) => {
        setWrapperToRemove(itemId);
        setShowRemoveWrapperModal(true);
    };

    const confirmRemoveWrapper = async () => {
        if (!wrapperToRemove) return;

        const result = await updateWrapper(wrapperToRemove, null);
        setShowRemoveWrapperModal(false);
        setWrapperToRemove(null);

        if (result.success) {
            toast.success('Обёртка удалена', {
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: true,
            });
        } else {
            toast.error(result.error, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
            });
        }
    };

    const handleShowWrapperImage = (wrapper) => {
        setSelectedWrapperImage({
            ...wrapper,
            image: getImageUrl(wrapper.image)
        });
    };

    const handleCloseWrapperImage = () => {
        setSelectedWrapperImage(null);
    };

    const handleCheckout = () => {
        if (allItems.length === 0) {
            toast.warning('Корзина пуста', {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: false,
            });
            return;
        }
        navigate('/checkout');
    };

    const handleContinueShopping = () => {
        navigate('/catalog');
    };

    // Функция для расчета цены товара
    const calculateItemPrice = (item) => {
        if (item.itemType === 'addon') {
            // Для дополнительных товаров: цена * количество
            return (item.price || item.itemTotal || 0) * item.quantity;
        } else {
            // Для цветов: используем itemTotal * количество
            return (item.itemTotal || 0) * item.quantity;
        }
    };

    // Функция для отображения информации о выбранном цвете
    const renderColorInfo = (item) => {
        if (item.itemType === 'flower' && item.selectedColor) {
            return (
                <div className="item-color-info">
                    <span className="color-label">Цвет:</span>
                    <div className="color-display">
                        <div
                            className="color-swatch-small"
                            style={{ backgroundColor: item.selectedColor.value }}
                            title={item.selectedColor.name}
                        />
                        <span className="color-name">{item.selectedColor.name}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Функция для отображения информации о выбранной длине стебля
    const renderStemLengthInfo = (item) => {
        if (item.itemType === 'flower' && item.selectedStemLength) {
            return (
                <div className="item-stem-info">
                    <span className="stem-label">Длина стебля:</span>
                    <span className="stem-value">
                        {item.selectedStemLength.length} см - {formatPrice(item.selectedStemLength.price)}
                    </span>
                </div>
            );
        }
        return null;
    };

    // Функция для отображения цены за единицу с учетом длины стебля
    const renderUnitPrice = (item) => {
        if (item.itemType === 'flower') {
            const unitPrice = item.selectedStemLength ? item.selectedStemLength.price : item.price;
            return (
                <div className="item-unit-price">
                    {formatPrice(unitPrice)} за шт.
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="cart-page">
                <div className="container">
                    <div className="cart-loading">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Загрузка...</span>
                        </div>
                        <p>Загрузка корзины...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-page">
            <div className="container">
                <div className="cart-header">
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
                    </nav>
                    <div>
                        <h1 className="cart-title-page">Корзина</h1>
                    </div>
                    {allItems.length > 0 && (
                        <button
                            className="btn-clear-cart"
                            onClick={handleClearCartClick}
                        >
                            Очистить корзину
                        </button>
                    )}
                </div>

                {allItems.length === 0 ? (
                    <div className="empty-cart">
                        <div className="empty-cart-content">
                            <div className="empty-cart-icon">🛒</div>
                            <h2>Ваша корзина пуста</h2>
                            <p>Добавьте товары из каталога, чтобы сделать заказ</p>
                            <button
                                className="btn btn-primary"
                                onClick={handleContinueShopping}
                            >
                                Перейти в каталог
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="cart-content">
                        <div className="cart-items">
                            {allItems.map((item) => (
                                <div key={`${item.itemType}-${item._id}`} className="cart-item">
                                    <div className="item-image">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            onError={(e) => {
                                                if (item.itemType === 'addon') {
                                                    e.target.src = '/images/placeholder-addon.jpg';
                                                } else {
                                                    e.target.src = '/images/placeholder-flower.jpg';
                                                }
                                            }}
                                        />
                                        {item.itemType === 'addon' && (
                                            <div className="item-type-badge addon-badge">
                                                Дополнение
                                            </div>
                                        )}
                                        {item.itemType === 'flower' && item.selectedColor && (
                                            <div
                                                className="color-indicator"
                                                style={{ backgroundColor: item.selectedColor.value }}
                                                title={item.selectedColor.name}
                                            />
                                        )}
                                    </div>

                                    <div className="item-details">
                                        <h3 className="item-name">{item.name}</h3>

                                        {item.itemType === 'flower' && (
                                            <div className="item-specs">
                                                <span className="item-type">
                                                    {item.flowerType === 'single' ? '💐 Штучный цветок' : '💮 Букет'}
                                                </span>
                                                {item.flowerNames && item.flowerNames.length > 0 && (
                                                    <span className="item-flowers">
                                                        Цветы: {item.flowerNames.join(', ')}
                                                    </span>
                                                )}

                                                {/* Отображение выбранного цвета */}
                                                {renderColorInfo(item)}

                                                {/* Отображение выбранной длины стебля */}
                                                {renderStemLengthInfo(item)}
                                            </div>
                                        )}

                                        {item.itemType === 'addon' && (
                                            <div className="item-specs">
                                                <span className="item-type">
                                                    {item.typeLabel || getAddonTypeLabel(item.type)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Отображение цены за единицу */}
                                        {renderUnitPrice(item)}

                                        {/* Обновленное отображение обёртки (только для цветов) */}
                                        {item.itemType === 'flower' && item.wrapper && item.wrapper.wrapperId && (
                                            <div className="item-wrapper">
                                                <div className="wrapper-header">
                                                    <span className="wrapper-label">Обёртка:</span>
                                                    <span className="wrapper-name">{item.wrapper.name}</span>
                                                    <span className="wrapper-price">
                                                        {item.flowerType === 'single' ?
                                                            `+${formatPrice(item.wrapper.price)} (за заказ)` :
                                                            `+${formatPrice(item.wrapper.price)} за шт.`
                                                        }
                                                    </span>
                                                </div>

                                                <div className="wrapper-preview">
                                                    <div
                                                        className="wrapper-image-thumbnail"
                                                        onClick={() => handleShowWrapperImage(item.wrapper)}
                                                    >
                                                        <img
                                                            src={getImageUrl(item.wrapper.image)}
                                                            alt={item.wrapper.name}
                                                            onError={(e) => {
                                                                e.target.src = '/images/placeholder-wrapper.jpg';
                                                            }}
                                                        />
                                                        <span className="wrapper-preview-text">👁️ Посмотреть</span>
                                                    </div>
                                                </div>

                                                <div className="wrapper-controls">
                                                    <button
                                                        className="btn-remove-wrapper"
                                                        onClick={() => handleRemoveWrapperClick(item._id)}
                                                    >
                                                        Удалить
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="item-controls">
                                        <div className="quantity-controls">
                                            <button
                                                className="quantity-btn"
                                                onClick={() => handleQuantityChange(item._id, item.quantity - 1, item.itemType)}
                                                disabled={item.quantity <= 1 || updatingItems.has(`${item._id}-${item.itemType}`)}
                                            >
                                                -
                                            </button>
                                            <span className="quantity-display">
                                                {updatingItems.has(`${item._id}-${item.itemType}`) ? (
                                                    <div className="mini-spinner"></div>
                                                ) : (
                                                    item.quantity
                                                )}
                                            </span>
                                            <button
                                                className="quantity-btn"
                                                onClick={() => handleQuantityChange(item._id, item.quantity + 1, item.itemType)}
                                                disabled={updatingItems.has(`${item._id}-${item.itemType}`)}
                                            >
                                                +
                                            </button>
                                        </div>

                                        <div className="item-price">
                                            {formatPrice(calculateItemPrice(item))}
                                        </div>

                                        <button
                                            className="btn-remove-item"
                                            onClick={() => handleRemoveItemClick(item._id, item.itemType)}
                                            disabled={updatingItems.has(`${item._id}-${item.itemType}`)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="cart-summary">
                            <div className="summary-card">
                                <h3 className="summary-title">Итого</h3>

                                <div className="summary-row">
                                    <span>Товары ({cart.totalItems} шт.)</span>
                                    <span>{formatPrice(cart.total)}</span>
                                </div>

                                <div className="summary-row">
                                    <span>Доставка</span>
                                    <span className="free-shipping">Бесплатно</span>
                                </div>

                                <div className="summary-divider"></div>

                                <div className="summary-total">
                                    <span>Общая сумма</span>
                                    <span className="total-price">{formatPrice(cart.total)}</span>
                                </div>

                                {!isAuthenticated && (
                                    <div className="guest-notice">
                                        <p>💡 Для быстрого оформления заказа рекомендуем войти в систему</p>
                                    </div>
                                )}

                                <button
                                    className="btn-checkout"
                                    onClick={handleCheckout}
                                >
                                    Перейти к оформлению
                                </button>

                                <button
                                    className="btn-continue-shopping"
                                    onClick={handleContinueShopping}
                                >
                                    Продолжить покупки
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Модальное окно для просмотра картинки обертки */}
            {selectedWrapperImage && (
                <div className="wrapper-image-modal-cart" onClick={handleCloseWrapperImage}>
                    <div className="modal-content-wrapper-image-cart" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-wrapper-image-cart" onClick={handleCloseWrapperImage}>
                            ×
                        </button>
                        <div className="modal-image-container-cart">
                            <img
                                src={selectedWrapperImage.image}
                                alt={selectedWrapperImage.name}
                                onError={(e) => {
                                    e.target.src = '/images/placeholder-wrapper.jpg';
                                }}
                            />
                        </div>
                        <div className="modal-info-cart">
                            <h3>{selectedWrapperImage.name}</h3>
                            <p className="modal-price-cart">{formatPrice(selectedWrapperImage.price)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно удаления товара */}
            {showRemoveItemModal && (
                <div className="modal-overlay-cart" onClick={() => setShowRemoveItemModal(false)}>
                    <div className="confirmation-modal-cart" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-cart">
                            <h3>Удаление товара</h3>
                            <button className="modal-close-cart" onClick={() => setShowRemoveItemModal(false)}>×</button>
                        </div>
                        <div className="modal-body-cart">
                            <p>Вы уверены, что хотите удалить этот товар из корзины?</p>
                        </div>
                        <div className="modal-footer-cart">
                            <button
                                className="btn btn-outline-cart"
                                onClick={() => setShowRemoveItemModal(false)}
                            >
                                Отмена
                            </button>
                            <button
                                className="btn btn-danger-cart"
                                onClick={confirmRemoveItem}
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно очистки корзины */}
            {showClearCartModal && (
                <div className="modal-overlay-cart" onClick={() => setShowClearCartModal(false)}>
                    <div className="confirmation-modal-cart" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-cart">
                            <h3>Очистка корзины</h3>
                            <button className="modal-close-cart" onClick={() => setShowClearCartModal(false)}>×</button>
                        </div>
                        <div className="modal-body-cart">
                            <p>Вы уверены, что хотите очистить всю корзину?</p>
                            <p className="warning-text-cart">Это действие нельзя отменить.</p>
                        </div>
                        <div className="modal-footer-cart">
                            <button
                                className="btn btn-outline-cart"
                                onClick={() => setShowClearCartModal(false)}
                            >
                                Отмена
                            </button>
                            <button
                                className="btn btn-danger-cart"
                                onClick={confirmClearCart}
                            >
                                Очистить корзину
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно удаления обёртки */}
            {showRemoveWrapperModal && (
                <div className="modal-overlay-cart" onClick={() => setShowRemoveWrapperModal(false)}>
                    <div className="confirmation-modal-cart" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-cart">
                            <h3>Удаление обёртки</h3>
                            <button className="modal-close-cart" onClick={() => setShowRemoveWrapperModal(false)}>×</button>
                        </div>
                        <div className="modal-body-cart">
                            <p>Вы уверены, что хотите удалить обёртку?</p>
                        </div>
                        <div className="modal-footer-cart">
                            <button
                                className="btn btn-outline-cart"
                                onClick={() => setShowRemoveWrapperModal(false)}
                            >
                                Отмена
                            </button>
                            <button
                                className="btn btn-danger-cart"
                                onClick={confirmRemoveWrapper}
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;