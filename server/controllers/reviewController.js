import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import {
    transporter
} from '../smtp/otpService.js';
import fs from 'fs';
import path from 'path';

// Функция для создания миниатюр
async function createThumbnail(imagePath, filename) {
    try {
        const sharp = await import('sharp');
        const thumbnailsDir = path.join('uploads', 'thumbnails');

        if (!fs.existsSync(thumbnailsDir)) {
            fs.mkdirSync(thumbnailsDir, { recursive: true });
        }

        const thumbnailPath = path.join(thumbnailsDir, `thumb_${filename}`);

        await sharp.default(imagePath)
            .resize(300, 300, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);

        return `/uploads/thumbnails/thumb_${filename}`;
    } catch (error) {
        console.error('Error creating thumbnail:', error);
        return null;
    }
}

// Функция для удаления файлов изображений
function deleteImageFiles(image) {
    try {
        // Удаляем основное изображение
        if (image.filename && fs.existsSync(path.join('uploads', image.filename))) {
            fs.unlinkSync(path.join('uploads', image.filename));
        }
        // Удаляем миниатюру
        if (image.thumbnailUrl) {
            const thumbFilename = path.basename(image.thumbnailUrl);
            const thumbPath = path.join('uploads', 'thumbnails', thumbFilename);
            if (fs.existsSync(thumbPath)) {
                fs.unlinkSync(thumbPath);
            }
        }
    } catch (fileError) {
        console.error('Error deleting image files:', fileError);
    }
}

