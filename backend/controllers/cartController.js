// import Cart from '../models/Cart.js';
// import Product from '../models/Product.js';
// import Addon from '../models/Addon.js';
// import Wrapper from '../models/Wrapper.js';
//
// // Добавление цветов в корзину
// export const addFlowerToCart = async (req, res) => {
//     try {
//         const { productId, quantity, flowerType, flowerColor, wrapper } = req.body;
//         const { user } = req;
//
//         let cart = await getOrCreateCart(user);
//         const product = await Product.findById(productId);
//
//         if (!product) {
//             return res.status(404).json({ message: 'Продукт не найден' });
//         }
//
//         if (!product.isActive || product.quantity < quantity) {
//             return res.status(400).json({ message: 'Товар недоступен' });
//         }
//
//         // Рассчитываем стоимость обертки
//         let wrapperPrice = 0;
//         let wrapperData = null;
//
//         if (wrapper && wrapper.wrapperId) {
//             const wrapperDoc = await Wrapper.findById(wrapper.wrapperId);
//             if (wrapperDoc && wrapperDoc.isActive) {
//                 wrapperPrice = wrapperDoc.price;
//                 wrapperData = {
//                     wrapperId: wrapperDoc._id,
//                     name: wrapperDoc.name,
//                     price: wrapperDoc.price,
//                     image: wrapperDoc.image,
//                     // Для одиночных цветов обертка считается за весь заказ
//                     wrapperType: flowerType === 'single' ? 'per_order' : 'per_item'
//                 };
//             }
//         }
//
//         // Рассчитываем общую стоимость товара
//         // Для одиночных цветов с оберткой: цена цветов * количество + цена обертки (одна)
//         // Для букетов: (цена букета + цена обертки) * количество
//         let itemTotal;
//         if (flowerType === 'single' && wrapperData) {
//             // Для одиночных цветов с оберткой: обертка добавляется один раз
//             itemTotal = product.price; // Цена за один цветок без обертки
//         } else {
//             // Для букетов или цветов без обертки
//             itemTotal = (product.price || 0) + (wrapperPrice || 0);
//         }
//
//         const flowerItem = {
//             product: productId,
//             quantity,
//             flowerType,
//             flowerColor,
//             price: product.price,
//             name: product.name,
//             image: product.images[0],
//             flowerNames: product.flowerNames,
//             stemLength: product.stemLength,
//             wrapper: wrapperData,
//             itemTotal
//         };
//
//         cart.flowerItems.push(flowerItem);
//         await cart.save();
//
//         res.status(200).json({
//             message: 'Цветы добавлены в корзину',
//             cart: await formatCartResponse(cart)
//         });
//     } catch (error) {
//         console.error('Error adding flower to cart:', error);
//         res.status(500).json({ message: 'Ошибка при добавлении в корзину' });
//     }
// };
//
// // Добавление дополнительного товара в корзину
// export const addAddonToCart = async (req, res) => {
//     try {
//         const { addonId, quantity } = req.body;
//         const { user } = req;
//
//         // Находим или создаем корзину
//         let cart = await getOrCreateCart(user);
//
//         // Находим дополнительный товар
//         const addon = await Addon.findById(addonId);
//         if (!addon) {
//             return res.status(404).json({ message: 'Дополнительный товар не найден' });
//         }
//
//         // Проверяем доступность
//         if (!addon.isActive || addon.quantity < quantity) {
//             return res.status(400).json({ message: 'Товар недоступен' });
//         }
//
//         // Рассчитываем общую стоимость
//         const itemTotal = (addon.price || 0) * quantity;
//
//         // Создаем объект дополнительного товара
//         const addonItem = {
//             addonId,
//             quantity,
//             price: addon.price,
//             name: addon.name,
//             image: addon.image,
//             type: addon.type,
//             itemTotal
//         };
//
//         // Добавляем дополнительный товар в корзину
//         cart.addonItems.push(addonItem);
//         await cart.save();
//
//         res.status(200).json({
//             message: 'Дополнительный товар добавлен в корзину',
//             cart: await formatCartResponse(cart)
//         });
//     } catch (error) {
//         console.error('Error adding addon to cart:', error);
//         res.status(500).json({ message: 'Ошибка при добавлении в корзину' });
//     }
// };
//
// // Обновление количества товара в корзине
// export const updateCartItem = async (req, res) => {
//     try {
//         const { itemId, quantity, itemType } = req.body;
//         const { user } = req;
//
//         let cart = await getOrCreateCart(user);
//
//         if (itemType === 'flower') {
//             const itemIndex = cart.flowerItems.findIndex(item => item._id.toString() === itemId);
//             if (itemIndex === -1) {
//                 return res.status(404).json({ message: 'Товар не найден в корзине' });
//             }
//
//             if (quantity <= 0) {
//                 cart.flowerItems.splice(itemIndex, 1);
//             } else {
//                 const item = cart.flowerItems[itemIndex];
//                 item.quantity = quantity;
//
//                 // Пересчитываем itemTotal с учетом типа обертки
//                 if (item.flowerType === 'single' && item.wrapper && item.wrapper.wrapperId) {
//                     // Для одиночных цветов с оберткой: цена только за цветы
//                     item.itemTotal = item.price || 0;
//                 } else {
//                     // Для букетов или цветов без обертки
//                     const wrapperPrice = item.wrapper ? (item.wrapper.price || 0) : 0;
//                     item.itemTotal = (item.price || 0) + wrapperPrice;
//                 }
//
//                 if (isNaN(item.itemTotal)) {
//                     console.error('Invalid itemTotal calculation:', { itemPrice: item.price, itemTotal: item.itemTotal });
//                     item.itemTotal = item.price || 0;
//                 }
//             }
//         } else if (itemType === 'addon') {
//             const itemIndex = cart.addonItems.findIndex(item => item._id.toString() === itemId);
//             if (itemIndex === -1) {
//                 return res.status(404).json({ message: 'Товар не найден в корзине' });
//             }
//
//             if (quantity <= 0) {
//                 cart.addonItems.splice(itemIndex, 1);
//             } else {
//                 cart.addonItems[itemIndex].quantity = quantity;
//                 // Пересчитываем itemTotal с защитой от NaN
//                 const item = cart.addonItems[itemIndex];
//                 const itemPrice = item.price || 0;
//                 // item.itemTotal = itemPrice * quantity;
//
//                 // Проверяем, что itemTotal является валидным числом
//                 if (isNaN(item.itemTotal)) {
//                     console.error('Invalid itemTotal calculation for addon:', { itemPrice, quantity, itemTotal: item.itemTotal });
//                     item.itemTotal = itemPrice; // Используем только цену товара как fallback
//                 }
//             }
//         }
//
//         await cart.save();
//         res.status(200).json({
//             message: 'Корзина обновлена',
//             cart: await formatCartResponse(cart)
//         });
//     } catch (error) {
//         console.error('Error updating cart item:', error);
//         res.status(500).json({ message: 'Ошибка при обновлении корзины' });
//     }
// };
//
//
// // Новая функция для удаления/изменения обертки
// export const updateWrapper = async (req, res) => {
//     try {
//         const { itemId, wrapper } = req.body;
//         const { user } = req;
//
//         let cart = await getOrCreateCart(user);
//         const itemIndex = cart.flowerItems.findIndex(item => item._id.toString() === itemId);
//
//         if (itemIndex === -1) {
//             return res.status(404).json({ message: 'Товар не найден в корзине' });
//         }
//
//         const item = cart.flowerItems[itemIndex];
//
//         // Если передана новая обертка
//         if (wrapper && wrapper.wrapperId) {
//             const wrapperDoc = await Wrapper.findById(wrapper.wrapperId);
//             if (wrapperDoc && wrapperDoc.isActive) {
//                 item.wrapper = {
//                     wrapperId: wrapperDoc._id,
//                     name: wrapperDoc.name,
//                     price: wrapperDoc.price,
//                     image: wrapperDoc.image,
//                     wrapperType: item.flowerType === 'single' ? 'per_order' : 'per_item'
//                 };
//             }
//         } else {
//             // Удаляем обертку
//             item.wrapper = null;
//         }
//
//         // Пересчитываем itemTotal
//         if (item.flowerType === 'single' && item.wrapper && item.wrapper.wrapperId) {
//             item.itemTotal = item.price || 0;
//         } else {
//             const wrapperPrice = item.wrapper ? (item.wrapper.price || 0) : 0;
//             item.itemTotal = (item.price || 0) + wrapperPrice;
//         }
//
//         await cart.save();
//         res.status(200).json({
//             message: 'Обертка обновлена',
//             cart: await formatCartResponse(cart)
//         });
//     } catch (error) {
//         console.error('Error updating wrapper:', error);
//         res.status(500).json({ message: 'Ошибка при обновлении обертки' });
//     }
// };
//
//
// // Удаление товара из корзины
// export const removeFromCart = async (req, res) => {
//     try {
//         const { itemId, itemType } = req.body;
//         const { user } = req;
//
//         let cart = await getOrCreateCart(user);
//
//         if (itemType === 'flower') {
//             cart.flowerItems = cart.flowerItems.filter(item => item._id.toString() !== itemId);
//         } else if (itemType === 'addon') {
//             cart.addonItems = cart.addonItems.filter(item => item._id.toString() !== itemId);
//         }
//
//         await cart.save();
//         res.status(200).json({
//             message: 'Товар удален из корзины',
//             cart: await formatCartResponse(cart)
//         });
//     } catch (error) {
//         console.error('Error removing from cart:', error);
//         res.status(500).json({ message: 'Ошибка при удалении из корзины' });
//     }
// };
//
// // Получение корзины
// export const getCart = async (req, res) => {
//     try {
//         const { user } = req;
//         const cart = await getOrCreateCart(user);
//
//         res.status(200).json({
//             cart: await formatCartResponse(cart)
//         });
//     } catch (error) {
//         console.error('Error getting cart:', error);
//         res.status(500).json({ message: 'Ошибка при получении корзины' });
//     }
// };
//
// // Очистка корзины
// export const clearCart = async (req, res) => {
//     try {
//         const { user } = req;
//         let cart = await getOrCreateCart(user);
//
//         cart.flowerItems = [];
//         cart.addonItems = [];
//         await cart.save();
//
//         res.status(200).json({
//             message: 'Корзина очищена',
//             cart: await formatCartResponse(cart)
//         });
//     } catch (error) {
//         console.error('Error clearing cart:', error);
//         res.status(500).json({ message: 'Ошибка при очистке корзины' });
//     }
// };
//
// // Вспомогательная функция для получения или создания корзины
// const getOrCreateCart = async (user) => {
//     let cart;
//
//     if (user.userId) {
//         // Пользователь авторизован
//         cart = await Cart.findOne({ user: user.userId });
//     } else {
//         // Гость
//         cart = await Cart.findOne({ sessionId: user.sessionId });
//     }
//
//     if (!cart) {
//         cart = new Cart({
//             user: user.userId || null,
//             sessionId: user.sessionId,
//             flowerItems: [],
//             addonItems: []
//         });
//         await cart.save();
//     }
//
//     return cart;
// };
//
// // Вспомогательная функция для форматирования ответа корзины
// const formatCartResponse = async (cart) => {
//     const populatedCart = await cart.populate([
//         { path: 'flowerItems.product', select: 'name images isActive quantity' },
//         { path: 'addonItems.addonId', select: 'name image isActive quantity type' }
//     ]);
//
//     // Убедимся, что все itemTotal являются числами
//     populatedCart.flowerItems = populatedCart.flowerItems.map(item => ({
//         ...item.toObject ? item.toObject() : item,
//         itemTotal: Number(item.itemTotal) || 0
//     }));
//
//     populatedCart.addonItems = populatedCart.addonItems.map(item => ({
//         ...item.toObject ? item.toObject() : item,
//         itemTotal: Number(item.itemTotal) || 0
//     }));
//
//     return {
//         _id: populatedCart._id,
//         flowerItems: populatedCart.flowerItems,
//         addonItems: populatedCart.addonItems,
//         total: populatedCart.total,
//         totalItems: populatedCart.totalItems,
//         lastUpdated: populatedCart.lastUpdated
//     };
// };


