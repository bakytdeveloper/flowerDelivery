// constants.js
// export const genderTitles = [
//     'Мужская одежда',
//     'Женская одежда',
//     'Детская одежда',
//     'Унисекс',
//     'Гаджеты',
//     'Аксессуары',
//     'Бытовая эл.техника',
//     'Товары для всех'
// ];

// export const genderOrder = [
//     "Мужская одежда",
//     "Женская одежда",
//     "Детская одежда",
//     "Унисекс",
//     "Гаджеты",
//     "Бытовая эл.техника",
//     "Аксессуары"
// ];

export const fontFamilies = [
    'Arial',
    'Verdana',
    'DIN Alternate',
    'SignPainter',
    'Phosphate',
    'STSong',
    'Bradley Hand',
    'Rockwell',
    'Ayuthaya',
    'Trattatello',
    'PT Mono',
    'Heiti TC',
    'Luminari',
    'PT Serif Caption',
    'Menlo',
    'Copperplate',
    'Arial Black',
    'Comic Sans MS',
    'Hiragino Sans',
    'Times New Roman',
    'Georgia',
    'Sathu',
    'Oswald',
    'Courier New',
    "American Typewriter",
    'Trebuchet MS',
    'Impact'
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

// export const adminPanelGenderImageUrls = {
//     'Мужская одежда': '',
//     'Женская одежда': '',
//     'Детская одежда': '',
//     'Унисекс': '',
//     'Гаджеты': '',
//     'Аксессуары': '',
//     'Бытовая эл.техника': '',
//     'Товары для всех': ''
// };



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
