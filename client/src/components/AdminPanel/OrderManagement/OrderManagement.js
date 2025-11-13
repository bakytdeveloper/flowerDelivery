import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './OrderManagement.css';
import {useLocation} from "react-router-dom";
import CustomSelect from "../../Common/CustomSelect";

const OrderManagement = () => {
    const { token } = useAuth();
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filters, setFilters] = useState({
        status: 'all',
        search: '',
        startDate: '',
        endDate: '',
        page: 1,
        perPage: 20
    });
    const [pagination, setPagination] = useState({});
    const location = useLocation();

    // Используем правильный порт
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';


    // Прокрутка вверх при монтировании компонента и изменении фильтров
    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }, [location.search]);

    // Загрузка заказов
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });

            const response = await fetch(`${apiUrl}/api/orders?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setOrders(data.orders);
                setPagination(data.pagination);
            } else {
                throw new Error('Ошибка загрузки заказов');
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Ошибка загрузки заказов');
        } finally {
            setLoading(false);
        }
    };

    // Загрузка статистики
    // Загрузка статистики
    const fetchStats = async () => {
        try {
            console.log('🔄 Загрузка статистики...');
            const response = await fetch(`${apiUrl}/api/orders/stats/overview`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📊 Полученные данные статистики:', data);
                console.log('📈 Детали stats:', data.stats);
                setStats(data.stats);
            } else {
                console.error('❌ Ошибка загрузки статистики:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки статистики:', error);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchStats();
        // eslint-disable-next-line
    }, [filters]);

    // Обновление статуса заказа
    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const response = await fetch(`${apiUrl}/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                toast.success('Статус заказа обновлен');
                fetchOrders();
                fetchStats();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка обновления статуса');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error(error.message || 'Ошибка обновления статуса заказа');
        }
    };

    // Удаление заказа
    const deleteOrder = async (orderId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот заказ? Все товары будут возвращены на склад.')) return;

        try {
            const response = await fetch(`${apiUrl}/api/orders/${orderId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success('Заказ удален, товары возвращены на склад');
                fetchOrders();
                fetchStats();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка удаления заказа');
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            toast.error(error.message || 'Ошибка удаления заказа');
        }
    };

    // Форматирование даты
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('ru-RU');
    };

    // Форматирование цены
    const formatPrice = (price) => {
        return new Intl.NumberFormat('ru-RU').format(price) + ' сом';
    };

    // Получение класса для статуса
    const getStatusClass = (status) => {
        const statusClasses = {
            pending: 'status-pending',
            completed: 'status-completed',
            cancelled: 'status-cancelled',
            inProgress: 'status-in-progress'
        };
        return statusClasses[status] || 'status-pending';
    };

    // Получение русского названия статуса
    const getStatusLabel = (status) => {
        const statusLabels = {
            pending: 'Ожидание',
            completed: 'Завершен',
            cancelled: 'Отменен',
            inProgress: 'В процессе'
        };
        return statusLabels[status] || status;
    };

    // Компонент статистики
    const StatsCard = ({ title, value, icon, color }) => (
        <div className={`stats-card stats-card-${color}`}>
            <div className="stats-icon">{icon}</div>
            <div className="stats-content">
                <h3>{value}</h3>
                <p>{title}</p>
            </div>
        </div>
    );

    if (loading && orders.length === 0) {
        return <div className="order-management-loading">Загрузка заказов...</div>;
    }

    return (
        <div className="order-management">
            <div className="order-header">
                <h2 className="order-header-title">Управление заказами</h2>
                <p>Всего заказов: {stats.totalOrders || 0}</p>
            </div>

            {/* Статистика */}
            <div className="stats-grid">
                <StatsCard
                    title="За неделю"
                    value={stats.weekOrders || 0}
                    icon="📊"
                    color="green"
                />
                <StatsCard
                    title="Ожидают"
                    value={stats.pendingOrders || 0}
                    icon="⏳"
                    color="orange"
                />
                <StatsCard
                    title="Общий доход"
                    value={formatPrice(stats.totalRevenue || 0)}
                    icon="💰"
                    color="purple"
                />
            </div>

            {/* Фильтры */}
            <div className="filters-section">
                <div className="filter-group">
                    <label className="filter-group-label">Статус:</label>
                    <CustomSelect
                        value={filters.status}
                        onChange={(value) => setFilters({ ...filters, status: value, page: 1 })}
                        options={[
                            { value: 'all', label: 'Все статусы' },
                            { value: 'pending', label: 'Ожидание' },
                            { value: 'inProgress', label: 'В процессе' },
                            { value: 'completed', label: 'Завершен' },
                            { value: 'cancelled', label: 'Отменен' }
                        ]}
                        className="filter-select custom-select--overlay custom-select--filters"
                    />
                </div>

                <div className="filter-group">
                    <label className="filter-group-label">Поиск:</label>
                    <input
                        type="text"
                        placeholder="Имя, телефон или товар..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                    />
                </div>

                <div className="filter-group">
                    <label className="filter-group-label">С:</label>
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
                    />
                </div>

                <div className="filter-group">
                    <label className="filter-group-label">По:</label>
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
                    />
                </div>

                <button
                    className="btn btn-secondary"
                    onClick={() => setFilters({
                        status: 'all',
                        search: '',
                        startDate: '',
                        endDate: '',
                        page: 1,
                        perPage: 20
                    })}
                >
                    Сбросить
                </button>
            </div>

            {/* Таблица заказов */}
            <div className="orders-table-container" >
                <table className="orders-table" style={{zIndex:"0"}}>
                    <thead>
                    <tr>
                        <th>N˚</th>
                        <th>ID</th>
                        <th>Клиент</th>
                        <th>Телефон</th>
                        <th>Товары</th>
                        <th>Сумма</th>
                        <th>Статус</th>
                        <th>Дата</th>
                        <th>Действия</th>
                    </tr>
                    </thead>
                    <tbody>
                    {orders.map((order, i) => (
                        <tr key={order._id}>
                            <td>{i + 1}.</td>
                            <td className="order-id">#{order._id.slice(-6)}</td>
                            <td>
                                <div className="customer-info">
                                    <strong>{order.firstName}</strong>
                                    <span className="user-type">
                                            {order.userType === 'customer' ? '👤 Клиент' : '👥 Гость'}
                                        </span>
                                </div>
                            </td>
                            <td>{order.phoneNumber}</td>
                            <td>
                                <div className="items-preview">
                                    <div className="flowers-count">
                                        💐 {order.flowerItems.length} цветов
                                    </div>
                                    {order.addonItems.length > 0 && (
                                        <div className="addons-count">
                                            🎁 {order.addonItems.length} доп. товаров
                                        </div>
                                    )}
                                    <div className="total-items">
                                        Всего: {order.flowerItems.reduce((sum, item) => sum + item.quantity, 0) +
                                    order.addonItems.reduce((sum, item) => sum + item.quantity, 0)} шт.
                                    </div>
                                </div>
                            </td>
                            <td className="order-amount">{formatPrice(order.totalAmount)}</td>
                            <td>
                                <div className="table-select-wrapper" style={{ position: 'relative', zIndex: 'auto' }}>
                                    <CustomSelect
                                        value={order.status}
                                        onChange={(value) => updateOrderStatus(order._id, value)}
                                        options={[
                                            { value: 'pending', label: 'Ожидание' },
                                            { value: 'inProgress', label: 'В процессе' },
                                            { value: 'completed', label: 'Завершен' },
                                            { value: 'cancelled', label: 'Отменен' }
                                        ]}
                                        className={`status-select ${getStatusClass(order.status)} custom-select--table-context custom-select--order-status`}
                                    />
                                </div>
                            </td>
                            <td className="order-date">{formatDate(order.date)}</td>
                            <td>
                                <div className="action-buttons">
                                    <button
                                        className="btn btn-info btn-sm"
                                        onClick={() => setSelectedOrder(order)}
                                    >
                                        👁️
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => deleteOrder(order._id)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {orders.length === 0 && !loading && (
                    <div className="empty-orders">
                        <p>Заказы не найдены</p>
                    </div>
                )}
            </div>

            {/* Пагинация */}
            {pagination.totalPages > 1 && (
                <div className="pagination">
                    <button
                        disabled={filters.page === 1}
                        onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    >
                        &laquo;
                    </button>

                    <span>
                        Стр. {filters.page} из {pagination.totalPages}
                    </span>

                    <button
                        disabled={filters.page >= pagination.totalPages}
                        onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    >
                        &raquo;
                    </button>
                </div>
            )}

            {/* Модальное окно деталей заказа */}
            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdate={fetchOrders}
                    token={token}
                />
            )}
        </div>
    );
};



// ОБНОВЛЕННЫЙ КОМПОНЕНТ МОДАЛЬНОГО ОКНА С ДЕТАЛЯМИ ЗАКАЗА
const OrderDetailsModal = ({ order, onClose, onUpdate, token }) => {
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: order.firstName,
        address: order.address,
        phoneNumber: order.phoneNumber,
        paymentMethod: order.paymentMethod,
        comments: order.comments || '',
        status: order.status
    });
    const [orderItems, setOrderItems] = useState({
        flowerItems: [...order.flowerItems],
        addonItems: [...order.addonItems]
    });

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // Управление состоянием body при открытии/закрытии модального окна
    useEffect(() => {
        // Добавляем класс к body при открытии модального окна
        document.body.classList.add('modal-open');

        // Убираем класс при размонтировании
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, []);

    // Функция для быстрого обновления статуса
    const handleQuickStatusUpdate = async (newStatus) => {
        try {
            console.log('🔄 Быстрое обновление статуса:', { orderId: order._id, newStatus });

            const response = await fetch(`${apiUrl}/api/orders/${order._id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            const responseData = await response.json();

            if (response.ok) {
                toast.success(`Статус заказа изменен на "${getStatusLabel(newStatus)}"`);
                onUpdate(); // Обновляем список заказов
                // Обновляем локальное состояние
                setFormData(prev => ({ ...prev, status: newStatus }));
            } else {
                console.error('❌ Ошибка от сервера:', responseData);
                throw new Error(responseData.message || `Ошибка ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ Ошибка при обновлении статуса:', error);
            toast.error(error.message || 'Ошибка обновления статуса заказа');
        }
    };

    // Удаление товара из заказа
    const handleRemoveItem = async (itemType, index) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот товар из заказа?')) return;

        try {
            const response = await fetch(`${apiUrl}/api/orders/remove-product/${order._id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productIndex: index,
                    itemType: itemType
                })
            });

            if (response.ok) {
                toast.success('Товар удален из заказа');

                // Обновляем локальное состояние
                if (itemType === 'flower') {
                    const updatedItems = [...orderItems.flowerItems];
                    updatedItems.splice(index, 1);
                    setOrderItems({ ...orderItems, flowerItems: updatedItems });
                } else {
                    const updatedItems = [...orderItems.addonItems];
                    updatedItems.splice(index, 1);
                    setOrderItems({ ...orderItems, addonItems: updatedItems });
                }

                onUpdate();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка удаления товара');
            }
        } catch (error) {
            console.error('Error removing item:', error);
            toast.error(error.message || 'Ошибка удаления товара');
        }
    };


    // Изменение количества товара
    const handleUpdateQuantity = async (itemType, index, newQuantity) => {
        if (newQuantity < 1) {
            toast.error('Количество не может быть меньше 1');
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/api/orders/update-product-quantity/${order._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productIndex: index,
                    quantity: newQuantity,
                    itemType: itemType
                })
            });

            if (response.ok) {
                toast.success('Количество обновлено');

                // Обновляем локальное состояние
                if (itemType === 'flower') {
                    const updatedItems = [...orderItems.flowerItems];
                    updatedItems[index].quantity = newQuantity;
                    updatedItems[index].itemTotal = newQuantity * updatedItems[index].price;
                    if (updatedItems[index].wrapper && updatedItems[index].wrapper.price) {
                        updatedItems[index].itemTotal += updatedItems[index].wrapper.price;
                    }
                    setOrderItems({ ...orderItems, flowerItems: updatedItems });
                } else {
                    const updatedItems = [...orderItems.addonItems];
                    updatedItems[index].quantity = newQuantity;
                    updatedItems[index].itemTotal = newQuantity * updatedItems[index].price;
                    setOrderItems({ ...orderItems, addonItems: updatedItems });
                }

                onUpdate();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка обновления количества');
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
            toast.error(error.message || 'Ошибка обновления количества');
        }
    };



    // Расчет общей суммы
    // Расчет общей суммы
    const calculateTotal = () => {
        const flowersTotal = orderItems.flowerItems.reduce((sum, item) => sum + (item.itemTotal || 0), 0);
        const addonsTotal = orderItems.addonItems.reduce((sum, item) => sum + (item.itemTotal || 0), 0);
        return flowersTotal + addonsTotal;
    };


    // Получение класса для статуса
    const getStatusClass = (status) => {
        const statusClasses = {
            pending: 'status-pending',
            completed: 'status-completed',
            cancelled: 'status-cancelled',
            inProgress: 'status-in-progress'
        };
        return statusClasses[status] || 'status-pending';
    };

    // Получение русского названия статуса
    const getStatusLabel = (status) => {
        const statusLabels = {
            pending: 'Ожидание',
            completed: 'Завершен',
            cancelled: 'Отменен',
            inProgress: 'В процессе'
        };
        return statusLabels[status] || status;
    };

    // Получение иконки для статуса
    const getStatusIcon = (status) => {
        const statusIcons = {
            pending: '⏳',
            completed: '✅',
            cancelled: '❌',
            inProgress: '🚚'
        };
        return statusIcons[status] || '📋';
    };

    // Получение описания для статуса
    const getStatusDescription = (status) => {
        const statusDescriptions = {
            pending: 'Заказ ожидает обработки',
            completed: 'Заказ успешно завершен',
            cancelled: 'Заказ отменен',
            inProgress: 'Заказ в процессе доставки'
        };
        return statusDescriptions[status] || 'Статус заказа';
    };

    // Компонент кнопки статуса
    const StatusButton = ({ status, currentStatus }) => {
        const isActive = status === currentStatus;
        const isDisabled = status === currentStatus;

        return (
            <button
                className={`status-btn ${getStatusClass(status)} ${isActive ? 'active' : ''}`}
                onClick={() => !isDisabled && handleQuickStatusUpdate(status)}
                disabled={isDisabled}
                title={getStatusDescription(status)}
            >
                <span className="status-icon">{getStatusIcon(status)}</span>
                <span className="status-text">{getStatusLabel(status)}</span>
                {isActive && <span className="status-indicator">●</span>}
            </button>
        );
    };



    // Получение русского названия типа цветов
    const getFlowerTypeLabel = (type) => {
        const typeLabels = {
            'single': 'Одиночный цветок',
            'bouquet': 'Букет'
        };
        return typeLabels[type] || type;
    };

    // Получение русского названия типа дополнительного товара
    const getAddonTypeLabel = (type) => {
        const typeLabels = {
            'soft_toy': 'Мягкая игрушка',
            'candy_box': 'Коробка конфет',
            'chocolate': 'Шоколад',
            'card': 'Открытка',
            'perfume': 'Парфюм',
            'other': 'Другое'
        };
        return typeLabels[type] || type;
    };


    // Форматирование даты
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('ru-RU');
    };

    // Компонент для отображения/редактирования товара
    // Компонент для отображения/редактирования товара
    const OrderItem = ({ item, index, itemType }) => {
        const [editingItem, setEditingItem] = useState(false);
        const [quantity, setQuantity] = useState(item.quantity);

        const handleSaveQuantity = () => {
            handleUpdateQuantity(itemType, index, quantity);
            setEditingItem(false);
        };

        const handleCancelEdit = () => {
            setEditingItem(false);
            setQuantity(item.quantity);
        };

        // Детальная информация о товаре
        const renderProductDetails = () => {
            if (itemType === 'flower' && item.product) {
                return (
                    <div className="product-details">
                        <div className="detail-row">
                            <strong>Категория:</strong> {item.product.category}
                        </div>
                        <div className="detail-row">
                            <strong>Тип:</strong> {getFlowerTypeLabel(item.product.type)}
                        </div>
                        <div className="detail-row">
                            <strong>Цветы:</strong> {item.product.flowerNames?.join(', ')}
                        </div>
                        <div className="detail-row">
                            <strong>Длина стебля:</strong> {item.product.stemLength} см
                        </div>
                        <div className="detail-row">
                            <strong>Повод:</strong> {item.product.occasion}
                        </div>
                        <div className="detail-row">
                            <strong>Для кого:</strong> {item.product.recipient}
                        </div>
                        {item.product.description && (
                            <div className="detail-row">
                                <strong>Описание:</strong> {item.product.description}
                            </div>
                        )}
                    </div>
                );
            } else if (itemType === 'addon' && item.addonId) {
                return (
                    <div className="product-details">
                        <div className="detail-row">
                            <strong>Тип:</strong> {getAddonTypeLabel(item.addonId.type)}
                        </div>
                        {item.addonId.description && (
                            <div className="detail-row">
                                <strong>Описание:</strong> {item.addonId.description}
                            </div>
                        )}
                    </div>
                );
            }
            return null;
        };
        return (
            <div className="order-item-editable">
                <div className="item-header">
                    <span className="item-name">
                        {itemType === 'flower' ? '💐' : '🎁'} {item.name}
                    </span>
                    <div className="item-actions">
                        {editingItem ? (
                            <div className="quantity-edit">
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                    className="quantity-input"
                                />
                                <button
                                    className="btn btn-success btn-xs"
                                    onClick={handleSaveQuantity}
                                >
                                    ✓
                                </button>
                                <button
                                    className="btn btn-secondary btn-xs"
                                    onClick={handleCancelEdit}
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <>
                                <span className="item-quantity">{item.quantity} шт.</span>
                                <button
                                    className="btn btn-info btn-xs"
                                    onClick={() => setEditingItem(true)}
                                >
                                    ✏️
                                </button>
                            </>
                        )}
                        <button
                            className="btn btn-danger btn-xs"
                            onClick={() => handleRemoveItem(itemType, index)}
                        >
                            🗑️
                        </button>
                    </div>
                </div>

                {/* Детальная информация о товаре */}
                {renderProductDetails()}

                <div className="item-details">
                    {item.flowerType && <span>Тип: {getFlowerTypeLabel(item.flowerType)}</span>}
                    {item.occasion && <span>Повод: {item.occasion}</span>}
                    {item.recipient && <span>Для: {item.recipient}</span>}
                    {item.wrapper && item.wrapper.name && (
                        <span className="wrapper-info">
                            🎀 Упаковка: {item.wrapper.name} (+{item.wrapper.price || 0} сом)
                        </span>
                    )}
                    {item.type && <span>Тип: {getAddonTypeLabel(item.type)}</span>}
                </div>

                <div className="item-pricing">
                    <span className="item-price">{item.price} сом/шт.</span>
                    <span className="item-total">
                        Итого: {new Intl.NumberFormat('ru-RU').format(item.itemTotal || 0)} сом
                    </span>
                </div>
            </div>
        );
    };


    return (
        <div className="modal-overlay">
            <div className="modal-content large-modal">
                <div className="modal-header">
                    <h3>Детали заказа #{order._id.slice(-6)}</h3>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {editing ? (
                        <div className="edit-form">
                            {/* Форма редактирования остается без изменений */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Имя:</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Телефон:</label>
                                    <input
                                        type="text"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Адрес:</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows="3"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Способ оплаты:</label>
                                    <CustomSelect
                                        value={formData.paymentMethod}
                                        onChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                                        options={[
                                            { value: 'cash', label: 'Наличные' },
                                            { value: 'card', label: 'Карта' }
                                        ]}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Статус:</label>
                                    <CustomSelect
                                        value={formData.status}
                                        onChange={(value) => setFormData({ ...formData, status: value })}
                                        options={[
                                            { value: 'pending', label: 'Ожидание' },
                                            { value: 'inProgress', label: 'В процессе' },
                                            { value: 'completed', label: 'Завершен' },
                                            { value: 'cancelled', label: 'Отменен' }
                                        ]}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{zIndex:"0"}}>
                                <label>Комментарий:</label>
                                <textarea
                                    value={formData.comments}
                                    onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                    rows="3"
                                />
                            </div>

                            {/* Редактирование товаров */}
                            <div className="items-editing-section">
                                <h4>Товары в заказе</h4>

                                {/* Цветы */}
                                {orderItems.flowerItems.length > 0 && (
                                    <div className="items-category">
                                        <h5>💐 Цветы ({orderItems.flowerItems.length})</h5>
                                        {orderItems.flowerItems.map((item, index) => (
                                            <OrderItem
                                                key={index}
                                                item={item}
                                                index={index}
                                                itemType="flower"
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Дополнительные товары */}
                                {orderItems.addonItems.length > 0 && (
                                    <div className="items-category">
                                        <h5>🎁 Дополнительные товары ({orderItems.addonItems.length})</h5>
                                        {orderItems.addonItems.map((item, index) => (
                                            <OrderItem
                                                key={index}
                                                item={item}
                                                index={index}
                                                itemType="addon"
                                            />
                                        ))}
                                    </div>
                                )}

                                <div className="order-total-editing">
                                    <strong>Общая сумма: {new Intl.NumberFormat('ru-RU').format(calculateTotal())} сом</strong>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="order-details">
                            {/* Блок быстрого изменения статуса */}
                            <div className="detail-section">
                                <h4>🚀 Быстрое управление статусом</h4>
                                <div className="status-buttons-grid">
                                    <StatusButton status="pending" currentStatus={formData.status} />
                                    <StatusButton status="inProgress" currentStatus={formData.status} />
                                    <StatusButton status="completed" currentStatus={formData.status} />
                                    <StatusButton status="cancelled" currentStatus={formData.status} />
                                </div>
                                <div className="current-status-info">
                                    <span className="current-status-label">Текущий статус:</span>
                                    <span className={`current-status ${getStatusClass(formData.status)}`}>
                                        {getStatusIcon(formData.status)} {getStatusLabel(formData.status)}
                                    </span>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h4>📋 Информация о клиенте</h4>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <strong>Имя:</strong> {order.firstName}
                                    </div>
                                    <div className="info-item">
                                        <strong>Телефон:</strong> {order.phoneNumber}
                                    </div>
                                    <div className="info-item">
                                        <strong>Адрес:</strong> {order.address}
                                    </div>
                                    <div className="info-item">
                                        <strong>Тип клиента:</strong> {order.userType === 'customer' ? '👤 Зарегистрированный' : '👥 Гость'}
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h4>💰 Детали заказа</h4>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <strong>Общая сумма:</strong> {new Intl.NumberFormat('ru-RU').format(order.totalAmount)} сом
                                    </div>
                                    <div className="info-item">
                                        <strong>Способ оплаты:</strong> {order.paymentMethod === 'cash' ? '💵 Наличные' : '💳 Карта'}
                                    </div>
                                    <div className="info-item">
                                        <strong>Статус:</strong> <span className={`status-badge ${getStatusClass(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <strong>Дата заказа:</strong> {formatDate(order.date)}
                                    </div>
                                </div>
                            </div>

                            {order.comments && (
                                <div className="detail-section">
                                    <h4>💬 Комментарий клиента</h4>
                                    <div className="comment-box">
                                        {order.comments}
                                    </div>
                                </div>
                            )}

                            <div className="detail-section">
                                <h4>🛒 Состав заказа</h4>

                                {/* Цветы */}
                                {orderItems.flowerItems.length > 0 && (
                                    <div className="items-category-view">
                                        <h5>💐 Цветы ({orderItems.flowerItems.length})</h5>
                                        <div className="order-items">
                                            {orderItems.flowerItems.map((item, index) => (
                                                <div key={index} className="order-item-view">
                                                    <div className="item-main-info">
                                                        <span className="item-name">{item.name}</span>
                                                        <span className="item-quantity-price">
                                                            {item.quantity} × {item.price} сом
                                                        </span>
                                                    </div>

                                                    {item.product && (
                                                        <div className="product-details-view">
                                                            <div className="detail-row">
                                                                <span>Категория: {item.product.category}</span>
                                                                <span>Тип: {getFlowerTypeLabel(item.product.type)}</span>
                                                            </div>
                                                            <div className="detail-row">
                                                                <span>Цветы: {item.product.flowerNames?.join(', ')}</span>
                                                                <span>Длина стебля: {item.product.stemLength} см</span>
                                                            </div>
                                                            <div className="detail-row">
                                                                <span>Повод: {item.product.occasion}</span>
                                                                <span>Для: {item.product.recipient}</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {item.wrapper && item.wrapper.name && (
                                                        <div className="wrapper-details">
                                                            🎀 Упаковка: {item.wrapper.name} (+{item.wrapper.price} сом)
                                                        </div>
                                                    )}

                                                    <div className="item-total-view">
                                                        Итого: {new Intl.NumberFormat('ru-RU').format(item.itemTotal)} сом
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Дополнительные товары */}
                                {orderItems.addonItems.length > 0 && (
                                    <div className="items-category-view">
                                        <h5>🎁 Дополнительные товары ({orderItems.addonItems.length})</h5>
                                        <div className="order-items">
                                            {orderItems.addonItems.map((item, index) => (
                                                <div key={index} className="order-item-view">
                                                    <div className="item-main-info">
                                                        <span className="item-name">{item.name}</span>
                                                        <span className="item-quantity-price">
                                                            {item.quantity} × {item.price} сом
                                                        </span>
                                                    </div>

                                                    {item.addonId && (
                                                        <div className="product-details-view">
                                                            <div className="detail-row">
                                                                <span>Тип: {getAddonTypeLabel(item.addonId.type)}</span>
                                                                {item.addonId.description && (
                                                                    <span>Описание: {item.addonId.description}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="item-total-view">
                                                        Итого: {new Intl.NumberFormat('ru-RU').format(item.itemTotal)} сом
                                                    </div>
                                                </div>
                                            ))}
                                        </div>


                                    </div>
                                )}
                            </div>

                            <div className="item-total-view-check">
                                <strong>Итого сумма:</strong> {new Intl.NumberFormat('ru-RU').format(order.totalAmount)} сом
                                {/*Итого: {new Intl.NumberFormat('ru-RU').format(item.itemTotal)} сом*/}
                            </div>

                            <div className="detail-section">
                                <h4>📊 История статусов</h4>
                                <div className="status-history">
                                    {order.statusHistory?.map((history, index) => (
                                        <div key={index} className="status-history-item">
                                            <span className={`status ${getStatusClass(history.status)}`}>
                                                {getStatusLabel(history.status)}
                                            </span>
                                            <span className="time">{formatDate(history.time)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    {editing ? (
                        <>
                            <button className="btn btn-secondary" onClick={onClose}>
                                🔒 Закрыть
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn btn-primary" onClick={() => setEditing(true)}>
                                ✏️ Редактировать заказ
                            </button>
                            <button className="btn btn-secondary" onClick={onClose}>
                                🔒 Закрыть
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderManagement;





