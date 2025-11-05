import mongoose from 'mongoose';

const reviewImageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    thumbnailUrl: {
        type: String
    }
}, { _id: true }); // Добавляем _id для изображений

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        maxlength: 1000
    },
    // Ограничиваем до 1 изображения
    images: {
        type: [reviewImageSchema],
        validate: [arrayLimit, 'Можно загрузить только 1 изображение']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    verifiedPurchase: {
        type: Boolean,
        default: false
    },
    ownerReply: {
        type: String,
        maxlength: 1000
    },
    ownerReplyDate: {
        type: Date
    }
});

// Валидатор для ограничения количества изображений
function arrayLimit(val) {
    return val.length <= 1;
}

reviewSchema.index({
    user: 1,
    product: 1
}, {
    unique: true
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;