import express from 'express';
import {
    getProducts,
    getFiltersHierarchy,
    getGenders,
    getCategories,
    getTypes,
    getNewestProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getRelatedProducts,
    getAccessoriesByDirection,
    toggleProductActive,
    getProductRating
} from '../controllers/productController.js';
import {
    authenticateToken,
    requireAdmin
} from '../middlewares/authenticateToken.js';

const router = express.Router();

// Публичные маршруты (доступны всем)
router.get('/', getProducts);
router.get('/filters/hierarchy', getFiltersHierarchy);
router.get('/genders', getGenders);
router.get('/categories', getCategories);
router.get('/types', getTypes);
router.get('/newest', getNewestProducts);
router.get('/:id', getProductById);
router.get('/related/:productId', getRelatedProducts);
router.get('/accessories/:direction', getAccessoriesByDirection);
router.get('/:id/rating', getProductRating);

// Защищенные маршруты (только для администраторов)
router.post('/', authenticateToken, requireAdmin, createProduct);
router.put('/:id', authenticateToken, requireAdmin, updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, deleteProduct);
router.put('/:productId/toggle-active', authenticateToken, requireAdmin, toggleProductActive);

export default router;