import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Addon from '../models/Addon.js';
import Wrapper from '../models/Wrapper.js';

// Добавление цветов в корзину
export const addFlowerToCart = async (req, res) => {
    try {
        const { productId, quantity, flowerType, flowerColor, wrapper } = req.body;
        const { user } = req;

        let cart = await getOrCreateCart(user);
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Продукт не найден' });
        }

        if (!product.isActive || product.quantity < quantity) {
            return res.status(400).json({ message: 'Товар недоступен' });
        }

        // Рассчитываем стоимость обертки
        let wrapperPrice = 0;
        let wrapperData = null;

        if (wrapper && wrapper.wrapperId) {
            const wrapperDoc = await Wrapper.findById(wrapper.wrapperId);
            if (wrapperDoc && wrapperDoc.isActive) {
                wrapperPrice = wrapperDoc.price;
                wrapperData = {
                    wrapperId: wrapperDoc._id,
                    name: wrapperDoc.name,
                    price: wrapperDoc.price,
                    image: wrapperDoc.image,
                    // Для одиночных цветов обертка считается за весь заказ
                    wrapperType: flowerType === 'single' ? 'per_order' : 'per_item'
                };
            }
        }

        // Рассчитываем общую стоимость товара
        let itemTotal;
        if (flowerType === 'single' && wrapperData) {
            // Для одиночных цветов с оберткой: обертка добавляется один раз
            itemTotal = product.price; // Цена за один цветок без обертки
        } else {
            // Для букетов или цветов без обертки
            itemTotal = (product.price || 0) + (wrapperPrice || 0);
        }

        const flowerItem = {
            product: productId,
            quantity,
            flowerType,
            flowerColor,
            price: product.price,
            name: product.name,
            image: product.images[0],
            flowerNames: product.flowerNames,
            stemLength: product.stemLength,
            wrapper: wrapperData,
            itemTotal
        };

        cart.flowerItems.push(flowerItem);
        await cart.save();

        res.status(200).json({
            message: 'Цветы добавлены в корзину',
            cart: await formatCartResponse(cart)
        });
    } catch (error) {
        console.error('Error adding flower to cart:', error);
        res.status(500).json({ message: 'Ошибка при добавлении в корзину' });
    }
};

