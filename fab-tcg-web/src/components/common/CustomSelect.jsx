import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import '../../styles/CustomSelect.css';

/**
 * Custom Dropdown Component
 * @param {Object} props
 * @param {Array<{value: string|number, label: string}>} props.options - Array of options
 * @param {string|number} props.value - Current value
 * @param {Function} props.onChange - Handler for change (returns value)
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Is disabled
 * @param {string} props.className - Extra classes
 */
const CustomSelect = ({
    options = [],
    value,
    onChange,
    placeholder = 'Select...',
    disabled = false,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        if (value !== optionValue) {
            onChange(optionValue);
        }
        setIsOpen(false);
    };

    // Find label for current value
    const selectedOption = options.find(opt => String(opt.value) === String(value));
    const displayLabel = selectedOption ? selectedOption.label : placeholder;

    return (
        <div
            className={`custom-select-container ${className}`}
            ref={containerRef}
            style={{ opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
        >
            <div
                className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: selectedOption ? 'inherit' : '#aaa'
                }}>
                    {displayLabel}
                </span>
                <ChevronDown size={16} style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    minWidth: '16px'
                }} />
            </div>

            {isOpen && (
                <div className="custom-select-dropdown">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className={`custom-select-option ${String(value) === String(option.value) ? 'selected' : ''}`}
                            onClick={() => handleSelect(option.value)}
                        >
                            {option.label}
                        </div>
                    ))}
                    {options.length === 0 && (
                        <div className="custom-select-option" style={{ fontStyle: 'italic', cursor: 'default' }}>
                            No options
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
