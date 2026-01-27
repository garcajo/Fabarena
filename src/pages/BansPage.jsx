import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { CardService } from '../services/api';
import { ShieldBan, AlertTriangle } from 'lucide-react';
import CardModal from '../components/CardModal';

const BansPage = () => {
    const { t } = useLanguage();
    const [bans, setBans] = useState({});
    const [cardDetails, setCardDetails] = useState({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Classic Constructed');
    const [selectedCard, setSelectedCard] = useState(null);

    // Map internal format keys to display names
    // If scraper finds "Blitz", we might show it as "Silver Age (Blitz)" if user demands Silver Age
    // or just separate tabs.
    // User requested "Classic Constructed" and "Silver Age".
    const TABS = ['Classic Constructed', 'Silver Age'];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data, error } = await CardService.getBannedCards();
                if (error) {
                    console.error("Failed to load bans", error);
                    return;
                }

                setBans(data);

                // Fetch visual details for all banned cards
                // Collect all names unique
                const allNames = new Set();
                Object.values(data).forEach(list => {
                    if (Array.isArray(list)) {
                        list.forEach(name => {
                            // Strip suffixes like " (Red)", " (Yellow)", etc for DB lookup
                            const clean = name.split('(')[0].trim();
                            allNames.add(clean);
                        });
                    }
                });

                if (allNames.size > 0) {
                    const response = await CardService.getCardsByNames(Array.from(allNames));
                    const details = {};
                    (response.data || []).forEach(card => {
                        // Store all versions for a given name
                        if (!details[card.name]) {
                            details[card.name] = [];
                        }
                        details[card.name].push(card);
                    });
                    setCardDetails(details);
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const currentList = bans[activeTab] || [];

    return (
        <div className="bans-page" style={{ paddingBottom: '3rem', minHeight: '100vh', color: 'var(--color-text-main)' }}>
            <div className="container" style={{ padding: '2rem 1rem' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'rgba(197, 34, 34, 0.1)', marginBottom: '1rem', border: '1px solid var(--color-primary-red)' }}>
                        <ShieldBan size={48} color="var(--color-primary-red)" />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                        {t('bans.title') || "Bans & Restrictions"}
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        {t('bans.subtitle') || "Official list of banned and suspended cards."}
                    </p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                background: activeTab === tab ? 'var(--color-primary-red)' : 'rgba(255,255,255,0.05)',
                                color: activeTab === tab ? 'white' : 'var(--color-text-muted)',
                                border: 'none',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* List */}
                {loading ? (
                    <div style={{ textAlign: 'center' }}>{t('common.loading')}</div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {currentList.length > 0 ? (
                            currentList.map(cardName => {
                                // 1. Determine target pitch from name suffix
                                let targetPitch = null; // Default to null (try Red/1 first)
                                let cleanName = cardName;

                                if (cardName.includes('(Red)')) {
                                    targetPitch = '1';
                                    cleanName = cardName.replace('(Red)', '').trim();
                                } else if (cardName.includes('(Yellow)')) {
                                    targetPitch = '2';
                                    cleanName = cardName.replace('(Yellow)', '').trim();
                                } else if (cardName.includes('(Blue)')) {
                                    targetPitch = '3';
                                    cleanName = cardName.replace('(Blue)', '').trim();
                                } else {
                                    // Remove any other parens just in case
                                    cleanName = cardName.split('(')[0].trim();
                                }

                                // 2. Find matching card
                                // cardDetails[cleanName] is now expected to be an Array of versions
                                const versions = cardDetails[cleanName] || [];
                                let card = null;

                                if (Array.isArray(versions) && versions.length > 0) {
                                    // a) Try to find exact pitch match
                                    if (targetPitch) {
                                        // Compare loosely (==) because pitch from DB is number, targetPitch is string
                                        card = versions.find(v => v.pitch == targetPitch);
                                    }

                                    // b) If no target pitch or not found, try Pitch 1 (Red)
                                    if (!card) {
                                        card = versions.find(v => v.pitch == 1);
                                    }

                                    // c) Fallback to any version
                                    if (!card) {
                                        card = versions[0];
                                    }
                                } else if (versions && !Array.isArray(versions)) {
                                    // Fallback for legacy object structure if service returns object
                                    card = versions;
                                }

                                return (
                                    <div
                                        key={cardName}
                                        onClick={() => card && setSelectedCard(card)}
                                        style={{
                                            background: 'var(--color-bg-card)',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            cursor: card ? 'pointer' : 'default',
                                            transition: 'transform 0.2s',
                                            position: 'relative'
                                        }}
                                        className="ban-card"
                                    >
                                        <div style={{ aspectRatio: '3/4', background: '#222', position: 'relative' }}>
                                            {card?.imagen ? (
                                                <img
                                                    src={card.imagen}
                                                    alt={cardName}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                                                />
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555' }}>
                                                    <ShieldBan size={32} />
                                                </div>
                                            )}

                                            {/* Banned Overlay */}
                                            <div style={{
                                                position: 'absolute',
                                                inset: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                background: 'rgba(0,0,0,0.4)'
                                            }}>
                                                <ShieldBan size={48} color="#ff4444" strokeWidth={1.5} />
                                            </div>
                                        </div>

                                        <div style={{ padding: '1rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '0.9rem', textAlign: 'center' }}>
                                                {cardName}
                                            </h3>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                                <AlertTriangle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                <p>No banned cards found for this format.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {selectedCard && (
                <CardModal
                    card={selectedCard}
                    isOpen={!!selectedCard}
                    onClose={() => setSelectedCard(null)}
                />
            )}
        </div>
    );
};

export default BansPage;
