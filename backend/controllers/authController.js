import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {
    sendOTP,
    verifyOTP
} from '../smtp/otpService.js';

// Вспомогательная функция для проверки email
const checkEmailExists = async (email) => {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({
        email: normalizedEmail
    });

    return {
        exists: !!user,
        type: user ? 'user' : null,
        user
    };
};

// Контроллер для проверки email
export const checkEmail = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email обязателен'
        });
    }

    try {
        const emailCheck = await checkEmailExists(email);

        res.json({
            success: true,
            unique: !emailCheck.exists,
            exists: emailCheck.exists,
            existsType: emailCheck.type,
            message: emailCheck.exists ?
                `Извините, но данный Email уже зарегистрирован` : 'Email свободен'
        });
    } catch (error) {
        console.error('Error checking email:', error);
        res.status(500).json({
            success: false,
            message: 'Ошибка при проверке email'
        });
    }
};

// Контроллер для отправки OTP
export const sendOtp = async (req, res) => {
    const { email, purpose = 'registration' } = req.body;

    try {
        const otp = await sendOTP(email, purpose);

        // В тестовом режиме возвращаем OTP в ответе
        if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
            res.status(200).json({
                message: 'OTP сгенерирован (тестовый режим)',
                purpose: purpose,
                otp: otp, // Для тестирования
                debug: true
            });
        } else {
            res.status(200).json({
                message: 'OTP отправлен',
                purpose: purpose
            });
        }
    } catch (error) {
        console.error('Error in sendOtp:', error);
        // Даже при ошибке возвращаем успех с OTP для тестирования
        const otp = Math.random().toString().substr(2, 6);
        console.log(`🔄 Fallback OTP для ${email}: ${otp}`);

        res.status(200).json({
            message: 'OTP сгенерирован (режим ошибки)',
            purpose: purpose,
            otp: otp,
            debug: true,
            error: error.message
        });
    }
};

// Контроллер для проверки OTP
export const verifyOtp = (req, res) => {
    const { email, otp, purpose = 'registration' } = req.body;

    try {
        const isValid = verifyOTP(email, otp, purpose);
        if (isValid) {
            const tempToken = jwt.sign({
                    email,
                    purpose,
                    verified: true
                },
                process.env.SECRET_KEY, {
                    expiresIn: '10m'
                }
            );

            res.status(200).json({
                message: 'OTP verified',
                tempToken,
                success: true
            });
        } else {
            res.status(400).json({
                message: 'Invalid OTP',
                success: false
            });
        }
    } catch (error) {
        console.error('Error in verifyOtp:', error);
        res.status(500).json({
            message: 'Ошибка при проверке OTP',
            success: false
        });
    }
};

// 📌 1. Создание временного токена для проверки email
export const createTempToken = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({
                message: 'Email is required',
                success: false
            });
        }

        // Проверим, не существует ли пользователь уже
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists',
                success: false
            });
        }

        const tempToken = jwt.sign({
                email,
                verified: true
            },
            process.env.SECRET_KEY, {
                expiresIn: '10m'
            }
        );

        res.json({
            tempToken,
            success: true
        });
    } catch (error) {
        console.error('Error in createTempToken:', error);
        res.status(500).json({
            message: error.message,
            success: false
        });
    }
};

// 📌 2. Регистрация пользователя
export const register = async (req, res) => {
    const { email, password, name, tempToken } = req.body;

    try {
        if (!tempToken) {
            return res.status(400).json({
                message: 'Verification token is required',
                success: false
            });
        }

        const decoded = jwt.verify(tempToken, process.env.SECRET_KEY);

        if (!decoded || decoded.email !== email || !decoded.verified) {
            return res.status(400).json({
                message: 'Invalid verification token',
                success: false
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists',
                success: false
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: 'customer',
        });

        await newUser.save();

        const authToken = jwt.sign({
                userId: newUser._id,
                email: newUser.email,
                role: newUser.role
            },
            process.env.SECRET_KEY, {
                expiresIn: '7d'
            }
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
            },
            token: authToken,
        });
    } catch (error) {
        console.error('Error in register:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({
                message: 'Verification token expired',
                success: false
            });
        }
        res.status(500).json({
            message: error.message,
            success: false
        });
    }
};

// Контроллер для авторизации
export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Проверка администратора
        if (email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase() &&
            password === process.env.ADMIN_PASSWORD) {

            const adminToken = jwt.sign({
                userId: 'admin',
                email,
                role: 'admin'
            }, process.env.SECRET_KEY, {
                expiresIn: '7d'
            });

            return res.json({
                user: {
                    name: 'Администратор',
                    email: email,
                    role: 'admin'
                },
                token: adminToken,
                success: true
            });
        }

        // Проверка пользователя
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (isPasswordValid) {
                const token = jwt.sign({
                    userId: user._id,
                    email: user.email,
                    role: user.role
                }, process.env.SECRET_KEY, {
                    expiresIn: '7d'
                });

                return res.json({
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    },
                    token,
                    success: true
                });
            }
        }

        return res.status(401).json({
            message: 'Invalid email or password',
            success: false
        });

    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({
            message: error.message,
            success: false
        });
    }
};

// Контроллер для восстановления пароля
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        await sendOTP(email, 'password_reset');

        res.status(200).json({
            message: 'OTP sent for password reset',
            success: true
        });
    } catch (error) {
        console.error('Error in forgotPassword:', error);
        res.status(500).json({
            message: 'Error sending OTP',
            success: false
        });
    }
};

// Остальные контроллеры остаются без изменений...
// Контроллер для сброса пароля
export const resetPassword = async (req, res) => {
    const { email, otp, newPassword, tempToken } = req.body;

    try {
        let isValid = false;

        if (tempToken) {
            try {
                const decoded = jwt.verify(tempToken, process.env.SECRET_KEY);
                isValid = decoded.email === email &&
                    decoded.purpose === 'password_reset' &&
                    decoded.verified === true;
            } catch (error) {
                isValid = verifyOTP(email, otp, 'password_reset');
            }
        } else {
            isValid = verifyOTP(email, otp, 'password_reset');
        }

        if (!isValid) {
            return res.status(400).json({
                message: 'Invalid OTP or token',
                success: false
            });
        }

        let user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long',
                success: false
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            message: 'Password reset successfully',
            success: true
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({
            message: 'Error resetting password',
            success: false
        });
    }
};

// Контроллер для получения профиля пользователя
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// Контроллер для обновления профиля пользователя
export const updateProfile = async (req, res) => {
    const userId = req.params.userId;
    const { address, phoneNumber } = req.body;

    try {
        const updatedUser = await User.findByIdAndUpdate(
            userId, {
                address,
                phoneNumber
            }, {
                new: true
            }
        );
        if (!updatedUser) {
            return res.status(404).json({
                message: 'User not found'
            });
        }
        res.json(updatedUser);
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
};

// Контроллер для обновления пароля по email
export const updatePasswordByEmail = async (req, res) => {
    const { email, newPassword } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;

        await user.save();

        res.json({
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({
            message: 'Internal Server Error'
        });
    }
};

// Контроллер для получения информации о перенаправлении
export const getRedirectInfo = async (req, res) => {
    try {
        const user = req.user;

        let redirectPath = '/';

        if (user.role === 'customer') {
            redirectPath = '/profile';
        } else if (user.role === 'admin') {
            redirectPath = '/admin';
        }

        res.json({
            success: true,
            redirectPath: redirectPath,
            user: {
                name: user.name || '',
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting redirect information'
        });
    }
};