import express from 'express';
import {
    getHomepage,
    updateHomepage,
    deleteSliderImage,
    deleteGenderImage,
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
router.get('/formatted-slides', getFormattedSlides);
router.get('/check-products', checkProducts);

// Защищенные маршруты (только для администраторов)
router.post('/', authenticateToken, requireAdmin, updateHomepage);
router.patch('/promotion', authenticateToken, requireAdmin, updatePromotion);
router.delete('/slider/:imageUrl', authenticateToken, requireAdmin, deleteSliderImage);
router.delete('/gender/:imageUrl', authenticateToken, requireAdmin, deleteGenderImage);

export default router;