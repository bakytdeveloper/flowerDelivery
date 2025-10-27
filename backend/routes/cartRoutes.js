import express from 'express';
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartSummary
} from '../controllers/cartController.js';
import {
    cartAuth
} from '../middlewares/cartAuth.js';

const router = express.Router();

// Маршруты корзины
router.get('/', cartAuth, getCart);
router.get('/summary', cartAuth, getCartSummary); // Новая ручка для сводки
router.post('/add', cartAuth, addToCart);
router.put('/update/:itemId', cartAuth, updateCartItem);
router.delete('/remove/:itemId', cartAuth, removeFromCart);
router.delete('/clear', cartAuth, clearCart);

export default router;