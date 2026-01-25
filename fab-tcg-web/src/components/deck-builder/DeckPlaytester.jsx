import React, { useState, useEffect, useCallback } from 'react';
import { Shuffle, RotateCcw, Hand, Layers, Archive, Trash2, Play, X, Sword, Shield, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { getPitchValue, getCardCost, getWeaponCost, FAB_RULES, isWeapon, isEquipment, getPowerValue, getDefenseValue, hasGoAgain } from '../../data/fab-rules-summary';
import './DeckPlaytester.css';

/**
 * DeckPlaytester - Solitaire-style hand tester for Flesh and Blood decks
 * 
 * Implements core FAB mechanics from the Comprehensive Rules:
 * - Draw opening hand (4 cards based on hero intellect)
 * - Pitch cards for resources (1/2/3 based on pitch value)
 * - Play cards by spending resources from pitch
 * - Arsenal: Store 1 card for later use
 * - Weapons: Activate with resource costs (auto-detected from equipment array)
 * - Equipment: Can defend (block) for defense value, or use abilities
 * - End Turn: Pitched cards go to bottom of deck, draw up to intellect
 * - Banish: Remove cards from game
 */
const DeckPlaytester = ({ deck, onClose }) => {
    const { t } = useLanguage();

    // Game zones
    const [library, setLibrary] = useState([]);
    const [hand, setHand] = useState([]);
    const [arsenal, setArsenal] = useState([]);
    const [graveyard, setGraveyard] = useState([]);
    const [pitchZone, setPitchZone] = useState([]);
    const [banishZone, setBanishZone] = useState([]);
    const [equipmentZone, setEquipmentZone] = useState([]);
    const [weaponZone, setWeaponZone] = useState([]);
    const [heroZone, setHeroZone] = useState(null);

    // Resources and action points tracking (per FAB rules 1.13)
    const [resources, setResources] = useState(0);
    const [actionPoints, setActionPoints] = useState(1); // Start with 1 AP per turn (rule 4.3.2)

    // Card being dragged/selected
    const [selectedCard, setSelectedCard] = useState([]);

    // Feedback message
    const [feedbackMessage, setFeedbackMessage] = useState('');

    // Show feedback briefly
    const showFeedback = (message) => {
        setFeedbackMessage(message);
        setTimeout(() => setFeedbackMessage(''), 2000);
    };

    /**
     * Fisher-Yates shuffle algorithm
     */
    const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    /**
     * Initialize deck from mainDeck, equipment, weapon, and hero cards
     * Automatically separates weapons from equipment based on card_type
     */
    const initializeDeck = useCallback(() => {
        if (!deck?.mainDeck) return;

        // Expand cards by quantity
        const expandedDeck = [];
        deck.mainDeck.forEach(entry => {
            const qty = entry.quantity || entry.count || 1;
            for (let i = 0; i < qty; i++) {
                expandedDeck.push({
                    ...entry,
                    instanceId: `${entry.card?.id || entry.id}-${i}-${Date.now()}`
                });
            }
        });

        const shuffled = shuffleArray(expandedDeck);
        setLibrary(shuffled);
        setHand([]);
        setArsenal([]);
        setGraveyard([]);
        setPitchZone([]);
        setBanishZone([]);
        setResources(0);
        setActionPoints(1); // Start with 1 action point per turn (FAB rule 4.3.2)
        setFeedbackMessage('');

        // Collect all equipment/weapons from deck.equipment array
        // We need to separate weapons from equipment based on card_type
        const allEquipment = deck?.equipment || [];

        // Separate weapons and equipment using helper functions
        const weapons = [];
        const equipment = [];

        allEquipment.forEach((card, idx) => {
            if (isWeapon(card)) {
                weapons.push({
                    ...card,
                    instanceId: `weapon-${card.id}-${idx}-${Date.now()}`,
                    usedThisTurn: false // Once per turn weapons
                });
            } else {
                equipment.push({
                    ...card,
                    instanceId: `equip-${card.id}-${idx}-${Date.now()}`,
                    isUsed: false, // Track if equipment has been used this turn
                    defenseCounters: 0 // Track -1{d} counters (battleworn/temper)
                });
            }
        });

        // Also check if deck already has separated weapons array
        if (deck?.weapons && deck.weapons.length > 0) {
            deck.weapons.forEach((card, idx) => {
                // Avoid duplicates if already in weapons array
                if (!weapons.some(w => w.id === card.id)) {
                    weapons.push({
                        ...card,
                        instanceId: `weapon-${card.id}-${idx + 100}-${Date.now()}`,
                        usedThisTurn: false
                    });
                }
            });
        }

        setWeaponZone(weapons);
        setEquipmentZone(equipment);

        // Initialize hero
        if (deck?.hero) {
            setHeroZone(deck.hero);
        } else {
            setHeroZone(null);
        }
    }, [deck]);

    useEffect(() => {
        initializeDeck();
    }, [initializeDeck]);

    /**
     * Draw cards from library to hand
     */
    const drawCards = (count = 1) => {
        if (library.length < count) count = library.length;
        if (count === 0) return;

        const drawn = library.slice(0, count);
        const remaining = library.slice(count);

        setHand(prev => [...prev, ...drawn]);
        setLibrary(remaining);
    };

    /**
     * Draw opening hand (4 cards in FAB)
     */
    const drawOpeningHand = () => {
        // First reset, then draw
        initializeDeck();
        // Need to use setTimeout to wait for state update
        setTimeout(() => {
            setLibrary(prev => {
                const drawn = prev.slice(0, 4);
                setHand(drawn);
                return prev.slice(4);
            });
        }, 50);
    };

    /**
     * Pitch a card from hand (generates resources based on pitch value)
     * FAB Rule 1.14.3: Pitching generates resources equal to pitch property (1-3)
     */
    const pitchCard = (card) => {
        const pitchValue = getPitchValue(card.card || card);
        if (pitchValue === 0) {
            showFeedback('❌ This card cannot be pitched (no pitch value)');
            return;
        }
        setResources(prev => prev + pitchValue);
        setHand(prev => prev.filter(c => c.instanceId !== card.instanceId));
        setPitchZone(prev => [...prev, card]);
        showFeedback(`⚡ +${pitchValue} resources`);
    };

    /**
     * Play a card from hand to graveyard
     * FAB Rule 5.1.6: Calculate and pay resource cost
     * FAB Rule 8.1.1c: Action cards cost 1 action point
     */
    const playCard = (card, fromArsenal = false) => {
        const cost = getCardCost(card.card || card);
        const cardType = (card.card?.card_type || card.card_type || '').toLowerCase();
        const isAction = cardType.includes('action') && !cardType.includes('reaction');

        // Check action point cost for action cards
        if (isAction && actionPoints < 1) {
            showFeedback('❌ No action points remaining');
            return;
        }

        // Check resource cost
        if (cost > resources) {
            showFeedback(`❌ Need ${cost} resources (have ${resources})`);
            return;
        }

        setResources(prev => prev - cost);
        if (isAction) {
            const goAgain = hasGoAgain(card.card || card);
            if (goAgain) {
                // Action costs 1 AP, but Go Again gains 1 AP -> Net 0 change
                // We don't decrement AP
                showFeedback(`▶️ Played ${getCardName(card)} (Go Again!)`);
            } else {
                setActionPoints(prev => prev - 1);
                showFeedback(`▶️ Played ${getCardName(card)} (-${cost} resources)`);
            }
        } else {
            showFeedback(`▶️ Played ${getCardName(card)} (-${cost} resources)`);
        }

        if (fromArsenal) {
            setArsenal(prev => prev.filter(c => c.instanceId !== card.instanceId));
        } else {
            setHand(prev => prev.filter(c => c.instanceId !== card.instanceId));
        }
        setGraveyard(prev => [...prev, card]);
    };

    /**
     * Put a card from hand to arsenal
     * FAB Rule 3.3.2: Arsenal can only contain up to 1 deck-card
     */
    const arsenalCard = (card) => {
        if (arsenal.length >= 1) {
            showFeedback('❌ Arsenal is full (max 1 card)');
            return;
        }
        setHand(prev => prev.filter(c => c.instanceId !== card.instanceId));
        setArsenal(prev => [...prev, card]);
        showFeedback('📦 Card added to Arsenal');
    };

    /**
     * End turn procedure (FAB Rule 4.4.3)
     * 1. Pitched cards go to bottom of deck (not graveyard!)
     * 2. Untap all equipment
     * 3. Lose all action and resource points
     * 4. Draw up to hero intellect
     */
    const endTurn = () => {
        // Move pitched cards to bottom of deck (FAB Rule 4.4.3c)
        setLibrary(prev => [...prev, ...pitchZone]);
        setPitchZone([]);
        setResources(0);
        setActionPoints(1); // Gain 1 action point for new turn

        // Reset equipment used state
        setEquipmentZone(prev => prev.map(card => ({ ...card, isUsed: false })));

        // Reset weapon used state
        setWeaponZone(prev => prev.map(card => ({ ...card, usedThisTurn: false })));

        // Draw up to hand size of 4 (intellect)
        const intellect = heroZone?.intellect || FAB_RULES.DEFAULT_INTELLECT;
        const cardsToDraw = Math.min(intellect - hand.length, library.length);
        if (cardsToDraw > 0) {
            drawCards(cardsToDraw);
        }

        showFeedback('🔄 New turn started');
    };

    /**
     * Banish a card from hand (some cards have banish effects)
     */
    const banishCard = (card) => {
        setHand(prev => prev.filter(c => c.instanceId !== card.instanceId));
        setBanishZone(prev => [...prev, card]);
        showFeedback('🚫 Card banished');
    };

    /**
     * Attack with a weapon (FAB Rule 5.2 - Activated Abilities)
     * Weapons have costs written as {r} symbols (e.g., {r}{r} = 2 resource cost)
     */
    const attackWithWeapon = (weapon) => {
        // Check if weapon was already used (once per turn)
        if (weapon.usedThisTurn) {
            showFeedback('❌ Weapon already used this turn');
            return;
        }

        // Check action point
        if (actionPoints < 1) {
            showFeedback('❌ No action points to attack');
            return;
        }

        // Get weapon activation cost from helper (uses fallback list)
        const weaponCost = getWeaponCost(weapon);

        if (weaponCost > resources) {
            showFeedback(`❌ Need ${weaponCost} resources to activate weapon`);
            return;
        }

        setResources(prev => prev - weaponCost);
        setActionPoints(prev => prev - 1);
        setWeaponZone(prev => prev.map(w =>
            w.instanceId === weapon.instanceId ? { ...w, usedThisTurn: true } : w
        ));

        showFeedback(`⚔️ Attacked with ${weapon.name} (-${weaponCost} resources)`);
    };

    /**
     * Use equipment to defend/block
     * FAB Rule 8.1.4b: Equipment can be declared as defending
     */
    const defendWithEquipment = (equipment) => {
        if (equipment.isUsed) {
            showFeedback('❌ Equipment already used this turn');
            return;
        }

        const defense = equipment.defense ?? equipment.defensa ?? 0;

        setEquipmentZone(prev => prev.map(e =>
            e.instanceId === equipment.instanceId ? { ...e, isUsed: true } : e
        ));

        showFeedback(`🛡️ Blocked with ${equipment.name} (${defense} defense)`);
    };

    const getCardImage = (card) => {
        return card.card?.imagen || card.imagen || '/placeholder-card.jpg';
    };

    const getCardName = (card) => {
        return card.card?.name || card.name || 'Unknown';
    };

    const getPitchColor = (card) => {
        const pitch = parseInt(card.card?.pitch || card.pitch || 0);
        switch (pitch) {
            case 1: return '#ef4444'; // Red
            case 2: return '#eab308'; // Yellow
            case 3: return '#3b82f6'; // Blue
            default: return '#888';
        }
    };

    return (
        <div className="playtester-overlay">
            <div className="playtester-container">
                {/* Header */}
                {/* Header */}
                <div className="playtester-header">
                    <button className="mobile-back-btn" onClick={onClose} aria-label="Back">
                        <ChevronLeft size={24} />
                    </button>
                    <h2>🎮 {t('playtester.title')}</h2>
                    <div className="playtester-stats">
                        <span className="stat-item">
                            <Layers size={16} /> {library.length} {t('playtester.library')}
                        </span>
                        <span className="stat-item action-points" title="Action Points">
                            ▶️ {actionPoints} AP
                        </span>
                        <span className="stat-item resources">
                            ⚡ {resources} {t('playtester.resources')}
                        </span>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Feedback Message */}
                {feedbackMessage && (
                    <div className="playtester-feedback">
                        {feedbackMessage}
                    </div>
                )}

                {/* Controls */}
                <div className="playtester-controls">
                    <button onClick={drawOpeningHand} className="control-btn primary">
                        <Hand size={18} /> {t('playtester.drawHand')}
                    </button>
                    <button onClick={() => drawCards(1)} className="control-btn">
                        <Layers size={18} /> {t('playtester.draw')}
                    </button>
                    <button onClick={endTurn} className="control-btn accent">
                        <Play size={18} /> {t('playtester.endTurn')}
                    </button>
                    <button onClick={initializeDeck} className="control-btn danger">
                        <RotateCcw size={18} /> {t('playtester.reset')}
                    </button>
                </div>

                {/* Game Mat */}
                <div className="playtester-mat">
                    {/* Hand Zone */}
                    <div className="zone hand-zone">
                        <h3><Hand size={16} /> {t('playtester.hand')} ({hand.length})</h3>
                        <div className="cards-row">
                            {hand.map(card => (
                                <div
                                    key={card.instanceId}
                                    className="playtest-card"
                                    style={{ borderColor: getPitchColor(card) }}
                                >
                                    <img src={getCardImage(card)} alt={getCardName(card)} />
                                    <div className="card-actions">
                                        <button onClick={() => playCard(card)} title="Play">
                                            <Play size={14} />
                                        </button>
                                        <button onClick={() => pitchCard(card)} title="Pitch">
                                            ⚡
                                        </button>
                                        <button onClick={() => arsenalCard(card)} title="Arsenal">
                                            <Archive size={14} />
                                        </button>
                                        <button onClick={() => banishCard(card)} title="Banish" style={{ color: '#a855f7' }}>
                                            🚫
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {hand.length === 0 && (
                                <div className="empty-zone">{t('playtester.noCards')}</div>
                            )}
                        </div>
                    </div>

                    {/* Weapon Zone */}
                    {weaponZone.length > 0 && (
                        <div className="zone weapon-zone">
                            <h3><Sword size={16} /> {t('playtester.weapon') || 'Weapons'} ({weaponZone.length})</h3>
                            <div className="cards-row">
                                {weaponZone.map(weapon => (
                                    <div
                                        key={weapon.instanceId}
                                        className={`playtest-card ${weapon.usedThisTurn ? 'used' : ''}`}
                                        style={{ borderColor: '#f97316' }}
                                    >
                                        <img src={weapon.imagen || '/placeholder-card.jpg'} alt={weapon.name || 'Weapon'} />
                                        <div className="card-actions">
                                            <button
                                                onClick={() => attackWithWeapon(weapon)}
                                                title={`Attack (cost: ${getWeaponCost(weapon)} resources)`}
                                                style={{ color: weapon.usedThisTurn ? '#666' : '#f97316' }}
                                                disabled={weapon.usedThisTurn}
                                            >
                                                <Sword size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Equipment Zone */}
                    {equipmentZone.length > 0 && (
                        <div className="zone equipment-zone">
                            <h3><Shield size={16} /> {t('playtester.equipment') || 'Equipment'} ({equipmentZone.length})</h3>
                            <div className="cards-row">
                                {equipmentZone.map(card => (
                                    <div
                                        key={card.instanceId}
                                        className={`playtest-card ${card.isUsed ? 'used' : ''}`}
                                        style={{ borderColor: '#22c55e' }}
                                    >
                                        <img src={card.imagen || '/placeholder-card.jpg'} alt={card.name || 'Equipment'} />
                                        <div className="card-actions">
                                            <button
                                                onClick={() => defendWithEquipment(card)}
                                                title={`Block (${card.defense ?? card.defensa ?? 0} defense)`}
                                                style={{ color: card.isUsed ? '#666' : '#22c55e' }}
                                                disabled={card.isUsed}
                                            >
                                                <Shield size={14} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    // Destroy equipment (move to graveyard)
                                                    setEquipmentZone(prev => prev.filter(c => c.instanceId !== card.instanceId));
                                                    setGraveyard(prev => [...prev, card]);
                                                    showFeedback(`🗑️ ${card.name} destroyed`);
                                                }}
                                                title="Destroy"
                                                style={{ color: '#ef4444' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bottom Row: Arsenal, Pitched, Graveyard, Banish */}
                    <div className="zones-row">
                        {/* Arsenal */}
                        <div className="zone arsenal-zone">
                            <h3><Archive size={16} /> {t('playtester.arsenal')} ({arsenal.length}/1)</h3>
                            <div className="cards-row small">
                                {arsenal.map(card => (
                                    <div
                                        key={card.instanceId}
                                        className="playtest-card small"
                                        onClick={() => {
                                            // Play from arsenal
                                            setArsenal(prev => prev.filter(c => c.instanceId !== card.instanceId));
                                            playCard(card);
                                        }}
                                    >
                                        <img src={getCardImage(card)} alt={getCardName(card)} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pitch Zone */}
                        <div className="zone pitch-zone">
                            <h3>⚡ {t('playtester.pitched')} ({pitchZone.length})</h3>
                            <div className="cards-row small stacked">
                                {pitchZone.slice(-3).map(card => (
                                    <div key={card.instanceId} className="playtest-card small stacked">
                                        <img src={getCardImage(card)} alt={getCardName(card)} />
                                    </div>
                                ))}
                                {pitchZone.length > 3 && (
                                    <span className="more-indicator">+{pitchZone.length - 3}</span>
                                )}
                            </div>
                        </div>

                        {/* Graveyard */}
                        <div className="zone graveyard-zone">
                            <h3><Trash2 size={16} /> {t('playtester.graveyard')} ({graveyard.length})</h3>
                            <div className="cards-row small stacked">
                                {graveyard.slice(-3).map(card => (
                                    <div key={card.instanceId} className="playtest-card small stacked">
                                        <img src={getCardImage(card)} alt={getCardName(card)} />
                                    </div>
                                ))}
                                {graveyard.length > 3 && (
                                    <span className="more-indicator">+{graveyard.length - 3}</span>
                                )}
                            </div>
                        </div>

                        {/* Banish Zone */}
                        <div className="zone banish-zone">
                            <h3>🚫 {t('playtester.banish') || 'Banish'} ({banishZone.length})</h3>
                            <div className="cards-row small stacked">
                                {banishZone.slice(-3).map(card => (
                                    <div key={card.instanceId} className="playtest-card small stacked">
                                        <img src={getCardImage(card)} alt={getCardName(card)} />
                                    </div>
                                ))}
                                {banishZone.length > 3 && (
                                    <span className="more-indicator">+{banishZone.length - 3}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="playtester-instructions">
                    <p>💡 {t('playtester.instructions')}</p>
                </div>
            </div>
        </div>
    );
};

export default DeckPlaytester;
