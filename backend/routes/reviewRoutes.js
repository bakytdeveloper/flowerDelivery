import express from 'express';
import {
    canReview,
    getProductReviews,
    createReview,
    updateReview,
    addAdminReply,
    updateAdminReply,
    deleteReview
} from '../controllers/reviewController.js';
import {
    authenticateToken,
    checkRole,
    requireAdmin
} from '../middlewares/authenticateToken.js';

const router = express.Router();

// Публичные маршруты
router.get('/product/:productId', getProductReviews);

// Защищенные маршруты для проверки возможности отзыва
router.get('/can-review/:productId', authenticateToken, canReview);

// Маршруты для создания и управления отзывами (только customers)
router.post('/', authenticateToken, checkRole(['customer']), createReview);
router.put('/:id', authenticateToken, checkRole(['customer']), updateReview);
router.delete('/:id', authenticateToken, deleteReview);

// Маршруты для администратора (ответы на отзывы)
router.post('/:id/reply', authenticateToken, requireAdmin, addAdminReply);
router.put('/:id/reply', authenticateToken, requireAdmin, updateAdminReply);

export default router;