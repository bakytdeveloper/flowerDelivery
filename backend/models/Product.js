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
    category: {
        type: String,
        required: true
    },
    // Тип: одиночный цветок или букет
    type: {
        type: String,
        required: true,
        enum: ['single', 'bouquet'] // одиночный цветок или букет
    },
    // Повод для цветов
    occasion: {
        type: String,
        required: true
    },
    // Кому предназначены цветы
    recipient: {
        type: String,
        required: true
    },
    // Название цветов (роза, тюльпан и т.д.)
    flowerNames: [{
        type: String,
        required: true
    }],
    // Длина стебля (в см)
    stemLength: {
        type: Number,
        required: true
    },
    // Цвет цветов
    flowerColors: [{
        name: {
            type: String,
            required: true
        },
        value: {
            type: String,
            required: true
        },
    }],
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
    category: 1,
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
    category: 1
});

// Текстовый поиск для цветов
productSchema.index({
    name: 'text',
    flowerNames: 'text',
    type: 'text',
    description: 'text',
    category: 'text',
    occasion: 'text',
    recipient: 'text'
}, {
    weights: {
        name: 5,
        flowerNames: 4,
        type: 3,
        category: 2,
        occasion: 2,
        recipient: 2,
        description: 1
    },
    name: 'text_search_index'
});

productSchema.index({
    description: 1
});

// Виртуальные поля (оставляем без изменений)
productSchema.virtual('discountPercentage').get(function () {
    if (!this.originalPrice || this.originalPrice <= this.price) return 0;
    return Math.floor((this.originalPrice - this.price) / this.originalPrice * 100);
});

productSchema.virtual('averageRating').get(function () {
    if (!this.reviews || this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / this.reviews.length;
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