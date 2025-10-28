import React from 'react';
import './Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const contactInfo = {
        address: "г.Кордай, ул. Вахмянинова, д. 15",
        email: "info@flowerkz.kz",
        phone: "+7 (495) 123-45-67",
        schedule: {
            weekdays: "9:00 - 21:00",
            weekends: "10:00 - 20:00"
        }
    };

    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    {/* Контактные данные */}
                    <div className="footer-section">
                        <h3 className="footer-title">Контактные данные</h3>
                        <div className="contact-info">
                            <div className="contact-item">
                                <span className="contact-icon">📍</span>
                                <div className="contact-text">
                                    <strong>Адрес:</strong>
                                    <span>{contactInfo.address}</span>
                                </div>
                            </div>

                            <div className="contact-item">
                                <span className="contact-icon">📧</span>
                                <div className="contact-text">
                                    <strong>Эл. почта:</strong>
                                    <a href={`mailto:${contactInfo.email}`}>
                                        {contactInfo.email}
                                    </a>
                                </div>
                            </div>

                            <div className="contact-item">
                                <span className="contact-icon">📞</span>
                                <div className="contact-text">
                                    <strong>Телефон:</strong>
                                    <a href={`tel:${contactInfo.phone.replace(/\D/g, '')}`}>
                                        {contactInfo.phone}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Социальные сети */}
                    <div className="footer-section">
                        <h3 className="footer-title">Мы в соцсетях</h3>
                        <div className="social-links">
                             {/*eslint-disable-next-line*/}
                            <a href="#" className="social-link" aria-label="Instagram">
                                <span className="social-icon">📷</span>
                                Instagram
                            </a>
                            {/*eslint-disable-next-line*/}
                            <a href="#" className="social-link" aria-label="Telegram">
                                <span className="social-icon">✈️</span>
                                Telegram
                            </a>
                        </div>
                    </div>
                </div>

                {/* Нижняя часть футера */}
                <div className="footer-bottom">
                    <div className="footer-copyright">
                        <p>&copy; {currentYear} FlowerKZ. Все права защищены.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;