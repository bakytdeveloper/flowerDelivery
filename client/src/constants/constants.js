// constants.js
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