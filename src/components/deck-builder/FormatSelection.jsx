import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/FormatSelection.css';
import { CardService, DeckService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const FormatSelection = ({ onSelect }) => {
    const { t } = useLanguage();
    const { user } = useAuth();

    // Ensure scroll to top on mount
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const defaultFormats = {
        cc: {
            title: 'Classic Constructed',
            description: 'The ultimate test of strategy and skill. Build an 80-card deck with an adult hero.',
            features: {
                adultHero: 'Adult Hero',
                cards80: '80 Cards Max',
                gameTime: '50 mins / 1 Game'
            }
        },
        sa: {
            title: 'Silver Age',
            description: 'Fast-paced action. Common and Rare cards only. Build a 40-card deck + 12 sideboard with a young hero.',
            features: {
                youngHero: 'Young Hero',
                cards40: '40 Cards + 12 Sideboard',
                gameTime: '30 mins / 1 Game'
            }
        }
    };

    const [showImport, setShowImport] = React.useState(false);
    const [importText, setImportText] = React.useState('');
    const [importError, setImportError] = React.useState('');
    const [isImporting, setIsImporting] = React.useState(false);

    const handleImportSubmit = async () => {
        if (!importText.trim()) return;
        setImportError('');
        setIsImporting(true);

        try {
            const { parseDecklist } = await import('../../utils/deckParser');
            const parsedData = parseDecklist(importText);

            if (!parsedData.heroName) {
                setImportError('Could not detect a Hero. Please ensure using "Hero: Name" format.');
                setIsImporting(false);
                return;
            }

            const uniqueNames = [...new Set(parsedData.cards.map(c => c.name))];
            const { data: dbCards, error: lookupError } = await CardService.getCardsByNames(uniqueNames);

            if (lookupError) throw new Error(lookupError);

            const equipmentResult = [];
            const mainDeckResult = [];

            parsedData.cards.forEach(parsedCard => {
                let match = dbCards.find(db =>
                    db.name.toLowerCase() === parsedCard.name.toLowerCase() &&
                    (parsedCard.pitch ? db.pitch === parsedCard.pitch : true)
                );
                if (!match) {
                    match = dbCards.find(db => db.name.toLowerCase() === parsedCard.name.toLowerCase());
                }

                if (match) {
                    const type = (match.tipo || match.card_type || '').toLowerCase();
                    const isEquipment = type.includes('equipment') || type.includes('equipamiento') ||
                        type.includes('weapon') || type.includes('arma') ||
                        type.includes('chest') || type.includes('head') ||
                        type.includes('arms') || type.includes('legs') ||
                        type.includes('off-hand');

                    const fullCardItem = {
                        card: match,
                        count: parsedCard.count
                    };

                    if (isEquipment) {
                        for (let i = 0; i < parsedCard.count; i++) equipmentResult.push(match);
                    } else {
                        mainDeckResult.push(fullCardItem);
                    }
                }
            });

            const { data: heroes } = await CardService.getCards({ search: parsedData.heroName, type: 'Hero' });
            if (!heroes || heroes.length === 0) {
                throw new Error(`Hero '${parsedData.heroName}' not found in database.`);
            }
            const heroObj = heroes[0];

            const username = user?.user_metadata?.username || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown';
            const deckName = parsedData.deckName || `Imported ${parsedData.heroName} Deck`;

            const newDeck = await DeckService.createDeck({
                name: deckName,
                hero: heroObj,
                format: parsedData.format || 'cc',
                equipment: equipmentResult,
                mainDeck: mainDeckResult,
                username: username
            });

            window.location.href = `/decks/${newDeck.id}`;

        } catch (err) {
            console.error(err);
            setImportError('Import failed: ' + err.message);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="format-selection-container">
            <h1 className="format-title">{t('deckBuilder.chooseFormat') || 'Choose Your Arena'}</h1>
            <p className="format-subtitle">{t('deckBuilder.chooseFormatDesc') || 'Select the battle format for your next match.'}</p>

            {showImport ? (
                <div className="import-modal-overlay">
                    <div className="import-modal" style={{ background: '#1a1a1a', padding: '2rem', borderRadius: '12px', border: '1px solid #333', maxWidth: '600px', width: '100%' }}>
                        <h2 style={{ color: 'white', marginBottom: '1rem' }}>Import Deck (Fabrary/GEM)</h2>

                        {importError && (
                            <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem' }}>
                                {importError}
                            </div>
                        )}

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', color: '#888', marginBottom: '0.5rem' }}>Deck List (Gem or Text)</label>
                            <textarea
                                value={importText}
                                onChange={e => setImportText(e.target.value)}
                                placeholder={`Paste your deck list here...\nExample:\nName: My Deck\nHero: Katsu\nFormat: Classic Constructed\n\nEquipments:\n...`}
                                style={{
                                    width: '100%',
                                    height: '300px',
                                    padding: '0.5rem',
                                    background: '#333',
                                    border: '1px solid #444',
                                    color: 'white',
                                    fontFamily: 'monospace',
                                    borderRadius: '4px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowImport(false)}
                                style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#888', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleImportSubmit}
                                disabled={isImporting}
                                style={{ padding: '0.5rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: isImporting ? 0.7 : 1 }}
                            >
                                {isImporting ? 'Importing...' : 'Import Deck'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="formats-grid">
                        <div className="format-card" onClick={() => onSelect('cc')}>
                            <div className="format-icon">👑</div>
                            <h2>{t('deckBuilder.formats.cc.title') || defaultFormats.cc.title}</h2>
                            <p>{t('deckBuilder.formats.cc.description') || defaultFormats.cc.description}</p>
                            <ul className="format-features">
                                <li>{t('deckBuilder.formats.cc.features.adultHero') || defaultFormats.cc.features.adultHero}</li>
                                <li>{t('deckBuilder.formats.cc.features.cards80') || defaultFormats.cc.features.cards80}</li>
                                <li>{t('deckBuilder.formats.cc.features.gameTime') || defaultFormats.cc.features.gameTime}</li>
                            </ul>
                        </div>

                        <div className="format-card" onClick={() => onSelect('silver')}>
                            <div className="format-icon">⚡</div>
                            <h2>{t('deckBuilder.formats.sa.title') || defaultFormats.sa.title}</h2>
                            <p>{t('deckBuilder.formats.sa.description') || defaultFormats.sa.description}</p>
                            <ul className="format-features">
                                <li>{t('deckBuilder.formats.sa.features.youngHero') || defaultFormats.sa.features.youngHero}</li>
                                <li>{t('deckBuilder.formats.sa.features.cards40') || defaultFormats.sa.features.cards40}</li>
                                <li>{t('deckBuilder.formats.sa.features.gameTime') || defaultFormats.sa.features.gameTime}</li>
                            </ul>
                        </div>
                    </div>

                    <div className="import-divider" style={{ textAlign: 'center', marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ color: '#888', marginBottom: '1rem' }}>OR</span>
                        <button
                            className="import-deck-btn"
                            onClick={() => setShowImport(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                marginTop: '0',
                                color: 'white'
                            }}
                        >
                            <span>📥</span>
                            {t('deckBuilder.importDeck') || 'Import Your Own!'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default FormatSelection;
