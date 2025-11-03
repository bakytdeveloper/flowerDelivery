// src/components/AdminPanel/AddonManagement/AddonManagement.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import AddonForm from './AddonForm';
import { toast } from 'react-toastify';
import './AddonManagement.css';

const AddonManagement = () => {
    const { token } = useAuth();
    const [addons, setAddons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddonModal, setShowAddonModal] = useState(false);
    const [currentAddon, setCurrentAddon] = useState(null);
    // eslint-disable-next-line
    const [modalMode, setModalMode] = useState('create');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [addonToDelete, setAddonToDelete] = useState(null);
    const [filterType, setFilterType] = useState('');

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5506';

    const typeLabels = {
        'soft_toy': 'Мягкая игрушка',
        'candy_box': 'Коробка конфет',
        'chocolate': 'Шоколад',
        'card': 'Открытка',
        'perfume': 'Парфюм',
        'other': 'Другое'
    };

    // Загрузка дополнений
    const fetchAddons = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${apiUrl}/api/admin/addons`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке дополнений');
            }

            const data = await response.json();
            setAddons(data || []);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching addons:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddons();
        // eslint-disable-next-line
    }, []);

    // Фильтрация по типу
    const filteredAddons = filterType
        ? addons.filter(addon => addon.type === filterType)
        : addons;

    // Создание дополнения
    const handleCreateClick = () => {
        setCurrentAddon(null);
        setModalMode('create');
        setShowAddonModal(true);
    };

    // Редактирование дополнения
    const handleEditClick = (addon) => {
        setCurrentAddon(addon);
        setModalMode('edit');
        setShowAddonModal(true);
    };

    // Удаление дополнения
    const handleDeleteClick = (addon) => {
        setAddonToDelete(addon);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!addonToDelete) return;

        try {
            const response = await fetch(`${apiUrl}/api/admin/addons/${addonToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success('Дополнение успешно удалено');
                fetchAddons();
            } else {
                throw new Error('Ошибка при удалении дополнения');
            }
        } catch (error) {
            console.error('Error deleting addon:', error);
            toast.error('Ошибка при удалении дополнения');
        } finally {
            setShowDeleteModal(false);
            setAddonToDelete(null);
        }
    };

    // Сохранение дополнения
    const handleAddonSave = (savedAddon) => {
        setShowAddonModal(false);
        setCurrentAddon(null);
        fetchAddons();

        // if (modalMode === 'create') {
        //     toast.success('Дополнение успешно создано');
        // } else {
        //     toast.success('Дополнение успешно обновлено');
        // }
    };

    // Переключение активности
    const toggleAddonActive = async (addonId, currentStatus) => {
        try {
            const updatedAddonData = {
                isActive: !currentStatus
            };

            const response = await fetch(`${apiUrl}/api/admin/addons/${addonId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedAddonData)
            });

            if (response.ok) {
                toast.success(`Дополнение ${!currentStatus ? 'активировано' : 'деактивировано'}`);
                fetchAddons();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка при изменении статуса дополнения');
            }
        } catch (error) {
            console.error('Error toggling addon active:', error);
            toast.error(error.message || 'Ошибка при изменении статуса дополнения');
        }
    };

    // Форматирование цены
    const formatPrice = (price) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'KZT',
            minimumFractionDigits: 0
        }).format(price);
    };

    if (loading && addons.length === 0) {
        return (
            <div className="addon-management">
                <div className="admin-section-header">
                    <h2>Управление дополнительными товарами</h2>
                </div>
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Загрузка дополнений...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="addon-management">
            <div className="admin-section-header">
                <h2>Управление дополнительными товарами</h2>
                <div className="section-actions">
                    <button className="btn btn-primary" onClick={handleCreateClick}>
                        + Добавить товар
                    </button>
                </div>
            </div>

            {/* Фильтры */}
            <div className="filters-panel">
                <div className="filter-group">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="form-control filter-group-select-input"
                    >
                        <option value="">Все типы</option>
                        {Object.entries(typeLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Статистика */}
            <div className="addons-stats">
                <p>Всего дополнений: <strong>{filteredAddons.length}</strong></p>
            </div>

            {/* Сетка дополнений */}
            {error ? (
                <div className="error-message">
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={fetchAddons}>
                        Попробовать снова
                    </button>
                </div>
            ) : filteredAddons.length === 0 ? (
                <div className="no-addons">
                    <h3>Дополнения не найдены</h3>
                    <p>Создайте первое дополнение для ваших букетов</p>
                </div>
            ) : (
                <div className="addons-grid-admin">
                    {filteredAddons.map((addon) => (
                        <div key={addon._id} className="addon-card-admin">
                            <div className="addon-image-container">
                                <img
                                    src={addon.image || '/images/placeholder-addon.jpg'}
                                    alt={addon.name}
                                    className="addon-image"
                                />
                                <div className="addon-badges">
                                    {!addon.isActive && (
                                        <span className="status-badge inactive">Неактивно</span>
                                    )}
                                    {addon.originalPrice && addon.originalPrice > addon.price && (
                                        <span className="discount-badge">
                                            -{Math.round((1 - addon.price / addon.originalPrice) * 100)}%
                                        </span>
                                    )}
                                    <span className="type-badge">
                                        {typeLabels[addon.type] || 'Другое'}
                                    </span>
                                </div>
                            </div>

                            <div className="addon-info">
                                <h3 className="addon-name">{addon.name}</h3>

                                {addon.description && (
                                    <p className="addon-description">
                                        {addon.description.length > 80
                                            ? `${addon.description.slice(0, 80)}...`
                                            : addon.description
                                        }
                                    </p>
                                )}

                                <div className="addon-details">
                                    <div className="detail-item">
                                        <span className="detail-label">В наличии:</span>
                                        <span className="detail-value">{addon.quantity} шт</span>
                                    </div>
                                </div>

                                <div className="addon-price-admin">
                                    {addon.originalPrice && addon.originalPrice > addon.price ? (
                                        <>
                                            <span className="original-price">
                                                {formatPrice(addon.originalPrice)}
                                            </span>
                                            <span className="current-price">
                                                {formatPrice(addon.price)}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="current-price">
                                            {formatPrice(addon.price)}
                                        </span>
                                    )}
                                </div>

                                <div className="addon-actions-admin">
                                    <button
                                        className={`btn-status ${addon.isActive ? 'btn-active' : 'btn-inactive'}`}
                                        onClick={() => toggleAddonActive(addon._id, addon.isActive)}
                                    >
                                        {addon.isActive ? 'Активно' : 'Неактивно'}
                                    </button>

                                    <button
                                        className="btn-delete"
                                        onClick={() => handleDeleteClick(addon)}
                                    >
                                        🗑️
                                    </button>

                                    <button
                                        className="btn-edit"
                                        onClick={() => handleEditClick(addon)}
                                    >
                                        Редактировать
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Модальное окно удаления */}
            {showDeleteModal && addonToDelete && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Подтверждение удаления</h3>
                            <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>Вы уверены, что хотите удалить дополнение <strong>"{addonToDelete.name}"</strong>?</p>
                            <p className="warning-text">Это действие нельзя отменить.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setShowDeleteModal(false)}>
                                Отмена
                            </button>
                            <button className="btn btn-danger" onClick={confirmDelete}>
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно формы дополнения */}
            {showAddonModal && (
                <AddonForm
                    initialAddon={currentAddon}
                    onSave={handleAddonSave}
                    onCancel={() => {
                        setShowAddonModal(false);
                        setCurrentAddon(null);
                    }}
                />
            )}
        </div>
    );
};

export default AddonManagement;