import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import {
    transporter
} from '../smtp/otpService.js';
import {
    body,
    validationResult
} from 'express-validator';

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

        if (item.size && item.size.trim() !== '') {
            itemInfo += ` - Размер: ${item.size}`;
        }

        if (item.color && item.color.trim() !== '') {
            itemInfo += ` - Цвет: ${item.color}`;
        }

        itemInfo += ` - ${item.price * item.quantity} сом`;

        return itemInfo;
    }).join('\n');

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.SMTP_USER,
        subject: `Новый заказ #${_id || '0000'} это ${userTypeText}`,
        html: `
            <h2>Поступил новый заказ!</h2>
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
        console.log('Email уведомление о заказе отправлено администратору');
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
                    subject: `Оповещение о низком уровне запаса товара: ${existingProduct.name}`,
                    text: `Дорогой ${admin.name},\n\nНастоящим сообщением, мы хотели сказать, что товара "${existingProduct.name}" осталось мало на складе, осталось всего ${existingProduct.quantity} шт.\n\nПожалуйста, пополните запасы как можно скорее.\n\nС уважением,\nАдминистрация Магазина`,
                };
                await transporter.sendMail(mailOptions);
            }
        }
    }
}

// Контроллер для создания заказа
export const createOrder = [
    // Валидация
    body('firstName').notEmpty().withMessage('Имя обязательно для заполнения'),
    body('phoneNumber').notEmpty().withMessage('Номер телефона обязателен для заполнения'),
    body('address').notEmpty().withMessage('Адрес обязателен для заполнения'),
    body('products').isArray({
        min: 1
    }).withMessage('Заказ должен содержать хотя бы один товар'),
    body('totalAmount').isNumeric().withMessage('Общая сумма должна быть числом'),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Ошибка валидации',
                errors: errors.array()
            });
        }

        const {
            user,
            guestInfo,
            products,
            firstName,
            address,
            phoneNumber,
            paymentMethod,
            comments
        } = req.body;
        let userId = null;
        let customerName = firstName || 'Гость';
        let customerEmail = '';
        let userType = 'guest';

        // Определяем тип пользователя
        if (req.user) {
            if (req.user.role === 'admin') {
                userId = req.user.userId;
                userType = 'admin';
                const admin = await User.findById(userId);
                if (admin) {
                    customerName = admin.name;
                    customerEmail = admin.email;
                }
            } else if (req.user.role === 'customer') {
                userId = req.user.userId;
                userType = 'customer';
                const customer = await User.findById(userId);
                if (customer) {
                    customerEmail = customer.email;
                }
            }
        }

        // Проверяем доступность товаров
        for (const item of products) {
            const product = await Product.findById(item.product);
            if (!product || product.quantity < item.quantity) {
                return res.status(400).json({
                    message: `Товар "${product?.name}" недоступен в нужном количестве`,
                    product: product?.name,
                    available: product?.quantity
                });
            }
        }

        // Обработка пользователя (для гостей или новых пользователей)
        try {
            if (user && user.email && !userId) {
                let existingUser = await User.findOne({
                    email: user.email
                });
                if (!existingUser) {
                    const newUser = new User({
                        name: user.firstName,
                        email: user.email,
                        address: user.address,
                        role: 'customer'
                    });
                    const savedUser = await newUser.save();
                    userId = savedUser._id;
                    customerName = user.firstName;
                    customerEmail = user.email;
                    userType = 'customer';
                } else {
                    userId = existingUser._id;
                    customerName = existingUser.name;
                    customerEmail = existingUser.email;
                    userType = 'customer';
                }
            } else if (guestInfo && guestInfo.name && !userId) {
                customerName = guestInfo.name;
                customerEmail = guestInfo.email || '';
                userType = 'guest';
            }
        } catch (error) {
            console.error('Error handling user:', error);
            return res.status(500).json({
                message: 'Internal Server Error'
            });
        }

        // Проверка наличия товаров
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                message: 'No products in order'
            });
        }

        // Проверка и обработка товаров
        let insufficientProducts = [];
        let orderProducts = [];
        let calculatedTotalAmount = 0;

        try {
            const productUpdates = products.map(async ({
                product,
                quantity,
                size,
                color
            }) => {
                const existingProduct = await Product.findById(product).populate('admin');
                if (!existingProduct) {
                    throw new Error(`Product not found: ${product}`);
                }

                if (existingProduct.quantity < quantity) {
                    insufficientProducts.push({
                        name: existingProduct.name,
                        available: existingProduct.quantity
                    });
                } else {
                    const productItem = {
                        product: existingProduct._id,
                        name: existingProduct.name,
                        brand: existingProduct.brand,
                        type: existingProduct.type,
                        description: existingProduct.description,
                        price: existingProduct.price,
                        quantity,
                        size,
                        color,
                        admin: {
                            id: existingProduct.admin._id,
                            name: existingProduct.admin.name,
                            email: existingProduct.admin.email,
                            phoneNumber: existingProduct.admin.phoneNumber,
                        }
                    };

                    orderProducts.push(productItem);
                    calculatedTotalAmount += existingProduct.price * quantity;

                    await Product.findByIdAndUpdate(
                        product, {
                            $inc: {
                                quantity: -quantity
                            }
                        }, {
                            new: true
                        }
                    );
                }
            });

            await Promise.all(productUpdates);

            if (insufficientProducts.length > 0) {
                return res.status(400).json({
                    message: 'Insufficient product quantities',
                    products: insufficientProducts
                });
            }
        } catch (error) {
            console.error('Error processing products:', error);
            return res.status(500).json({
                message: 'Failed to process products'
            });
        }

        try {
            await notifyAboutLowQuantity(products);
        } catch (error) {
            console.error("Error notifying about low quantity", error);
        }

        // Создание заказа
        const order = new Order({
            user: userId || null,
            guestInfo: userType === 'guest' ? {
                name: customerName,
                email: customerEmail,
                phone: phoneNumber
            } : undefined,
            userType: userType,
            products: orderProducts,
            totalAmount: calculatedTotalAmount,
            firstName: customerName,
            address,
            phoneNumber,
            paymentMethod,
            comments,
            status: 'pending',
            date: new Date()
        });

        try {
            const newOrder = await order.save();

            // Отправка email и обновление статуса отправки
            const emailSent = await sendOrderEmail({
                _id: newOrder._id,
                email: customerEmail,
                firstName: customerName,
                address,
                phoneNumber,
                totalAmount: calculatedTotalAmount,
                paymentMethod,
                comments
            }, orderProducts, userType);

            // Обновляем запись о отправке email
            if (emailSent) {
                await Order.findByIdAndUpdate(newOrder._id, {
                    emailSent: true,
                    emailSentAt: new Date()
                });
            }

            // Обновляем историю заказов пользователя
            if (userId) {
                await User.findByIdAndUpdate(userId, {
                    $push: {
                        orders: newOrder._id
                    }
                });
            }

            res.status(201).json({
                success: true,
                order: newOrder,
                message: 'Order placed successfully'
            });

        } catch (error) {
            console.error('Error placing order:', error);

            try {
                await returnProductsToStock(orderProducts);
            } catch (rollbackError) {
                console.error('Error returning products to stock:', rollbackError);
            }

            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
];

// Контроллер для получения заказов пользователя
export const getUserOrders = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const page = parseInt(req.query.page) || 1;
        const perPage = 5;

        const orders = await Order.find({
                user: user._id
            })
            .populate('products.product', 'name price images')
            .sort({
                date: 'desc'
            })
            .skip((page - 1) * perPage)
            .limit(perPage);

        const totalOrders = await Order.countDocuments({
            user: user._id
        });
        const totalPages = Math.ceil(totalOrders / perPage);

        res.json({
            orders,
            totalOrders,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для получения всех заказов (для администратора)
export const getAllOrders = async (req, res) => {
    try {
        const {
            page = 1, perPage = 20
        } = req.query;
        const orders = await Order.find()
            .populate('user', 'name email')
            .populate('products.product', 'name price images')
            .sort({
                date: 'desc'
            })
            .skip((page - 1) * perPage)
            .limit(perPage);
        res.json(orders);
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
            .populate('products.product', 'name price images brand');
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

        productItem.quantity = quantity;
        product.quantity -= quantityDifference;
        await product.save();

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

        await Product.findByIdAndUpdate(
            productToRemove.product, {
                $inc: {
                    quantity: productToRemove.quantity
                }
            }, {
                new: true
            }
        );

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
            .populate('products.product', 'name price images')
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