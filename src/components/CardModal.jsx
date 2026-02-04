import React, { useEffect } from 'react';
import { X, Shield, Zap, Swords, ExternalLink, ShoppingCart, Heart, ZoomIn } from 'lucide-react';
import { StorageService } from '../services/storage';
import { CollectionService, CardService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useState } from 'react';
import { getHeroSignature } from '../utils/heroSignatures';
import AddToWantsModal from './AddToWantsModal';
import MarkdownContent from './common/MarkdownContent';
import '../styles/CardModal.css';

/**
 * Modal to display detailed card information
 * @param {Object} props
 * @param {Object} props.card - The card object to display
 * @param {Function} props.onClose - Function to close the modal
 * @param {React.ReactNode} [props.children] - Optional custom actions to render
 */
const CardModal = ({ card: initialCard, onClose, onCollectionUpdate, children }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { addToast } = useToast();
    const [card, setCard] = useState(initialCard); // Local state for the displayed card version
    const [versions, setVersions] = useState([]);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [signatureWeapon, setSignatureWeapon] = useState(null);
    const [showAddToWants, setShowAddToWants] = useState(false);
    const [showEnlarged, setShowEnlarged] = useState(false);

    // Initial load: Ideally we would fetch the qty from an API
    // For now we start at 0 and just allow incrementing

    // Block background scroll when modal is open
    useEffect(() => {
        const scrollY = window.scrollY;
        document.body.style.top = `-${scrollY}px`;
        document.body.classList.add('no-scroll');

        return () => {
            document.body.classList.remove('no-scroll');
            document.body.style.top = '';
            window.scrollTo(0, scrollY);
        };
    }, []);

    // Update local state if prop changes
    useEffect(() => {
        setCard(initialCard);
    }, [initialCard]);

    // Fetch other versions (printings) of this card
    useEffect(() => {
        const fetchVersions = async () => {
            if (!card || !card.name) return;
            setLoadingVersions(true);
            try {
                // Fetch all cards with exact same name
                // Ideally backend provides a simpler way, but searching by name works
                const results = await CardService.getCardsByName(card.name);

                // Filter to ensure exact name match and exclude current one if needed, 
                // but usually we want all to map them to buttons.
                // We group by set_code to show unique set options.
                const validVersions = results.filter(c => c.name === card.name && c.set_code);

                // Sort by set code or date if possible
                validVersions.sort((a, b) => a.set_code.localeCompare(b.set_code));

                setVersions(validVersions);
            } catch (error) {
                console.error("Failed to fetch card versions", error);
            } finally {
                setLoadingVersions(false);
            }
        };

        fetchVersions();
    }, [card.name]);

    // Fetch Signature Weapon if Hero
    useEffect(() => {
        const fetchSignature = async () => {
            setSignatureWeapon(null);
            if (!card || !card.tipo || !card.tipo.includes('Hero')) return;

            const weaponNames = getHeroSignature(card.name);
            if (!weaponNames || weaponNames.length === 0) return;

            try {
                // Fetch the first signature weapon
                const response = await CardService.getCardsByNames([weaponNames[0]]);
                if (response.data && response.data.length > 0) {
                    setSignatureWeapon(response.data[0]);
                }
            } catch (err) {
                console.error("Failed to fetch signature weapon", err);
            }
        };

        fetchSignature();
    }, [card.name, card.tipo]);


    // Add to history on mount
    const [isInCollection, setIsInCollection] = useState(false);

    const checkCollectionStatus = async () => {
        if (!user || !card.id) return;
        try {
            const { data } = await CollectionService.getCollection({ cardId: card.id });
            // If data is an array, check length or if it contains our card
            const found = data && data.length > 0;
            setIsInCollection(found);
        } catch (error) {
            console.error("Error checking collection status:", error);
        }
    };

    useEffect(() => {
        if (card) {
            StorageService.addToHistory(card);
            checkCollectionStatus();
        }
    }, [card, user]);

    // Handle ESC key to close
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Prevent scroll on body when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!card) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleVersionChange = (versionCard) => {
        setCard(versionCard);
    };

    const getPitchColor = (pitch) => {
        switch (parseInt(pitch)) {
            case 1: return 'pitch-1'; // Red
            case 2: return 'pitch-2'; // Yellow
            case 3: return 'pitch-3'; // Blue
            default: return '';
        }
    };

    const getTranslatedRarity = (rarityString) => {
        if (!rarityString) return t('rarities.common');

        const lower = rarityString.toLowerCase().trim();

        if (lower.includes('common') || lower.includes('comun') || lower.includes('común')) return t('rarities.common');
        if (lower.includes('super rare') || lower.includes('súper rara') || lower.includes('super rara')) return t('rarities.super_rare');
        if (lower.includes('rare') || lower.includes('rara')) return t('rarities.rare'); // Check Rare after Super Rare to avoid partial match
        if (lower.includes('majestic') || lower.includes('majestuosa')) return t('rarities.majestic');
        if (lower.includes('legendary') || lower.includes('legendaria')) return t('rarities.legendary');
        if (lower.includes('fabled') || lower.includes('fabulosa')) return t('rarities.fabled');
        if (lower.includes('marvel') || lower.includes('maravilla') || lower === 'v') return t('rarities.marvel');
        if (lower.includes('promo')) return t('rarities.promo');
        if (lower.includes('token') || lower.includes('ficha')) return t('rarities.token');

        return rarityString; // Fallback
    };

    return (
        <div className="modal-overlay" onClick={handleBackdropClick}>
            <div className="modal-content">
                <button className="modal-close" onClick={onClose} aria-label={t('common.close')}>
                    <X size={24} />
                </button>

                <div className="modal-body">
                    <div className="modal-image-section">
                        {card.imagen ? (
                            <img src={card.imagen} alt={card.name} className="modal-card-image" />
                        ) : (
                            <div className="card-placeholder large">
                                <span>{card.name}</span>
                            </div>
                        )}

                        <button
                            className="zoom-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowEnlarged(true);
                            }}
                            title={t('common.zoom') || "Zoom"}
                        >
                            <ZoomIn size={20} />
                        </button>

                        {/* Version/Set Selector */}
                        {versions.length > 1 && (
                            <div className="version-selector">
                                {versions.map((v) => (
                                    <button
                                        key={v.id || v.collection_id}
                                        onClick={() => handleVersionChange(v)}
                                        className={`version-btn ${card.id === v.id ? 'active' : ''}`}
                                        title={`${v.set_code} - ${v.rareza} - ${v.pitch ? `Pitch ${v.pitch}` : ''}`}
                                    >
                                        {v.set_code} {v.pitch ? `(P${v.pitch})` : ''}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="modal-details-section">
                        <h2 className="modal-card-title">{card.name}</h2>
                        <div className="modal-type-row">
                            <span className="modal-card-type">{card.tipo || card.clase}</span>
                            <div className="modal-header-stats">
                                {card.costo !== undefined && card.costo !== null && (
                                    <div className="header-stat">
                                        <span className="header-stat-label">{t('card.cost')}</span>
                                        <span className="header-stat-value">{card.costo}</span>
                                    </div>
                                )}
                                {card.pitch && (
                                    <div className="header-stat">
                                        <span className="header-stat-label">{t('card.pitch')}</span>
                                        <span className={`header-stat-value ${getPitchColor(card.pitch)}`}>
                                            {card.pitch}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-stats">


                            {card.poder && (
                                <div className="stat-item">
                                    <span className="stat-label">{t('card.power')}</span>
                                    <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Swords size={20} className="text-yellow-500" />
                                        {card.poder}
                                    </div>
                                </div>
                            )}

                            {card.defensa && (
                                <div className="stat-item">
                                    <span className="stat-label">{t('card.defense')}</span>
                                    <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Shield size={20} className="text-gray-400" />
                                        {card.defensa}
                                    </div>
                                </div>
                            )}
                        </div>

                        {(card.texto || card.efecto) && (
                            <div className="modal-text">
                                <MarkdownContent text={card.texto || card.efecto} />
                            </div>
                        )}

                        {/* Signature Weapon Section */}
                        {signatureWeapon && (
                            <div className="signature-weapon-section" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                                <h3 className="section-title" style={{ fontSize: '1rem', color: 'var(--color-primary-gold)', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.25rem' }}>
                                    {t('card.signature_weapon') || 'Signature Weapon'}
                                </h3>
                                <div className="related-card-display" style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '8px' }}>
                                    <img
                                        src={signatureWeapon.imagen}
                                        alt={signatureWeapon.name}
                                        style={{ width: '60px', borderRadius: '4px' }}
                                    />
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{signatureWeapon.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{signatureWeapon.tipo}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{signatureWeapon.poder && `Power: ${signatureWeapon.poder}`}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="modal-footer">
                            <div className="modal-set-info">
                                <strong>{t('card.set')}:</strong> {card.set_code || 'Unknown'}
                            </div>
                            <div className="modal-rarity">
                                <strong>{t('card.rarity')}:</strong> {getTranslatedRarity(card.rareza)}
                            </div>
                        </div>

                        {/* Market Data Section */}
                        {user && (
                            <div className="collection-controls">
                                <div className="controls-header">
                                    <h4>{t('collection.manage')}</h4>
                                </div>
                                <div className="controls-buttons">
                                    <button
                                        onClick={async () => {
                                            try {
                                                await CollectionService.addCard(card.id, 1, false);
                                                addToast(t('collection.add_success') || 'Added to collection', 'success');
                                                setIsInCollection(true);
                                                if (onCollectionUpdate) onCollectionUpdate();
                                            } catch (e) {
                                                console.error(e);
                                                addToast(t('common.error') || 'Error', 'error');
                                            }
                                        }}
                                        className="add-btn"
                                    >
                                        + {t('collection.add_to_collection')}
                                    </button>
                                    {isInCollection && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await CollectionService.removeCard(card.id, 1, false);
                                                    addToast(t('collection.remove_success') || 'Removed from collection', 'success');
                                                    // Re-check status to see if still in collection (if qty > 1)
                                                    checkCollectionStatus();
                                                    if (onCollectionUpdate) onCollectionUpdate();
                                                } catch (e) {
                                                    console.error(e);
                                                    addToast(t('common.error') || 'Error', 'error');
                                                }
                                            }}
                                            className="remove-btn-outline"
                                            title={t('collection.remove_success')}
                                        >
                                            - {t('common.remove')}
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowAddToWants(true)}
                                    className="add-wants-btn"
                                >
                                    <Heart size={16} />
                                    {t('wants.add_to_wants') || 'Add to Wants'}
                                </button>

                                {children && (
                                    <div className="custom-modal-actions" style={{
                                        marginTop: '1rem',
                                        paddingTop: '1rem',
                                        borderTop: '1px solid rgba(255,255,255,0.1)',
                                        width: '100%'
                                    }}>
                                        {children}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="market-section" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-primary-brown)' }}>
                            {/* Market Price Header removed as per user request */}
                            <a
                                href={`https://www.cardmarket.com/en/FleshAndBlood/Products/Search?searchString=${encodeURIComponent(card.name)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cardmarket-button"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.75rem 1rem',
                                    backgroundColor: '#004aad',
                                    color: 'white',
                                    borderRadius: '4px',
                                    textDecoration: 'none',
                                    fontWeight: '600',
                                    transition: 'background-color 0.2s',
                                    flexWrap: 'wrap', // Allow wrapping for small screens
                                    gap: '0.5rem'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#003a8c'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#004aad'}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {t('card.check_price')}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {/* Placeholder for Price if we can fetch it later */}
                                    {/* <span className="price-tag" style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px' }}>€ --.--</span> */}
                                    <ExternalLink size={16} />
                                </div>
                            </a>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                {t('card.market_disclaimer')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add to Wants Modal */}
            {showAddToWants && (
                <AddToWantsModal
                    card={card}
                    onClose={() => setShowAddToWants(false)}
                />
            )}

            {/* Enlarged Image Overlay */}
            {showEnlarged && (
                <div
                    className="enlarged-view-overlay"
                    onClick={() => setShowEnlarged(false)}
                >
                    <button
                        className="enlarged-close-btn"
                        onClick={() => setShowEnlarged(false)}
                    >
                        <X size={32} />
                    </button>
                    <img
                        src={card.imagen}
                        alt={card.name}
                        className="enlarged-image"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default CardModal;
