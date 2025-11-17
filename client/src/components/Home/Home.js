import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from "react-router-dom";
import './Home.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingSpinner from "../../LoadingSpinner";
import HitsSection from '../HitsSection/HitsSection';
import WhyChooseUs from "../WhyChooseUs/WhyChooseUs";
import SeasonalOffers from "../SeasonalOffers/SeasonalOffers";
import MapSection from "../MapSection/MapSection";
import InfoCardsSection from "../InfoCardsSection/InfoCardsSection";
import ReviewsSection from "./ReviewsSection/ReviewsSection";


const Home = ({ setShowSidebar, cartItems, setCartItems, setIsFooterCatalog, setSelectedGender, setSearchTerm, setSelectedCategory, setSelectedType }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slides, setSlides] = useState([]);
    // eslint-disable-next-line
    const [genderImages, setGenderImages] = useState([]);
    // eslint-disable-next-line
    const [carouselBgColor, setCarouselBgColor] = useState('#ffffff');
    const [isManualSwitch, setIsManualSwitch] = useState(false);
    // eslint-disable-next-line
    const [showNewestTitle, setShowNewestTitle] = useState(false);
    // eslint-disable-next-line
    const [hasNewestProducts, setHasNewestProducts] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const carouselRef = useRef(null);
    const location = useLocation();


    useEffect(() => {
        if (!hasNewestProducts) {
            setShowNewestTitle(true);
        }
    }, [hasNewestProducts]);

    const fetchHomeData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/homepage`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Безопасная установка данных
            setSlides(Array.isArray(data.sliderImages) ? data.sliderImages : []);
            setGenderImages(Array.isArray(data.genderImages) ? data.genderImages : []);
            setShowNewestTitle(!!data.showNewestTitle);

            if (data.sliderImages?.length > 0 && data.sliderImages[0]?.colorBackground) {
                setCarouselBgColor(data.sliderImages[0].colorBackground);
            }
        } catch (error) {
            console.error('Error fetching homepage data:', error);
            toast.error('Ошибка загрузки данных');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHomeData();
    }, []);

    useEffect(() => {
        if (location.pathname === '/') {
            setSelectedGender(null);
            setSelectedCategory(null);
            setSelectedType(null);
            setSearchTerm('');
        }
    }, [location.pathname, setSelectedGender, setSelectedCategory, setSelectedType, setSearchTerm]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (!isManualSwitch && slides.length > 0) {
                setCurrentSlide((prevSlide) => {
                    const newSlide = (prevSlide + 1) % slides.length;
                    if (slides[newSlide]?.colorBackground) {
                        setCarouselBgColor(slides[newSlide]?.colorBackground);
                    }
                    return newSlide;
                });
            }
        }, 5000);

        return () => clearInterval(interval);
        // eslint-disable-next-line
    }, [slides.length, isManualSwitch]);

    // useEffect(() => {
    //     const videoElement = videoRef.current;
    //
    //     if (slides[currentSlide]?.backgroundType === 'video' && videoElement) {
    //         setIsVideoLoaded(false);
    //         videoElement?.load();
    //
    //         const handleCanPlay = () => {
    //             setIsVideoLoaded(true);
    //             videoElement.play().catch(e => console.log('Autoplay prevented:', e));
    //         };
    //
    //         const handleError = () => {
    //             console.error('Video loading error');
    //             setIsVideoLoaded(false);
    //         };
    //
    //         videoElement?.addEventListener('canplay', handleCanPlay);
    //         videoElement?.addEventListener('error', handleError);
    //
    //         return () => {
    //             videoElement?.removeEventListener('canplay', handleCanPlay);
    //             videoElement?.removeEventListener('error', handleError);
    //         };
    //     }
    // }, [currentSlide, slides]);

    useEffect(() => {
        setShowSidebar(true);
        document.body.classList.remove('no-scroll');

        return () => {
            setShowSidebar(true);
            document.body.classList.remove('no-scroll');
        };
    }, [setShowSidebar]);

    const handleIndicatorClick = (index) => {
        if (index < 0 || index >= slides.length) return;

        setIsManualSwitch(true);

        if (carouselRef.current) {
            carouselRef.current.style.transition = 'transform 0.6s ease-in-out';
        }

        setCurrentSlide(index);

        if (slides[index]?.colorBackground) {
            setCarouselBgColor(slides[index].colorBackground);
        }

        const timeoutId = setTimeout(() => {
            setIsManualSwitch(false);
            if (carouselRef.current) {
                carouselRef.current.style.transition = '';
            }
        }, 5000);

        return () => clearTimeout(timeoutId);
    };

    const handleControlClick = (direction) => {
        setIsManualSwitch(true);
        setCurrentSlide((prevSlide) => {
            const newSlide = direction === 'prev'
                ? (prevSlide - 1 + slides.length) % slides.length
                : (prevSlide + 1) % slides.length;

            if (slides[newSlide]?.colorBackground) {
                setCarouselBgColor(slides[newSlide].colorBackground);
            }
            return newSlide;
        });

        const timeoutId = setTimeout(() => setIsManualSwitch(false), 5000);
        return () => clearTimeout(timeoutId);
    };

    useEffect(() => {
        try {
            const savedCart = sessionStorage.getItem('cartItems');
            if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                if (Array.isArray(parsedCart)) {
                    setCartItems(parsedCart);
                }
            }
        } catch (error) {
            console.error('Error parsing cart items:', error);
            sessionStorage.removeItem('cartItems');
        }
    }, [setCartItems]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    const safeSlides = Array.isArray(slides) ? slides : [];

    return (
        <div className="home-container" style={{ paddingBottom: '60px' }}>
            {/*/!* Скрытый прелоадер карты *!/*/}
            {/*{preloadMap && (*/}
            {/*    <div style={{ display: 'none' }}>*/}
            {/*        <iframe*/}
            {/*            src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d1733.8264014302763!2d74.70850274009078!3d43.02807312173589!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1z0JrQvtGA0LTQsNC5INGD0Lsu0JbQmNCR0JXQmiDQltCe0JvQqyAyMzQ!5e1!3m2!1sru!2skg!4v1761675010196!5m2!1sru!2skg"*/}
            {/*            width="1"*/}
            {/*            height="1"*/}
            {/*            style={{ display: 'none' }}*/}
            {/*            title="Preload Map"*/}
            {/*        />*/}
            {/*    </div>*/}
            {/*)}*/}
            <div
                id="carouselExampleCaptions"
                className="carousel slide"
                style={{
                    backgroundColor: safeSlides[currentSlide]?.backgroundType === 'color'
                        ? safeSlides[currentSlide]?.backgroundColor
                        : 'transparent',
                    backgroundImage: safeSlides[currentSlide]?.backgroundType === 'image'
                        ? `url(${safeSlides[currentSlide]?.backgroundImage})`
                        : 'none',
                }}
                ref={carouselRef}
            >
                {/*{safeSlides[currentSlide]?.backgroundType === 'video' && (*/}
                {/*    <video*/}
                {/*        ref={videoRef}*/}
                {/*        autoPlay*/}
                {/*        muted*/}
                {/*        loop*/}
                {/*        playsInline*/}
                {/*        preload="auto"*/}
                {/*        className="home-video"*/}
                {/*        style={{*/}
                {/*            opacity: isVideoLoaded ? 1 : 0,*/}
                {/*            transition: 'opacity 0.5s ease-in-out'*/}
                {/*        }}*/}
                {/*    >*/}
                {/*        <source src={safeSlides[currentSlide]?.backgroundVideo} type="video/mp4" />*/}
                {/*        Ваш браузер не поддерживает видео.*/}
                {/*    </video>*/}
                {/*)}*/}

                <div className="carousel-indicators">
                    {safeSlides.map((_, index) => (
                        <button
                            key={index}
                            type="button"
                            data-bs-target="#carouselExampleCaptions"
                            data-bs-slide-to={index}
                            className={`carousel-indicator ${index === currentSlide ? 'active' : ''}`}
                            aria-current={index === currentSlide ? 'true' : 'false'}
                            aria-label={`Slide ${index + 1}`}
                            onClick={() => handleIndicatorClick(index)}
                            style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                margin: '0 5px',
                                cursor: 'pointer',
                                border: '1px solid white',
                                backgroundColor: index === currentSlide ? '#000' : 'rgba(0,0,0,0.3)',
                                transition: 'background-color 0.3s ease'
                            }}
                        />
                    ))}
                </div>

                <div className="carousel-inner">
                    {safeSlides.map((slide, index) => (
                        <div
                            key={index}
                            className={`carousel-item ${index === currentSlide ? 'active' : ''}`}
                            style={{
                                height: '100%',
                                border: "none",
                                transition: 'transform 0.6s ease-in-out'
                            }}
                        >
                            <div className="carousel-item-image">
                                <img
                                    src={slide.url}
                                    className="d-block w-100 carousel-item-img"
                                    alt={`Slide ${index + 1}`}
                                    style={{
                                        opacity: index === currentSlide ? 1 : 0,
                                        transition: 'opacity 0.5s ease-in-out'
                                    }}
                                />
                            </div>
                            <div className="carousel-caption d-md-block carousel-caption-title-description">
                                <div
                                    className="carousel-caption-title"
                                    style={{
                                        color: slide.colorTitle || '#000000',
                                        fontSize: slide.fontSizeTitle,
                                        fontFamily: slide.fontFamilleTitle || 'Arial',
                                        transition: 'all 0.5s ease-in-out'
                                    }}
                                >
                                    {slide.promotions?.[0]?.title || 'ГОТОВЬСЯ К ЛЕТУ'}
                                </div>
                                <div
                                    className="carousel-caption-description"
                                    style={{
                                        color: slide.colorDescription || '#000000',
                                        fontSize: slide.fontSizeDescription,
                                        fontFamily: slide.fontFamilleDescription || 'Arial',
                                        transition: 'all 0.5s ease-in-out'
                                    }}
                                >
                                    {slide.promotions?.[0]?.description || 'НОВАЯ КОЛЛЕКЦИЯ ВОШЛА В ЧАТ'}
                                </div>
                            </div>

                            <div
                                className="carousel-caption d-md-block carousel-caption-date"
                                style={{
                                    color: slide.colorTitle || '#000000',
                                    fontFamily: slide.fontFamilleTitle || 'Arial',
                                    transition: 'all 0.5s ease-in-out'
                                }}
                            >
                                {slide.promotions?.[0]?.formattedStartDate && slide.promotions?.[0]?.formattedEndDate ? (
                                    <>
                                        <span className="desktop-date">
                                            Акция с {slide.promotions[0].formattedStartDate} по {slide.promotions[0].formattedEndDate}
                                        </span>
                                        <span className="mobile-date">
                                            Акция с {slide.promotions[0].formattedStartDateMobile} по {slide.promotions[0].formattedEndDateMobile}
                                        </span>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>

                {safeSlides.length > 1 && (
                    <>
                        <button
                            className="carousel-control-prev"
                            type="button"
                            onClick={() => handleControlClick('prev')}
                        >
                            <span className="carousel-control-prev-icon carousel-control-prev-icon-prev" aria-hidden="true">
                                &#x2190;
                            </span>
                            <span className="visually-hidden">Previous</span>
                        </button>
                        <button
                            className="carousel-control-next"
                            type="button"
                            onClick={() => handleControlClick('next')}
                        >
                            <span className="carousel-control-next-icon" aria-hidden="true">
                                &#x2192;
                            </span>
                            <span className="visually-hidden">Next</span>
                        </button>
                    </>
                )}
            </div>

            {/* Добавляем компонент хитов продаж */}
            <HitsSection />

            {/* Новая секция "Почему мы?" */}
            <WhyChooseUs />

            {/* Секция сезонных предложений */}
            <SeasonalOffers />

            {/* Новая секция с отзывами */}
            <ReviewsSection />

            {/* Новая секция с информационными карточками */}
            <InfoCardsSection />

            {/* Карта с расположением */}  
            <MapSection />


        </div>
    );
};

export default Home;