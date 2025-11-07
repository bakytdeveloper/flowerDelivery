// src/components/AdminPanel/WrapperManagement/WrapperForm.js
import React, { useState, useRef } from 'react';
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
    const [uploadMethod, setUploadMethod] = useState('file'); // 'file' или 'url'
    const [localImagePreview, setLocalImagePreview] = useState(null); // Для предпросмотра локальных файлов
    const fileInputRef = useRef(null);

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

    // Функция для получения URL изображения для предпросмотра
    const getImagePreviewUrl = () => {
        if (localImagePreview) {
            return localImagePreview; // Локальный файл
        }
        if (wrapper.image) {
            // Если это полный URL или base64
            if (wrapper.image.startsWith('http') || wrapper.image.startsWith('data:') || wrapper.image.startsWith('/')) {
                return wrapper.image;
            }
            // Если это относительный путь
            return `${apiUrl}/uploads/${wrapper.image}`;
        }
        return null;
    };

    // Загрузка изображения через файл
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Проверка типа файла
        if (!file.type.startsWith('image/')) {
            toast.error('Пожалуйста, выберите файл изображения');
            return;
        }

        // Проверка размера файла (максимум 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Размер файла не должен превышать 5MB');
            return;
        }

        // Создаем предпросмотр для локального файла
        const previewUrl = URL.createObjectURL(file);
        setLocalImagePreview(previewUrl);

        try {
            setUploadingImage(true);
            const formData = new FormData();
            formData.append('image', file);
            formData.append('itemType', 'wrapper');

            const response = await fetch(`${apiUrl}/api/admin/upload-wrapper-addon-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                // Очищаем локальный предпросмотр после загрузки на сервер
                if (localImagePreview) {
                    URL.revokeObjectURL(localImagePreview);
                    setLocalImagePreview(null);
                }
                handleChange('image', data.imageUrl);
                toast.success('Изображение успешно загружено');
                setUploadMethod('file');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка загрузки изображения');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error(error.message || 'Ошибка загрузки изображения');
            // Очищаем предпросмотр при ошибке
            if (localImagePreview) {
                URL.revokeObjectURL(localImagePreview);
                setLocalImagePreview(null);
            }
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Добавление URL изображения
    const handleAddImageUrl = async () => {
        if (!imageUrlInput.trim()) {
            toast.error('Введите URL изображения');
            return;
        }

        try {
            // Валидируем URL
            new URL(imageUrlInput);

            // Очищаем локальный предпросмотр при использовании URL
            if (localImagePreview) {
                URL.revokeObjectURL(localImagePreview);
                setLocalImagePreview(null);
            }

            // Отправляем URL на сервер для валидации
            setUploadingImage(true);
            const response = await fetch(`${apiUrl}/api/admin/upload-wrapper-addon-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    imageUrl: imageUrlInput.trim(),
                    itemType: 'wrapper'
                })
            });

            if (response.ok) {
                const data = await response.json();
                handleChange('image', data.imageUrl);
                setImageUrlInput('');
                setShowUrlInput(false);
                setUploadMethod('url');
                toast.success('URL изображения добавлен');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка валидации URL');
            }
        } catch (error) {
            console.error('Error adding image URL:', error);
            toast.error(error.message || 'Введите корректный URL изображения');
        } finally {
            setUploadingImage(false);
        }
    };

    // Удаление изображения
    const handleRemoveImage = () => {
        // Очищаем локальный предпросмотр
        if (localImagePreview) {
            URL.revokeObjectURL(localImagePreview);
            setLocalImagePreview(null);
        }
        handleChange('image', '');
        setUploadMethod('file');
        toast.info('Изображение удалено');
    };

    // Очистка при размонтировании
    React.useEffect(() => {
        return () => {
            if (localImagePreview) {
                URL.revokeObjectURL(localImagePreview);
            }
        };
    }, [localImagePreview]);

    // Обработчик отправки формы
    const handleSubmit = async (e) => {
        e.preventDefault();
        await handleSave();
    };

    // Сохранение обёртки
    const handleSave = async () => {
        // Валидация обязательных полей
        if (!wrapper.name.trim()) {
            toast.error('Введите название обёртки');
            return;
        }

        if (!wrapper.price || Number(wrapper.price) <= 0) {
            toast.error('Введите корректную цену');
            return;
        }

        if (!wrapper.image) {
            toast.error('Добавьте изображение обёртки');
            return;
        }

        try {
            setIsSaving(true);

            // Подготовка данных - убеждаемся, что все поля корректны
            const wrapperData = {
                name: wrapper.name.trim(),
                description: wrapper.description.trim(),
                price: Number(wrapper.price),
                quantity: wrapper.quantity ? Number(wrapper.quantity) : 10,
                image: wrapper.image,
                isActive: Boolean(wrapper.isActive)
            };

            // Добавляем originalPrice только если он указан и больше 0
            if (wrapper.originalPrice && Number(wrapper.originalPrice) > 0) {
                wrapperData.originalPrice = Number(wrapper.originalPrice);
            }

            const url = isEditing
                ? `${apiUrl}/api/admin/wrappers/${wrapper._id}`
                : `${apiUrl}/api/admin/wrappers`;

            const method = isEditing ? 'PUT' : 'POST';

            console.log('Sending wrapper data:', wrapperData);

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
                console.error('Server error response:', errorData);
                throw new Error(errorData.message || `Ошибка ${response.status} при сохранении обёртки`);
            }
        } catch (error) {
            console.error('Error saving wrapper:', error);
            toast.error(error.message || 'Ошибка при сохранении обёртки');
        } finally {
            setIsSaving(false);
        }
    };

    const imagePreviewUrl = getImagePreviewUrl();

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content medium-modal wrapper-form-modal" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="modal-header">
                        <h3 className="wrapper-form-modal-title">{isEditing ? 'Редактирование обёртки' : 'Создание новой обёртки'}</h3>
                        <button type="button" className="modal-close" onClick={onCancel}>×</button>
                    </div>
                    <div className="modal-body">
                        <div className="edit-form">
                            {/* Основная информация */}
                            <div className="form-section">
                                <h4>Основная информация</h4>
                                <div className="form-group">
                                    <label htmlFor="name">Название *</label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={wrapper.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        className="form-control"
                                        required
                                        placeholder="Введите название обёртки"
                                        disabled={isSaving}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="description">Описание</label>
                                    <textarea
                                        id="description"
                                        value={wrapper.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        className="form-control"
                                        rows="3"
                                        placeholder="Описание обёртки"
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>

                            {/* Цены и количество */}
                            <div className="form-section">
                                <h4>Цены и количество</h4>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="price">Цена (₸) *</label>
                                        <input
                                            id="price"
                                            type="number"
                                            value={wrapper.price}
                                            onChange={(e) => handleChange('price', e.target.value)}
                                            className="form-control"
                                            required
                                            min="0"
                                            step="1"
                                            placeholder="Текущая цена"
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="originalPrice">Старая цена (₸)</label>
                                        <input
                                            id="originalPrice"
                                            type="number"
                                            value={wrapper.originalPrice || ''}
                                            onChange={(e) => handleChange('originalPrice', e.target.value)}
                                            className="form-control"
                                            min="0"
                                            step="1"
                                            placeholder="Цена до скидки"
                                            disabled={isSaving}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="quantity">Количество в наличии</label>
                                    <input
                                        id="quantity"
                                        type="number"
                                        value={wrapper.quantity}
                                        onChange={(e) => handleChange('quantity', e.target.value)}
                                        className="form-control"
                                        min="0"
                                        step="1"
                                        placeholder="Количество обёрток"
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>

                            {/* Изображение */}
                            <div className="form-section">
                                <h4>Изображение *</h4>

                                {imagePreviewUrl && (
                                    <div className="image-preview">
                                        <img
                                            src={imagePreviewUrl}
                                            alt="Preview"
                                            onError={(e) => {
                                                console.error('Error loading image:', imagePreviewUrl);
                                                e.target.src = '/images/placeholder-image.jpg';
                                            }}
                                        />
                                        <div className="image-source-badge">
                                            {localImagePreview ? 'Локальный файл' : (uploadMethod === 'url' ? 'URL' : 'Файл')}
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-danger btn-sm"
                                            onClick={handleRemoveImage}
                                            disabled={isSaving || uploadingImage}
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                )}

                                <div className="image-upload-options">
                                    {/* Загрузка файла */}
                                    <div className="form-group">
                                        <label htmlFor="file-upload">Загрузить изображение с компьютера:</label>
                                        <input
                                            id="file-upload"
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="form-control"
                                            disabled={isSaving || uploadingImage}
                                        />
                                        {uploadingImage && <p>Загрузка изображения...</p>}
                                    </div>

                                    {/* Или через URL */}
                                    <div className="form-group">
                                        <label>Или используйте URL изображения:</label>
                                        {!showUrlInput ? (
                                            <button
                                                type="button"
                                                className="btn btn-outline btn-sm add-image-url"
                                                onClick={() => setShowUrlInput(true)}
                                                disabled={isSaving || uploadingImage}
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
                                                    placeholder="Введите URL изображения (https://...)"
                                                    disabled={isSaving || uploadingImage}
                                                />
                                                <div className="url-input-buttons">
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary btn-sm"
                                                        onClick={handleAddImageUrl}
                                                        disabled={isSaving || uploadingImage}
                                                    >
                                                        {uploadingImage ? 'Проверка...' : 'Добавить'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline btn-sm"
                                                        onClick={() => setShowUrlInput(false)}
                                                        disabled={uploadingImage}
                                                    >
                                                        Отмена
                                                    </button>
                                                </div>
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
                                            disabled={isSaving}
                                        />
                                        Активная обёртка
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={onCancel}
                            disabled={isSaving}
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSaving || uploadingImage}
                        >
                            {isSaving ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Создать обёртку')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WrapperForm;