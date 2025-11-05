import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './ProfilePage.css';
import {useLocation} from "react-router-dom";

const ProfilePage = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        address: '',
        phoneNumber: ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [orders, setOrders] = useState([]);
    const [userStats, setUserStats] = useState({
        totalOrders: 0,
        totalSpent: 0,
        favoriteCount: 0
    });
    const [loading, setLoading] = useState(false);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const location = useLocation();
    const { token, user } = useAuth();
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5506';

    // Загрузка данных профиля
    useEffect(() => {
        fetchProfileData();
        fetchUserStats();
    }, []);

    // Прокрутка вверх при монтировании компонента и изменении фильтров
    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }, [location.search]);

    // Загрузка заказов при переключении на вкладку
    useEffect(() => {
        if (activeTab === 'orders') {
            fetchOrders();
        }
    }, [activeTab]);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${apiUrl}/api/users/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка загрузки профиля');
            }

            const userData = await response.json();
            setProfileData({
                name: userData.name || '',
                email: userData.email || '',
                address: userData.address || '',
                phoneNumber: userData.phoneNumber || ''
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Ошибка загрузки профиля');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            setOrdersLoading(true);
            const response = await fetch(`${apiUrl}/api/users/orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка загрузки заказов');
            }

            const data = await response.json();
            setOrders(data.orders || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Ошибка загрузки заказов');
        } finally {
            setOrdersLoading(false);
        }
    };

    const fetchUserStats = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/users/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const stats = await response.json();
                setUserStats(stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await fetch(`${apiUrl}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка обновления профиля');
            }

            toast.success('Профиль успешно обновлен!');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.message || 'Ошибка обновления профиля');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Пароли не совпадают');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Пароль должен содержать минимум 6 символов');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${apiUrl}/api/users/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка обновления пароля');
            }

            toast.success('Пароль успешно обновлен!');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error) {
            console.error('Error updating password:', error);
            toast.error(error.message || 'Ошибка обновления пароля');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'KZT',
            minimumFractionDigits: 0
        }).format(price);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusText = (status) => {
        const statusMap = {
            'pending': 'Ожидание',
            'inProgress': 'В обработке',
            'completed': 'Завершен',
            'cancelled': 'Отменен'
        };
        return statusMap[status] || status;
    };

    const getStatusClass = (status) => {
        const classMap = {
            'pending': 'status-pending',
            'inProgress': 'status-in-progress',
            'completed': 'status-completed',
            'cancelled': 'status-cancelled'
        };
        return classMap[status] || '';
    };

    return (
        <div className="profile-page">
            <div className="container">
                <div className="profile-header">
                    <h1>Мой профиль</h1>
                    <p>Управление вашей учетной записью и заказами</p>
                </div>

                <div className="profile-stats">
                    <div className="stat-card">
                        <div className="stat-number">{userStats.totalOrders}</div>
                        <div className="stat-label">Всего заказов</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{formatPrice(userStats.totalSpent)}</div>
                        <div className="stat-label">Общая сумма</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{userStats.favoriteCount}</div>
                        <div className="stat-label">Избранные товары</div>
                    </div>
                </div>

                <div className="profile-content">
                    <div className="profile-sidebar">
                        <button
                            className={`sidebar-tab ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            📝 Личные данные
                        </button>
                        <button
                            className={`sidebar-tab ${activeTab === 'password' ? 'active' : ''}`}
                            onClick={() => setActiveTab('password')}
                        >
                            🔒 Смена пароля
                        </button>
                        <button
                            className={`sidebar-tab ${activeTab === 'orders' ? 'active' : ''}`}
                            onClick={() => setActiveTab('orders')}
                        >
                            📦 История заказов
                        </button>
                    </div>

                    <div className="profile-main">
                        {activeTab === 'profile' && (
                            <div className="tab-content">
                                <h2>Личные данные</h2>
                                <form onSubmit={handleProfileUpdate} className="profile-form">
                                    <div className="form-group">
                                        <label htmlFor="name">Имя</label>
                                        <input
                                            type="text"
                                            id="name"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="email">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="phoneNumber">Телефон</label>
                                        <input
                                            type="tel"
                                            id="phoneNumber"
                                            value={profileData.phoneNumber}
                                            onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                                            placeholder="+7 (XXX) XXX-XX-XX"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="address">Адрес доставки</label>
                                        <textarea
                                            id="address"
                                            value={profileData.address}
                                            onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                                            rows="3"
                                            placeholder="Введите ваш адрес для доставки"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? 'Сохранение...' : 'Сохранить изменения'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'password' && (
                            <div className="tab-content">
                                <h2>Смена пароля</h2>
                                <form onSubmit={handlePasswordUpdate} className="profile-form">
                                    <div className="form-group">
                                        <label htmlFor="currentPassword">Текущий пароль</label>
                                        <input
                                            type="password"
                                            id="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="newPassword">Новый пароль</label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                            required
                                            minLength="6"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="confirmPassword">Подтвердите новый пароль</label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                            required
                                            minLength="6"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? 'Обновление...' : 'Обновить пароль'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div className="tab-content">
                                <h2>История заказов</h2>

                                {ordersLoading ? (
                                    <div className="loading">Загрузка заказов...</div>
                                ) : orders.length === 0 ? (
                                    <div className="no-orders">
                                        <p>У вас пока нет заказов</p>
                                        <a href="/catalog" className="btn-primary">Перейти к покупкам</a>
                                    </div>
                                ) : (
                                    <div className="orders-list">
                                        {orders.map((order) => (
                                            <div key={order._id} className="order-card">
                                                <div className="order-header">
                                                    <div className="order-info">
                                                        <h3>Заказ #{order._id.slice(-8).toUpperCase()}</h3>
                                                        <span className="order-date">{formatDate(order.date)}</span>
                                                    </div>
                                                    <div className="order-meta">
                                                        <span className={`order-status ${getStatusClass(order.status)}`}>
                                                            {getStatusText(order.status)}
                                                        </span>
                                                        <span className="order-total">
                                                            {formatPrice(order.totalAmount)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="order-items">
                                                    {order.flowerItems?.map((item, index) => (
                                                        <div key={index} className="order-item">
                                                            <div className="item-info">
                                                                <span className="item-name">{item.name}</span>
                                                                <span className="item-quantity">× {item.quantity}</span>
                                                            </div>
                                                            <span className="item-price">
                                                                {formatPrice(item.itemTotal)}
                                                            </span>
                                                        </div>
                                                    ))}

                                                    {order.addonItems?.map((item, index) => (
                                                        <div key={index} className="order-item">
                                                            <div className="item-info">
                                                                <span className="item-name">{item.name}</span>
                                                                <span className="item-quantity">× {item.quantity}</span>
                                                            </div>
                                                            <span className="item-price">
                                                                {formatPrice(item.itemTotal)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="order-footer">
                                                    <div className="order-address">
                                                        <strong>Адрес доставки:</strong> {order.address}
                                                    </div>
                                                    <div className="order-phone">
                                                        <strong>Телефон:</strong> {order.phoneNumber}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;