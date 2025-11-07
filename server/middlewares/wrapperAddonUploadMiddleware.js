import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { fileURLToPath } from 'url';

// Получаем __dirname для ES6 модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Создаем отдельные директории для обёрток и дополнений
const uploadsBaseDir = path.join(__dirname, '..', 'uploads');
const wrappersDir = path.join(uploadsBaseDir, 'wrappers');
const addonsDir = path.join(uploadsBaseDir, 'addons');

// Создаем директории если их нет
[uploadsBaseDir, wrappersDir, addonsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Функция для определения директории в зависимости от типа
const getDestination = (req, file, cb) => {
    const itemType = req.body.itemType || 'wrapper'; // По умолчанию wrapper
    const destination = itemType === 'addon' ? addonsDir : wrappersDir;
    cb(null, destination);
};

// Инициализация хранилища Multer
const storage = multer.diskStorage({
    destination: getDestination,
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, 'img-' + uniqueSuffix + extension);
    }
});

// Фильтр файлов для изображений
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Разрешены только файлы изображений!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // Только 1 файл
    }
});

// Функция для обработки и оптимизации изображения
const processWrapperAddonImage = async (req, res, next) => {
    if (!req.file) {
        return next(); // Если файла нет, переходим дальше (может быть URL)
    }

    try {
        const originalImagePath = req.file.path;
        const itemType = req.body.itemType || 'wrapper';
        const baseDir = itemType === 'addon' ? addonsDir : wrappersDir;

        // Создаем обработанное изображение
        const processedFilename = `optimized-${req.file.filename}`;
        const processedImagePath = path.join(baseDir, processedFilename);

        await sharp(originalImagePath)
            .resize(800, 800, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({
                quality: 80,
                progressive: true
            })
            .toFile(processedImagePath);

        // Удаляем оригинальный файл
        if (fs.existsSync(originalImagePath)) {
            fs.unlinkSync(originalImagePath);
        }

        // Сохраняем информацию о файле
        req.uploadedImage = {
            filename: processedFilename,
            path: processedImagePath,
            url: `/uploads/${itemType === 'addon' ? 'addons' : 'wrappers'}/${processedFilename}`,
            itemType: itemType
        };

        next();
    } catch (error) {
        console.error('Error processing image:', error);

        // Удаляем временные файлы в случае ошибки
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(400).json({
            message: 'Ошибка при обработке изображения'
        });
    }
};

// Функция для удаления файлов изображений
const deleteWrapperAddonImage = (imageUrl) => {
    try {
        if (!imageUrl) return;

        // Извлекаем имя файла из URL
        const filename = path.basename(imageUrl);

        // Пробуем удалить из обеих директорий (на всякий случай)
        const wrapperPath = path.join(wrappersDir, filename);
        const addonPath = path.join(addonsDir, filename);

        [wrapperPath, addonPath].forEach(filePath => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`✅ Удалено изображение: ${filename}`);
            }
        });
    } catch (error) {
        console.error('❌ Ошибка удаления изображения:', error);
    }
};

// Middleware для обработки ошибок Multer
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'Файл слишком большой (максимум 5MB)'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                message: 'Можно загрузить только 1 изображение'
            });
        }
        return res.status(400).json({
            message: `Ошибка загрузки файла: ${error.message}`
        });
    } else if (error) {
        return res.status(400).json({
            message: error.message
        });
    }
    next();
};

// Функция для получения физического пути файла по URL
const getImageFilePath = (imageUrl) => {
    try {
        if (!imageUrl) return null;

        // Извлекаем имя файла из URL
        const filename = path.basename(imageUrl);

        // Пробуем найти файл в обеих директориях
        const wrapperPath = path.join(wrappersDir, filename);
        const addonPath = path.join(addonsDir, filename);

        // Проверяем существование файлов
        if (fs.existsSync(wrapperPath)) {
            return wrapperPath;
        }
        if (fs.existsSync(addonPath)) {
            return addonPath;
        }

        return null;
    } catch (error) {
        console.error('Error getting image file path:', error);
        return null;
    }
};


export {
    upload,
    processWrapperAddonImage,
    handleUploadError,
    deleteWrapperAddonImage,
    getImageFilePath
};