import React, { useEffect, useState, useCallback } from 'react';
// import { useHistory } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './LoginRegister.css';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext";
import { sanitizeInputLogin } from "../../utils/securityUtils";
// Константы для избежания magic numbers/strings
import {OTP_LENGTH, OTP_PURPOSES, PASSWORD_MIN_LENGTH, RESEND_TIMER_DURATION, STEPS} from "../../constants/constants";

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
        forgotPasswordResendTimer: -1
    });

    const [errors, setErrors] = useState({
        otp: '',
        otpForgotPassword: '',
        passwordMatch: false
    });

    const [tempToken, setTempToken] = useState('');

    const { login, isAuthenticated } = useAuth();
    // const history = useHistory();
    const navigate = useNavigate();


    // Очистка временных токенов
    const clearTempTokens = useCallback(() => {
        sessionStorage.removeItem('tempToken');
        sessionStorage.removeItem('tempTokenForgot');
        setTempToken('');
    }, []);

    // Таймеры для повторной отправки OTP.
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
        return () => {
            setShowHeader(true);
        };
    }, [setShowHeader]);

    useEffect(() => {
        setShowSidebar(true);
        return () => {
            setShowSidebar(true);
        };
    }, [setShowSidebar]);

    // Хелпер функции
    const sanitizeEmail = (email) => {
        return sanitizeInputLogin(email).toLowerCase();
    };

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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
            passwordMatch: false
        });
    };

    // API вызовы
    const makeApiCall = async (url, data, errorMessage) => {
        try {
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
        }
    };

    const handleSendOtp = async (purpose) => {
        const sanitizedEmail = sanitizeEmail(formData.email);

        if (!isValidEmail(sanitizedEmail)) {
            toast.error('Пожалуйста, введите корректный email');
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
                toast.error(shouldExist ? 'У нас нет такого клиента' : 'Пользователь с таким email уже существует');
                return false;
            }

            // Отправка OTP
            await makeApiCall(
                sendOtpUrl,
                {
                    email: sanitizedEmail,
                    purpose: purpose
                },
                'Произошла ошибка при отправке OTP'
            );

            toast.success('OTP отправлен на ваш email');
            return true;
        } catch (error) {
            return false;
        }
    };

    const handleVerifyOtp = async (purpose) => {
        const sanitizedEmail = sanitizeEmail(formData.email);
        const sanitizedOtp = sanitizeInputLogin(formData.otp);

        if (sanitizedOtp.length < OTP_LENGTH) {
            updateErrors({ otp: 'Код должен содержать минимум 6 символов' });
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
                'Произошла ошибка при проверке OTP'
            );

            if (data.tempToken) {
                const storageKey = purpose === OTP_PURPOSES.REGISTRATION ? 'tempToken' : 'tempTokenForgot';
                sessionStorage.setItem(storageKey, data.tempToken);
                setTempToken(data.tempToken);
            }

            toast.success('OTP успешно проверен');
            updateErrors({ otp: '' });
            return data.tempToken;
        } catch (error) {
            updateErrors({ otp: 'Неверный OTP' });
            return null;
        }
    };

    const handleLogin = async () => {
        const loginUrl = `${process.env.REACT_APP_API_URL}/api/auth/login`;

        try {
            const loginData = await makeApiCall(
                loginUrl,
                {
                    email: sanitizeEmail(formData.email),
                    password: sanitizeInputLogin(formData.password),
                },
                'Ошибка при входе'
            );

            const success = login(loginData.token, loginData.user.role);

            if (success) {
                toast.success(`Добро пожаловать, ${loginData.user.name || 'пользователь'}!`);
                navigate('/');
            }
        } catch (error) {
            // Ошибка уже обработана в makeApiCall
        }
    };

    const handleRegister = async () => {
        if (formData.password.length < PASSWORD_MIN_LENGTH) {
            toast.error('Пароль должен содержать минимум 6 символов');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            updateErrors({ passwordMatch: true });
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

            const success = login(responseData.token, responseData.user.role);
            if (success) {
                clearTempTokens();
                toast.success('Успешная регистрация и вход');
                updateUiState({ isRegisterMode: false, step: STEPS.REGISTER.EMAIL_ENTRY });
                navigate('/');
            }
        } catch (error) {
            // Ошибка уже обработана в makeApiCall
        }
    };

    const handleResetPassword = async () => {
        if (formData.newPassword.length < PASSWORD_MIN_LENGTH) {
            toast.error('Пароль должен содержать минимум 6 символов');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            updateErrors({ passwordMatch: true });
            return;
        }

        const forgotPasswordUrl = `${process.env.REACT_APP_API_URL}/api/auth/reset-password`;

        try {
            await makeApiCall(
                forgotPasswordUrl,
                {
                    email: sanitizeEmail(formData.email),
                    otp: sanitizeInputLogin(formData.otp),
                    newPassword: sanitizeInputLogin(formData.newPassword),
                    tempToken: tempToken || sessionStorage.getItem('tempTokenForgot'),
                },
                'Ошибка при обновлении пароля'
            );

            toast.success('Пароль успешно обновлен');
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
                await handleVerifyOtp(OTP_PURPOSES.REGISTRATION);
                updateUiState({ step: STEPS.REGISTER.USER_DETAILS });
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
            await handleVerifyOtp(OTP_PURPOSES.PASSWORD_RESET);
            updateUiState({ forgotPasswordStep: STEPS.FORGOT_PASSWORD.PASSWORD_UPDATE });
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

    const handleCloseForm = () => {
        if (uiState.isRegisterMode && uiState.step > STEPS.REGISTER.EMAIL_ENTRY) {
            updateUiState({ step: STEPS.REGISTER.EMAIL_ENTRY });
        } else {
            navigate('/login');
        }
    };

    const handleCloseFormPassword = () => {
        if (uiState.forgotPasswordStep > STEPS.FORGOT_PASSWORD.EMAIL_ENTRY) {
            updateUiState({ forgotPasswordStep: STEPS.FORGOT_PASSWORD.EMAIL_ENTRY });
        } else {
            navigate('/login');
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

    // Рендер функции для лучшей читаемости
    const renderRegisterStep1 = () => (
        <div className="form-register-and-login">
            <h2>Создайте аккаунт</h2>
            <label>Email:</label>
            <input
                className="formInput"
                type="email"
                placeholder="Эл.почта"
                value={formData.email}
                onChange={(e) => updateFormData('email', sanitizeEmail(e.target.value))}
                onKeyPress={handleKeyPress}
            />
            <button className="Login-register-button" type="button" onClick={handleLoginRegister}>
                Продолжить
            </button>
        </div>
    );

    const renderRegisterStep2 = () => (
        <div className="form-register-and-login">
      <span className="form-register-and-login-arrow" onClick={handleCloseForm}>
        ⟻ назад
      </span>
            <h2>Подтвердите эл.почту</h2>
            <div className="login-step-email">
                Мы отправили подтверждение на email: <strong>{sanitizeInputLogin(formData.email)}</strong>
            </div>
            <label>Введите код подтверждения</label>
            <input
                className="formInput"
                type="text"
                placeholder="Введите подтверждение"
                value={formData.otp}
                onChange={(e) => updateFormData('otp', sanitizeInputLogin(e.target.value))}
                onKeyPress={handleKeyPress}
                maxLength={OTP_LENGTH}
            />
            {errors.otp && <span className="otp-error">{errors.otp}</span>}
            <button className="Login-register-button" type="button" onClick={handleLoginRegister}>
                Подтвердите
            </button>
            <div className="timer-login">
                {uiState.resendTimer > 0 ? (
                    <div className="timer-login-time">
                        Повторная отправка через: <strong>{uiState.resendTimer}</strong> секунд
                    </div>
                ) : (
                    <div className="new-otp-button">
                        <div>Не получили код?</div>
                        <p className="resend-otp" onClick={() => handleSendOtp(OTP_PURPOSES.REGISTRATION)}>
                            Отправить снова
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderRegisterStep3 = () => (
        <div className="form-register-and-login">
            <h2>Заполните форму</h2>
            <label>Имя:</label>
            <input
                className="formInput"
                type="text"
                placeholder="Введите имя"
                value={formData.name}
                onChange={(e) => updateFormData('name', sanitizeInputLogin(e.target.value))}
                onKeyPress={handleKeyPress}
                maxLength="50"
            />
            <label>Email:</label>
            <input
                className="formInput"
                type="email"
                placeholder="Эл.почта"
                value={formData.email}
                onKeyPress={handleKeyPress}
                readOnly
            />
            <div style={{ position: 'relative' }}>
                <label>Пароль:</label>
                <input
                    className="formInput"
                    type={uiState.showPassword ? 'text' : 'password'}
                    placeholder="Введите пароль (мин. 6 символов)"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', sanitizeInputLogin(e.target.value))}
                    onKeyPress={handleKeyPress}
                    minLength={PASSWORD_MIN_LENGTH}
                />
                <span
                    className="span-fa-eye"
                    onClick={() => updateUiState({ showPassword: !uiState.showPassword })}
                >
          {uiState.showPassword ? <FaEyeSlash /> : <FaEye />}
        </span>
            </div>
            <label>Подтвердите пароль:</label>
            <input
                className="formInput"
                type={uiState.showPassword ? 'text' : 'password'}
                placeholder="Подтвердите пароль"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData('confirmPassword', sanitizeInputLogin(e.target.value))}
                onKeyPress={handleKeyPress}
                minLength={PASSWORD_MIN_LENGTH}
            />
            {errors.passwordMatch && (
                <span className="otp-error">Пароли не совпадают. Пожалуйста, проверьте введенные данные.</span>
            )}
            <button className="Login-register-button" type="button" onClick={handleLoginRegister}>
                Зарегистрировать
            </button>
        </div>
    );

    const renderLogin = () => (
        <div className="form-register-and-login">
            <h2 style={{marginLeft:"0"}}>Войти в аккаунт</h2>
            <label>Email:</label>
            <input
                className="formInput"
                type="email"
                placeholder="Эл.адрес"
                value={formData.email}
                onChange={(e) => updateFormData('email', sanitizeEmail(e.target.value))}
                onKeyPress={handleKeyPress}
            />
            <div style={{ position: 'relative'}} className="element-label-input">
                <label>Пароль:</label>
                <input
                    className="formInput"
                    type={uiState.showPassword ? 'text' : 'password'}
                    placeholder="Введите пароль"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', sanitizeInputLogin(e.target.value))}
                    onKeyPress={handleKeyPress}
                />
                <span
                    className="span-fa-eye"
                    onClick={() => updateUiState({ showPassword: !uiState.showPassword })}
                >
          {uiState.showPassword ? <FaEyeSlash /> : <FaEye />}
        </span>
            </div>
            <button className="Login-register-button" type="button" onClick={handleLoginRegister}>
                Авторизоваться
            </button>
            <div className="text-login-or-register-block newPassword">
                <span>Забыли пароль?</span>
                <p
                    className="text-login-or-register"
                    onClick={() => {
                        updateUiState({
                            forgotPassword: true,
                            forgotPasswordStep: STEPS.FORGOT_PASSWORD.EMAIL_ENTRY,
                            forgotPasswordResendTimer: -1
                        });
                        updateErrors({ otpForgotPassword: '' });
                    }}
                >
                    Сменить пароль
                </p>
            </div>
        </div>
    );

    const renderForgotPasswordStep1 = () => (
        <div className="form-register-and-login">
            <h2>Восстановление пароля</h2>
            <div style={{marginTop:"11px", marginBottom:"11px"}}>
                Для восстановления пароля введите email указанный при регистрации
            </div>
            <label>Email:</label>
            <input
                className="formInput"
                type="email"
                placeholder="Эл.почта"
                value={formData.email}
                onChange={(e) => updateFormData('email', sanitizeEmail(e.target.value))}
                onKeyPress={handleKeyPress}
            />
            <button className="Login-register-button" type="button" onClick={handleForgotPasswordFlow}>
                Отправить OTP
            </button>
        </div>
    );

    const renderForgotPasswordStep2 = () => (
        <div className="form-register-and-login">
      <span className="form-register-and-login-arrow" onClick={handleCloseFormPassword}>
        ⟻ назад
      </span>
            <h2>Восстановление пароля</h2>
            <div className="login-step-email">
                Мы отправили подтверждение на email: <strong>{sanitizeInputLogin(formData.email)}</strong>
            </div>
            <label>Введите код подтверждения:</label>
            <input
                className="formInput"
                type="text"
                placeholder="Введите код"
                value={formData.otp}
                onChange={(e) => updateFormData('otp', sanitizeInputLogin(e.target.value))}
                onKeyPress={handleKeyPress}
                maxLength={OTP_LENGTH}
            />
            {errors.otpForgotPassword && <span className="otp-error">{errors.otpForgotPassword}</span>}
            <button className="Login-register-button" type="button" onClick={handleForgotPasswordFlow}>
                Подтвердите OTP
            </button>
            <div className="timer-login">
                {uiState.forgotPasswordResendTimer > 0 ? (
                    <div className="timer-login-time">
                        Повторная отправка через: <strong>{uiState.forgotPasswordResendTimer}</strong> секунд
                    </div>
                ) : (
                    <div className="load-new-password">
                        <div>Не получили код?</div>
                        <p className="resend-otp" onClick={() => handleSendOtp(OTP_PURPOSES.PASSWORD_RESET)}>
                            Отправить снова
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderForgotPasswordStep3 = () => (
        <div className="form-register-and-login">
            <h2>Обновление пароля</h2>
            <label>Введите желаемый пароль:</label>
            <input
                className="formInput"
                type={uiState.showPassword ? 'text' : 'password'}
                placeholder="Новый пароль (мин. 6)"
                value={formData.newPassword}
                onChange={(e) => updateFormData('newPassword', sanitizeInputLogin(e.target.value))}
                onKeyPress={handleKeyPress}
                minLength={PASSWORD_MIN_LENGTH}
            />
            <div style={{ position: 'relative' }}>
                <label>Подтвердите новый пароль:</label>
                <input
                    className="formInput password-yey"
                    type={uiState.showPassword ? 'text' : 'password'}
                    placeholder="Подтвердите новый пароль"
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData('confirmPassword', sanitizeInputLogin(e.target.value))}
                    onKeyPress={handleKeyPress}
                    minLength={PASSWORD_MIN_LENGTH}
                />
                <span
                    className="span-fa-eye"
                    onClick={() => updateUiState({ showPassword: !uiState.showPassword })}
                >
          {uiState.showPassword ? <FaEyeSlash /> : <FaEye />}
        </span>
            </div>
            {errors.passwordMatch && (
                <span className="otp-error">Пароли не совпадают. Пожалуйста, проверьте введенные данные.</span>
            )}
            <button className="Login-register-button" type="button" onClick={handleForgotPasswordFlow}>
                Обновить пароль
            </button>
        </div>
    );

    return (
        <div className="form-login-page">
            <form className="form">
        <span className="formCloseLogin" type="button" onClick={handleClose}>
          &#10006;
        </span>
                <hr className="hr-line"/>

                {/* Register Flow */}
                {uiState.isRegisterMode && uiState.step === STEPS.REGISTER.EMAIL_ENTRY && renderRegisterStep1()}
                {uiState.isRegisterMode && uiState.step === STEPS.REGISTER.OTP_VERIFICATION && renderRegisterStep2()}
                {uiState.isRegisterMode && uiState.step === STEPS.REGISTER.USER_DETAILS && renderRegisterStep3()}

                {/* Login Flow */}
                {!uiState.isRegisterMode && !uiState.forgotPassword && renderLogin()}

                {/* Forgot Password Flow */}
                {uiState.forgotPassword && (
                    <div>
                        {uiState.forgotPasswordStep === STEPS.FORGOT_PASSWORD.EMAIL_ENTRY && renderForgotPasswordStep1()}
                        {uiState.forgotPasswordStep === STEPS.FORGOT_PASSWORD.OTP_VERIFICATION && renderForgotPasswordStep2()}
                        {uiState.forgotPasswordStep === STEPS.FORGOT_PASSWORD.PASSWORD_UPDATE && renderForgotPasswordStep3()}
                    </div>
                )}

                {/* Toggle between Login and Register */}
                <div className="text-login-or-register-block">
                    <div>
                        {uiState.isRegisterMode ? 'У вас уже есть аккаунт?' : 'Еще нет аккаунта?'}
                    </div>
                    <p
                        className="text-login-or-register"
                        onClick={toggleMode}
                    >
                        {uiState.isRegisterMode ? 'Войти' : 'Зарегистрируйтесь'}
                    </p>
                </div>
            </form>
        </div>
    );
};

export default LoginRegister;