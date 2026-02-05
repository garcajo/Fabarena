import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ChevronRight, Crown, Zap, Shield } from 'lucide-react';
import '../../styles/FormatSelection.css'; // We'll share some styles but add specific ones

const DeckSetup = ({ onNext, initialData = {} }) => {
    const { t } = useLanguage();
    const [name, setName] = useState(initialData.name || '');
    const [format, setFormat] = useState(initialData.format || 'cc');
    const [isAnimating, setIsAnimating] = useState(false);

    const handleProceed = () => {
        if (!name.trim()) return;
        setIsAnimating(true);
        // Small delay for animation feel
        setTimeout(() => {
            onNext({ name, format });
        }, 400);
    };

    return (
        <div className={`deck-setup-container ${isAnimating ? 'slide-out' : 'fade-in'}`}>
            <div className="setup-card">
                <h1 className="setup-title">{t('deckBuilder.setup.title') || 'Begin Your Journey'}</h1>
                <p className="setup-subtitle">{t('deckBuilder.setup.subtitle') || 'Give your deck a name and choose your battle format.'}</p>

                <div className="name-input-section">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('deckBuilder.deckNamePlaceholder') || "Epic Deck Name..."}
                        className="setup-name-input"
                        autoFocus
                    />
                </div>

                <div className="format-options-grid">
                    <div
                        className={`setup-format-card ${format === 'cc' ? 'active' : ''}`}
                        onClick={() => setFormat('cc')}
                    >
                        <div className="format-icon-wrapper">
                            <Crown size={24} />
                        </div>
                        <h3>Classic Constructed</h3>
                        <p>{t('deckBuilder.formats.cc.description') || '80-card decks with Adult Heroes.'}</p>
                    </div>

                    <div
                        className={`setup-format-card ${format === 'silver' ? 'active' : ''}`}
                        onClick={() => setFormat('silver')}
                    >
                        <div className="format-icon-wrapper">
                            <Zap size={24} />
                        </div>
                        <h3>Silver Age</h3>
                        <p>{t('deckBuilder.formats.sa.description') || 'Common and Rare cards with Young Heroes.'}</p>
                    </div>
                </div>

                <button
                    className={`setup-next-btn ${!name.trim() ? 'disabled' : ''}`}
                    onClick={handleProceed}
                    disabled={!name.trim()}
                >
                    <span>{t('deckBuilder.setup.chooseHero') || 'Choose Hero'}</span>
                    <ChevronRight size={20} />
                </button>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .deck-setup-container {
                    max-width: 800px;
                    margin: 4rem auto;
                    padding: 0 1rem;
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

                @keyframes setupFadeIn {
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
