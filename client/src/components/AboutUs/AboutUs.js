import React, {useState} from 'react';
import './AboutUs.css';
// Импортируем фото
import bossPhoto from '../../assets/images/Boss_florist.png';
import temirlanPhoto from '../../assets/images/menedger_Timka.png';
import antonPhoto from '../../assets/images/Anton.png';
import CatalogModal from "../CatalogModal/CatalogModal";

const AboutUs = () => {
    const [isCatalogOpen, setIsCatalogOpen] = useState(false); // Добавляем состояние для каталога


    const handleCatalogClick = () => {
        setIsCatalogOpen(true);
    };

    const handleCloseCatalog = () => {
        setIsCatalogOpen(false);
    };

    return (
        <div className="about-us-container">
            {/* Герой секция */}
            <section className="about-hero">
                <div className="hero-content">
                    <h1 className="hero-title">О компании FLOWERKZ</h1>
                    <p className="hero-subtitle">
                        Более 20 лет дарим радость и эмоции через прекрасные цветы
                    </p>
                </div>
                <div className="hero-image">
                    <img
                        src="https://img.freepik.com/premium-photo/tulips-branches-cherry-blossoms-against-skyflower-banner_630649-15.jpg?w=2000"
                        alt="Цветочная композиция"
                        className="hero-img"
                    />
                </div>
            </section>

            {/* Основной контент */}
            <div className="about-content">
                {/* Секция о миссии */}
                <section className="mission-section">
                    <div className="container">
                        <div className="mission-grid">
                            <div className="mission-text">
                                <h2>Наша миссия</h2>
                                <p>
                                    Мы верим, что цветы — это не просто растения, а настоящий язык чувств.
                                    Каждый букет, собранный нашими флористами, рассказывает свою уникальную историю
                                    и передаёт самые тёплые эмоции.
                                </p>
                                <p>
                                    С 2003 года мы помогаем нашим клиентам выражать любовь, благодарность,
                                    заботу и поддержку через искусство флористики.
                                </p>
                            </div>
                            <div className="mission-image">
                                <img
                                    src="https://www.shutterstock.com/image-photo/professional-florist-making-bouquet-flowers-260nw-2671285419.jpg"
                                    alt="Флорист за работой"
                                    className="mission-img"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Секция преимуществ */}
                <section className="advantages-section">
                    <div className="container">
                        <h2 className="section-title">Почему выбирают нас</h2>
                        <div className="advantages-grid">
                            <div className="advantage-card">
                                <div className="advantage-icon">🌍</div>
                                <h3>Цветы со всего мира</h3>
                                <p>
                                    Мы сотрудничаем с поставщиками из Голландии, Эквадора, Кении,
                                    Колумбии и других стран. От классических роз до экзотических орхидей —
                                    в нашем ассортименте только лучшие сорта.
                                </p>
                            </div>
                            <div className="advantage-card">
                                <div className="advantage-icon">⚡</div>
                                <h3>Быстрая доставка</h3>
                                <p>
                                    Доставляем заказы в Кордае и близлежащие районы в течение 2 часов.
                                    Наши курьеры аккуратно доставят ваш заказ в целости и сохранности.
                                </p>
                            </div>
                            <div className="advantage-card">
                                <div className="advantage-icon">🎁</div>
                                <h3>Полный сервис</h3>
                                <p>
                                    Помимо цветов, предлагаем дополнительные товары: открытки ручной работы,
                                    premium шоколад, плюшевые игрушки и аксессуары для создания идеального подарка.
                                </p>
                            </div>
                            <div className="advantage-card">
                                <div className="advantage-icon">👨‍🎨</div>
                                <h3>Опытные флористы</h3>
                                <p>
                                    Наша команда — это профессиональные флористы с многолетним опытом,
                                    которые постоянно совершенствуют своё мастерство и следят за мировыми трендами.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Секция ассортимента */}
                <section className="assortment-section">
                    <div className="container">
                        <h2 className="section-title">Наш ассортимент</h2>
                        <div className="assortment-grid">
                            <div className="assortment-item">
                                <div className="assortment-image">
                                    <img
                                        src="https://i.pinimg.com/736x/8a/9c/67/8a9c67d084bd13173b7a43508a8aa3ed.jpg"
                                        alt="Свежие цветы"
                                        className="assortment-img"
                                    />
                                </div>
                                <div className="assortment-content">
                                    <h3>Свежие цветы</h3>
                                    <ul>
                                        <li>Розы из Эквадора и Голландии</li>
                                        <li>Тюльпаны и лилии</li>
                                        <li>Экзотические орхидеи</li>
                                        <li>Сезонные цветы</li>
                                        <li>Композиции на любое событие</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="assortment-item">
                                <div className="assortment-image">
                                    <img
                                        src="https://img.freepik.com/premium-photo/cards-brown-teddy-bear_87720-165886.jpg?w=2000"
                                        alt="Дополнительные товары"
                                        className="assortment-img"
                                    />
                                </div>
                                <div className="assortment-content">
                                    <h3>Дополнительные товары</h3>
                                    <ul>
                                        <li>Поздравительные открытки</li>
                                        <li>Премиальный шоколад</li>
                                        <li>Мягкие игрушки</li>
                                        <li>Подарочные корзины</li>
                                        <li>Воздушные шары</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Секция ценностей */}
                <section className="values-section">
                    <div className="container">
                        <h2 className="section-title">Наши ценности</h2>
                        <div className="values-list">
                            <div className="value-item">
                                <h4>💚 Качество</h4>
                                <p>Используем только свежие цветы от проверенных поставщиков</p>
                            </div>
                            <div className="value-item">
                                <h4>🤝 Честность</h4>
                                <p>Прозрачные цены и честные условия сотрудничества</p>
                            </div>
                            <div className="value-item">
                                <h4>❤️ Забота</h4>
                                <p>Индивидуальный подход к каждому клиенту и его потребностям</p>
                            </div>
                            <div className="value-item">
                                <h4>🚀 Инновации</h4>
                                <p>Постоянно развиваемся и внедряем новые технологии</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Секция команды */}
                <section className="team-section">
                    <div className="container">
                        <h2 className="section-title">Наша команда</h2>
                        <div className="team-grid">
                            <div className="team-member">
                                <div className="member-photo">
                                    <img
                                        src={bossPhoto}
                                        alt="Флорист Айгерим"
                                        className="member-img"
                                    />
                                </div>
                                <h4>Big Boss</h4>
                                <p>Главный флорист</p>
                                <span>Опыт: 15 лет</span>
                            </div>
                            <div className="team-member">
                                <div className="member-photo">
                                    <img
                                        src={temirlanPhoto}
                                        alt="Флорист Тимка"
                                        className="member-img"
                                    />
                                </div>
                                <h4>Темирлан</h4>
                                <p>Флорист-дизайнер</p>
                                <span>Опыт: 8 лет</span>
                            </div>
                            <div className="team-member">
                                <div className="member-photo">
                                    <img
                                        src={antonPhoto}
                                        alt="Менеджер Антон"
                                        className="member-img"
                                    />
                                </div>
                                <h4>Антон</h4>
                                <p>Менеджер по доставке</p>
                                <span>Опыт: 6 лет</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA секция */}
                <section className="cta-section">
                    <div className="container">
                        <div className="cta-content">
                            <h2>Готовы сделать заказ?</h2>
                            <p>
                                Присоединяйтесь к тысячам довольных клиентов, которые уже оценили
                                качество наших услуг и красоту наших цветов.
                            </p>
                            <div className="cta-buttons">
                                <button onClick={handleCatalogClick} className="cta-button secondary">Посмотреть каталог</button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
            {/* Модальное окно каталога - ДОБАВЛЯЕМ ЭТОТ КОМПОНЕНТ */}
            <CatalogModal
                isOpen={isCatalogOpen}
                onClose={handleCloseCatalog}
            />
        </div>
    );
};

export default AboutUs;