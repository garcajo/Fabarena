import React, { useState, useEffect } from 'react';
import { CardService } from '../../services/api';
import { Search, Shield, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { isCardLegalForHero } from '../../utils/deckValidation';
import '../../styles/CardGrid.css';

const EquipmentSelection = ({ hero, onSelect, onBack }) => {
    const [equipment, setEquipment] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debugInfo, setDebugInfo] = useState({ fetched: 0, filtered: 0, first: '', last: '' });
    const { t } = useLanguage();

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                // Split hero class by space AND slash to handle multi-class heroes like "Ninja/Ranger"
                const heroClassKeywords = hero.clase
                    ? hero.clase.split(/[\s\/]+/).filter(Boolean)
                    : [];

                // Broaden types to include Spanish translations just in case
                const equipmentTypes = [
                    'Equipment', 'Weapon', 'Head', 'Chest', 'Arms', 'Legs', 'Off-Hand',
                    'Equipamiento', 'Arma', 'Cabeza', 'Pecho', 'Brazos', 'Piernas', 'Mano-Secundaria'
                ];

                const { data, error } = await CardService.getCards({
                    clase: [...heroClassKeywords, 'Generic'],
                    pageSize: 5000,
                    type: equipmentTypes,
                    includeWhiteBorder: true
                });

                if (error) throw new Error(error);

                // Deduplicate by Name (keep only one version of each card)
                const uniqueCards = [];
                const seenNames = new Set();

                (data || []).forEach(card => {
                    if (!seenNames.has(card.name)) {
                        seenNames.add(card.name);
                        uniqueCards.push(card);
                    }
                });

                setEquipment(uniqueCards);
            } catch (err) {
                console.error("Error fetching equipment:", err);
                setError("Failed to load equipment.");
            } finally {
                setLoading(false);
            }
        };

        fetchEquipment();
    }, [hero]);

    // Sorting: Class-Specific > Talent-Specific > Generic, then by Name
    const sortedEquipment = [...equipment].sort((a, b) => {
        const aClase = (a.clase || '').toLowerCase();
        const bClase = (b.clase || '').toLowerCase();
        const heroClase = (hero.clase || '').toLowerCase();

        // Check if card matches hero's primary class (e.g. Ninja) vs just talent (e.g. Mystic)
        const aMatchesPrimary = heroClase.includes(aClase) && !aClase.includes('generic');
        const bMatchesPrimary = heroClase.includes(bClase) && !bClase.includes('generic');

        if (aMatchesPrimary && !bMatchesPrimary) return -1;
        if (!aMatchesPrimary && bMatchesPrimary) return 1;

        const aIsGeneric = aClase.includes('generic');
        const bIsGeneric = bClase.includes('generic');

        if (aIsGeneric && !bIsGeneric) return 1;
        if (!aIsGeneric && bIsGeneric) return -1;

        return a.name.localeCompare(b.name);
    });

    const filteredEquipment = sortedEquipment.filter(card => {
        const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
        const isLegal = isCardLegalForHero(card.clase, hero.clase);
        return matchesSearch && isLegal;
    });

    useEffect(() => {
        if (!loading) {
            setDebugInfo({
                fetched: equipment.length,
                filtered: filteredEquipment.length,
                first: equipment.length > 0 ? equipment[0].name : 'None',
                last: equipment.length > 0 ? equipment[equipment.length - 1].name : 'None',
                heroClass: hero.clase
            });
        }
    }, [equipment, filteredEquipment, loading, hero]);

    // Grouping by Slot
    const getSlot = (tipo) => {
        const t = (tipo || '').toLowerCase();
        if (t.includes('weapon') || t.includes('arma')) return 'Weapon';
        if (t.includes('head') || t.includes('cabeza')) return 'Head';
        if (t.includes('chest') || t.includes('pecho')) return 'Chest';
        if (t.includes('arms') || t.includes('brazos')) return 'Arms';
        if (t.includes('legs') || t.includes('piernas')) return 'Legs';
        return 'Other';
    };

    const grouped = filteredEquipment.reduce((acc, card) => {
        const slot = getSlot(card.tipo);
        if (!acc[slot]) acc[slot] = [];
        acc[slot].push(card);
        return acc;
    }, {});

    const slotOrder = ['Weapon', 'Head', 'Chest', 'Arms', 'Legs', 'Other'];

    return (
        <div className="equipment-selection-step fade-in">
            <div className="step-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <button onClick={onBack} className="back-btn-minimal" style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 style={{ margin: 0 }}>{t('deckBuilder.chooseEquipment') || 'Choose Equipment'}</h2>
                </div>
                <p style={{ marginLeft: '3.5rem', opacity: 0.7 }}>{t('deckBuilder.chooseEquipmentDesc') || `Select equipment for ${hero.name}.`}</p>
            </div>

            <div className="equipment-search-container" style={{ margin: '1rem 0 2rem 0', position: 'relative' }}>
                <Search className="search-icon" size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                <input
                    type="text"
                    placeholder="Search equipment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="hero-search-input"
                    style={{ paddingLeft: '40px', width: '100%', boxSizing: 'border-box' }}
                />
            </div>

            {loading && <div className="loading-spinner">{t('common.loading')}</div>}

            <div className="equipment-slots-container" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                {slotOrder.map(slot => {
                    const cards = grouped[slot];
                    if (!cards || cards.length === 0) return null;

                    return (
                        <div key={slot} className="equipment-slot-group">
                            <h3 style={{
                                fontSize: '0.9rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                paddingBottom: '0.5rem',
                                marginBottom: '1rem',
                                color: 'var(--color-primary-red)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <Shield size={14} /> {slot}
                            </h3>
                            <div className="equipment-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                gap: '1.5rem'
                            }}>
                                {cards.map(card => (
                                    <div
                                        key={card.id}
                                        className="card-item hover-lift"
                                        onClick={() => onSelect(card)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="card-image-container" style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                                            <img src={card.imagen} alt={card.name} className="card-image" style={{ transition: 'transform 0.3s ease' }} />
                                        </div>
                                        <div className="card-info" style={{ padding: '0.75rem 0.25rem' }}>
                                            <div className="card-name" style={{ fontWeight: 600, fontSize: '0.95rem' }}>{card.name}</div>
                                            <div className="card-meta" style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '2px' }}>
                                                <span>{card.clase} • {card.tipo}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Debug Footer */}
            <div style={{ padding: '10px', background: '#333', color: '#fff', fontSize: '10px', position: 'fixed', bottom: 0, right: 0, zIndex: 9999 }}>
                Fetched: {debugInfo.fetched} | Filtered: {debugInfo.filtered} | First: {debugInfo.first} | Last: {debugInfo.last} | Hero: {debugInfo.heroClass}
            </div>
        </div>
    );
};

export default EquipmentSelection;
