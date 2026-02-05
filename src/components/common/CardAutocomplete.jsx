import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { CardService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/CardAutocomplete.css';

const CardAutocomplete = ({
    value,
    onChange,
    onSearch,
    placeholder,
    disabled,
    wrapperClassName = '',
    inputClassName = '',
    showIcon = true,
    unstyled = false
}) => {
    const { t } = useLanguage();
    const [inputValue, setInputValue] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const containerRef = useRef(null);
    const searchTimeout = useRef(null);

    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = async (term) => {
        if (!term || term.length < 2) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            // Fetch a larger buffer to account for printings
            const response = await CardService.getCards({
                search: term,
                pageSize: 50
            });

            const uniqueCards = [];
            const seenNames = new Set();

            if (response.data) {
                // First pass: Deduplicate by name
                response.data.forEach(card => {
                    if (!seenNames.has(card.name)) {
                        seenNames.add(card.name);
                        uniqueCards.push(card);
                    }
                });

                // Second pass: Pure Alphabetical sorting for consistency
                uniqueCards.sort((a, b) => a.name.localeCompare(b.name));
            }

            setSuggestions(uniqueCards.slice(0, 3)); // Top 3 unique results
            setShowSuggestions(true);
        } catch (error) {
            console.error("Error fetching suggestions:", error);
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputValue(val);
        onChange(val); // Propagate change to parent immediately for typing

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (val.length >= 2) {
            searchTimeout.current = setTimeout(() => {
                fetchSuggestions(val);
            }, 300);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                selectSuggestion(suggestions[selectedIndex]);
            } else {
                onSearch(inputValue);
                setShowSuggestions(false);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const selectSuggestion = (card) => {
        setInputValue(card.name);
        onChange(card.name);
        onSearch(card.name); // Trigger the search with the full name
        setShowSuggestions(false);
        setSuggestions([]);
    };

    const clearSearch = () => {
        setInputValue('');
        onChange('');
        onSearch('');
        setSuggestions([]);
        setShowSuggestions(false);
    };

    return (
        <div className={`card-autocomplete-container ${unstyled ? 'unstyled' : ''}`} ref={containerRef}>
            <div className={`card-autocomplete-input-wrapper ${unstyled ? 'unstyled' : ''} ${wrapperClassName}`}>
                {showIcon && <Search size={18} className="autocomplete-search-icon" />}
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => inputValue.length >= 2 && setShowSuggestions(true)}
                    placeholder={placeholder || t('filters.search_placeholder')}
                    disabled={disabled}
                    className={`card-autocomplete-input ${inputClassName}`}
                />
                {inputValue && (
                    <button
                        className="clear-search-btn"
                        onClick={clearSearch}
                        aria-label="Clear search"
                        type="button"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {showSuggestions && (suggestions.length > 0 || loading) && (
                <div className="card-autocomplete-dropdown">
                    {loading ? (
                        <div className="autocomplete-loading">{t('common.loading')}...</div>
                    ) : (
                        suggestions.map((card, index) => (
                            <div
                                key={card.id || index}
                                className={`autocomplete-item ${index === selectedIndex ? 'selected' : ''}`}
                                onClick={() => selectSuggestion(card)}
                                onMouseEnter={() => setSelectedIndex(index)}
                            >
                                <span className="autocomplete-card-name">{card.name}</span>
                                <div className="autocomplete-card-meta">
                                    {card.pitch && (
                                        <span className={`pitch-dot pitch-${card.pitch}`}></span>
                                    )}
                                    <span className="card-class-info">{card.clase} {card.tipo}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default CardAutocomplete;
