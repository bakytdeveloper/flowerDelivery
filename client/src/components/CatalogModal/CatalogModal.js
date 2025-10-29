import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
            default:
                break;
        }

        navigate(`/catalog?${queryParams.toString()}`);
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
                                <h3 className="column-title">Цветы штучно</h3>
                                <div className="column-content">
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
                                        <p className="no-items">Нет товаров</p>
                                    )}
                                </div>
                            </div>

                            {/* Колонка 2: Букеты */}
                            <div className="catalog-column">
                                <h3 className="column-title">Букеты</h3>
                                <div className="column-content">
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
                                        <p className="no-items">Нет товаров</p>
                                    )}
                                </div>
                            </div>

                            {/* Колонка 3: Повод */}
                            <div className="catalog-column">
                                <h3 className="column-title">Повод</h3>
                                <div className="column-content">
                                    {catalogData.occasions.length > 0 ? (
                                        catalogData.occasions.map((occasion, index) => (
                                            <div
                                                key={index}
                                                className="catalog-item"
                                                onClick={() => handleItemClick('occasions', occasion)}
                                            >
                                                {occasion}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="no-items">Нет категорий</p>
                                    )}
                                </div>
                            </div>

                            {/* Колонка 4: Кому */}
                            <div className="catalog-column">
                                <h3 className="column-title">Кому</h3>
                                <div className="column-content">
                                    {catalogData.recipients.length > 0 ? (
                                        catalogData.recipients.map((recipient, index) => (
                                            <div
                                                key={index}
                                                className="catalog-item"
                                                onClick={() => handleItemClick('recipients', recipient)}
                                            >
                                                {recipient}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="no-items">Нет категорий</p>
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