// Добавление дополнительного товара в корзину
export const addAddonToCart = async (req, res) => {
    try {
        const { addonId, quantity } = req.body;
        const { user } = req;

        // Находим или создаем корзину
        let cart = await getOrCreateCart(user);

        // Находим дополнительный товар
        const addon = await Addon.findById(addonId);
        if (!addon) {
            return res.status(404).json({ message: 'Дополнительный товар не найден' });
        }

        // Проверяем доступность
        if (!addon.isActive || addon.quantity < quantity) {
            return res.status(400).json({ message: 'Товар недоступен' });
        }

        // Рассчитываем общую стоимость
        const itemTotal = (addon.price || 0) * quantity;

        // Создаем объект дополнительного товара
        const addonItem = {
            addonId,
            quantity,
            price: addon.price,
            name: addon.name,
            image: addon.image,
            type: addon.type,
            itemTotal
        };

        // Добавляем дополнительный товар в корзину
        cart.addonItems.push(addonItem);
        await cart.save();

        res.status(200).json({
            message: 'Дополнительный товар добавлен в корзину',
            cart: await formatCartResponse(cart)
        });
    } catch (error) {
        console.error('Error adding addon to cart:', error);
        res.status(500).json({ message: 'Ошибка при добавлении в корзину' });
    }
};

