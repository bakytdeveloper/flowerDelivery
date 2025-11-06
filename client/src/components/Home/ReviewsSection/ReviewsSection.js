// components/ReviewsSection/ReviewsSection.js
import React, { useState, useEffect, useRef } from 'react';
import './ReviewsSection.css';

const ReviewsSection = () => {
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        fetchRecentReviews();
    }, []);

    const fetchRecentReviews = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/reviews/recent`);

            if (!response.ok) {
                throw new Error('Ошибка загрузки отзывов');
            }

            const data = await response.json();
            setReviews(data);
        } catch (err) {
            console.error('Error fetching recent reviews:', err);
            setError('Не удалось загрузить отзывы');
        } finally {
            setIsLoading(false);
        }
    };

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    // Обработчики для touch events
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeftStart, setScrollLeftStart] = useState(0);

    const handleTouchStart = (e) => {
        setIsDragging(true);
        setStartX(e.touches[0].pageX);
        setScrollLeftStart(scrollContainerRef.current.scrollLeft);
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.touches[0].pageX;
        const walk = (x - startX) * 2;
        scrollContainerRef.current.scrollLeft = scrollLeftStart - walk;
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    const RatingStars = ({ rating }) => {
        return (
            <div className="rating-stars-products">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className={`star-products ${star <= rating ? 'filled' : ''}`}
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short'
        });
    };

    const truncateText = (text, maxLength) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    };

    if (isLoading) {
        return (
            <section className="reviews-section">
                <div className="container">
                    <div className="reviews-loading">
                        <div className="spinner"></div>
                        <p>Загрузка отзывов...</p>
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="reviews-section">
                <div className="container">
                    <div className="reviews-error">
                        <p>{error}</p>
                    </div>
                </div>
            </section>
        );
    }

    if (reviews.length === 0) {
        return null;
    }

    return (
        <section className="reviews-section">
            <div className="container">
                <div className="reviews-header">
                    <h2 className="reviews-title">Отзывы наших клиентов</h2>
                    <p className="reviews-subtitle">Что говорят покупатели о наших цветах</p>
                </div>

                <div className="reviews-container">
                    {/* Кнопка прокрутки влево для десктопа */}
                    <button
                        className="scroll-btn scroll-btn-left d-none d-md-flex"
                        onClick={scrollLeft}
                        aria-label="Прокрутить влево"
                    >
                        ‹
                    </button>

                    {/* Контейнер для карточек с горизонтальным скроллом */}
                    <div
                        className="reviews-scroll-container"
                        ref={scrollContainerRef}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="reviews-scroll-wrapper">
                            {reviews.map((review) => (
                                <div key={review._id} className="review-card-compact">
                                    <div className="review-card-header">
                                        <div className="reviewer-info-compact">
                                            <div className="reviewer-name-compact">
                                                {review.user?.name || 'Аноним'}
                                            </div>
                                            <div className="review-date-compact">
                                                {formatDate(review.createdAt)}
                                            </div>
                                        </div>
                                        <RatingStars rating={review.rating} />
                                    </div>

                                    <div className="review-content-compact">
                                        <p className="review-text-compact">
                                            {truncateText(review.comment, 100)}
                                        </p>

                                        {review.images && review.images.length > 0 && (
                                            <div className="review-image-compact">
                                                <img
                                                    src={`${process.env.REACT_APP_API_URL}${review.images[0].url}`}
                                                    alt="Фото отзыва"
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}

                                        {review.ownerReply && (
                                            <div className="owner-reply-compact">
                                                <div className="reply-header-compact">
                                                    <span className="reply-author-compact">💼 Ответ магазина</span>
                                                </div>
                                                <p className="reply-text-compact">
                                                    {truncateText(review.ownerReply, 80)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Кнопка прокрутки вправо для десктопа */}
                    <button
                        className="scroll-btn scroll-btn-right d-none d-md-flex"
                        onClick={scrollRight}
                        aria-label="Прокрутить вправо"
                    >
                        ›
                    </button>
                </div>

                {/*/!* Индикаторы прокрутки для мобильных *!/*/}
                {/*<div className="scroll-indicators d-md-none ">*/}
                {/*    <button*/}
                {/*        className="scroll-indicator-btn"*/}
                {/*        onClick={scrollLeft}*/}
                {/*        aria-label="Прокрутить влево"*/}
                {/*    >*/}
                {/*        ‹*/}
                {/*    </button>*/}
                {/*    <span className="scroll-hint">Проведите для прокрутки</span>*/}
                {/*    <button*/}
                {/*        className="scroll-indicator-btn"*/}
                {/*        onClick={scrollRight}*/}
                {/*        aria-label="Прокрутить вправо"*/}
                {/*    >*/}
                {/*        ›*/}
                {/*    </button>*/}
                {/*</div>*/}
            </div>
        </section>
    );
};

export default ReviewsSection;