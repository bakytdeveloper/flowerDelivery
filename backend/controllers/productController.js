import Product from '../models/Product.js';
import path from 'path';
import {
    fileURLToPath
} from 'url';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const genderOrder = [
    "Мужская одежда",
    "Женская одежда",
    "Детская одежда",
    "Унисекс",
    "Гаджеты",
    "Бытовая эл.техника",
    "Аксессуары"
];

const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Вспомогательная функция для обработки изображений продукта
const processProductImages = (product, req) => {
    const productData = product.toObject ? product.toObject() : {
        ...product
    };

    return {
        ...productData,
        images: productData.images?.map(image =>
            image.startsWith('http') ? image : `${req.protocol}://${req.get('host')}/uploads/${path.basename(image)}`
        ),
        discountPercentage: productData.originalPrice && productData.price ?
            Math.round((productData.originalPrice - productData.price) / productData.originalPrice * 100) :
            0,
        averageRating: productData.reviews && productData.reviews.length > 0 ?
            productData.reviews.reduce((acc, review) => acc + review.rating, 0) / productData.reviews.length :
            0
    };
};

// Контроллер для получения продуктов с фильтрацией и поиском
export const getProducts = async (req, res) => {
    try {
        const {
            gender,
            category,
            type,
            search,
            page = 1,
        } = req.query;

        const userAgent = req.headers['user-agent'];
        const isMobile = /Mobile|Android|iP(hone|od)|IEMobile/.test(userAgent);
        const limit = isMobile ? 10 : 15;
        const skip = (page - 1) * limit;

        let baseQuery = {
            isActive: true,
            quantity: {
                $gt: 0
            }
        };

        if (gender) baseQuery.gender = gender;
        if (category) baseQuery.category = category;
        if (type) baseQuery.type = type;

        let products = [];
        let totalCount = 0;

        if (search) {
            const exactPhrase = escapeRegex(search.trim());
            const exactRegex = new RegExp(`\\b${exactPhrase}\\b`, 'i');

            // 1️⃣ Приоритет: точное совпадение всей фразы
            const exactQuery = {
                ...baseQuery,
                $or: [{
                        name: exactRegex
                    },
                    {
                        type: exactRegex
                    },
                    {
                        brand: exactRegex
                    },
                    {
                        description: exactRegex
                    }
                ]
            };

            products = await Product.find(exactQuery)
                .populate('admin', 'name email')
                .skip(skip)
                .limit(limit)
                .sort({
                    createdAt: -1
                });

            totalCount = await Product.countDocuments(exactQuery);

            // 2️⃣ Fallback: полнотекстовый поиск
            if (totalCount === 0) {
                const textQuery = {
                    ...baseQuery,
                    $text: {
                        $search: search
                    }
                };

                products = await Product.find(textQuery)
                    .populate('admin', 'name email')
                    .skip(skip)
                    .limit(limit)
                    .sort({
                        createdAt: -1
                    });

                totalCount = await Product.countDocuments(textQuery);
            }

            // 3️⃣ Fallback: частичное совпадение
            if (totalCount === 0) {
                const looseRegex = new RegExp(escapeRegex(search), 'i');
                const looseQuery = {
                    ...baseQuery,
                    $or: [{
                            name: looseRegex
                        },
                        {
                            type: looseRegex
                        },
                        {
                            brand: looseRegex
                        },
                        {
                            description: looseRegex
                        }
                    ]
                };

                products = await Product.find(looseQuery)
                    .populate('admin', 'name email')
                    .skip(skip)
                    .limit(limit)
                    .sort({
                        createdAt: -1
                    });

                totalCount = await Product.countDocuments(looseQuery);
            }
        } else {
            // Без поиска — обычный запрос
            products = await Product.find(baseQuery)
                .populate('admin', 'name email')
                .skip(skip)
                .limit(limit)
                .sort({
                    createdAt: -1
                });

            totalCount = await Product.countDocuments(baseQuery);
        }

        // Обрабатываем изображения для всех продуктов
        const processedProducts = products.map(product => processProductImages(product, req));

        res.json({
            products: processedProducts,
            totalCount,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / limit),
            limit
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            message: 'Server error'
        });
    }
};

