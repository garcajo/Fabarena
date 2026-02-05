import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { CardService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import '../../styles/CardModal.css'; // Reuse modal styles

const CardVersionPicker = ({ cardName, currentId, onSelect, onClose }) => {
    const { t } = useLanguage();
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVersions = async () => {
            setLoading(true);
            try {
                // Fetch all versions with exact name (exclude white border)
                const results = await CardService.getCardsByName(cardName, false);

                // Filter to ensure exact name match and sort by set code
                // Only show cards that have a set code (valid printings)
                const validVersions = results
                    .filter(c => c.name === cardName && c.set_code)
                    .sort((a, b) => a.set_code.localeCompare(b.set_code));

                setVersions(validVersions);
            } catch (error) {
                console.error("Failed to fetch card versions", error);
            } finally {
                setLoading(false);
            }
        };

        if (cardName) {
            fetchVersions();
        }
    }, [cardName]);

    // Close on backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleBackdropClick} style={{ zIndex: 3000 }}>
            <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh' }}>
                <button className="modal-close" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="modal-body" style={{ flexDirection: 'column', padding: '0' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                        <h3 style={{ margin: 0, fontSize: '1.5rem' }}>
                            {t('deckBuilder.changeVersion') || 'Change Version'}
                        </h3>
                        <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)' }}>
                            {cardName}
                        </p>
                    </div>

                    <div style={{
                        padding: '1.5rem',
                        overflowY: 'auto',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {loading ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
                                {t('common.loading') || 'Loading...'}
                            </div>
                        ) : (
                            versions.map(version => (
                                <div
                                    key={version.id}
                                    className={`version-card-item ${version.id === currentId ? 'active' : ''}`}
                                    onClick={() => onSelect(version)}
                                    style={{
                                        cursor: 'pointer',
                                        border: version.id === currentId ? '2px solid var(--color-primary-gold)' : '2px solid transparent',
                                        borderRadius: '8px',
                                        padding: '4px',
                                        background: version.id === currentId ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <img
                                        src={version.imagen}
                                        alt={`${version.set_code} - ${version.rareza}`}
                                        style={{ width: '100%', borderRadius: '6px' }}
                                    />
                                    <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
                                        <div style={{ fontWeight: 'bold' }}>{version.set_code}</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                            {version.rareza}
                                            {version.pitch && ` • Pitch ${version.pitch}`}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardVersionPicker;
