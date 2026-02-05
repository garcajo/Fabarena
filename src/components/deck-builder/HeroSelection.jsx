import React, { useState, useEffect } from 'react';
import { CardService } from '../../services/api';
import { Search, ArrowLeft, User, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/CardGrid.css';

const HeroSelection = ({ onSelect, onBack, format }) => {
    const [heroes, setHeroes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [llHeroes, setLlHeroes] = useState([]);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch LL Heroes first if CC
                let excludedNames = [];
                if (format === 'cc') {
                    const { data: llData } = await CardService.getLivingLegendData();
                    if (llData) {
                        excludedNames = llData
                            .filter(h => h.status === 'Ascended')
                            .map(h => h.name);
                        setLlHeroes(excludedNames);
                    }
                }

                // 2. Fetch Heroes
                const { data, error: fetchError } = await CardService.getCards({
                    type: 'Hero',
                    pageSize: 500 // Fetch plenty to filter client-side
                });

                if (fetchError) throw new Error(fetchError);

                let uniqueHeroes = [];
                const seen = new Set();

                (data || []).forEach(hero => {
                    // 1. One entry per Hero Name
                    const heroName = hero.name;
                    if (!seen.has(heroName)) {
                        // 2. Filter out transformations (Demi-Heroes, Tokens, etc)
                        const typeLine = (hero.tipo || hero.card_type || '').toLowerCase();
                        const isTransformation = typeLine.includes('demi') || typeLine.includes('transformation');

                        if (isTransformation) return;

                        // 3. Filter by format rules
                        const isYoung = typeLine.includes('young');
                        const isBannedLL = format === 'cc' && excludedNames.includes(heroName);

                        let isFormatLegal = true;
                        if (format === 'cc' && isYoung) isFormatLegal = false;
                        if (format === 'cc' && isBannedLL) isFormatLegal = false;
                        if (format === 'silver' && !isYoung) isFormatLegal = false;

                        if (isFormatLegal) {
                            seen.add(heroName);
                            uniqueHeroes.push(hero);
                        }
                    }
                });

                // Sort alphabetically
                uniqueHeroes.sort((a, b) => a.name.localeCompare(b.name));
                setHeroes(uniqueHeroes);
            } catch (err) {
                console.error("Error fetching heroes:", err);
                setError("Failed to load heroes. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [format]);

    const filteredHeroes = heroes.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.clase?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="hero-selection-page fade-in">
            <div className="selection-header">
                <button className="back-setup-btn" onClick={onBack}>
                    <ArrowLeft size={20} />
                    <span>{t('common.back') || 'Back'}</span>
                </button>
                <div className="header-content">
                    <h1>{t('deckBuilder.chooseYourHero') || 'Choose Your Hero'}</h1>
                    <p>{t('deckBuilder.heroSelectSubtitle') || 'Select the champion who will carry your banners into battle.'}</p>
                </div>
            </div>

            <div className="hero-filters-bar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder={t('filters.search_placeholder') || "Search heroes..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="mystic-spinner" />
                    <p>{t('common.loading') || 'Summoning Heroes...'}</p>
                </div>
            ) : error ? (
                <div className="error-state">{error}</div>
            ) : (
                <div className="heroes-premium-grid">
                    {filteredHeroes.map(hero => (
                        <div
                            key={hero.id}
                            className="hero-premium-card"
                            onClick={() => onSelect(hero)}
                        >
                            <div className="hero-image-wrapper">
                                <img src={hero.imagen} alt={hero.name} loading="lazy" />
                                <div className="card-overlay">
                                    <Sparkles size={24} className="sparkle-icon" />
                                </div>
                            </div>
                            <div className="hero-info">
                                <h3>{hero.name}</h3>
                                <span className="hero-class-tag">{hero.clase}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .hero-selection-page {
                    max-width: 1200px;
                    margin: 2rem auto;
                    padding: 0 1.5rem 5rem;
                }
                .selection-header {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    margin-bottom: 3rem;
                }
                .back-setup-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: transparent;
                    border: none;
                    color: rgba(255,255,255,0.5);
                    cursor: pointer;
                    width: fit-content;
                    padding: 0.5rem;
                    transition: all 0.2s;
                }
                .back-setup-btn:hover {
                    color: white;
                    transform: translateX(-5px);
                }
                .header-content h1 {
                    font-family: 'Cinzel', serif;
                    font-size: 3rem;
                    margin: 0;
                    letter-spacing: -0.02em;
                }
                .header-content p {
                    color: rgba(255,255,255,0.5);
                    font-size: 1.1rem;
                    margin: 0.5rem 0 0;
                }
                .hero-filters-bar {
                    margin-bottom: 2rem;
                    background: rgba(255,255,255,0.03);
                    padding: 1rem;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: rgba(0,0,0,0.2);
                    padding: 0.75rem 1rem;
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.1);
                    max-width: 400px;
                }
                .search-box input {
                    background: transparent;
                    border: none;
                    color: white;
                    width: 100%;
                    outline: none;
                }
                .heroes-premium-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 2rem;
                }
                .hero-premium-card {
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }
                .hero-image-wrapper {
                    position: relative;
                    aspect-ratio: 2.5 / 3.5;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
                    background: #111;
                }
                .hero-image-wrapper img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.5s;
                }
                .card-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.8), transparent 40%);
                    opacity: 0.6;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: opacity 0.3s;
                }
                .sparkle-icon {
                    color: white;
                    opacity: 0;
                    transform: scale(0.5);
                    transition: all 0.3s;
                }
                .hero-premium-card:hover {
                    transform: translateY(-10px);
                }
                .hero-premium-card:hover .hero-image-wrapper img {
                    transform: scale(1.05);
                }
                .hero-premium-card:hover .card-overlay {
                    opacity: 1;
                    background: linear-gradient(to top, rgba(239, 68, 68, 0.4), transparent 60%);
                }
                .hero-premium-card:hover .sparkle-icon {
                    opacity: 1;
                    transform: scale(1);
                }
                .hero-info {
                    padding: 1rem 0.5rem;
                }
                .hero-info h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: white;
                }
                .hero-class-tag {
                    font-size: 0.8rem;
                    color: rgba(255,255,255,0.4);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .loading-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    padding: 5rem 0;
                    color: rgba(255,255,255,0.5);
                }
                .mystic-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(255,255,255,0.05);
                    border-top-color: var(--color-primary-red, #ef4444);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                @media (max-width: 768px) {
                    .header-content h1 { font-size: 2rem; }
                    .heroes-premium-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; }
                }
            `}} />
        </div>
    );
};

export default HeroSelection;
