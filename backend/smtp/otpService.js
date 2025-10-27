import nodemailer from 'nodemailer';
import crypto from 'crypto';

let otpStorage = {};

const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

const sendOTP = (email, purpose = 'registration') => {
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
        'Восстановление пароля' :
        'Подтверждение регистрации';

    const html = purpose === 'password_reset' ?
        `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <p>Для восстановления пароля используйте следующий код:</p>
                <p style="font-size: 18px; font-weight: bold; color: #2c3e50; 
                   background-color: #f8f9fa; padding: 10px; border-radius: 5px; 
                   display: inline-block;">
                    ${otp}
                </p>
                <p style="margin-top: 20px; color: #e74c3c;">
                    ⚠️ Код действителен в течение 10 минут
                </p>
            </div>
        ` :
        `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <p>Для завершения регистрации используйте следующий код:</p>
                <p style="font-size: 18px; font-weight: bold; color: #2c3e50; 
                   background-color: #f8f9fa; padding: 10px; border-radius: 5px; 
                   display: inline-block;">
                    ${otp}
                </p>
                <p style="margin-top: 20px; color: #e74c3c;">
                    ⚠️ Код действителен в течение 10 минут
                </p>
            </div>
        `;

    transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: subject,
        html: html,
        text: `Ваш код подтверждения: ${otp}. Действителен 10 минут.`
    });

    return otp;
};

const verifyOTP = (email, otp, purpose = 'registration') => {
    const storedData = otpStorage[email];

    if (!storedData || storedData.purpose !== purpose) {
        return false;
    }

    if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
        delete otpStorage[email];
        return false;
    }

    storedData.attempts += 1;

    if (storedData.attempts >= 10) {
        delete otpStorage[email];
        return false;
    }

    const isValid = storedData.otp === otp;

    if (isValid) {
        delete otpStorage[email];
    }

    return isValid;
};

const cleanupExpiredOTPs = () => {
    const now = Date.now();
    Object.keys(otpStorage).forEach(email => {
        if (now - otpStorage[email].timestamp > 10 * 60 * 1000) {
            delete otpStorage[email];
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