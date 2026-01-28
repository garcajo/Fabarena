import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { usePreloadedData } from '../context/DataPreloadContext';
import { CardService } from '../services/api';
import { Trophy, Crown, Swords } from 'lucide-react';

const getClassColor = (className) => {
    switch (className?.toLowerCase()) {
        case 'guardian': return '#00b4d8';
        case 'ranger': return '#4361ee';
        case 'runeblade': return '#7209b7';
        case 'illusionist': return '#f72585';
        case 'wizard': return '#b5179e';
        case 'mechanologist': return '#ff9e00';
        case 'assassin': return '#ced4da';
        case 'ninja': return '#ffb703';
        case 'brute': return '#e63946';
        case 'warrior': return '#fb8500';
        default: return '#adb5bd';
    }
};

const LivingLegendPage = () => {
    const { t } = useLanguage();
    const { livingLegend, isLivingLegendLoading } = usePreloadedData();
    const [heroDetails, setHeroDetails] = useState({}); // Stores images and classes
    const [detailsLoading, setDetailsLoading] = useState(true);

    // Fetch image details when living legend data is available
    useEffect(() => {
        const fetchDetails = async () => {
            if (!livingLegend || livingLegend.length === 0) {
                setDetailsLoading(false);
                return;
            }

            try {
                const names = livingLegend.map(h => h.name);
                const response = await CardService.getCardsByNames(names);
                const cards = response.data || [];

                const detailsMap = {};
                for (const h of livingLegend) {
                    const match = cards.find(c => c.name === h.name) || cards.find(c => h.name.includes(c.name));
                    if (match) {
                        detailsMap[h.name] = {
                            image: match.imagen,
                            class: match.clase
                        };
                    }
                }
                setHeroDetails(detailsMap);
            } catch (err) {
                console.error("Error fetching hero details", err);
            } finally {
                setDetailsLoading(false);
            }
        };

        if (!isLivingLegendLoading && livingLegend.length > 0) {
            fetchDetails();
        } else if (!isLivingLegendLoading) {
            setDetailsLoading(false);
        }
    }, [livingLegend, isLivingLegendLoading]);

    const loading = isLivingLegendLoading || detailsLoading;
    const heroes = livingLegend || [];

    return (
        <div className="living-legend-page" style={{ color: 'var(--color-text-main)', paddingBottom: '3rem' }}>
            <div className="container" style={{ padding: '2rem 1rem' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'rgba(255, 215, 0, 0.1)', marginBottom: '1rem', border: '1px solid var(--color-primary-gold)' }}>
                        <Crown size={48} color="var(--color-primary-gold)" />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #ffd700, #ffaa00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {t('livingLegend.title')}
                    </h1>
                </div>

                {/* Explanation Section */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '2rem',
                    borderRadius: '12px',
                    marginBottom: '3rem',
                    borderLeft: '4px solid var(--color-primary-gold)'
                }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 0 }}>
                        <Trophy size={20} color="var(--color-primary-gold)" />
                        {t('livingLegend.explanation_title')}
                    </h2>
                    <p style={{ lineHeight: '1.6', color: 'var(--color-text-muted)' }}>
                        {t('livingLegend.explanation_text')}
                    </p>
                </div>

                {/* Heroes List */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>Loading Leaderboard...</div>
                ) : (
                    <div className="ll-list">
                        {heroes.map((hero, index) => {
                            // Use detail info if available, else fallback to scraped or defaults
                            const heroClass = hero.class || heroDetails[hero.name]?.class || 'Unknown';
                            const heroImage = heroDetails[hero.name]?.image;
                            const heroColor = getClassColor(heroClass);

                            const isAscended = hero.status === 'Ascended' || hero.points >= 1000;
                            const progress = isAscended ? 100 : Math.min((hero.points / 1000) * 100, 100);

                            return (
                                <div key={hero.name} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '80px 1fr',
                                    gap: '1rem',
                                    background: 'var(--color-bg-card)',
                                    padding: '1rem',
                                    borderRadius: '8px',
                                    marginBottom: '1rem',
                                    alignItems: 'center',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {/* Gold Shine Effect for Ascended */}
                                    {isAscended && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0, right: 0,
                                            width: '30px', height: '30px',
                                            background: 'linear-gradient(135deg, transparent 50%, var(--color-primary-gold) 50%)',
                                            opacity: 0.5
                                        }}></div>
                                    )}

                                    {/* Avatar */}
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${heroColor}` }}>
                                        {heroImage ? (
                                            <img src={heroImage} alt={hero.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ fontSize: '2rem', color: '#555' }}>{hero.name.charAt(0)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{hero.name}</h3>

                                            {isAscended ? (
                                                <span style={{
                                                    background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                                                    color: '#000',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <Crown size={12} />
                                                    {t('livingLegend.status_ascended')}
                                                </span>
                                            ) : (
                                                <span style={{
                                                    background: '#333',
                                                    color: '#fff',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <Swords size={12} />
                                                    Active
                                                </span>
                                            )}
                                        </div>

                                        {/* Progress Bar Container */}
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem', color: 'var(--color-text-muted)' }}>
                                                <span>{Math.round(hero.points)} {t('livingLegend.points_suffix')}</span>
                                                <span>{Math.round(progress)}%</span>
                                            </div>
                                            <div style={{
                                                height: '8px',
                                                background: 'rgba(255,255,255,0.1)',
                                                borderRadius: '4px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${progress}%`,
                                                    height: '100%',
                                                    background: isAscended ? 'var(--color-primary-gold)' : heroColor,
                                                    boxShadow: `0 0 10px ${isAscended ? 'var(--color-primary-gold)' : heroColor}`,
                                                    transition: 'width 1s ease-in-out'
                                                }}></div>
                                            </div>
                                        </div>

                                        <div style={{ fontSize: '0.8rem', color: heroColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {heroClass !== 'Unknown' ? heroClass : ''}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LivingLegendPage;
