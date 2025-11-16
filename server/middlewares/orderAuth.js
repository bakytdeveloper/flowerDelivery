// import jwt from 'jsonwebtoken';
//
// export const orderAuth = (req, res, next) => {
//     try {
//         // Проверяем авторизацию по токену
//         const authHeader = req.headers.authorization;
//
//         if (authHeader && authHeader.startsWith('Bearer ')) {
//             const token = authHeader.substring(7);
//             try {
//                 const decoded = jwt.verify(token, process.env.JWT_SECRET);
//                 req.user = decoded;
//                 return next();
//             } catch (error) {
//                 // Если токен невалиден, продолжаем как гость
//                 console.log('Invalid token, continuing as guest:', error.message);
//             }
//         }
//
//         // Если нет токена или токен невалиден, работаем как гость
//         const sessionId = req.headers['x-session-id'];
//         if (!sessionId) {
//             // Создаем новый sessionId для гостя
//             const newSessionId = 'guest_' + Math.random().toString(36).substr(2, 9);
//             req.user = {
//                 sessionId: newSessionId,
//                 role: 'guest'
//             };
//             return next();
//         }
//
//         req.user = {
//             sessionId: sessionId,
//             role: 'guest'
//         };
//
//         next();
//     } catch (error) {
//         console.error('Order auth error:', error);
//         res.status(500).json({
//             message: 'Authentication error'
//         });
//     }
// };





import jwt from 'jsonwebtoken';

export const orderAuth = (req, res, next) => {
    try {
        // Проверяем авторизацию по токену
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const decoded = jwt.verify(token, process.env.SECRET_KEY); // Исправлено: SECRET_KEY вместо JWT_SECRET

                // Создаем правильную структуру user
                req.user = {
                    userId: decoded.userId || decoded._id, // поддерживаем оба варианта
                    sessionId: decoded.sessionId,
                    role: decoded.role || 'customer',
                    email: decoded.email // добавляем email для полноты
                };
                console.log('✅ Order auth - авторизованный пользователь:', req.user);
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
                userId: null,
                sessionId: newSessionId,
                role: 'guest'
            };
            console.log('🆕 Order auth - новый гость:', req.user);
            return next();
        }

        req.user = {
            userId: null,
            sessionId: sessionId,
            role: 'guest'
        };

        console.log('👤 Order auth - существующий гость:', req.user);
        next();
    } catch (error) {
        console.error('Order auth error:', error);
        res.status(500).json({
            message: 'Authentication error'
        });
    }
};