// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useCart } from '../../contexts/CartContext';
// import { useAuth } from '../../contexts/AuthContext';
// import './CartPage.css';
//
// const CartPage = () => {
//     const { cart, updateCartItem, removeFromCart, clearCart, loading } = useCart();
//     const { isAuthenticated } = useAuth();
//     const navigate = useNavigate();
//     const [updatingItems, setUpdatingItems] = useState(new Set());
//
//     const formatPrice = (price) => {
//         return new Intl.NumberFormat('ru-RU', {
//             style: 'currency',
//             currency: 'KZT',
//             minimumFractionDigits: 0
//         }).format(price);
//     };
//
//     const handleQuantityChange = async (itemId, newQuantity) => {
//         if (newQuantity < 1) return;
//
//         setUpdatingItems(prev => new Set(prev).add(itemId));
//
//         const result = await updateCartItem(itemId, newQuantity);
//
//         setUpdatingItems(prev => {
//             const newSet = new Set(prev);
//             newSet.delete(itemId);
//             return newSet;
//         });
//
//         if (!result.success) {
//             alert(result.error);
//         }
//     };
//
//     const handleRemoveItem = async (itemId) => {
//         if (window.confirm('Вы уверены, что хотите удалить этот товар из корзины?')) {
//             const result = await removeFromCart(itemId);
//             if (!result.success) {
//                 alert(result.error);
//             }
//         }
//     };
//
//     const handleClearCart = async () => {
//         if (window.confirm('Вы уверены, что хотите очистить всю корзину?')) {
//             const result = await clearCart();
//             if (!result.success) {
//                 alert(result.error);
//             }
//         }
//     };
//
//     const handleCheckout = () => {
//         if (cart.items.length === 0) {
//             alert('Корзина пуста');
//             return;
//         }
//         navigate('/checkout');
//     };
//
//     const handleContinueShopping = () => {
//         navigate('/catalog');
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
//                     <h1 className="cart-title">Корзина</h1>
//                     {cart.items.length > 0 && (
//                         <button
//                             className="btn-clear-cart"
//                             onClick={handleClearCart}
//                         >
//                             Очистить корзину
//                         </button>
//                     )}
//                 </div>
//
//                 {cart.items.length === 0 ? (
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
//                             {cart.items.map((item) => (
//                                 <div key={item._id} className="cart-item">
//                                     <div className="item-image">
//                                         <img
//                                             src={item.image || '/images/placeholder-flower.jpg'}
//                                             alt={item.name}
//                                         />
//                                     </div>
//
//                                     <div className="item-details">
//                                         <h3 className="item-name">{item.name}</h3>
//
//                                         <div className="item-specs">
//                                             <span className="item-type">
//                                                 {item.flowerType === 'single' ? '💐 Одиночный цветок' : '💮 Букет'}
//                                             </span>
//                                             {item.flowerNames && item.flowerNames.length > 0 && (
//                                                 <span className="item-flowers">
//                                                     Цветы: {item.flowerNames.join(', ')}
//                                                 </span>
//                                             )}
//                                             {item.flowerColor && (
//                                                 <span className="item-color">
//                                                     Цвет: {item.flowerColor.name}
//                                                 </span>
//                                             )}
//                                         </div>
//
//                                         {/* Отображение обёртки */}
//                                         {item.wrapper && item.wrapper.wrapperId && (
//                                             <div className="item-wrapper">
//                                                 <span className="wrapper-label">Обёртка:</span>
//                                                 <span className="wrapper-name">{item.wrapper.name}</span>
//                                                 <span className="wrapper-price">
//                                                     +{formatPrice(item.wrapper.price)}
//                                                 </span>
//                                             </div>
//                                         )}
//
//                                         {/* Отображение дополнений */}
//                                         {item.addons && item.addons.length > 0 && (
//                                             <div className="item-addons">
//                                                 <span className="addons-label">Дополнения:</span>
//                                                 {item.addons.map((addon, index) => (
//                                                     <div key={index} className="addon-item">
//                                                         <span className="addon-name">{addon.name}</span>
//                                                         <span className="addon-quantity">×{addon.quantity}</span>
//                                                         <span className="addon-price">
//                                                             +{formatPrice(addon.price * addon.quantity)}
//                                                         </span>
//                                                     </div>
//                                                 ))}
//                                             </div>
//                                         )}
//                                     </div>
//
//                                     <div className="item-controls">
//                                         <div className="quantity-controls">
//                                             <button
//                                                 className="quantity-btn"
//                                                 onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
//                                                 disabled={item.quantity <= 1 || updatingItems.has(item._id)}
//                                             >
//                                                 -
//                                             </button>
//                                             <span className="quantity-display">
//                                                 {updatingItems.has(item._id) ? (
//                                                     <div className="mini-spinner"></div>
//                                                 ) : (
//                                                     item.quantity
//                                                 )}
//                                             </span>
//                                             <button
//                                                 className="quantity-btn"
//                                                 onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
//                                                 disabled={updatingItems.has(item._id)}
//                                             >
//                                                 +
//                                             </button>
//                                         </div>
//
//                                         <div className="item-price">
//                                             {formatPrice(item.itemTotal * item.quantity)}
//                                         </div>
//
//                                         <button
//                                             className="btn-remove-item"
//                                             onClick={() => handleRemoveItem(item._id)}
//                                             disabled={updatingItems.has(item._id)}
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
//         </div>
//     );
// };
//
// export default CartPage;







