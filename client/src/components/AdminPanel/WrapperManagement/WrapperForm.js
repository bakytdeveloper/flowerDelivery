// src/components/AdminPanel/WrapperManagement/WrapperForm.js
import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './WrapperForm.css';

const WrapperForm = ({ onSave, onCancel, initialWrapper = null }) => {
    const { token } = useAuth();
    const [wrapper, setWrapper] = useState(initialWrapper || getDefaultWrapper());
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [showUrlInput, setShowUrlInput] = useState(false);

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5506';
    const isEditing = !!initialWrapper;

    function getDefaultWrapper() {
        return {
            name: '',
            description: '',
            price: '',
            originalPrice: '',
            quantity: 10,
            image: '',
            isActive: true
        };
    }

    const handleChange = (field, value) => {
        setWrapper(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Загрузка изображения
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setUploadingImage(true);
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch(`${apiUrl}/api/admin/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                handleChange('image', data.imageUrl);
                toast.success('Изображение успешно загружено');
            } else {
                throw new Error('Ошибка загрузки изображения');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Ошибка загрузки изображения');
        } finally {
            setUploadingImage(false);
            event.target.value = '';
        }
    };

    // Добавление URL изображения
    const handleAddImageUrl = () => {
        if (!imageUrlInput.trim()) {
            toast.error('Введите URL изображения');
            return;
        }

        try {
            new URL(imageUrlInput);
        } catch (error) {
            toast.error('Введите корректный URL');
            return;
        }

        handleChange('image', imageUrlInput.trim());
        setImageUrlInput('');
        setShowUrlInput(false);
        toast.success('URL изображения добавлен');
    };

    // Сохранение обёртки
    const handleSave = async () => {
        // Валидация обязательных полей
        if (!wrapper.name || !wrapper.price || !wrapper.image) {
            toast.error('Заполните обязательные поля: название, цена, изображение');
            return;
        }

        try {
            setIsSaving(true);

            // Подготовка данных
            const wrapperData = {
                ...wrapper,
                price: Number(wrapper.price),
                originalPrice: wrapper.originalPrice ? Number(wrapper.originalPrice) : undefined,
                quantity: wrapper.quantity ? Number(wrapper.quantity) : 10
            };

            const url = isEditing
                ? `${apiUrl}/api/admin/wrappers/${wrapper._id}`
                : `${apiUrl}/api/admin/wrappers`;

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(wrapperData)
            });

            if (response.ok) {
                const savedWrapper = await response.json();
                toast.success(isEditing ? 'Обёртка успешно обновлена' : 'Обёртка успешно создана');
                onSave(savedWrapper);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка при сохранении обёртки');
            }
        } catch (error) {
            console.error('Error saving wrapper:', error);
            toast.error(error.message || 'Ошибка при сохранении обёртки');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content medium-modal wrapper-form-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{isEditing ? 'Редактирование обёртки' : 'Создание новой обёртки'}</h3>
                    <button className="modal-close" onClick={onCancel}>×</button>
                </div>
                <div className="modal-body">
                    <div className="edit-form">
                        {/* Основная информация */}
                        <div className="form-section">
                            <h4>Основная информация</h4>
                            <div className="form-group">
                                <label>Название *</label>
                                <input
                                    type="text"
                                    value={wrapper.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className="form-control"
                                    required
                                    placeholder="Введите название обёртки"
                                />
                            </div>

                            <div className="form-group">
                                <label>Описание</label>
                                <textarea
                                    value={wrapper.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    className="form-control"
                                    rows="3"
                                    placeholder="Описание обёртки"
                                />
                            </div>
                        </div>

                        {/* Цены и количество */}
                        <div className="form-section">
                            <h4>Цены и количество</h4>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Цена (₸) *</label>
                                    <input
                                        type="number"
                                        value={wrapper.price}
                                        onChange={(e) => handleChange('price', e.target.value)}
                                        className="form-control"
                                        required
                                        placeholder="Текущая цена"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Старая цена (₸)</label>
                                    <input
                                        type="number"
                                        value={wrapper.originalPrice || ''}
                                        onChange={(e) => handleChange('originalPrice', e.target.value)}
                                        className="form-control"
                                        placeholder="Цена до скидки"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Количество в наличии</label>
                                <input
                                    type="number"
                                    value={wrapper.quantity}
                                    onChange={(e) => handleChange('quantity', e.target.value)}
                                    className="form-control"
                                    placeholder="Количество обёрток"
                                />
                            </div>
                        </div>

                        {/* Изображение */}
                        <div className="form-section">
                            <h4>Изображение *</h4>

                            {wrapper.image && (
                                <div className="image-preview">
                                    <img src={wrapper.image} alt="Preview" />
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleChange('image', '')}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            )}

                            <div className="image-upload-options">
                                <div className="form-group">
                                    <label>Загрузить изображение с компьютера:</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="form-control"
                                        disabled={uploadingImage}
                                    />
                                    {uploadingImage && <p>Загрузка изображения...</p>}
                                </div>

                                <div className="form-group">
                                    {!showUrlInput ? (
                                        <button
                                            type="button"
                                            className="btn btn-outline btn-sm add-image-url"
                                            onClick={() => setShowUrlInput(true)}
                                        >
                                            + Добавить URL изображения
                                        </button>
                                    ) : (
                                        <div className="url-input-group">
                                            <input
                                                type="text"
                                                value={imageUrlInput}
                                                onChange={(e) => setImageUrlInput(e.target.value)}
                                                className="form-control"
                                                placeholder="Введите URL изображения"
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm"
                                                onClick={handleAddImageUrl}
                                            >
                                                Добавить
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-outline btn-sm"
                                                onClick={() => setShowUrlInput(false)}
                                            >
                                                Отмена
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Статус */}
                        <div className="form-section">
                            <h4>Статус</h4>
                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={wrapper.isActive}
                                        onChange={(e) => handleChange('isActive', e.target.checked)}
                                    />
                                    Активная обёртка
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-outline" onClick={onCancel} disabled={isSaving}>
                        Отмена
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Создать обёртку')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WrapperForm;