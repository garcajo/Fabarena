import React, { useState, useEffect } from 'react';
import { ArrowLeft, Filter, Layers, Archive, HelpCircle } from 'lucide-react';
import { CardService } from '../../services/api';
import CardFilters from '../CardFilters';
import CardGrid from '../CardGrid';
import { useLanguage } from '../../context/LanguageContext';

const DeckEditor = ({ deck, setDeckData, onBack }) => {
    const { t } = useLanguage();
    const [availableCards, setAvailableCards] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters for the card browser
    const [filters, setFilters] = useState({
        search: '',
        pitch: '',
        costo: '',
        set: '',
        clase: '', // Will be controlled by hero
        rareza: ''
    });

    // Determine allowed classes based on Hero
    const heroClass = deck.hero?.clase; // e.g. "Ninja"
    // We want to force filters.clase to include HeroClass and Generic.
    // However, CardFilters component expects specific structure. 
    // We should probably LOCK the class filter or auto-set it.

    useEffect(() => {
        // Initial fetch with hero restrictions
        fetchCards();
    }, [filters, deck.hero]);

    const fetchCards = async () => {
        setLoading(true);
        try {
            // Logic to build "allowed classes" query
            // If hero is "Ninja", we want cards that are "Ninja" OR "Generic"
            // If user selects specific class in filter (e.g. "Generic"), we respect that BUT it must be within allowed.
            // Simplified: Default fetch gets (HeroClass + Generic)
            // But `getAllCards` backend uses OR array logic now.

            const allowedClasses = [heroClass, 'Generic'].filter(Boolean);

            // If user explicitly filters by class, check if it's valid for this hero
            let classesToFetch = allowedClasses;
            if (filters.clase) {
                // If filters.clase is "Ninja", that's fine.
                // If "Generic", fine.
                // If "Brute" (and hero is Ninja), that shouldn't happen or return 0.
                classesToFetch = Array.isArray(filters.clase) ? filters.clase : [filters.clase];
            }

            const response = await CardService.getCards({
                ...filters,
                clase: classesToFetch, // Override class filter to enforce restriction + user selection
                pageSize: 20
            });
            setAvailableCards(response.data || []);
        } catch (error) {
            console.error("Error fetching deck builder cards", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters) => {
        // Prevent selecting classes outside of hero's scope?
        // Or just let the fetch logic handle it (it will return empty if they try 'Brute' with 'Ninja')
        // Better UX: Pre-fill class options in CardFilters? 
        // For now, let's just pass filters.
        setFilters(newFilters);
    };

    const addToDeck = (card, zone = 'main') => {
        // Add card to specific zone logic
        // Check copies limit (3 usually, 1 for legendaries)
        const zoneKey = zone === 'side' ? 'sideboard' : (zone === 'maybe' ? 'maybeboard' : 'mainDeck');

        setDeckData(prev => ({
            ...prev,
            [zoneKey]: [...prev[zoneKey], card]
        }));
    };

    return (
        <div className="deck-editor grid grid-cols-12 gap-6 h-full">
            {/* LEFT: Card Browser */}
            <div className="col-span-8 flex flex-col gap-4 h-full">
                <div className="editor-panel">
                    <div className="editor-header">
                        <div className="flex items-center gap-4">
                            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-white">
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h2 className="editor-title">{deck.hero?.name}</h2>
                                <p className="text-sm text-text-muted">{deck.hero?.clase}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card-browser-container">
                        <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-text-muted uppercase tracking-wider">
                            <Filter size={14} /> Filters
                        </h3>
                        <CardFilters
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            isLoading={loading}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto rounded-xl border border-white/5 bg-black/20 p-2">
                        <CardGrid
                            cards={availableCards}
                            loading={loading}
                            onCardClick={(card) => addToDeck(card, 'main')}
                        />
                    </div>
                </div>
            </div>

            {/* RIGHT: Deck List */}
            <div className="col-span-4 h-full">
                <div className="editor-panel">
                    <div className="editor-header">
                        <h3 className="editor-title flex items-center gap-2">
                            <Archive size={20} className="text-primary-red" />
                            Deck List
                        </h3>
                        <span className="bg-primary-red px-3 py-1 rounded-full text-sm font-bold">
                            {deck.mainDeck.length}
                        </span>
                    </div>

                    <div className="zone-header flex justify-between px-2">
                        <span>Main Deck</span>
                        <span className="text-xs font-normal opacity-50">Click to remove</span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {deck.mainDeck.length === 0 ? (
                            <div className="text-center text-text-muted py-20 italic">
                                <Layers size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Your deck is empty.</p>
                                <p className="text-sm opacity-60">Select cards from the left to add them.</p>
                            </div>
                        ) : (
                            deck.mainDeck.map((card, idx) => (
                                <div key={idx} className="deck-list-item group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full shadow-[0_0_8px] ${card.pitch === 1 ? 'bg-red-500 shadow-red-500/50' : card.pitch === 2 ? 'bg-yellow-500 shadow-yellow-500/50' : 'bg-blue-500 shadow-blue-500/50'}`}></div>
                                        <span className="font-medium text-sm">{card.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-text-muted font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{card.costo}</span>
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

export default DeckEditor;
