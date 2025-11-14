// src/components/AdminPanel/ProductManagement/ProductManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import ProductForm from "../ProductForm/ProductForm";
import CustomSelect from '../../Common/CustomSelect'; // Импортируем кастомный селект
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
    const [modalMode, setModalMode] = useState('edit'); // 'edit' или 'create'
    const [showProductModal, setShowProductModal] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5506';
    const limit = 12;

    const typeOptions = [
        { value: '', label: 'Все типы' },
        { value: 'single', label: 'Штучные' },
        { value: 'bouquet', label: 'Букеты' }
    ];

    const statusOptions = [
        { value: '', label: 'Все статусы' },
        { value: 'true', label: 'Активные' },
        { value: 'false', label: 'Неактивные' }
    ];

    const occasionOptions = [
        { value: '', label: 'Все поводы' },
        { value: 'birthday', label: 'День рождения' },
        { value: 'jubilee', label: 'Юбилей' },
        { value: 'wedding', label: 'Свадьба' },
        { value: 'anniversary', label: 'Годовщина' },
        { value: 'valentine', label: 'День святого Валентина' },
        { value: 'womens_day', label: '8 марта' },
        { value: 'mothers_day', label: 'День матери' },
        { value: 'fathers_day', label: 'День отца' },
        { value: 'baby_birth', label: 'Выписка из роддома' },
        { value: 'graduation', label: 'Выпускной' },
        { value: 'promotion', label: 'Повышение / новая работа' },
        { value: 'thank_you', label: 'Благодарность' },
        { value: 'apology', label: 'Извинение' },
        { value: 'condolences', label: 'Сочувствие / соболезнование' },
        { value: 'get_well', label: 'Выздоровление / поддержка' },
        { value: 'just_because', label: 'Без повода / просто так' },
        { value: 'romantic_evening', label: 'Романтический вечер' },
        { value: 'love_confession', label: 'Признание в любви' },
        { value: 'holiday', label: 'Праздник (Новый год, Курман айт, Нооруз и др.)' },
        { value: 'business_opening', label: 'Открытие бизнеса / новоселье' }
    ];

    // Загрузка товаров
    const fetchProducts = async (page = 1) => {
        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams();
            queryParams.append('page', page);
            queryParams.append('limit', limit);

            // Добавляем ВСЕ параметры фильтрации
            if (filters.search) queryParams.append('search', filters.search);
            if (filters.type) queryParams.append('type', filters.type);
            if (filters.occasion) queryParams.append('occasion', filters.occasion);
            if (filters.recipient) queryParams.append('recipient', filters.recipient);
            if (filters.isActive) queryParams.append('isActive', filters.isActive);

            console.log('Fetching products with params:', Object.fromEntries(queryParams)); // Для отладки

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
        // eslint-disable-next-line
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

    // Заменяем функцию handleEditClick на:
    const handleEditClick = (product) => {
        const productCopy = {
            ...product,
            flowerNames: Array.isArray(product.flowerNames) ? [...product.flowerNames] : [],
            characteristics: Array.isArray(product.characteristics)
                ? product.characteristics.map(char => ({...char}))
                : [],
            images: Array.isArray(product.images) ? [...product.images] : []
        };
        setCurrentProduct(productCopy);
        setModalMode('edit');
        setShowProductModal(true);
    };

// Добавляем функцию для создания товара:
    const handleCreateClick = () => {
        setCurrentProduct(null);
        setModalMode('create');
        setShowProductModal(true);
    };

// Добавляем функцию обработки сохранения:
    const handleProductSave = (savedProduct) => {
        setShowProductModal(false);
        setCurrentProduct(null);
        fetchProducts(currentPage);

        if (modalMode === 'create') {
            toast.success('Товар успешно создан');
        }
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
        if (!editingProduct.name || !editingProduct.price) {
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

    // Переключение активности товара - ИСПРАВЛЕННАЯ ВЕРСИЯ
    const toggleProductActive = async (productId, currentStatus) => {
        try {
            // Создаем обновленные данные продукта
            const updatedProductData = {
                isActive: !currentStatus
            };

            const response = await fetch(`${apiUrl}/api/admin/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedProductData)
            });

            if (response.ok) {
                // const updatedProduct = await response.json();
                toast.success(`Товар ${!currentStatus ? 'активирован' : 'деактивирован'}`);

                // Обновляем локальное состояние для мгновенного отражения изменений
                setProducts(prevProducts =>
                    prevProducts.map(product =>
                        product._id === productId
                            ? { ...product, isActive: !currentStatus }
                            : product
                    )
                );
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка при изменении статуса товара');
            }
        } catch (error) {
            console.error('Error toggling product active:', error);
            toast.error(error.message || 'Ошибка при изменении статуса товара');
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
                    <button className="btn btn-primary" onClick={handleCreateClick}>
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
                        className="form-control filter-group-select-input"
                    />
                </div>

                <div className="filter-group">
                    <CustomSelect
                        value={filters.type}
                        onChange={(value) => handleFilterChange('type', value)}
                        options={typeOptions}
                        placeholder="Все типы"
                        className="filter-select"
                    />
                </div>

                <div className="filter-group">
                    <CustomSelect
                        value={filters.occasion}
                        onChange={(value) => handleFilterChange('occasion', value)}
                        options={occasionOptions}
                        placeholder="Все поводы"
                        className="filter-select"
                    />
                </div>

                <div className="filter-group">
                    <CustomSelect
                        value={filters.isActive}
                        onChange={(value) => handleFilterChange('isActive', value)}
                        options={statusOptions}
                        placeholder="Все статусы"
                        className="filter-select"
                    />
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
                    <div className="addons-grid-admin">
                        {products.map((product) => (
                            <div key={product._id} className="addon-card-admin">
                                <div className="addon-image-container">
                                    <img
                                        src={product.images?.[0] || '/images/placeholder-flower.jpg'}
                                        alt={product.name}
                                        className="addon-image"
                                    />
                                    <div className="addon-badges">
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

                                <div className="addon-info">
                                    <h3 className="addon-name">{product.name}</h3>
                                    {product.description && (
                                        <p className="addon-description">
                                            {product.description.length > 80
                                                ? `${product.description.slice(0, 80)}...`
                                                : product.description
                                            }
                                        </p>
                                    )}
                                    <div className="addon-details">
                                        <div className="detail-item">
                                            <span className="detail-label">В наличии:</span>
                                            <span className="detail-value">{product.quantity} шт</span>
                                        </div>
                                    </div>

                                    <div className="addon-price-admin">
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

                                    <div className="addon-actions-admin">
                                        <button
                                            className={`btn-status ${product.isActive ? 'btn-active' : 'btn-inactive'}`}
                                            onClick={() => toggleProductActive(product._id, product.isActive)}
                                        >
                                            {product.isActive ? 'Активен' : 'Неактивен'}
                                        </button>

                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDeleteClick(product)}
                                        >
                                            🗑️
                                        </button>

                                        <button
                                            className="btn-edit"
                                            onClick={() => handleEditClick(product)}
                                        >
                                            Редактировать
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
            {showProductModal && (
                <ProductForm
                    initialProduct={currentProduct}
                    onSave={handleProductSave}
                    onCancel={() => {
                        setShowProductModal(false);
                        setCurrentProduct(null);
                    }}
                />
            )}
        </div>
    );
};

export default ProductManagement;