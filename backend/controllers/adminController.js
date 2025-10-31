import bcrypt from 'bcrypt';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import {
    fileURLToPath
} from 'url';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

// Контроллер для получения всех продуктов админа
export const getAdminProducts = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 10, search = '' } = req.query;

        const skip = (page - 1) * limit;
        let query = { admin: userId };

        // Добавляем поиск по названию, если есть
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const adminProducts = await Product.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalCount = await Product.countDocuments(query);

        res.json({
            products: adminProducts,
            totalCount,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / limit)
        });
    } catch (error) {
        console.error('Ошибка при получении товаров админа:', error);
        res.status(500).json({
            message: 'Внутренняя ошибка сервера'
        });
    }
};

// Контроллер для создания продукта
export const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            originalPrice,
            category,
            type,
            occasion,
            recipient,
            flowerNames,
            stemLength,
            flowerColors,
            characteristics,
            images,
            quantity = 10
        } = req.body;

        const adminId = req.user.userId;

        // Проверка обязательных полей для цветов
        if (!name || !price || !category || !type || !occasion || !recipient || !flowerNames || !stemLength) {
            return res.status(400).json({
                message: 'Необходимо заполнить все обязательные поля'
            });
        }

        // Проверяем, что flowerNames - массив
        const processedFlowerNames = Array.isArray(flowerNames) ? flowerNames : [flowerNames];

        // Обрабатываем flowerColors
        let processedFlowerColors = [];
        if (flowerColors && Array.isArray(flowerColors)) {
            processedFlowerColors = flowerColors.map(color => {
                if (typeof color === 'string') {
                    return { name: color, value: color };
                }
                return color;
            });
        }

        const newProduct = new Product({
            name,
            description,
            price,
            originalPrice,
            category,
            type,
            occasion,
            recipient,
            flowerNames: processedFlowerNames,
            stemLength: parseInt(stemLength),
            flowerColors: processedFlowerColors,
            characteristics: characteristics || [],
            images: images || [],
            quantity,
            admin: adminId
        });

        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error('Ошибка при создании товара:', error);
        res.status(500).json({
            message: 'Ошибка сервера при создании товара',
            error: error.message
        });
    }
};

// Контроллер для проверки дубликата товара
export const checkProductDuplicate = async (req, res) => {
    try {
        const {
            name,
            type,
            flowerNames
        } = req.body;
        const adminId = req.user.userId;

        const existingProduct = await Product.findOne({
            admin: adminId,
            name,
            type,
            flowerNames: { $in: flowerNames }
        });

        res.json({
            isDuplicate: !!existingProduct,
            existingProductId: existingProduct?._id
        });
    } catch (error) {
        console.error('Ошибка при проверке дубликата товара:', error);
        res.status(500).json({
            message: 'Ошибка при проверке товара'
        });
    }
};

// Контроллер для получения конкретного продукта
export const getProduct = async (req, res) => {
    try {
        const {
            productId
        } = req.params;
        const adminId = req.user.userId;

        const product = await Product.findOne({
            _id: productId,
            admin: adminId
        });

        if (!product) {
            return res.status(404).json({
                message: 'Товар не найден или у вас нет прав на его просмотр'
            });
        }

        res.json(product);
    } catch (error) {
        console.error('Ошибка при получении товара:', error);
        res.status(500).json({
            message: 'Внутренняя ошибка сервера'
        });
    }
};

