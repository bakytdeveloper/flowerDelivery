import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './LoginRegister.css';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaUser, FaArrowLeft, FaTimes } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import { sanitizeInputLogin } from "../../utils/securityUtils";

// Константы
const OTP_LENGTH = 6;
const PASSWORD_MIN_LENGTH = 6;
const RESEND_TIMER_DURATION = 60;

const STEPS = {
    REGISTER: {
        EMAIL_ENTRY: 1,
        OTP_VERIFICATION: 2,
        USER_DETAILS: 3
    },
    FORGOT_PASSWORD: {
        EMAIL_ENTRY: 1,
        OTP_VERIFICATION: 2,
        PASSWORD_UPDATE: 3
    }
};

const OTP_PURPOSES = {
    REGISTRATION: 'registration',
    PASSWORD_RESET: 'password_reset'
};

const LoginRegister = ({ setShowSidebar, setShowHeader }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        otp: '',
        newPassword: ''
    });

    const [uiState, setUiState] = useState({
        isRegisterMode: false,
        showPassword: false,
        step: STEPS.REGISTER.EMAIL_ENTRY,
        resendTimer: -1,
        forgotPassword: false,
        forgotPasswordStep: STEPS.FORGOT_PASSWORD.EMAIL_ENTRY,
        forgotPasswordResendTimer: -1,
        isLoading: false
    });

    const [errors, setErrors] = useState({
        otp: '',
        otpForgotPassword: '',
        passwordMatch: false,
        email: '',
        password: '',
        name: ''
    });

    const [tempToken, setTempToken] = useState('');

    const { login, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    // Очистка временных токенов
    const clearTempTokens = useCallback(() => {
        sessionStorage.removeItem('tempToken');
        sessionStorage.removeItem('tempTokenForgot');
        setTempToken('');
    }, []);

    // Таймеры для повторной отправки OTP
    useEffect(() => {
        let timer;
        if (uiState.resendTimer > 0) {
            timer = setInterval(() => {
                setUiState(prev => ({ ...prev, resendTimer: prev.resendTimer - 1 }));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [uiState.resendTimer]);

    useEffect(() => {
        let timer;
        if (uiState.forgotPasswordResendTimer > 0) {
            timer = setInterval(() => {
                setUiState(prev => ({ ...prev, forgotPasswordResendTimer: prev.forgotPasswordResendTimer - 1 }));
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [uiState.forgotPasswordResendTimer]);

    // Проверка аутентификации при монтировании
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    // Очистка при размонтировании
    useEffect(() => {
        return () => {
            clearTempTokens();
        };
    }, [clearTempTokens]);

    // Скрытие header/sidebar
    useEffect(() => {
        setShowHeader(false);
        setShowSidebar(false);
        return () => {
            setShowHeader(true);
            setShowSidebar(true);
        };
    }, [setShowHeader, setShowSidebar]);

    // Хелпер функции
    const sanitizeEmail = (email) => {
        return sanitizeInputLogin(email).toLowerCase().trim();
    };

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateField = (field, value) => {
        switch (field) {
            case 'email':
                if (!value) return 'Email обязателен';
                if (!isValidEmail(value)) return 'Введите корректный email';
                return '';
            case 'password':
                if (!value) return 'Пароль обязателен';
                if (value.length < PASSWORD_MIN_LENGTH) return `Пароль должен быть не менее ${PASSWORD_MIN_LENGTH} символов`;
                return '';
            case 'name':
                if (!value) return 'Имя обязательно';
                if (value.length < 2) return 'Имя должно быть не менее 2 символов';
                return '';
            case 'otp':
                if (!value) return 'Код обязателен';
                if (value.length !== OTP_LENGTH) return `Код должен содержать ${OTP_LENGTH} цифр`;
                return '';
            default:
                return '';
        }
    };

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Очищаем ошибку при вводе
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
        if (field === 'confirmPassword' && errors.passwordMatch) {
            setErrors(prev => ({ ...prev, passwordMatch: false }));
        }
    };

    const updateUiState = (updates) => {
        setUiState(prev => ({ ...prev, ...updates }));
    };

    const updateErrors = (updates) => {
        setErrors(prev => ({ ...prev, ...updates }));
    };

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            name: '',
            otp: '',
            newPassword: ''
        });
        setErrors({
            otp: '',
            otpForgotPassword: '',
            passwordMatch: false,
            email: '',
            password: '',
            name: ''
        });
    };

    // API вызовы
    const makeApiCall = async (url, data, errorMessage) => {
        try {
            updateUiState({ isLoading: true });
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(errorMessage);
            }

            return await response.json();
        } catch (error) {
            console.error(`${errorMessage}:`, error);
            toast.error(errorMessage);
            throw error;
        } finally {
            updateUiState({ isLoading: false });
        }
    };

    const handleSendOtp = async (purpose) => {
        const sanitizedEmail = sanitizeEmail(formData.email);

        const emailError = validateField('email', sanitizedEmail);
        if (emailError) {
            toast.error(emailError);
            return false;
        }

        const checkEmailUrl = `${process.env.REACT_APP_API_URL}/api/auth/check-email`;
        const sendOtpUrl = `${process.env.REACT_APP_API_URL}/api/auth/send-otp`;

        try {
            // Проверка существования email
            const checkEmailData = await makeApiCall(
                checkEmailUrl,
                { email: sanitizedEmail },
                'Ошибка проверки email'
            );

            const shouldExist = purpose === OTP_PURPOSES.PASSWORD_RESET;
            if (checkEmailData.exists !== shouldExist) {
                toast.error(shouldExist ? 'Пользователь с таким email не найден' : 'Пользователь с таким email уже существует');
                return false;
            }

            // Отправка OTP
            await makeApiCall(
                sendOtpUrl,
                {
                    email: sanitizedEmail,
                    purpose: purpose
                },
                'Ошибка при отправке кода'
            );

            toast.success('Код подтверждения отправлен на ваш email');
            return true;
        } catch (error) {
            return false;
        }
    };

    const handleVerifyOtp = async (purpose) => {
        const sanitizedEmail = sanitizeEmail(formData.email);
        const sanitizedOtp = sanitizeInputLogin(formData.otp);

        const otpError = validateField('otp', sanitizedOtp);
        if (otpError) {
            updateErrors({ otp: otpError });
            return null;
        }

        const verifyOtpUrl = `${process.env.REACT_APP_API_URL}/api/auth/verify-otp`;

        try {
            const data = await makeApiCall(
                verifyOtpUrl,
                {
                    email: sanitizedEmail,
                    otp: sanitizedOtp,
                    purpose: purpose
                },
                'Ошибка при проверке кода'
            );

            if (data.tempToken) {
                const storageKey = purpose === OTP_PURPOSES.REGISTRATION ? 'tempToken' : 'tempTokenForgot';
                sessionStorage.setItem(storageKey, data.tempToken);
                setTempToken(data.tempToken);
            }

            toast.success('Код успешно подтвержден');
            updateErrors({ otp: '' });
            return data.tempToken;
        } catch (error) {
            updateErrors({ otp: 'Неверный код подтверждения' });
            return null;
        }
    };

    const handleLogin = async () => {
        const sanitizedEmail = sanitizeEmail(formData.email);
        const sanitizedPassword = sanitizeInputLogin(formData.password);

        const emailError = validateField('email', sanitizedEmail);
        const passwordError = validateField('password', sanitizedPassword);

        if (emailError || passwordError) {
            if (emailError) toast.error(emailError);
            if (passwordError) toast.error(passwordError);
            return;
        }

        const loginUrl = `${process.env.REACT_APP_API_URL}/api/auth/login`;

        try {
            const loginData = await makeApiCall(
                loginUrl,
                {
                    email: sanitizedEmail,
                    password: sanitizedPassword,
                },
                'Ошибка при входе'
            );

            if (loginData.success) {
                const success = login(loginData.token, loginData.user.role);
                if (success) {
                    toast.success(`Добро пожаловать, ${loginData.user.name || 'пользователь'}!`);
                    navigate('/');
                }
            }
        } catch (error) {
            // Ошибка уже обработана в makeApiCall
        }
    };

    const handleRegister = async () => {
        const nameError = validateField('name', formData.name);
        const passwordError = validateField('password', formData.password);

        if (nameError || passwordError) {
            if (nameError) toast.error(nameError);
            if (passwordError) toast.error(passwordError);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            updateErrors({ passwordMatch: true });
            toast.error('Пароли не совпадают');
            return;
        }

        const registerUrl = `${process.env.REACT_APP_API_URL}/api/auth/register`;

        try {
            const responseData = await makeApiCall(
                registerUrl,
                {
                    email: sanitizeEmail(formData.email),
                    password: sanitizeInputLogin(formData.password),
                    name: sanitizeInputLogin(formData.name),
                    tempToken: tempToken || sessionStorage.getItem('tempToken'),
                },
                'Ошибка при регистрации'
            );

            if (responseData.success) {
                const success = login(responseData.token, responseData.user.role);
                if (success) {
                    clearTempTokens();
                    toast.success('Регистрация завершена успешно!');
                    updateUiState({ isRegisterMode: false, step: STEPS.REGISTER.EMAIL_ENTRY });
                    navigate('/');
                }
            }
        } catch (error) {
            // Ошибка уже обработана в makeApiCall
        }
    };

    const handleResetPassword = async () => {
        const passwordError = validateField('password', formData.newPassword);

        if (passwordError) {
            toast.error(passwordError);
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            updateErrors({ passwordMatch: true });
            toast.error('Пароли не совпадают');
            return;
        }

        const resetPasswordUrl = `${process.env.REACT_APP_API_URL}/api/auth/reset-password`;

        try {
            await makeApiCall(
                resetPasswordUrl,
                {
                    email: sanitizeEmail(formData.email),
                    otp: sanitizeInputLogin(formData.otp),
                    newPassword: sanitizeInputLogin(formData.newPassword),
                    tempToken: tempToken || sessionStorage.getItem('tempTokenForgot'),
                },
                'Ошибка при обновлении пароля'
            );

            toast.success('Пароль успешно обновлен!');
            updateUiState({
                forgotPassword: false,
                forgotPasswordStep: STEPS.FORGOT_PASSWORD.EMAIL_ENTRY
            });
            resetForm();
            clearTempTokens();
        } catch (error) {
            // Ошибка уже обработана в makeApiCall
        }
    };

    const handleLoginRegister = async () => {
        if (uiState.isRegisterMode) {
            if (uiState.step === STEPS.REGISTER.EMAIL_ENTRY) {
                const success = await handleSendOtp(OTP_PURPOSES.REGISTRATION);
                if (success) updateUiState({ step: STEPS.REGISTER.OTP_VERIFICATION, resendTimer: RESEND_TIMER_DURATION });
            } else if (uiState.step === STEPS.REGISTER.OTP_VERIFICATION) {
                const token = await handleVerifyOtp(OTP_PURPOSES.REGISTRATION);
                if (token) updateUiState({ step: STEPS.REGISTER.USER_DETAILS });
            } else if (uiState.step === STEPS.REGISTER.USER_DETAILS) {
                await handleRegister();
            }
        } else {
            await handleLogin();
        }
    };

    const handleForgotPasswordFlow = async () => {
        if (uiState.forgotPasswordStep === STEPS.FORGOT_PASSWORD.EMAIL_ENTRY) {
            const success = await handleSendOtp(OTP_PURPOSES.PASSWORD_RESET);
            if (success) updateUiState({
                forgotPasswordStep: STEPS.FORGOT_PASSWORD.OTP_VERIFICATION,
                forgotPasswordResendTimer: RESEND_TIMER_DURATION
            });
        } else if (uiState.forgotPasswordStep === STEPS.FORGOT_PASSWORD.OTP_VERIFICATION) {
            const token = await handleVerifyOtp(OTP_PURPOSES.PASSWORD_RESET);
            if (token) updateUiState({ forgotPasswordStep: STEPS.FORGOT_PASSWORD.PASSWORD_UPDATE });
        } else if (uiState.forgotPasswordStep === STEPS.FORGOT_PASSWORD.PASSWORD_UPDATE) {
            await handleResetPassword();
        }
    };

    const handleKeyPress = async (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (uiState.isRegisterMode) {
                await handleLoginRegister();
            } else if (uiState.forgotPassword) {
                await handleForgotPasswordFlow();
            } else {
                await handleLoginRegister();
            }
        }
    };

    const handleClose = () => {
        navigate('/');
    };

    const handleBack = () => {
        if (uiState.forgotPassword) {
            if (uiState.forgotPasswordStep > STEPS.FORGOT_PASSWORD.EMAIL_ENTRY) {
                updateUiState({ forgotPasswordStep: uiState.forgotPasswordStep - 1 });
            } else {
                updateUiState({ forgotPassword: false });
            }
        } else if (uiState.isRegisterMode && uiState.step > STEPS.REGISTER.EMAIL_ENTRY) {
            updateUiState({ step: uiState.step - 1 });
        } else {
            navigate('/');
        }
    };

    const toggleMode = () => {
        updateUiState({
            isRegisterMode: !uiState.isRegisterMode,
            step: STEPS.REGISTER.EMAIL_ENTRY,
            resendTimer: -1,
            forgotPassword: false,
            forgotPasswordStep: STEPS.FORGOT_PASSWORD.EMAIL_ENTRY,
            forgotPasswordResendTimer: -1
        });
        resetForm();
        clearTempTokens();
    };

    const startForgotPassword = () => {
        updateUiState({
            forgotPassword: true,
            forgotPasswordStep: STEPS.FORGOT_PASSWORD.EMAIL_ENTRY,
            forgotPasswordResendTimer: -1
        });
        updateErrors({ otpForgotPassword: '' });
    };

    // Рендер функции
    const renderInput = (type, placeholder, value, onChange, icon, error, maxLength) => (
        <div className="input-group">
            <div className="input-wrapper">
                {icon && <span className="input-icon">{icon}</span>}
                <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onKeyPress={handleKeyPress}
                    maxLength={maxLength}
                    className={error ? 'input-error' : ''}
                />
            </div>
            {error && <span className="error-message">{error}</span>}
        </div>
    );

    const renderPasswordInput = (type, placeholder, value, onChange, error) => (
        <div className="input-group">
            <div className="input-wrapper">
                <span className="input-icon"><FaLock /></span>
                <input
                    type={uiState.showPassword ? 'text' : 'password'}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onKeyPress={handleKeyPress}
                    className={error ? 'input-error' : ''}
                />
                <span
                    className="password-toggle"
                    onClick={() => updateUiState({ showPassword: !uiState.showPassword })}
                >
                    {uiState.showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
            </div>
            {error && <span className="error-message">{error}</span>}
        </div>
    );

    const renderRegisterStep1 = () => (
        <div className="auth-form">
            <h2>Создание аккаунта</h2>
            <p className="form-subtitle">Введите ваш email для начала регистрации</p>

            {renderInput(
                'email',
                'Ваш email',
                formData.email,
                (e) => updateFormData('email', sanitizeEmail(e.target.value)),
                <FaEnvelope />,
                errors.email
            )}

            <button
                className={`auth-button ${uiState.isLoading ? 'loading' : ''}`}
                type="button"
                onClick={handleLoginRegister}
                disabled={uiState.isLoading}
            >
                {uiState.isLoading ? 'Отправка...' : 'Продолжить'}
            </button>
        </div>
    );

    const renderRegisterStep2 = () => (
        <div className="auth-form">
            <button className="back-button" onClick={handleBack}>
                <FaArrowLeft /> Назад
            </button>

            <h2>Подтверждение email</h2>
            <p className="form-subtitle">
                Мы отправили код подтверждения на <strong>{formData.email}</strong>
            </p>

            {renderInput(
                'text',
                'Введите 6-значный код',
                formData.otp,
                (e) => updateFormData('otp', sanitizeInputLogin(e.target.value)),
                null,
                errors.otp,
                OTP_LENGTH
            )}

            <button
                className={`auth-button ${uiState.isLoading ? 'loading' : ''}`}
                type="button"
                onClick={handleLoginRegister}
                disabled={uiState.isLoading}
            >
                {uiState.isLoading ? 'Проверка...' : 'Подтвердить'}
            </button>

            <div className="otp-resend">
                {uiState.resendTimer > 0 ? (
                    <div className="resend-timer">
                        Повторная отправка через: <strong>{uiState.resendTimer}с</strong>
                    </div>
                ) : (
                    <button className="resend-button" onClick={() => handleSendOtp(OTP_PURPOSES.REGISTRATION)}>
                        Отправить код повторно
                    </button>
                )}
            </div>
        </div>
    );

    const renderRegisterStep3 = () => (
        <div className="auth-form">
            <button className="back-button" onClick={handleBack}>
                <FaArrowLeft /> Назад
            </button>

            <h2>Завершение регистрации</h2>
            <p className="form-subtitle">Заполните данные для завершения регистрации</p>

            {renderInput(
                'text',
                'Ваше имя',
                formData.name,
                (e) => updateFormData('name', sanitizeInputLogin(e.target.value)),
                <FaUser />,
                errors.name
            )}

            {renderPasswordInput(
                'password',
                'Пароль (мин. 6 символов)',
                formData.password,
                (e) => updateFormData('password', sanitizeInputLogin(e.target.value)),
                errors.password
            )}

            {renderPasswordInput(
                'password',
                'Подтвердите пароль',
                formData.confirmPassword,
                (e) => updateFormData('confirmPassword', sanitizeInputLogin(e.target.value))
            )}

            {errors.passwordMatch && (
                <span className="error-message">Пароли не совпадают</span>
            )}

            <button
                className={`auth-button ${uiState.isLoading ? 'loading' : ''}`}
                type="button"
                onClick={handleLoginRegister}
                disabled={uiState.isLoading}
            >
                {uiState.isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
        </div>
    );

    const renderLogin = () => (
        <div className="auth-form">
            <h2>Вход в аккаунт</h2>
            <p className="form-subtitle">Введите ваши данные для входа</p>

            {renderInput(
                'email',
                'Ваш email',
                formData.email,
                (e) => updateFormData('email', sanitizeEmail(e.target.value)),
                <FaEnvelope />,
                errors.email
            )}

            {renderPasswordInput(
                'password',
                'Ваш пароль',
                formData.password,
                (e) => updateFormData('password', sanitizeInputLogin(e.target.value)),
                errors.password
            )}

            <button
                className={`auth-button ${uiState.isLoading ? 'loading' : ''}`}
                type="button"
                onClick={handleLoginRegister}
                disabled={uiState.isLoading}
            >
                {uiState.isLoading ? 'Вход...' : 'Войти'}
            </button>

            <div className="auth-links">
                <button className="link-button" onClick={startForgotPassword}>
                    Забыли пароль?
                </button>
            </div>
        </div>
    );

    const renderForgotPasswordStep1 = () => (
        <div className="auth-form">
            <button className="back-button" onClick={handleBack}>
                <FaArrowLeft /> Назад
            </button>

            <h2>Восстановление пароля</h2>
            <p className="form-subtitle">Введите email для восстановления пароля</p>

            {renderInput(
                'email',
                'Ваш email',
                formData.email,
                (e) => updateFormData('email', sanitizeEmail(e.target.value)),
                <FaEnvelope />,
                errors.email
            )}

            <button
                className={`auth-button ${uiState.isLoading ? 'loading' : ''}`}
                type="button"
                onClick={handleForgotPasswordFlow}
                disabled={uiState.isLoading}
            >
                {uiState.isLoading ? 'Отправка...' : 'Отправить код'}
            </button>
        </div>
    );

    const renderForgotPasswordStep2 = () => (
        <div className="auth-form">
            <button className="back-button" onClick={handleBack}>
                <FaArrowLeft /> Назад
            </button>

            <h2>Подтверждение кода</h2>
            <p className="form-subtitle">
                Код отправлен на <strong>{formData.email}</strong>
            </p>

            {renderInput(
                'text',
                'Введите 6-значный код',
                formData.otp,
                (e) => updateFormData('otp', sanitizeInputLogin(e.target.value)),
                null,
                errors.otpForgotPassword,
                OTP_LENGTH
            )}

            <button
                className={`auth-button ${uiState.isLoading ? 'loading' : ''}`}
                type="button"
                onClick={handleForgotPasswordFlow}
                disabled={uiState.isLoading}
            >
                {uiState.isLoading ? 'Проверка...' : 'Подтвердить'}
            </button>

            <div className="otp-resend">
                {uiState.forgotPasswordResendTimer > 0 ? (
                    <div className="resend-timer">
                        Повторная отправка через: <strong>{uiState.forgotPasswordResendTimer}с</strong>
                    </div>
                ) : (
                    <button className="resend-button" onClick={() => handleSendOtp(OTP_PURPOSES.PASSWORD_RESET)}>
                        Отправить код повторно
                    </button>
                )}
            </div>
        </div>
    );

    const renderForgotPasswordStep3 = () => (
        <div className="auth-form">
            <button className="back-button" onClick={handleBack}>
                <FaArrowLeft /> Назад
            </button>

            <h2>Новый пароль</h2>
            <p className="form-subtitle">Введите новый пароль для вашего аккаунта</p>

            {renderPasswordInput(
                'password',
                'Новый пароль (мин. 6 символов)',
                formData.newPassword,
                (e) => updateFormData('newPassword', sanitizeInputLogin(e.target.value)),
                errors.password
            )}

            {renderPasswordInput(
                'password',
                'Подтвердите новый пароль',
                formData.confirmPassword,
                (e) => updateFormData('confirmPassword', sanitizeInputLogin(e.target.value))
            )}

            {errors.passwordMatch && (
                <span className="error-message">Пароли не совпадают</span>
            )}

            <button
                className={`auth-button ${uiState.isLoading ? 'loading' : ''}`}
                type="button"
                onClick={handleForgotPasswordFlow}
                disabled={uiState.isLoading}
            >
                {uiState.isLoading ? 'Обновление...' : 'Обновить пароль'}
            </button>
        </div>
    );

    const getCurrentForm = () => {
        if (uiState.forgotPassword) {
            switch (uiState.forgotPasswordStep) {
                case STEPS.FORGOT_PASSWORD.EMAIL_ENTRY:
                    return renderForgotPasswordStep1();
                case STEPS.FORGOT_PASSWORD.OTP_VERIFICATION:
                    return renderForgotPasswordStep2();
                case STEPS.FORGOT_PASSWORD.PASSWORD_UPDATE:
                    return renderForgotPasswordStep3();
                default:
                    return renderForgotPasswordStep1();
            }
        } else if (uiState.isRegisterMode) {
            switch (uiState.step) {
                case STEPS.REGISTER.EMAIL_ENTRY:
                    return renderRegisterStep1();
                case STEPS.REGISTER.OTP_VERIFICATION:
                    return renderRegisterStep2();
                case STEPS.REGISTER.USER_DETAILS:
                    return renderRegisterStep3();
                default:
                    return renderRegisterStep1();
            }
        } else {
            return renderLogin();
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <button className="close-button close-button-login-page" onClick={handleClose}>
                    <FaTimes />
                </button>

                <div className="auth-header">
                    <div className="logo">
                        <h1>FLOWER<span>KZ</span></h1>
                    </div>
                    <p className="welcome-text">Добро пожаловать в мир цветов</p>
                </div>

                {getCurrentForm()}

                <div className="auth-switch">
                    <p>
                        {uiState.isRegisterMode ? 'Уже есть аккаунт?' : 'Еще нет аккаунта?'}
                        <button className="switch-button" onClick={toggleMode}>
                            {uiState.isRegisterMode ? 'Войти' : 'Зарегистрироваться'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginRegister;