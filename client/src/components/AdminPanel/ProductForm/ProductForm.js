// src/components/AdminPanel/ProductManagement/ProductForm.js
import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { occasionOptions, recipientOptions } from "../../../constants/constants";
import { toast } from 'react-toastify';
import CustomSelect from "../../Common/CustomSelect";
import './ProductForm.css';

const ProductForm = ({ onSave, onCancel, initialProduct = null }) => {
    const { token } = useAuth();
    const [product, setProduct] = useState(initialProduct || getDefaultProduct());
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [showUrlInput, setShowUrlInput] = useState(false);

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5506';
    const isEditing = !!initialProduct;

    function getDefaultProduct() {
        return {
            name: '',
            description: '',
            price: '',
            originalPrice: '',
            type: 'single',
            occasion: '',
            recipient: '',
            flowerNames: [''],
            stemLength: '',
            characteristics: [],
            images: [],
            quantity: 10,
            soldCount: 0,
            isActive: true
        };
    }

    const handleChange = (field, value) => {
        setProduct(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Обработка характеристик
    const handleCharacteristicChange = (index, field, value) => {
        const updatedCharacteristics = [...product.characteristics];
        updatedCharacteristics[index][field] = value;
        handleChange('characteristics', updatedCharacteristics);
    };

    const addCharacteristic = () => {
        const updatedCharacteristics = [
            ...product.characteristics,
            { name: '', value: '' }
        ];
        handleChange('characteristics', updatedCharacteristics);
    };

    const removeCharacteristic = (index) => {
        const updatedCharacteristics = product.characteristics.filter((_, i) => i !== index);
        handleChange('characteristics', updatedCharacteristics);
    };

    // Обработка названий цветов
    const handleFlowerNameChange = (index, value) => {
        const updatedFlowerNames = [...product.flowerNames];
        updatedFlowerNames[index] = value;
        handleChange('flowerNames', updatedFlowerNames);
    };

    const addFlowerName = () => {
        const updatedFlowerNames = [...product.flowerNames, ''];
        handleChange('flowerNames', updatedFlowerNames);
    };

    const removeFlowerName = (index) => {
        const updatedFlowerNames = product.flowerNames.filter((_, i) => i !== index);
        handleChange('flowerNames', updatedFlowerNames);
    };

    // Загрузка изображений
    const handleImageUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        try {
            setUploadingImages(true);
            const formData = new FormData();
            files.forEach(file => {
                formData.append('images', file);
            });

            const response = await fetch(`${apiUrl}/api/admin/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                const newImages = data.images || [];
                const updatedImages = [...product.images, ...newImages];
                handleChange('images', updatedImages);
                toast.success('Изображения успешно загружены');
            } else {
                throw new Error('Ошибка загрузки изображений');
            }
        } catch (error) {
            console.error('Error uploading images:', error);
            toast.error('Ошибка загрузки изображений');
        } finally {
            setUploadingImages(false);
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

        const updatedImages = [...product.images, imageUrlInput.trim()];
        handleChange('images', updatedImages);
        setImageUrlInput('');
        setShowUrlInput(false);
        toast.success('URL изображения добавлен');
    };

    const removeImage = (index) => {
        const updatedImages = product.images.filter((_, i) => i !== index);
        handleChange('images', updatedImages);
    };

    const getImageType = (imageUrl) => {
        if (imageUrl.startsWith('http') && !imageUrl.includes('/uploads/')) {
            return 'url';
        }
        return 'uploaded';
    };

    // Проверка на дубликат
    const checkDuplicate = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/admin/products/check-duplicate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: product.name,
                    type: product.type,
                    flowerNames: product.flowerNames
                })
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            }
            return { isDuplicate: false };
        } catch (error) {
            console.error('Error checking duplicate:', error);
            return { isDuplicate: false };
        }
    };

    // Сохранение товара
    const handleSave = async () => {
        // Валидация обязательных полей
        if (!product.name || !product.price) {
            toast.error('Заполните обязательные поля: название, цена, категория');
            return;
        }

        if (!product.flowerNames || product.flowerNames.length === 0 || !product.flowerNames[0].trim()) {
            toast.error('Добавьте хотя бы одно название цветка');
            return;
        }

        try {
            setIsSaving(true);

            // Проверка на дубликат только при создании
            if (!isEditing) {
                const duplicateCheck = await checkDuplicate();
                if (duplicateCheck.isDuplicate) {
                    toast.error('Товар с таким названием и цветами уже существует');
                    return;
                }
            }

            // Подготовка данных
            const productData = {
                ...product,
                price: Number(product.price),
                originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
                stemLength: product.stemLength ? Number(product.stemLength) : undefined,
                quantity: product.quantity ? Number(product.quantity) : 10,
                soldCount: product.soldCount ? Number(product.soldCount) : 0,
                characteristics: product.characteristics.filter(char =>
                    char.name && char.value && char.name.trim() !== '' && char.value.trim() !== ''
                ),
                flowerNames: product.flowerNames.filter(name => name && name.trim() !== ''),
                images: product.images
            };

            const url = isEditing
                ? `${apiUrl}/api/admin/products/${product._id}`
                : `${apiUrl}/api/admin/products`;

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });

            if (response.ok) {
                const savedProduct = await response.json();
                // toast.success(isEditing ? 'Товар успешно обновлен' : 'Товар успешно создан');

                    if (isEditing) {
                        toast.success( 'Товар успешно обновлен');
                    }

                onSave(savedProduct);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка при сохранении товара');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error(error.message || 'Ошибка при сохранении товара');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content large-modal product-form-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{isEditing ? 'Редактирование товара' : 'Создание нового товара'}</h3>
                    <button className="modal-close" onClick={onCancel}>×</button>
                </div>
                <div className="modal-body">
                    <div className="edit-form">
                        {/* Основная информация */}
                        <div className="form-section">
                            <h4>Основная информация</h4>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Название *</label>
                                    <input
                                        type="text"
                                        value={product.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        className="form-control"
                                        required
                                        placeholder="Введите название товара"
                                    />
                                </div>

                            </div>

                            <div className="form-group">
                                <label>Описание</label>
                                <textarea
                                    value={product.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    className="form-control"
                                    rows="3"
                                    placeholder="Подробное описание товара"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Тип</label>
                                    <CustomSelect
                                        value={product.type}
                                        onChange={(value) => handleChange('type', value)}
                                        options={[
                                            { value: 'single', label: 'Одиночный цветок' },
                                            { value: 'bouquet', label: 'Букет' }
                                        ]}
                                        className="form-control-background"
                                    />
                                </div>
                                {/* Повод */}
                                <div className="form-group">
                                    <label>Повод</label>
                                    <CustomSelect
                                        value={product.occasion}
                                        onChange={(value) => handleChange('occasion', value)}
                                        options={[
                                            { value: '', label: 'Выберите повод' },
                                            ...occasionOptions.map(option => ({
                                                value: option.value,
                                                label: option.label
                                            }))
                                        ]}
                                        className="form-control-background"
                                    />
                                </div>


                            {/* Кому */}
                            <div className="form-group"  style={{zIndex:"0"}}>
                                <label>Кому</label>
                                <CustomSelect
                                    value={product.recipient}
                                    onChange={(value) => handleChange('recipient', value)}
                                    options={[
                                        { value: '', label: 'Выберите получателя' },
                                        ...recipientOptions.map(option => ({
                                            value: option.value,
                                            label: option.label
                                        }))
                                    ]}
                                    className="form-control-background"
                                />
                            </div>

                                <div className="form-group"  style={{zIndex:"0"}}>
                                    <label>Длина стебля (см)</label>
                                    <input
                                        type="number"
                                        value={product.stemLength}
                                        onChange={(e) => handleChange('stemLength', e.target.value)}
                                        className="form-control"
                                        placeholder="Например: 40"
                                    />
                                </div>
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
                                        value={product.price}
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
                                        value={product.originalPrice || ''}
                                        onChange={(e) => handleChange('originalPrice', e.target.value)}
                                        className="form-control"
                                        placeholder="Цена до скидки (если есть)"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Количество в наличии</label>
                                    <input
                                        type="number"
                                        value={product.quantity}
                                        onChange={(e) => handleChange('quantity', e.target.value)}
                                        className="form-control"
                                        placeholder="Количество товара"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Уже продано</label>
                                    <input
                                        type="number"
                                        value={product.soldCount}
                                        onChange={(e) => handleChange('soldCount', e.target.value)}
                                        className="form-control"
                                        placeholder="Количество проданных единиц"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Названия цветов */}
                        {/* Названия цветов */}
                        <div className="form-section">
                            <h4>Названия цветов *</h4>
                            <div className="flower-names-container">
                                {product.flowerNames.map((flowerName, index) => (
                                    <div key={index} className="flower-name-item">
                                        <div className="flower-name-input">
                                            <input
                                                type="text"
                                                value={flowerName}
                                                onChange={(e) => handleFlowerNameChange(index, e.target.value)}
                                                className="form-control form-control-input-name-flowers "
                                                placeholder={`Название цветка ${index + 1}`}
                                                required={index === 0}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="flower-name-remove-btn"
                                            onClick={() => removeFlowerName(index)}
                                            disabled={product.flowerNames.length === 1}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                className="btn-add-flower-type"
                                onClick={addFlowerName}
                            >
                                + Добавить цветок
                            </button>
                        </div>

                        {/* Характеристики */}
                        <div className="form-section">
                            <h4>Характеристики</h4>
                            <div className="characteristics-container">
                                {product.characteristics.map((char, index) => (
                                    <div key={index} className="characteristic-item">
                                        <div className="characteristic-input-group">
                                            <div className="characteristic-input">
                                                <input
                                                    type="text"
                                                    value={char.name}
                                                    onChange={(e) => handleCharacteristicChange(index, 'name', e.target.value)}
                                                    className="form-control form-control-input-characteristic-flowers"
                                                    placeholder="Название характеристики"
                                                />
                                            </div>
                                            <div className="characteristic-input">
                                                <input
                                                    type="text"
                                                    value={char.value}
                                                    onChange={(e) => handleCharacteristicChange(index, 'value', e.target.value)}
                                                    className="form-control form-control-input-characteristic-flowers"
                                                    placeholder="Значение"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="characteristic-remove-btn"
                                            onClick={() => removeCharacteristic(index)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                className="characteristic-add-btn"
                                onClick={addCharacteristic}
                            >
                                + Добавить характеристику
                            </button>
                        </div>



                        {/* Изображения */}
                        <div className="form-section">
                            <h4>Изображения</h4>
                            <div className="images-preview">
                                {product.images.map((image, index) => (
                                    <div key={index} className="image-item">
                                        <img src={image} alt={`Preview ${index + 1}`} />
                                        <div className="image-badge">
                                            {getImageType(image) === 'url' ? 'URL' : 'File'}
                                        </div>
                                        <div type="button"
                                             onClick={() => removeImage(index)}
                                             className="button-dangers">
                                            {/*<button*/}
                                            {/*    type="button"*/}
                                            {/*    className="btn btn-dangers btn-sm"*/}
                                            {/*    onClick={() => removeImage(index)}*/}
                                            {/*>*/}
                                                ×
                                            {/*</button>*/}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="image-upload-options">
                                <div className="form-group">
                                    <label>Загрузить изображения с компьютера:</label>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="form-control"
                                        disabled={uploadingImages}
                                    />
                                    {uploadingImages && <p>Загрузка изображений...</p>}
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
                                        checked={product.isActive}
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
                        {isSaving ? 'Сохранение...' : (isEditing ? 'Сохранить' : 'Создать товар')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductForm;