import React, { useState, useEffect } from 'react';
import { CardService } from '../../services/api';
import { Search, Plus, Minus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/CardList.css';

const DeckCardsEditor = ({ deck, setDeckData, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();

    // Debounce search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length < 2) {
                setSearchResults([]);
                return;
            }

            setLoading(true);
            try {
                // Filter by class (Hero class + Generic)
                const { data } = await CardService.getCards({
                    search: searchTerm,
                    clase: [deck.hero.clase, 'Generic'],
                    pageSize: 20
                });
                setSearchResults(data || []);
            } catch (error) {
                console.error("Error searching cards:", error);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, deck.hero]);

    const addCard = (card) => {
        setDeckData(prev => {
            const existing = prev.mainDeck.find(c => c.card.id === card.id);
            if (existing) {
                // Limit max copies (usually 3)
                if (existing.count >= 3) return prev;
                return {
                    ...prev,
                    mainDeck: prev.mainDeck.map(c => c.card.id === card.id ? { ...c, count: c.count + 1 } : c)
                };
            }
            return {
                ...prev,
                mainDeck: [...prev.mainDeck, { card, count: 1 }]
            };
        });
    };

    const removeCard = (cardId) => {
        setDeckData(prev => {
            const existing = prev.mainDeck.find(c => c.card.id === cardId);
            if (existing.count > 1) {
                return {
                    ...prev,
                    mainDeck: prev.mainDeck.map(c => c.card.id === cardId ? { ...c, count: c.count - 1 } : c)
                };
            }
            return {
                ...prev,
                mainDeck: prev.mainDeck.filter(c => c.card.id !== cardId)
            };
        });
    };

    const totalCards = deck.mainDeck.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <div className="deck-editor-step fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Left Column: Search & Add */}
            <div className="card-search-section">
                <div className="step-header">
                    <ArrowLeft size={20} />
                    <h3>{t('deckBuilder.addCards') || 'Add Cards'}</h3>
                    <p>{t('deckBuilder.addCardsDesc') || 'Search and add cards to your deck.'}</p>
                </div>

                <div className="search-bar-container" style={{ position: 'relative', marginBottom: '1rem' }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder={t('filters.search_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="hero-search-input" // Reusing style
                        autoFocus
                    />
                </div>

                <div className="search-results-list" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {loading && <div className="loading-spinner">{t('common.loading')}</div>}
                    {!loading && searchResults.map(card => (
                        <div key={card.id} className="card-list-row" style={{ gridTemplateColumns: '3rem 1fr 1fr 3rem', gap: '0.5rem', padding: '0.5rem' }}>
                            <img src={card.imagen} alt={card.name} className="list-image-thumb" />
                            <div className="list-cell-name">{card.name}</div>
                            <div className={`list-cell-pitch pitch-${card.pitch}`}>{Array(card.pitch).fill('●').join('')}</div>
                            <button
                                onClick={() => addCard(card)}
                                className="add-btn"
                                style={{
                                    background: 'var(--color-primary-green, #10b981)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0.2rem'
                                }}
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Column: Current Deck */}
            <div className="current-deck-section" style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>{deck.hero ? deck.hero.name : 'Deck'}</h3>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{totalCards} cards</span>
                </div>

                {deck.hero && (
                    <div className="hero-summary" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <img src={deck.hero.imagen} alt={deck.hero.name} style={{ width: '60px', borderRadius: '4px' }} />
                        <div>
                            <div style={{ fontWeight: 'bold' }}>{deck.hero.name}</div>
                            <div style={{ fontSize: '0.9rem', color: '#aaa' }}>{deck.hero.clase}</div>
                        </div>
                    </div>
                )}

                <div className="deck-list" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {deck.mainDeck.map(item => (
                        <div key={item.card.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: '#333',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold'
                                }}>{item.count}</div>
                                <span className={`pitch-${item.card.pitch}`}>{item.card.name}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => addCard(item.card)} style={{ background: 'none', border: '1px solid #555', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}><Plus size={14} /></button>
                                <button onClick={() => removeCard(item.card.id)} style={{ background: 'none', border: '1px solid #555', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}><Minus size={14} /></button>
                            </div>
                        </div>
                    ))}
                    {deck.mainDeck.length === 0 && <div style={{ color: '#aaa', fontStyle: 'italic', textAlign: 'center', marginTop: '2rem' }}>No cards added yet.</div>}
                </div>

                <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                    <button className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Save size={18} />
                        {t('common.save') || 'Save Deck'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeckCardsEditor;
