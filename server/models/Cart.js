// import mongoose from 'mongoose';
//
// // Базовая схема для элемента корзины
// const baseCartItemSchema = {
//     quantity: {
//         type: Number,
//         required: true,
//         min: 1
//     },
//     price: {
//         type: Number,
//         required: true
//     },
//     name: {
//         type: String,
//         required: true
//     },
//     image: {
//         type: String
//     }
// };
//
// const flowerCartItemSchema = new mongoose.Schema({
//     ...baseCartItemSchema,
//     product: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Product',
//         required: true
//     },
//     flowerType: {
//         type: String,
//         enum: ['single', 'bouquet'],
//         required: true
//     },
//     flowerColor: {
//         name: { type: String },
//         value: { type: String }
//     },
//     flowerNames: [{ type: String }],
//     stemLength: { type: Number },
//     wrapper: {
//         wrapperId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'Wrapper'
//         },
//         name: { type: String },
//         price: {
//             type: Number,
//             default: 0
//         },
//         image: { type: String },
//         wrapperType: {
//             type: String,
//             enum: ['per_item', 'per_order'],
//             default: 'per_item'
//         }
//     },
//     itemType: {
//         type: String,
//         enum: ['flower'],
//         default: 'flower'
//     },
//     // Добавляем расчет itemTotal для цветов
//     itemTotal: {
//         type: Number,
//         required: true
//     }
// });
//
// const addonCartItemSchema = new mongoose.Schema({
//     ...baseCartItemSchema,
//     addonId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Addon',
//         required: true
//     },
//     type: {
//         type: String,
//         required: true
//     },
//     itemType: {
//         type: String,
//         enum: ['addon'],
//         default: 'addon'
//     },
//     // Убираем itemTotal из схемы доп. товаров - будем вычислять динамически
// });
//
// const cartSchema = new mongoose.Schema({
//     user: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User'
//     },
//     sessionId: {
//         type: String
//     },
//     flowerItems: [flowerCartItemSchema],
//     addonItems: [addonCartItemSchema],
//     total: {
//         type: Number,
//         default: 0
//     },
//     totalItems: {
//         type: Number,
//         default: 0
//     },
//     lastUpdated: {
//         type: Date,
//         default: Date.now
//     }
// });
//
// // Middleware для расчета totals
// cartSchema.pre('save', function(next) {
//     // Общее количество товаров
//     const flowerItemsCount = this.flowerItems.reduce((total, item) => total + item.quantity, 0);
//     const addonItemsCount = this.addonItems.reduce((total, item) => total + item.quantity, 0);
//     this.totalItems = flowerItemsCount + addonItemsCount;
//
//     // Считаем общую стоимость цветов
//     const flowerTotal = this.flowerItems.reduce((total, item) => {
//         let itemTotalPrice;
//
//         if (item.flowerType === 'single' && item.wrapper && item.wrapper.wrapperId) {
//             // Для одиночных цветов с оберткой: (цена цветка * количество) + цена обертки
//             itemTotalPrice = (item.price * item.quantity) + (item.wrapper.price || 0);
//         } else {
//             // Для букетов или цветов без обертки
//             const wrapperPrice = item.wrapper ? (item.wrapper.price || 0) : 0;
//             itemTotalPrice = (item.price + wrapperPrice) * item.quantity;
//         }
//
//         // Сохраняем itemTotal для отображения на фронтенде
//         item.itemTotal = itemTotalPrice / item.quantity; // Цена за единицу
//
//         return total + itemTotalPrice;
//     }, 0);
//
//     // Считаем общую стоимость дополнительных товаров
//     const addonTotal = this.addonItems.reduce((total, item) => {
//         // Для доп. товаров: цена * количество
//         const itemTotal = item.price * item.quantity;
//         return total + itemTotal;
//     }, 0);
//
//     this.total = flowerTotal + addonTotal;
//     this.lastUpdated = Date.now();
//     next();
// });
//
// cartSchema.index({ user: 1 }, { sparse: true });
// cartSchema.index({ sessionId: 1 }, { sparse: true });
//
// export default mongoose.model('Cart', cartSchema);





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
    // Выбранный цвет (только для одиночных цветов) - заменяем flowerColor
    selectedColor: {
        name: { type: String },
        value: { type: String },
        image: { type: String } // конкретное изображение для выбранного цвета
    },
    // Выбранная длина стебля с ценой - заменяем stemLength
    selectedStemLength: {
        length: { type: Number },
        price: { type: Number }
    },
    flowerNames: [{ type: String }],
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

        // Используем цену из selectedStemLength если есть, иначе из базовой цены
        const itemPrice = item.selectedStemLength?.price || item.price;

        if (item.flowerType === 'single' && item.wrapper && item.wrapper.wrapperId) {
            // Для одиночных цветов с оберткой: (цена цветка * количество) + цена обертки
            itemTotalPrice = (itemPrice * item.quantity) + (item.wrapper.price || 0);
        } else {
            // Для букетов или цветов без обертки
            const wrapperPrice = item.wrapper ? (item.wrapper.price || 0) : 0;
            itemTotalPrice = (itemPrice + wrapperPrice) * item.quantity;
        }

        // Сохраняем itemTotal для отображения на фронтенде
        item.itemTotal = itemTotalPrice;

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

// Добавляем метод для поиска дубликатов с учетом цвета и длины
cartSchema.methods.findDuplicateFlowerItem = function(productId, selectedColor, selectedStemLength, wrapperId) {
    return this.flowerItems.find(item => {
        const sameProduct = item.product.toString() === productId.toString();
        const sameColor = (
            (!item.selectedColor && !selectedColor) ||
            (item.selectedColor && selectedColor && item.selectedColor.value === selectedColor.value)
        );
        const sameStemLength = (
            (!item.selectedStemLength && !selectedStemLength) ||
            (item.selectedStemLength && selectedStemLength && item.selectedStemLength.length === selectedStemLength.length)
        );
        const sameWrapper = (
            (!item.wrapper && !wrapperId) ||
            (item.wrapper && wrapperId && item.wrapper.wrapperId.toString() === wrapperId.toString())
        );

        return sameProduct && sameColor && sameStemLength && sameWrapper;
    });
};

// Статический метод для миграции старых данных
cartSchema.statics.migrateOldData = async function() {
    try {
        const carts = await this.find({
            $or: [
                { 'flowerItems.flowerColor': { $exists: true } },
                { 'flowerItems.stemLength': { $exists: true, $type: 'number' } }
            ]
        });

        for (const cart of carts) {
            let needsUpdate = false;

            for (const item of cart.flowerItems) {
                // Мигрируем flowerColor -> selectedColor
                if (item.flowerColor && item.flowerColor.name && item.flowerColor.value) {
                    item.selectedColor = {
                        name: item.flowerColor.name,
                        value: item.flowerColor.value,
                        image: item.image // сохраняем текущее изображение
                    };
                    delete item.flowerColor;
                    needsUpdate = true;
                }

                // Мигрируем stemLength -> selectedStemLength
                if (item.stemLength && typeof item.stemLength === 'number') {
                    item.selectedStemLength = {
                        length: item.stemLength,
                        price: item.price // используем текущую цену
                    };
                    // Удаляем старое поле stemLength только если оно число
                    delete item.stemLength;
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                await cart.save();
                console.log(`Migrated cart: ${cart._id}`);
            }
        }

        console.log('Cart migration completed');
    } catch (error) {
        console.error('Cart migration error:', error);
    }
};

cartSchema.index({ user: 1 }, { sparse: true });
cartSchema.index({ sessionId: 1 }, { sparse: true });

export default mongoose.model('Cart', cartSchema);