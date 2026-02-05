import React, { useState, useEffect } from 'react';
import { X, Search, Sword, Crown, Shirt, Hand, Footprints, Shield } from 'lucide-react';
import { CardService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { isCardBanned } from '../../data/bannedCards';
import { isCardLegalForHero } from '../../utils/deckValidation';
import '../../styles/CardSearchModal.css';


const KNOWN_TALENTS = ['Elemental', 'Ice', 'Earth', 'Lightning', 'Draconic', 'Light', 'Shadow', 'Mystic'];

const CardSearchModal = ({ type, heroClass, format, onSelect, onClose }) => {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('weapon'); // 'weapon', 'head', 'chest', 'arms', 'legs', 'off-hand'

    // Feature: Class / Talent / Generic Filters (Only for Equipment)
    const [parsedHero, setParsedHero] = useState({ class: '', talents: [], isGeneric: false });
    const [activeFilters, setActiveFilters] = useState({
        class: true,
        talent: true,
        generic: true
    });

    // Debug: Log what type we're searching for
    console.log('CardSearchModal - Type:', type, 'Hero Class:', heroClass);

    // Parse Hero Class on mount/change
    useEffect(() => {
        if (!heroClass || type !== 'equipment') return;

        const parts = heroClass.split(/[\s\/]+/).filter(Boolean);
        const talents = parts.filter(p => KNOWN_TALENTS.includes(p));
        // Class is whatever is NOT a talent (and typically implies exclusion of 'Hero' if it exists, though usually clean)
        const classes = parts.filter(p => !KNOWN_TALENTS.includes(p) && p !== 'Hero');
        // Taking the last one usually works for "Shadow Runeblade" -> Runeblade. "Draconic Ninja" -> Ninja.
        const primaryClass = classes.length > 0 ? classes[classes.length - 1] : '';

        setParsedHero({
            class: primaryClass,
            talents: talents,
            isGeneric: false
        });
    }, [heroClass, type]);

    const toggleFilter = (filterType) => {
        setActiveFilters(prev => ({
            ...prev,
            [filterType]: !prev[filterType]
        }));
    };

    // Filter results based on active tab (local filtering)
    const getFilteredResults = () => {
        if (type !== 'equipment') return results;

        return results.filter(card => {
            const tipo = (card.tipo || '').toLowerCase();
            const cardClassLower = (card.clase || '').toLowerCase();

            // 1. Slot Filter (Tabs)
            let matchesSlot = true;
            switch (activeTab) {
                case 'weapon': matchesSlot = tipo.includes('weapon') || tipo.includes('arma'); break;
                case 'head': matchesSlot = tipo.includes('head') || tipo.includes('cabeza'); break;
                case 'chest': matchesSlot = tipo.includes('chest') || tipo.includes('pecho'); break;
                case 'arms': matchesSlot = tipo.includes('arms') || tipo.includes('brazos'); break;
                case 'legs': matchesSlot = tipo.includes('legs') || tipo.includes('piernas'); break;
                case 'off-hand': matchesSlot = tipo.includes('off-hand') || tipo.includes('mano-secundaria'); break;
                default: matchesSlot = true;
            }
            if (!matchesSlot) return false;

            // 2. Class/Talent/Generic Filter
            // Logic: If filter is OFF, hide cards that MATCH that category.
            const isGeneric = cardClassLower.includes('generic');
            const matchesClass = parsedHero.class && cardClassLower.includes(parsedHero.class.toLowerCase());
            // Check matching any hero talent
            const matchesTalent = parsedHero.talents.some(t => cardClassLower.includes(t.toLowerCase()));

            if (isGeneric && !activeFilters.generic) return false;
            if (matchesClass && !activeFilters.class && !isGeneric) return false; // !isGeneric check to avoid hiding generic class cards if they overlap? usually distinct.
            if (matchesTalent && !activeFilters.talent) return false;

            // If card is neither generic, nor matches class, nor matches talent... (unlikely given query params, but possible)
            // Keep it visible if it passed slot check? Or strict? 
            // Stick to strict exclusion: If it IS X and X is OFF, hide. All else show.
            return true;
        });
    };

    const displayResults = getFilteredResults();

    // Pagination (Client-side for now, but usually we want to see all for Equipment slots)
    // If tab is specific, show all (no pagination).
    const usePagination = type === 'hero';
    const [currentPage, setCurrentPage] = useState(1);
    const cardsPerPage = 15;

    const indexOfLastCard = currentPage * cardsPerPage;
    const indexOfFirstCard = indexOfLastCard - cardsPerPage;
    const currentResults = usePagination ? displayResults.slice(indexOfFirstCard, indexOfLastCard) : displayResults;
    const totalPages = Math.ceil(displayResults.length / cardsPerPage);

    useEffect(() => {
        // Reset pagination when tab changes
        setCurrentPage(1);
    }, [activeTab]);

    useEffect(() => {
        const fetchCards = async () => {
            if (searchTerm.length === 0) {
                if (type === 'hero' || type === 'equipment') {
                    // Fetch initial list for heroes and equipment
                    setLoading(true);
                } else {
                    setResults([]);
                    return;
                }
            } else if (searchTerm.length < 2) {
                // If user started typing but less than 2 chars, wait
                setResults([]);
                return;
            } else {
                setLoading(true);
            }

            try {
                const params = {
                    search: searchTerm,
                    pageSize: 50
                };

                if (type === 'hero') {
                    // Heroes might be labeled as "Hero" or "Young Hero"
                    params.type = 'Hero';
                } else if (type === 'equipment') {
                    // Equipment can be "Weapon", "Equipment", "Head", "Chest", "Arms", "Legs"
                    // Add Spanish translations to ensure we catch everything in DB
                    params.type = [
                        'Equipment', 'Weapon', 'Head', 'Chest', 'Arms', 'Legs', 'Off-Hand',
                        'Equipamiento', 'Arma', 'Cabeza', 'Pecho', 'Brazos', 'Piernas', 'Mano-secundaria'
                    ];

                    // Server-side Class Filtering:
                    // If we have a hero class, pass it to the backend so we don't fetch 500 irrelevant cards
                    // and filter them out client-side (which might result in empty lists).
                    if (heroClass) {
                        // "Royal Draconic Ninja" -> ['royal', 'draconic', 'ninja', 'generic']
                        const traits = heroClass.toLowerCase().split(/\s+/).filter(Boolean);
                        params.clase = [...traits, 'generic'];
                    }

                    console.log('🔍 Equipment filter params:', { heroClass, type: params.type, classFilter: params.clase });
                }

                // Silver Age format restriction
                if (format === 'silver') {
                    params.rareza = ['Común', 'Rara', 'Common', 'Rare'];
                }

                // Fetch more to allow client-side filtering/deduplication
                params.pageSize = 500;

                console.log('🌐 Fetching cards with params:', params);
                const { data } = await CardService.getCards(params);
                console.log(`📥 Received ${data?.length || 0} cards from API`);
                let processingResults = data || [];

                // 1. Format-based Filtering (for Heroes)
                if (type === 'hero' && format) {
                    if (format === 'cc') {
                        processingResults = processingResults.filter(c => !c.tipo.toLowerCase().includes('young'));
                    } else if (format === 'blitz') {
                        processingResults = processingResults.filter(c => c.tipo.toLowerCase().includes('young'));
                    }
                }

                // 2. Deduplication and Sorting
                const uniqueMap = new Map();

                if (type === 'hero') {
                    processingResults.forEach(card => {
                        const key = `${card.name}|${card.imagen}|${card.set_code}`;
                        if (!uniqueMap.has(key)) uniqueMap.set(key, card);
                    });
                    processingResults = Array.from(uniqueMap.values());
                } else if (type === 'equipment') {
                    processingResults.forEach(card => {
                        const key = card.name;
                        // For equipment, we want to ensure we don't duplicate names
                        if (!uniqueMap.has(key)) uniqueMap.set(key, card);
                    });
                    processingResults = Array.from(uniqueMap.values());

                    // Equipment Filter for Hero Class (Double check client side just in case)
                    if (heroClass) {
                        processingResults = processingResults.filter(card => {
                            const cardClassVal = card.clase || 'Generic';
                            return isCardLegalForHero(cardClassVal, heroClass);
                        });

                        // Sort logic
                        processingResults.sort((a, b) => {
                            const aTipo = a.tipo || '';
                            const bTipo = b.tipo || '';
                            return a.name.localeCompare(b.name);
                        });
                    }
                }

                setResults(processingResults);
                if (currentPage !== 1) setCurrentPage(1);

            } catch (error) {
                console.error("Error fetching cards:", error);
            } finally {
                setLoading(false);
            }
        };

        const delayDebounceFn = setTimeout(fetchCards, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, type, heroClass, format]);

    const renderTabs = () => {
        if (type !== 'equipment') return null;

        const tabs = [
            { id: 'weapon', label: 'Weapon', icon: Sword },
            { id: 'head', label: 'Head', icon: Crown },
            { id: 'chest', label: 'Chest', icon: Shirt },
            { id: 'arms', label: 'Arms', icon: Hand },
            { id: 'legs', label: 'Legs', icon: Footprints },
            { id: 'off-hand', label: 'Off-Hand', icon: Shield },
        ];

        return (
            <div className="equipment-tabs">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            className={`equip-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon size={18} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{type === 'hero' ? (t('deckBuilder.selectHero') || 'Select Hero') : (t('deckBuilder.selectEquipment') || 'Select Equipment')}</h3>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-search-bar">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder={t('filters.search_placeholder') || "Search..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus={window.innerWidth > 768}
                    />
                </div>

                {/* Origin Filters (Class/Talent/Generic) */}
                {type === 'equipment' && (parsedHero.class || parsedHero.talents.length > 0) && (
                    <div className="equipment-origin-filters">
                        {parsedHero.class && (
                            <button
                                className={`filter-pill-btn ${activeFilters.class ? 'active' : ''}`}
                                onClick={() => toggleFilter('class')}
                            >
                                {parsedHero.class}
                            </button>
                        )}
                        {parsedHero.talents.length > 0 && (
                            <button
                                className={`filter-pill-btn ${activeFilters.talent ? 'active' : ''}`}
                                onClick={() => toggleFilter('talent')}
                            >
                                {parsedHero.talents.join('/')}
                            </button>
                        )}
                        <button
                            className={`filter-pill-btn ${activeFilters.generic ? 'active' : ''}`}
                            onClick={() => toggleFilter('generic')}
                        >
                            Generic
                        </button>
                    </div>
                )}

                {renderTabs()}

                <div className={`modal-results grid-view ${type === 'hero' ? 'hero-grid' : ''}`}>
                    {loading && <div className="loading-text">{t('common.loading')}</div>}
                    {!loading && displayResults.length === 0 && (
                        <div className="no-results">{t('common.no_results') || 'No results found.'}</div>
                    )}

                    {currentResults.map(card => {
                        const banned = isCardBanned(card, format);
                        let equipmentClass = 'Generic';
                        let isHeroEquipment = false;

                        if (type === 'equipment' && heroClass && card.tipo) {
                            const beforeEquipmentOrWeapon = card.tipo.split(/\s+(Equipment|Weapon)/i)[0].trim();
                            equipmentClass = beforeEquipmentOrWeapon;
                            isHeroEquipment = !['Generic', ''].includes(beforeEquipmentOrWeapon);
                        }

                        return (
                            <div
                                key={card.id}
                                className={`modal-result-card grid-card ${isHeroEquipment ? 'hero-equipment' : 'generic-equipment'} ${banned ? 'banned-item' : ''}`}
                                data-class={equipmentClass.toLowerCase()}
                                onClick={() => !banned && onSelect(card)}
                                style={banned ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                            >
                                <img src={card.imagen} alt={card.name} className="modal-card-img-large" />
                                {banned && <div className="banned-overlay">BANNED</div>}
                                <div className="modal-card-details">
                                    <div className="modal-card-name-sm">{card.name}</div>
                                    {/* Class Tag */}
                                    {type === 'equipment' && (
                                        <div className="modal-card-class">
                                            {card.tipo.split('-')[0].trim()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {!loading && usePagination && displayResults.length > 0 && (
                    <div className="modal-pagination">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="pagination-btn"
                        >
                            {t('pagination.previous') || 'Previous'}
                        </button>
                        <span className="pagination-info">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="pagination-btn"
                        >
                            {t('pagination.next') || 'Next'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CardSearchModal;
