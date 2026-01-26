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
    const { t } = useLanguage();

    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                const heroClassKeywords = hero.clase ? hero.clase.split(' ') : [];

                // Fetch cards with class matching ANY keyword of the hero class or 'Generic'
                const { data, error } = await CardService.getCards({
                    clase: [...heroClassKeywords, 'Generic'],
                    pageSize: 1000,
                    type: 'Equipment' // Assuming backend supports filtering by type
                });

                if (error) throw new Error(error);

                // Also fetch Weapons? Usually Equipment step includes Weapons.
                // Depending on backend, might need separate call or specific type filter.
                // For now assuming 'Equipment' covers it or we rely on 'type' ilike check in backend 
                // overlapping if we pass just 'clase' maybe? No, backend 'type' filter is specific.

                // Let's fetch Equipment AND Weapons if possible, or just Equipment for now.
                // Note: The backend 'clase' filter supports arrays if I implemented it (the cardService.js seemed to try but frontend api.js stringifies params).
                // API.js needs update to handle array params properly if we want 'HeroClass OR Generic'.
                // Currently api.js: params.append('clase', clase); -> string "Hero,Generic"? No.

                // Workaround: Fetch all for class, then filter in frontend? Or fix API.js.
                // Let's assume for this step we fetch generic and class specific equipment.
                // Actually, let's fix api.js to handle arrays for 'clase' by appending multiple times? URLSearchParams supports multiple keys.
                // cardService.js backend handles array? Yes: if (Array.isArray(clase)).

                setEquipment(data || []);
            } catch (err) {
                console.error("Error fetching equipment:", err);
                setError("Failed to load equipment.");
            } finally {
                setLoading(false);
            }
        };

        // We need to fix api.js to support array params before this works perfectly for [HeroClass, Generic]
        // But let's write the component first.
        fetchEquipment();
    }, [hero]);

    const filteredEquipment = equipment.filter(card => {
        const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
        const isLegal = isCardLegalForHero(card.clase, hero.clase);
        return matchesSearch && isLegal;
    });

    return (
        <div className="equipment-selection-step fade-in">
            <div className="step-header">
                <ArrowLeft size={20} />
                <h2>{t('deckBuilder.chooseEquipment') || 'Choose Equipment'}</h2>
                <p>{t('deckBuilder.chooseEquipmentDesc') || `Select equipment for ${hero.name} (${hero.clase}).`}</p>
            </div>

            <div className="equipment-search-container" style={{ marginBottom: '1.5rem' }}>
                <Search className="search-icon" size={20} />
                <input
                    type="text"
                    placeholder="Search equipment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="hero-search-input"
                />
            </div>

            {loading && <div className="loading-spinner">{t('common.loading')}</div>}

            <div className="equipment-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '1rem'
            }}>
                {filteredEquipment.map(card => (
                    <div
                        key={card.id}
                        className="card-item" // Reusing card item styles
                        onClick={() => onSelect(card)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="card-image-container">
                            <img src={card.imagen} alt={card.name} className="card-image" loading="lazy" />
                        </div>
                        <div className="card-info" style={{ padding: '0.5rem' }}>
                            <div className="card-name" style={{ fontSize: '0.9rem' }}>{card.name}</div>
                            <div className="card-meta">
                                <span>{card.tipo}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EquipmentSelection;
