import jwt from 'jsonwebtoken';

const cartAuth = (req, res, next) => {
    if (!process.env.SECRET_KEY) {
        console.error('SECRET_KEY is not configured');
        return res.status(500).json({
            message: 'Server configuration error'
        });
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const sessionId = req.headers['x-session-id'];

    if (token) {
        jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
            if (err) {
                console.log('JWT verification failed:', err.message);
                // Если токен невалиден, продолжаем как гость с переданным sessionId
                req.user = {
                    role: 'guest',
                    userId: null,
                    sessionId: sessionId
                };
                return next();
            }

            // Обновляем валидные роли (убираем seller)
            const validRoles = ['customer', 'admin'];
            if (user && validRoles.includes(user.role)) {
                req.user = user;
            } else {
                req.user = {
                    role: 'guest',
                    userId: null,
                    sessionId: sessionId
                };
            }
            next();
        });
    } else {
        // Если токена нет, ВСЕГДА используем только переданный sessionId
        req.user = {
            role: 'guest',
            userId: null,
            sessionId: sessionId
        };
        next();
    }
};

export {
    cartAuth
};