// Контроллер для обновления продукта
export const updateProduct = async (req, res) => {
    try {
        const {
            productId
        } = req.params;
        const adminId = req.user.userId;

        // Проверяем, что продукт принадлежит админу
        const product = await Product.findOne({
            _id: productId,
            admin: adminId
        });
        if (!product) {
            return res.status(404).json({
                message: 'Product not found or access denied'
            });
        }

        // Обрабатываем данные перед обновлением
        const updateData = { ...req.body };

        // Обрабатываем flowerNames
        if (updateData.flowerNames && !Array.isArray(updateData.flowerNames)) {
            updateData.flowerNames = [updateData.flowerNames];
        }

        // Обрабатываем flowerColors
        if (updateData.flowerColors && Array.isArray(updateData.flowerColors)) {
            updateData.flowerColors = updateData.flowerColors.map(color => {
                if (typeof color === 'string') {
                    return { name: color, value: color };
                }
                return color;
            });
        }

        // Преобразуем stemLength в число
        if (updateData.stemLength) {
            updateData.stemLength = parseInt(updateData.stemLength);
        }

        const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, {
            new: true
        });
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
        const {
            productId
        } = req.params;
        const adminId = req.user.userId;

        const product = await Product.findOne({
            _id: productId,
            admin: adminId
        });
        if (!product) {
            return res.status(404).json({
                message: 'Товар не найден'
            });
        }

        // Удаляем изображения товара с сервера
        for (const imageUrl of product.images) {
            const imagePath = path.join(__dirname, '..', 'uploads', path.basename(imageUrl));
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await Product.findByIdAndDelete(productId);
        res.json({
            message: 'Товар и его изображения успешно удалены'
        });
    } catch (error) {
        console.error('Ошибка при удалении товара:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для получения истории продаж
export const getSalesHistory = async (req, res) => {
    try {
        const {
            page = 1, perPage = 15
        } = req.query;
        const adminId = req.user.userId;

        const pageNum = parseInt(page, 10);
        const perPageNum = parseInt(perPage, 10);

        if (isNaN(pageNum) || isNaN(perPageNum) || pageNum < 1 || perPageNum < 1) {
            return res.status(400).json({
                message: "Invalid pagination parameters"
            });
        }

        // Получаем заказы для текущего админа
        const orders = await Order.aggregate([{
            $unwind: '$products'
        },
            {
                $match: {
                    'products.admin.id': new mongoose.Types.ObjectId(adminId)
                }
            },
            {
                $group: {
                    _id: '$_id',
                    date: {
                        $first: '$date'
                    },
                    status: {
                        $first: '$status'
                    },
                    products: {
                        $push: '$products'
                    },
                    totalAmount: {
                        $first: '$totalAmount'
                    },
                    user: {
                        $first: '$user'
                    },
                    firstName: {
                        $first: '$firstName'
                    },
                    phoneNumber: {
                        $first: '$phoneNumber'
                    }
                }
            },
            {
                $sort: {
                    date: -1
                }
            },
            {
                $skip: (pageNum - 1) * perPageNum
            },
            {
                $limit: perPageNum
            }
        ]);

        const totalOrders = await Order.countDocuments({
            'products.admin.id': new mongoose.Types.ObjectId(adminId)
        });

        res.json({
            orders,
            totalOrders,
            page: pageNum,
            perPage: perPageNum
        });
    } catch (error) {
        console.error("Error fetching sales history:", error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для получения статистики продаж
export const getSalesStats = async (req, res) => {
    try {
        const adminId = req.user.userId;

        const stats = await Order.aggregate([
            { $unwind: '$products' },
            {
                $match: {
                    'products.admin.id': new mongoose.Types.ObjectId(adminId),
                    status: { $in: ['completed', 'inProgress'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$products.price' },
                    totalProductsSold: { $sum: '$products.quantity' },
                    totalOrders: { $addToSet: '$_id' }
                }
            },
            {
                $project: {
                    totalRevenue: 1,
                    totalProductsSold: 1,
                    totalOrders: { $size: '$totalOrders' }
                }
            }
        ]);

        // Получаем самые популярные цветы
        const popularFlowers = await Order.aggregate([
            { $unwind: '$products' },
            {
                $match: {
                    'products.admin.id': new mongoose.Types.ObjectId(adminId),
                    status: { $in: ['completed', 'inProgress'] }
                }
            },
            { $unwind: '$products.flowerNames' },
            {
                $group: {
                    _id: '$products.flowerNames',
                    totalSold: { $sum: '$products.quantity' },
                    revenue: { $sum: '$products.price' }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);

        // Получаем статистику по поводам
        const occasionStats = await Order.aggregate([
            { $unwind: '$products' },
            {
                $match: {
                    'products.admin.id': new mongoose.Types.ObjectId(adminId),
                    status: { $in: ['completed', 'inProgress'] }
                }
            },
            {
                $group: {
                    _id: '$products.occasion',
                    totalSold: { $sum: '$products.quantity' },
                    revenue: { $sum: '$products.price' }
                }
            },
            { $sort: { totalSold: -1 } }
        ]);

        const result = {
            totalRevenue: stats[0]?.totalRevenue || 0,
            totalProductsSold: stats[0]?.totalProductsSold || 0,
            totalOrders: stats[0]?.totalOrders || 0,
            popularFlowers,
            occasionStats
        };

        res.json(result);
    } catch (error) {
        console.error("Error fetching sales stats:", error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для удаления изображения
export const removeImage = async (req, res) => {
    const {
        imageUrl
    } = req.body;
    try {
        const filePath = path.join(__dirname, '..', 'uploads', path.basename(imageUrl));
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await Product.updateMany({}, {
            $pull: {
                images: imageUrl
            }
        });
        res.status(200).send({
            message: 'Изображение успешно удалено'
        });
    } catch (error) {
        console.error('Ошибка при удалении изображения:', error);
        res.status(500).send({
            message: 'Ошибка при удалении изображения'
        });
    }
};

export const deleteImageByName = async (req, res) => {
    const imageName = req.params.imageName;
    const imagePath = path.join(__dirname, '..', 'uploads', imageName);

    try {
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        const imageUrl = `${process.env.REACT_APP_API_URL}/uploads/${imageName}`;
        await Product.updateMany({}, {
            $pull: {
                images: imageUrl
            }
        });

        res.status(200).json({
            message: 'Изображение успешно удалено'
        });
    } catch (err) {
        console.error('Ошибка при удалении изображения:', err);
        res.status(500).json({
            message: 'Не удалось удалить изображение'
        });
    }
};

// Контроллер для обновления количества проданных цветов
export const updateSoldCount = async (req, res) => {
    try {
        const { productId } = req.params;
        const { soldCount } = req.body;
        const adminId = req.user.userId;

        const product = await Product.findOne({
            _id: productId,
            admin: adminId
        });

        if (!product) {
            return res.status(404).json({
                message: 'Товар не найден'
            });
        }

        product.soldCount = parseInt(soldCount);
        await product.save();

        res.json({
            message: 'Количество продаж обновлено',
            product
        });
    } catch (error) {
        console.error('Ошибка при обновлении количества продаж:', error);
        res.status(500).json({
            message: error.message
        });
    }
};


// Контроллер для загрузки изображений
export const uploadImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const imageUrls = req.files.map(file =>
            `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
        );

        res.json({
            message: 'Images uploaded successfully',
            images: imageUrls
        });
    } catch (error) {
        console.error('Error uploading images:', error);
        res.status(500).json({ message: 'Error uploading images' });
    }
};

// Контроллер для обновления продукта с полными данными
export const updateProductFull = async (req, res) => {
    try {
        const { productId } = req.params;
        const adminId = req.user.userId;

        // Проверяем, что продукт принадлежит админу
        const product = await Product.findOne({
            _id: productId,
            admin: adminId
        });

        if (!product) {
            return res.status(404).json({
                message: 'Product not found or access denied'
            });
        }

        // Обрабатываем данные перед обновлением
        const updateData = { ...req.body };

        // Обрабатываем flowerNames - убеждаемся что это массив
        if (updateData.flowerNames && !Array.isArray(updateData.flowerNames)) {
            updateData.flowerNames = [updateData.flowerNames];
        }

        // Обрабатываем characteristics
        if (updateData.characteristics && !Array.isArray(updateData.characteristics)) {
            updateData.characteristics = [updateData.characteristics];
        }

        // Преобразуем числовые поля
        if (updateData.price) updateData.price = Number(updateData.price);
        if (updateData.originalPrice) updateData.originalPrice = Number(updateData.originalPrice);
        if (updateData.stemLength) updateData.stemLength = Number(updateData.stemLength);
        if (updateData.quantity) updateData.quantity = Number(updateData.quantity);
        if (updateData.soldCount) updateData.soldCount = Number(updateData.soldCount);

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            updateData,
            { new: true, runValidators: true }
        );

        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            message: error.message
        });
    }
};