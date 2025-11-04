import React, {useEffect} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './OrderSuccess.css';

const OrderSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { orderId, orderTotal } = location.state || {};
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

    const handleContinueShopping = () => {
        navigate('/catalog');
    };

    // const handleTrackOrder = () => {
    //     // В будущем можно добавить страницу отслеживания заказа
    //     alert('Функция отслеживания заказа будет доступна в ближайшее время');
    // };

    return (
        <div className="order-success-page">
            <div className="container">
                <div className="success-content">
                    <div className="success-icon">🎉</div>

                    <h1 className="success-title">Заказ успешно оформлен!</h1>

                    <div className="success-message">
                        <p>Спасибо за ваш заказ! Мы уже начали его обработку.</p>
                        <p>В ближайшее время с вами свяжется наш менеджер для подтверждения заказа.</p>
                    </div>

                    {orderId && (
                        <div className="order-details">
                            <div className="order-detail">
                                <span className="detail-label">Номер заказа:</span>
                                <span className="detail-value">#{orderId}</span>
                            </div>
                            {orderTotal && (
                                <div className="order-detail">
                                    <span className="detail-label">Сумма заказа:</span>
                                    <span className="detail-value">{formatPrice(orderTotal)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="delivery-info">
                        <h3>Информация о доставке</h3>
                        <ul>
                            <li>📞 С вами свяжутся в течение 15 минут для подтверждения заказа</li>
                            <li>🚚 Бесплатная доставка по городу в течение 1-2 часов</li>
                            <li>💐 Все цветы проходят строгий контроль качества перед доставкой</li>
                        </ul>
                    </div>

                    <div className="success-actions">
                        <button
                            className="btn btn-primary"
                            onClick={handleContinueShopping}
                        >
                            Продолжить покупки
                        </button>
                        {/*<button*/}
                        {/*    className="btn btn-secondary"*/}
                        {/*    onClick={handleTrackOrder}*/}
                        {/*>*/}
                        {/*    Отследить заказ*/}
                        {/*</button>*/}
                    </div>

                    <div className="contact-info">
                        <p>Если у вас есть вопросы, звоните:</p>
                        <a href="tel:+77051234567" className="contact-phone">
                            +7 (705) 123-45-67
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;