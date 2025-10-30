import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Addon from '../models/Addon.js';

import {
    transporter
} from '../smtp/otpService.js';


// Вспомогательные функции для управления складом
async function returnProductsToStock(products) {
    for (const item of products) {
        try {
            await Product.findByIdAndUpdate(
                item.product, {
                    $inc: {
                        quantity: item.quantity
                    }
                }, {
                    new: true
                }
            );
        } catch (error) {
            console.error(`Error returning product ${item.product} to stock:`, error);
        }
    }
}

async function deductProductsFromStock(products) {
    for (const item of products) {
        try {
            const product = await Product.findById(item.product);
            if (product.quantity < item.quantity) {
                throw new Error(`Insufficient quantity for product ${product.name}`);
            }
            product.quantity -= item.quantity;
            // Увеличиваем счетчик продаж
            product.soldCount += item.quantity;
            await product.save();
        } catch (error) {
            console.error(`Error deducting product ${item.product} from stock:`, error);
            throw error;
        }
    }
}

// Функция для отправки email о новом заказе
async function sendOrderEmail(orderData, orderProducts, userType) {
    const {
        _id,
        email,
        firstName,
        address,
        phoneNumber,
        totalAmount,
        paymentMethod,
        comments
    } = orderData;

    const userTypeText = {
        'customer': 'Зарегистрированный клиент',
        'admin': 'Администратор',
        'guest': 'Гость'
    } [userType] || 'Пользователь';

    const productList = orderProducts.map(item => {
        let itemInfo = `- ${item.name} (${item.quantity} шт.)`;

        // Информация о цветах
        if (item.flowerType) {
            itemInfo += ` - Тип: ${item.flowerType === 'single' ? 'Одиночный цветок' : 'Букет'}`;
        }

        if (item.flowerNames && item.flowerNames.length > 0) {
            itemInfo += ` - Цветы: ${item.flowerNames.join(', ')}`;
        }

        if (item.flowerColors && item.flowerColors.length > 0) {
            const colors = item.flowerColors.map(color => color.name).join(', ');
            itemInfo += ` - Цвета: ${colors}`;
        }

        if (item.stemLength) {
            itemInfo += ` - Длина стебля: ${item.stemLength} см`;
        }

        if (item.occasion) {
            itemInfo += ` - Повод: ${item.occasion}`;
        }

        if (item.recipient) {
            itemInfo += ` - Для: ${item.recipient}`;
        }

        itemInfo += ` - ${item.price * item.quantity} сом`;

        return itemInfo;
    }).join('\n');

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.SMTP_USER,
        subject: `Новый заказ цветов #${_id || '0000'} от ${userTypeText}`,
        html: `
            <h2>Поступил новый заказ цветов!</h2>
            <p><strong>Тип пользователя:</strong> ${userTypeText}</p>
            <p><strong>Клиент:</strong> ${firstName} </p>
            <p><strong>Эл.почта:</strong> ${email ? `${email}` : ''}</p>
            <p><strong>Телефон:</strong> ${phoneNumber}</p>
            <p><strong>Адрес доставки:</strong> ${address}</p>
            <p><strong>Общая сумма:</strong> ${totalAmount} сом</p>
            <h3>Состав заказа:</h3>
            <pre>${productList}</pre>
            <p><strong>Время заказа:</strong> ${new Date().toLocaleString('ru-RU')}</p>
            <p><strong>Способ оплаты:</strong> ${paymentMethod || 'Не указан'}</p>
            ${comments ? `<p><strong>Комментарий клиента:</strong> ${comments}</p>` : ''}
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email уведомление о заказе цветов отправлено администратору');
        return true;
    } catch (error) {
        console.error('Ошибка отправки email администратору:', error);
        return false;
    }
}

// Функция для отправки уведомлений о низком количестве товаров
async function notifyAboutLowQuantity(products) {
    for (const {
        product,
        quantity
    } of products) {
        const existingProduct = await Product.findById(product).populate('admin');
        if (existingProduct && existingProduct.quantity <= 3 && existingProduct.quantity >= 1) {
            const admin = existingProduct.admin;
            if (admin && admin.email) {
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: admin.email,
                    subject: `Оповещение о низком уровне запаса цветов: ${existingProduct.name}`,
                    text: `Дорогой ${admin.name},\n\nНастоящим сообщением, мы хотели сказать, что цветов "${existingProduct.name}" осталось мало на складе, осталось всего ${existingProduct.quantity} шт.\n\nПожалуйста, пополните запасы как можно скорее.\n\nС уважением,\nАдминистрация Цветочного Магазина`,
                };
                await transporter.sendMail(mailOptions);
            }
        }
    }
}

// Создание заказа
export const createOrder = async (req, res) => {
    try {
        const { user } = req;
        const {
            firstName,
            address,
            phoneNumber,
            paymentMethod,
            comments,
            guestInfo
        } = req.body;

        // Получаем корзину
        let cart;
        if (user.userId) {
            cart = await Cart.findOne({ user: user.userId });
        } else {
            cart = await Cart.findOne({ sessionId: user.sessionId });
        }

        if (!cart || (cart.flowerItems.length === 0 && cart.addonItems.length === 0)) {
            return res.status(400).json({ message: 'Корзина пуста' });
        }

        // Проверяем доступность товаров
        for (const item of cart.flowerItems) {
            const product = await Product.findById(item.product);
            if (!product || !product.isActive || product.quantity < item.quantity) {
                return res.status(400).json({
                    message: `Товар "${item.name}" недоступен в нужном количестве`
                });
            }
        }

        for (const item of cart.addonItems) {
            const addon = await Addon.findById(item.addonId);
            if (!addon || !addon.isActive || addon.quantity < item.quantity) {
                return res.status(400).json({
                    message: `Дополнительный товар "${item.name}" недоступен в нужном количестве`
                });
            }
        }

        // Определяем тип пользователя
        const userType = user.userId ? 'customer' : 'guest';

        // Создаем заказ
        const order = new Order({
            user: user.userId || null,
            guestInfo: userType === 'guest' ? guestInfo : undefined,
            userType,
            flowerItems: cart.flowerItems.map(item => ({
                product: item.product,
                quantity: item.quantity,
                name: item.name,
                flowerType: item.flowerType,
                category: item.category,
                price: item.price,
                flowerNames: item.flowerNames,
                flowerColors: item.flowerColors,
                stemLength: item.stemLength,
                occasion: item.occasion,
                recipient: item.recipient,
                wrapper: item.wrapper,
                itemTotal: item.itemTotal,
                itemType: 'flower'
            })),
            addonItems: cart.addonItems.map(item => ({
                addonId: item.addonId,
                quantity: item.quantity,
                name: item.name,
                type: item.type,
                price: item.price,
                itemTotal: item.itemTotal,
                itemType: 'addon'
            })),
            totalAmount: cart.total,
            firstName,
            address,
            phoneNumber,
            paymentMethod,
            comments,
            statusHistory: [{
                status: 'pending',
                time: new Date()
            }]
        });

        await order.save();

        // Обновляем количество товаров
        for (const item of cart.flowerItems) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { quantity: -item.quantity, soldCount: item.quantity }
            });
        }

        for (const item of cart.addonItems) {
            await Addon.findByIdAndUpdate(item.addonId, {
                $inc: { quantity: -item.quantity }
            });
        }

        // Очищаем корзину
        cart.flowerItems = [];
        cart.addonItems = [];
        await cart.save();

        res.status(201).json({
            message: 'Заказ успешно создан',
            order: await formatOrderResponse(order)
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ message: 'Ошибка при создании заказа' });
    }
};


// Получение заказов пользователя
export const getUserOrders = async (req, res) => {
    try {
        const { user } = req;

        let orders;
        if (user.userId) {
            orders = await Order.find({ user: user.userId })
                .sort({ date: -1 })
                .populate('flowerItems.product', 'name images')
                .populate('addonItems.addonId', 'name image type');
        } else {
            // Для гостей - по sessionId (если нужно)
            orders = await Order.find({
                'guestInfo.phone': user.sessionId
            }).sort({ date: -1 })
                .populate('flowerItems.product', 'name images')
                .populate('addonItems.addonId', 'name image type');
        }

        res.status(200).json({
            orders: orders.map(order => formatOrderResponse(order))
        });
    } catch (error) {
        console.error('Error getting user orders:', error);
        res.status(500).json({ message: 'Ошибка при получении заказов' });
    }
};

// Вспомогательная функция для форматирования заказа
const formatOrderResponse = (order) => {
    return {
        _id: order._id,
        userType: order.userType,
        flowerItems: order.flowerItems,
        addonItems: order.addonItems,
        totalAmount: order.totalAmount,
        status: order.status,
        date: order.date,
        firstName: order.firstName,
        address: order.address,
        phoneNumber: order.phoneNumber,
        paymentMethod: order.paymentMethod,
        comments: order.comments,
        statusHistory: order.statusHistory
    };
};

// Контроллер для получения всех заказов (для администратора)
export const getAllOrders = async (req, res) => {
    try {
        const {
            page = 1, perPage = 20, status, occasion
        } = req.query;

        let query = {};

        // Фильтрация по статусу
        if (status && status !== 'all') {
            query.status = status;
        }

        // Фильтрация по поводу
        if (occasion && occasion !== 'all') {
            query['products.occasion'] = occasion;
        }

        const orders = await Order.find(query)
            .populate('user', 'name email')
            .populate('products.product', 'name price images flowerNames occasion recipient')
            .sort({
                date: 'desc'
            })
            .skip((page - 1) * perPage)
            .limit(perPage);

        const totalOrders = await Order.countDocuments(query);

        res.json({
            orders,
            pagination: {
                currentPage: parseInt(page),
                perPage: parseInt(perPage),
                totalOrders,
                totalPages: Math.ceil(totalOrders / perPage)
            }
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для получения заказа по ID
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('user', 'name email')
            .populate('products.product', 'name price images flowerNames flowerColors stemLength occasion recipient');
        if (!order) {
            return res.status(404).json({
                message: 'Order not found'
            });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для обновления статуса заказа
export const updateOrderStatus = async (req, res) => {
    const {
        orderId
    } = req.params;
    const {
        status
    } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                message: 'Order not found'
            });
        }

        // Если статус меняется на "cancelled", возвращаем товары на склад
        if (status === 'cancelled' && order.status !== 'cancelled') {
            await returnProductsToStock(order.products);
        }
        // Если статус был "cancelled" и меняется на другой, снова уменьшаем количество товаров
        else if (order.status === 'cancelled' && status !== 'cancelled') {
            await deductProductsFromStock(order.products);
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId, {
                $set: {
                    status
                },
                $push: {
                    statusHistory: {
                        status,
                        time: Date.now()
                    }
                },
            }, {
                new: true
            }
        );

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для обновления комментариев администратора
export const updateAdminComments = async (req, res) => {
    const {
        orderId
    } = req.params;
    const {
        commentsAdmin
    } = req.body;

    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId, {
                $set: {
                    commentsAdmin
                },
            }, {
                new: true
            }
        );
        if (updatedOrder) {
            res.json(updatedOrder);
        } else {
            res.status(404).json({
                message: 'Order not found'
            });
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для обновления количества товара в заказе
export const updateProductQuantity = async (req, res) => {
    const {
        orderId
    } = req.params;
    const {
        productIndex,
        quantity
    } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                message: 'Order not found'
            });
        }

        const productItem = order.products[productIndex];
        if (!productItem) {
            return res.status(404).json({
                message: 'Product not found in order'
            });
        }

        const product = await Product.findById(productItem.product);
        if (!product) {
            return res.status(404).json({
                message: 'Original product not found'
            });
        }

        const quantityDifference = quantity - productItem.quantity;

        if (quantityDifference > 0 && product.quantity < quantityDifference) {
            return res.status(400).json({
                message: 'Insufficient product quantity',
                available: product.quantity
            });
        }

        // Обновляем количество в заказе
        productItem.quantity = quantity;

        // Обновляем количество на складе и счетчик продаж
        if (quantityDifference > 0) {
            product.quantity -= quantityDifference;
            product.soldCount += quantityDifference;
        } else if (quantityDifference < 0) {
            product.quantity += Math.abs(quantityDifference);
            product.soldCount -= Math.abs(quantityDifference);
        }
        await product.save();

        // Пересчитываем общую сумму заказа
        order.totalAmount = order.products.reduce(
            (total, item) => total + (item.price || 0) * (item.quantity || 0),
            0
        );

        await order.save();
        res.json(order);
    } catch (error) {
        console.error('Error updating product quantity:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для удаления товара из заказа
export const removeProductFromOrder = async (req, res) => {
    const {
        orderId
    } = req.params;
    const {
        productIndex
    } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                message: 'Order not found'
            });
        }

        if (productIndex < 0 || productIndex >= order.products.length) {
            return res.status(404).json({
                message: 'Product not found in order'
            });
        }

        const productToRemove = order.products[productIndex];
        order.products.splice(productIndex, 1);

        // Возвращаем товар на склад и корректируем счетчик продаж
        await Product.findByIdAndUpdate(
            productToRemove.product, {
                $inc: {
                    quantity: productToRemove.quantity,
                    soldCount: -productToRemove.quantity
                }
            }, {
                new: true
            }
        );

        // Пересчитываем общую сумму
        order.totalAmount = order.products.reduce(
            (total, item) => total + (item.price || 0) * (item.quantity || 0),
            0
        );

        if (order.products.length === 0) {
            await Order.findByIdAndDelete(orderId);
            return res.json({
                message: 'Order deleted as it has no products left'
            });
        }

        await order.save();
        res.json(order);
    } catch (error) {
        console.error('Error removing product from order:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для удаления заказа
export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                message: 'Order not found'
            });
        }

        await returnProductsToStock(order.products);
        await Order.findByIdAndDelete(req.params.id);
        res.json({
            message: 'Order deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({
            message: 'Server error'
        });
    }
};

// Контроллер для получения последнего заказа пользователя
export const getLastOrder = async (req, res) => {
    const userId = req.params.userId;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const lastOrder = await Order.findOne({
            user: userId
        }).sort({
            date: -1
        });
        if (!lastOrder) {
            return res.json({
                lastOrder: null
            });
        }

        res.json({
            profile: {
                name: user.name,
                email: user.email,
                address: user.address || lastOrder.address,
                phoneNumber: user.phoneNumber || lastOrder.phoneNumber
            },
            lastOrder
        });
    } catch (error) {
        console.error('Error fetching last order or user profile:', error);
        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
};

// Контроллер для получения истории покупок администратора
export const getAdminPurchaseHistory = async (req, res) => {
    try {
        const adminId = req.user.userId;
        const {
            page = 1, perPage = 5
        } = req.query;
        const pageNum = parseInt(page);
        const perPageNum = parseInt(perPage);

        // Находим заказы, где администратор является текущим пользователем
        const orders = await Order.find({
            user: adminId
        })
            .populate('user', 'name email')
            .populate('products.product', 'name price images flowerNames occasion')
            .sort({
                date: 'desc'
            })
            .skip((pageNum - 1) * perPageNum)
            .limit(perPageNum);

        const totalOrders = await Order.countDocuments({
            user: adminId
        });
        const totalPages = Math.ceil(totalOrders / perPageNum);

        res.json({
            orders,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalOrders,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для получения статистики заказов по поводам
export const getOrdersByOccasion = async (req, res) => {
    try {
        const { occasion } = req.params;
        const { page = 1, perPage = 20 } = req.query;

        const orders = await Order.find({
            'products.occasion': occasion
        })
            .populate('user', 'name email')
            .populate('products.product', 'name price images flowerNames')
            .sort({ date: -1 })
            .skip((page - 1) * perPage)
            .limit(parseInt(perPage));

        const totalOrders = await Order.countDocuments({
            'products.occasion': occasion
        });

        res.json({
            orders,
            pagination: {
                currentPage: parseInt(page),
                perPage: parseInt(perPage),
                totalOrders,
                totalPages: Math.ceil(totalOrders / perPage)
            }
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};