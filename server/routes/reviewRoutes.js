import express from 'express';
import {
    canReview,
    getProductReviews,
    createReview,
    updateReview,
    addAdminReply,
    updateAdminReply,
    deleteReview,
    deleteReviewImage,
    getRecentReviews
} from '../controllers/reviewController.js';
import {
    authenticateToken,
    checkRole,
    requireAdmin
} from '../middlewares/authenticateToken.js';
import { upload, processImage, handleUploadError } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Публичные маршруты
router.get('/product/:productId', getProductReviews);

// Защищенные маршруты для проверки возможности отзыва
router.get('/can-review/:productId', authenticateToken, canReview);

router.get('/recent', getRecentReviews);


// Маршруты для создания и управления отзывами (только customers)
router.post(
    '/',
    authenticateToken,
    checkRole(['customer']),
    upload.array('images', 1), // Только 1 изображение
    processImage,
    handleUploadError,
    createReview
);

router.put(
    '/:id',
    authenticateToken,
    checkRole(['customer']),
    upload.array('images', 1), // Только 1 изображение
    processImage,
    handleUploadError,
    updateReview
);

router.delete('/:id', authenticateToken, deleteReview);

// Маршрут для удаления изображения из отзыва
router.delete('/:reviewId/images/:imageId', authenticateToken, checkRole(['customer']), deleteReviewImage);

// Маршруты для администратора (ответы на отзывы)
router.post('/:id/reply', authenticateToken, requireAdmin, addAdminReply);
router.put('/:id/reply', authenticateToken, requireAdmin, updateAdminReply);

export default router;