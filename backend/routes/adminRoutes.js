import express from 'express';
import {
    getAdminProducts,
    createProduct,
    checkProductDuplicate,
    getProduct,
    updateProduct,
    deleteProduct,
    getSalesHistory,
    getSalesStats,
    updateSoldCount,
    removeImage,
    deleteImageByName,
    uploadImages,
    updateProductFull
} from '../controllers/adminController.js';
import {
    authenticateToken,
    requireAdmin
} from '../middlewares/authenticateToken.js';

import {
    upload,
    processImage,
    handleUploadError
} from '../middlewares/uploadMiddleware.js';

import {
    createAddon,
    deleteAddon,
    // getAddonsByType,
    getAllAddons,
    // getAvailableAddons,
    updateAddon,
    // getAddonById,
    // searchAddons
} from "../controllers/addonController.js";
import {
    createWrapper,
    deleteWrapper,
    getAllWrappers,
    // getAvailableWrappers,
    updateWrapper,
    // getWrapperById,
    // searchWrappers
} from "../controllers/wrapperController.js";

const router = express.Router();

// Маршруты для управления товарами админа
router.get('/products', authenticateToken, requireAdmin, getAdminProducts);
router.post('/products', authenticateToken, requireAdmin, createProduct);
router.post('/products/check-duplicate', authenticateToken, requireAdmin, checkProductDuplicate);
router.get('/products/:productId', authenticateToken, requireAdmin, getProduct);
router.put('/products/:productId', authenticateToken, requireAdmin, updateProduct);
router.delete('/products/:productId', authenticateToken, requireAdmin, deleteProduct);
router.put('/products/:productId/sold-count', authenticateToken, requireAdmin, updateSoldCount);

// Добавьте эти маршруты
router.put('/products/:productId/full', authenticateToken, requireAdmin, updateProductFull);
router.post('/upload', authenticateToken, requireAdmin, upload.array('images', 10), uploadImages);

// Маршруты для управления Обвёртками для цветов админа
router.post('/wrappers', authenticateToken, requireAdmin, createWrapper);
// router.get('/wrappers/available', getAvailableWrappers);
router.get('/wrappers', authenticateToken, requireAdmin, getAllWrappers);
// router.get('/wrappers/search', searchWrappers); // Поиск оберток
// router.get('/wrappers/:id', getWrapperById); // Получение по ID
router.put('/wrappers/:id', authenticateToken, requireAdmin, updateWrapper);
router.delete('/wrappers/:id', authenticateToken, requireAdmin, deleteWrapper);

// Маршруты для управления Дополнениями админом
router.post('/addons', authenticateToken, requireAdmin, createAddon);
// router.get('/addons/available', getAvailableAddons);
// router.get('/addons/type/:type', getAddonsByType);
router.get('/addons', authenticateToken, requireAdmin, getAllAddons);
// router.get('/addons/search', searchAddons); // Поиск дополнений
// router.get('/addons/:id', getAddonById); // Получение по ID
router.put('/addons/:id', authenticateToken, requireAdmin, updateAddon);
router.delete('/addons/:id', authenticateToken, requireAdmin, deleteAddon);

// Маршруты для статистики и истории продаж
router.get('/sales-history', authenticateToken, requireAdmin, getSalesHistory);
router.get('/sales-stats', authenticateToken, requireAdmin, getSalesStats);

// Маршруты для загрузки и управления изображениями
router.post('/upload',
    authenticateToken,
    requireAdmin,
    upload.single('image'),
    processImage,
    handleUploadError,
    async (req, res) => {
        try {
            if (!req.imageUrl) {
                throw new Error('Image processing failed');
            }
            res.status(200).json({
                imageUrl: req.imageUrl
            });
        } catch (error) {
            console.error('Error uploading image:', error);
            res.status(400).json({
                message: 'Ошибка при загрузке изображения'
            });
        }
    }
);

router.delete('/remove-image', authenticateToken, requireAdmin, removeImage);
router.delete('/images/:imageName', authenticateToken, requireAdmin, deleteImageByName);

export default router;