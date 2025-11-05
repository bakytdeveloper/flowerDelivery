import React, { useState } from 'react';
import './InfoCardsSection.css';

const InfoCardsSection = () => {
    const [isFirstCardOpen, setIsFirstCardOpen] = useState(false);
    const [isSecondCardOpen, setIsSecondCardOpen] = useState(false);

    const cards = [
        {
            id: 1,
            title: "Оплата и Доставка",
            isOpen: isFirstCardOpen,
            toggle: () => setIsFirstCardOpen(!isFirstCardOpen),
            content: {
                sections: [
                    {
                        title: "ДОСТАВКА ЦВЕТОВ",
                        items: [
                            "ТРАНСПОРТИРОВКА ПО ГОРОДУ И РАЙОНАМ",
                            "Стоимость доставки зависит от района доставки букета"
                        ]
                    },
                    {
                        title: "ВРЕМЯ:",
                        items: [
                            "Как правило занимает 1-2 часа",
                            "Возможна срочная доставка"
                        ]
                    }
                ],
                description: "Наша команда обеспечит своевременную и быструю доставку цветов по городу и за его пределы",
                imageUrl: "https://avatars.mds.yandex.net/i?id=9928fe3a90ae359a2961f0c3905453c9_l-5231964-images-thumbs&n=13"
            }
        },
        {
            id: 2,
            title: "БЛОГ О ЦВЕТАХ",
            isOpen: isSecondCardOpen,
            toggle: () => setIsSecondCardOpen(!isSecondCardOpen),
            content: {
                sections: [
                    {
                        title: "УХОД ЗА ЦВЕТАМИ",
                        items: [
                            "Советы по уходу разных видов цветов"
                        ]
                    },
                    {
                        title: "Акции и новости",
                        items: [
                            "Данные о новых предложениях"
                        ]
                    },
                    {
                        title: "СИМВОЛИКА",
                        items: [
                            "Значимость различных цветов и букетов"
                        ]
                    }
                ],
                description: "В нашем блоге вы найдете немало полезной информации о цветах и правильном уходе",
                imageUrl: "https://avatars.mds.yandex.net/i?id=d8c27b6cd1f57d7c83ea7dea008e9dc8_l-5662109-images-thumbs&ref=rim&n=13&w=1000&h=1000"
            }
        }
    ];

    return (
        <section className="info-cards-section">
            <div className="container">
                <div className="info-cards-grid">
                    {cards.map((card) => (
                        <div
                            key={card.id}
                            className={`info-card ${card.isOpen ? 'open' : 'closed'}`}
                        >
                            {/* Заголовок всегда вверху */}
                            <div
                                className="info-card-header"
                                onClick={card.toggle}
                            >
                                <h3 className="info-card-title">{card.title}</h3>
                                <span className="toggle-icon">
                                    {card.isOpen ? '−' : '+'}
                                </span>
                            </div>

                            {/* Контент карточки (скрывается при закрытии) */}
                            {card.isOpen && (
                                <div className="info-card-content">
                                    <div className="text-content">
                                        {card.content.sections.map((section, index) => (
                                            <div key={index} className="content-section">
                                                <h4 className="section-title-color">{section.title}</h4>
                                                <ul className="section-items">
                                                    {section.items.map((item, itemIndex) => (
                                                        <li key={itemIndex} className="section-item">
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                        <p className="card-description">
                                            {card.content.description}
                                        </p>
                                    </div>

                                    {/* Картинка занимает всю ширину внизу */}
                                    <div className="image-container">
                                        <img
                                            src={card.content.imageUrl}
                                            alt={card.title}
                                            className="card-image"
                                            loading="lazy"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default InfoCardsSection;