// Обновление количества товара в корзине
export const updateCartItem = async (req, res) => {
    try {
        const { itemId, quantity, itemType } = req.body;
        const { user } = req;

        let cart = await getOrCreateCart(user);

        if (itemType === 'flower') {
            const itemIndex = cart.flowerItems.findIndex(item => item._id.toString() === itemId);
            if (itemIndex === -1) {
                return res.status(404).json({ message: 'Товар не найден в корзине' });
            }

            if (quantity <= 0) {
                cart.flowerItems.splice(itemIndex, 1);
            } else {
                const item = cart.flowerItems[itemIndex];
                item.quantity = quantity;

                // Пересчитываем itemTotal с учетом типа обертки
                if (item.flowerType === 'single' && item.wrapper && item.wrapper.wrapperId) {
                    // Для одиночных цветов с оберткой: цена только за цветы
                    item.itemTotal = item.price || 0;
                } else {
                    // Для букетов или цветов без обертки
                    const wrapperPrice = item.wrapper ? (item.wrapper.price || 0) : 0;
                    item.itemTotal = (item.price || 0) + wrapperPrice;
                }

                if (isNaN(item.itemTotal)) {
                    console.error('Invalid itemTotal calculation:', { itemPrice: item.price, itemTotal: item.itemTotal });
                    item.itemTotal = item.price || 0;
                }
            }
        } else if (itemType === 'addon') {
            const itemIndex = cart.addonItems.findIndex(item => item._id.toString() === itemId);
            if (itemIndex === -1) {
                return res.status(404).json({ message: 'Товар не найден в корзине' });
            }

            if (quantity <= 0) {
                cart.addonItems.splice(itemIndex, 1);
            } else {
                cart.addonItems[itemIndex].quantity = quantity;
                // Пересчитываем itemTotal с защитой от NaN
                const item = cart.addonItems[itemIndex];
                const itemPrice = item.price || 0;
                item.itemTotal = itemPrice * quantity;

                // Проверяем, что itemTotal является валидным числом
                if (isNaN(item.itemTotal)) {
                    console.error('Invalid itemTotal calculation for addon:', { itemPrice, quantity, itemTotal: item.itemTotal });
                    item.itemTotal = itemPrice; // Используем только цену товара как fallback
                }
            }
        }

        await cart.save();
        res.status(200).json({
            message: 'Корзина обновлена',
            cart: await formatCartResponse(cart)
        });
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ message: 'Ошибка при обновлении корзины' });
    }
};

