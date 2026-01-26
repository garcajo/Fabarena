import React, { useState, useEffect } from 'react';
import { CardService } from '../../services/api';
import CardList from '../CardList'; // We can reuse the list view or make a grid
import { Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/CardGrid.css'; // Reuse grid styles

const HeroSelection = ({ onSelect, onBack }) => {
    const [heroes, setHeroes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { t } = useLanguage();

    useEffect(() => {
        const fetchHeroes = async () => {
            try {
                // Fetch cards with type 'Hero'
                // Fetch enough items to ensure we get all unique heroes even after filtering duplicates
                const { data, error } = await CardService.getCards({ type: 'Hero', pageSize: 500 });
                if (error) throw new Error(error);

                // Filter out duplicates: same name AND same image = duplicate.
                // We want to keep alternate arts (same name, different image).
                const uniqueHeroes = [];
                const seen = new Set();

                (data || []).forEach(hero => {
                    const key = `${hero.name}-${hero.imagen}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueHeroes.push(hero);
                    }
                });

                setHeroes(uniqueHeroes);
            } catch (err) {
                console.error("Error fetching heroes:", err);
                setError("Failed to load heroes. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchHeroes();
    }, []);

    const filteredHeroes = heroes.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="hero-selection-step fade-in">
            <div className="step-header">
                <h2>{t('deckBuilder.selectHero') || 'Select Your Hero'}</h2>
                <p>{t('deckBuilder.selectHeroDesc') || 'Choose the hero that will lead your deck.'}</p>
            </div>

            <div className="hero-search-container">
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    placeholder={t('filters.search_placeholder') || "Search heroes..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="hero-search-input"
                />
            </div>

            {loading && <div className="loading-spinner">{t('common.loading')}</div>}
            {error && <div className="error-message">{error}</div>}

            <div className="heroes-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginTop: '1.5rem'
            }}>
                {filteredHeroes.map(hero => (
                    <div
                        key={hero.id}
                        className="hero-card-option"
                        onClick={() => onSelect(hero)}
                        style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    >
                        <div className="card-image-container">
                            <img
                                src={hero.imagen}
                                alt={hero.name}
                                style={{ width: '100%', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
                            />
                        </div>
                        <div className="hero-name" style={{ textAlign: 'center', marginTop: '0.5rem', fontWeight: 'bold' }}>
                            {hero.name}
                        </div>
                        <div className="hero-details" style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            {hero.clase}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HeroSelection;
