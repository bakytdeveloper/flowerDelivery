import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Wrapper from '../models/Wrapper.js';
import Addon from '../models/Addon.js';

// Вспомогательная функция для поиска корзины пользователя
async function findUserCart(req) {
    const query = {};

    if (req.user && (req.user.role === 'customer' || req.user.role === 'admin')) {
        query.user = req.user.userId;
    } else {
        // Для гостя используем только sessionId из заголовка
        query.sessionId = req.user.sessionId;
    }

    return Cart.findOne(query);
}

// Контроллер для получения корзины
export const getCart = async (req, res) => {
    try {
        let cart;

        if (req.user && (req.user.role === 'customer' || req.user.role === 'admin')) {
            cart = await Cart.findOne({
                user: req.user.userId
            }).populate('items.product').populate('items.wrapper.wrapperId').populate('items.addons.addonId');
        } else {
            // Для гостей используем sessionId
            cart = await Cart.findOne({
                sessionId: req.user.sessionId
            }).populate('items.product').populate('items.wrapper.wrapperId').populate('items.addons.addonId');
        }

        if (!cart) {
            return res.json({
                items: [],
                total: 0,
                totalItems: 0
            });
        }

        res.json(cart);
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для добавления товара в корзину
export const addToCart = async (req, res) => {
    try {
        const {
            productId,
            quantity = 1,
            flowerType,
            flowerColor,
            wrapper,
            addons = []
        } = req.body;

        // Проверяем доступность товара
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            return res.status(404).json({
                message: 'Товар не найден'
            });
        }

        if (product.quantity < quantity) {
            return res.status(400).json({
                message: 'Недостаточно товара на складе',
                available: product.quantity
            });
        }

        // Проверяем соответствие типа цветов
        if (flowerType && product.type !== flowerType) {
            return res.status(400).json({
                message: 'Несоответствие типа цветов'
            });
        }

        let cart;
        const cartData = {};

        // Определяем владельца корзины
        if (req.user && (req.user.role === 'customer' || req.user.role === 'admin')) {
            cartData.user = req.user.userId;
        } else {
            cartData.sessionId = req.user.sessionId;
        }

        // Ищем существующую корзину
        cart = await Cart.findOne(cartData);

        if (!cart) {
            cart = new Cart(cartData);
        }

        // Проверяем и обрабатываем обёртку если указана
        let wrapperData = null;
        if (wrapper && wrapper.wrapperId) {
            const wrapperProduct = await Wrapper.findById(wrapper.wrapperId);
            if (wrapperProduct && wrapperProduct.isActive && wrapperProduct.quantity > 0) {
                wrapperData = {
                    wrapperId: wrapper.wrapperId,
                    name: wrapperProduct.name,
                    price: wrapperProduct.price,
                    image: wrapperProduct.image
                };
            }
        }

        // Проверяем и обрабатываем дополнения
        const processedAddons = [];
        if (addons && addons.length > 0) {
            for (const addon of addons) {
                if (addon.addonId && addon.quantity > 0) {
                    const addonProduct = await Addon.findById(addon.addonId);
                    if (addonProduct && addonProduct.isActive && addonProduct.quantity >= addon.quantity) {
                        processedAddons.push({
                            addonId: addon.addonId,
                            name: addonProduct.name,
                            type: addonProduct.type,
                            price: addonProduct.price,
                            image: addonProduct.image,
                            quantity: addon.quantity
                        });
                    }
                }
            }
        }

        // Рассчитываем общую стоимость товара
        let itemTotal = product.price;
        if (wrapperData) {
            itemTotal += wrapperData.price;
        }
        if (processedAddons.length > 0) {
            processedAddons.forEach(addon => {
                itemTotal += addon.price * addon.quantity;
            });
        }

        // Создаем уникальный идентификатор для товара в корзине
        const itemIdentifier = {
            product: productId,
            flowerType: flowerType || product.type,
            flowerColor: flowerColor || (product.flowerColors && product.flowerColors[0] ? {
                name: product.flowerColors[0].name,
                value: product.flowerColors[0].value
            } : null),
            wrapper: wrapperData ? {
                wrapperId: wrapperData.wrapperId
            } : null,
            addons: processedAddons.map(addon => ({
                addonId: addon.addonId,
                quantity: addon.quantity
            }))
        };

        // Проверяем, есть ли уже такой товар в корзине
        const existingItemIndex = cart.items.findIndex(item =>
            item.product.toString() === productId &&
            item.flowerType === itemIdentifier.flowerType &&
            JSON.stringify(item.flowerColor) === JSON.stringify(itemIdentifier.flowerColor) &&
            JSON.stringify(item.wrapper) === JSON.stringify(itemIdentifier.wrapper) &&
            JSON.stringify(item.addons.map(a => ({ addonId: a.addonId.toString(), quantity: a.quantity }))) ===
            JSON.stringify(itemIdentifier.addons.map(a => ({ addonId: a.addonId.toString(), quantity: a.quantity })))
        );

        if (existingItemIndex !== -1) {
            // Обновляем количество существующего товара
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;

            if (product.quantity < newQuantity) {
                return res.status(400).json({
                    message: 'Недостаточно товара на складе',
                    available: product.quantity
                });
            }

            cart.items[existingItemIndex].quantity = newQuantity;
            // Обновляем общую стоимость с учетом нового количества
            cart.items[existingItemIndex].itemTotal = itemTotal;
        } else {
            // Добавляем новый товар
            cart.items.push({
                product: productId,
                quantity,
                flowerType: flowerType || product.type,
                flowerColor: flowerColor || (product.flowerColors && product.flowerColors[0] ? {
                    name: product.flowerColors[0].name,
                    value: product.flowerColors[0].value
                } : null),
                price: product.price,
                name: product.name,
                image: product.images[0],
                flowerNames: product.flowerNames,
                stemLength: product.stemLength,
                occasion: product.occasion,
                recipient: product.recipient,
                wrapper: wrapperData,
                addons: processedAddons,
                itemTotal: itemTotal
            });
        }

        // Обновляем итоги корзины
        cart.total = cart.items.reduce((sum, item) => sum + (item.itemTotal * item.quantity), 0);
        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.lastUpdated = new Date();

        await cart.save();

        // Заполняем данные о продуктах, обёртках и дополнениях
        await cart.populate('items.product');
        await cart.populate('items.wrapper.wrapperId');
        await cart.populate('items.addons.addonId');

        res.json(cart);
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для обновления количества товара
export const updateCartItem = async (req, res) => {
    try {
        const {
            quantity
        } = req.body;
        const {
            itemId
        } = req.params;

        let cart = await findUserCart(req);
        if (!cart) return res.status(404).json({
            message: 'Корзина не найдена'
        });

        const item = cart.items.id(itemId);
        if (!item) return res.status(404).json({
            message: 'Товар не найден в корзине'
        });

        // Проверяем доступность
        const product = await Product.findById(item.product);
        if (!product || !product.isActive) {
            return res.status(404).json({
                message: 'Товар больше не доступен'
            });
        }

        if (product.quantity < quantity) {
            return res.status(400).json({
                message: 'Недостаточно товара на складе',
                available: product.quantity
            });
        }

        item.quantity = quantity;

        // Обновляем итоги
        cart.total = cart.items.reduce((sum, item) => sum + (item.itemTotal * item.quantity), 0);
        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.lastUpdated = new Date();

        await cart.save();

        // Повторно заполняем данные продукта
        await cart.populate('items.product');
        await cart.populate('items.wrapper.wrapperId');
        await cart.populate('items.addons.addonId');

        res.json(cart);
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для удаления товара из корзины
export const removeFromCart = async (req, res) => {
    try {
        const {
            itemId
        } = req.params;

        let cart = await findUserCart(req);
        if (!cart) return res.status(404).json({
            message: 'Корзина не найдена'
        });

        cart.items.pull(itemId);

        // Обновляем итоги
        cart.total = cart.items.reduce((sum, item) => sum + (item.itemTotal * item.quantity), 0);
        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.lastUpdated = new Date();

        await cart.save();

        // Повторно заполняем данные продукта
        await cart.populate('items.product');
        await cart.populate('items.wrapper.wrapperId');
        await cart.populate('items.addons.addonId');

        res.json(cart);
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для очистки корзины
export const clearCart = async (req, res) => {
    try {
        let cart = await findUserCart(req);
        if (!cart) return res.status(404).json({
            message: 'Корзина не найдена'
        });

        cart.items = [];
        cart.total = 0;
        cart.totalItems = 0;
        cart.lastUpdated = new Date();

        await cart.save();
        res.json(cart);
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для получения сводки корзины (мини-корзина)
export const getCartSummary = async (req, res) => {
    try {
        let cart;

        if (req.user && (req.user.role === 'customer' || req.user.role === 'admin')) {
            cart = await Cart.findOne({
                user: req.user.userId
            });
        } else {
            cart = await Cart.findOne({
                sessionId: req.user.sessionId
            });
        }

        if (!cart) {
            return res.json({
                totalItems: 0,
                total: 0,
                items: []
            });
        }

        const summary = {
            totalItems: cart.totalItems,
            total: cart.total,
            items: cart.items.map(item => ({
                id: item._id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                image: item.image,
                flowerType: item.flowerType,
                flowerNames: item.flowerNames,
                itemTotal: item.itemTotal
            }))
        };

        res.json(summary);
    } catch (error) {
        console.error('Error getting cart summary:', error);
        res.status(500).json({
            message: error.message
        });
    }
};