import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import './CartPage.css';

const CartPage = () => {
    const { cart, updateCartItem, removeFromCart, clearCart, loading } = useCart();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [updatingItems, setUpdatingItems] = useState(new Set());

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'KZT',
            minimumFractionDigits: 0
        }).format(price);
    };

    // Объединяем все товары для отображения
    const allItems = [
        ...cart.flowerItems.map(item => ({ ...item, itemType: 'flower' })),
        ...cart.addonItems.map(item => ({ ...item, itemType: 'addon' }))
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
            alert(result.error);
        }
    };

    const handleRemoveItem = async (itemId, itemType) => {
        if (window.confirm('Вы уверены, что хотите удалить этот товар из корзины?')) {
            const result = await removeFromCart(itemId, itemType);
            if (!result.success) {
                alert(result.error);
            }
        }
    };

    const handleClearCart = async () => {
        if (window.confirm('Вы уверены, что хотите очистить всю корзину?')) {
            const result = await clearCart();
            if (!result.success) {
                alert(result.error);
            }
        }
    };

    const handleCheckout = () => {
        if (allItems.length === 0) {
            alert('Корзина пуста');
            return;
        }
        navigate('/checkout');
    };

    const handleContinueShopping = () => {
        navigate('/catalog');
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
                    <h1 className="cart-title">Корзина</h1>
                    {allItems.length > 0 && (
                        <button
                            className="btn-clear-cart"
                            onClick={handleClearCart}
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
                                            src={item.image || '/images/placeholder-flower.jpg'}
                                            alt={item.name}
                                        />
                                        {item.itemType === 'addon' && (
                                            <div className="item-type-badge addon-badge">
                                                Дополнение
                                            </div>
                                        )}
                                    </div>

                                    <div className="item-details">
                                        <h3 className="item-name">{item.name}</h3>

                                        {item.itemType === 'flower' && (
                                            <div className="item-specs">
                                                <span className="item-type">
                                                    {item.flowerType === 'single' ? '💐 Одиночный цветок' : '💮 Букет'}
                                                </span>
                                                {item.flowerNames && item.flowerNames.length > 0 && (
                                                    <span className="item-flowers">
                                                        Цветы: {item.flowerNames.join(', ')}
                                                    </span>
                                                )}
                                                {item.flowerColor && (
                                                    <span className="item-color">
                                                        Цвет: {item.flowerColor.name}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {item.itemType === 'addon' && (
                                            <div className="item-specs">
                                                <span className="item-type">
                                                    {item.typeLabel || item.type}
                                                </span>
                                            </div>
                                        )}

                                        {/* Отображение обёртки (только для цветов) */}
                                        {item.itemType === 'flower' && item.wrapper && item.wrapper.wrapperId && (
                                            <div className="item-wrapper">
                                                <span className="wrapper-label">Обёртка:</span>
                                                <span className="wrapper-name">{item.wrapper.name}</span>
                                                <span className="wrapper-price">
                                                    +{formatPrice(item.wrapper.price)}
                                                </span>
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
                                            {formatPrice(item.itemTotal * item.quantity)}
                                        </div>

                                        <button
                                            className="btn-remove-item"
                                            onClick={() => handleRemoveItem(item._id, item.itemType)}
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
        </div>
    );
};

export default CartPage;