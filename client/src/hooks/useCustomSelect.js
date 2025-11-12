// src/hooks/useCustomSelect.js
import { useState, useRef, useEffect } from 'react';

export const useCustomSelect = (initialValue, options) => {
    const [value, setValue] = useState(initialValue);
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

    const handleSelect = (selectedValue) => {
        setValue(selectedValue);
        setIsOpen(false);
    };

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    return {
        value,
        isOpen,
        selectRef,
        handleSelect,
        toggleDropdown,
        selectedOption: options.find(opt => opt.value === value)
    };
};