// Новая функция для удаления/изменения обертки
export const updateWrapper = async (req, res) => {
    try {
        const { itemId, wrapper } = req.body;
        const { user } = req;

        let cart = await getOrCreateCart(user);
        const itemIndex = cart.flowerItems.findIndex(item => item._id.toString() === itemId);

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Товар не найден в корзине' });
        }

        const item = cart.flowerItems[itemIndex];

        // Если передана новая обертка
        if (wrapper && wrapper.wrapperId) {
            const wrapperDoc = await Wrapper.findById(wrapper.wrapperId);
            if (wrapperDoc && wrapperDoc.isActive) {
                item.wrapper = {
                    wrapperId: wrapperDoc._id,
                    name: wrapperDoc.name,
                    price: wrapperDoc.price,
                    image: wrapperDoc.image,
                    wrapperType: item.flowerType === 'single' ? 'per_order' : 'per_item'
                };
            }
        } else {
            // Удаляем обертку
            item.wrapper = null;
        }

        // Пересчитываем itemTotal
        if (item.flowerType === 'single' && item.wrapper && item.wrapper.wrapperId) {
            item.itemTotal = item.price || 0;
        } else {
            const wrapperPrice = item.wrapper ? (item.wrapper.price || 0) : 0;
            item.itemTotal = (item.price || 0) + wrapperPrice;
        }

        await cart.save();
        res.status(200).json({
            message: 'Обертка обновлена',
            cart: await formatCartResponse(cart)
        });
    } catch (error) {
        console.error('Error updating wrapper:', error);
        res.status(500).json({ message: 'Ошибка при обновлении обертки' });
    }
};

