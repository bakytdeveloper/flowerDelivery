import mongoose from 'mongoose';

const wrapperSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    image: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    originalPrice: {
        type: Number
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Индексы для быстрого поиска
wrapperSchema.index({ isActive: 1, quantity: 1 });
wrapperSchema.index({ name: 'text', description: 'text' });

// Middleware для обновления updatedAt
wrapperSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Виртуальное поле для проверки доступности
wrapperSchema.virtual('isAvailable').get(function() {
    return this.isActive && this.quantity > 0;
});

wrapperSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

const Wrapper = mongoose.model('Wrapper', wrapperSchema);

export default Wrapper;