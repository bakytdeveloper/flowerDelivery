import React from 'react';
import './WhyChooseUs.css';

const WhyChooseUs = () => {
    const features = [
        {
            id: 1,
            title: "Стаж 20 лет",
            description: "Более 20 лет дарим радость и эмоции нашим клиентам. Опыт, который говорит сам за себя",
            icon: "🎯",
            color: "#e84393"
        },
        {
            id: 2,
            title: "100% Свежесть",
            description: "Только свежие цветы от проверенных поставщиков. Гарантия качества и долгого сохранения",
            icon: "🌺",
            color: "#0984e3"
        },
        {
            id: 3,
            title: "Качество цветов",
            description: "Тщательный отбор каждого цветка. Премиальное качество по доступным ценам",
            icon: "⭐",
            color: "#00b894"
        },
        {
            id: 4,
            title: "Надёжность доставки",
            description: "Пунктуальная доставка в любое время. Ваш заказ в надёжных руках",
            icon: "🚚",
            color: "#fdcb6e"
        }
    ];

    return (
        <section className="why-choose-us">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">Почему выбирают нас?</h2>
                    <p className="section-subtitle">
                        Доверие тысяч клиентов, которые выбирают наши цветы снова и снова
                    </p>
                </div>

                <div className="features-grid">
                    {features.map((feature, index) => (
                        <div
                            key={feature.id}
                            className="feature-card"
                            style={{ '--accent-color': feature.color }}
                            data-aos="fade-up"
                            data-aos-delay={index * 100}
                        >
                            <div className="feature-icon-wrapper">
                                <div
                                    className="feature-icon"
                                    style={{ backgroundColor: `${feature.color}15` }}
                                >
                                    <span
                                        className="icon-emoji"
                                        style={{ color: feature.color }}
                                    >
                                        {feature.icon}
                                    </span>
                                </div>
                                <div className="icon-background"></div>
                            </div>

                            <h3 className="feature-title">{feature.title}</h3>
                            <p className="feature-description">{feature.description}</p>

                            <div className="feature-decoration">
                                <div
                                    className="decoration-circle"
                                    style={{ backgroundColor: `${feature.color}20` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WhyChooseUs;