// Функция для отправки уведомлений о плохом отзыве
async function notifyAboutBadReview(review, productId) {
    try {
        const product = await Product.findById(productId);
        if (!product) return;

        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

        if (!adminEmail) return;

        const user = await User.findById(review.user);
        const userName = user ? user.name : 'Анонимный пользователь';

        const hasPhotos = review.images && review.images.length > 0;
        const photosHtml = hasPhotos ?
            `<p><strong>Фотографии:</strong> Приложено фото к отзыву</p>` :
            '';

        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: adminEmail,
            subject: `🚨 Получен плохой отзыв на товар "${product.name}"`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h3 style="color: #e53e3e;">Получен плохой отзыв на товар "${product.name}"</h3>
                    
                    <div style="background: #fff5f5; padding: 15px; border-radius: 8px; border-left: 4px solid #e53e3e;">
                        <p><strong>Пользователь:</strong> ${userName}</p>
                        <p><strong>Оценка:</strong> ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)} (${review.rating}/5)</p>
                        <p><strong>Комментарий:</strong> ${review.comment}</p>
                        ${photosHtml}
                        <p><strong>Дата:</strong> ${new Date(review.createdAt).toLocaleString('ru-RU')}</p>
                        <p><strong>Товар:</strong> ${product.name} (ID: ${product._id})</p>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background: #f0fff4; border-radius: 8px;">
                        <p><strong>Рекомендуемые действия:</strong></p>
                        <ul>
                            <li>Ответить на отзыв в системе</li>
                            <li>Связаться с клиентом для решения проблемы</li>
                            <li>Проверить качество товара</li>
                            ${hasPhotos ? '<li>Просмотреть приложенное фото</li>' : ''}
                        </ul>
                    </div>
                    
                    <p style="margin-top: 20px; color: #718096;">
                        С уважением,<br>
                        Система уведомлений магазина
                    </p>
                </div>
            `,
            text: `🚨 ПОЛУЧЕН ПЛОХОЙ ОТЗЫВ

                Товар: ${product.name}
                Пользователь: ${userName}
                Оценка: ${review.rating}/5
                Комментарий: ${review.comment}
                ${hasPhotos ? `Фотографии: Приложено фото к отзыву` : ''}
                Дата: ${new Date(review.createdAt).toLocaleString('ru-RU')}
                
                Требуется ваше внимание!`
        };

        await transporter.sendMail(mailOptions);
        console.log('Bad review notification sent to admin');
    } catch (error) {
        console.error('Error sending bad review notification:', error);
    }
}

// В reviewController.js добавьте этот контроллер
export const getRecentReviews = async (req, res) => {
    try {
        const reviews = await Review.find({})
            .populate('user', 'name')
            .populate('product', 'name')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json(reviews);
    } catch (error) {
        console.error('Error fetching recent reviews:', error);
        res.status(500).json({
            message: 'Ошибка при получении отзывов'
        });
    }
};

// Контроллер для проверки возможности оставить отзыв
export const canReview = async (req, res) => {
    try {
        const userId = req.user.userId;
        const productId = req.params.productId;

        const userInfo = {
            userId: req.user.userId,
            role: req.user.role,
            name: req.user.name
        };

        if (req.user.role === 'admin') {
            return res.json({
                canReview: false,
                hasPurchased: false,
                existingReview: null,
                userRole: req.user.role,
                userInfo: userInfo
            });
        }

        const orders = await Order.find({
            $or: [
                { user: userId },
                { 'guestInfo.email': req.user.email }
            ],
            status: 'completed'
        });

        let hasPurchased = false;

        for (const order of orders) {
            for (const flowerItem of order.flowerItems) {
                if (flowerItem.product && flowerItem.product.toString() === productId) {
                    hasPurchased = true;
                    break;
                }
            }

            if (hasPurchased) break;

            for (const addonItem of order.addonItems) {
                if (addonItem.addonId && addonItem.addonId.toString() === productId) {
                    hasPurchased = true;
                    break;
                }
            }

            if (hasPurchased) break;
        }

        const existingReview = await Review.findOne({
            user: userId,
            product: productId
        });

        res.json({
            canReview: hasPurchased && !existingReview,
            hasPurchased,
            existingReview: existingReview ? {
                _id: existingReview._id,
                rating: existingReview.rating,
                comment: existingReview.comment,
                images: existingReview.images,
                createdAt: existingReview.createdAt,
                ownerReply: existingReview.ownerReply,
                ownerReplyDate: existingReview.ownerReplyDate
            } : null,
            userRole: req.user.role,
            userInfo: userInfo
        });
    } catch (error) {
        console.error('Error in canReview:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для получения отзывов товара
export const getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({
            product: req.params.productId
        })
            .populate('user', 'name')
            .sort({
                createdAt: -1
            });

        res.json(reviews);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для создания отзыва с фото
export const createReview = async (req, res) => {
    const { productId, rating, comment } = req.body;
    const userId = req.user.userId;

    if (!productId || !rating || rating < 1 || rating > 5) {
        return res.status(400).json({
            message: 'Неверные данные отзыва. Убедитесь, что оценка от 1 до 5 и productId указан'
        });
    }

    if (!comment || !comment.trim()) {
        return res.status(400).json({
            message: 'Комментарий не может быть пустым'
        });
    }

    try {
        const orders = await Order.find({
            $or: [
                { user: userId },
                { 'guestInfo.email': req.user.email }
            ],
            status: 'completed'
        });

        let hasPurchased = false;

        for (const order of orders) {
            for (const flowerItem of order.flowerItems) {
                if (flowerItem.product && flowerItem.product.toString() === productId) {
                    hasPurchased = true;
                    break;
                }
            }

            if (hasPurchased) break;

            for (const addonItem of order.addonItems) {
                if (addonItem.addonId && addonItem.addonId.toString() === productId) {
                    hasPurchased = true;
                    break;
                }
            }

            if (hasPurchased) break;
        }

        if (!hasPurchased) {
            return res.status(403).json({
                message: 'Вы можете оставить отзыв только на товары, которые вы приобрели и получили'
            });
        }

        const existingReview = await Review.findOne({
            user: userId,
            product: productId
        });

        if (existingReview) {
            return res.status(400).json({
                message: 'Вы уже оставляли отзыв на этот товар'
            });
        }

        // Обрабатываем загруженные файлы (максимум 1)
        const reviewImages = [];
        if (req.files && req.files.length > 0) {
            const file = req.files[0]; // Берем только первый файл
            const thumbnailUrl = await createThumbnail(file.path, file.filename);

            reviewImages.push({
                url: `/uploads/${file.filename}`,
                filename: file.filename,
                thumbnailUrl: thumbnailUrl
            });
        }

        const review = new Review({
            user: userId,
            product: productId,
            rating,
            comment: comment.trim(),
            images: reviewImages,
            verifiedPurchase: true
        });

        const savedReview = await review.save();

        if (rating <= 2) {
            await notifyAboutBadReview(savedReview, productId);
        }

        await savedReview.populate('user', 'name');

        res.status(201).json(savedReview);
    } catch (error) {
        console.error('Error creating review:', error);
        // Удаляем загруженные файлы в случае ошибки
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                try {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                } catch (fileError) {
                    console.error('Error deleting uploaded file:', fileError);
                }
            });
        }
        res.status(400).json({
            message: error.message || 'Произошла ошибка при создании отзыва'
        });
    }
};

// Контроллер для обновления отзыва
export const updateReview = async (req, res) => {
    try {
        const review = await Review.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!review) {
            return res.status(404).json({
                message: 'Отзыв не найден или у вас нет прав на его изменение'
            });
        }

        const oldRating = review.rating;
        review.rating = req.body.rating || review.rating;
        review.comment = req.body.comment || review.comment;

        console.log("review.rating", review.rating)

        // Обрабатываем новое загруженное изображение (заменяем старое)
        if (req.files && req.files.length > 0) {
            // Удаляем старые файлы изображений
            if (review.images && review.images.length > 0) {
                review.images.forEach(image => deleteImageFiles(image));
            }

            const file = req.files[0]; // Берем только первый файл
            const thumbnailUrl = await createThumbnail(file.path, file.filename);

            // Заменяем изображение
            review.images = [{
                url: `/uploads/${file.filename}`,
                filename: file.filename,
                thumbnailUrl: thumbnailUrl
            }];
        }

        const updatedReview = await review.save();

        if ((review.rating <= 2 && oldRating > 2) ||
            (review.rating <= 2 && req.body.comment && req.body.comment !== review.comment)) {
            await notifyAboutBadReview(updatedReview, review.product);
        }

        res.json(updatedReview);
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(400).json({
            message: error.message
        });
    }
};

// Контроллер для удаления фото из отзыва
export const deleteReviewImage = async (req, res) => {
    try {
        const { reviewId, imageId } = req.params;
        const userId = req.user.userId;

        const review = await Review.findOne({
            _id: reviewId,
            user: userId
        });

        if (!review) {
            return res.status(404).json({
                message: 'Отзыв не найден или у вас нет прав на его изменение'
            });
        }

        const imageToDelete = review.images.id(imageId);
        if (!imageToDelete) {
            return res.status(404).json({
                message: 'Изображение не найдено'
            });
        }

        // Удаляем файлы с диска
        deleteImageFiles(imageToDelete);

        // Удаляем изображение из массива
        review.images.pull(imageId);
        await review.save();

        res.json({
            message: 'Изображение успешно удалено',
            review
        });
    } catch (error) {
        console.error('Error deleting review image:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для ответа администратора на отзыв
export const addAdminReply = async (req, res) => {
    try {
        const { reply } = req.body;
        if (!reply) {
            return res.status(400).json({
                message: 'Текст ответа обязателен'
            });
        }

        const updatedReview = await Review.findByIdAndUpdate(
            req.params.id,
            {
                ownerReply: reply,
                ownerReplyDate: new Date()
            },
            {
                new: true
            }
        );

        if (!updatedReview) {
            return res.status(404).json({
                message: 'Отзыв не найден'
            });
        }

        res.json(updatedReview);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для обновления ответа администратора
export const updateAdminReply = async (req, res) => {
    try {
        const { reply } = req.body;
        if (!reply) {
            return res.status(400).json({
                message: 'Текст ответа обязателен'
            });
        }

        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({
                message: 'Отзыв не найден'
            });
        }

        review.ownerReply = reply;
        review.ownerReplyDate = new Date();
        const updatedReview = await review.save();

        res.json(updatedReview);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для удаления отзыва
export const deleteReview = async (req, res) => {
    try {
        const query = {
            _id: req.params.id
        };

        if (req.user.role !== 'admin') {
            query.user = req.user.userId;
        }

        const review = await Review.findOne(query);

        if (!review) {
            return res.status(404).json({
                message: 'Отзыв не найден или у вас нет прав на его удаление'
            });
        }

        // Удаляем связанные файлы изображений
        if (review.images && review.images.length > 0) {
            review.images.forEach(image => deleteImageFiles(image));
        }

        await Review.findOneAndDelete(query);

        res.json({
            message: 'Отзыв успешно удален'
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};