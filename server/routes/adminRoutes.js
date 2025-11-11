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

// Импортируем новый middleware для обёрток и дополнений
import {
    upload as wrapperAddonUpload,
    processWrapperAddonImage,
    handleUploadError as handleWrapperAddonUploadError,
    deleteWrapperAddonImage
} from '../middlewares/wrapperAddonUploadMiddleware.js';

import {
    createAddon,
    deleteAddon,
    getAllAddons,
    updateAddon,
} from "../controllers/addonController.js";
import {
    createWrapper,
    deleteWrapper,
    getAllWrappers,
    updateWrapper,
} from "../controllers/wrapperController.js";

import { upload as productUpload, handleUploadError as handleProductUploadError } from '../middlewares/productUploadMiddleware.js';


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
// router.post('/upload', authenticateToken, requireAdmin, upload.array('images', 10), uploadImages);

router.post('/upload',
    authenticateToken,
    requireAdmin,
    productUpload.array('images', 10),
    handleProductUploadError,
    uploadImages
);


// Маршруты для управления Обвёртками для цветов админа
router.post('/wrappers', authenticateToken, requireAdmin, createWrapper);
router.get('/wrappers', authenticateToken, requireAdmin, getAllWrappers);
router.put('/wrappers/:id', authenticateToken, requireAdmin, updateWrapper);
router.delete('/wrappers/:id', authenticateToken, requireAdmin, deleteWrapper);

// Маршруты для управления Дополнениями админом
router.post('/addons', authenticateToken, requireAdmin, createAddon);
router.get('/addons', authenticateToken, requireAdmin, getAllAddons);
router.put('/addons/:id', authenticateToken, requireAdmin, updateAddon);
router.delete('/addons/:id', authenticateToken, requireAdmin, deleteAddon);

// НОВЫЕ МАРШРУТЫ ДЛЯ ЗАГРУЗКИ ИЗОБРАЖЕНИЙ ОБЁРТОК И ДОПОЛНЕНИЙ
router.post('/upload-wrapper-addon-image',
    authenticateToken,
    requireAdmin,
    wrapperAddonUpload.single('image'),
    processWrapperAddonImage,
    handleWrapperAddonUploadError,
    async (req, res) => {
        try {
            if (!req.uploadedImage && !req.body.imageUrl) {
                return res.status(400).json({
                    message: 'Необходимо предоставить изображение или URL'
                });
            }

            // Если загружено новое изображение
            if (req.uploadedImage) {
                return res.status(200).json({
                    imageUrl: req.uploadedImage.url,
                    filename: req.uploadedImage.filename,
                    itemType: req.uploadedImage.itemType
                });
            }

            // Если используется URL
            if (req.body.imageUrl) {
                try {
                    new URL(req.body.imageUrl); // Проверяем валидность URL
                    return res.status(200).json({
                        imageUrl: req.body.imageUrl,
                        source: 'url'
                    });
                } catch (urlError) {
                    return res.status(400).json({
                        message: 'Некорректный URL изображения'
                    });
                }
            }

        } catch (error) {
            console.error('Error uploading wrapper/addon image:', error);
            res.status(400).json({
                message: 'Ошибка при загрузке изображения'
            });
        }
    }
);

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