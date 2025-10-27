import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import {
    fileURLToPath
} from 'url';

// Получаем __dirname для ES6 модулей
const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = 'uploads';

// Инициализация хранилища Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, {
                recursive: true
            });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
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

const processImage = async (req, res, next) => {
    if (!req.file) return next();

    try {
        const originalImagePath = path.join(uploadDir, req.file.filename);
        const image = sharp(originalImagePath);
        const metadata = await image.metadata();

        let resizedImage;
        let resizedImagePath;

        if (metadata.format === 'png') {
            resizedImage = await image
                .resize({
                    width: 800,
                    height: 800,
                    fit: 'inside'
                })
                .png({
                    quality: 80
                })
                .toBuffer();
            resizedImagePath = path.join(uploadDir, req.file.filename);
        } else {
            resizedImage = await image
                .resize({
                    width: 800,
                    height: 800,
                    fit: 'inside'
                })
                .jpeg({
                    quality: 80
                })
                .toBuffer();
            resizedImagePath = path.join(uploadDir, path.parse(req.file.filename).name + '.jpeg');
        }

        fs.writeFileSync(resizedImagePath, resizedImage);
        req.imageUrl = `/uploads/${path.basename(resizedImagePath)}`;

        // Удаляем оригинальный файл если он был конвертирован
        if (metadata.format !== 'png' && originalImagePath !== resizedImagePath) {
            fs.unlinkSync(originalImagePath);
        }

        next();
    } catch (error) {
        console.error('Error processing image:', error);

        // Удаляем временные файлы в случае ошибки
        if (req.file) {
            try {
                fs.unlinkSync(path.join(uploadDir, req.file.filename));
            } catch (unlinkError) {
                console.error('Error deleting temp file:', unlinkError);
            }
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
                message: 'File too large'
            });
        }
        return res.status(400).json({
            message: error.message
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
    handleUploadError
};