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
    getProductsByOccasion,
    getCatalogData
} from '../controllers/productController.js';
import  { getProductVariants } from "../controllers/adminController.js";
import {
    authenticateToken,
    requireAdmin
} from '../middlewares/authenticateToken.js';
import {getAvailableWrappers, getWrapperById, searchWrappers} from "../controllers/wrapperController.js";
import {getAddonsByType, getAvailableAddons, searchAddons, getAddonById} from "../controllers/addonController.js";

const router = express.Router();

// Публичные маршруты (доступны всем)
// Важно: конкретные маршруты должны идти ДО динамических маршрутов с :id
router.get('/', getProducts);
router.get('/filters/available', getAvailableFilters);
router.get('/newest', getNewestProducts);
router.get('/bestselling', getBestSellingProducts);
router.get('/occasion/:occasion', getProductsByOccasion);
router.get('/catalog/data', getCatalogData);
router.get('/related/:productId', getRelatedProducts);
router.get('/:id/rating', getProductRating);
router.get('/:productId/variants', getProductVariants);

// Публичные маршруты для оберток
router.get('/wrappers/available', getAvailableWrappers);
router.get('/wrappers/search', searchWrappers);
router.get('/wrappers/:id', getWrapperById);

// Публичные маршруты для дополнений
router.get('/addons/available', getAvailableAddons);
router.get('/addons/type/:type', getAddonsByType);
router.get('/addons/search', searchAddons);
router.get('/addons/:id', getAddonById);

// Маршрут для получения продукта по ID должен быть ПОСЛЕДНИМ среди GET маршрутов
router.get('/:id', getProductById);

// Защищенные маршруты (только для администраторов)
router.post('/', authenticateToken, requireAdmin, createProduct);
router.put('/:id', authenticateToken, requireAdmin, updateProduct);
router.delete('/:id', authenticateToken, requireAdmin, deleteProduct);
router.put('/:productId/toggle-active', authenticateToken, requireAdmin, toggleProductActive);

export default router;