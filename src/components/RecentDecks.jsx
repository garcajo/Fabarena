import React, { useState, useEffect } from 'react';
import { Clock, Trash2, Calendar, Layout } from 'lucide-react';
import { StorageService } from '../services/storage';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import '../styles/RecentCards.css'; // Reuse basic layout styles
import '../styles/Decks.css'; // Reuse deck card styling

const RecentDecks = () => {
    const [recentDecks, setRecentDecks] = useState(() => StorageService.getRecentDecks());
    const { t } = useLanguage();

    const handleClearHistory = () => {
        StorageService.clearHistory(); // This clears both, maybe we should split clearing?
        // StorageService currently has one clearHistory for ALL. 
        // User request was generic "clear history", but usually implies specific section if button is there.
        // For now, let's just clear decks from state, and maybe update StorageService to support targeted clear later if needed.
        // But `clearHistory` wipes `recent_cards` too.
        // Let's assume we want to clear only decks here for UX safety?
        // Or if I call clearHistory, I should update the UI for both if they are on same page?
        // Since they are separate components, they won't automatically sync without event/context.
        // Let's implement a targeted clear in component state for now and perhaps partial clear in service if possible,
        // or just accept global clear.
        // Actually, let's just modify the state `setRecentDecks([])` and update LS manually for just decks to be safe?
        // StorageService could have `clearDeckHistory`.
        // For this iteration, I will assume global clear is acceptable or stick to the existing method.
        // But to avoid clearing Cards from the Decks component, I'll add `clearDeckHistory` to StorageService via logic injection or just manual LS set.

        // Manual partial clear for safety:
        localStorage.removeItem(StorageService.KEY_DECKS);
        setRecentDecks([]);
    };

    if (recentDecks.length === 0) {
        return null; // Don't show empty section if no decks viewed
    }

    return (
        <div className="recent-cards-section" style={{ marginTop: '3rem' }}>
            <div className="recent-header">
                <div className="recent-title">
                    <Layout size={20} className="text-primary" />
                    <h2>{t('recent.decks_title') || 'Recently Viewed Decks'}</h2>
                </div>
                {/* Optional: Clear button specific to decks? Or reuse the global one? */}
                <button
                    onClick={handleClearHistory}
                    className="clear-history-btn"
                    title={t('recent.clear')}
                >
                    <Trash2 size={16} />
                    <span>{t('recent.clear')}</span>
                </button>
            </div>

            <div className="decks-grid" style={{ paddingBottom: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                {recentDecks.map(deck => (
                    <div key={deck.id} className="deck-card-wrapper" style={{ position: 'relative' }}>
                        <Link to={`/decks/${deck.id}`} className="deck-card">
                            {/* Background Image */}
                            <div
                                className="deck-card-bg"
                                style={{
                                    backgroundImage: `url(${deck.hero?.imagen || '/placeholder-hero.jpg'})`
                                }}
                            ></div>

                            {/* Dark Overlay */}
                            <div className="deck-card-overlay"></div>

                            {/* Content */}
                            <div className="deck-card-content">
                                <span className={`format-badge ${deck.format === 'cc' ? 'format-cc' : 'format-silver'}`}>
                                    {deck.format === 'cc' ? 'Classic Constructed' : 'Silver Age'}
                                </span>
                                <h3 className="deck-name">{deck.name}</h3>
                                <div className="deck-meta">
                                    <span>{deck.hero?.name || 'Unknown Hero'}</span>
                                </div>
                                <div className="deck-meta" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                                    <Calendar size={12} />
                                    {new Date(deck.updated_at).toLocaleDateString()}
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentDecks;
