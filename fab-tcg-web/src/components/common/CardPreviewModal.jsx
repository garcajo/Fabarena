import React from 'react';
import { X, Plus } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const CardPreviewModal = ({ card, onClose, onAdd, children }) => {
    const { t } = useLanguage();

    if (!card) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backdropFilter: 'blur(5px)'
        }}>
            <div className="preview-content" onClick={e => e.stopPropagation()} style={{
                position: 'relative',
                maxWidth: '90%',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '-10px',
                        background: 'var(--color-primary-red)',
                        border: 'none',
                        borderRadius: '50%',
                        color: 'white',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 10
                    }}
                >
                    <X size={20} />
                </button>

                <img
                    src={card.imagen}
                    alt={card.name}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '70vh',
                        borderRadius: '16px', // Rounded corners like FAB cards
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
