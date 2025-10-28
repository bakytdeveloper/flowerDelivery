import express from 'express';
import {
    getHomepage,
    updateHomepage,
    deleteSliderImage,
    updatePromotion,
    getFormattedSlides,
    checkProducts
} from '../controllers/homepageController.js';
import {
    authenticateToken,
    requireAdmin
} from '../middlewares/authenticateToken.js';

const router = express.Router();

// Публичные маршруты (доступны всем)
router.get('/', getHomepage);
router.get('/slides', getFormattedSlides);
router.get('/check-products', checkProducts);

// Защищенные маршруты (только для администраторов)
router.post('/', authenticateToken, requireAdmin, updateHomepage);
router.put('/promotion', authenticateToken, requireAdmin, updatePromotion);
router.delete('/slider/:imageUrl', authenticateToken, requireAdmin, deleteSliderImage);

export default router;