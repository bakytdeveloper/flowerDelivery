import express from 'express';
import {
    createOrder,
    getUserOrders,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    updateAdminComments,
    updateProductQuantity,
    removeProductFromOrder,
    deleteOrder,
    getLastOrder,
    getAdminPurchaseHistory,
    getOrdersByOccasion,
    getOrdersStats,
    updateOrder
} from '../controllers/orderController.js';
import {
    authenticateToken,
    checkRole,
    requireAdmin
} from '../middlewares/authenticateToken.js';
import { orderAuth } from '../middlewares/orderAuth.js';

const router = express.Router();

// Публичные маршруты - используем orderAuth вместо authenticateToken
router.post('/', orderAuth, createOrder);

// Маршруты для зарегистрированных пользователей
router.get('/my-orders', authenticateToken, checkRole(['customer']), getUserOrders);
router.get('/last-order/:userId', authenticateToken, getLastOrder);

// Маршруты для администратора
router.get('/', authenticateToken, requireAdmin, getAllOrders);
router.get('/stats/overview', authenticateToken, requireAdmin, getOrdersStats);
router.get('/:orderId', authenticateToken, requireAdmin, getOrderById);
router.put('/:orderId/status', authenticateToken, requireAdmin, updateOrderStatus);
// router.put('/:orderId', authenticateToken, requireAdmin, updateOrder);
router.put('/update-comments-admin/:orderId', authenticateToken, requireAdmin, updateAdminComments);
router.put('/update-product-quantity/:orderId', authenticateToken, requireAdmin, updateProductQuantity);
router.delete('/remove-product/:orderId', authenticateToken, requireAdmin, removeProductFromOrder);
router.delete('/:orderId', authenticateToken, requireAdmin, deleteOrder);
router.put('/:orderId', authenticateToken, requireAdmin, updateOrder); // Этот маршрут должен быть
// В orderRoutes.js добавьте:
router.put('/update-product-quantity/:orderId', authenticateToken, requireAdmin, updateProductQuantity);
router.delete('/remove-product/:orderId', authenticateToken, requireAdmin, removeProductFromOrder);


// Дополнительные маршруты
router.get('/admin/purchase-history', authenticateToken, requireAdmin, getAdminPurchaseHistory);
router.get('/occasion/:occasion', authenticateToken, requireAdmin, getOrdersByOccasion);

export default router;