import React from 'react';
import './MapSection.css';

const MapSection = () => {
    return (
        <section className="map-section">
            <div className="container">
                <div className="map-header">
                    <h2 className="map-title">Мы находимся здесь</h2>
                    <p className="map-subtitle">
                        Приезжайте к нам в гости, мы выдем рады Вам )
                    </p>
                </div>

                <div className="map-container">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1160.639192737201!2d74.71230414741754!3d43.026295473687895!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x389ebdbc4eec442b%3A0x6c5bce77e072ac98!2z0JrQvtGA0LTQsNC5LCDQmtCw0LfQsNGF0YHRgtCw0L0!5e1!3m2!1sru!2skg!4v1761662341485!5m2!1sru!2skg"
                        width="100%"
                        height="450"
                        style={{border: 0}}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Наш магазин на карте"
                        className="map-iframe"
                    ></iframe>
                </div>

                {/*<div className="location-info">*/}
                {/*    <div className="info-card">*/}
                {/*        <div className="info-icon">📍</div>*/}
                {/*        <div className="info-content">*/}
                {/*            <h4>Адрес</h4>*/}
                {/*            <p>г. Кордай, центральная улица</p>*/}
                {/*        </div>*/}
                {/*    </div>*/}

                {/*    <div className="info-card">*/}
                {/*        <div className="info-icon">🕒</div>*/}
                {/*        <div className="info-content">*/}
                {/*            <h4>График</h4>*/}
                {/*            <p>Ежедневно с 9:00 до 21:00</p>*/}
                {/*        </div>*/}
                {/*    </div>*/}

                {/*    <div className="info-card">*/}
                {/*        <div className="info-icon">📞</div>*/}
                {/*        <div className="info-content">*/}
                {/*            <h4>Телефон</h4>*/}
                {/*            <p>+996 (XXX) XX-XX-XX</p>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*</div>*/}
            </div>
        </section>
    );
};

export default MapSection;