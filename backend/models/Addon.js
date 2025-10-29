import mongoose from 'mongoose';

const addonSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['soft_toy', 'candy_box', 'chocolate', 'card', 'perfume', 'other']
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
addonSchema.index({ isActive: 1, quantity: 1 });
addonSchema.index({ type: 1, isActive: 1 });
addonSchema.index({ name: 'text', description: 'text' });

// Middleware для обновления updatedAt
addonSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Виртуальное поле для проверки доступности
addonSchema.virtual('isAvailable').get(function() {
    return this.isActive && this.quantity > 0;
});

// Виртуальное поле для русского названия типа
addonSchema.virtual('typeLabel').get(function() {
    const typeLabels = {
        'soft_toy': 'Мягкая игрушка',
        'candy_box': 'Коробка конфет',
        'chocolate': 'Шоколад',
        'card': 'Открытка',
        'perfume': 'Парфюм',
        'other': 'Другое'
    };
    return typeLabels[this.type] || 'Другое';
});

addonSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

const Addon = mongoose.model('Addon', addonSchema);

export default Addon;