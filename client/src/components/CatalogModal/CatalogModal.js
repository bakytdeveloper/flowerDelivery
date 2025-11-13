import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { occasionOptions, recipientOptions } from "../../constants/constants";
import './CatalogModal.css';

const CatalogModal = ({ isOpen, onClose }) => {
    const [catalogData, setCatalogData] = useState({
        singleFlowers: [],
        bouquetFlowers: [],
        occasions: [],
        recipients: []
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Функции для получения переведенных значений
    const getOccasionLabel = (occasionValue) => {
        const occasion = occasionOptions.find(opt => opt.value === occasionValue);
        return occasion ? occasion.label : occasionValue;
    };

    const getRecipientLabel = (recipientValue) => {
        const recipient = recipientOptions.find(opt => opt.value === recipientValue);
        return recipient ? recipient.label : recipientValue;
    };

    useEffect(() => {
        if (isOpen) {
            fetchCatalogData();
        }
    }, [isOpen]);

    const fetchCatalogData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/products/catalog/data`);

            if (!response.ok) {
                throw new Error('Ошибка при загрузке данных каталога');
            }

            const data = await response.json();
            if (data.success) {
                setCatalogData(data.catalogData);
            }
        } catch (error) {
            console.error('Error fetching catalog data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleItemClick = (type, value) => {
        // Закрываем модальное окно
        onClose();

        // Формируем параметры для каталога
        let queryParams = new URLSearchParams();

        switch (type) {
            case 'singleFlowers':
                queryParams.append('type', 'single');
                queryParams.append('search', value);
                break;
            case 'bouquetFlowers':
                queryParams.append('type', 'bouquet');
                queryParams.append('search', value);
                break;
            case 'occasions':
                queryParams.append('occasion', value);
                break;
            case 'recipients':
                queryParams.append('recipient', value);
                break;
            case 'allSingle':
                queryParams.append('type', 'single');
                break;
            case 'allBouquets':
                queryParams.append('type', 'bouquet');
                break;
            default:
                break;
        }

        navigate(`/catalog?${queryParams.toString()}`);
    };

    // Функция для перехода в каталог без фильтрации
    const handleViewAllProducts = () => {
        onClose();
        navigate('/catalog');
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="catalog-modal-overlay" onClick={handleOverlayClick}>
            <div className="catalog-modal">
                {/* Заголовок и кнопка закрытия */}
                <div className="catalog-modal-header">
                    <h2 className="catalog-modal-title">Каталог и категории товаров</h2>
                    <button
                        className="catalog-modal-close"
                        onClick={onClose}
                        aria-label="Закрыть каталог"
                    >
                        ×
                    </button>
                </div>

                {/* Кнопка "Все товары" */}
                <div className="catalog-modal-all-products">
                    <button
                        className="catalog-all-products-btn"
                        onClick={handleViewAllProducts}
                    >
                        <span className="catalog-all-products-icon">🌺</span>
                        Все товары
                        <span className="catalog-all-products-arrow">→</span>
                    </button>
                </div>

                {/* Содержимое модального окна */}
                <div className="catalog-modal-content">
                    {loading ? (
                        <div className="catalog-loading">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Загрузка...</span>
                            </div>
                            <p>Загрузка категорий...</p>
                        </div>
                    ) : (
                        <div className="catalog-columns">
                            {/* Колонка 1: Цветы штучно */}
                            <div className="catalog-column">
                                <h3 className="catalog-column-title">
                                    <span className="catalog-column-icon">💐</span>
                                    Цветы штучно
                                </h3>
                                <div className="catalog-column-content">
                                    {/* Кнопка "Все одиночные" */}
                                    <div
                                        className="catalog-item"
                                        onClick={() => handleItemClick('allSingle', '')}
                                    >
                                        <span className="catalog-all-icon">💐</span>
                                        Все штучные цветы
                                        <span className="catalog-all-arrow">→</span>
                                    </div>

                                    {catalogData.singleFlowers.length > 0 ? (
                                        catalogData.singleFlowers.map((flower, index) => (
                                            <div
                                                key={index}
                                                className="catalog-item"
                                                onClick={() => handleItemClick('singleFlowers', flower)}
                                            >
                                                {flower}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="catalog-no-items">Нет товаров</p>
                                    )}
                                </div>
                            </div>

                            {/* Колонка 2: Букеты */}
                            <div className="catalog-column">
                                <h3 className="catalog-column-title">
                                    <span className="catalog-column-icon">💮</span>
                                    Букеты
                                </h3>
                                <div className="catalog-column-content">
                                    {/* Кнопка "Все букеты" */}
                                    <div
                                        className="catalog-item"
                                        onClick={() => handleItemClick('allBouquets', '')}
                                    >
                                        <span className="catalog-all-icon">💮</span>
                                        Все букеты
                                        <span className="catalog-all-arrow">→</span>
                                    </div>

                                    {catalogData.bouquetFlowers.length > 0 ? (
                                        catalogData.bouquetFlowers.map((bouquet, index) => (
                                            <div
                                                key={index}
                                                className="catalog-item"
                                                onClick={() => handleItemClick('bouquetFlowers', bouquet)}
                                            >
                                                {bouquet}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="catalog-no-items">Нет товаров</p>
                                    )}
                                </div>
                            </div>

                            {/* Колонка 3: Повод */}
                            <div className="catalog-column">
                                <h3 className="catalog-column-title">
                                    <span className="catalog-column-icon">🎉</span>
                                    Повод
                                </h3>
                                <div className="catalog-column-content">
                                    {catalogData.occasions.length > 0 ? (
                                        catalogData.occasions.map((occasion, index) => (
                                            <div
                                                key={index}
                                                className="catalog-item"
                                                onClick={() => handleItemClick('occasions', occasion)}
                                            >
                                                {getOccasionLabel(occasion)}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="catalog-no-items">Нет категорий</p>
                                    )}
                                </div>
                            </div>

                            {/* Колонка 4: Кому */}
                            <div className="catalog-column">
                                <h3 className="catalog-column-title">
                                    <span className="catalog-column-icon">👤</span>
                                    Кому
                                </h3>
                                <div className="catalog-column-content">
                                    {catalogData.recipients.length > 0 ? (
                                        catalogData.recipients.map((recipient, index) => (
                                            <div
                                                key={index}
                                                className="catalog-item"
                                                onClick={() => handleItemClick('recipients', recipient)}
                                            >
                                                {getRecipientLabel(recipient)}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="catalog-no-items">Нет категорий</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CatalogModal;