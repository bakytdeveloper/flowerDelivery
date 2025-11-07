import React, { useState, useEffect, useRef } from 'react';
import './MapSection.css';

const MapSection = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const mapRef = useRef(null);
    const observerRef = useRef(null);

    useEffect(() => {
        // Предварительно загружаем карту сразу после монтирования компонента
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 1000);

        // Наблюдатель за видимостью для lazy load
        observerRef.current = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isVisible) {
                    setIsVisible(true);
                }
            },
            {
                rootMargin: '550px', // Начинаем загрузку за 550px до появления в viewport
                threshold: 0.1
            }
        );

        if (mapRef.current) {
            observerRef.current.observe(mapRef.current);
        }

        return () => {
            clearTimeout(timer);
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
        // eslint-disable-next-line
    }, []);

    // УДАЛЕНО: неправильная предзагрузка ресурсов
    // Этот useEffect был причиной предупреждений

    return (
        <section className="map-section" ref={mapRef}>
            <div className="container">
                <div className="map-header">
                    <h2 className="map-title">Мы находимся здесь</h2>
                    <p className="map-subtitle">
                        Приезжайте к нам в гости, мы будем рады Вам 🌹)
                    </p>
                </div>

                <div className="map-container">
                    {(isVisible || isLoaded) && (
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d1733.8264014302763!2d74.70850274009078!3d43.02807312173589!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1z0JrQvtGA0LTQsNC5INGD0Lsu0JbQmNCR0JXQmiDQltCe0JvQqyAyMzQ!5e1!3m2!1sru!2skg!4v1761675010196!5m2!1sru!2skg&csp_test=false"
                            width="100%"
                            height="450"
                            style={{border: 0}}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Наш магазин на карте"
                            className="map-iframe"
                        />
                    )}
                </div>
            </div>
        </section>
    );
};

export default MapSection;