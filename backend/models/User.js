import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['guest', 'customer', 'admin'],
        default: 'guest'
    },
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    }],
    address: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    phoneNumber: {
        type: String
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: false
    }]
});

// Удаляем модель Seller - больше не нужна
const User = mongoose.model('User', userSchema);

export default User;