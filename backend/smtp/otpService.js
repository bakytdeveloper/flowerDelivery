// otpService.js
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Загружаем .env файл ДО всего остального
dotenv.config();

let otpStorage = {};

// Функция для создания транспортера
const createTransporter = () => {
    // Если SMTP не настроен или development режим - используем тестовый режим
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD || process.env.NODE_ENV === 'development') {
        console.log('⚠️ SMTP не настроен, используем тестовый режим');
        return {
            sendMail: (mailOptions) => {
                console.log('📧 [TEST MODE] Пропускаем отправку email:', {
                    to: mailOptions.to,
                    subject: mailOptions.subject
                });
                return Promise.resolve({ messageId: 'test-mode-message-id' });
            }
        };
    }

    // Production режим с Gmail
    console.log('✅ SMTP настроен, используем Gmail');
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        },
        // Дополнительные настройки для Gmail
        tls: {
            rejectUnauthorized: false
        }
    });
};

const transporter = createTransporter();

const sendOTP = async (email, purpose = 'registration') => {
    const otp = crypto.randomInt(100000, 999999).toString();
    const timestamp = Date.now();

    otpStorage[email] = {
        otp,
        purpose,
        timestamp,
        attempts: 0
    };

    setTimeout(() => {
        if (otpStorage[email] && otpStorage[email].timestamp === timestamp) {
            delete otpStorage[email];
        }
    }, 10 * 60 * 1000);

    const subject = purpose === 'password_reset' ?
        'Восстановление пароля - FlowerKZ' :
        'Подтверждение регистрации - FlowerKZ';

    // Всегда логируем OTP для отладки
    console.log(`🎯 OTP для ${email}: ${otp} (${purpose})`);

    // Если SMTP не настроен, просто возвращаем OTP
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        console.log('📧 Пропускаем отправку email - SMTP не настроен');
        return otp;
    }

    const html = purpose === 'password_reset' ?
        `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0;">FlowerKZ</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">Магазин цветов</p>
                </div>
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2 style="color: #2c3e50; margin-bottom: 20px;">Восстановление пароля</h2>
                    <p style="color: #495057; margin-bottom: 25px;">Для восстановления пароля используйте следующий код подтверждения:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="font-size: 32px; font-weight: bold; color: #2c3e50; 
                           background-color: white; padding: 20px; border-radius: 10px; 
                           display: inline-block; border: 2px dashed #667eea; letter-spacing: 5px;">
                            ${otp}
                        </div>
                    </div>
                    <p style="color: #e74c3c; font-size: 14px; text-align: center;">
                        ⚠️ Код действителен в течение 10 минут
                    </p>
                </div>
                <div style="background: #2c3e50; padding: 15px; text-align: center; color: white; font-size: 12px;">
                    <p style="margin: 0;">© 2024 FlowerKZ. Все права защищены.</p>
                </div>
            </div>
        ` :
        `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; color: white;">
                    <h1 style="margin: 0;">FlowerKZ</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">Магазин цветов</p>
                </div>
                <div style="padding: 30px; background: #f8f9fa;">
                    <h2 style="color: #2c3e50; margin-bottom: 20px;">Добро пожаловать в FlowerKZ!</h2>
                    <p style="color: #495057; margin-bottom: 25px;">Для завершения регистрации используйте следующий код подтверждения:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <div style="font-size: 32px; font-weight: bold; color: #2c3e50; 
                           background-color: white; padding: 20px; border-radius: 10px; 
                           display: inline-block; border: 2px dashed #667eea; letter-spacing: 5px;">
                            ${otp}
                        </div>
                    </div>
                    <p style="color: #e74c3c; font-size: 14px; text-align: center;">
                        ⚠️ Код действителен в течение 10 минут
                    </p>
                </div>
                <div style="background: #2c3e50; padding: 15px; text-align: center; color: white; font-size: 12px;">
                    <p style="margin: 0;">© 2024 FlowerKZ. Все права защищены.</p>
                </div>
            </div>
        `;

    try {
        console.log(`📨 Отправка email на: ${email}`);
        const info = await transporter.sendMail({
            from: `"FlowerKZ" <${process.env.SMTP_FROM}>`,
            to: email,
            subject: subject,
            html: html,
            text: `Ваш код подтверждения: ${otp}. Действителен 10 минут.`
        });

        console.log('✅ Email отправлен успешно:', info.messageId);
        return otp;
    } catch (error) {
        console.error('❌ Ошибка отправки email:', error);
        // Даже при ошибке возвращаем OTP для возможности тестирования
        console.log(`🔄 Возвращаем OTP для тестирования: ${otp}`);
        return otp;
    }
};

const verifyOTP = (email, otp, purpose = 'registration') => {
    const storedData = otpStorage[email];

    if (!storedData || storedData.purpose !== purpose) {
        console.log(`❌ OTP не найден для: ${email}`);
        return false;
    }

    if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
        delete otpStorage[email];
        console.log(`⏰ OTP истек для: ${email}`);
        return false;
    }

    storedData.attempts += 1;

    if (storedData.attempts >= 10) {
        delete otpStorage[email];
        console.log(`🚫 Превышено количество попыток для: ${email}`);
        return false;
    }

    const isValid = storedData.otp === otp;

    console.log(`🔍 Проверка OTP для ${email}: введен ${otp}, ожидается ${storedData.otp}, результат: ${isValid}`);

    if (isValid) {
        delete otpStorage[email];
        console.log(`✅ OTP подтвержден для: ${email}`);
    }

    return isValid;
};

const cleanupExpiredOTPs = () => {
    const now = Date.now();
    Object.keys(otpStorage).forEach(email => {
        if (now - otpStorage[email].timestamp > 10 * 60 * 1000) {
            delete otpStorage[email];
            console.log(`🧹 Очищен истекший OTP для: ${email}`);
        }
    });
};

setInterval(cleanupExpiredOTPs, 5 * 60 * 1000);

export {
    sendOTP,
    verifyOTP,
    transporter,
    cleanupExpiredOTPs
};