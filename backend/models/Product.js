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
    type: {
        type: String,
        required: true
    },
    direction: {
        type: String
    },
    brand: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    characteristics: [characteristicSchema],
    sizes: [{
        type: String
    }],
    colors: [{
        name: {
            type: String,
            required: true
        },
        value: {
            type: String,
            required: true
        },
    }],
    images: [{
        type: String
    }],
    quantity: {
        type: Number,
        default: 10
    },
    // Меняем seller на admin (ссылка на User с ролью admin)
    admin: {
        type: mongoose.Schema.Types.ObjectId,
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

// Обновляем индексы
productSchema.index({
    gender: 1,
    category: 1,
    type: 1
});
productSchema.index({
    isActive: 1,
    admin: 1
});
productSchema.index({
    name: 1,
    brand: 1,
    type: 1,
    category: 1
});

// Текстовый поиск
productSchema.index({
    name: 'text',
    brand: 'text',
    type: 'text',
    description: 'text',
    category: 'text'
}, {
    weights: {
        name: 5,
        brand: 4,
        type: 3,
        category: 2,
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