// Контроллер для получения иерархии фильтров
export const getFiltersHierarchy = async (req, res) => {
    try {
        const baseQuery = {
            isActive: true,
            quantity: {
                $gt: 0
            }
        };

        // Получаем все genders
        const genders = await Product.distinct('gender', baseQuery);
        const sortedGenders = genders.sort((a, b) =>
            genderOrder.indexOf(a) - genderOrder.indexOf(b)
        );

        // Для каждого gender получаем категории
        const genderWithCategories = await Promise.all(
            sortedGenders.map(async (gender) => {
                const categories = await Product.distinct('category', {
                    ...baseQuery,
                    gender
                });

                // Для каждой категории получаем типы
                const categoriesWithTypes = await Promise.all(
                    categories.map(async (category) => {
                        const types = await Product.distinct('type', {
                            ...baseQuery,
                            gender,
                            category
                        });
                        return {
                            category,
                            types
                        };
                    })
                );

                return {
                    gender,
                    categories: categoriesWithTypes
                };
            })
        );

        res.json({
            filters: genderWithCategories
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для получения genders
export const getGenders = async (req, res) => {
    try {
        const genders = await Product.distinct('gender', {
            isActive: true,
            quantity: {
                $gt: 0
            }
        });

        res.json({
            genders: genders || []
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для получения категорий
export const getCategories = async (req, res) => {
    try {
        const {
            gender
        } = req.query;

        let query = {
            isActive: true,
            quantity: {
                $gt: 0
            }
        };

        if (gender) {
            query.gender = gender;
        }

        const categories = await Product.distinct('category', query);
        res.json({
            categories: categories || []
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для получения типов
export const getTypes = async (req, res) => {
    try {
        const {
            gender,
            category
        } = req.query;

        let query = {
            isActive: true,
            quantity: {
                $gt: 0
            }
        };

        if (gender) query.gender = gender;
        if (category) query.category = category;

        const types = await Product.distinct('type', query);
        res.json({
            types: types || []
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для получения новейших продуктов
export const getNewestProducts = async (req, res) => {
    try {
        const userAgent = req.headers['user-agent'];
        const isMobile = /Mobile|Android|iP(hone|od)|IEMobile/.test(userAgent);
        const limit = isMobile ? 10 : 18;

        const products = await Product.find({
                isActive: true,
                quantity: {
                    $gt: 0
                }
            })
            .populate('admin', 'name email')
            .sort({
                createdAt: -1
            })
            .limit(limit)
            .lean();

        // Обрабатываем изображения и добавляем виртуальные поля
        const processedProducts = products.map(product => {
            const processed = processProductImages(product, req);
            return {
                ...processed,
                truncatedDescription: product.description?.slice(0, 100) +
                    (product.description?.length > 100 ? "..." : "")
            };
        });

        res.json(processedProducts);

    } catch (error) {
        console.error('Error fetching newest products:', error);
        res.status(500).json({
            message: 'Server error'
        });
    }
};

// Контроллер для получения продукта по ID
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('admin')
            .lean();

        if (!product) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        if (!product.isActive) {
            return res.status(403).json({
                message: 'Product is not available'
            });
        }

        // Обработка изображений
        const processedImages = product.images?.map(image =>
            image.startsWith('http') ? image : `${req.protocol}://${req.get('host')}/uploads/${path.basename(image)}`
        );

        // Вычисление скидки
        const discountPercentage = product.originalPrice && product.price ?
            Math.round((product.originalPrice - product.price) / product.originalPrice * 100) :
            0;

        // Формирование ответа
        const response = {
            ...product,
            images: processedImages,
            discountPercentage,
            truncatedDescription: product.description?.slice(0, 100) +
                (product.description?.length > 100 ? "..." : ""),
            adminInfo: product.admin ? {
                id: product.admin._id,
                name: product.admin.name
            } : null
        };

        res.json({
            success: true,
            product: response
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Контроллер для создания продукта
export const createProduct = async (req, res) => {
    const {
        name,
        description,
        price,
        category,
        direction,
        type,
        brand,
        characteristics,
        images,
        originalPrice,
        gender,
        sizes,
        colors,
        quantity
    } = req.body;

    try {
        const product = new Product({
            name,
            description,
            price,
            category,
            direction,
            type,
            brand,
            characteristics,
            images,
            originalPrice,
            gender,
            sizes,
            colors,
            quantity,
            admin: req.user.userId
        });

        const newProduct = await product.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

// Контроллер для обновления продукта
export const updateProduct = async (req, res) => {
    const {
        name,
        description,
        price,
        category,
        direction,
        type,
        brand,
        characteristics,
        images,
        originalPrice,
        gender,
        sizes,
        colors,
        quantity,
        isActive
    } = req.body;

    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id, {
                name,
                description,
                price,
                category,
                direction,
                type,
                brand,
                characteristics,
                images,
                originalPrice,
                gender,
                sizes,
                colors,
                quantity,
                isActive
            }, {
                new: true
            }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для удаления продукта
export const deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);

        if (!deletedProduct) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }
        res.json({
            message: 'Product deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для получения связанных продуктов
export const getRelatedProducts = async (req, res) => {
    try {
        const {
            productId
        } = req.params;
        const product = await Product.findById(productId).populate('admin');

        if (!product) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        const productType = product.type;

        const relatedProducts = await Product.find({
            type: productType,
            _id: {
                $ne: productId
            },
            isActive: true,
            quantity: {
                $gt: 0
            }
        }).populate('admin');

        // Обрабатываем изображения
        const processedProducts = relatedProducts.map(product => processProductImages(product, req));

        res.json(processedProducts);
    } catch (error) {
        console.error('Error fetching related products:', error);
        res.status(500).json({
            message: 'Internal Server Error',
            success: false
        });
    }
};

// Контроллер для получения аксессуаров по направлению
export const getAccessoriesByDirection = async (req, res) => {
    try {
        const {
            direction
        } = req.params;

        const accessories = await Product.find({
            direction,
            isActive: true,
            quantity: {
                $gt: 0
            }
        }).populate('admin');

        // Обрабатываем изображения
        const processedAccessories = accessories.map(product => processProductImages(product, req));

        res.json(processedAccessories);
    } catch (error) {
        console.error('Error fetching accessories:', error);
        res.status(500).json({
            message: 'Internal Server Error',
            success: false
        });
    }
};

// Контроллер для переключения активности продукта
export const toggleProductActive = async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        product.isActive = !product.isActive;
        await product.save({
            validateModifiedOnly: true
        });

        res.status(200).json({
            message: 'Product activity toggled successfully',
            product
        });
    } catch (error) {
        console.error('Error toggling product activity:', error);
        res.status(500).json({
            message: 'Internal server error'
        });
    }
};

// Контроллер для получения рейтинга продукта
export const getProductRating = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('reviews');

        if (!product) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }

        res.json({
            averageRating: product.averageRating,
            reviewCount: product.reviews.length
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};