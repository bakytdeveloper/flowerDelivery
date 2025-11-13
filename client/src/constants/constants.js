// constants.js
// export const fontFamilies = [
//     'Arial',
//     'Verdana',
//     'DIN Alternate',
//     'SignPainter',
//     'Phosphate',
//     'STSong',
//     'Bradley Hand',
//     'Rockwell',
//     'Ayuthaya',
//     'Trattatello',
//     'PT Mono',
//     'Heiti TC',
//     'Luminari',
//     'PT Serif Caption',
//     'Menlo',
//     'Copperplate',
//     'Arial Black',
//     'Comic Sans MS',
//     'Hiragino Sans',
//     'Times New Roman',
//     'Georgia',
//     'Sathu',
//     'Oswald',
//     'Courier New',
//     "American Typewriter",
//     'Trebuchet MS',
//     'Impact'
// ];

// constants.js
export const fontFamilies = [
    // Основные безопасные шрифты
    { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
    { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
    { value: 'Trebuchet MS, Helvetica, sans-serif', label: 'Trebuchet MS' },
    { value: 'Georgia, Times, serif', label: 'Georgia' },
    { value: 'Times New Roman, Times, serif', label: 'Times New Roman' },
    { value: 'Courier New, Courier, monospace', label: 'Courier New' },
    { value: 'Impact, Haettenschweiler, sans-serif', label: 'Impact' },
    { value: 'Comic Sans MS, cursive, sans-serif', label: 'Comic Sans MS' },

    // Популярные Google Fonts
    { value: 'Roboto, Arial, sans-serif', label: 'Roboto' },
    { value: 'Lato, Arial, sans-serif', label: 'Lato' },
    { value: 'Oswald, Arial, sans-serif', label: 'Oswald' },
    { value: 'Source Sans Pro, Arial, sans-serif', label: 'Source Sans Pro' },
    { value: 'PT Sans, Arial, sans-serif', label: 'PT Sans' },

    // Моноширинные
    { value: 'PT Mono, Courier New, monospace', label: 'PT Mono' },
    { value: 'Source Code Pro, Menlo, monospace', label: 'Source Code Pro' },
    { value: 'Roboto Mono, Courier New, monospace', label: 'Roboto Mono' },

    // Декоративные и рукописные (прописные)
    { value: 'Playfair Display, Georgia, serif', label: 'Playfair Display' },
    { value: 'Merriweather, Georgia, serif', label: 'Merriweather' },
    { value: 'Dancing Script, cursive', label: 'Dancing Script' },
    { value: 'Pacifico, cursive', label: 'Pacifico' },

    // ✅ НОВЫЕ: Рукописные шрифты с хорошей поддержкой
    { value: 'Great Vibes, cursive', label: 'Great Vibes' },
    { value: 'Parisienne, cursive', label: 'Parisienne' },
    { value: 'Alex Brush, cursive', label: 'Alex Brush' },
    { value: 'Allura, cursive', label: 'Allura' },
    { value: 'Cookie, cursive', label: 'Cookie' },
    { value: 'Marck Script, cursive', label: 'Marck Script' },
    { value: 'Monsieur La Doulaise, cursive', label: 'Monsieur La Doulaise' },
    { value: 'Mr De Haviland, cursive', label: 'Mr De Haviland' },
    { value: 'Mrs Saint Delafield, cursive', label: 'Mrs Saint Delafield' },
    { value: 'Niconne, cursive', label: 'Niconne' },
    { value: 'Petit Formal Script, cursive', label: 'Petit Formal Script' },
    { value: 'Rouge Script, cursive', label: 'Rouge Script' },
    { value: 'Tangerine, cursive', label: 'Tangerine' },
    { value: 'Yellowtail, cursive', label: 'Yellowtail' },

    // Более формальные прописные
    { value: 'Cormorant Garamond, serif', label: 'Cormorant Garamond' },
    { value: 'Cinzel, serif', label: 'Cinzel' },
    { value: 'Cormorant, serif', label: 'Cormorant' },

    // Стилизованные но читаемые
    { value: 'Caveat, cursive', label: 'Caveat' },
    { value: 'Kalam, cursive', label: 'Kalam' },
    { value: 'Indie Flower, cursive', label: 'Indie Flower' },
    { value: 'Shadows Into Light, cursive', label: 'Shadows Into Light' },
    { value: 'Permanent Marker, cursive', label: 'Permanent Marker' },

    // Элегантные прописные
    { value: 'La Belle Aurore, cursive', label: 'La Belle Aurore' },
    { value: 'Style Script, cursive', label: 'Style Script' },
    { value: 'Zeyada, cursive', label: 'Zeyada' }
];


export const statusTranslations = {
    pending: "В ожидании",
    inProgress: "В процессе",
    completed: "Завершено",
    cancelled: "Отменено"
};

export const ROLE_MAP = {
    customer: 'Клиент',
    guest: 'Гость',
    admin: 'Админ'
};

export const DEFAULT_ROLE = 'Гость';

// Константы для избежания magic numbers/strings
export const OTP_LENGTH = 6;
export const PASSWORD_MIN_LENGTH = 6;
export const RESEND_TIMER_DURATION = 60;

// Типы purpose для OTP
export const OTP_PURPOSES = {
    REGISTRATION: 'registration',
    PASSWORD_RESET: 'password_reset'
};

// Шаги процессов
export const STEPS = {
    REGISTER: {
        EMAIL_ENTRY: 1,
        OTP_VERIFICATION: 2,
        USER_DETAILS: 3
    },
    FORGOT_PASSWORD: {
        EMAIL_ENTRY: 1,
        OTP_VERIFICATION: 2,
        PASSWORD_UPDATE: 3
    }
};

export const occasionOptions = [
    { value: 'birthday', label: 'День рождения' },
    { value: 'jubilee', label: 'Юбилей' },
    { value: 'wedding', label: 'Свадьба' },
    { value: 'anniversary', label: 'Годовщина' },
    { value: 'valentine', label: 'День святого Валентина' },
    { value: 'womens_day', label: '8 марта' },
    { value: 'mothers_day', label: 'День матери' },
    { value: 'fathers_day', label: 'День отца' },
    { value: 'baby_birth', label: 'Выписка из роддома' },
    { value: 'graduation', label: 'Выпускной' },
    { value: 'promotion', label: 'Повышение / новая работа' },
    { value: 'thank_you', label: 'Благодарность' },
    { value: 'apology', label: 'Извинение' },
    { value: 'condolences', label: 'Сочувствие / соболезнование' },
    { value: 'get_well', label: 'Выздоровление / поддержка' },
    { value: 'just_because', label: 'Без повода / просто так' },
    { value: 'romantic_evening', label: 'Романтический вечер' },
    { value: 'love_confession', label: 'Признание в любви' },
    { value: 'holiday', label: 'Праздник (Новый год, Курман айт, Нооруз и др.)' },
    { value: 'business_opening', label: 'Открытие бизнеса / новоселье' }
];

export const recipientOptions = [
    { value: 'woman', label: 'Женщине' },
    { value: 'man', label: 'Мужчине' },
    { value: 'girl', label: 'Девушке' },
    { value: 'boy', label: 'Парню' },
    { value: 'mother', label: 'Маме' },
    { value: 'father', label: 'Папе' },
    { value: 'grandmother', label: 'Бабушке' },
    { value: 'grandfather', label: 'Дедушке' },
    { value: 'colleague', label: 'Коллеге' },
    { value: 'boss', label: 'Руководителю' },
    { value: 'teacher', label: 'Учителю' },
    { value: 'female_friend', label: 'Подруге' },
    { value: 'male_friend', label: 'Другу' },
    { value: 'wife', label: 'Жене' },
    { value: 'husband', label: 'Мужу' },
    { value: 'bride', label: 'Невесте' },
    { value: 'newlyweds', label: 'Молодожёнам' },
    { value: 'child', label: 'Ребёнку' },
    { value: 'client', label: 'Клиенту / партнёру' },
    { value: 'self', label: 'Самому себе' }
];