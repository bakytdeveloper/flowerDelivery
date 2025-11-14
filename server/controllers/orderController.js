import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Addon from '../models/Addon.js';
import Cart from '../models/Cart.js';

import {
    transporter
} from '../smtp/otpService.js';

// Функция для отправки email о новом заказе
async function sendOrderEmail(order, userType) {
    try {
        const {
            _id,
            firstName,
            address,
            phoneNumber,
            totalAmount,
            paymentMethod,
            comments,
            flowerItems = [],
            addonItems = []
        } = order;

        const userTypeText = {
            'customer': 'Зарегистрированный клиент',
            'guest': 'Гость'
        }[userType] || 'Пользователь';

        // Безопасное форматирование списка цветов
        const flowerList = flowerItems
            .filter(item => item && typeof item === 'object') // Фильтруем null и не объекты
            .map(item => {
                // Безопасное извлечение свойств
                const itemName = item?.name || 'Неизвестный товар';
                const quantity = item?.quantity || 0;
                const price = item?.price || 0;
                const itemTotal = item?.itemTotal || 0;
                const wrapperPrice = item?.wrapper?.price || 0;

                // Безопасный расчет стоимости без упаковки
                const basePrice = Math.max(0, itemTotal - wrapperPrice);

                let itemInfo = `• ${itemName} - ${quantity} шт. × ${price} сом = ${basePrice} сом`;

                if (item.flowerType) {
                    itemInfo += `\n  Тип: ${item.flowerType === 'single' ? 'Штучный цветок' : 'Букет'}`;
                }
                if (item.flowerNames && Array.isArray(item.flowerNames) && item.flowerNames.length > 0) {
                    itemInfo += `\n  Цветы: ${item.flowerNames.join(', ')}`;
                }
                if (item.stemLength) {
                    itemInfo += `\n  Длина стебля: ${item.stemLength} см`;
                }
                if (item.occasion) {
                    itemInfo += `\n  Повод: ${item.occasion}`;
                }
                if (item.recipient) {
                    itemInfo += `\n  Для: ${item.recipient}`;
                }
                if (item.wrapper && item.wrapper.name) {
                    itemInfo += `\n  Упаковка: ${item.wrapper.name} (+${item.wrapper.price} сом)`;
                }

                return itemInfo;
            }).join('\n\n');

        // Безопасное форматирование списка дополнительных товаров
        const addonList = addonItems
            .filter(item => item && typeof item === 'object') // Фильтруем null и не объекты
            .map(item => {
                const itemName = item?.name || 'Неизвестный товар';
                const quantity = item?.quantity || 0;
                const price = item?.price || 0;
                const itemTotal = item?.itemTotal || 0;
                const itemType = item?.type || 'доп. товар';

                return `• ${itemName} (${itemType}) - ${quantity} шт. × ${price} сом = ${itemTotal} сом`;
            }).join('\n');

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.SMTP_USER,
            subject: `🎉 НОВЫЙ ЗАКАЗ ЦВЕТОВ #${_id}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .section { margin-bottom: 25px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                        .total { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; font-size: 1.2em; font-weight: bold; }
                        .item-list { background: #f8f9fa; padding: 15px; border-radius: 5px; }
                        .badge { display: inline-block; padding: 5px 10px; background: #28a745; color: white; border-radius: 15px; font-size: 0.9em; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 НОВЫЙ ЗАКАЗ ЦВЕТОВ</h1>
                            <p>Заказ #${_id}</p>
                        </div>
                        
                        <div class="content">
                            <div class="section">
                                <h2>👤 Информация о клиенте</h2>
                                <p><strong>Имя:</strong> ${firstName}</p>
                                <p><strong>Телефон:</strong> ${phoneNumber}</p>
                                <p><strong>Адрес доставки:</strong> ${address}</p>
                                <p><strong>Тип клиента:</strong> <span class="badge">${userTypeText}</span></p>
                            </div>

                            <div class="section">
                                <h2>💐 Состав заказа</h2>
                                <div class="item-list">
                                    <h3>Цветы:</h3>
                                    <pre style="white-space: pre-wrap; font-family: Arial;">${flowerList || 'Нет цветов в заказе'}</pre>
                                    
                                    ${addonItems.filter(item => item && typeof item === 'object').length > 0 ? `
                                    <h3>Дополнительные товары:</h3>
                                    <pre style="white-space: pre-wrap; font-family: Arial;">${addonList}</pre>
                                    ` : ''}
                                </div>
                            </div>

                            <div class="section">
                                <h2>💰 Детали оплаты</h2>
                                <p><strong>Способ оплаты:</strong> ${paymentMethod === 'cash' ? 'Наличные при получении' : 'Онлайн оплата'}</p>
                                <div class="total">
                                    <strong>Общая сумма:</strong> ${totalAmount} сом
                                </div>
                            </div>

                            ${comments ? `
                            <div class="section">
                                <h2>💬 Комментарий клиента</h2>
                                <p><em>${comments}</em></p>
                            </div>
                            ` : ''}

                            <div class="section">
                                <p><strong>🕒 Время заказа:</strong> ${new Date().toLocaleString('ru-RU')}</p>
                                <p style="color: #666; font-size: 0.9em; margin-top: 20px;">
                                    Это автоматическое уведомление о новом заказе. Пожалуйста, обработайте заказ в течение 30 минут.
                                </p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Email уведомление о заказе отправлено администратору');
        return true;
    } catch (error) {
        console.error('❌ Ошибка отправки email администратору:', error);
        return false;
    }
}

// Функция для отправки уведомлений о низком количестве товаров
async function notifyAboutLowQuantity(items, itemType = 'flower') {
    try {
        const lowStockItems = [];

        for (const item of items) {
            let product;
            if (itemType === 'flower') {
                product = await Product.findById(item.product);
            } else if (itemType === 'addon') {
                product = await Addon.findById(item.addonId);
            }

            if (product && product.quantity <= 3 && product.quantity >= 1) {
                lowStockItems.push({
                    name: product.name,
                    currentQuantity: product.quantity,
                    type: itemType === 'flower' ? 'Цветы' : 'Доп. товар'
                });
            }
        }

        if (lowStockItems.length > 0) {
            const lowStockList = lowStockItems.map(item =>
                `• ${item.name} (${item.type}) - осталось ${item.currentQuantity} шт.`
            ).join('\n');

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.SMTP_USER,
                subject: `⚠️ НИЗКИЙ УРОВЕНЬ ЗАПАСОВ - ${lowStockItems.length} товаров`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%); color: white; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
                            .content { background: #fffaf0; padding: 25px; border-radius: 0 0 10px 10px; }
                            .warning-item { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 10px 0; border-radius: 5px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>⚠️ ВНИМАНИЕ: НИЗКИЙ УРОВЕНЬ ЗАПАСОВ</h1>
                                <p>Требуется пополнение склада</p>
                            </div>
                            
                            <div class="content">
                                <h2>Следующие товары заканчиваются:</h2>
                                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                                    <pre style="white-space: pre-wrap; font-family: Arial; font-size: 14px;">${lowStockList}</pre>
                                </div>
                                
                                <div style="margin-top: 20px; padding: 15px; background: #e7f3ff; border-radius: 5px;">
                                    <p><strong>Рекомендуемые действия:</strong></p>
                                    <ul>
                                        <li>Проверить остатки на складе</li>
                                        <li>Заказать новые поставки</li>
                                        <li>Обновить количество в системе</li>
                                    </ul>
                                </div>
                                
                                <p style="color: #666; font-size: 0.9em; margin-top: 20px;">
                                    <strong>Время уведомления:</strong> ${new Date().toLocaleString('ru-RU')}
                                </p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            await transporter.sendMail(mailOptions);
            console.log(`✅ Уведомление о низких запасах отправлено (${lowStockItems.length} товаров)`);
        }
    } catch (error) {
        console.error('❌ Ошибка отправки уведомления о низких запасах:', error);
    }
}



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


// Создание заказа
// Создание заказа (основная функция)
export const createOrder = async (req, res) => {
    try {
        const { user } = req;
        const {
            firstName,
            address,
            phoneNumber,
            paymentMethod,
            comments
        } = req.body;

        console.log('🛒 Создание заказа для пользователя:', {
            userId: user.userId,
            sessionId: user.sessionId,
            role: user.role
        });

        // Получаем корзину
        let cart;
        if (user.userId && user.userId !== 'admin') {
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
        const userType = (user.userId && user.userId !== 'admin') ? 'customer' : 'guest';

        // Создаем заказ
        const order = new Order({
            user: (user.userId && user.userId !== 'admin') ? user.userId : null,
            userType,
            flowerItems: cart.flowerItems.map(item => ({
                product: item.product,
                quantity: item.quantity,
                name: item.name,
                flowerType: item.flowerType,
                price: item.price,
                flowerNames: item.flowerNames,
                flowerColors: item.flowerColors,
                stemLength: item.stemLength,
                occasion: item.occasion,
                recipient: item.recipient,
                wrapper: item.wrapper && item.wrapper.wrapperId ? item.wrapper : undefined,
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
        console.log('✅ Заказ создан:', { orderId: order._id, totalAmount: order.totalAmount });

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

        // Отправляем уведомления
        await sendOrderEmail(order, userType);
        await notifyAboutLowQuantity(cart.flowerItems, 'flower');
        await notifyAboutLowQuantity(cart.addonItems, 'addon');

        // Очищаем корзину
        cart.flowerItems = [];
        cart.addonItems = [];
        await cart.save();
        console.log('🧹 Корзина очищена');

        res.status(201).json({
            message: 'Заказ успешно создан',
            order: await formatOrderResponse(order)
        });
    } catch (error) {
        console.error('❌ Ошибка при создании заказа:', error);
        res.status(500).json({ message: 'Ошибка при создании заказа' });
    }
};


// Получение заказов пользователя
// Получение заказов пользователя
export const getUserOrders = async (req, res) => {
    try {
        const { user } = req;

        let orders;
        if (user.userId && user.userId !== 'admin') {
            orders = await Order.find({ user: user.userId })
                .sort({ date: -1 })
                .populate('flowerItems.product', 'name images price flowerNames stemLength occasion recipient type description')
                .populate('addonItems.addonId', 'name image price type description');
        } else {
            // Для гостей - по sessionId (если нужно)
            orders = await Order.find({
                'guestInfo.phone': user.sessionId
            }).sort({ date: -1 })
                .populate('flowerItems.product', 'name images price flowerNames stemLength occasion recipient type description')
                .populate('addonItems.addonId', 'name image price type description');
        }

        const formattedOrders = orders.map(order => ({
            _id: order._id,
            userType: order.userType,
            flowerItems: order.flowerItems.map(item => ({
                ...item.toObject(),
                product: item.product ? {
                    _id: item.product._id,
                    name: item.product.name,
                    images: item.product.images,
                    price: item.product.price,
                    flowerNames: item.product.flowerNames,
                    stemLength: item.product.stemLength,
                    occasion: item.product.occasion,
                    recipient: item.product.recipient,
                    type: item.product.type,
                    description: item.product.description
                } : null
            })),
            addonItems: order.addonItems.map(item => ({
                ...item.toObject(),
                addonId: item.addonId ? {
                    _id: item.addonId._id,
                    name: item.addonId.name,
                    image: item.addonId.image,
                    price: item.addonId.price,
                    type: item.addonId.type,
                    description: item.addonId.description
                } : null
            })),
            totalAmount: order.totalAmount,
            status: order.status,
            date: order.date,
            firstName: order.firstName,
            address: order.address,
            phoneNumber: order.phoneNumber,
            paymentMethod: order.paymentMethod,
            comments: order.comments,
            statusHistory: order.statusHistory
        }));

        res.status(200).json({
            orders: formattedOrders
        });
    } catch (error) {
        console.error('Error getting user orders:', error);
        res.status(500).json({ message: 'Ошибка при получении заказов' });
    }
};


// Вспомогательная функция для форматирования заказа
// Вспомогательная функция для форматирования ответа заказа
// Вспомогательная функция для форматирования ответа заказа (упрощенная версия)
// Вспомогательная функция для форматирования ответа заказа
const formatOrderResponse = async (order) => {
    try {
        // Если order уже populate, используем как есть
        return {
            _id: order._id,
            userType: order.userType,
            flowerItems: order.flowerItems.map(item => ({
                ...item.toObject ? item.toObject() : item,
                product: item.product ? {
                    _id: item.product._id,
                    name: item.product.name,
                    images: item.product.images,
                    price: item.product.price,
                    flowerNames: item.product.flowerNames,
                    stemLength: item.product.stemLength,
                    occasion: item.product.occasion,
                    recipient: item.product.recipient,
                    type: item.product.type,
                    description: item.product.description
                } : null
            })),
            addonItems: order.addonItems.map(item => ({
                ...item.toObject ? item.toObject() : item,
                addonId: item.addonId ? {
                    _id: item.addonId._id,
                    name: item.addonId.name,
                    image: item.addonId.image,
                    price: item.addonId.price,
                    type: item.addonId.type,
                    description: item.addonId.description
                } : null
            })),
            totalAmount: order.totalAmount,
            status: order.status,
            date: order.date,
            firstName: order.firstName,
            address: order.address,
            phoneNumber: order.phoneNumber,
            paymentMethod: order.paymentMethod,
            comments: order.comments,
            statusHistory: order.statusHistory,
            user: order.user
        };
    } catch (error) {
        console.error('Error in formatOrderResponse:', error);
        // В случае ошибки возвращаем базовую структуру
        return {
            _id: order._id,
            userType: order.userType,
            flowerItems: order.flowerItems || [],
            addonItems: order.addonItems || [],
            totalAmount: order.totalAmount,
            status: order.status,
            date: order.date,
            firstName: order.firstName,
            address: order.address,
            phoneNumber: order.phoneNumber,
            paymentMethod: order.paymentMethod,
            comments: order.comments,
            statusHistory: order.statusHistory,
            user: order.user
        };
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

// Контроллер для удаления заказа
// Удаление заказа с возвратом товаров
export const deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Возвращаем все товары на склад
        await returnOrderItemsToStock(order);

        // Удаляем заказ
        await Order.findByIdAndDelete(orderId);

        res.json({ message: 'Order deleted successfully, all items returned to stock' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ message: 'Server error' });
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




// Добавьте эти функции в orderController.js

// Получение всех заказов с пагинацией и фильтрацией
// Получение всех заказов с пагинацией и фильтрацией
export const getAllOrders = async (req, res) => {
    try {
        const {
            page = 1,
            perPage = 20,
            status,
            startDate,
            endDate,
            search
        } = req.query;

        let query = {};

        // Фильтрация по статусу
        if (status && status !== 'all') {
            query.status = status;
        }

        // Фильтрация по дате
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        // Поиск по имени или телефону
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { phoneNumber: { $regex: search, $options: 'i' } },
                { 'flowerItems.name': { $regex: search, $options: 'i' } }
            ];
        }

        const orders = await Order.find(query)
            .populate('user', 'name email')
            .populate('flowerItems.product', 'name images price flowerNames stemLength occasion recipient type description')
            .populate('addonItems.addonId', 'name image price type description')
            .sort({ date: -1 })
            .skip((page - 1) * perPage)
            .limit(parseInt(perPage));

        const totalOrders = await Order.countDocuments(query);

        // Используем упрощенную версию formatOrderResponse
        const formattedOrders = orders.map(order => ({
            _id: order._id,
            userType: order.userType,
            flowerItems: order.flowerItems.map(item => ({
                ...item.toObject(),
                product: item.product ? {
                    _id: item.product._id,
                    name: item.product.name,
                    images: item.product.images,
                    price: item.product.price,
                    flowerNames: item.product.flowerNames,
                    stemLength: item.product.stemLength,
                    occasion: item.product.occasion,
                    recipient: item.product.recipient,
                    type: item.product.type,
                    description: item.product.description
                } : null
            })),
            addonItems: order.addonItems.map(item => ({
                ...item.toObject(),
                addonId: item.addonId ? {
                    _id: item.addonId._id,
                    name: item.addonId.name,
                    image: item.addonId.image,
                    price: item.addonId.price,
                    type: item.addonId.type,
                    description: item.addonId.description
                } : null
            })),
            totalAmount: order.totalAmount,
            status: order.status,
            date: order.date,
            firstName: order.firstName,
            address: order.address,
            phoneNumber: order.phoneNumber,
            paymentMethod: order.paymentMethod,
            comments: order.comments,
            statusHistory: order.statusHistory,
            user: order.user
        }));

        res.json({
            orders: formattedOrders,
            pagination: {
                currentPage: parseInt(page),
                perPage: parseInt(perPage),
                totalOrders,
                totalPages: Math.ceil(totalOrders / perPage)
            }
        });
    } catch (error) {
        console.error('Error getting all orders:', error);
        res.status(500).json({
            message: 'Ошибка при получении заказов'
        });
    }
};

// Получение статистики заказов
export const getOrdersStats = async (req, res) => {
    try {
        const now = new Date();

        // Правильное вычисление дат
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // console.log('📅 Даты для статистики:', {
        //     now: now.toISOString(),
        //     startOfToday: startOfToday.toISOString(),
        //     startOfWeek: startOfWeek.toISOString(),
        //     startOfMonth: startOfMonth.toISOString()
        // });

        // Получаем все заказы для анализа
        const allOrders = await Order.find({}).select('date status totalAmount').lean();

        // ДЕБАГ: Выводим заказы за сегодня
        const todayOrdersDebug = allOrders.filter(order => {
            const orderDate = new Date(order.date);
            return orderDate >= startOfToday;
        });

        // console.log('🔍 Заказы за сегодня:', todayOrdersDebug.map(order => ({
        //     date: order.date,
        //     status: order.status,
        //     amount: order.totalAmount
        // })));

        // Основные запросы к базе данных
        const [
            totalOrders,
            pendingOrders,
            todayOrders,
            weekOrders,
            monthOrders,
            revenueResult
        ] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ status: 'pending' }),
            // Заказы за сегодня (любого статуса)
            Order.countDocuments({
                date: { $gte: startOfToday }
            }),
            // Заказы за неделю (любого статуса)
            Order.countDocuments({
                date: { $gte: startOfWeek }
            }),
            // Заказы за месяц (любого статуса)
            Order.countDocuments({
                date: { $gte: startOfMonth }
            }),
            // Общий доход ТОЛЬКО из завершенных заказов
            Order.aggregate([
                { $match: { status: 'completed' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ])
        ]);

        // Альтернативный расчет дохода (включая другие статусы если нужно)
        const allRevenueResult = await Order.aggregate([
            { $match: { status: { $in: ['completed', 'inProgress'] } } }, // Можно добавить другие статусы
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const totalRevenue = revenueResult[0]?.total || 0;
        const totalRevenueIncludingProgress = allRevenueResult[0]?.total || 0;

        const stats = {
            totalOrders,
            pendingOrders,
            todayOrders,
            weekOrders,
            monthOrders,
            totalRevenue,
            // Дополнительные поля если нужно
            totalRevenueIncludingProgress,
            completedOrders: await Order.countDocuments({ status: 'completed' }),
            inProgressOrders: await Order.countDocuments({ status: 'inProgress' })
        };

        // console.log('🎯 Финальная статистика:', stats);

        res.json({
            stats,
            debug: {
                todayDate: now.toISOString(),
                todayStart: startOfToday.toISOString(),
                todayOrdersCount: todayOrders,
                revenueCalculation: `Доход только из completed заказов: ${totalRevenue}`
            }
        });

    } catch (error) {
        console.error('❌ Ошибка при получении статистики:', error);
        res.status(500).json({
            message: 'Ошибка при получении статистики'
        });
    }
};

// Обновление заказа (администратором)
// Обновление заказа с полной информацией
export const updateOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const {
            firstName,
            address,
            phoneNumber,
            paymentMethod,
            comments,
            status
        } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                message: 'Заказ не найден'
            });
        }

        const oldStatus = order.status;

        // Если статус меняется на "cancelled", возвращаем товары на склад
        if (status === 'cancelled' && oldStatus !== 'cancelled') {
            await returnOrderItemsToStock(order);
        }
        // Если статус был "cancelled" и меняется на другой, снова списываем товары
        else if (oldStatus === 'cancelled' && status !== 'cancelled') {
            await deductOrderItemsFromStock(order);
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
                firstName,
                address,
                phoneNumber,
                paymentMethod,
                comments,
                status,
                $push: status !== order.status ? {
                    statusHistory: {
                        status,
                        time: new Date()
                    }
                } : undefined
            },
            { new: true }
        )
            .populate('flowerItems.product', 'name images price flowerNames stemLength occasion recipient type')
            .populate('addonItems.addonId', 'name image price type description');

        res.json({
            message: 'Заказ успешно обновлен',
            order: await formatOrderResponse(updatedOrder)
        });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({
            message: 'Ошибка при обновлении заказа'
        });
    }
};


// Вспомогательные функции для управления складом
// Вспомогательная функция для возврата товаров на склад
// Вспомогательная функция для возврата товаров на склад
async function returnOrderItemsToStock(order) {
    try {
        // console.log('🔄 Возврат товаров на склад для заказа:', order._id);

        // Возвращаем цветы на склад
        for (const item of order.flowerItems) {
            if (item.product) {
                await Product.findByIdAndUpdate(
                    item.product,
                    {
                        $inc: {
                            quantity: item.quantity,
                            soldCount: -item.quantity
                        }
                    }
                );
                console.log(`✅ Возвращены цветы: ${item.name}, количество: ${item.quantity}`);
            }
        }

        // Возвращаем доп. товары на склад
        for (const item of order.addonItems) {
            if (item.addonId) {
                await Addon.findByIdAndUpdate(
                    item.addonId,
                    { $inc: { quantity: item.quantity } }
                );
                console.log(`✅ Возвращены доп. товары: ${item.name}, количество: ${item.quantity}`);
            }
        }

        console.log('✅ Все товары возвращены на склад');
    } catch (error) {
        console.error('❌ Ошибка при возврате товаров на склад:', error);
        throw error;
    }
}

// Вспомогательная функция для списания товаров со склада
async function deductOrderItemsFromStock(order) {
    try {
        console.log('🔄 Списываем товары со склада для заказа:', order._id);

        // Списываем цветы со склада
        for (const item of order.flowerItems) {
            const product = await Product.findById(item.product);
            if (!product) {
                throw new Error(`Товар "${item.name}" не найден`);
            }

            if (product.quantity < item.quantity) {
                throw new Error(`Недостаточно товара "${product.name}" на складе. Доступно: ${product.quantity}, требуется: ${item.quantity}`);
            }

            await Product.findByIdAndUpdate(
                item.product,
                {
                    $inc: {
                        quantity: -item.quantity,
                        soldCount: item.quantity
                    }
                }
            );
            console.log(`✅ Списан товар: ${item.name}, количество: ${item.quantity}`);
        }

        // Списываем доп. товары со склада
        for (const item of order.addonItems) {
            const addon = await Addon.findById(item.addonId);
            if (!addon) {
                throw new Error(`Доп. товар "${item.name}" не найден`);
            }

            if (addon.quantity < item.quantity) {
                throw new Error(`Недостаточно доп. товара "${addon.name}" на складе. Доступно: ${addon.quantity}, требуется: ${item.quantity}`);
            }

            await Addon.findByIdAndUpdate(
                item.addonId,
                { $inc: { quantity: -item.quantity } }
            );
            console.log(`✅ Списан доп. товар: ${item.name}, количество: ${item.quantity}`);
        }

        console.log('✅ Все товары списаны со склада');
    } catch (error) {
        console.error('❌ Ошибка при списании товаров со склада:', error);
        throw error;
    }
}


// Обновление количества товара с учетом всех типов
export const updateProductQuantity = async (req, res) => {
    const { orderId } = req.params;
    const { productIndex, quantity, itemType } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        let itemsArray;
        let productField;
        let productModel;

        if (itemType === 'flower') {
            itemsArray = order.flowerItems;
            productField = 'product';
            productModel = Product;
        } else if (itemType === 'addon') {
            itemsArray = order.addonItems;
            productField = 'addonId';
            productModel = Addon;
        } else {
            return res.status(400).json({ message: 'Invalid item type' });
        }

        const item = itemsArray[productIndex];
        if (!item) {
            return res.status(404).json({ message: 'Item not found in order' });
        }

        const product = await productModel.findById(item[productField]);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const quantityDifference = quantity - item.quantity;

        // Проверяем доступность товара при увеличении количества
        if (quantityDifference > 0 && product.quantity < quantityDifference) {
            return res.status(400).json({
                message: `Недостаточно товара "${product.name}" на складе`,
                available: product.quantity
            });
        }

        // Сохраняем старое количество для возврата на склад
        const oldQuantity = item.quantity;

        // Обновляем количество в заказе
        item.quantity = quantity;

        // Пересчитываем itemTotal
        if (itemType === 'flower') {
            item.itemTotal = item.price * quantity;
            // Добавляем стоимость упаковки если есть
            if (item.wrapper && item.wrapper.price) {
                item.itemTotal += item.wrapper.price;
            }
        } else {
            item.itemTotal = item.price * quantity;
        }

        // Обновляем количество на складе
        if (quantityDifference !== 0) {
            await productModel.findByIdAndUpdate(
                item[productField],
                {
                    $inc: {
                        quantity: -quantityDifference,
                        ...(itemType === 'flower' ? { soldCount: quantityDifference } : {})
                    }
                }
            );
        }

        // Пересчитываем общую сумму заказа
        const flowersTotal = order.flowerItems.reduce((sum, item) => sum + item.itemTotal, 0);
        const addonsTotal = order.addonItems.reduce((sum, item) => sum + item.itemTotal, 0);
        order.totalAmount = flowersTotal + addonsTotal;

        await order.save();

        res.json({
            message: 'Quantity updated successfully',
            order: await formatOrderResponse(order)
        });
    } catch (error) {
        console.error('Error updating product quantity:', error);
        res.status(500).json({ message: error.message });
    }
};


// Удаление товара из заказа
// Удаление товара из заказа
export const removeProductFromOrder = async (req, res) => {
    const { orderId } = req.params;
    const { productIndex, itemType } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        let itemsArray;
        let productField;
        let productModel;

        if (itemType === 'flower') {
            itemsArray = order.flowerItems;
            productField = 'product';
            productModel = Product;
        } else if (itemType === 'addon') {
            itemsArray = order.addonItems;
            productField = 'addonId';
            productModel = Addon;
        } else {
            return res.status(400).json({ message: 'Invalid item type' });
        }

        if (productIndex < 0 || productIndex >= itemsArray.length) {
            return res.status(404).json({ message: 'Product not found in order' });
        }

        const itemToRemove = itemsArray[productIndex];

        // Возвращаем товар на склад
        await productModel.findByIdAndUpdate(
            itemToRemove[productField],
            {
                $inc: {
                    quantity: itemToRemove.quantity,
                    ...(itemType === 'flower' ? { soldCount: -itemToRemove.quantity } : {})
                }
            }
        );

        // Удаляем товар из заказа
        itemsArray.splice(productIndex, 1);

        // Пересчитываем общую сумму
        const flowersTotal = order.flowerItems.reduce((sum, item) => sum + item.itemTotal, 0);
        const addonsTotal = order.addonItems.reduce((sum, item) => sum + item.itemTotal, 0);
        order.totalAmount = flowersTotal + addonsTotal;

        // Если заказ пустой, удаляем его
        if (order.flowerItems.length === 0 && order.addonItems.length === 0) {
            await Order.findByIdAndDelete(orderId);
            return res.json({ message: 'Order deleted as it has no items left' });
        }

        await order.save();

        res.json({
            message: 'Product removed successfully',
            order: await formatOrderResponse(order)
        });
    } catch (error) {
        console.error('Error removing product from order:', error);
        res.status(500).json({ message: error.message });
    }
};

// Обновление статуса заказа
export const updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
        console.log('🔄 Обновление статуса заказа:', { orderId, status });

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const oldStatus = order.status;

        // Если статус меняется на "cancelled", возвращаем товары на склад
        if (status === 'cancelled' && oldStatus !== 'cancelled') {
            console.log('🔄 Возврат товаров на склад (отмена заказа)');
            await returnOrderItemsToStock(order);
        }
        // Если статус был "cancelled" и меняется на другой, снова списываем товары
        else if (oldStatus === 'cancelled' && status !== 'cancelled') {
            console.log('🔄 Списываем товары со склада (возобновление заказа)');
            await deductOrderItemsFromStock(order);
        }

        // Обновляем статус
        order.status = status;
        order.statusHistory.push({
            status: status,
            time: new Date()
        });

        // Сохраняем заказ
        await order.save();

        console.log('✅ Статус заказа обновлен:', order._id);

        res.json({
            message: 'Статус заказа обновлен',
            order: await formatOrderResponse(order)
        });
    } catch (error) {
        console.error('❌ Ошибка при обновлении статуса заказа:', error);
        res.status(500).json({ message: error.message || 'Ошибка при обновлении статуса заказа' });
    }
};