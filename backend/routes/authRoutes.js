import express from 'express';
import rateLimit from 'express-rate-limit';
import {
    checkEmail,
    sendOtp,
    verifyOtp,
    register,
    login,
    forgotPassword,
    resetPassword,
    getProfile,
    updateProfile,
    updatePasswordByEmail,
    getRedirectInfo,
    createTempToken
} from '../controllers/authController.js';
// import { authenticateToken, checkRole, requireCustomerOrAdmin } from '../middleware/authenticateToken.js';
import {
    authenticateToken,
    checkRole
} from '../middlewares/authenticateToken.js';


const router = express.Router();

const wrapLimiter = (limiter) => {
    return (req, res, next) => {
        return limiter(req, res, next);
    };
};

// Лимитер для OTP запросов
const otpLimiter = wrapLimiter(rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: 'Слишком много попыток. Попробуйте позже.',
    standardHeaders: true,
    legacyHeaders: false,
}));

// Лимитер для входа
const loginLimiter = wrapLimiter(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Слишком много попыток входа. Попробуйте позже.',
    standardHeaders: true,
    legacyHeaders: false,
}));

// Маршруты аутентификации
router.get('/checkEmail', checkEmail);
router.post('/check-email', checkEmail);
router.post('/send-otp', otpLimiter, sendOtp);
router.post('/verify-otp', otpLimiter, verifyOtp);
// 📌 Маршрут для получения временного токена
router.post('/temp-token', createTempToken);
router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', otpLimiter, resetPassword);

// Защищенные маршруты профиля
router.get('/profile', authenticateToken, checkRole(['customer']), getProfile);
router.put('/profile/:userId', authenticateToken, checkRole(['customer']), updateProfile);
router.get('/redirect-info', authenticateToken, getRedirectInfo);

// Маршруты для управления паролями
router.put('/update-password-by-email', updatePasswordByEmail);

export default router;