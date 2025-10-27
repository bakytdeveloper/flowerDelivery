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
    deleteImageByName
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

const router = express.Router();

// Маршруты для управления товарами админа
router.get('/products', authenticateToken, requireAdmin, getAdminProducts);
router.post('/products', authenticateToken, requireAdmin, createProduct);
router.post('/products/check-duplicate', authenticateToken, requireAdmin, checkProductDuplicate);
router.get('/products/:productId', authenticateToken, requireAdmin, getProduct);
router.put('/products/:productId', authenticateToken, requireAdmin, updateProduct);
router.delete('/products/:productId', authenticateToken, requireAdmin, deleteProduct);
router.put('/products/:productId/sold-count', authenticateToken, requireAdmin, updateSoldCount);

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