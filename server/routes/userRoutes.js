import express from 'express';
import {
    getProfile,
    updateProfile,
    updatePassword,
    getUserOrders,
    getUserOrderById,
    addToFavorites,
    removeFromFavorites,
    getFavorites,
    getUserStats,
    getClients,
    getClientDetails,
    deleteClient
} from '../controllers/userController.js';
import {
    authenticateToken,
    requireAdmin
} from '../middlewares/authenticateToken.js';

const router = express.Router();

// Публичные маршруты (требуют аутентификации)
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/password', authenticateToken, updatePassword);
router.get('/orders', authenticateToken, getUserOrders);
router.get('/orders/:orderId', authenticateToken, getUserOrderById);
router.get('/stats', authenticateToken, getUserStats);

// Маршруты для избранного
router.get('/favorites', authenticateToken, getFavorites);
router.post('/favorites', authenticateToken, addToFavorites);
router.delete('/favorites/:productId', authenticateToken, removeFromFavorites);

// Админ маршруты
router.get('/clients', authenticateToken, requireAdmin, getClients);
router.get('/clients/:id', authenticateToken, requireAdmin, getClientDetails);
router.delete('/clients/:id', authenticateToken, requireAdmin, deleteClient);

export default router;