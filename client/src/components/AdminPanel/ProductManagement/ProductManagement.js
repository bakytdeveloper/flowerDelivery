// src/components/AdminPanel/ProductManagement/ProductManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';
import './ProductManagement.css';

const ProductManagement = () => {
    const { token } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        type: '',
        occasion: '',
        recipient: '',
        isActive: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [showUrlInput, setShowUrlInput] = useState(false);

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5506';
    const limit = 12;

    // Загрузка товаров
    const fetchProducts = async (page = 1) => {
        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams();
            queryParams.append('page', page);
            queryParams.append('limit', limit);

            if (filters.search) queryParams.append('search', filters.search);
            if (filters.type) queryParams.append('type', filters.type);
            if (filters.occasion) queryParams.append('occasion', filters.occasion);
            if (filters.recipient) queryParams.append('recipient', filters.recipient);
            if (filters.isActive) queryParams.append('isActive', filters.isActive);

            const response = await fetch(`${apiUrl}/api/admin/products?${queryParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке товаров');
            }

            const data = await response.json();
            setProducts(data.products || []);
            setTotalPages(data.totalPages || 1);
            setCurrentPage(data.currentPage || 1);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [filters]);

    const handleFilterChange = useCallback((filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
        setCurrentPage(1);
    }, []);

    const clearFilters = () => {
        setFilters({
            search: '',
            type: '',
            occasion: '',
            recipient: '',
            isActive: ''
        });
        setCurrentPage(1);
    };

    // Удаление товара
    const handleDeleteClick = (product) => {
        setProductToDelete(product);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;

        try {
            const response = await fetch(`${apiUrl}/api/admin/products/${productToDelete._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success('Товар успешно удален');
                fetchProducts(currentPage);
            } else {
                throw new Error('Ошибка при удалении товара');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Ошибка при удалении товара');
        } finally {
            setShowDeleteModal(false);
            setProductToDelete(null);
        }
    };

    // Редактирование товара
    const handleEditClick = (product) => {
        const productCopy = {
            ...product,
            flowerNames: Array.isArray(product.flowerNames) ? [...product.flowerNames] : [],
            characteristics: Array.isArray(product.characteristics)
                ? product.characteristics.map(char => ({...char}))
                : [],
            images: Array.isArray(product.images) ? [...product.images] : []
        };
        setEditingProduct(productCopy);
        setShowEditModal(true);
        setShowUrlInput(false);
        setImageUrlInput('');
    };

    const handleEditChange = (field, value) => {
        setEditingProduct(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Обработка характеристик
    const handleCharacteristicChange = (index, field, value) => {
        const updatedCharacteristics = [...editingProduct.characteristics];
        updatedCharacteristics[index][field] = value;
        handleEditChange('characteristics', updatedCharacteristics);
    };

    const addCharacteristic = () => {
        const updatedCharacteristics = [
            ...editingProduct.characteristics,
            { name: '', value: '' }
        ];
        handleEditChange('characteristics', updatedCharacteristics);
    };

    const removeCharacteristic = (index) => {
        const updatedCharacteristics = editingProduct.characteristics.filter((_, i) => i !== index);
        handleEditChange('characteristics', updatedCharacteristics);
    };

    // Обработка названий цветов
    const handleFlowerNameChange = (index, value) => {
        const updatedFlowerNames = [...editingProduct.flowerNames];
        updatedFlowerNames[index] = value;
        handleEditChange('flowerNames', updatedFlowerNames);
    };

    const addFlowerName = () => {
        const updatedFlowerNames = [...editingProduct.flowerNames, ''];
        handleEditChange('flowerNames', updatedFlowerNames);
    };

    const removeFlowerName = (index) => {
        const updatedFlowerNames = editingProduct.flowerNames.filter((_, i) => i !== index);
        handleEditChange('flowerNames', updatedFlowerNames);
    };

    // Загрузка изображений (файлы)
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
                const updatedImages = [...editingProduct.images, ...newImages];
                handleEditChange('images', updatedImages);
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

        // Простая валидация URL
        try {
            new URL(imageUrlInput);
        } catch (error) {
            toast.error('Введите корректный URL');
            return;
        }

        const updatedImages = [...editingProduct.images, imageUrlInput.trim()];
        handleEditChange('images', updatedImages);
        setImageUrlInput('');
        setShowUrlInput(false);
        toast.success('URL изображения добавлен');
    };

    const removeImage = (index) => {
        const imageToRemove = editingProduct.images[index];
        const updatedImages = editingProduct.images.filter((_, i) => i !== index);
        handleEditChange('images', updatedImages);

        // Если это загруженное изображение (не URL), можно отправить запрос на удаление с сервера
        if (imageToRemove.includes('/uploads/')) {
            // Опционально: удалить файл с сервера
            // deleteImageFromServer(imageToRemove);
        }
    };

    // Функция для определения типа изображения (URL или загруженное)
    const getImageType = (imageUrl) => {
        if (imageUrl.startsWith('http') && !imageUrl.includes('/uploads/')) {
            return 'url';
        }
        return 'uploaded';
    };

    // Сохранение изменений
    const saveProductChanges = async () => {
        if (!editingProduct) return;

        // Валидация обязательных полей
        if (!editingProduct.name || !editingProduct.price || !editingProduct.category) {
            toast.error('Заполните обязательные поля: название, цена, категория');
            return;
        }

        try {
            setIsSaving(true);

            // Подготовка данных для отправки
            const productData = {
                ...editingProduct,
                price: Number(editingProduct.price),
                originalPrice: editingProduct.originalPrice ? Number(editingProduct.originalPrice) : undefined,
                stemLength: editingProduct.stemLength ? Number(editingProduct.stemLength) : undefined,
                quantity: editingProduct.quantity ? Number(editingProduct.quantity) : 0,
                soldCount: editingProduct.soldCount ? Number(editingProduct.soldCount) : 0,
                characteristics: editingProduct.characteristics.filter(char =>
                    char.name && char.value && char.name.trim() !== '' && char.value.trim() !== ''
                ),
                flowerNames: editingProduct.flowerNames.filter(name => name && name.trim() !== ''),
                // Изображения уже содержат как URL, так и пути к загруженным файлам
                images: editingProduct.images
            };

            const response = await fetch(`${apiUrl}/api/admin/products/${editingProduct._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });

            if (response.ok) {
                toast.success('Товар успешно обновлен');
                fetchProducts(currentPage);
                setShowEditModal(false);
                setEditingProduct(null);
            } else {
                throw new Error('Ошибка при обновлении товара');
            }
        } catch (error) {
            console.error('Error updating product:', error);
            toast.error('Ошибка при обновлении товара');
        } finally {
            setIsSaving(false);
        }
    };

    // Переключение активности товара
    const toggleProductActive = async (productId, currentStatus) => {
        try {
            const response = await fetch(`${apiUrl}/api/admin/products/${productId}/toggle-active`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success(`Товар ${!currentStatus ? 'активирован' : 'деактивирован'}`);
                fetchProducts(currentPage);
            } else {
                throw new Error('Ошибка при изменении статуса товара');
            }
        } catch (error) {
            console.error('Error toggling product active:', error);
            toast.error('Ошибка при изменении статуса товара');
        }
    };

    // Форматирование цены
    const formatPrice = (price) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'KZT',
            minimumFractionDigits: 0
        }).format(price);
    };

    // Пагинация
    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchProducts(page);
    };

    if (loading && products.length === 0) {
        return (
            <div className="product-management">
                <div className="admin-section-header">
                    <h2>Управление товарами</h2>
                </div>
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Загрузка товаров...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="product-management">
            <div className="admin-section-header">
                <h2>Управление товарами</h2>
                <div className="section-actions">
                    <button className="btn btn-primary" onClick={() => window.location.href = '/admin/products/create'}>
                        + Добавить товар
                    </button>
                </div>
            </div>

            {/* Фильтры */}
            <div className="filters-panel">
                <div className="filter-group">
                    <input
                        type="text"
                        placeholder="Поиск по названию..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="form-control search-input filter-group-select-input"
                    />
                </div>

                <div className="filter-group">
                    <select
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        className="form-control filter-group-select-input"
                    >
                        <option value="">Все типы</option>
                        <option value="single">Одиночные</option>
                        <option value="bouquet">Букеты</option>
                    </select>
                </div>

                <div className="filter-group">
                    <select
                        value={filters.occasion}
                        onChange={(e) => handleFilterChange('occasion', e.target.value)}
                        className="form-control filter-group-select-input"
                    >
                        <option value="">Все поводы</option>
                        <option value="День рождения">День рождения</option>
                        <option value="Свадьба">Свадьба</option>
                        <option value="8 марта">8 марта</option>
                        <option value="Юбилей">Юбилей</option>
                        <option value="Любовь">Любовь</option>
                        <option value="Соболезнование">Соболезнование</option>
                    </select>
                </div>

                <div className="filter-group">
                    <select
                        value={filters.isActive}
                        onChange={(e) => handleFilterChange('isActive', e.target.value)}
                        className="form-control filter-group-select-input"
                    >
                        <option value="">Все статусы</option>
                        <option value="true">Активные</option>
                        <option value="false">Неактивные</option>
                    </select>
                </div>

                <button className="btn btn-outline" onClick={clearFilters}>
                    Очистить
                </button>
            </div>

            {/* Статистика */}
            <div className="products-stats">
                <p>Найдено товаров: <strong>{products.length}</strong></p>
            </div>

            {/* Сетка товаров */}
            {error ? (
                <div className="error-message">
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={() => fetchProducts()}>
                        Попробовать снова
                    </button>
                </div>
            ) : products.length === 0 ? (
                <div className="no-products">
                    <h3>Товары не найдены</h3>
                    <p>Попробуйте изменить параметры фильтрации</p>
                </div>
            ) : (
                <>
                    <div className="products-grid-admin">
                        {products.map((product) => (
                            <div key={product._id} className="product-card-admin">
                                <div className="product-image-container">
                                    <img
                                        src={product.images?.[0] || '/images/placeholder-flower.jpg'}
                                        alt={product.name}
                                        className="product-image"
                                    />
                                    <div className="product-badges">
                                        {!product.isActive && (
                                            <span className="status-badge inactive">Неактивен</span>
                                        )}
                                        {product.discountPercentage > 0 && (
                                            <span className="discount-badge">-{product.discountPercentage}%</span>
                                        )}
                                        {product.soldCount > 0 && (
                                            <span className="popular-badge">🔥 {product.soldCount}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="product-info">
                                    <h3 className="product-name">{product.name}</h3>
                                    <p className="product-description">
                                        {product.description?.length > 60
                                            ? `${product.description.slice(0, 60)}...`
                                            : product.description
                                        }
                                    </p>

                                    <div className="product-meta">
                                        <span className={`product-type ${product.type}`}>
                                            {product.type === 'single' ? '💐 Одиночный' : '💮 Букет'}
                                        </span>
                                        <span className="product-category">{product.category}</span>
                                    </div>

                                    <div className="product-details">
                                        <div className="detail-item">
                                            <span className="detail-label">Цветы:</span>
                                            <span className="detail-value">
                                                {Array.isArray(product.flowerNames)
                                                    ? product.flowerNames.slice(0, 2).join(', ')
                                                    : product.flowerNames}
                                                {product.flowerNames?.length > 2 && '...'}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Кому:</span>
                                            <span className="detail-value">{product.recipient}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Длина стебля:</span>
                                            <span className="detail-value">{product.stemLength} см</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">В наличии:</span>
                                            <span className="detail-value">{product.quantity} шт</span>
                                        </div>
                                    </div>

                                    <div className="product-price-admin">
                                        {product.originalPrice && product.originalPrice > product.price ? (
                                            <>
                                                <span className="original-price">
                                                    {formatPrice(product.originalPrice)}
                                                </span>
                                                <span className="current-price">
                                                    {formatPrice(product.price)}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="current-price">
                                                {formatPrice(product.price)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="product-actions-admin">
                                        <button
                                            className={`btn-status ${product.isActive ? 'btn-active' : 'btn-inactive'}`}
                                            onClick={() => toggleProductActive(product._id, product.isActive)}
                                        >
                                            {product.isActive ? 'Активен' : 'Неактивен'}
                                        </button>

                                        <button
                                            className="btn-edit"
                                            onClick={() => handleEditClick(product)}
                                        >
                                            Редактировать
                                        </button>

                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDeleteClick(product)}
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Пагинация */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="pagination-btn"
                                disabled={currentPage === 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                            >
                                Назад
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                    onClick={() => handlePageChange(page)}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                className="pagination-btn"
                                disabled={currentPage === totalPages}
                                onClick={() => handlePageChange(currentPage + 1)}
                            >
                                Вперед
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Модальное окно удаления */}
            {showDeleteModal && productToDelete && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Подтверждение удаления</h3>
                            <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>Вы уверены, что хотите удалить товар <strong>"{productToDelete.name}"</strong>?</p>
                            <p className="warning-text">Это действие нельзя отменить. Все ссылки на данный товар будут удалены.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setShowDeleteModal(false)}>
                                Отмена
                            </button>
                            <button className="btn btn-danger" onClick={confirmDelete}>
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно редактирования */}
            {showEditModal && editingProduct && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Редактирование товара</h3>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="edit-form">
                                {/* Основная информация */}
                                <div className="form-section">
                                    <h4>Основная информация</h4>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Название *:</label>
                                            <input
                                                type="text"
                                                value={editingProduct.name}
                                                onChange={(e) => handleEditChange('name', e.target.value)}
                                                className="form-control"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Категория *:</label>
                                            <input
                                                type="text"
                                                value={editingProduct.category}
                                                onChange={(e) => handleEditChange('category', e.target.value)}
                                                className="form-control"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Описание:</label>
                                        <textarea
                                            value={editingProduct.description}
                                            onChange={(e) => handleEditChange('description', e.target.value)}
                                            className="form-control"
                                            rows="3"
                                        />
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Тип:</label>
                                            <select
                                                value={editingProduct.type}
                                                onChange={(e) => handleEditChange('type', e.target.value)}
                                                className="form-control"
                                            >
                                                <option value="single">Одиночный</option>
                                                <option value="bouquet">Букет</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Повод:</label>
                                            <input
                                                type="text"
                                                value={editingProduct.occasion}
                                                onChange={(e) => handleEditChange('occasion', e.target.value)}
                                                className="form-control"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Кому:</label>
                                            <input
                                                type="text"
                                                value={editingProduct.recipient}
                                                onChange={(e) => handleEditChange('recipient', e.target.value)}
                                                className="form-control"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Длина стебля (см):</label>
                                            <input
                                                type="number"
                                                value={editingProduct.stemLength}
                                                onChange={(e) => handleEditChange('stemLength', e.target.value)}
                                                className="form-control"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Цены и количество */}
                                <div className="form-section">
                                    <h4>Цены и количество</h4>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Цена (₸) *:</label>
                                            <input
                                                type="number"
                                                value={editingProduct.price}
                                                onChange={(e) => handleEditChange('price', e.target.value)}
                                                className="form-control"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Старая цена (₸):</label>
                                            <input
                                                type="number"
                                                value={editingProduct.originalPrice || ''}
                                                onChange={(e) => handleEditChange('originalPrice', e.target.value)}
                                                className="form-control"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Количество:</label>
                                            <input
                                                type="number"
                                                value={editingProduct.quantity}
                                                onChange={(e) => handleEditChange('quantity', e.target.value)}
                                                className="form-control"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Продано:</label>
                                            <input
                                                type="number"
                                                value={editingProduct.soldCount}
                                                onChange={(e) => handleEditChange('soldCount', e.target.value)}
                                                className="form-control"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Названия цветов */}
                                <div className="form-section">
                                    <h4>Названия цветов</h4>
                                    {editingProduct.flowerNames.map((flowerName, index) => (
                                        <div key={index} className="form-row array-item">
                                            <div className="form-group">
                                                <input
                                                    type="text"
                                                    value={flowerName}
                                                    onChange={(e) => handleFlowerNameChange(index, e.target.value)}
                                                    className="form-control"
                                                    placeholder={`Название цветка ${index + 1}`}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                onClick={() => removeFlowerName(index)}
                                                disabled={editingProduct.flowerNames.length === 1}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="btn btn-outline btn-sm"
                                        onClick={addFlowerName}
                                    >
                                        + Добавить цветок
                                    </button>
                                </div>

                                {/* Характеристики */}
                                <div className="form-section">
                                    <h4>Характеристики</h4>
                                    {editingProduct.characteristics.map((char, index) => (
                                        <div key={index} className="form-row array-item">
                                            <div className="form-group">
                                                <input
                                                    type="text"
                                                    value={char.name}
                                                    onChange={(e) => handleCharacteristicChange(index, 'name', e.target.value)}
                                                    className="form-control"
                                                    placeholder="Название характеристики"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <input
                                                    type="text"
                                                    value={char.value}
                                                    onChange={(e) => handleCharacteristicChange(index, 'value', e.target.value)}
                                                    className="form-control"
                                                    placeholder="Значение"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                onClick={() => removeCharacteristic(index)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="btn btn-outline btn-sm"
                                        onClick={addCharacteristic}
                                    >
                                        + Добавить характеристику
                                    </button>
                                </div>

                                {/* Изображения */}
                                <div className="form-section">
                                    <h4>Изображения</h4>
                                    <div className="images-preview">
                                        {editingProduct.images.map((image, index) => (
                                            <div key={index} className="image-item">
                                                <img src={image} alt={`Preview ${index + 1}`} />
                                                <div className="image-badge">
                                                    {getImageType(image) === 'url' ? 'URL' : 'File'}
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => removeImage(index)}
                                                >
                                                    ×
                                                </button>
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
                                                    className="btn btn-outline btn-sm"
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
                                                checked={editingProduct.isActive}
                                                onChange={(e) => handleEditChange('isActive', e.target.checked)}
                                            />
                                            Активный товар
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setShowEditModal(false)}>
                                Отмена
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={saveProductChanges}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Сохранение...' : 'Сохранить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagement;