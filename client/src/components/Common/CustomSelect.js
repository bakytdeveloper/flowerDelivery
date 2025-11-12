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

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    const handleOptionClick = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className={`custom-select ${className} ${isOpen ? 'custom-select--open' : ''}`} ref={selectRef}>
            <div
                className={`custom-select__control ${isOpen ? 'custom-select__control--open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsOpen(!isOpen);
                    }
                }}
                tabIndex={0}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span>{selectedOption ? selectedOption.label : placeholder}</span>
                <span className={`custom-select__arrow ${isOpen ? 'custom-select__arrow--open' : ''}`}>
          ▼
        </span>
            </div>

            {isOpen && (
                <div
                    className="custom-select__dropdown"
                    role="listbox"
                    aria-label="Опции выбора"
                >
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`custom-select__option ${
                                value === option.value ? 'custom-select__option--selected' : ''
                            }`}
                            onClick={() => handleOptionClick(option.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleOptionClick(option.value);
                                }
                            }}
                            role="option"
                            aria-selected={value === option.value}
                            tabIndex={0}
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