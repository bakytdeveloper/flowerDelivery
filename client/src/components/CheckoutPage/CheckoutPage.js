import React, {useEffect, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import './CheckoutPage.css';

const CheckoutPage = () => {
    const { cart, clearCart } = useCart();
    const { isAuthenticated, user, token } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const [orderData, setOrderData] = useState({
        firstName: '',
        phoneNumber: '',
        address: '',
        paymentMethod: 'cash',
        comments: ''
    });

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

    // Прокрутка вверх при монтировании компонента и изменении фильтров
    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }, [location.search]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'KZT',
            minimumFractionDigits: 0
        }).format(price);
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setOrderData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!orderData.firstName || !orderData.phoneNumber || !orderData.address) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }

        setLoading(true);

        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            // Добавляем токен если пользователь авторизован
            if (isAuthenticated && token) {
                headers['Authorization'] = `Bearer ${token}`;
            } else {
                // Добавляем sessionId для гостей
                const sessionId = sessionStorage.getItem('guestSessionId');
                if (sessionId) {
                    headers['X-Session-Id'] = sessionId;
                }
            }

            const orderPayload = {
                firstName: orderData.firstName,
                phoneNumber: orderData.phoneNumber,
                address: orderData.address,
                paymentMethod: orderData.paymentMethod,
                comments: orderData.comments
            };

            // Добавляем информацию о пользователе если авторизован
            if (isAuthenticated && user && user._id) {
                // Используем безопасный доступ к _id
                orderPayload.user = user._id;
            } else {
                orderPayload.guestInfo = {
                    name: orderData.firstName,
                    email: '', // Можно добавить поле email для гостей
                    phone: orderData.phoneNumber
                };
            }

            console.log('📤 Отправка заказа:', orderPayload);
            console.log('🔑 Заголовки:', headers);

            const response = await fetch(`${apiUrl}/api/orders`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(orderPayload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка при оформлении заказа');
            }

            const result = await response.json();
            console.log('✅ Заказ создан успешно:', result);

            // Очищаем корзину после успешного заказа
            await clearCart();

            // Перенаправляем на страницу успеха
            navigate('/order-success', {
                state: {
                    orderId: result.order._id,
                    orderTotal: result.order.totalAmount
                }
            });

        } catch (error) {
            console.error('❌ Ошибка при оформлении заказа:', error);
            alert(error.message || 'Произошла ошибка при оформлении заказа');
        } finally {
            setLoading(false);
        }
    };

    // Объединяем товары для отображения с правильными изображениями
    const allItems = [
        ...(cart.flowerItems || []).map(item => ({
            ...item,
            itemType: 'flower',
            image: getImageUrl(item.image),
            displayPrice: calculateItemPrice(item)
        })),
        ...(cart.addonItems || []).map(item => ({
            ...item,
            itemType: 'addon',
            image: getImageUrl(item.image),
            typeLabel: getAddonTypeLabel(item.type),
            displayPrice: calculateItemPrice(item)
        }))
    ];

    if (allItems.length === 0) {
        return (
            <div className="checkout-page">
                <div className="container">
                    <div className="empty-cart-message">
                        <h2>Корзина пуста</h2>
                        <p>Добавьте товары в корзину перед оформлением заказа</p>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/catalog')}
                        >
                            Перейти в каталог
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <div className="container">
                <div className="checkout-header">
                    <h1 className="checkout-title">Оформление заказа</h1>
                    <button
                        className="btn-back btn-back-checkout-page"
                        onClick={() => navigate('/cart')}
                    >
                        ← Вернуться в корзину
                    </button>
                </div>

                <div className="checkout-content">
                    <div className="checkout-form-section">
                        <form onSubmit={handleSubmit} className="checkout-form">
                            <div className="form-section">
                                <h3>Контактная информация</h3>

                                <div className="form-group">
                                    <label htmlFor="firstName">Имя *</label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        value={orderData.firstName}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Введите ваше имя"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="phoneNumber">Телефон *</label>
                                    <input
                                        type="tel"
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        value={orderData.phoneNumber}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="+7 (XXX) XXX-XX-XX"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="address">Адрес доставки *</label>
                                    <textarea
                                        id="address"
                                        name="address"
                                        value={orderData.address}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Укажите полный адрес доставки"
                                        rows="3"
                                    />
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>Способ оплаты</h3>

                                <div className="payment-methods">
                                    <label className="payment-method">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="cash"
                                            checked={orderData.paymentMethod === 'cash'}
                                            onChange={handleInputChange}
                                        />
                                        <div className="payment-method-content">
                                            <span className="payment-icon">💵</span>
                                            <div>
                                                <div className="payment-name">Наличными при получении</div>
                                                <div className="payment-description">Оплата курьеру при доставке</div>
                                            </div>
                                        </div>
                                    </label>

                                    <label className="payment-method">
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="card"
                                            checked={orderData.paymentMethod === 'card'}
                                            onChange={handleInputChange}
                                        />
                                        <div className="payment-method-content">
                                            <span className="payment-icon">💳</span>
                                            <div>
                                                <div className="payment-name">Банковской картой онлайн</div>
                                                <div className="payment-description">Оплата через безопасный платежный шлюз</div>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>Дополнительная информация</h3>

                                <div className="form-group">
                                    <label htmlFor="comments">Комментарий к заказу</label>
                                    <textarea
                                        id="comments"
                                        name="comments"
                                        value={orderData.comments}
                                        onChange={handleInputChange}
                                        placeholder="Укажите дополнительные пожелания к заказу (необязательно)"
                                        rows="3"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn-place-order"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="spinner-small"></div>
                                        Оформление заказа...
                                    </>
                                ) : (
                                    `Оформить заказ за ${formatPrice(cart.total)}`
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="order-summary-section">
                        <div className="order-summary">
                            <h3>Ваш заказ</h3>

                            <div className="order-items">
                                {allItems.map((item) => (
                                    <div key={`${item.itemType}-${item._id}`} className="order-item">
                                        <div className="order-item-image">
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
                                                <div className="order-item-badge addon-badge">Доп.</div>
                                            )}
                                        </div>
                                        <div className="order-item-details">
                                            <div className="order-item-name">{item.name}</div>

                                            {/* Информация о типе товара */}
                                            {item.itemType === 'addon' && (
                                                <div className="order-item-type">
                                                    {item.typeLabel || getAddonTypeLabel(item.type)}
                                                </div>
                                            )}

                                            {item.itemType === 'flower' && (
                                                <>
                                                    <div className="order-item-spec">
                                                        {item.flowerType === 'single' ? '💐 Штучный цветок' : '💮 Букет'}
                                                    </div>
                                                    {item.flowerNames && item.flowerNames.length > 0 && (
                                                        <div className="order-item-spec">
                                                            {item.flowerNames.join(', ')}
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {/* Обертка для цветов */}
                                            {item.itemType === 'flower' && item.wrapper && item.wrapper.wrapperId && (
                                                <div className="order-item-wrapper">
                                                    🎁 {item.wrapper.name} (+{formatPrice(item.wrapper.price)})
                                                </div>
                                            )}

                                            <div className="order-item-quantity">×{item.quantity}</div>
                                        </div>
                                        <div className="order-item-price">
                                            {formatPrice(item.displayPrice)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="order-totals">
                                <div className="order-total-row">
                                    <span>Товары ({cart.totalItems} шт.)</span>
                                    <span>{formatPrice(cart.total)}</span>
                                </div>
                                <div className="order-total-row">
                                    <span>Доставка</span>
                                    <span className="free">Бесплатно</span>
                                </div>
                                <div className="order-total-divider"></div>
                                <div className="order-total-final">
                                    <span>Итого</span>
                                    <span>{formatPrice(cart.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;