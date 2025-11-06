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

    const [selectedImage, setSelectedImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Функции для работы с изображением
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Файл слишком большой (макс. 5MB)');
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Файл не является изображением');
            return;
        }

        if (selectedImage) {
            URL.revokeObjectURL(selectedImage.preview);
        }

        const newImage = {
            file,
            preview: URL.createObjectURL(file),
            id: Math.random().toString(36).substr(2, 9)
        };

        setSelectedImage(newImage);
        e.target.value = '';
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

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('productId', productId);
            formData.append('rating', newReview.rating);
            formData.append('comment', newReview.comment);

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
            setIsUploading(false);
        }
    };

    const handleEditReview = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
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

    // Функции для горизонтального скролла
    const scrollReviews = (direction) => {
        const container = document.querySelector('.reviews-scroll-container');
        if (container) {
            const scrollAmount = 400;
            container.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
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
            <div className="reviews-loading-dark">
                <div className="spinner"></div>
                <p>Загрузка отзывов...</p>
            </div>
        );
    }

    const filteredReviews = reviews.filter(review =>
        review.user !== null && (!userReview || review._id !== userReview._id)
    );

    return (
        <div className="product-reviews-dark">
            <div className="reviews-header-dark">
                <h3 className="reviews-title-dark">Отзывы о товаре</h3>
                <div className="reviews-stats-dark">
                    <span className="reviews-count-dark">{reviews.length} отзывов</span>
                </div>
            </div>

            {/* Форма добавления/редактирования отзыва */}
            {isLoggedIn && hasCompletedPurchase && (
                <div className="review-form-dark">
                    {!userReview || isEditing ? (
                        <div className={`review-form-content ${isEditing ? 'editing' : ''}`}>
                            <h4>{isEditing ? 'Редактировать отзыв' : 'Оставьте ваш отзыв'}</h4>

                            <div className="rating-selector-dark">
                                <label>Ваша оценка:</label>
                                <div className="stars-selector-dark">
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
                                <span className="rating-text-dark">
                                    {newReview.rating === 5 && 'Отлично'}
                                    {newReview.rating === 4 && 'Хорошо'}
                                    {newReview.rating === 3 && 'Удовлетворительно'}
                                    {newReview.rating === 2 && 'Плохо'}
                                    {newReview.rating === 1 && 'Ужасно'}
                                </span>
                            </div>

                            <div className="comment-field-dark">
                                <textarea
                                    placeholder="Поделитесь вашими впечатлениями о товаре..."
                                    value={newReview.comment}
                                    onChange={(e) => setNewReview({
                                        ...newReview,
                                        comment: e.target.value
                                    })}
                                    maxLength="1000"
                                />
                                <div className="char-counter-dark">
                                    {newReview.comment.length}/1000
                                </div>
                            </div>

                            <div className="image-upload-section-dark">
                                <label className="image-upload-label-dark">
                                    <span>📷 Добавить фото (опционально)</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="image-upload-input-dark"
                                        disabled={isUploading || selectedImage}
                                    />
                                </label>

                                {selectedImage && (
                                    <div className="image-preview-single-dark">
                                        <div className="image-preview-dark">
                                            <img src={selectedImage.preview} alt="Preview" />
                                            <button
                                                type="button"
                                                className="remove-image-btn-dark"
                                                onClick={removeImage}
                                                disabled={isUploading}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-actions-dark">
                                <button
                                    className="btn-submit-dark"
                                    onClick={handleSubmitReview}
                                    disabled={isUploading || !newReview.comment.trim()}
                                >
                                    {isUploading ? (
                                        <>
                                            <span className="spinner-small-dark"></span>
                                            {userReview ? 'Обновление...' : 'Отправка...'}
                                        </>
                                    ) : (
                                        userReview ? 'Сохранить изменения' : 'Опубликовать отзыв'
                                    )}
                                </button>
                                {isEditing && (
                                    <button
                                        className="btn-cancel-dark"
                                        onClick={handleCancelEdit}
                                        disabled={isUploading}
                                    >
                                        Отмена
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="user-review-card-dark">
                            <div className="review-card-header-dark">
                                <h4>Ваш отзыв</h4>
                                <div className="user-review-actions-dark">
                                    <button
                                        className="btn-edit-dark"
                                        onClick={handleEditReview}
                                    >
                                        Редактировать
                                    </button>
                                    <button
                                        className="btn-delete-user-dark"
                                        onClick={() => handleDeleteReview(userReview._id)}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                            <div className="review-card-content-dark">
                                <div className="review-meta-dark">
                                    <RatingStars rating={userReview.rating} />
                                    <span className="review-date-dark">
                                        {new Date(userReview.createdAt).toLocaleDateString('ru-RU')}
                                    </span>
                                </div>
                                <p className="review-comment-dark">{userReview.comment}</p>

                                {userReview.images && userReview.images.length > 0 && (
                                    <div className="review-images-horizontal">
                                        <div className="images-grid-horizontal">
                                            {userReview.images.map((image, imgIndex) => (
                                                <div key={image._id || imgIndex} className="review-image-item-horizontal">
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
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Уведомления о статусе */}
            {isLoggedIn && !hasCompletedPurchase && userRole !== 'admin' && (
                <div className="review-notice-dark info">
                    <div className="notice-icon-dark">ℹ️</div>
                    <div className="notice-content-dark">
                        <strong>Вы можете оставить отзыв после покупки</strong>
                        <p>Отзывы могут оставлять только покупатели, которые приобрели этот товар</p>
                    </div>
                </div>
            )}

            {!isLoggedIn && (
                <div className="review-notice-dark warning">
                    <div className="notice-icon-dark">🔒</div>
                    <div className="notice-content-dark">
                        <strong>Войдите, чтобы оставить отзыв</strong>
                        <p>Авторизуйтесь, чтобы делиться своими впечатлениями о товарах</p>
                    </div>
                </div>
            )}

            {/* Горизонтальный скролл отзывов */}
            <div className="reviews-scroll-section">
                {filteredReviews.length > 0 && (
                    <>
                        <button
                            className="scroll-btn-reviews scroll-btn-reviews-left"
                            onClick={() => scrollReviews('left')}
                        >
                            ‹
                        </button>
                        <button
                            className="scroll-btn-reviews scroll-btn-reviews-right"
                            onClick={() => scrollReviews('right')}
                        >
                            ›
                        </button>
                    </>
                )}

                <div className="reviews-scroll-container">
                    {filteredReviews.length === 0 ? (
                        <div className="no-reviews-dark">
                            <div className="no-reviews-dark-icon">💬</div>
                            <h4>Пока нет отзывов</h4>
                            <p>Будьте первым, кто поделится впечатлениями!</p>
                        </div>
                    ) : (
                        filteredReviews.map((review) => (
                            <div key={review._id} className="review-card-horizontal">
                                <div className="review-header-horizontal">
                                    <div className="reviewer-info-horizontal">
                                        <div className="reviewer-name-horizontal">
                                            {review.user ? review.user.name : 'Анонимный пользователь'}
                                        </div>
                                        <div className="review-date-horizontal">
                                            {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                                        </div>
                                    </div>
                                    <div className="review-rating-horizontal">
                                        <RatingStars rating={review.rating} size="small" />
                                    </div>
                                </div>

                                <div className="review-content-horizontal">
                                    <p className="review-text-horizontal">{review.comment}</p>
                                </div>

                                {review.images && review.images.length > 0 && (
                                    <div className="review-images-horizontal">
                                        <div className="images-grid-horizontal">
                                            {review.images.map((image, imgIndex) => (
                                                <div key={image._id || imgIndex} className="review-image-item-horizontal">
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

                                {review.ownerReply && (
                                    <div className="owner-reply-horizontal">
                                        <div className="owner-reply-header-horizontal">
                                            <span className="reply-author-horizontal">💼 Ответ магазина</span>
                                            <span className="reply-date-horizontal">
                                                {new Date(review.ownerReplyDate).toLocaleDateString('ru-RU')}
                                            </span>
                                        </div>
                                        <p className="reply-text-horizontal">{review.ownerReply}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductReviews;