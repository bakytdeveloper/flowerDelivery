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
    // const [uploadingColorImages, setUploadingColorImages] = useState({});

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
            isActive: true,
            availableColors: [],
            stemLengths: [{ length: '', price: '', originalPrice: '' }]
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

    /// КОДЫ ПО УПРАВЛЕНИЮ ЦВЕТОМ ЦВЕТОВ
    // // Обработка цветов
    // const handleColorChange = (index, field, value) => {
    //     const updatedColors = [...product.availableColors];
    //     updatedColors[index][field] = value;
    //     handleChange('availableColors', updatedColors);
    // };
    //
    // const addColor = () => {
    //     const updatedColors = [
    //         ...product.availableColors,
    //         { name: '', value: '#000000', colorImages: [] }
    //     ];
    //     handleChange('availableColors', updatedColors);
    // };
    //
    // const removeColor = (index) => {
    //     const updatedColors = product.availableColors.filter((_, i) => i !== index);
    //     handleChange('availableColors', updatedColors);
    // };

    const handleColorChange = (field, value) => {
        // Всегда работаем только с первым (единственным) цветом
        const updatedColors = [{ ...product.availableColors[0], [field]: value }];
        handleChange('availableColors', updatedColors);
    };


    // // Загрузка изображений для цвета
    // const handleColorImageUpload = async (event, colorIndex) => {
    //     const files = Array.from(event.target.files);
    //     if (files.length === 0) return;
    //
    //     try {
    //         setUploadingColorImages(prev => ({ ...prev, [colorIndex]: true }));
    //         const formData = new FormData();
    //         files.forEach(file => {
    //             formData.append('images', file);
    //         });
    //
    //         const response = await fetch(`${apiUrl}/api/admin/upload`, {
    //             method: 'POST',
    //             headers: {
    //                 'Authorization': `Bearer ${token}`
    //             },
    //             body: formData
    //         });
    //
    //         if (response.ok) {
    //             const data = await response.json();
    //             const newImages = data.images || [];
    //             const updatedColors = [...product.availableColors];
    //             updatedColors[colorIndex].colorImages = [
    //                 ...(updatedColors[colorIndex].colorImages || []),
    //                 ...newImages
    //             ];
    //             handleChange('availableColors', updatedColors);
    //             toast.success('Изображения цвета успешно загружены');
    //         } else {
    //             throw new Error('Ошибка загрузки изображений цвета');
    //         }
    //     } catch (error) {
    //         console.error('Error uploading color images:', error);
    //         toast.error('Ошибка загрузки изображений цвета');
    //     } finally {
    //         setUploadingColorImages(prev => ({ ...prev, [colorIndex]: false }));
    //         event.target.value = '';
    //     }
    // };
    //
    // const removeColorImage = (colorIndex, imageIndex) => {
    //     const updatedColors = [...product.availableColors];
    //     updatedColors[colorIndex].colorImages = updatedColors[colorIndex].colorImages.filter(
    //         (_, i) => i !== imageIndex
    //     );
    //     handleChange('availableColors', updatedColors);
    // };

    // Обработка вариантов длины стебля
    const handleStemLengthChange = (index, field, value) => {
        const updatedStemLengths = [...product.stemLengths];
        updatedStemLengths[index][field] = value;
        handleChange('stemLengths', updatedStemLengths);
    };

    const addStemLength = () => {
        const updatedStemLengths = [
            ...product.stemLengths,
            { length: '', price: '', originalPrice: '' }
        ];
        handleChange('stemLengths', updatedStemLengths);
    };

    const removeStemLength = (index) => {
        if (product.stemLengths.length <= 1) return;
        const updatedStemLengths = product.stemLengths.filter((_, i) => i !== index);
        handleChange('stemLengths', updatedStemLengths);
    };

    // Загрузка основных изображений
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
        if (!product.name || !product.type) {
            toast.error('Заполните обязательные поля: название, тип');
            return;
        }

        // Валидация для штучных цветов
        if (product.type === 'single') {
            // Проверяем доступные цвета
            if (!product.availableColors || product.availableColors.length === 0) {
                toast.error('Для штучных цветов необходимо добавить хотя бы один цвет');
                return;
            }

            // Проверяем, что все цвета заполнены корректно
            const invalidColor = product.availableColors.find(
                color => !color.name || !color.value || color.name.trim() === '' || color.value.trim() === ''
            );
            if (invalidColor) {
                toast.error('Заполните все поля для цветов (название и значение)');
                return;
            }
        }

        // Валидация вариантов длины стебля (обязательно для всех типов)
        if (!product.stemLengths || product.stemLengths.length === 0) {
            toast.error('Необходимо добавить хотя бы один вариант длины стебля');
            return;
        }

        // Валидация вариантов длины стебля
        if (product.stemLengths && product.stemLengths.length > 0) {
            const invalidStemLength = product.stemLengths.find(
                stem => !stem.length || !stem.price || isNaN(stem.length) || isNaN(stem.price)
            );
            if (invalidStemLength) {
                toast.error('Заполните все поля длины стебля (длина и цена)');
                return;
            }
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

            // Вычисляем основную цену из минимальной цены вариантов длины
            let basePrice = 0;
            if (product.stemLengths && product.stemLengths.length > 0) {
                basePrice = Math.min(...product.stemLengths.map(item => Number(item.price)));
            } else if (product.price) {
                basePrice = Number(product.price);
            }

            // Подготовка данных - очищаем пустые значения
            const productData = {
                ...product,
                price: basePrice,
                originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
                stemLength: product.stemLength ? Number(product.stemLength) : undefined,
                quantity: product.quantity ? Number(product.quantity) : 10,
                soldCount: product.soldCount ? Number(product.soldCount) : 0,
                characteristics: product.characteristics.filter(char =>
                    char.name && char.value && char.name.trim() !== '' && char.value.trim() !== ''
                ),
                flowerNames: product.flowerNames ? product.flowerNames.filter(name => name && name.trim() !== '') : [],
                availableColors: product.availableColors ? product.availableColors.filter(color =>
                    color.name && color.value && color.name.trim() !== '' && color.value.trim() !== ''
                ) : [],
                stemLengths: product.stemLengths ? product.stemLengths.filter(stem =>
                    stem.length && stem.price
                ).map(stem => ({
                    length: Number(stem.length),
                    price: Number(stem.price),
                    originalPrice: stem.originalPrice ? Number(stem.originalPrice) : undefined
                })) : [],
                // Очищаем пустые значения для необязательных полей
                occasion: product.occasion && product.occasion.trim() !== '' ? product.occasion : undefined,
                recipient: product.recipient && product.recipient.trim() !== '' ? product.recipient : undefined,
                images: product.images
            };

            // Удаляем полностью пустые массивы
            if (productData.flowerNames.length === 0) {
                delete productData.flowerNames;
            }
            if (productData.characteristics.length === 0) {
                delete productData.characteristics;
            }
            if (productData.availableColors.length === 0) {
                delete productData.availableColors;
            }
            if (productData.stemLengths.length === 0) {
                delete productData.stemLengths;
            }

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
                if (isEditing) {
                    toast.success('Товар успешно обновлен');
                } else {
                    toast.success('Товар успешно создан');
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
                                    <label>Название <span className="required-field"></span></label>
                                    <input
                                        type="text"
                                        value={product.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        className="form-control"
                                        required
                                        placeholder="Введите название товара"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Тип <span className="required-field"></span></label>
                                    <CustomSelect
                                        value={product.type}
                                        onChange={(value) => handleChange('type', value)}
                                        options={[
                                            { value: 'single', label: 'Штучный цветок' },
                                            { value: 'bouquet', label: 'Букет' }
                                        ]}
                                        className="form-control-background custom-select--form-context"
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
                                {/* Повод */}
                                <div className="form-group">
                                    <label>Повод (необязательно)</label>
                                    <CustomSelect
                                        value={product.occasion || ''}
                                        onChange={(value) => handleChange('occasion', value)}
                                        options={[
                                            { value: '', label: 'Выберите повод' },
                                            ...occasionOptions.map(option => ({
                                                value: option.value,
                                                label: option.label
                                            }))
                                        ]}
                                        className="form-control-background custom-select--form-context"
                                    />
                                </div>

                                {/* Кому */}
                                <div className="form-group">
                                    <label>Кому (необязательно)</label>
                                    <CustomSelect
                                        value={product.recipient || ''}
                                        onChange={(value) => handleChange('recipient', value)}
                                        options={[
                                            { value: '', label: 'Выберите получателя' },
                                            ...recipientOptions.map(option => ({
                                                value: option.value,
                                                label: option.label
                                            }))
                                        ]}
                                        className="form-control-background custom-select--form-context"
                                    />
                                </div>

                                {/*{product.type !== 'single' && (*/}
                                {/*    <div className="form-group">*/}
                                {/*        <label>Базовая длина букета(см)</label>*/}
                                {/*        <input*/}
                                {/*            type="number"*/}
                                {/*            value={product.stemLength}*/}
                                {/*            onChange={(e) => handleChange('stemLength', e.target.value)}*/}
                                {/*            className="form-control"*/}
                                {/*            placeholder="Например: 40"*/}
                                {/*        />*/}
                                {/*    </div>*/}
                                {/*)}*/}
                            </div>
                        </div>
                            {/*РАБОТАЕТ< ЭТО ФУНКЦИОНАЛ УСТАНОВКИ ЦВЕТА*/}
                        {/* Секция для цветов (только для одиночных цветов) */}
                        {/*{product.type === 'single' && (*/}
                        {/*    <div className="form-section">*/}
                        {/*        <h4>Доступные цвета <span className="required-field"></span></h4>*/}
                        {/*        <p className="help-text">Добавьте цвета для одиночных цветов. Пользователи смогут выбирать цвет при покупке.</p>*/}
                        {/*        <div className="colors-container">*/}
                        {/*            {product.availableColors.map((color, index) => (*/}
                        {/*                <div key={index} className="color-item">*/}
                        {/*                    <div className="color-input-group">*/}

                        {/*                        <div className="color-inputs">*/}
                        {/*                            <div className="color-input-row">*/}
                        {/*                                <input*/}
                        {/*                                    type="color"*/}
                        {/*                                    value={color.value}*/}
                        {/*                                    onChange={(e) => handleColorChange(index, 'value', e.target.value)}*/}
                        {/*                                    className="color-picker"*/}
                        {/*                                    title="Выберите цвет"*/}
                        {/*                                />*/}
                        {/*                                <input*/}
                        {/*                                    type="text"*/}
                        {/*                                    value={color.value}*/}
                        {/*                                    onChange={(e) => handleColorChange(index, 'value', e.target.value)}*/}
                        {/*                                    className="form-control color-hex-input"*/}
                        {/*                                    placeholder="#HEX код"*/}
                        {/*                                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"*/}
                        {/*                                    title="Введите HEX код цвета (например: #FF0000)"*/}
                        {/*                                />*/}
                        {/*                            </div>*/}
                        {/*                            <input*/}
                        {/*                                type="text"*/}
                        {/*                                value={color.name}*/}
                        {/*                                onChange={(e) => handleColorChange(index, 'name', e.target.value)}*/}
                        {/*                                className="form-control"*/}
                        {/*                                placeholder="Название цвета"*/}
                        {/*                            />*/}
                        {/*                        </div>*/}
                        {/*                    </div>*/}
                        {/*                    /!*<button*!/*/}
                        {/*                    /!*    type="button"*!/*/}
                        {/*                    /!*    className="color-remove-btn"*!/*/}
                        {/*                    /!*    onClick={() => removeColor(index)}*!/*/}
                        {/*                    /!*>*!/*/}
                        {/*                    /!*    ×*!/*/}
                        {/*                    /!*</button>*!/*/}
                        {/*                </div>*/}
                        {/*            ))}*/}
                        {/*        </div>*/}
                        {/*        /!*<button*!/*/}
                        {/*        /!*    type="button"*!/*/}
                        {/*        /!*    className="btn-add-color"*!/*/}
                        {/*        /!*    onClick={addColor}*!/*/}
                        {/*        /!*>*!/*/}
                        {/*        /!*    + Добавить цвет*!/*/}
                        {/*        /!*</button>*!/*/}
                        {/*    </div>*/}
                        {/*)}*/}

                        {product.type === 'single' && (
                            <div className="form-section">
                                <h4>Цвет <span className="required-field"></span></h4>
                                <p className="help-text">Укажите цвет для одиночных цветов. Пользователи смогут видеть цвет при покупке.</p>
                                <div className="colors-container">
                                    {/* Всегда отображаем только один цвет */}
                                    <div className="color-item">
                                        <div className="color-input-group">
                                            <div className="color-inputs">
                                                <div className="color-input-row">
                                                    <input
                                                        type="color"
                                                        value={product.availableColors[0]?.value || '#000000'}
                                                        onChange={(e) => handleColorChange('value', e.target.value)}
                                                        className="color-picker"
                                                        title="Выберите цвет"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={product.availableColors[0]?.value || '#000000'}
                                                        onChange={(e) => handleColorChange('value', e.target.value)}
                                                        className="form-control color-hex-input"
                                                        placeholder="#HEX код"
                                                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                                                        title="Введите HEX код цвета (например: #FF0000)"
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={product.availableColors[0]?.name || ''}
                                                    onChange={(e) => handleColorChange('name', e.target.value)}
                                                    className="form-control"
                                                    placeholder="Название цвета"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        {/* Убрана кнопка удаления цвета */}
                                    </div>
                                </div>
                                {/* Убрана кнопка добавления цвета */}
                            </div>
                        )}


                        {/* Секция для вариантов длины стебля */}
                        <div className="form-section">
                            <h4>Варианты длины стебля и цены <span className="required-field"></span></h4>
                            <p className="help-text">Добавьте различные варианты длины стебля с соответствующими ценами. Пользователи смогут выбирать длину при покупке.</p>
                            <div className="stem-lengths-container">
                                {product.stemLengths.map((stem, index) => (
                                    <div key={index} className="stem-length-item">
                                        <div className="stem-input-group">
                                            <div className="stem-input">
                                                <label>Длина (см) *</label>
                                                <input
                                                    type="number"
                                                    value={stem.length}
                                                    onChange={(e) => handleStemLengthChange(index, 'length', e.target.value)}
                                                    className="form-control"
                                                    placeholder="Длина в см"
                                                    required
                                                />
                                            </div>
                                            <div className="stem-input">
                                                <label>Цена (₸) *</label>
                                                <input
                                                    type="number"
                                                    value={stem.price}
                                                    onChange={(e) => handleStemLengthChange(index, 'price', e.target.value)}
                                                    className="form-control"
                                                    placeholder="Цена"
                                                    required
                                                />
                                            </div>
                                            <div className="stem-input">
                                                <label>Старая цена (₸)</label>
                                                <input
                                                    type="number"
                                                    value={stem.originalPrice || ''}
                                                    onChange={(e) => handleStemLengthChange(index, 'originalPrice', e.target.value)}
                                                    className="form-control"
                                                    placeholder="Цена до скидки"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="stem-remove-btn"
                                            onClick={() => removeStemLength(index)}
                                            disabled={product.stemLengths.length === 1}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {product.type === 'single' && (
                            <button
                                type="button"
                                className="btn-add-stem-length"
                                onClick={addStemLength}
                            >
                                + Добавить вариант длины
                            </button>
                            )}
                        </div>

                        {/* Цены и количество */}
                        <div className="form-section">
                            <h4>Количество</h4>
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
                                        disabled
                                        style={{background: 'rgba(51, 65, 85, 0.6)'}}
                                        onChange={(e) => handleChange('soldCount', e.target.value)}
                                        className="form-control"
                                        placeholder="Количество проданных единиц"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Названия цветов */}
                        <div className="form-section">
                            <h4>Названия цветов (необязательно)</h4>
                            <div className="flower-names-container">
                                {product.flowerNames.map((flowerName, index) => (
                                    <div key={index} className="flower-name-item">
                                        <div className="flower-name-input">
                                            <input
                                                type="text"
                                                value={flowerName || ''}
                                                onChange={(e) => handleFlowerNameChange(index, e.target.value)}
                                                className="form-control form-control-input-name-flowers"
                                                placeholder={`Название цветка ${index + 1} (необязательно)`}
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
                                        <div
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="button-dangers"
                                        >
                                            ×
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
