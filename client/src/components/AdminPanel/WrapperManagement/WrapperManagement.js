// src/components/AdminPanel/WrapperManagement/WrapperManagement.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import WrapperForm from './WrapperForm';
import { toast } from 'react-toastify';
import './WrapperManagement.css';

const WrapperManagement = () => {
    const { token } = useAuth();
    const [wrappers, setWrappers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showWrapperModal, setShowWrapperModal] = useState(false);
    const [currentWrapper, setCurrentWrapper] = useState(null);
    // eslint-disable-next-line
    const [modalMode, setModalMode] = useState('create');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [wrapperToDelete, setWrapperToDelete] = useState(null);

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5506';

    // Загрузка обёрток
    const fetchWrappers = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${apiUrl}/api/admin/wrappers`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке обёрток');
            }

            const data = await response.json();
            setWrappers(data || []);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching wrappers:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWrappers();
        // eslint-disable-next-line
    }, []);

    // Создание обёртки
    const handleCreateClick = () => {
        setCurrentWrapper(null);
        setModalMode('create');
        setShowWrapperModal(true);
    };

    // Редактирование обёртки
    const handleEditClick = (wrapper) => {
        setCurrentWrapper(wrapper);
        setModalMode('edit');
        setShowWrapperModal(true);
    };

    // Удаление обёртки
    const handleDeleteClick = (wrapper) => {
        setWrapperToDelete(wrapper);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!wrapperToDelete) return;

        try {
            const response = await fetch(`${apiUrl}/api/admin/wrappers/${wrapperToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success('Обёртка успешно удалена');
                fetchWrappers();
            } else {
                throw new Error('Ошибка при удалении обёртки');
            }
        } catch (error) {
            console.error('Error deleting wrapper:', error);
            toast.error('Ошибка при удалении обёртки');
        } finally {
            setShowDeleteModal(false);
            setWrapperToDelete(null);
        }
    };

    // Сохранение обёртки
    const handleWrapperSave = (savedWrapper) => {
        setShowWrapperModal(false);
        setCurrentWrapper(null);
        fetchWrappers();

    };

    // Переключение активности
    const toggleWrapperActive = async (wrapperId, currentStatus) => {
        try {
            const updatedWrapperData = {
                isActive: !currentStatus
            };

            const response = await fetch(`${apiUrl}/api/admin/wrappers/${wrapperId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedWrapperData)
            });

            if (response.ok) {
                toast.success(`Обёртка ${!currentStatus ? 'активирована' : 'деактивирована'}`);
                fetchWrappers();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка при изменении статуса обёртки');
            }
        } catch (error) {
            console.error('Error toggling wrapper active:', error);
            toast.error(error.message || 'Ошибка при изменении статуса обёртки');
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

    if (loading && wrappers.length === 0) {
        return (
            <div className="wrapper-management">
                <div className="admin-section-header">
                    <h2>Управление обёртками</h2>
                </div>
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Загрузка обёрток...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="wrapper-management">
            <div className="admin-section-header">
                <h2>Управление обёртками</h2>
                <div className="section-actions">
                    <button className="btn btn-primary" onClick={handleCreateClick}>
                        + Добавить обёртку
                    </button>
                </div>
            </div>

            {/* Статистика */}
            <div className="wrappers-stats">
                <p>Всего обёрток: <strong>{wrappers.length}</strong></p>
            </div>

            {/* Сетка обёрток */}
            {error ? (
                <div className="error-message">
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={fetchWrappers}>
                        Попробовать снова
                    </button>
                </div>
            ) : wrappers.length === 0 ? (
                <div className="no-wrappers">
                    <h3>Обёртки не найдены</h3>
                    <p>Создайте первую обёртку для ваших цветов</p>
                </div>
            ) : (
                <div className="wrappers-grid-admin">
                    {wrappers.map((wrapper) => (
                        <div key={wrapper._id} className="wrapper-card-admin">
                            <div className="wrapper-image-container">
                                <img
                                    src={wrapper.image || '/images/placeholder-wrapper.jpg'}
                                    alt={wrapper.name}
                                    className="wrapper-image"
                                />
                                <div className="wrapper-badges">
                                    {!wrapper.isActive && (
                                        <span className="status-badge inactive">Неактивна</span>
                                    )}
                                    {wrapper.originalPrice && wrapper.originalPrice > wrapper.price && (
                                        <span className="discount-badge">
                                            -{Math.round((1 - wrapper.price / wrapper.originalPrice) * 100)}%
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="wrapper-info">
                                <h3 className="wrapper-name">{wrapper.name}</h3>

                                {wrapper.description && (
                                    <p className="wrapper-description">
                                        {wrapper.description.length > 80
                                            ? `${wrapper.description.slice(0, 80)}...`
                                            : wrapper.description
                                        }
                                    </p>
                                )}

                                <div className="wrapper-details">
                                    <div className="detail-item">
                                        <span className="detail-label">В наличии:</span>
                                        <span className="detail-value">{wrapper.quantity} шт</span>
                                    </div>
                                </div>

                                <div className="wrapper-price-admin">
                                    {wrapper.originalPrice && wrapper.originalPrice > wrapper.price ? (
                                        <>
                                            <span className="original-price">
                                                {formatPrice(wrapper.originalPrice)}
                                            </span>
                                            <span className="current-price">
                                                {formatPrice(wrapper.price)}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="current-price">
                                            {formatPrice(wrapper.price)}
                                        </span>
                                    )}
                                </div>

                                <div className="wrapper-actions-admin">
                                    <button
                                        className={`btn-status ${wrapper.isActive ? 'btn-active' : 'btn-inactive'}`}
                                        onClick={() => toggleWrapperActive(wrapper._id, wrapper.isActive)}
                                    >
                                        {wrapper.isActive ? 'Активна' : 'Неактивна'}
                                    </button>

                                    <button
                                        className="btn-edit"
                                        onClick={() => handleEditClick(wrapper)}
                                    >
                                        Редактировать
                                    </button>

                                    <button
                                        className="btn-delete"
                                        onClick={() => handleDeleteClick(wrapper)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Модальное окно удаления */}
            {showDeleteModal && wrapperToDelete && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Подтверждение удаления</h3>
                            <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>Вы уверены, что хотите удалить обёртку <strong>"{wrapperToDelete.name}"</strong>?</p>
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

            {/* Модальное окно формы обёртки */}
            {showWrapperModal && (
                <WrapperForm
                    initialWrapper={currentWrapper}
                    onSave={handleWrapperSave}
                    onCancel={() => {
                        setShowWrapperModal(false);
                        setCurrentWrapper(null);
                    }}
                />
            )}
        </div>
    );
};

export default WrapperManagement;