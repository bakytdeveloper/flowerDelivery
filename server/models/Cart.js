import mongoose from 'mongoose';

// Базовая схема для элемента корзины
const baseCartItemSchema = {
    quantity: {
        type: Number,
        required: true,
        min: 1
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
    }
};

const flowerCartItemSchema = new mongoose.Schema({
    ...baseCartItemSchema,
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
    flowerColor: {
        name: { type: String },
        value: { type: String }
    },
    flowerNames: [{ type: String }],
    stemLength: { type: Number },
    wrapper: {
        wrapperId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Wrapper'
        },
        name: { type: String },
        price: {
            type: Number,
            default: 0
        },
        image: { type: String },
        wrapperType: {
            type: String,
            enum: ['per_item', 'per_order'],
            default: 'per_item'
        }
    },
    itemType: {
        type: String,
        enum: ['flower'],
        default: 'flower'
    },
    // Добавляем расчет itemTotal для цветов
    itemTotal: {
        type: Number,
        required: true
    }
});

const addonCartItemSchema = new mongoose.Schema({
    ...baseCartItemSchema,
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
    },
    // Убираем itemTotal из схемы доп. товаров - будем вычислять динамически
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    sessionId: {
        type: String
    },
    flowerItems: [flowerCartItemSchema],
    addonItems: [addonCartItemSchema],
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
    // Общее количество товаров
    const flowerItemsCount = this.flowerItems.reduce((total, item) => total + item.quantity, 0);
    const addonItemsCount = this.addonItems.reduce((total, item) => total + item.quantity, 0);
    this.totalItems = flowerItemsCount + addonItemsCount;

    // Считаем общую стоимость цветов
    const flowerTotal = this.flowerItems.reduce((total, item) => {
        let itemTotalPrice;

        if (item.flowerType === 'single' && item.wrapper && item.wrapper.wrapperId) {
            // Для одиночных цветов с оберткой: (цена цветка * количество) + цена обертки
            itemTotalPrice = (item.price * item.quantity) + (item.wrapper.price || 0);
        } else {
            // Для букетов или цветов без обертки
            const wrapperPrice = item.wrapper ? (item.wrapper.price || 0) : 0;
            itemTotalPrice = (item.price + wrapperPrice) * item.quantity;
        }

        // Сохраняем itemTotal для отображения на фронтенде
        item.itemTotal = itemTotalPrice / item.quantity; // Цена за единицу

        return total + itemTotalPrice;
    }, 0);

    // Считаем общую стоимость дополнительных товаров
    const addonTotal = this.addonItems.reduce((total, item) => {
        // Для доп. товаров: цена * количество
        const itemTotal = item.price * item.quantity;
        return total + itemTotal;
    }, 0);

    this.total = flowerTotal + addonTotal;
    this.lastUpdated = Date.now();
    next();
});

cartSchema.index({ user: 1 }, { sparse: true });
cartSchema.index({ sessionId: 1 }, { sparse: true });

export default mongoose.model('Cart', cartSchema);