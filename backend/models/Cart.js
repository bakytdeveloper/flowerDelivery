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
    size: {
        type: String
    },
    color: {
        type: String
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
    brand: {
        type: String
    }
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Удаляем seller, так как теперь только один админ
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