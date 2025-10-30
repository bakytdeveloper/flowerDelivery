import express from 'express';
import {
    addFlowerToCart,
    addAddonToCart,
    updateCartItem,
    removeFromCart,
    getCart,
    clearCart
} from '../controllers/cartController.js';
import { cartAuth } from '../middlewares/cartAuth.js';

const router = express.Router();

// Все маршруты корзины используют cartAuth middleware
router.use(cartAuth);

// Добавление цветов в корзину
router.post('/flowers', addFlowerToCart);

// Добавление дополнительного товара в корзину
router.post('/addons', addAddonToCart);

// Обновление количества товара в корзине
router.put('/items', updateCartItem);

// Удаление товара из корзины
router.delete('/items', removeFromCart);

// Получение корзины
router.get('/', getCart);

// Очистка корзины
router.delete('/clear', clearCart);

export default router;