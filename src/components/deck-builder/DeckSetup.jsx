import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ChevronRight, Crown, Zap, Shield, Download } from 'lucide-react';
import { CardService, DeckService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../../styles/FormatSelection.css';

const DeckSetup = ({ onNext, initialData = {} }) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [setupStep, setSetupStep] = useState('FORMAT');
    const [name, setName] = useState(initialData.name || '');
    const [format, setFormat] = useState(initialData.format || 'cc');
    const [isAnimating, setIsAnimating] = useState(false);

    // Import State
    const [showImport, setShowImport] = useState(false);
    const [importText, setImportText] = useState('');
    const [importError, setImportError] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    const handleFormatSelect = (selectedFormat) => {
        setFormat(selectedFormat);
        setSetupStep('NAME');
    };

    const handleProceed = () => {
        if (!name.trim()) return;
        setIsAnimating(true);
        setTimeout(() => {
            onNext({ name, format });
        }, 400);
    };

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
        <div className={`deck-setup-container ${isAnimating ? 'slide-out' : 'fade-in'}`}>
            {setupStep === 'FORMAT' ? (
                <div className="format-selection-container" style={{ minHeight: 'auto', padding: 0 }}>
                    <h1 className="format-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                        {t('deckBuilder.chooseFormat') || 'Choose Your Arena'}
                    </h1>
                    <p className="format-subtitle" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '3rem' }}>
                        {t('deckBuilder.chooseFormatDesc') || 'Select the battle format for your next match.'}
                    </p>

                    <div className="formats-grid">
                        <div
                            className="format-card"
                            onClick={() => handleFormatSelect('cc')}
                        >
                            <div className="format-icon-wrapper">
                                <Crown size={32} />
                            </div>
                            <h2>Classic Constructed</h2>
                            <p>{t('deckBuilder.formats.cc.description') || '80-card decks with Adult Heroes.'}</p>
                            <ul className="format-features">
                                <li>{t('deckBuilder.formats.cc.features.adultHero') || 'Adult Hero'}</li>
                                <li>{t('deckBuilder.formats.cc.features.cards80') || '80-card Deck'}</li>
                                <li>{t('deckBuilder.formats.cc.features.gameTime') || '35-50 min games'}</li>
                            </ul>
                        </div>

                        <div
                            className="format-card"
                            onClick={() => handleFormatSelect('silver')}
                        >
                            <div className="format-icon-wrapper">
                                <Zap size={32} />
                            </div>
                            <h2>Silver Age</h2>
                            <p>{t('deckBuilder.formats.sa.description') || 'Common and Rare cards with Young Heroes.'}</p>
                            <ul className="format-features">
                                <li>{t('deckBuilder.formats.sa.features.youngHero') || 'Young Hero'}</li>
                                <li>{t('deckBuilder.formats.sa.features.cards40') || '40-card Deck'}</li>
                                <li>{t('deckBuilder.formats.sa.features.gameTime') || '20-30 min games'}</li>
                            </ul>
                        </div>
                    </div>

                    <div className="import-divider" style={{ marginTop: '2.5rem' }}>
                        <span>OR</span>
                    </div>

                    <div className="setup-actions" style={{ marginTop: '0' }}>
                        <button
                            className="setup-import-btn"
                            onClick={() => setShowImport(true)}
                            style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                        >
                            <Download size={18} />
                            <span>{t('deckBuilder.importDeck') || 'Import Deck'}</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="setup-card">
                    <h1 className="setup-title">{t('deckBuilder.setup.title') || 'Name Your Deck'}</h1>
                    <p className="setup-subtitle">
                        {format === 'cc' ? 'Classic Constructed' : 'Silver Age'} •
                        <button onClick={() => setSetupStep('FORMAT')} className="change-format-link" style={{ background: 'none', border: 'none', color: 'var(--color-primary-red, #ef4444)', cursor: 'pointer', marginLeft: '0.5rem', fontSize: '0.9rem', textDecoration: 'underline' }}>
                            {t('common.change') || 'Change Format'}
                        </button>
                    </p>

                    <div className="name-input-section">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('deckBuilder.deckNamePlaceholder') || "Choose your deck name..."}
                            className="setup-name-input"
                            autoFocus
                        />
                    </div>

                    <div className="setup-actions">
                        <button
                            className={`setup-next-btn ${!name.trim() ? 'disabled' : ''}`}
                            onClick={handleProceed}
                            disabled={!name.trim()}
                        >
                            <span>{t('deckBuilder.setup.chooseHero') || 'Choose Hero'}</span>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}

            {showImport && (
                <div className="import-modal-overlay" onClick={() => setShowImport(false)}>
                    <div className="import-modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{t('deckBuilder.importDeck') || 'Import Deck'} (Fabrary/GEM)</h2>

                        {importError && (
                            <div className="import-error-tag">
                                {importError}
                            </div>
                        )}

                        <textarea
                            value={importText}
                            onChange={e => setImportText(e.target.value)}
                            placeholder={`Paste your deck list here...\nExample:\nHero: Katsu\n...`}
                        />

                        <div className="modal-actions">
                            <button onClick={() => setShowImport(false)} className="cancel-btn">
                                {t('common.cancel') || 'Cancel'}
                            </button>
                            <button
                                onClick={handleImportSubmit}
                                className="confirm-btn"
                                disabled={isImporting}
                            >
                                {isImporting ? '...' : (t('deckBuilder.importDeck') || 'Import')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .deck-setup-container {
                    max-width: 1000px;
                    margin: 4rem auto;
                    padding: 0 1rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .change-format-link {
                    background: none;
                    border: none;
                    color: var(--color-primary-red, #ef4444);
                    cursor: pointer;
                    margin-left: 0.5rem;
                    font-size: 0.9rem;
                    text-decoration: underline;
                    transition: opacity 0.2s;
                }
                .change-format-link:hover {
                    opacity: 0.8;
                }
                .setup-card {
                    background: rgba(26, 26, 26, 0.8);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 3rem;
                    border-radius: 20px;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    text-align: center;
                }
                .setup-title {
                    font-family: 'Cinzel', serif;
                    font-size: 2.5rem;
                    color: white;
                    margin-bottom: 0.5rem;
                    background: linear-gradient(to bottom, #fff, #888);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .setup-subtitle {
                    color: rgba(255,255,255,0.5);
                    margin-bottom: 3rem;
                }
                .name-input-section {
                    margin-bottom: 2.5rem;
                }
                .setup-name-input {
                    width: 100%;
                    background: transparent;
                    border: none;
                    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
                    padding: 1rem 0;
                    font-size: 1.8rem;
                    color: white;
                    text-align: center;
                    transition: all 0.3s;
                    font-family: 'Inter', sans-serif;
                }
                .setup-name-input:focus {
                    outline: none;
                    border-bottom-color: var(--color-primary-red, #ef4444);
                    background: rgba(255, 255, 255, 0.02);
                }
                .format-options-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 3rem;
                }
                .setup-format-card {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    padding: 1.5rem;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .setup-format-card:hover {
                    background: rgba(255, 255, 255, 0.07);
                    transform: translateY(-5px);
                }
                .setup-format-card.active {
                    background: rgba(239, 68, 68, 0.1);
                    border-color: var(--color-primary-red, #ef4444);
                    box-shadow: 0 0 20px rgba(239, 68, 68, 0.15);
                }
                .format-icon-wrapper {
                    margin-bottom: 1rem;
                    color: var(--color-primary-red, #ef4444);
                }
                .setup-format-card h3 {
                    margin-bottom: 0.5rem;
                    font-size: 1.1rem;
                }
                .setup-format-card p {
                    font-size: 0.85rem;
                    color: rgba(255,255,255,0.5);
                    line-height: 1.4;
                }
                .setup-next-btn {
                    background: var(--color-primary-red, #ef4444);
                    color: white;
                    border: none;
                    padding: 1rem 2.5rem;
                    border-radius: 50px;
                    font-size: 1.1rem;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .setup-next-btn:hover:not(.disabled) {
                    transform: scale(1.05);
                    box-shadow: 0 0 30px rgba(239, 68, 68, 0.4);
                }
                .setup-next-btn.disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .setup-actions {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.5rem;
                }
                .setup-import-btn {
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: rgba(255, 255, 255, 0.6);
                    padding: 0.75rem 1.5rem;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .setup-import-btn:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.3);
                    color: white;
                }

                /* Import Modal Styles */
                .import-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.9);
                    backdrop-filter: blur(8px);
                    z-index: 2000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                }
                .import-modal-content {
                    background: #1a1a1a;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    width: 100%;
                    max-width: 600px;
                    border-radius: 16px;
                    padding: 2rem;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                }
                .import-modal-content h2 {
                    font-family: 'Cinzel', serif;
                    color: white;
                    margin-bottom: 1.5rem;
                }
                .import-error-tag {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #f87171;
                    padding: 0.75rem;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                    font-size: 0.9rem;
                }
                .import-modal-content textarea {
                    width: 100%;
                    height: 300px;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 1rem;
                    color: #fff;
                    font-family: 'Inter', monospace;
                    font-size: 0.9rem;
                    margin-bottom: 1.5rem;
                    resize: none;
                }
                .import-modal-content textarea:focus {
                    outline: none;
                    border-color: var(--color-primary-red);
                }
                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }
                .cancel-btn {
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: #888;
                    padding: 0.6rem 1.2rem;
                    border-radius: 6px;
                    cursor: pointer;
                }
                .confirm-btn {
                    background: var(--color-primary-red);
                    color: white;
                    border: none;
                    padding: 0.6rem 1.5rem;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .confirm-btn:disabled {
                    opacity: 0.5;
                }

                @keyframes setupFadeIn {
...
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fade-in {
                    animation: setupFadeIn 0.6s ease-out forwards;
                }
                .slide-out {
                    animation: setupFadeIn 0.4s ease-in reverse forwards;
                }

                @media (max-width: 640px) {
                    .format-options-grid {
                        grid-template-columns: 1fr;
                    }
                    .setup-card {
                        padding: 1.5rem;
                    }
                    .setup-title {
                        font-size: 1.8rem;
                    }
                }
            `}} />
        </div>
    );
};

export default DeckSetup;
