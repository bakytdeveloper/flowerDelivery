import express from 'express';
import {
    updateProfile,
    getOrders,
    updatePassword,
    getClients,
    deleteClient,
    addToFavorites,
    removeFromFavorites,
    getFavorites
} from '../controllers/userController.js';
import {
    authenticateToken,
    checkRole,
    requireAdmin
} from '../middlewares/authenticateToken.js';

const router = express.Router();

// Маршруты профиля пользователя
router.put('/update-profile/:userId', authenticateToken, checkRole(['customer']), updateProfile);
router.get('/orders', authenticateToken, checkRole(['customer']), getOrders);
router.put('/update-password/:userId', authenticateToken, checkRole(['customer']), updatePassword);

// Маршруты для управления избранными товарами
router.post('/:userId/favorites', authenticateToken, checkRole(['customer']), addToFavorites);
router.delete('/:userId/favorites/:productId', authenticateToken, checkRole(['customer']), removeFromFavorites);
router.get('/:userId/favorites', authenticateToken, checkRole(['customer']), getFavorites);

// Маршруты для администратора (управление клиентами)
router.get('/clients', authenticateToken, requireAdmin, getClients);
router.delete('/clients/:id', authenticateToken, requireAdmin, deleteClient);

export default router;