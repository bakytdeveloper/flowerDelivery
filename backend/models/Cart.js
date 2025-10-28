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
    flowerType: {
        type: String,
        enum: ['single', 'bouquet'],
        required: true
    },
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
    flowerNames: [{
        type: String
    }],
    stemLength: {
        type: Number
    },
    // Новые поля для обертки и дополнений
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
        },
        image: {
            type: String
        }
    },
    addons: [{
        addonId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Addon'
        },
        name: {
            type: String
        },
        type: {
            type: String
        },
        price: {
            type: Number
        },
        image: {
            type: String
        },
        quantity: {
            type: Number,
            default: 1
        }
    }],
    // Общая цена для этого item (продукт + обертка + дополнения)
    itemTotal: {
        type: Number,
        required: true
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

// Middleware для расчета totals
cartSchema.pre('save', function(next) {
    this.totalItems = this.items.reduce((total, item) => total + item.quantity, 0);

    this.total = this.items.reduce((total, item) => {
        return total + (item.itemTotal * item.quantity);
    }, 0);

    this.lastUpdated = Date.now();
    next();
});

cartSchema.index({ user: 1 }, { sparse: true });
cartSchema.index({ sessionId: 1 }, { sparse: true });

export default mongoose.model('Cart', cartSchema);