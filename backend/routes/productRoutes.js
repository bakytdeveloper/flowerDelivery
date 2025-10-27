import express from 'express';
import {
    getProducts,
    getAvailableFilters,
    getNewestProducts,
    getBestSellingProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getRelatedProducts,
    toggleProductActive,
    getProductRating,
    getProductsByOccasion
} from '../controllers/productController.js';
import {
    authenticateToken,
    requireAdmin
} from '../middlewares/authenticateToken.js';

const router = express.Router();

// Публичные маршруты (доступны всем)
router.get('/', getProducts);
router.get('/filters/available', getAvailableFilters);
router.get('/newest', getNewestProducts);
router.get('/bestselling', getBestSellingProducts);
router.get('/occasion/:occasion', getProductsByOccasion);
router.get('/:id', getProductById);
router.get('/related/:productId', getRelatedProducts);
router.get('/:id/rating', getProductRating);

// Защищенные маршруты (только для администраторов)
router.post('/', authenticateToken, requireAdmin, createProduct);
router.put('/:id', authenticateToken, requireAdmin, updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, deleteProduct);
router.put('/:productId/toggle-active', authenticateToken, requireAdmin, toggleProductActive);

export default router;