import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ProductReviews.css';

const ProductReviews = ({ productId }) => {
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState({
        rating: 5,
        comment: ''
    });
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [hasCompletedPurchase, setHasCompletedPurchase] = useState(false);
    const [userReview, setUserReview] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);

    const [adminReplyText, setAdminReplyText] = useState('');
    const [replyingToReviewId, setReplyingToReviewId] = useState(null);
    const [editingAdminReplyId, setEditingAdminReplyId] = useState(null);

    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [isSubmittingAdminReply, setIsSubmittingAdminReply] = useState(false);

    // Состояния для изображений
    const [selectedImage, setSelectedImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Функции для работы с изображением
    const handleImageSelect = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        // Проверяем размер файла
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Файл слишком большой (макс. 5MB)');
            return;
        }

        // Проверяем тип файла
        if (!file.type.startsWith('image/')) {
            toast.error('Файл не является изображением');
            return;
        }

        // Освобождаем предыдущее превью
        if (selectedImage) {
            URL.revokeObjectURL(selectedImage.preview);
        }

        // Создаем новое превью
        const newImage = {
            file,
            preview: URL.createObjectURL(file),
            id: Math.random().toString(36).substr(2, 9)
        };

        setSelectedImage(newImage);
        e.target.value = ''; // Сбрасываем input
    };

    const removeImage = () => {
        if (selectedImage) {
            URL.revokeObjectURL(selectedImage.preview);
            setSelectedImage(null);
        }
    };

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        setIsLoggedIn(!!token);

        if (productId) {
            fetchReviews();
            if (token) {
                checkReviewAbility();
            } else {
                setIsLoading(false);
            }
        }
    }, [productId]);

    const fetchReviews = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/reviews/product/${productId}`
            );
            setReviews(response.data);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            toast.error('Ошибка при загрузке отзывов');
        }
    };

    const checkReviewAbility = async () => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/reviews/can-review/${productId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setHasCompletedPurchase(response.data.hasPurchased);
            setUserRole(response.data.userRole);

            if (response.data.existingReview) {
                setUserReview(response.data.existingReview);
                setNewReview({
                    rating: response.data.existingReview.rating,
                    comment: response.data.existingReview.comment
                });
            } else {
                setNewReview({ rating: 5, comment: '' });
            }
        } catch (error) {
            console.error('Error checking review ability:', error);
            setHasCompletedPurchase(false);
            setUserRole(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!newReview.comment.trim()) {
            toast.error('Пожалуйста, напишите комментарий');
            return;
        }

        setIsSubmittingReview(true);
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('productId', productId);
            formData.append('rating', newReview.rating);
            formData.append('comment', newReview.comment);

            // Добавляем изображение, если есть
            if (selectedImage) {
                formData.append('images', selectedImage.file);
            }

            if (userReview) {
                await axios.put(
                    `${process.env.REACT_APP_API_URL}/api/reviews/${userReview._id}`,
                    formData,
                    {
                        headers: {
                            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
                toast.success('Отзыв успешно обновлен!');
            } else {
                await axios.post(
                    `${process.env.REACT_APP_API_URL}/api/reviews`,
                    formData,
                    {
                        headers: {
                            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
                toast.success('Отзыв успешно добавлен!');
            }

            // Сбрасываем состояние
            setNewReview({ rating: 5, comment: '' });
            if (selectedImage) {
                URL.revokeObjectURL(selectedImage.preview);
                setSelectedImage(null);
            }
            setIsEditing(false);
            fetchReviews();
            checkReviewAbility();
        } catch (error) {
            console.error('Error submitting review:', error);
            toast.error(error.response?.data?.message || 'Ошибка при отправке отзыва');
        } finally {
            setIsSubmittingReview(false);
            setIsUploading(false);
        }
    };

    const handleEditReview = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        // Освобождаем память от превью
        if (selectedImage) {
            URL.revokeObjectURL(selectedImage.preview);
            setSelectedImage(null);
        }

        if (userReview) {
            setNewReview({
                rating: userReview.rating,
                comment: userReview.comment
            });
        } else {
            setNewReview({ rating: 5, comment: '' });
        }
    };

    const handleDeleteImage = async (reviewId, imageId) => {
        try {
            await axios.delete(
                `${process.env.REACT_APP_API_URL}/api/reviews/${reviewId}/images/${imageId}`,
                {
                    headers: {
                        Authorization: `Bearer ${sessionStorage.getItem('token')}`
                    }
                }
            );
            toast.success('Изображение удалено');
            fetchReviews();
            if (userReview && userReview._id === reviewId) {
                checkReviewAbility();
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            toast.error('Ошибка при удалении изображения');
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот отзыв?')) {
            return;
        }

        try {
            await axios.delete(
                `${process.env.REACT_APP_API_URL}/api/reviews/${reviewId}`,
                {
                    headers: {
                        Authorization: `Bearer ${sessionStorage.getItem('token')}`
                    }
                }
            );
            toast.success('Отзыв успешно удален!');
            fetchReviews();
            if (userReview && userReview._id === reviewId) {
                setUserReview(null);
                setNewReview({ rating: 5, comment: '' });
            }
        } catch (error) {
            console.error('Error deleting review:', error);
            toast.error(error.response?.data?.message || 'Ошибка при удалении отзыва');
        }
    };

    const handleAdminReply = async (reviewId) => {
        if (!adminReplyText.trim()) {
            toast.error('Пожалуйста, напишите ответ');
            return;
        }

        setIsSubmittingAdminReply(true);
        try {
            if (editingAdminReplyId) {
                await axios.put(
                    `${process.env.REACT_APP_API_URL}/api/reviews/${reviewId}/reply`,
                    { reply: adminReplyText },
                    {
                        headers: {
                            Authorization: `Bearer ${sessionStorage.getItem('token')}`
                        }
                    }
                );
                toast.success('Ответ администратора обновлен!');
            } else {
                await axios.post(
                    `${process.env.REACT_APP_API_URL}/api/reviews/${reviewId}/reply`,
                    { reply: adminReplyText },
                    {
                        headers: {
                            Authorization: `Bearer ${sessionStorage.getItem('token')}`
                        }
                    }
                );
                toast.success('Ответ администратора сохранен!');
            }

            setAdminReplyText('');
            setReplyingToReviewId(null);
            setEditingAdminReplyId(null);
            fetchReviews();
        } catch (error) {
            console.error('Error submitting admin reply:', error);
            toast.error(error.response?.data?.message || 'Ошибка при отправке ответа');
        } finally {
            setIsSubmittingAdminReply(false);
        }
    };

    const handleEditAdminReply = (review) => {
        setAdminReplyText(review.ownerReply || '');
        setReplyingToReviewId(review._id);
        setEditingAdminReplyId(review._id);
    };

    const handleCancelAdminReply = () => {
        setAdminReplyText('');
        setReplyingToReviewId(null);
        setEditingAdminReplyId(null);
    };

    const RatingStars = ({ rating, size = 'medium' }) => {
        return (
            <div className={`rating-stars ${size}`}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className={`star ${star <= rating ? 'filled' : 'empty'}`}
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="reviews-loading">
                <div className="spinner"></div>
                <p>Загрузка отзывов...</p>
            </div>
        );
    }

    const filteredReviews = reviews.filter(review =>
        review.user !== null && (!userReview || review._id !== userReview._id)
    );

    return (
        <div className="product-reviews">
            <div className="reviews-header">
                <h3 className="reviews-title">Отзывы о товаре</h3>
                <div className="reviews-stats">
                    <span className="reviews-count">{reviews.length} отзывов</span>
                </div>
            </div>

            {/* Форма добавления/редактирования отзыва */}
            {isLoggedIn && hasCompletedPurchase && (
                <div className="review-form-section">
                    {!userReview || isEditing ? (
                        <div className={`review-form ${isEditing ? 'editing' : ''}`}>
                            <h4>{isEditing ? 'Редактировать отзыв' : 'Оставьте ваш отзыв'}</h4>

                            <div className="rating-selector">
                                <label>Ваша оценка:</label>
                                <div className="stars-selector">
                                    {[5, 4, 3, 2, 1].map((rating) => (
                                        <React.Fragment key={rating}>
                                            <input
                                                type="radio"
                                                id={`star-${rating}`}
                                                name="rating"
                                                value={rating}
                                                checked={newReview.rating === rating}
                                                onChange={(e) => setNewReview({
                                                    ...newReview,
                                                    rating: parseInt(e.target.value)
                                                })}
                                            />
                                            <label
                                                htmlFor={`star-${rating}`}
                                                title={`${rating} звезд${rating === 1 ? 'а' : rating < 5 ? 'ы' : ''}`}
                                            >
                                                ★
                                            </label>
                                        </React.Fragment>
                                    ))}
                                </div>
                                <span className="rating-text">
                                    {newReview.rating === 5 && 'Отлично'}
                                    {newReview.rating === 4 && 'Хорошо'}
                                    {newReview.rating === 3 && 'Удовлетворительно'}
                                    {newReview.rating === 2 && 'Плохо'}
                                    {newReview.rating === 1 && 'Ужасно'}
                                </span>
                            </div>

                            <div className="comment-field">
                                <textarea
                                    placeholder="Поделитесь вашими впечатлениями о товаре..."
                                    value={newReview.comment}
                                    onChange={(e) => setNewReview({
                                        ...newReview,
                                        comment: e.target.value
                                    })}
                                    maxLength="1000"
                                />
                                <div className="char-counter">
                                    {newReview.comment.length}/1000
                                </div>
                            </div>

                            {/* Секция загрузки изображения */}
                            <div className="image-upload-section">
                                <label className="image-upload-label">
                                    <span>📷 Добавить фото (опционально)</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="image-upload-input"
                                        disabled={isUploading || selectedImage}
                                    />
                                </label>

                                {selectedImage && (
                                    <div className="image-preview-single">
                                        <div className="image-preview">
                                            <img src={selectedImage.preview} alt="Preview" />
                                            <button
                                                type="button"
                                                className="remove-image-btn"
                                                onClick={removeImage}
                                                disabled={isUploading}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="image-upload-hint">
                                    {selectedImage ? '1/1 изображение' : 'Макс. 1 изображение · 5MB'}
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    className="btn-submit"
                                    onClick={handleSubmitReview}
                                    disabled={isSubmittingReview || !newReview.comment.trim()}
                                >
                                    {isSubmittingReview ? (
                                        <>
                                            <span className="spinner-small"></span>
                                            {userReview ? 'Обновление...' : 'Отправка...'}
                                        </>
                                    ) : (
                                        userReview ? 'Сохранить изменения' : 'Опубликовать отзыв'
                                    )}
                                </button>
                                {isEditing && (
                                    <button
                                        className="btn-cancel"
                                        onClick={handleCancelEdit}
                                        disabled={isSubmittingReview}
                                    >
                                        Отмена
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="user-review-card">
                            <div className="review-card-header">
                                <h4>Ваш отзыв</h4>
                                <div className="user-review-actions">
                                    <button
                                        className="btn-edit"
                                        onClick={handleEditReview}
                                    >
                                        Редактировать
                                    </button>
                                    <button
                                        className="btn-delete-user"
                                        onClick={() => handleDeleteReview(userReview._id)}
                                    >
                                        Удалить отзыв
                                    </button>
                                </div>
                            </div>
                            <div className="review-card-content">
                                <div className="review-meta">
                                    <RatingStars rating={userReview.rating} />
                                    <span className="review-date">
                                        {new Date(userReview.createdAt).toLocaleDateString('ru-RU')}
                                    </span>
                                    <span className="verified-badge">✓ Подтвержденная покупка</span>
                                </div>
                                <p className="review-comment">{userReview.comment}</p>

                                {/* Отображение изображения в отзыве пользователя */}
                                {userReview.images && userReview.images.length > 0 && (
                                    <div className="review-images">
                                        <div className="images-grid">
                                            {userReview.images.map((image, imgIndex) => (
                                                <div key={image._id || imgIndex} className="review-image-item">
                                                    <img
                                                        src={`${process.env.REACT_APP_API_URL}${image.url}`}
                                                        alt={`Фото отзыва`}
                                                        onClick={() => window.open(`${process.env.REACT_APP_API_URL}${image.url}`, '_blank')}
                                                    />
                                                    <button
                                                        className="delete-image-btn"
                                                        onClick={() => handleDeleteImage(userReview._id, image._id)}
                                                        title="Удалить изображение"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {userReview.ownerReply && (
                                    <div className="owner-reply">
                                        <div className="owner-reply-header">
                                            <span className="reply-author">💼 Ответ магазина</span>
                                            <span className="reply-date">
                                                {new Date(userReview.ownerReplyDate).toLocaleDateString('ru-RU')}
                                            </span>
                                        </div>
                                        <p className="reply-text">{userReview.ownerReply}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Уведомления о статусе */}
            {isLoggedIn && !hasCompletedPurchase && userRole !== 'admin' && (
                <div className="review-notice info">
                    <div className="notice-icon">ℹ️</div>
                    <div className="notice-content">
                        <strong>Вы можете оставить отзыв после покупки</strong>
                        <p>Отзывы могут оставлять только покупатели, которые приобрели этот товар и получили заказ со статусом "Завершен"</p>
                    </div>
                </div>
            )}

            {!isLoggedIn && (
                <div className="review-notice warning">
                    <div className="notice-icon">🔒</div>
                    <div className="notice-content">
                        <strong>Войдите, чтобы оставить отзыв</strong>
                        <p>Авторизуйтесь, чтобы делиться своими впечатлениями о товарах</p>
                    </div>
                </div>
            )}

            {/* Список отзывов */}
            <div className="reviews-list">
                {filteredReviews.length === 0 ? (
                    <div className="no-reviews">
                        <div className="no-reviews-icon">💬</div>
                        <h4>Пока нет отзывов</h4>
                        <p>Будьте первым, кто поделится впечатлениями об этом товаре!</p>
                    </div>
                ) : (
                    filteredReviews.map((review) => (
                        <div key={review._id} className="review-card">
                            <div className="review-card-header">
                                <div className="reviewer-info">
                                    <span className="reviewer-name">
                                        {review.user ? review.user.name : 'Анонимный пользователь'}
                                    </span>
                                    <RatingStars rating={review.rating} />
                                </div>
                                <div className="review-meta">
                                    <span className="review-date">
                                        {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                                    </span>
                                    {review.verifiedPurchase && (
                                        <span className="verified-badge">✓ Подтвержденная покупка</span>
                                    )}
                                </div>
                            </div>

                            <div className="review-content">
                                <p className="review-text">{review.comment}</p>
                            </div>

                            {/* Отображение изображений в отзывах */}
                            {review.images && review.images.length > 0 && (
                                <div className="review-images">
                                    <div className="images-grid">
                                        {review.images.map((image, imgIndex) => (
                                            <div key={image._id || imgIndex} className="review-image-item">
                                                <img
                                                    src={`${process.env.REACT_APP_API_URL}${image.url}`}
                                                    alt={`Фото отзыва`}
                                                    onClick={() => window.open(`${process.env.REACT_APP_API_URL}${image.url}`, '_blank')}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Ответ владельца */}
                            {review.ownerReply && (
                                <div className="owner-reply">
                                    <div className="owner-reply-header">
                                        <span className="reply-author">💼 Ответ магазина</span>
                                        <span className="reply-date">
                                            {new Date(review.ownerReplyDate).toLocaleDateString('ru-RU')}
                                        </span>
                                    </div>
                                    <p className="reply-text">{review.ownerReply}</p>
                                </div>
                            )}

                            {/* Действия администратора */}
                            {isLoggedIn && userRole === 'admin' && (
                                <div className="admin-actions">
                                    {!review.ownerReply ? (
                                        <button
                                            className="btn-reply"
                                            onClick={() => {
                                                setReplyingToReviewId(review._id);
                                                setAdminReplyText('');
                                            }}
                                            disabled={isSubmittingAdminReply}
                                        >
                                            Ответить
                                        </button>
                                    ) : (
                                        <button
                                            className="btn-edit-reply"
                                            onClick={() => handleEditAdminReply(review)}
                                            disabled={isSubmittingAdminReply}
                                        >
                                            Редактировать ответ
                                        </button>
                                    )}
                                    <button
                                        className="btn-delete"
                                        onClick={() => handleDeleteReview(review._id)}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            )}

                            {/* Форма ответа администратора */}
                            {replyingToReviewId === review._id && (
                                <div className="admin-reply-form">
                                    <div className="reply-form-header">
                                        <h5>
                                            {editingAdminReplyId ? 'Редактирование ответа' : 'Ответ на отзыв'}
                                        </h5>
                                    </div>
                                    <textarea
                                        placeholder="Напишите ответ от имени магазина..."
                                        value={adminReplyText}
                                        onChange={(e) => setAdminReplyText(e.target.value)}
                                        maxLength="1000"
                                    />
                                    <div className="reply-form-actions">
                                        <button
                                            className="btn-submit-reply"
                                            onClick={() => handleAdminReply(review._id)}
                                            disabled={isSubmittingAdminReply || !adminReplyText.trim()}
                                        >
                                            {isSubmittingAdminReply ? (
                                                <>
                                                    <span className="spinner-small"></span>
                                                    {editingAdminReplyId ? 'Обновление...' : 'Отправка...'}
                                                </>
                                            ) : (
                                                editingAdminReplyId ? 'Обновить ответ' : 'Опубликовать ответ'
                                            )}
                                        </button>
                                        <button
                                            className="btn-cancel-reply"
                                            onClick={handleCancelAdminReply}
                                            disabled={isSubmittingAdminReply}
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProductReviews;