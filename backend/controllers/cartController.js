import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// Вспомогательная функция для поиска корзины пользователя
async function findUserCart(req) {
    const query = {};

    if (req.user.role === 'customer' || req.user.role === 'admin') {
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

        if (req.user.role === 'customer' || req.user.role === 'admin') {
            cart = await Cart.findOne({
                user: req.user.userId
            }).populate('items.product');
        } else {
            // Для гостей используем sessionId
            cart = await Cart.findOne({
                sessionId: req.user.sessionId
            }).populate('items.product');
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
            quantity,
            size,
            color
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

        let cart;
        const cartData = {};

        // Определяем владельца корзины
        if (req.user.role === 'customer' || req.user.role === 'admin') {
            cartData.user = req.user.userId;
        } else {
            cartData.sessionId = req.user.sessionId;
        }

        // Ищем существующую корзину
        cart = await Cart.findOne(cartData);

        if (!cart) {
            cart = new Cart(cartData);
        }

        // Проверяем, есть ли уже такой товар в корзине
        const existingItemIndex = cart.items.findIndex(item =>
            item.product.toString() === productId &&
            item.size === size &&
            item.color === color
        );

        if (existingItemIndex !== -1) {
            // Обновляем количество
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;

            if (product.quantity < newQuantity) {
                return res.status(400).json({
                    message: 'Недостаточно товара на складе',
                    available: product.quantity
                });
            }

            cart.items[existingItemIndex].quantity = newQuantity;
        } else {
            // Добавляем новый товар
            cart.items.push({
                product: productId,
                quantity,
                size,
                color,
                price: product.price,
                name: product.name,
                image: product.images[0],
                brand: product.brand
            });
        }

        // Обновляем итоги
        cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.lastUpdated = new Date();

        await cart.save();
        await cart.populate('items.product');

        res.json(cart);
    } catch (error) {
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
        if (product.quantity < quantity) {
            return res.status(400).json({
                message: 'Недостаточно товара на складе',
                available: product.quantity
            });
        }

        item.quantity = quantity;

        // Обновляем итоги
        cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.lastUpdated = new Date();

        await cart.save();
        res.json(cart);
    } catch (error) {
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
        cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.lastUpdated = new Date();

        await cart.save();
        res.json(cart);
    } catch (error) {
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
        res.status(500).json({
            message: error.message
        });
    }
};