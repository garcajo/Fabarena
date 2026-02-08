import React, { useState, useMemo } from 'react';
import { usePreloadedData } from '../context/DataPreloadContext';
import CardGrid from '../components/CardGrid';
import CardModal from '../components/CardModal';
import AdBanner from '../components/AdBanner';
import { useLanguage } from '../context/LanguageContext';

const HeroesPage = () => {
    const { t } = useLanguage();
    const { heroes, isHeroesLoading } = usePreloadedData();
    const [selectedCard, setSelectedCard] = useState(null);
    const [filterType, setFilterType] = useState('adult'); // 'adult' or 'young'

    // Filter and Deduplicate Heroes
    const processedHeroes = useMemo(() => {
        if (!heroes.length) return [];

        // 1. Filter by Type (Young vs Adult)
        const filtered = heroes.filter(hero => {
            const isYoung = hero.tipo && hero.tipo.toLowerCase().includes('young');
            return filterType === 'young' ? isYoung : !isYoung;
        });

        // 2. Deduplicate by Name (Prioritize Black Border / Non-HP sets)
        // Set priority: Non-HP > HP (1HP/2HP are white border)
        const getSetPriority = (setCode) => {
            if (!setCode) return 99;
            const code = setCode.toUpperCase();
            if (code === '1HP' || code === '2HP') return 10; // Low priority (White Border)
            return 1; // High priority (Black Border)
        };

        const uniqueMap = new Map();

        filtered.forEach(hero => {
            const existing = uniqueMap.get(hero.name);

            if (!existing) {
                uniqueMap.set(hero.name, hero);
            } else {
                // If we already have this hero, check if the new one is a "better" version (higher priority)
                const existingPriority = getSetPriority(existing.set_code);
                const newPriority = getSetPriority(hero.set_code);

                // If new hero has better set priority (lower score assumption? No, logic above: 1 is better than 10)
                // Wait, logic above: 1 (Black) < 10 (White). So lower is better.
                if (newPriority < existingPriority) {
                    uniqueMap.set(hero.name, hero);
                }
            }
        });

        return Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [heroes, filterType]);

    return (
        <div className="cards-page">
            <div className="container" style={{ padding: '2rem 0' }}>
                <div className="cards-header" style={{ marginBottom: '2rem' }}>
                    <h1 style={{ marginBottom: '0.5rem' }}>{t('nav.heroes')}</h1>
                    <p className="cards-subtitle" style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>{t('nav.encyclopedia')}</p>

                    {/* Filter Toggles */}
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button
                            className={`filter-btn ${filterType === 'adult' ? 'active' : ''}`}
                            onClick={() => setFilterType('adult')}
                            style={{
                                padding: '0.5rem 1.5rem',
                                borderRadius: '20px',
                                border: '1px solid var(--color-border)',
                                background: filterType === 'adult' ? 'var(--color-primary-red)' : 'transparent',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontWeight: '600'
                            }}
                        >
                            {t('heroesPage.adult')}
                        </button>
                        <button
                            className={`filter-btn ${filterType === 'young' ? 'active' : ''}`}
                            onClick={() => setFilterType('young')}
                            style={{
                                padding: '0.5rem 1.5rem',
                                borderRadius: '20px',
                                border: '1px solid var(--color-border)',
                                background: filterType === 'young' ? 'var(--color-primary-red)' : 'transparent',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontWeight: '600'
                            }}
                        >
                            {t('heroesPage.young')}
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <AdBanner position="top" />
                </div>

                <CardGrid
                    cards={processedHeroes}
                    isLoading={isHeroesLoading}
                    onCardClick={setSelectedCard}
                />
                {selectedCard && (
                    <CardModal
                        card={selectedCard}
                        onClose={() => setSelectedCard(null)}
                    />
                )}
                {!isHeroesLoading && processedHeroes.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                        <p>{t('heroesPage.no_heroes')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HeroesPage;
