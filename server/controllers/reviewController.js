import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import {
    transporter
} from '../smtp/otpService.js';

// Функция для отправки уведомлений о плохом отзыве
// Функция для отправки уведомлений о плохом отзыве
async function notifyAboutBadReview(review, productId) {
    try {
        const product = await Product.findById(productId);
        if (!product) return;

        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

        if (!adminEmail) return;

        // Получаем информацию о пользователе
        const user = await User.findById(review.user);
        const userName = user ? user.name : 'Анонимный пользователь';

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
                        <p><strong>Дата:</strong> ${new Date(review.createdAt).toLocaleString('ru-RU')}</p>
                        <p><strong>Товар:</strong> ${product.name} (ID: ${product._id})</p>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background: #f0fff4; border-radius: 8px;">
                        <p><strong>Рекомендуемые действия:</strong></p>
                        <ul>
                            <li>Ответить на отзыв в системе</li>
                            <li>Связаться с клиентом для решения проблемы</li>
                            <li>Проверить качество товара</li>
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
                Дата: ${new Date(review.createdAt).toLocaleString('ru-RU')}
                
                Требуется ваше внимание!`
        };

        await transporter.sendMail(mailOptions);
        console.log('Bad review notification sent to admin');
    } catch (error) {
        console.error('Error sending bad review notification:', error);
    }
}


// Контроллер для проверки возможности оставить отзыв
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

        // Для админов не нужно проверять покупки
        if (req.user.role === 'admin') {
            return res.json({
                canReview: false,
                hasPurchased: false,
                existingReview: null,
                userRole: req.user.role,
                userInfo: userInfo
            });
        }

        // Проверяем покупку товара в новой структуре заказа
        const orders = await Order.find({
            $or: [
                { user: userId },
                { 'guestInfo.email': req.user.email }
            ],
            status: 'completed'
        });

        let hasPurchased = false;

        for (const order of orders) {
            // Проверяем flowerItems
            for (const flowerItem of order.flowerItems) {
                if (flowerItem.product && flowerItem.product.toString() === productId) {
                    hasPurchased = true;
                    break;
                }
            }

            if (hasPurchased) break;

            // Если не нашли в flowerItems, проверяем addonItems
            for (const addonItem of order.addonItems) {
                if (addonItem.addonId && addonItem.addonId.toString() === productId) {
                    hasPurchased = true;
                    break;
                }
            }

            if (hasPurchased) break;
        }

        // Проверяем существующий отзыв
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

// Контроллер для создания отзыва
// Контроллер для создания отзыва
export const createReview = async (req, res) => {
    const { productId, rating, comment } = req.body;
    const userId = req.user.userId;

    // Валидация входных данных
    if (!productId || !rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
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
        // Проверяем, покупал ли пользователь этот товар в новой структуре
        const orders = await Order.find({
            $or: [
                { user: userId },
                { 'guestInfo.email': req.user.email }
            ],
            status: 'completed'
        });

        let hasPurchased = false;

        for (const order of orders) {
            // Проверяем flowerItems
            for (const flowerItem of order.flowerItems) {
                if (flowerItem.product && flowerItem.product.toString() === productId) {
                    hasPurchased = true;
                    break;
                }
            }

            if (hasPurchased) break;

            // Проверяем addonItems
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

        // Проверяем, не оставлял ли уже пользователь отзыв на этот товар
        const existingReview = await Review.findOne({
            user: userId,
            product: productId
        });

        if (existingReview) {
            return res.status(400).json({
                message: 'Вы уже оставляли отзыв на этот товар'
            });
        }

        // Создаем новый отзыв
        const review = new Review({
            user: userId,
            product: productId,
            rating,
            comment: comment.trim(),
            verifiedPurchase: true
        });

        const savedReview = await review.save();

        // Если отзыв плохой (1 или 2 звезды), отправляем уведомление
        if (rating <= 2) {
            await notifyAboutBadReview(savedReview, productId);
        }

        // Попulate user data for response
        await savedReview.populate('user', 'name');

        res.status(201).json(savedReview);
    } catch (error) {
        console.error('Error creating review:', error);
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

        const updatedReview = await review.save();

        // Если рейтинг изменился на плохой (1 или 2 звезды) или был плохим и изменился
        if ((review.rating <= 2 && oldRating > 2) ||
            (review.rating <= 2 && req.body.comment && req.body.comment !== review.comment)) {
            await notifyAboutBadReview(updatedReview, review.product);
        }

        res.json(updatedReview);
    } catch (error) {
        res.status(400).json({
            message: error.message
        });
    }
};

// Контроллер для ответа администратора на отзыв
export const addAdminReply = async (req, res) => {
    try {
        const {
            reply
        } = req.body;
        if (!reply) {
            return res.status(400).json({
                message: 'Текст ответа обязателен'
            });
        }

        const updatedReview = await Review.findByIdAndUpdate(
            req.params.id, {
                adminReply: reply,
                adminReplyDate: new Date()
            }, {
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
        const {
            reply
        } = req.body;
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

        review.adminReply = reply;
        review.adminReplyDate = new Date();
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

        // Если пользователь не админ, проверяем что он автор отзыва
        if (req.user.role !== 'admin') {
            query.user = req.user.userId;
        }

        const deletedReview = await Review.findOneAndDelete(query);

        if (!deletedReview) {
            return res.status(404).json({
                message: 'Отзыв не найден или у вас нет прав на его удаление'
            });
        }

        res.json({
            message: 'Отзыв успешно удален'
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};