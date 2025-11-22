// src/components/AdminPanel/AdminPanel.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProductManagement from "./ProductManagement/ProductManagement";
import WrapperManagement from './WrapperManagement/WrapperManagement';
import AddonManagement from './AddonManagement/AddonManagement';
import OrderManagement from './OrderManagement/OrderManagement';
import { fontFamilies } from "../../constants/constants";
import { toast } from 'react-toastify';
import './AdminPanel.css';
import CustomSelect from "../Common/CustomSelect";

const AdminPanel = () => {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('slider');
    const [sliderImages, setSliderImages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    // eslint-disable-next-line
    const [editingSlide, setEditingSlide] = useState(null);
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5506';

    // Загрузка данных слайдера
    // Загрузка данных слайдера
    const fetchSliderData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${apiUrl}/api/homepage`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();

                // Обрабатываем даты при загрузке
                const processedSlides = data.sliderImages?.map(slide => {
                    const processedSlide = { ...slide };

                    if (processedSlide.promotions?.[0]) {
                        const promotion = { ...processedSlide.promotions[0] };

                        // Форматируем даты для отображения
                        promotion.startDate = formatDateForInput(promotion.startDate);
                        promotion.endDate = formatDateForInput(promotion.endDate);

                        processedSlide.promotions = [promotion];
                    }

                    return processedSlide;
                }) || [];

                setSliderImages(processedSlides);
            } else {
                throw new Error('Ошибка загрузки данных');
            }
        } catch (error) {
            console.error('Error fetching slider data:', error);
            toast.error('Ошибка загрузки данных слайдера');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSliderData();
        // eslint-disable-next-line
    }, [token]);

    // Добавление нового слайда
    const handleAddSlide = () => {
        const newSlide = {
            url: '',
            backgroundType: 'color',
            backgroundColor: '#ffffff',
            backgroundImage: '',
            backgroundVideo: '',
            promotions: [{
                title: '',
                description: '',
                startDate: '',
                endDate: ''
            }],
            colorTitle: '#000000',
            colorDescription: '#000000',
            fontFamilleTitle: 'Arial',
            fontFamilleDescription: 'Arial',
            fontSizeTitle: '16px',
            fontSizeDescription: '14px'
        };

        setSliderImages([...sliderImages, newSlide]);
        setEditingSlide(sliderImages.length);
    };

    // Обновление слайда
    const handleSlideChange = (index, field, value) => {
        const updatedSlides = [...sliderImages];

        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            if (parent === 'promotions' && updatedSlides[index].promotions?.[0]) {
                updatedSlides[index].promotions[0][child] = value;
            } else {
                updatedSlides[index][parent] = {
                    ...updatedSlides[index][parent],
                    [child]: value
                };
            }
        } else {
            updatedSlides[index][field] = value;
        }

        setSliderImages(updatedSlides);
    };

    // Удаление слайда
    const handleDeleteSlide = async (index) => {
        const slide = sliderImages[index];
        if (slide.url) {
            
            try {
                const response = await fetch(`${apiUrl}/api/homepage/slider/${encodeURIComponent(slide.url)}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    toast.success('Слайд удален');
                    fetchSliderData();
                } else {
                    throw new Error('Ошибка удаления слайда');
                }
            } catch (error) {
                console.error('Error deleting slide:', error);
                toast.error('Ошибка удаления слайда');
            }
        } else {
            const updatedSlides = sliderImages.filter((_, i) => i !== index);
            setSliderImages(updatedSlides);
            toast.success('Слайд удален');
        }
    };

    // Сохранение изменений
    const handleSaveChanges = async () => {
        try {
            setIsLoading(true);

            // Подготавливаем данные для отправки
            const slidesForServer = sliderImages.map(slide => {
                const preparedSlide = { ...slide };

                // Обрабатываем даты промо-акции
                if (preparedSlide.promotions?.[0]) {
                    const promotion = { ...preparedSlide.promotions[0] };

                    // Если дата в формате yyyy-MM-dd, преобразуем в ISO с временем
                    if (promotion.startDate && promotion.startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        promotion.startDate = `${promotion.startDate}T00:00:00.000Z`;
                    }

                    if (promotion.endDate && promotion.endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        promotion.endDate = `${promotion.endDate}T23:59:59.000Z`;
                    }

                    preparedSlide.promotions = [promotion];
                }

                return preparedSlide;
            });

            const response = await fetch(`${apiUrl}/api/homepage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    sliderImages: slidesForServer.filter(slide => slide.url.trim() !== '')
                })
            });

            if (response.ok) {
                toast.success('Изменения сохранены успешно');
                fetchSliderData();

            } else {
                throw new Error('Ошибка сохранения изменений');
            }
        } catch (error) {
            console.error('Error saving changes:', error);
            toast.error('Ошибка сохранения изменений');
        } finally {
            setIsLoading(false);
        }
    };

    // Функция для преобразования ISO даты в формат yyyy-MM-dd
    const formatDateForInput = (isoDateString) => {
        if (!isoDateString) return '';

        try {
            // Если дата уже в формате yyyy-MM-dd, возвращаем как есть
            if (isoDateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return isoDateString;
            }

            // Если дата в ISO формате, извлекаем только дату
            const date = new Date(isoDateString);
            return date.toISOString().split('T')[0];
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    };

    // Функция для обработки ввода размера
    const handleSizeInput = (value) => {
        // Удаляем все нецифровые символы
        const numericValue = value.replace(/\D/g, '');
        // Ограничиваем максимальное значение (например, 999)
        const limitedValue = numericValue.slice(0, 3);
        return limitedValue ? `${limitedValue}px` : '';
    };

    // Функция для отображения значения в инпуте
        const getDisplaySize = (value) => {
            if (!value) return '';
            return value.replace('px', '');
    };

    // Функция для отображения дат в читаемом формате (без времени)
    const formatDateForDisplay = (isoDateString) => {
        if (!isoDateString) return '';

        try {
            // Если дата уже в формате yyyy-MM-dd, возвращаем как есть
            if (isoDateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                return isoDateString;
            }

            // Если дата в ISO формате, извлекаем только дату
            const date = new Date(isoDateString);
            return date.toISOString().split('T')[0];
        } catch (error) {
            console.error('Error formatting date for display:', error);
            return '';
        }
    };

    // Предпросмотр слайда
    const SlidePreview = ({ slide, index }) => (
        <div className="slide-preview">
            <div className="preview-slider-container"
                 style={{
                     backgroundColor: slide.backgroundType === 'color' ? slide.backgroundColor : 'transparent',
                     backgroundImage: slide.backgroundType === 'image' && slide.backgroundImage ? `url(${slide.backgroundImage})` : 'none',
                 }}
            >
                {slide.backgroundType === 'video' && slide.backgroundVideo && (
                    <video
                        src={slide.backgroundVideo}
                        autoPlay
                        muted
                        loop
                        className="preview-video"
                    />
                )}

                <div className="preview-slide-content">
                    {/* Левое изображение слайда */}
                    {slide.url && (
                        <div className="preview-slide-image">
                            <img
                                src={slide.url}
                                className="preview-slide-img"
                                alt={`Slide ${index + 1}`}
                            />
                        </div>
                    )}

                    {/* Текстовая часть - теперь выровнена сверху */}
                    {slide.promotions?.[0] && (
                        <div className="preview-text-content">
                            <div
                                className="preview-title"
                                style={{
                                    textAlign: "center",
                                    color: slide.colorTitle || '#000000',
                                    fontSize: slide.fontSizeTitle || '16px',
                                    fontFamily: slide.fontFamilleTitle || 'Arial',
                                }}
                            >
                                {slide.promotions[0].title || 'Заголовок'}
                            </div>
                            <div
                                className="preview-description"
                                style={{
                                    textAlign: "center",
                                    color: slide.colorDescription || '#000000',
                                    fontSize: slide.fontSizeDescription || '14px',
                                    fontFamily: slide.fontFamilleDescription || 'Arial',
                                }}
                            >
                                {slide.promotions[0].description || 'Описание'}
                            </div>
                        </div>
                    )}

                    {/* Блок с датами */}
                    {slide.promotions?.[0]?.startDate && slide.promotions?.[0]?.endDate && (
                        <div
                            className="preview-dates-container"
                            style={{
                                color: slide.colorTitle || '#000000',
                                fontFamily: slide.fontFamilleTitle || 'Arial',
                            }}
                        >
                            Акция с {formatDateForDisplay(slide.promotions[0].startDate)} по {formatDateForDisplay(slide.promotions[0].endDate)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (isLoading && sliderImages.length === 0) {
        return <div className="admin-panel-loading">Загрузка...</div>;
    }

    return (
        <div className="admin-panel">
            <div className="admin-header">
                <h1>Админ-панель</h1>
                <p>Управление контентом сайта</p>
            </div>

            <div className="admin-tabs">
                <button
                    className={`tab-button ${activeTab === 'slider' ? 'active' : ''}`}
                    onClick={() => setActiveTab('slider')}
                >
                    Управление слайдером
                </button>
                <button
                    className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
                    onClick={() => setActiveTab('products')}
                >
                    Управление товарами
                </button>
                <button
                    className={`tab-button ${activeTab === 'wrappers' ? 'active' : ''}`}
                    onClick={() => setActiveTab('wrappers')}
                >
                    Управление обёртками
                </button>
                <button
                    className={`tab-button ${activeTab === 'addons' ? 'active' : ''}`}
                    onClick={() => setActiveTab('addons')}
                >
                    Дополнительные товары
                </button>
                <button
                    className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    Управление заказами
                </button>
            </div>

            <div className="admin-content">
                {activeTab === 'slider' && (
                    <div className="slider-management">
                        <div className="section-header">
                            <h2>Управление слайдером главной страницы</h2>
                            <div className="section-actions">
                                <button
                                    className="btn btn-primary"
                                    onClick={handleAddSlide}
                                    disabled={isLoading}
                                >
                                    + Добавить слайд
                                </button>
                                <button
                                    className="btn btn-success"
                                    onClick={handleSaveChanges}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
                                </button>
                            </div>
                        </div>

                        <div className="slides-container">
                            {sliderImages.map((slide, index) => (
                                <div key={index} className="slide-editor">
                                    <div className="slide-header">
                                        <h3>Слайд {index + 1}</h3>
                                        <button
                                            className="btn btn-danger btn-sm slide-editor-delete-slide"
                                            onClick={() => handleDeleteSlide(index)}
                                            disabled={isLoading}
                                        >
                                            Удалить
                                        </button>
                                    </div>

                                    <div className="slide-content">
                                        <div className="form-section">
                                            <h4>Основные настройки</h4>

                                            <div className="form-group">
                                                <label>URL левой картинки:</label>
                                                <input
                                                    type="text"
                                                    value={slide.url}
                                                    onChange={(e) => handleSlideChange(index, 'url', e.target.value)}
                                                    placeholder="https://example.com/image.jpg"
                                                    className="form-control"
                                                />
                                            </div>

                                            {/* Тип фона */}
                                            <div className="form-group">
                                                <label>Тип фона:</label>
                                                <CustomSelect
                                                    value={slide.backgroundType}
                                                    onChange={(value) => handleSlideChange(index, 'backgroundType', value)}
                                                    options={[
                                                        { value: 'color', label: 'Цвет' },
                                                        { value: 'image', label: 'Изображение' },
                                                        // { value: 'video', label: 'Видео' }
                                                    ]}
                                                    className="form-control-select"
                                                />
                                            </div>

                                            {slide.backgroundType === 'color' && (
                                                <div className="form-group" style={{zIndex:"0"}}>
                                                    <label  style={{zIndex:"0"}}>Цвет фона:</label>
                                                    <input
                                                        type="color"
                                                        value={slide.backgroundColor}
                                                        onChange={(e) => handleSlideChange(index, 'backgroundColor', e.target.value)}
                                                        className="form-control color-picker"
                                                    />
                                                </div>
                                            )}

                                            {slide.backgroundType === 'image' && (
                                                <div className="form-group" style={{zIndex:"0"}}>
                                                    <label>URL фонового изображения:</label>
                                                    <input
                                                        type="text"
                                                        value={slide.backgroundImage}
                                                        onChange={(e) => handleSlideChange(index, 'backgroundImage', e.target.value)}
                                                        placeholder="https://example.com/background.jpg"
                                                        className="form-control"
                                                    />
                                                </div>
                                            )}

                                            {/*{slide.backgroundType === 'video' && (*/}
                                            {/*    <div className="form-group">*/}
                                            {/*        <label>URL фонового видео:</label>*/}
                                            {/*        <input*/}
                                            {/*            type="text"*/}
                                            {/*            value={slide.backgroundVideo}*/}
                                            {/*            onChange={(e) => handleSlideChange(index, 'backgroundVideo', e.target.value)}*/}
                                            {/*            placeholder="https://example.com/video.mp4"*/}
                                            {/*            className="form-control"*/}
                                            {/*        />*/}
                                            {/*    </div>*/}
                                            {/*)}*/}
                                        </div>

                                        <div className="form-section">
                                            <h4>Промо-акция</h4>

                                            <div className="form-group">
                                                <label>Заголовок:</label>
                                                <input
                                                    type="text"
                                                    value={slide.promotions?.[0]?.title || ''}
                                                    onChange={(e) => handleSlideChange(index, 'promotions.title', e.target.value)}
                                                    placeholder="Заголовок акции"
                                                    className="form-control"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Описание:</label>
                                                <textarea
                                                    value={slide.promotions?.[0]?.description || ''}
                                                    onChange={(e) => handleSlideChange(index, 'promotions.description', e.target.value)}
                                                    placeholder="Описание акции"
                                                    className="form-control"
                                                    rows="3"
                                                />
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Дата начала:</label>
                                                    <input
                                                        type="date"
                                                        value={formatDateForInput(slide.promotions?.[0]?.startDate) || ''}
                                                        onChange={(e) => handleSlideChange(index, 'promotions.startDate', e.target.value)}
                                                        className="form-control"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label>Дата окончания:</label>
                                                    <input
                                                        type="date"
                                                        value={formatDateForInput(slide.promotions?.[0]?.endDate) || ''}
                                                        onChange={(e) => handleSlideChange(index, 'promotions.endDate', e.target.value)}
                                                        className="form-control"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-section">
                                            <h4>Стили текста</h4>

                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Цвет заголовка:</label>
                                                    <input
                                                        type="color"
                                                        value={slide.colorTitle}
                                                        onChange={(e) => handleSlideChange(index, 'colorTitle', e.target.value)}
                                                        className="form-control color-picker"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label>Цвет описания:</label>
                                                    <input
                                                        type="color"
                                                        value={slide.colorDescription}
                                                        onChange={(e) => handleSlideChange(index, 'colorDescription', e.target.value)}
                                                        className="form-control color-picker"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Шрифт заголовка:</label>
                                                    <CustomSelect
                                                        value={slide.fontFamilleTitle}
                                                        onChange={(value) => handleSlideChange(index, 'fontFamilleTitle', value)}
                                                        options={fontFamilies}
                                                        className="form-control-select"
                                                    />
                                                </div>

                                                {/* Шрифт описания */}
                                                <div className="form-group">
                                                    <label>Шрифт описания:</label>
                                                    <CustomSelect
                                                        value={slide.fontFamilleDescription}
                                                        onChange={(value) => handleSlideChange(index, 'fontFamilleDescription', value)}
                                                        options={fontFamilies}
                                                        className="form-control-select"
                                                    />
                                                </div>
                                            </div>

                                            {/*<div className="form-row">*/}
                                            {/*    <div className="form-group" style={{zIndex:"0"}}>*/}
                                            {/*        <label>Размер заголовка:</label>*/}
                                            {/*        <input*/}
                                            {/*            type="text"*/}
                                            {/*            value={slide.fontSizeTitle}*/}
                                            {/*            onChange={(e) => handleSlideChange(index, 'fontSizeTitle', e.target.value)}*/}
                                            {/*            placeholder="24px"*/}
                                            {/*            className="form-control"*/}
                                            {/*        />*/}
                                            {/*    </div>*/}

                                            {/*    <div className="form-group" style={{zIndex:"0"}}>*/}
                                            {/*        <label>Размер описания:</label>*/}
                                            {/*        <input*/}
                                            {/*            type="text"*/}
                                            {/*            value={slide.fontSizeDescription}*/}
                                            {/*            onChange={(e) => handleSlideChange(index, 'fontSizeDescription', e.target.value)}*/}
                                            {/*            placeholder="16px"*/}
                                            {/*            className="form-control"*/}
                                            {/*        />*/}
                                            {/*    </div>*/}
                                            {/*</div>*/}

                                            <div className="form-row">
                                                <div className="form-group" style={{zIndex:"0"}}>
                                                    <label>Размер заголовка:</label>
                                                    <input
                                                        type="text"
                                                        value={getDisplaySize(slide.fontSizeTitle)}
                                                        onChange={(e) => handleSlideChange(index, 'fontSizeTitle', handleSizeInput(e.target.value))}
                                                        placeholder="24"
                                                        className="form-control"
                                                        onBlur={(e) => {
                                                            // Если поле пустое при потере фокуса, устанавливаем значение по умолчанию
                                                            if (!e.target.value) {
                                                                handleSlideChange(index, 'fontSizeTitle', '16px');
                                                            }
                                                        }}
                                                    />
                                                    <small className="input-hint">Только число</small>
                                                </div>

                                                <div className="form-group" style={{zIndex:"0"}}>
                                                    <label>Размер описания:</label>
                                                    <input
                                                        type="text"
                                                        value={getDisplaySize(slide.fontSizeDescription)}
                                                        onChange={(e) => handleSlideChange(index, 'fontSizeDescription', handleSizeInput(e.target.value))}
                                                        placeholder="16"
                                                        className="form-control"
                                                        onBlur={(e) => {
                                                            if (!e.target.value) {
                                                                handleSlideChange(index, 'fontSizeDescription', '14px');
                                                            }
                                                        }}
                                                    />
                                                    <small className="input-hint">Только число</small>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-section">
                                            <h4>Предпросмотр</h4>
                                            <SlidePreview slide={slide} index={index} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {sliderImages.length === 0 && (
                            <div className="empty-state">
                                <p>Нет добавленных слайдов. Нажмите "Добавить слайд" чтобы создать первый слайд.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'products' && (
                    <ProductManagement />
                )}

                {activeTab === 'wrappers' && (
                    <WrapperManagement />
                )}

                {activeTab === 'addons' && (
                    <AddonManagement />
                )}

                {activeTab === 'orders' && (
                    <OrderManagement />
                )}
            </div>
        </div>
    );
};

export default AdminPanel;