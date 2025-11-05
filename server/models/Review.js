import mongoose from 'mongoose';

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
    createdAt: {
        type: Date,
        default: Date.now
    },
    verifiedPurchase: {
        type: Boolean,
        default: false
    },
    // Переименовываем adminReply в ownerReply для единообразия
    ownerReply: {
        type: String,
        maxlength: 1000
    },
    ownerReplyDate: {
        type: Date
    }
});

reviewSchema.index({
    user: 1,
    product: 1
}, {
    unique: true
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;