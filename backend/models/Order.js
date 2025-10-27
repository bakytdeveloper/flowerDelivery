import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
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
    cart: [cartItemSchema],
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        // Удаляем brand, добавляем поля для цветов
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
        price: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        // Удаляем size, добавляем информацию о цветах
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
        // Информация о админе
        admin: {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            name: {
                type: String,
                required: true
            },
            email: {
                type: String,
                required: true
            },
            phoneNumber: {
                type: String,
                required: true
            },
        },
    }],
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
        type: String
    },
    address: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    paymentMethod: {
        type: String
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