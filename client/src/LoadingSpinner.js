import React, { useState, useEffect } from 'react';
import './App.css';

const LoadingSpinner = () => {
    const [showSpinner, setShowSpinner] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowSpinner(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (!showSpinner) return null;

    return (
        <div className="spinner-overlay fade-in">
            <div className="spinner-container">
                <div className="spinner">
                    <div className="spinner-circle"></div>
                </div>
                <div className="spinner-text">Загрузка...</div>
            </div>
        </div>
    );
};

export default LoadingSpinner;
