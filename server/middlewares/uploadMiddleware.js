// import multer from "multer";
// import path from "path";
// import fs from "fs";
// import sharp from "sharp";
// import {
//     fileURLToPath
// } from 'url';
//
// // Получаем __dirname для ES6 модулей
// const __filename = fileURLToPath(
//     import.meta.url);
// const __dirname = path.dirname(__filename);
//
// const uploadDir = 'uploads';
//
// // Инициализация хранилища Multer
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         if (!fs.existsSync(uploadDir)) {
//             fs.mkdirSync(uploadDir, {
//                 recursive: true
//             });
//         }
//         cb(null, uploadDir);
//     },
//     filename: (req, file, cb) => {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         cb(null, uniqueSuffix + path.extname(file.originalname));
//     }
// });
//
// // Фильтр файлов для изображений
// const fileFilter = (req, file, cb) => {
//     if (file.mimetype.startsWith('image/')) {
//         cb(null, true);
//     } else {
//         cb(new Error('Only image files are allowed!'), false);
//     }
// };
//
// const upload = multer({
//     storage: storage,
//     fileFilter: fileFilter,
//     limits: {
//         fileSize: 5 * 1024 * 1024 // 5MB limit
//     }
// });
//
// const processImage = async (req, res, next) => {
//     if (!req.file) return next();
//
//     try {
//         const originalImagePath = path.join(uploadDir, req.file.filename);
//         const image = sharp(originalImagePath);
//         const metadata = await image.metadata();
//
//         let resizedImage;
//         let resizedImagePath;
//
//         if (metadata.format === 'png') {
//             resizedImage = await image
//                 .resize({
//                     width: 800,
//                     height: 800,
//                     fit: 'inside'
//                 })
//                 .png({
//                     quality: 80
//                 })
//                 .toBuffer();
//             resizedImagePath = path.join(uploadDir, req.file.filename);
//         } else {
//             resizedImage = await image
//                 .resize({
//                     width: 800,
//                     height: 800,
//                     fit: 'inside'
//                 })
//                 .jpeg({
//                     quality: 80
//                 })
//                 .toBuffer();
//             resizedImagePath = path.join(uploadDir, path.parse(req.file.filename).name + '.jpeg');
//         }
//
//         fs.writeFileSync(resizedImagePath, resizedImage);
//         req.imageUrl = `/uploads/${path.basename(resizedImagePath)}`;
//
//         // Удаляем оригинальный файл если он был конвертирован
//         if (metadata.format !== 'png' && originalImagePath !== resizedImagePath) {
//             fs.unlinkSync(originalImagePath);
//         }
//
//         next();
//     } catch (error) {
//         console.error('Error processing image:', error);
//
//         // Удаляем временные файлы в случае ошибки
//         if (req.file) {
//             try {
//                 fs.unlinkSync(path.join(uploadDir, req.file.filename));
//             } catch (unlinkError) {
//                 console.error('Error deleting temp file:', unlinkError);
//             }
//         }
//
//         res.status(400).json({
//             message: 'Ошибка при обработке изображения'
//         });
//     }
// };
//
// // Middleware для обработки ошибок Multer
// const handleUploadError = (error, req, res, next) => {
//     if (error instanceof multer.MulterError) {
//         if (error.code === 'LIMIT_FILE_SIZE') {
//             return res.status(400).json({
//                 message: 'File too large'
//             });
//         }
//         return res.status(400).json({
//             message: error.message
//         });
//     } else if (error) {
//         return res.status(400).json({
//             message: error.message
//         });
//     }
//     next();
// };
//
// export {
//     upload,
//     processImage,
//     handleUploadError
// };



import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { fileURLToPath } from 'url';

// Получаем __dirname для ES6 модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '..', 'uploads');
const thumbnailsDir = path.join(uploadDir, 'thumbnails');

// Создаем директории если их нет
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true });
}

// Инициализация хранилища Multer - сохраняем сразу в thumbnails
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, thumbnailsDir); // Сохраняем сразу в папку thumbnails
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, uniqueSuffix + extension);
    }
});

// Фильтр файлов для изображений
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Функция для создания миниатюры (теперь это основное изображение)
const createThumbnail = async (imagePath, filename) => {
    try {
        const processedFilename = `thumb_${filename}`;
        const processedImagePath = path.join(thumbnailsDir, processedFilename);

        await sharp(imagePath)
            .resize(800, 800, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 })
            .toFile(processedImagePath);

        return `/uploads/thumbnails/${processedFilename}`;
    } catch (error) {
        console.error('Error creating thumbnail:', error);
        throw error;
    }
};

// Функция для удаления файлов
const deleteImageFiles = (filename) => {
    try {
        // Удаляем файл из папки thumbnails
        const imagePath = path.join(thumbnailsDir, filename);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        // Также удаляем файл с префиксом thumb_ если он существует
        const thumbFilename = `thumb_${filename}`;
        const thumbPath = path.join(thumbnailsDir, thumbFilename);
        if (fs.existsSync(thumbPath)) {
            fs.unlinkSync(thumbPath);
        }
    } catch (fileError) {
        console.error('Error deleting image files:', fileError);
    }
};

const processImage = async (req, res, next) => {
    if (!req.files || req.files.length === 0) return next();

    try {
        // Обрабатываем только первый файл (максимум 1 изображение для отзывов)
        const file = req.files[0];
        const originalImagePath = path.join(thumbnailsDir, file.filename);

        // Создаем обработанное изображение (миниатюру)
        const processedImageUrl = await createThumbnail(originalImagePath, file.filename);

        // Удаляем оригинальный временный файл
        if (fs.existsSync(originalImagePath)) {
            fs.unlinkSync(originalImagePath);
        }

        // Сохраняем URL обработанного изображения
        req.imageUrl = processedImageUrl;
        req.thumbnailUrl = processedImageUrl; // Для совместимости

        next();
    } catch (error) {
        console.error('Error processing image:', error);

        // Удаляем временные файлы в случае ошибки
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                try {
                    const filePath = path.join(thumbnailsDir, file.filename);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (unlinkError) {
                    console.error('Error deleting temp file:', unlinkError);
                }
            });
        }

        res.status(400).json({
            message: 'Ошибка при обработке изображения'
        });
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

export {
    upload,
    processImage,
    handleUploadError,
    deleteImageFiles,
    createThumbnail
};