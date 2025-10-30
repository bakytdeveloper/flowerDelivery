import jwt from 'jsonwebtoken';

export const orderAuth = (req, res, next) => {
    try {
        // Проверяем авторизацию по токену
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = decoded;
                return next();
            } catch (error) {
                // Если токен невалиден, продолжаем как гость
                console.log('Invalid token, continuing as guest:', error.message);
            }
        }

        // Если нет токена или токен невалиден, работаем как гость
        const sessionId = req.headers['x-session-id'];
        if (!sessionId) {
            // Создаем новый sessionId для гостя
            const newSessionId = 'guest_' + Math.random().toString(36).substr(2, 9);
            req.user = {
                sessionId: newSessionId,
                role: 'guest'
            };
            return next();
        }

        req.user = {
            sessionId: sessionId,
            role: 'guest'
        };

        next();
    } catch (error) {
        console.error('Order auth error:', error);
        res.status(500).json({
            message: 'Authentication error'
        });
    }
};