import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import CardAutocomplete from './common/CardAutocomplete';
import { useLanguage } from '../context/LanguageContext';
import '../styles/Hero.css';

const Hero = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchMode, setSearchMode] = useState('cards'); // 'cards' or 'decks'
    const [deckSearchType, setDeckSearchType] = useState('hero'); // 'hero', 'username', 'name'
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            if (searchMode === 'cards') {
                navigate(`/cards?search=${encodeURIComponent(searchTerm)}`);
            } else {
                // Deck Search Logic
                if (deckSearchType === 'hero') {
                    navigate(`/decks?hero=${encodeURIComponent(searchTerm)}`);
                } else if (deckSearchType === 'username') {
                    navigate(`/decks?username=${encodeURIComponent(searchTerm)}`);
                } else {
                    navigate(`/decks?name=${encodeURIComponent(searchTerm)}`);
                }
            }
        }
    };

    return (
        <section className="hero">
            <div className="hero-content container">
                <h1 className="hero-title">
                    {t('hero.title_prefix')}<span className="text-red">{t('hero.title_highlight')}</span>
                </h1>
                <p className="hero-subtitle">
                    {t('hero.subtitle')}
                </p>

                <div className="hero-search-wrapper">
                    {/* Search Mode Toggles */}
                    <div className="search-mode-toggles">
                        <button
                            className={`mode-toggle ${searchMode === 'cards' ? 'active' : ''}`}
                            onClick={() => setSearchMode('cards')}
                        >
                            {t('hero.mode_cards')}
                        </button>
                        <button
                            className={`mode-toggle ${searchMode === 'decks' ? 'active' : ''}`}
                            onClick={() => setSearchMode('decks')}
                        >
                            {t('hero.mode_decks')}
                        </button>
                    </div>

                    {searchMode === 'decks' && (
                        <div className="hero-search-suboptions">
                            <button
                                type="button"
                                className={`hero-sub-filter-btn ${deckSearchType === 'hero' ? 'active' : ''}`}
                                onClick={() => setDeckSearchType('hero')}
                            >
                                {t('hero.filter_hero')}
                            </button>
                            <button
                                type="button"
                                className={`hero-sub-filter-btn ${deckSearchType === 'username' ? 'active' : ''}`}
                                onClick={() => setDeckSearchType('username')}
                            >
                                {t('hero.filter_user')}
                            </button>
                            <button
                                type="button"
                                className={`hero-sub-filter-btn ${deckSearchType === 'name' ? 'active' : ''}`}
                                onClick={() => setDeckSearchType('name')}
                            >
                                {t('hero.filter_title')}
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSearch} className="hero-search">
                        <Search className="hero-search-icon" size={20} />
                        {searchMode === 'cards' ? (
                            <CardAutocomplete
                                value={searchTerm}
                                onChange={(val) => setSearchTerm(val)}
                                onSearch={(val) => {
                                    setSearchTerm(val);
                                    // Navigate immediately if search triggered from autocomplete (only if valid)
                                    if (val && val.trim().length > 0) {
                                        navigate(`/cards?search=${encodeURIComponent(val)}`);
                                    }
                                }}
                                placeholder={t('hero.search_cards_placeholder')}
                                wrapperClassName="hero-autocomplete-wrapper"
                                inputClassName="hero-autocomplete-input"
                                showIcon={false}
                            />
                        ) : (
                            <input
                                type="text"
                                className="hero-search-input"
                                placeholder={
                                    deckSearchType === 'hero' ? t('hero.placeholder_hero')
                                        : deckSearchType === 'username' ? t('hero.placeholder_user')
                                            : t('hero.placeholder_title')
                                }
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        )}
                        <button type="submit" className="hero-search-button">
                            {t('hero.search_button')}
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Hero;