// Удаление товара из корзины
export const removeFromCart = async (req, res) => {
    try {
        const { itemId, itemType } = req.body;
        const { user } = req;

        let cart = await getOrCreateCart(user);

        if (itemType === 'flower') {
            cart.flowerItems = cart.flowerItems.filter(item => item._id.toString() !== itemId);
        } else if (itemType === 'addon') {
            cart.addonItems = cart.addonItems.filter(item => item._id.toString() !== itemId);
        }

        await cart.save();
        res.status(200).json({
            message: 'Товар удален из корзины',
            cart: await formatCartResponse(cart)
        });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ message: 'Ошибка при удалении из корзины' });
    }
};

// Получение корзины
export const getCart = async (req, res) => {
    try {
        const { user } = req;
        const cart = await getOrCreateCart(user);

        res.status(200).json({
            cart: await formatCartResponse(cart)
        });
    } catch (error) {
        console.error('Error getting cart:', error);
        res.status(500).json({ message: 'Ошибка при получении корзины' });
    }
};

// Очистка корзины
export const clearCart = async (req, res) => {
    try {
        const { user } = req;
        let cart = await getOrCreateCart(user);

        cart.flowerItems = [];
        cart.addonItems = [];
        await cart.save();

        res.status(200).json({
            message: 'Корзина очищена',
            cart: await formatCartResponse(cart)
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ message: 'Ошибка при очистке корзины' });
    }
};

// Вспомогательная функция для получения или создания корзины
const getOrCreateCart = async (user) => {
    let cart;

    if (user.userId && user.userId !== 'admin') {
        // Пользователь авторизован - ищем по userId
        cart = await Cart.findOne({ user: user.userId });
        console.log('🔍 Поиск корзины для авторизованного пользователя:', { userId: user.userId, found: !!cart });
    } else {
        // Гость - ищем по sessionId
        cart = await Cart.findOne({ sessionId: user.sessionId });
        console.log('🔍 Поиск корзины для гостя:', { sessionId: user.sessionId, found: !!cart });
    }

    if (!cart) {
        cart = new Cart({
            user: (user.userId && user.userId !== 'admin') ? user.userId : null,
            sessionId: user.sessionId,
            flowerItems: [],
            addonItems: []
        });
        await cart.save();
        console.log('🆕 Создана новая корзина:', {
            user: cart.user,
            sessionId: cart.sessionId,
            cartId: cart._id
        });
    }

    return cart;
};

// Вспомогательная функция для форматирования ответа корзины
const formatCartResponse = async (cart) => {
    const populatedCart = await cart.populate([
        { path: 'flowerItems.product', select: 'name images isActive quantity' },
        { path: 'addonItems.addonId', select: 'name image isActive quantity type' }
    ]);

    // Убедимся, что все itemTotal являются числами
    populatedCart.flowerItems = populatedCart.flowerItems.map(item => ({
        ...item.toObject ? item.toObject() : item,
        itemTotal: Number(item.itemTotal) || 0
    }));

    populatedCart.addonItems = populatedCart.addonItems.map(item => ({
        ...item.toObject ? item.toObject() : item,
        itemTotal: Number(item.itemTotal) || 0
    }));

    return {
        _id: populatedCart._id,
        flowerItems: populatedCart.flowerItems,
        addonItems: populatedCart.addonItems,
        total: populatedCart.total,
        totalItems: populatedCart.totalItems,
        lastUpdated: populatedCart.lastUpdated
    };
};