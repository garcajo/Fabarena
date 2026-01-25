import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/StackedView.css';

const StackedDeckList = ({
    cards,
    onCardClick,
    onDragStart,
    isOwner,
    activeCardMenu,
    setActiveCardMenu,
    section,
    onMoveCard,
    onRemoveCard,
    setHoveredCard
}) => {
    const { t } = useLanguage();

    // Sort logic handled by parent usually, but we can enforce it: Cost -> Name -> Pitch
    const sortedCards = [...cards].sort((a, b) => {
        const costA = a.card.costo ?? 0;
        const costB = b.card.costo ?? 0;
        if (costA !== costB) return costA - costB;
        if (a.card.name !== b.card.name) return a.card.name.localeCompare(b.card.name);
        return (a.card.pitch || 0) - (b.card.pitch || 0);
    });

    return (
        <div className="stacked-deck-grid">
            {sortedCards.map((item, index) => {
                const uniqueKey = `${item.card.id}-${section}-${index}`; // Match key format used in DeckBuilder logic if possible, or just unique
                // DeckBuilder uses: key={`${card.id}-${index}`} for valid list items.
                // The activeCardMenu logic in DeckBuilder relies on exact key matching if passed back.
                // We'll use a local key for the menu check.

                // NOTE: DeckBuilder uses `${card.id}-${section}-${index}` for menuKey. We must match this format.
                // However, DeckBuilder passes `index` from the map loop. usage: getSortedCards(cardList).map((item, index) => renderCardItem(item, sectionName, index));

                // Since we re-sort here, the index might differ from DeckBuilder's internal map if we aren't careful.
                // BUT, `renderListSection` calls `getSortedCards(cardList)` BEFORE passing to StackedDeckList (in my previous edit).
                // So `cards` prop IS ALREADY SORTED.
                // So the index here `map((item, index))` effectively matches the one in renderListSection's map.
                // So we can use `${item.card.id}-${section}-${index}` as the key.

                const menuKey = `${item.card.id}-${section}-${index}`;
                const isMenuOpen = activeCardMenu === menuKey;

                return (
                    <div
                        key={menuKey}
                        className={`stacked-card-group ${isMenuOpen ? 'menu-open' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isOwner && setActiveCardMenu) {
                                setActiveCardMenu(isMenuOpen ? null : menuKey);
                            } else if (onCardClick) {
                                onCardClick(item);
                            }
                        }}
                        draggable={isOwner}
                        onDragStart={(e) => {
                            if (isOwner && onDragStart) {
                                onDragStart(e, item.card);
                            }
                        }}
                        onMouseEnter={() => setHoveredCard && setHoveredCard(item.card.imagen)}
                        onMouseLeave={() => setHoveredCard && setHoveredCard(null)}
                        style={{ cursor: isOwner ? 'pointer' : 'default' }}
                    >
                        <div className="stack-container">
                            {/* Render "Underneath" copies */}
                            {Array.from({ length: Math.min(item.count, 10) - 1 }).map((_, i) => (
                                <div
                                    key={`stack-${i}`}
                                    className="card-layer"
                                    style={{
                                        backgroundImage: `url(${item.card.imagen})`,
                                        top: `${(i) * 25}px`, // 25px offset per card
                                        zIndex: i
                                    }}
                                />
                            ))}

                            {/* Top Card */}
                            <div
                                className="card-main-visual"
                                style={{
                                    zIndex: item.count,
                                    top: `${(Math.min(item.count, 10) - 1) * 25}px`
                                }}
                            >
                                <img src={item.card.imagen} alt={item.card.name} loading="lazy" />
                            </div>
                        </div>

                        {/* Context Menu (Popover) */}
                        {isMenuOpen && isOwner && (
                            <div className="card-options-popover" style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 100,
                                minWidth: '160px',
                                background: 'var(--color-bg-card)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '8px',
                                padding: '0.5rem',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                            }}>
                                {['mainDeck', 'sideboard', 'maybeboard'].includes(section) && section !== 'mainDeck' && (
                                    <button className="popover-option" onClick={(e) => { e.stopPropagation(); onMoveCard(item, section, 'mainDeck'); setActiveCardMenu(null); }}>
                                        {t('deckBuilder.moveToDeck') || 'Move to Deck'}
                                    </button>
                                )}
                                {(['mainDeck', 'sideboard', 'maybeboard'].includes(section) || section === 'equipment') && section !== 'sideboard' && (
                                    <button className="popover-option" onClick={(e) => { e.stopPropagation(); onMoveCard(item, section, 'sideboard'); setActiveCardMenu(null); }}>
                                        {t('deckBuilder.moveToSideboard') || 'Move to Sideboard'}
                                    </button>
                                )}
                                {(['mainDeck', 'sideboard', 'maybeboard'].includes(section) || section === 'equipment') && section !== 'maybeboard' && (
                                    <button className="popover-option" onClick={(e) => { e.stopPropagation(); onMoveCard(item, section, 'maybeboard'); setActiveCardMenu(null); }}>
                                        {t('deckBuilder.moveToMaybeboard') || 'Move to Maybeboard'}
                                    </button>
                                )}
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 0' }}></div>
                                <button className="popover-option danger" onClick={(e) => { e.stopPropagation(); onRemoveCard(item.card.id, section); setActiveCardMenu(null); }}>
                                    {t('deckBuilder.remove') || 'Remove'}
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default StackedDeckList;
