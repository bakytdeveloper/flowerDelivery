// src/components/AdminPanel/AddonManagement/AddonForm.js
import React, { useState, useRef } from 'react';
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
    const [uploadMethod, setUploadMethod] = useState('file'); // 'file' или 'url'
    const [selectedFile, setSelectedFile] = useState(null); // Выбранный файл для загрузки
    const [localImagePreview, setLocalImagePreview] = useState(null); // Для локального предпросмотра

    const fileInputRef = useRef(null);
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

    // Проверка, все ли обязательные поля заполнены
    const isFormValid = () => {
        const hasImage = addon.image || selectedFile || (showUrlInput && imageUrlInput.trim());
        return addon.name &&
            addon.price &&
            hasImage &&
            addon.quantity !== '' &&
            addon.quantity !== undefined;
    };

    // Локальный предпросмотр для файлов
    const handleLocalFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Проверяем тип файла
        if (!file.type.startsWith('image/')) {
            toast.error('Пожалуйста, выберите файл изображения');
            event.target.value = '';
            return;
        }

        // Сохраняем файл для последующей загрузки
        setSelectedFile(file);
        setUploadMethod('file');

        // Создаем локальный URL для предпросмотра
        const previewUrl = URL.createObjectURL(file);
        setLocalImagePreview(previewUrl);

        // Сбрасываем URL поле если оно было активно
        if (showUrlInput) {
            setImageUrlInput('');
            setShowUrlInput(false);
        }
    };

    // Активация поля URL
    const activateUrlInput = () => {
        setShowUrlInput(true);
        setUploadMethod('url');

        // Сбрасываем файловый ввод если он был активен
        if (selectedFile) {
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            if (localImagePreview) {
                URL.revokeObjectURL(localImagePreview);
                setLocalImagePreview(null);
            }
        }
    };

    // Отмена ввода URL
    const handleCancelUrlInput = () => {
        setShowUrlInput(false);
        setImageUrlInput('');
        setUploadMethod('file');
    };

    // Удаление изображения
    const handleRemoveImage = () => {
        handleChange('image', '');
        setSelectedFile(null);
        setUploadMethod('file');
        setImageUrlInput('');
        setShowUrlInput(false);

        // Очищаем локальный предпросмотр
        if (localImagePreview) {
            URL.revokeObjectURL(localImagePreview);
            setLocalImagePreview(null);
        }

        // Очищаем файловый ввод
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        toast.info('Изображение удалено');
    };

    // Загрузка изображения на сервер
    const uploadImageToServer = async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('itemType', 'addon');

        const response = await fetch(`${apiUrl}/api/admin/upload-wrapper-addon-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка загрузки изображения');
        }

        return await response.json();
    };

    // Сохранение дополнения
    const handleSave = async () => {
        // Валидация обязательных полей
        if (!isFormValid()) {
            toast.error('Заполните все обязательные поля: название, цена, изображение, количество');
            return;
        }

        try {
            setIsSaving(true);
            setUploadingImage(true);

            let finalImageUrl = addon.image;

            // Если выбран файл - загружаем его
            if (selectedFile) {
                try {
                    const uploadResult = await uploadImageToServer(selectedFile);
                    finalImageUrl = uploadResult.imageUrl;
                    toast.success('Изображение успешно загружено');
                } catch (uploadError) {
                    console.error('Error uploading image:', uploadError);
                    toast.error('Ошибка загрузки изображения: ' + uploadError.message);
                    return;
                }
            }
            // Если введен URL - используем его
            else if (showUrlInput && imageUrlInput.trim()) {
                try {
                    // Валидируем URL
                    new URL(imageUrlInput.trim());

                    const response = await fetch(`${apiUrl}/api/admin/upload-wrapper-addon-image`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            imageUrl: imageUrlInput.trim(),
                            itemType: 'addon'
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        finalImageUrl = data.imageUrl;
                        toast.success('URL изображения добавлен');
                    } else {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Ошибка валидации URL');
                    }
                } catch (urlError) {
                    console.error('Error adding image URL:', urlError);
                    toast.error('Ошибка добавления URL: ' + urlError.message);
                    return;
                }
            }

            // Подготовка данных - преобразуем в числа
            const addonData = {
                ...addon,
                image: finalImageUrl,
                price: Number(addon.price),
                originalPrice: addon.originalPrice ? Number(addon.originalPrice) : undefined,
                quantity: Number(addon.quantity) || 0
            };

            // Проверяем, что числовые поля корректны
            if (isNaN(addonData.price) || addonData.price < 0) {
                toast.error('Введите корректную цену');
                return;
            }

            if (isNaN(addonData.quantity) || addonData.quantity < 0) {
                toast.error('Введите корректное количество');
                return;
            }

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

                // Очищаем локальный предпросмотр после сохранения
                if (localImagePreview) {
                    URL.revokeObjectURL(localImagePreview);
                    setLocalImagePreview(null);
                }

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
            setUploadingImage(false);
        }
    };

    // Получение URL для предпросмотра
    const getPreviewImage = () => {
        if (localImagePreview) {
            return localImagePreview; // Локальный предпросмотр файла
        }
        if (addon.image && !addon.image.startsWith('blob:')) {
            return addon.image; // Уже загруженное изображение
        }
        return null;
    };

    // Очистка при размонтировании
    React.useEffect(() => {
        return () => {
            // Очищаем локальные URL при размонтировании компонента
            if (localImagePreview) {
                URL.revokeObjectURL(localImagePreview);
            }
        };
    }, [localImagePreview]);

    const previewImage = getPreviewImage();
    const hasImageSource = selectedFile || (showUrlInput && imageUrlInput.trim()) || addon.image;

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
                                        min="0"
                                        step="0.01"
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
                                        min="0"
                                        step="0.01"
                                        placeholder="Цена до скидки"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Количество в наличии *</label>
                                <input
                                    type="number"
                                    value={addon.quantity}
                                    onChange={(e) => handleChange('quantity', e.target.value)}
                                    className="form-control"
                                    required
                                    min="0"
                                    placeholder="Количество товара"
                                />
                            </div>
                        </div>

                        {/* Изображение */}
                        <div className="form-section">
                            <h4>Изображение *</h4>

                            {previewImage && (
                                <div className="image-preview">
                                    <img src={previewImage} alt="Preview"
                                         onError={(e) => {
                                             e.target.src = '/images/placeholder-addon.jpg';
                                         }} />
                                    <div className="image-source-badge">
                                        {selectedFile ? 'Файл (будет загружен)' :
                                            showUrlInput && imageUrlInput ? 'URL (будет проверен)' :
                                                'Загруженное изображение'}
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-danger btn-sm"
                                        onClick={handleRemoveImage}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            )}

                            <div className="image-upload-options">
                                {/* Загрузка файла */}
                                <div className="form-group">
                                    <label>Загрузить изображение с компьютера:</label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLocalFileSelect}
                                        className="form-control"
                                        disabled={uploadingImage || showUrlInput}
                                    />
                                    {selectedFile && (
                                        <div className="upload-info">
                                            <p>✓ Файл выбран. Будет загружен при сохранении.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="upload-separator">
                                    <span>или</span>
                                </div>

                                {/* Или через URL */}
                                <div className="form-group">
                                    <label>Использовать URL изображения:</label>
                                    {!showUrlInput ? (
                                        <button
                                            type="button"
                                            className="btn btn-outline btn-sm add-image-url"
                                            onClick={activateUrlInput}
                                            disabled={selectedFile}
                                        >
                                            + Вставить URL изображения
                                        </button>
                                    ) : (
                                        <div className="url-input-group">
                                            <input
                                                type="text"
                                                value={imageUrlInput}
                                                onChange={(e) => setImageUrlInput(e.target.value)}
                                                className="form-control"
                                                placeholder="Введите URL изображения (https://...)"
                                                disabled={uploadingImage}
                                            />
                                            <div className="url-input-buttons">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline btn-sm"
                                                    onClick={handleCancelUrlInput}
                                                    disabled={uploadingImage}
                                                >
                                                    Отмена
                                                </button>
                                            </div>
                                            {imageUrlInput.trim() && (
                                                <div className="upload-info">
                                                    <p>✓ URL введен. Будет проверен при сохранении.</p>
                                                </div>
                                            )}
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
                        disabled={isSaving || !isFormValid()}
                    >
                        {isSaving ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Создать дополнение')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddonForm;