import mongoose from 'mongoose';

const orderItemAddonSchema = new mongoose.Schema({
    addonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Addon'
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    }
});

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    name: {
        type: String,
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
    price: {
        type: Number,
        required: true
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
    // Информация об обертке
    wrapper: {
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
    },
    // Информация о дополнениях
    addons: [orderItemAddonSchema],
    // Общая цена за этот item
    itemTotal: {
        type: Number,
        required: true,
        default: 0
    },
    // Информация об администраторе (необязательная)
    admin: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: {
            type: String,
            default: 'Администратор магазина'
        },
        email: {
            type: String,
            default: 'admin@flowerstore.kz'
        },
        phoneNumber: {
            type: String,
            default: '+7 (705) 123-45-67'
        }
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
    products: [orderItemSchema],
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