import Homepage from '../models/Homepage.js';
import Product from '../models/Product.js';

// Вспомогательная функция для форматирования даты
const formatDate = (dateString, isMobile = false) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    if (isMobile) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } else {
        const options = {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        };
        return date.toLocaleDateString('ru-RU', options);
    }
};

// Контроллер для получения данных главной страницы
export const getHomepage = async (req, res) => {
    try {
        const homepage = await Homepage.findOne();

        // Подсчитываем активные товары (без проверки продавцов)
        const newestProductsCount = await Product.countDocuments({
            isActive: true,
            quantity: {
                $gt: 0
            }
        });

        // Форматируем слайды с промо-акциями
        const formattedSlides = homepage?.sliderImages?.map(slide => {
            if (slide.promotions && slide.promotions.length > 0) {
                const formattedPromotions = slide.promotions.map(promo => ({
                    ...promo.toObject(),
                    formattedStartDate: formatDate(promo.startDate),
                    formattedEndDate: formatDate(promo.endDate),
                    formattedStartDateMobile: formatDate(promo.startDate, true),
                    formattedEndDateMobile: formatDate(promo.endDate, true)
                }));

                return {
                    ...slide.toObject(),
                    promotions: formattedPromotions
                };
            }
            return slide;
        }) || [];

        res.json({
            ...homepage?.toObject(),
            sliderImages: formattedSlides,
            showNewestTitle: newestProductsCount > 0
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для обновления данных главной страницы
export const updateHomepage = async (req, res) => {
    try {
        const {
            sliderImages,
            genderImages
        } = req.body;

        // Валидация данных
        if (!Array.isArray(sliderImages) || !Array.isArray(genderImages)) {
            return res.status(400).json({
                message: 'Invalid data format'
            });
        }

        // Очищаем пустые промоушены
        const cleanedSliderImages = sliderImages.map(slide => ({
            ...slide,
            promotions: slide.promotions?.filter(p => p.title || p.description) || []
        }));

        const homepage = await Homepage.findOneAndUpdate({}, {
            sliderImages: cleanedSliderImages,
            genderImages: genderImages.filter(img => img.url)
        }, {
            new: true,
            upsert: true
        });

        res.json(homepage);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для удаления изображения из слайдера
export const deleteSliderImage = async (req, res) => {
    try {
        const {
            imageUrl
        } = req.params;
        const homepage = await Homepage.findOne();

        if (!homepage) {
            return res.status(404).json({
                message: 'Homepage data not found'
            });
        }

        homepage.sliderImages = homepage.sliderImages.filter(sliderImage => sliderImage.url !== imageUrl);
        await homepage.save();

        res.json(homepage);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для удаления изображения для полов
export const deleteGenderImage = async (req, res) => {
    try {
        const {
            imageUrl
        } = req.params;
        const homepage = await Homepage.findOne();

        if (!homepage) {
            return res.status(404).json({
                message: 'Homepage data not found'
            });
        }

        homepage.genderImages = homepage.genderImages.filter(genderImage => genderImage.url !== imageUrl);
        await homepage.save();

        res.json(homepage);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для обновления акции в каруселе
export const updatePromotion = async (req, res) => {
    try {
        const {
            imageUrl,
            promotions
        } = req.body;
        const homepage = await Homepage.findOne();

        if (!homepage) {
            return res.status(404).json({
                message: 'Homepage data not found'
            });
        }

        const sliderImage = homepage.sliderImages.find(img => img.url === imageUrl);
        if (sliderImage) {
            sliderImage.promotions = promotions;
            await homepage.save();
            res.json(homepage);
        } else {
            res.status(404).json({
                message: 'Image not found'
            });
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для получения форматированных слайдов
export const getFormattedSlides = async (req, res) => {
    try {
        const homepage = await Homepage.findOne();
        if (!homepage) {
            return res.status(404).json({
                message: 'Данные домашней страницы не найдены'
            });
        }

        const formattedSlides = homepage.sliderImages.map(slide => {
            const promotion = slide.promotions?. [0] || {};
            return {
                url: slide.url,
                backgroundType: slide.backgroundType || 'color',
                backgroundColor: slide.backgroundColor || '#ffffff',
                backgroundImage: slide.backgroundImage || '',
                backgroundVideo: slide.backgroundVideo || '',
                promotions: [{
                    title: promotion.title || '',
                    description: promotion.description || '',
                    startDate: promotion.startDate || '',
                    endDate: promotion.endDate || '',
                    formattedStartDate: formatDate(promotion.startDate),
                    formattedEndDate: formatDate(promotion.endDate),
                    formattedStartDateMobile: formatDate(promotion.startDate, true),
                    formattedEndDateMobile: formatDate(promotion.endDate, true)
                }],
                colorTitle: slide.colorTitle || '#000000',
                colorDescription: slide.colorDescription || '#000000',
                fontSizeTitle: slide.fontSizeTitle || '16px',
                fontSizeDescription: slide.fontSizeDescription || '14px',
                fontFamilleTitle: slide.fontFamilleTitle || 'Arial',
                fontFamilleDescription: slide.fontFamilleDescription || 'Arial'
            };
        });

        res.json(formattedSlides);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для проверки наличия товаров по категории/гендеру
export const checkProducts = async (req, res) => {
    try {
        const {
            gender
        } = req.query;

        if (!gender) {
            return res.status(400).json({
                message: 'Gender parameter is required'
            });
        }

        let query = {
            isActive: true,
            quantity: {
                $gt: 0
            }
        };

        // Упрощенная логика - проверяем только активные товары
        if (gender === 'Аксессуары') {
            query.category = 'Аксессуары';
        } else {
            query.gender = gender;
        }

        const count = await Product.countDocuments(query);
        res.json({
            hasProducts: count > 0,
            count
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};