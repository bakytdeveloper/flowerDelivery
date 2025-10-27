import Product from '../models/Product.js';
import path from 'path';
import {
    fileURLToPath
} from 'url';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

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
            type,
            occasion,
            recipient,
            flowerNames,
            stemLength,
            flowerColors,
            search,
            page = 1,
            sortBy = 'createdAt',
            sortOrder = 'desc'
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

        // Добавляем фильтры для цветов
        if (type) baseQuery.type = type;
        if (occasion) baseQuery.occasion = occasion;
        if (recipient) baseQuery.recipient = recipient;
        if (flowerNames) baseQuery.flowerNames = { $in: Array.isArray(flowerNames) ? flowerNames : [flowerNames] };
        if (stemLength) baseQuery.stemLength = { $gte: parseInt(stemLength) };
        if (flowerColors) {
            baseQuery['flowerColors.name'] = { $in: Array.isArray(flowerColors) ? flowerColors : [flowerColors] };
        }

        let products = [];
        let totalCount = 0;

        // Сортировка
        const sortOptions = {};
        if (sortBy === 'price') {
            sortOptions.price = sortOrder === 'asc' ? 1 : -1;
        } else if (sortBy === 'soldCount') {
            sortOptions.soldCount = sortOrder === 'asc' ? 1 : -1;
        } else if (sortBy === 'rating') {
            // Для рейтинга нужна дополнительная логика
            sortOptions.averageRating = sortOrder === 'asc' ? 1 : -1;
        } else {
            sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;
        }

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
                        flowerNames: exactRegex
                    },
                    {
                        description: exactRegex
                    },
                    {
                        occasion: exactRegex
                    },
                    {
                        recipient: exactRegex
                    }
                ]
            };

            products = await Product.find(exactQuery)
                .populate('admin', 'name email')
                .skip(skip)
                .limit(limit)
                .sort(sortOptions);

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
                    .sort(sortOptions);

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
                            flowerNames: looseRegex
                        },
                        {
                            description: looseRegex
                        },
                        {
                            occasion: looseRegex
                        },
                        {
                            recipient: looseRegex
                        }
                    ]
                };

                products = await Product.find(looseQuery)
                    .populate('admin', 'name email')
                    .skip(skip)
                    .limit(limit)
                    .sort(sortOptions);

                totalCount = await Product.countDocuments(looseQuery);
            }
        } else {
            // Без поиска — обычный запрос
            products = await Product.find(baseQuery)
                .populate('admin', 'name email')
                .skip(skip)
                .limit(limit)
                .sort(sortOptions);

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

// Контроллер для получения доступных фильтров
export const getAvailableFilters = async (req, res) => {
    try {
        const baseQuery = {
            isActive: true,
            quantity: {
                $gt: 0
            }
        };

        const [
            types,
            occasions,
            recipients,
            flowerNames,
            flowerColors,
            stemLengths
        ] = await Promise.all([
            // Типы (одиночный/букет)
            Product.distinct('type', baseQuery),
            // Поводы
            Product.distinct('occasion', baseQuery),
            // Получатели
            Product.distinct('recipient', baseQuery),
            // Названия цветов
            Product.distinct('flowerNames', baseQuery),
            // Цвета цветов
            Product.distinct('flowerColors.name', baseQuery),
            // Длины стеблей (уникальные значения)
            Product.distinct('stemLength', baseQuery).then(lengths =>
                lengths.filter(length => length != null).sort((a, b) => a - b)
            )
        ]);

        // Получаем статистику по продажам для популярных цветов
        const popularFlowers = await Product.aggregate([
            { $match: baseQuery },
            { $unwind: '$flowerNames' },
            {
                $group: {
                    _id: '$flowerNames',
                    totalSold: { $sum: '$soldCount' },
                    productCount: { $sum: 1 }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            filters: {
                types: types || [],
                occasions: occasions || [],
                recipients: recipients || [],
                flowerNames: flowerNames || [],
                flowerColors: flowerColors || [],
                stemLengths: stemLengths || [],
                popularFlowers: popularFlowers || []
            }
        });
    } catch (error) {
        console.error('Error fetching filters:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для получения самых продаваемых цветов
export const getBestSellingProducts = async (req, res) => {
    try {
        const userAgent = req.headers['user-agent'];
        const isMobile = /Mobile|Android|iP(hone|od)|IEMobile/.test(userAgent);
        const limit = isMobile ? 8 : 12;

        const products = await Product.find({
            isActive: true,
            quantity: {
                $gt: 0
            },
            soldCount: {
                $gt: 0
            }
        })
            .populate('admin', 'name email')
            .sort({
                soldCount: -1
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
        console.error('Error fetching best selling products:', error);
        res.status(500).json({
            message: 'Server error'
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
        type,
        occasion,
        recipient,
        flowerNames,
        stemLength,
        flowerColors,
        characteristics,
        images,
        originalPrice,
        quantity
    } = req.body;

    try {
        const product = new Product({
            name,
            description,
            price,
            category,
            type,
            occasion,
            recipient,
            flowerNames,
            stemLength,
            flowerColors,
            characteristics,
            images,
            originalPrice,
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
        type,
        occasion,
        recipient,
        flowerNames,
        stemLength,
        flowerColors,
        characteristics,
        images,
        originalPrice,
        quantity,
        isActive,
        soldCount
    } = req.body;

    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id, {
                name,
                description,
                price,
                category,
                type,
                occasion,
                recipient,
                flowerNames,
                stemLength,
                flowerColors,
                characteristics,
                images,
                originalPrice,
                quantity,
                isActive,
                soldCount
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

        const relatedProducts = await Product.find({
            $or: [
                { type: product.type },
                { occasion: product.occasion },
                { recipient: product.recipient },
                { flowerNames: { $in: product.flowerNames } }
            ],
            _id: { $ne: productId },
            isActive: true,
            quantity: { $gt: 0 }
        })
            .populate('admin')
            .limit(8);

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

// Контроллер для получения продуктов по поводу
export const getProductsByOccasion = async (req, res) => {
    try {
        const { occasion } = req.params;
        const { page = 1 } = req.query;

        const limit = 12;
        const skip = (page - 1) * limit;

        const products = await Product.find({
            occasion,
            isActive: true,
            quantity: { $gt: 0 }
        })
            .populate('admin', 'name email')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const totalCount = await Product.countDocuments({
            occasion,
            isActive: true,
            quantity: { $gt: 0 }
        });

        const processedProducts = products.map(product => processProductImages(product, req));

        res.json({
            products: processedProducts,
            totalCount,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / limit)
        });
    } catch (error) {
        console.error('Error fetching products by occasion:', error);
        res.status(500).json({
            message: 'Server error'
        });
    }
};