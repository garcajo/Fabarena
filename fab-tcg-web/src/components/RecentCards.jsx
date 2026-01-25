import React, { useState, useEffect } from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { StorageService } from '../services/storage';
import { useLanguage } from '../context/LanguageContext';
import CardGrid from './CardGrid';
import CardModal from './CardModal';
import '../styles/RecentCards.css';

const RecentCards = () => {
    const [activeTab, setActiveTab] = useState('cards'); // 'cards' | 'decks'
    const [recentCards, setRecentCards] = useState(() => StorageService.getRecentCards());
    const [recentDecks, setRecentDecks] = useState(() => StorageService.getRecentDecks());
    const [selectedCard, setSelectedCard] = useState(null);
    const { t } = useLanguage();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleClearHistory = () => {
        if (activeTab === 'cards') {
            StorageService.clearHistoryValues && StorageService.clearHistoryValues('cards'); // If we split it method
            // Fallback since we only have global clear or we need to update Service. make it simple:
            localStorage.removeItem(StorageService.KEY);
            setRecentCards([]);
        } else {
            localStorage.removeItem(StorageService.KEY_DECKS);
            setRecentDecks([]);
        }
    };

    const hasContent = activeTab === 'cards' ? recentCards.length > 0 : recentDecks.length > 0;

    // Limit to 8 items on mobile
    const displayedCards = isMobile ? recentCards.slice(0, 8) : recentCards;
    const displayedDecks = isMobile ? recentDecks.slice(0, 8) : recentDecks;

    return (
        <div className="recent-cards-section">
            <div className="recent-header">
                <div className="recent-title-group">
                    <div className="recent-icon-wrapper">
                        <Clock size={20} className="text-primary" />
                    </div>

                    <div className="recent-tabs">
                        <h2 style={{ margin: '0 1rem 0 0', fontSize: '1.25rem' }}>{t('recent.title')}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.25rem' }}>
                            <button
                                className={`recent-tab ${activeTab === 'cards' ? 'active' : ''}`}
                                onClick={() => setActiveTab('cards')}
                            >
                                {t('nav.cards')}
                            </button>
                            <div className="tab-divider"></div>
                            <button
                                className={`recent-tab ${activeTab === 'decks' ? 'active' : ''}`}
                                onClick={() => setActiveTab('decks')}
                            >
                                {t('nav.decks')}
                            </button>
                        </div>
                    </div>
                </div>

                {hasContent && (
                    <button
                        onClick={handleClearHistory}
                        className="clear-history-btn"
                        title={t('recent.clear')}
                    >
                        <Trash2 size={16} />
                        <span>{t('recent.clear')}</span>
                    </button>
                )}
            </div>

            <div className="recent-content-area">
                {activeTab === 'cards' ? (
                    displayedCards.length > 0 ? (
                        <div className="recent-decks-grid">
                            {displayedCards.map((card, index) => (
                                <div
                                    key={`${card.unique_id || card.id}-${index}`}
                                    className="mini-deck-card"
                                    onClick={() => setSelectedCard(card)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="mini-deck-image">
                                        <img src={card.imagen || '/placeholder-card.jpg'} alt={card.name} />
                                    </div>
                                    <div className="mini-deck-info">
                                        <h4>{card.name}</h4>
                                        <span className="mini-deck-hero">{card.type_text || card.tipo || 'Unknown Type'}</span>
                                        <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                                            {card.pitch && <span className="mini-format-badge" style={{ background: card.pitch === '1' ? '#ef4444' : card.pitch === '2' ? '#eab308' : '#3b82f6', color: 'white' }}>P: {card.pitch}</span>}
                                            {card.costo !== undefined && <span className="mini-format-badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>C: {card.costo}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="recent-empty-state">
                            <p>{t('recent.empty_desc')}</p>
                        </div>
                    )
                ) : (
                    displayedDecks.length > 0 ? (
                        <div className="recent-decks-grid">
                            {displayedDecks.map(deck => (
                                <a key={deck.id} href={`/decks/${deck.id}`} className="mini-deck-card">
                                    <div className="mini-deck-image">
                                        <img src={deck.hero?.imagen || '/placeholder.jpg'} alt={deck.hero?.name} />
                                    </div>
                                    <div className="mini-deck-info">
                                        <h4>{deck.name}</h4>
                                        <span className="mini-deck-hero">{deck.hero?.name || 'Unknown Hero'}</span>
                                        <span className={`mini-format-badge ${deck.format === 'cc' ? 'cc' : 'silver'}`}>
                                            {deck.format === 'cc' ? 'CC' : 'Silver'}
                                        </span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="recent-empty-state">
                            <p>No decks viewed yet.</p>
                        </div>
                    )
                )}
            </div>

            {selectedCard && (
                <CardModal
                    card={selectedCard}
                    onClose={() => setSelectedCard(null)}
                />
            )}
        </div>
    );
};

export default RecentCards;
