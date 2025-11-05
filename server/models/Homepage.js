import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
    title: String,
    description: String,
    startDate: Date,
    endDate: Date
});

const sliderImageSchema = new mongoose.Schema({
    url: String,
    backgroundType: {
        type: String,
        enum: ['color', 'image', 'video'],
        default: 'color'
    },
    backgroundColor: {
        type: String
    },
    backgroundImage: {
        type: String
    },
    backgroundVideo: {
        type: String
    },
    promotions: [promotionSchema],
    colorTitle: {
        type: String
    },
    colorDescription: {
        type: String
    },
    fontFamilleTitle: {
        type: String
    },
    fontFamilleDescription: {
        type: String
    },
    fontSizeTitle: {
        type: String
    },
    fontSizeDescription: {
        type: String
    }
});

const homepageSchema = new mongoose.Schema({
    sliderImages: [sliderImageSchema]
});

const Homepage = mongoose.model('Homepage', homepageSchema);
export default Homepage;