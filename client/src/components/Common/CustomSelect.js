// src/components/Common/CustomSelect.js
import React, { useState, useRef, useEffect } from 'react';
import './CustomSelect.css';

const CustomSelect = ({
                          value,
                          onChange,
                          options,
                          placeholder = "Выберите...",
                          className = ""
                      }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleOptionClick = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className={`custom-select ${className}`} ref={selectRef}>
            <div
                className={`custom-select__control ${isOpen ? 'custom-select__control--open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{selectedOption ? selectedOption.label : placeholder}</span>
                <span className={`custom-select__arrow ${isOpen ? 'custom-select__arrow--open' : ''}`}>
          ▼
        </span>
            </div>

            {isOpen && (
                <div className="custom-select__dropdown">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`custom-select__option ${
                                value === option.value ? 'custom-select__option--selected' : ''
                            }`}
                            onClick={() => handleOptionClick(option.value)}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomSelect;