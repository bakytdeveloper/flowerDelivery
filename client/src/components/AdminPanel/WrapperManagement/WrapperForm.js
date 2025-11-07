// src/components/AdminPanel/WrapperManagement/WrapperForm.js
import React, { useState, useRef, useEffect } from 'react';
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
    const [selectedFile, setSelectedFile] = useState(null); // Выбранный файл для загрузки
    const [localImagePreview, setLocalImagePreview] = useState(null); // Для локального предпросмотра

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

    // Функция для получения корректного URL изображения
    const getImageUrl = (imagePath) => {
        if (!imagePath) {
            return '/images/placeholder-wrapper.jpg';
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

    // Инициализация формы при редактировании
    useEffect(() => {
        if (initialWrapper && initialWrapper.image) {
            // Если есть существующее изображение, устанавливаем его для предпросмотра
            setLocalImagePreview(getImageUrl(initialWrapper.image));
        }
    }, [initialWrapper]);

    const handleChange = (field, value) => {
        setWrapper(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Проверка, все ли обязательные поля заполнены
    const isFormValid = () => {
        const hasImage = wrapper.image || selectedFile || (showUrlInput && imageUrlInput.trim());
        return wrapper.name &&
            wrapper.price &&
            hasImage &&
            wrapper.quantity !== '' &&
            wrapper.quantity !== undefined;
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

        // Очищаем существующее изображение из данных
        handleChange('image', '');
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
            if (localImagePreview && localImagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(localImagePreview);
                setLocalImagePreview(null);
            }
        }

        // Очищаем существующее изображение из данных
        handleChange('image', '');
    };

    // Отмена ввода URL
    const handleCancelUrlInput = () => {
        setShowUrlInput(false);
        setImageUrlInput('');
        setUploadMethod('file');

        // Восстанавливаем предпросмотр существующего изображения при редактировании
        if (initialWrapper && initialWrapper.image && !selectedFile) {
            setLocalImagePreview(getImageUrl(initialWrapper.image));
        }
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
            if (localImagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(localImagePreview);
            }
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
        formData.append('itemType', 'wrapper');

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

    // Сохранение обёртки
    const handleSave = async () => {
        // Валидация обязательных полей
        if (!isFormValid()) {
            toast.error('Заполните все обязательные поля: название, цена, изображение, количество');
            return;
        }

        try {
            setIsSaving(true);
            setUploadingImage(true);

            let finalImageUrl = wrapper.image;
            let shouldDeleteOldImage = false;
            let oldImageUrl = null;

            // Если редактируем и изображение изменилось, запоминаем старое для удаления
            if (isEditing && initialWrapper && initialWrapper.image) {
                const imageChanged =
                    (selectedFile && initialWrapper.image !== finalImageUrl) ||
                    (showUrlInput && imageUrlInput.trim() && initialWrapper.image !== finalImageUrl) ||
                    (!selectedFile && !showUrlInput && initialWrapper.image !== finalImageUrl);

                if (imageChanged &&
                    !initialWrapper.image.startsWith('http') &&
                    !initialWrapper.image.startsWith('data:')) {
                    shouldDeleteOldImage = true;
                    oldImageUrl = initialWrapper.image;
                }
            }

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
                            itemType: 'wrapper'
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
            // Если редактируем и изображение не менялось - используем существующее
            else if (isEditing && initialWrapper.image && !selectedFile && !showUrlInput) {
                finalImageUrl = initialWrapper.image;
                shouldDeleteOldImage = false; // Не удаляем если не менялось
            }

            // Подготовка данных - преобразуем в числа
            const wrapperData = {
                ...wrapper,
                image: finalImageUrl,
                price: Number(wrapper.price),
                originalPrice: wrapper.originalPrice ? Number(wrapper.originalPrice) : undefined,
                quantity: Number(wrapper.quantity) || 0
            };

            // Если нужно удалить старое изображение, добавляем флаг
            if (shouldDeleteOldImage && oldImageUrl) {
                wrapperData._oldImageToDelete = oldImageUrl;
            }

            // Проверяем, что числовые поля корректны
            if (isNaN(wrapperData.price) || wrapperData.price < 0) {
                toast.error('Введите корректную цену');
                return;
            }

            if (isNaN(wrapperData.quantity) || wrapperData.quantity < 0) {
                toast.error('Введите корректное количество');
                return;
            }

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

                // Очищаем локальный предпросмотр после сохранения
                if (localImagePreview && localImagePreview.startsWith('blob:')) {
                    URL.revokeObjectURL(localImagePreview);
                    setLocalImagePreview(null);
                }

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
            setUploadingImage(false);
        }
    };

    // Получение URL для предпросмотра
    const getPreviewImage = () => {
        if (localImagePreview) {
            return localImagePreview; // Локальный предпросмотр файла или существующее изображение
        }
        return null;
    };

    // Очистка при размонтировании
    useEffect(() => {
        return () => {
            // Очищаем локальные URL при размонтировании компонента
            if (localImagePreview && localImagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(localImagePreview);
            }
        };
    }, [localImagePreview]);

    const previewImage = getPreviewImage();
    const hasImageSource = selectedFile || (showUrlInput && imageUrlInput.trim()) || wrapper.image || (initialWrapper && initialWrapper.image);

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
                                    disabled={isSaving}
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
                                    disabled={isSaving}
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
                                        min="0"
                                        step="0.01"
                                        placeholder="Текущая цена"
                                        disabled={isSaving}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Старая цена (₸)</label>
                                    <input
                                        type="number"
                                        value={wrapper.originalPrice || ''}
                                        onChange={(e) => handleChange('originalPrice', e.target.value)}
                                        className="form-control"
                                        min="0"
                                        step="0.01"
                                        placeholder="Цена до скидки"
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Количество в наличии *</label>
                                <input
                                    type="number"
                                    value={wrapper.quantity}
                                    onChange={(e) => handleChange('quantity', e.target.value)}
                                    className="form-control"
                                    required
                                    min="0"
                                    placeholder="Количество обёрток"
                                    disabled={isSaving}
                                />
                            </div>
                        </div>

                        {/* Изображение */}
                        <div className="form-section">
                            <h4>Изображение *</h4>

                            {previewImage && (
                                <div className="image-preview">
                                    <img
                                        src={previewImage}
                                        alt="Preview"
                                        onError={(e) => {
                                            e.target.src = '/images/placeholder-wrapper.jpg';
                                        }}
                                    />
                                    <div className="image-source-badge">
                                        {selectedFile ? 'Файл (будет загружен)' :
                                            showUrlInput && imageUrlInput ? 'URL (будет проверен)' :
                                                'Загруженное изображение'}
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
                                    <label>Загрузить изображение с компьютера:</label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLocalFileSelect}
                                        className="form-control"
                                        disabled={isSaving || uploadingImage || showUrlInput}
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
                                            disabled={isSaving || uploadingImage || selectedFile}
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
                                                disabled={isSaving || uploadingImage}
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
                    <button className="btn btn-outline" onClick={onCancel} disabled={isSaving}>
                        Отмена
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={isSaving || !isFormValid()}
                    >
                        {isSaving ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Создать обёртку')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WrapperForm;