// src/components/AdminPanel/AdminPanel.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProductManagement from "./ProductManagement/ProductManagement";
import WrapperManagement from './WrapperManagement/WrapperManagement';
import AddonManagement from './AddonManagement/AddonManagement';
import { toast } from 'react-toastify';
import './AdminPanel.css';

const AdminPanel = () => {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('slider');
    const [sliderImages, setSliderImages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    // eslint-disable-next-line
    const [editingSlide, setEditingSlide] = useState(null);
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5506';

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
                setSliderImages(data.sliderImages || []);
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
            const response = await fetch(`${apiUrl}/api/homepage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    sliderImages: sliderImages.filter(slide => slide.url.trim() !== '')
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

    // Предпросмотр слайда
    const SlidePreview = ({ slide, index }) => (
        <div className="slide-preview">
            <div
                className="preview-background"
                style={{
                    backgroundColor: slide.backgroundType === 'color' ? slide.backgroundColor : 'transparent',
                    backgroundImage: slide.backgroundType === 'image' && slide.backgroundImage ? `url(${slide.backgroundImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
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

                {slide.promotions?.[0] && (
                    <div className="preview-content">
                        <h3
                            style={{
                                color: slide.colorTitle,
                                fontFamily: slide.fontFamilleTitle,
                                fontSize: slide.fontSizeTitle
                            }}
                        >
                            {slide.promotions[0].title || 'Заголовок'}
                        </h3>
                        <p
                            style={{
                                color: slide.colorDescription,
                                fontFamily: slide.fontFamilleDescription,
                                fontSize: slide.fontSizeDescription
                            }}
                        >
                            {slide.promotions[0].description || 'Описание'}
                        </p>
                        {slide.promotions[0].startDate && slide.promotions[0].endDate && (
                            <div className="preview-dates">
                                {slide.promotions[0].startDate} - {slide.promotions[0].endDate}
                            </div>
                        )}
                    </div>
                )}
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
                                            className="btn btn-danger btn-sm"
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
                                                <label>URL изображения:</label>
                                                <input
                                                    type="text"
                                                    value={slide.url}
                                                    onChange={(e) => handleSlideChange(index, 'url', e.target.value)}
                                                    placeholder="https://example.com/image.jpg"
                                                    className="form-control"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label>Тип фона:</label>
                                                <select
                                                    value={slide.backgroundType}
                                                    onChange={(e) => handleSlideChange(index, 'backgroundType', e.target.value)}
                                                    className="form-control form-control-select"
                                                >
                                                    <option value="color">Цвет</option>
                                                    <option value="image">Изображение</option>
                                                    <option value="video">Видео</option>
                                                </select>
                                            </div>

                                            {slide.backgroundType === 'color' && (
                                                <div className="form-group">
                                                    <label>Цвет фона:</label>
                                                    <input
                                                        type="color"
                                                        value={slide.backgroundColor}
                                                        onChange={(e) => handleSlideChange(index, 'backgroundColor', e.target.value)}
                                                        className="form-control color-picker"
                                                    />
                                                </div>
                                            )}

                                            {slide.backgroundType === 'image' && (
                                                <div className="form-group">
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

                                            {slide.backgroundType === 'video' && (
                                                <div className="form-group">
                                                    <label>URL фонового видео:</label>
                                                    <input
                                                        type="text"
                                                        value={slide.backgroundVideo}
                                                        onChange={(e) => handleSlideChange(index, 'backgroundVideo', e.target.value)}
                                                        placeholder="https://example.com/video.mp4"
                                                        className="form-control"
                                                    />
                                                </div>
                                            )}
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
                                                        value={slide.promotions?.[0]?.startDate || ''}
                                                        onChange={(e) => handleSlideChange(index, 'promotions.startDate', e.target.value)}
                                                        className="form-control"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label>Дата окончания:</label>
                                                    <input
                                                        type="date"
                                                        value={slide.promotions?.[0]?.endDate || ''}
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
                                                    <select
                                                        value={slide.fontFamilleTitle}
                                                        onChange={(e) => handleSlideChange(index, 'fontFamilleTitle', e.target.value)}
                                                        className="form-control form-control-select"
                                                    >
                                                        <option value="Arial">Arial</option>
                                                        <option value="Georgia">Georgia</option>
                                                        <option value="Times New Roman">Times New Roman</option>
                                                        <option value="Verdana">Verdana</option>
                                                        <option value="Helvetica">Helvetica</option>
                                                    </select>
                                                </div>

                                                <div className="form-group">
                                                    <label>Шрифт описания:</label>
                                                    <select
                                                        value={slide.fontFamilleDescription}
                                                        onChange={(e) => handleSlideChange(index, 'fontFamilleDescription', e.target.value)}
                                                        className="form-control form-control-select"
                                                    >
                                                        <option value="Arial">Arial</option>
                                                        <option value="Georgia">Georgia</option>
                                                        <option value="Times New Roman">Times New Roman</option>
                                                        <option value="Verdana">Verdana</option>
                                                        <option value="Helvetica">Helvetica</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Размер заголовка:</label>
                                                    <input
                                                        type="text"
                                                        value={slide.fontSizeTitle}
                                                        onChange={(e) => handleSlideChange(index, 'fontSizeTitle', e.target.value)}
                                                        placeholder="24px"
                                                        className="form-control"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label>Размер описания:</label>
                                                    <input
                                                        type="text"
                                                        value={slide.fontSizeDescription}
                                                        onChange={(e) => handleSlideChange(index, 'fontSizeDescription', e.target.value)}
                                                        placeholder="16px"
                                                        className="form-control"
                                                    />
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
                    <div className="tab-content">
                        <h2>Управление заказами</h2>
                        <p>Функционал управления заказами будет добавлен позже.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;