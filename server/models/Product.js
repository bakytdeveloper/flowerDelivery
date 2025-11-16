import mongoose from 'mongoose';

const characteristicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    value: {
        type: String,
        required: true
    },
});

const reviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Добавляем поле для ответа администратора
    adminResponse: {
        type: String
    }
});

// Схема для вариантов длины стебля
const stemLengthSchema = new mongoose.Schema({
    length: {
        type: Number, // длина в см
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    originalPrice: {
        type: Number // для скидки
    }
}, { _id: false });

// Схема для доступных цветов
const colorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    value: {
        type: String, // hex код цвета
        required: true
    },
    // Изображения для разных цветов
    colorImages: [{
        type: String
    }]
}, { _id: false });

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    originalPrice: {
        type: Number
    },
    // category: {
    //     type: String,
    //     required: true
    // },
    // Тип: одиночный цветок или букет
    type: {
        type: String,
        required: true,
        enum: ['single', 'bouquet'] // одиночный цветок или букет
    },

    // Цвета для одиночных цветов
    availableColors: [colorSchema],

    // Варианты длины стебля с ценами
    stemLengths: [stemLengthSchema],

    // Повод для цветов
    occasion: {
        type: String,
        // required: true,
        enum: [
            'birthday',
            'anniversary',
            'wedding',
            'valentine',
            'womens_day',
            'mothers_day',
            'fathers_day',
            'baby_birth',
            'graduation',
            'promotion',
            'thank_you',
            'apology',
            'condolences',
            'get_well',
            'just_because',
            'romantic_evening',
            'love_confession',
            'holiday',
            'business_opening',
            'jubilee'
        ]
    },

    // Кому предназначены цветы
    recipient: {
        type: String,
        // required: true,
        enum: [
            'woman',
            'man',
            'girl',
            'boy',
            'mother',
            'father',
            'grandmother',
            'grandfather',
            'colleague',
            'boss',
            'teacher',
            'female_friend',
            'male_friend',
            'wife',
            'husband',
            'bride',
            'newlyweds',
            'child',
            'client',
            'self'
        ]
    },

    // Название цветов (роза, тюльпан и т.д.)
    flowerNames: [{
        type: String,
        // required: true
    }],

    // Длина стебля (в см) - оставляем для обратной совместимости
    stemLength: {
        type: Number
        // required: true // убираем required так как теперь используем stemLengths
    },

    // Количество проданных цветов
    soldCount: {
        type: Number,
        default: 0
    },
    characteristics: [characteristicSchema],
    images: [{
        type: String
    }],
    quantity: {
        type: Number,
        default: 10
    },
    admin: {
        type: String,
        // type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviews: [reviewSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

// Обновляем индексы для цветов
productSchema.index({
    type: 1,
    occasion: 1
});
productSchema.index({
    isActive: 1,
    admin: 1
});
productSchema.index({
    name: 1,
    flowerNames: 1,
    type: 1,
});

// Обновляем текстовый поиск для цветов
productSchema.index({
    name: 'text',
    flowerNames: 'text',
    'availableColors.name': 'text',
    description: 'text',
    occasion: 'text',
    recipient: 'text'
}, {
    weights: {
        name: 5,
        flowerNames: 4,
        'availableColors.name': 3,
        type: 3,
        occasion: 2,
        recipient: 2,
        description: 1
    },
    name: 'text_search_index'
});

productSchema.index({
    description: 1
});

// Виртуальные поля
productSchema.virtual('discountPercentage').get(function () {
    if (!this.originalPrice || this.originalPrice <= this.price) return 0;
    return Math.floor((this.originalPrice - this.price) / this.originalPrice * 100);
});

productSchema.virtual('averageRating').get(function () {
    if (!this.reviews || this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / this.reviews.length;
});

// Новое виртуальное поле для минимальной цены
productSchema.virtual('minPrice').get(function() {
    if (this.stemLengths && this.stemLengths.length > 0) {
        return Math.min(...this.stemLengths.map(item => item.price));
    }
    return this.price;
});

// Виртуальное поле для получения основной длины стебля (для обратной совместимости)
productSchema.virtual('mainStemLength').get(function() {
    if (this.stemLengths && this.stemLengths.length > 0) {
        // Возвращаем первую длину как основную
        return this.stemLengths[0].length;
    }
    return this.stemLength;
});

// Виртуальное поле для проверки наличия вариантов
productSchema.virtual('hasVariants').get(function() {
    return (this.type === 'single' && this.availableColors.length > 0) ||
        this.stemLengths.length > 0;
});

// Middleware для автоматической установки цены при сохранении
productSchema.pre('save', function(next) {
    // Если есть варианты длины стебля, устанавливаем основную цену как минимальную
    if (this.stemLengths && this.stemLengths.length > 0) {
        const minPrice = Math.min(...this.stemLengths.map(item => item.price));
        if (minPrice !== this.price) {
            this.price = minPrice;
        }
    }

    // Для обратной совместимости: если stemLength не установлен, но есть stemLengths
    if (!this.stemLength && this.stemLengths && this.stemLengths.length > 0) {
        this.stemLength = this.stemLengths[0].length;
    }

    next();
});

productSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret.__v;
        delete ret.score;
        return ret;
    }
});

productSchema.set('toObject', {
    virtuals: true,
    transform: function (doc, ret) {
        delete ret.__v;
        delete ret.score;
        return ret;
    }
});

const Product = mongoose.model('Product', productSchema);

export default Product;