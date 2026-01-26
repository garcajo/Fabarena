import React, { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { parseDecklist } from '../../utils/deckParser';
import { CardService, DeckService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import '../../styles/DeckImportModal.css';

const DeckImportModal = ({ onClose, onSuccess }) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [parsedInfo, setParsedInfo] = useState(null);

    const handleParse = () => {
        if (!text.trim()) return;

        try {
            const { heroName, deckName, format, cards } = parseDecklist(text);
            if (cards.length === 0) {
                setError("No cards found in text. Check format.");
                return;
            }
            setParsedInfo({ heroName, deckName, format, cards });
            setError(null);
        } catch (err) {
            setError("Failed to parse text.");
        }
    };

    const handleImport = async () => {
        if (!parsedInfo) return;
        setLoading(true);
        setError(null);

        try {
            // 1. Resolve Cards
            const uniqueNames = [...new Set(parsedInfo.cards.map(c => c.name))];
            const { data: dbCards, error: lookupError } = await CardService.getCardsByNames(uniqueNames);

            if (lookupError) throw new Error(lookupError);

            // 2. Map parsed cards to DB IDs and Category
            const equipmentResult = [];
            const mainDeckResult = [];
            const missingCards = [];

            parsedInfo.cards.forEach(parsedCard => {
                // Find matching DB card
                // Priority: Exact name match AND Pitch match (if parsed has pitch)
                let match = dbCards.find(db =>
                    db.name.toLowerCase() === parsedCard.name.toLowerCase() &&
                    (parsedCard.pitch ? db.pitch === parsedCard.pitch : true)
                );

                // If no exact pitch match, try any pitch
                if (!match) {
                    match = dbCards.find(db => db.name.toLowerCase() === parsedCard.name.toLowerCase());
                }

                if (match) {
                    // Categrize based on type (backend uses 'tipo' or similar)
                    // Common keys: type, tipo, card_type.
                    // CardService returns check db structure: it selects id, name, pitch, costo, tipo, imagen, set_code, clase.
                    const type = (match.tipo || match.card_type || '').toLowerCase();
                    const isEquipment =
                        type.includes('equipment') || type.includes('equipamiento') ||
                        type.includes('weapon') || type.includes('arma') ||
                        type.includes('chest') || type.includes('head') ||
                        type.includes('arms') || type.includes('legs') ||
                        type.includes('off-hand');

                    const cardEntry = {
                        id: match.id,
                        count: parsedCard.count
                    };

                    // For main deck we usually wrap { card: {id...}, count } in frontend state,
                    // but for backend update/create, we usually send [{ id, count }, ...] ?
                    // Let's check DeckService.createDeck payload.
                    // Usually we send IDs and counts?
                    // Controller 'createDeck' takes `mainDeck`, `equipment` directly.
                    // Controller expects: `main_deck: mainDeck`.
                    // And Supabase usually stores JSONB array of objects or similar?
                    // Actually, if we look at `DeckBuilder.jsx` `handleSaveDeck`:
                    // It sends `deckData` which has `mainDeck: [{ card: {...}, count: 1 }]`.
                    // The backend `deckController.js` just does `insert([{ ... main_deck: mainDeck ... }])`.
                    // So it blindly saves whatever JSON structure we send!
                    // CRITICAL: We need to match the structure used by the frontend `DeckBuilder`.
                    // `DeckBuilder` uses `mainDeck = [{ card: fullCardObj, count: N }]`.
                    // If we just send `{ id, count }`, the DeckBuilder might fail to render the card details (name, image) later without re-fetching!
                    // We must fetch full card details to save properly OR backend needs to hydrate.
                    // Current App seems to be "Store what you want to see".
                    // `CardService.getCardsByNames` returns `id, name, pitch, costo, tipo, imagen, set_code, clase`.
                    // This is sufficient for the "Card Object" inside the deck.

                    const fullCardItem = {
                        card: match, // Contains image, name, etc.
                        count: parsedCard.count
                    };

                    if (isEquipment) {
                        // Equipment usually stored as plain array of cards (no count wrapper)?
                        // Let's check check DeckBuilder.jsx `deckData.equipment` structure.
                        // `addCardToDeck` for equipment: `equipment: [...prev.equipment, card]`.
                        // So equipment is ARRAY OF CARDS, not { card, count }.
                        // And duplicates are just multiple entries?
                        // Assuming standard equipment is 1x usually.
                        // If count > 1, push multiple times?
                        for (let i = 0; i < parsedCard.count; i++) {
                            equipmentResult.push(match);
                        }
                    } else {
                        mainDeckResult.push(fullCardItem);
                    }
                } else {
                    missingCards.push(parsedCard.name);
                }
            });

            if (equipmentResult.length === 0 && mainDeckResult.length === 0) {
                throw new Error("Could not match any cards in the database.");
            }

            // 3. Identify Hero
            // If parser found hero, verify it. If not, maybe ask user?
            // For now, let's assume we need a valid Hero to create a deck.
            let heroId = null;
            let heroObj = null;

            if (parsedInfo.heroName) {
                const { data: heroes } = await CardService.getCards({ search: parsedInfo.heroName, type: 'Hero' });
                if (heroes && heroes.length > 0) {
                    // Pick "Young" if Blitz? Or "Adult" if CC?
                    // Simple heuristic: First match?
                    heroObj = heroes[0];
                    heroId = heroObj.id;
                }
            }

            if (!heroObj) {
                throw new Error(parsedInfo.heroName ? `Hero '${parsedInfo.heroName}' not found.` : "No hero specified in decklist. Please add 'Hero: Name'");
            }

            // 4. Create Deck
            // Backend expects 'hero' object, not just ID
            const username = user?.user_metadata?.username || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown';
            const newDeck = await DeckService.createDeck({
                name: parsedInfo.deckName || `Imported Deck (${parsedInfo.heroName || 'Unknown'})`,
                hero: heroObj,
                username, // Correctly attribute to importer
                format: parsedInfo.format || 'cc',
                equipment: equipmentResult,
                mainDeck: mainDeckResult
            });

            // We don't need updateDeck anymore if we send everything in create!

            onSuccess(newDeck);
            onClose();

        } catch (err) {
            console.error(err);
            setError(err.message || "Import failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content import-modal">
                <div className="modal-header">
                    <h3>Import Deck (Fabrary/GEM)</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                <div className="modal-body">
                    {!parsedInfo ? (
                        <>
                            <textarea
                                className="import-textarea"
                                placeholder={`Example Format (Fabrary/GEM):

Name: My Winning Deck
Hero: Katsu, the Wanderer
Format: Classic Constructed

Equipment
1x Mask of Momentum
1x Snapdragon Scalers

Main Deck
3x Surging Strike (Red)
3x Whelming Gustwave (Blue)
...`}
                                value={text}
                                onChange={e => setText(e.target.value)}
                            />
                            <div className="modal-actions">
                                <button className="btn-primary" onClick={handleParse}>Parse</button>
                            </div>
                        </>
                    ) : (
                        <div className="parsed-preview">
                            <div className="preview-header">
                                {parsedInfo.deckName && <div><strong>Name:</strong> {parsedInfo.deckName}</div>}
                                {parsedInfo.format && <div><strong>Format:</strong> {parsedInfo.format === 'cc' ? 'Classic Constructed' : 'Silver Age'}</div>}
                                <div><strong>Hero:</strong> {parsedInfo.heroName || <span className="text-warning">Missing</span>}</div>
                            </div>
                            <ul className="preview-list">
                                {parsedInfo.cards.map((c, i) => (
                                    <li key={i}>{c.count}x {c.name} {c.pitch ? `(Pitch ${c.pitch})` : ''}</li>
                                ))}
                            </ul>
                            {error && <div className="error-msg"><AlertCircle size={16} /> {error}</div>}
                            <div className="modal-actions">
                                <button className="btn-secondary" onClick={() => setParsedInfo(null)}>Back</button>
                                <button className="btn-primary" onClick={handleImport} disabled={loading}>
                                    {loading ? 'Importing...' : 'Confirm Import'}
                                </button>
                            </div>
                        </div>
                    )}
                    {error && !parsedInfo && <div className="error-msg">{error}</div>}
                </div>
            </div>
        </div>
    );
};

export default DeckImportModal;
