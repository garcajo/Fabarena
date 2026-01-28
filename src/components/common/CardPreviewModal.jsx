import React, { useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const CardPreviewModal = ({ card, onClose, onAdd, children }) => {
    const { t } = useLanguage();

    // Lock body scroll when modal is open
    useEffect(() => {
        // Store original styles
        const originalBodyOverflow = document.body.style.overflow;
        const originalBodyPosition = document.body.style.position;
        const originalHtmlOverflow = document.documentElement.style.overflow;

        // Lock scroll on both body and html
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.documentElement.style.overflow = 'hidden';

        return () => {
            // Restore original styles
            document.body.style.overflow = originalBodyOverflow;
            document.body.style.position = originalBodyPosition;
            document.body.style.width = '';
            document.body.style.height = '';
            document.documentElement.style.overflow = originalHtmlOverflow;
        };
    }, []);

    if (!card) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.92)',
            zIndex: 10000, // Higher than navbar's 1000
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            backdropFilter: 'blur(10px)',
            overflowY: 'auto',
            touchAction: 'none' // Prevent touch scrolling on the overlay
        }}>
            <div className="preview-content" onClick={e => e.stopPropagation()} style={{
                position: 'relative',
                maxWidth: '90%',
                maxHeight: '85vh', // Reduced from 90vh to ensure it doesn't touch top/bottom
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem',
                touchAction: 'auto' // Allow touch on content
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '-12px',
                        right: '-12px',
                        background: 'var(--color-primary-red)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '50%',
                        color: 'white',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                        transition: 'transform 0.2s ease'
                    }}
                    onTouchStart={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                    onTouchEnd={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <X size={22} />
                </button>

                <img
                    src={card.imagen}
                    alt={card.name}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '60vh', // Reduced from 70vh to leave more room for buttons
                        borderRadius: '16px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                    }}
                />

                <div className="preview-actions" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
                    {onAdd && (
                        <button
                            onClick={() => {
                                onAdd(card);
                                onClose();
                            }}
                            className="primary-action-btn"
                            style={{
                                padding: '0.75rem 2rem',
                                fontSize: '1.1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                width: '100%',
                                justifyContent: 'center',
                                maxWidth: '300px'
                            }}
                        >
                            <Plus size={24} />
                            {t('deckBuilder.addCard') || 'Add Card'}
                        </button>
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
};

export default CardPreviewModal;
