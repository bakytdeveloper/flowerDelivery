// src/components/AdminPanel/AddonManagement/AddonForm.js
import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';
import '../WrapperManagement/WrapperForm.css';

const AddonForm = ({ onSave, onCancel, initialAddon = null }) => {
    const { token } = useAuth();
    const [addon, setAddon] = useState(initialAddon || getDefaultAddon());
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [showUrlInput, setShowUrlInput] = useState(false);

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5506';
    const isEditing = !!initialAddon;

    const typeOptions = [
        { value: 'soft_toy', label: 'Мягкая игрушка' },
        { value: 'candy_box', label: 'Коробка конфет' },
        { value: 'chocolate', label: 'Шоколад' },
        { value: 'card', label: 'Открытка' },
        { value: 'perfume', label: 'Парфюм' },
        { value: 'other', label: 'Другое' }
    ];

    function getDefaultAddon() {
        return {
            name: '',
            type: 'soft_toy',
            description: '',
            price: '',
            originalPrice: '',
            quantity: 10,
            image: '',
            isActive: true
        };
    }

    const handleChange = (field, value) => {
        setAddon(prev => ({
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

    // Сохранение дополнения
    const handleSave = async () => {
        // Валидация обязательных полей
        if (!addon.name || !addon.price || !addon.image) {
            toast.error('Заполните обязательные поля: название, цена, изображение');
            return;
        }

        try {
            setIsSaving(true);

            // Подготовка данных
            const addonData = {
                ...addon,
                price: Number(addon.price),
                originalPrice: addon.originalPrice ? Number(addon.originalPrice) : undefined,
                quantity: addon.quantity ? Number(addon.quantity) : 10
            };

            const url = isEditing
                ? `${apiUrl}/api/admin/addons/${addon._id}`
                : `${apiUrl}/api/admin/addons`;

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(addonData)
            });

            if (response.ok) {
                const savedAddon = await response.json();
                toast.success(isEditing ? 'Дополнение успешно обновлено' : 'Дополнение успешно создано');
                onSave(savedAddon);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка при сохранении дополнения');
            }
        } catch (error) {
            console.error('Error saving addon:', error);
            toast.error(error.message || 'Ошибка при сохранении дополнения');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content medium-modal addon-form-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{isEditing ? 'Редактирование дополнения' : 'Создание нового дополнения'}</h3>
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
                                    value={addon.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className="form-control"
                                    required
                                    placeholder="Введите название дополнения"
                                />
                            </div>

                            <div className="form-group">
                                <label>Тип дополнения</label>
                                <select
                                    value={addon.type}
                                    onChange={(e) => handleChange('type', e.target.value)}
                                    className="form-control"
                                >
                                    {typeOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Описание</label>
                                <textarea
                                    value={addon.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    className="form-control"
                                    rows="3"
                                    placeholder="Описание дополнения"
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
                                        value={addon.price}
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
                                        value={addon.originalPrice || ''}
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
                                    value={addon.quantity}
                                    onChange={(e) => handleChange('quantity', e.target.value)}
                                    className="form-control"
                                    placeholder="Количество товара"
                                />
                            </div>
                        </div>

                        {/* Изображение */}
                        <div className="form-section">
                            <h4>Изображение *</h4>

                            {addon.image && (
                                <div className="image-preview">
                                    <img src={addon.image} alt="Preview" />
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
                                        checked={addon.isActive}
                                        onChange={(e) => handleChange('isActive', e.target.checked)}
                                    />
                                    Активный товар
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
                        {isSaving ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Создать дополнение')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddonForm;