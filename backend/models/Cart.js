import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    // Удаляем size, так как для цветов не нужно
    // Добавляем поле для типа цветов (одиночный/букет)
    flowerType: {
        type: String,
        enum: ['single', 'bouquet']
    },
    // Обновляем color для работы с цветами цветов
    flowerColor: {
        name: {
            type: String
        },
        value: {
            type: String
        }
    },
    price: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    // Удаляем brand, добавляем информацию о цветах
    flowerNames: [{
        type: String
    }],
    stemLength: {
        type: Number
    }
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    sessionId: {
        type: String
    },
    items: [cartItemSchema],
    total: {
        type: Number,
        default: 0
    },
    totalItems: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Обновляем индексы
cartSchema.index({
    user: 1
}, {
    sparse: true
});
cartSchema.index({
    sessionId: 1
}, {
    sparse: true
});

export default mongoose.model('Cart', cartSchema);