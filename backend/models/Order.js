import mongoose from 'mongoose';

// Базовая схема для элемента заказа
const baseOrderItemSchema = {
    quantity: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    // Общая цена за этот item
    itemTotal: {
        type: Number,
        required: true,
        default: 0
    }
};

// Схема для обертки
const wrapperSchema = new mongoose.Schema({
    wrapperId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wrapper'
    },
    name: {
        type: String
    },
    price: {
        type: Number,
        default: 0
    }
}, { _id: false }); // Отключаем _id для вложенных документов

// Схема для цветов в заказе
const flowerOrderItemSchema = new mongoose.Schema({
    ...baseOrderItemSchema,
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    flowerType: {
        type: String,
        enum: ['single', 'bouquet'],
        required: true
    },
    category: {
        type: String
    },
    description: {
        type: String
    },
    flowerNames: [{
        type: String
    }],
    flowerColors: [{
        name: {
            type: String
        },
        value: {
            type: String
        }
    }],
    stemLength: {
        type: Number
    },
    occasion: {
        type: String
    },
    recipient: {
        type: String
    },
    // Информация об обертке - разрешаем null
    wrapper: {
        type: wrapperSchema,
        default: null // Явно указываем default как null
    },
    itemType: {
        type: String,
        enum: ['flower'],
        default: 'flower'
    }
});

// Схема для дополнительных товаров в заказе
const addonOrderItemSchema = new mongoose.Schema({
    ...baseOrderItemSchema,
    addonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Addon',
        required: true
    },
    type: {
        type: String,
        required: true
    },
    itemType: {
        type: String,
        enum: ['addon'],
        default: 'addon'
    }
});

const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled', 'inProgress'],
        default: 'pending',
        required: true
    },
    time: {
        type: Date,
        default: Date.now
    },
});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    guestInfo: {
        name: {
            type: String
        },
        email: {
            type: String
        },
        phone: {
            type: String
        }
    },
    userType: {
        type: String,
        enum: ['customer', 'guest'],
        required: true
    },
    // Разделяем товары на цветы и дополнения
    flowerItems: [flowerOrderItemSchema],
    addonItems: [addonOrderItemSchema],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled', 'inProgress'],
        default: 'pending'
    },
    date: {
        type: Date,
        default: Date.now
    },
    firstName: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        default: 'cash'
    },
    comments: {
        type: String
    },
    statusHistory: [statusHistorySchema],
    commentsAdmin: {
        type: String
    },
    emailSent: {
        type: Boolean,
        default: false
    },
    emailSentAt: {
        type: Date
    },
});

const Order = mongoose.model('Order', orderSchema);
export default Order;