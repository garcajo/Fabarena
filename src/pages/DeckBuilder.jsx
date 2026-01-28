import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Plus, X, Save, ArrowLeft, MessageSquare, Beaker, BookOpen, Eye, Pencil, FileQuestion, Heart } from 'lucide-react';
import { CardService, DeckService } from '../services/api';
import { StorageService } from '../services/storage';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { isCardBanned } from '../data/bannedCards';
import { isCardLegalForHero } from '../utils/deckValidation';
import FormatSelection from '../components/deck-builder/FormatSelection';
import CardSearchModal from '../components/deck-builder/CardSearchModal';
import StackedDeckList from '../components/deck-builder/StackedDeckList';
import CommentSection from '../components/comments/CommentSection';
import CardPreviewModal from '../components/common/CardPreviewModal';
import DeckPlaytester from '../components/deck-builder/DeckPlaytester';
import Toast from '../components/common/Toast';
import '../styles/DeckBuilder.css';

const STEPS = {
    FORMAT: 'FORMAT',
    BUILDER: 'BUILDER'
};

const DeckBuilder = () => {
    const { t } = useLanguage();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { deckId: paramDeckId } = useParams();

    const [step, setStep] = useState(paramDeckId ? STEPS.BUILDER : STEPS.FORMAT);
    const [deckId, setDeckId] = useState(paramDeckId || null);
    // Default to Edit Mode ONLY if creating a new deck (!paramDeckId). 
    // If viewing existing deck, default to View Mode (false).
    const [isEditMode, setIsEditMode] = useState(!paramDeckId);
    const [loading, setLoading] = useState(!!paramDeckId);
    const [deckData, setDeckData] = useState({
        name: '',
        format: 'cc', // Default to Classic Constructed
        hero: null,
        visibility: null,
        equipment: [],
        mainDeck: [],
        sideboard: [],
        maybeboard: [],
        user_id: null // Add user_id to state
    });

    // Secure Owner Check: Must be logged in AND (backend confirmed ownership OR IDs match)
    const isOwner = !!user && (!!deckData.isOwner || (deckData.user_id === user.id));

    const [error, setError] = useState(null);

    // Like state
    const [likesCount, setLikesCount] = useState(0);
    const [viewsCount, setViewsCount] = useState(0);
    const [userHasLiked, setUserHasLiked] = useState(false);
    const [isLiking, setIsLiking] = useState(false);

    // Derived: User can edit if:
    // 1. It's a new deck (!deckId) AND they are logged in
    // 2. They own the deck (isOwner) AND are in edit mode
    const canEdit = (!deckId && !!user) || (isOwner && isEditMode);


    // Handle like toggle
    const handleToggleLike = async () => {
        if (!user) {
            setToastMessage(t('deckBuilder.loginToLike') || 'Please login to like decks');
            setToastType('error');
            setShowToast(true);
            return;
        }
        if (isLiking) return;

        setIsLiking(true);
        try {
            const result = await DeckService.toggleLike(deckId);
            setUserHasLiked(result.liked);
            setLikesCount(prev => result.liked ? prev + 1 : Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error toggling like:', err);
            setToastMessage(t('deckBuilder.likeError') || 'Error updating like');
            setToastType('error');
            setShowToast(true);
        } finally {
            setIsLiking(false);
        }
    };

    // Redirect to home if user logs out while viewing a private deck OR if they were editing (isOwner)
    useEffect(() => {
        // Only run redirection check once:
        // 1. Auth state is fully determined (!authLoading)
        // 2. We are NOT creating a new deck (deckId exists)
        // 3. Deck data has been successfully loaded (!loading && deckData.id exists)
        if (!authLoading && deckId && !loading && deckData.id) {

            const isPublic = deckData.visibility === 'public';
            const isOwner = deckData.isOwner || (user && deckData.user_id === user.id);

            // Redirect if the deck is NOT public AND the user is NOT the owner
            if (!isPublic && !isOwner) {
                console.log("[DeckBuilder] Unauthorized access. Redirecting to home.", {
                    deckId: deckData.id,
                    visibility: deckData.visibility,
                    isOwner
                });
                navigate('/');
            }
        }
    }, [user, authLoading, loading, deckData.visibility, deckData.isOwner, deckData.user_id, deckData.id, deckId, navigate]);

    useEffect(() => {
        if (paramDeckId) {
            setStep(STEPS.BUILDER);
            setDeckId(paramDeckId);
            const loadDeck = async () => {
                try {
                    setLoading(true);
                    setError(null);
                    const deck = await DeckService.getDeckById(paramDeckId);

                    if (!deck) {
                        setError('deck_not_found');
                        return;
                    }

                    console.log("[DeckBuilder] LOADED DECK (RAW):", JSON.stringify(deck, null, 2));
                    if (deck) {
                        console.log("[DeckBuilder] Hero Data:", JSON.stringify(deck.hero, null, 2));
                    }

                    // Add to history
                    if (deck) {
                        // Store minimal deck info for history to save space
                        // But need enough to render the card: id, name, hero (image, name), format, updated_at
                        const minimalDeck = {
                            id: deck.id,
                            name: deck.name,
                            format: deck.format,
                            hero: deck.hero, // Assuming this is the parsed/raw obj, will be parsed next line anyway
                            updated_at: deck.updated_at
                        };
                        // We need the parsed hero for the history object if possible, 
                        // but `deck.hero` is what comes from DB.
                        // Let's rely on the safeParse logic below for the UI state, 
                        // but for storage we might want the pre-parsed or post-parsed?
                        // StorageService just stores JSON. 
                        // If we store `deck.hero` as string in LS, the consumer `RecentDecks` needs to parse it.
                        // Better to parse it once here.

                        // Let's create `heroData` first
                        const heroDataForHistory = typeof deck.hero === 'string' ? JSON.parse(deck.hero) : deck.hero;

                        StorageService.addDeckToHistory({
                            ...minimalDeck,
                            hero: heroDataForHistory
                        });
                    }

                    // Helper to safely parse JSON if needed
                    const safeParse = (data) => {
                        if (typeof data === 'string') {
                            try {
                                return JSON.parse(data);
                            } catch (e) {
                                console.error('Error parsing deck data:', e);
                                return data; // Return original if parse fails (fallback)
                            }
                        }
                        return data;
                    };

                    let heroData = safeParse(deck.hero);

                    // SELF-HEALING: If hero exists but missing 'clase' (Legacy Data Issue), re-fetch it
                    if (heroData && !heroData.clase && heroData.name) {
                        try {
                            console.log('Detected stale hero data (missing class), repairing...', heroData.name);
                            const { data: heroResults } = await CardService.getCards({
                                search: heroData.name,
                                type: 'Hero',
                                pageSize: 5
                            });

                            // Find exact match if possible, or take first
                            const freshHero = heroResults?.find(h => h.name === heroData.name) || heroResults?.[0];
                            if (freshHero) {
                                console.log('Hero data repaired:', freshHero);
                                heroData = freshHero;
                            }
                        } catch (repairErr) {
                            console.error('Failed to repair hero data:', repairErr);
                        }
                    }

                    let equipmentData = [];
                    let mainDeckData = [];
                    let sideboardData = [];
                    let maybeboardData = [];

                    if (deck.cards && Array.isArray(deck.cards) && deck.cards.length > 0) {
                        // New Relational Logic
                        console.log("[DeckBuilder] Loading from relational deck_cards...", deck.cards.length);

                        mainDeckData = deck.cards
                            .filter(c => c.section === 'main' && !c.is_sideboard)
                            .map(c => ({ card: c, count: c.quantity }));

                        sideboardData = deck.cards
                            .filter(c => c.section === 'sideboard' || c.is_sideboard)
                            .map(c => ({ card: c, count: c.quantity }));

                        maybeboardData = deck.cards
                            .filter(c => c.section === 'maybeboard')
                            .map(c => ({ card: c, count: c.quantity }));

                        // Equipment: Expand quantity to individual items
                        deck.cards.filter(c => c.section === 'equipment').forEach(c => {
                            for (let i = 0; i < (c.quantity || 1); i++) {
                                equipmentData.push(c);
                            }
                        });

                    } else {
                        // Fallback: Legacy JSON columns
                        console.log("[DeckBuilder] Loading from legacy JSON columns (or empty)");
                        equipmentData = safeParse(deck.equipment) || [];
                        mainDeckData = safeParse(deck.main_deck) || [];
                        sideboardData = safeParse(deck.sideboard) || [];
                        maybeboardData = safeParse(deck.maybeboard) || [];
                    }

                    console.log("[DeckBuilder] Final Loaded State - Main:", mainDeckData.length);

                    setDeckData({
                        name: deck.name,
                        format: deck.format,
                        hero: heroData,
                        visibility: deck.visibility,
                        isOwner: !!deck.isOwner,
                        id: deck.id,
                        user_id: deck.user_id, // Map user_id
                        equipment: equipmentData || [],
                        mainDeck: mainDeckData || [],
                        sideboard: sideboardData || [],
                        maybeboard: maybeboardData || []
                    });
                    // Set likes and views count
                    setLikesCount(deck.likes_count || 0);
                    setViewsCount(deck.views_count || 0);

                    // Also fetch if current user has liked it
                    if (user && deck.id) {
                        try {
                            const status = await DeckService.getLikeStatus(deck.id);
                            setUserHasLiked(status.liked || false);
                            // Ensure the count is the most up-to-date one
                            if (status.likes !== undefined) {
                                setLikesCount(status.likes);
                            }
                        } catch (err) {
                            console.error('Error fetching individual like status:', err);
                        }
                    }

                    // Increment views (non-blocking)
                    DeckService.incrementViews(deck.id);
                } catch (error) {
                    console.error("Error loading deck:", error);
                    setError('load_error');
                } finally {
                    setLoading(false);
                }
            };
            loadDeck();
        }
    }, [paramDeckId, user]);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    // View mode: Mobile default 'text', Desktop default 'stacked'
    const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;
    const [viewMode, setViewMode] = useState(isMobileView ? 'text' : 'stacked');

    const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

    // Toast State
    const [showHeroActions, setShowHeroActions] = React.useState(false);
    const heroRef = React.useRef(null);

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (heroRef.current && !heroRef.current.contains(event.target)) {
                setShowHeroActions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');


    // Sort helper: Always default (Cost -> Pitch -> Name) for deck building standard
    const getSortedCards = (cards) => {
        return [...cards].sort((a, b) => {
            const costA = a.card.costo === null ? 0 : a.card.costo;
            const costB = b.card.costo === null ? 0 : b.card.costo;
            if (costA !== costB) return costA - costB;
            const pitchA = a.card.pitch || 0;
            const pitchB = b.card.pitch || 0;
            if (pitchA !== pitchB) return pitchA - pitchB;
            return a.card.name.localeCompare(b.card.name);
        });
    };

    // ... (rest of helpers like handleFormatSelect, etc. remain the same, just removing setSortMode from view selection)

    // ...

    // Helper to render a single card item based on view mode


    // ...

    // RETURN JSX Update
    // ...

    // ...

    // RENDER LOOPS
    // Use renderCardItem(item, 'sectionName') inside the maps.
    // Also add className={`deck-cards-list ${viewMode === 'visual' ? 'visual-mode' : ''}`}

    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(null); // 'hero' | 'equipment'
    const [activeSection, setActiveSection] = useState('main'); // 'main' | 'sideboard' | 'maybeboard'
    const [activeCardMenu, setActiveCardMenu] = useState(null); // { id: string, section: string }
    const [lastAddedId, setLastAddedId] = useState(null); // For flash animation
    const [previewCard, setPreviewCard] = useState(null); // Mobile Preview State
    const [showPlaytester, setShowPlaytester] = useState(false); // Playtester State

    // Click outside to close menus
    // Click outside to close menus
    // Click outside to close menus and search
    useEffect(() => {
        const handleClickOutside = (event) => {
            const isRow = event.target.closest('.deck-card-row');
            const isVisual = event.target.closest('.deck-card-visual');
            const isPopover = event.target.closest('.card-options-popover');

            // Close Card Menu
            if (activeCardMenu && !isRow && !isVisual && !isPopover) {
                setActiveCardMenu(null);
            }

            // Close Search Dropdown
            const isSearchBar = event.target.closest('.main-search-bar');
            if (isSearchDropdownOpen && !isSearchBar) {
                setIsSearchDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeCardMenu, isSearchDropdownOpen]);



    const handleFormatSelect = (format) => {
        setDeckData(prev => ({ ...prev, format }));
        setStep(STEPS.BUILDER);
        window.scrollTo(0, 0);
    };

    const handleBackToFormat = () => {
        navigate('/my-decks');
    };

    const handleSaveDeck = async () => {
        if (!deckData.name) {
            setToastMessage(t('deckBuilder.nameRequired') || 'Please enter a deck name');
            setToastType('error');
            setShowToast(true);
            return;
        }

        if (!deckData.hero) {
            setToastMessage(t('deckBuilder.heroRequired') || 'Please select a hero');
            setToastType('error');
            setShowToast(true);
            return;
        }

        try {
            // Derive username from auth context
            const username = user?.user_metadata?.full_name || user?.user_metadata?.username || user?.email?.split('@')[0] || 'Unknown';

            const payload = {
                ...deckData,
                username, // Send username to backend
                // Ensure array structures match backend expectation if needed
            };

            console.log("[DeckBuilder] SAVING DECK PAYLOAD:", payload);
            console.log("[DeckBuilder] mainDeck length:", payload.mainDeck?.length);

            let savedDeck;
            if (deckId) {
                savedDeck = await DeckService.updateDeck(deckId, payload);
                setToastMessage(t('deckBuilder.deckSaved') || 'Deck saved successfully!');
            } else {
                savedDeck = await DeckService.createDeck(payload);
                setDeckId(savedDeck.id);
                setToastMessage(t('deckBuilder.deckCreated') || 'Deck created successfully!');
                // Update URL for new decks without reloading the page
                navigate(`/decks/${savedDeck.id}`, { replace: true });
            }
            setToastType('success');
            setShowToast(true);
            // Exit Edit Mode on successful save
            setIsEditMode(false);
        } catch (error) {
            console.error('Error saving deck:', error);
            setToastMessage(`${t('deckBuilder.deckError') || 'Error saving deck'}: ${error.message}`);
            setToastType('error');
            setShowToast(true);
        }
    };

    // Debounced search for main card adding
    React.useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length < 2) {
                setSearchResults([]);
                return;
            }


            setSearching(true);
            try {
                const searchParams = {
                    search: searchTerm,
                    pageSize: 50
                };

                // Silver Age format restriction: Only Common and Rare cards
                if (deckData.format === 'silver') {
                    searchParams.rareza = ['Común', 'Rara', 'Common', 'Rare'];
                }

                const { data } = await CardService.getCards(searchParams);

                // Deduplicate results: Keep unique (Name + Pitch) combo.
                // FAB cards are unique by Name + Pitch (Color). Rarity/Set doesn't change Deck legality/identity.
                const uniqueCards = [];
                const seen = new Set();

                (data || []).forEach(card => {
                    // 1. Strict Legality Check (especially for multi-trait like Draconic Ninja)
                    if (deckData.hero && !isCardLegalForHero(card.clase, deckData.hero.clase)) {
                        return;
                    }

                    // 2. Filter out Equipment and Weapons (they have their own specific section)
                    // Common types: Weapon, Head, Chest, Arms, Legs, Off-Hand
                    const type = (card.tipo || '').toLowerCase();
                    const excludedTypes = ['weapon', 'arma', 'head', 'cabeza', 'chest', 'pecho', 'arms', 'brazos', 'legs', 'piernas', 'off-hand', 'mano-secundaria', 'equipment', 'equipamiento'];

                    if (excludedTypes.some(t => type.includes(t))) {
                        return;
                    }

                    // Use a key that combines name and pitch (if pitch exists)
                    // FAB cards are unique by Name + Pitch.
                    const pitchSuffix = card.pitch !== undefined && card.pitch !== null ? `-${card.pitch}` : '';
                    const key = `${card.name}${pitchSuffix}`;

                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueCards.push(card);
                    }
                });

                console.log(`[DeckBuilder] Search '${searchTerm}' results: Raw=${data?.length}, Unique=${uniqueCards.length}`);

                setSearchResults(uniqueCards);
                setIsSearchDropdownOpen(true);
            } catch (error) {
                console.error("Error searching:", error);
            } finally {
                setSearching(false);
            }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, deckData.hero, deckData.format]);

    const openHeroModal = () => {
        setModalType('hero');
        setShowModal(true);
    };

    const openEquipmentModal = () => {
        setModalType('equipment');
        setShowModal(true);
    };

    const handleSelectFromModal = (card) => {
        if (modalType === 'hero') {
            setDeckData(prev => ({ ...prev, hero: card }));
        } else if (modalType === 'equipment') {
            setDeckData(prev => ({
                ...prev,
                equipment: [...prev.equipment, card]
            }));
        }
        setShowModal(false);
    };

    // Validation Helper
    const validateDeckLimit = (currentData, cardToAdd, targetSection) => {
        // Only validate if adding to Main, Equipment, or Sideboard
        // Maybeboard is always free
        if (targetSection === 'maybeboard') return true;
        if (targetSection === 'hero') return true;

        if (currentData.format === 'cc') {
            const mainCount = currentData.mainDeck.reduce((acc, c) => acc + c.count, 0);
            const sideCount = currentData.sideboard.reduce((acc, c) => acc + c.count, 0);
            // Equipment is simple array, count is length (assuming 1 count per entry logic in render, but data is flat)
            // Actually, my previous fix grouped them for display, but here they are flat in `deckData.equipment`.
            // So `deckData.equipment.length` is the count.
            const equipCount = currentData.equipment.length;

            const totalActive = mainCount + sideCount + equipCount;

            // Check if we are adding a NEW card or just moving/incrementing
            // If we are just moving from one active section to another (e.g. Main -> Side), the total doesn't change!
            // But `addCardToDeck` is generic.

            // We need to know if the operation INCREASES the total active count.
            // This function is called BEFORE the change.
            // If `cardToAdd` comes from 'maybeboard' or external search, count increases.
            // If `cardToAdd` comes from 'main', 'side', 'equipment', count behaves differently.

            // Simpler approach: Calculate projected total.
            // NOTE: This function detects if strictly adding.
            // For DnD (Move), we remove then add. 
            // So if I move Main -> Side: Remove (Total - 1), Add (Total - 1 + 1) = Total. No change.
            // If I move Maybe -> Main: Add (Total + 1).

            return totalActive < 80;
        }

        // Silver Age / Blitz might have other limits, for now only enforcing CC 80 as requested.
        return true;
    };

    const addCardToDeck = (card, target = activeSection, sourceSection = null) => {
        console.log("[DeckBuilder] addCardToDeck called", { cardName: card.name, target, sourceSection, currentDeckSize: deckData.mainDeck.length });

        // If moving between active sections (Main/Side/Equip), limits don't block (swapping zones).
        // If coming from null (Search) or Maybeboard, limits apply.
        const isInternalActiveMove =
            sourceSection &&
            ['mainDeck', 'sideboard', 'equipment'].includes(sourceSection) &&
            ['mainDeck', 'sideboard', 'equipment'].includes(target === 'main' ? 'mainDeck' : target);

        if (!isInternalActiveMove) {
            // Check limit
            const targetKey = target === 'main' ? 'mainDeck' : target;
            if (!validateDeckLimit(deckData, card, targetKey)) {
                setToastMessage(t('deckBuilder.limitReached') || "Deck Limit Reached (Max 80 cards for CC)");
                setToastType('error');
                setShowToast(true);
                return;
            }
        }

        setDeckData(prev => {
            // Determine target array
            const sectionKey = target === 'sideboard' ? 'sideboard' :
                target === 'maybeboard' ? 'maybeboard' :
                    target === 'equipment' ? 'equipment' : 'mainDeck';

            // Handle Equipment (Flat Array)
            if (sectionKey === 'equipment') {
                // Check if it's actually equipment? User might verify.
                // Ideally check card type, but for drag and drop user freedom is key.
                return {
                    ...prev,
                    equipment: [...prev.equipment, card]
                };
            }

            const currentList = prev[sectionKey];
            const existing = currentList.find(c => c.card.id === card.id);

            if (existing) {
                // Check max copies (3 for most cards)
                if (existing.count >= 3) return prev;
                return {
                    ...prev,
                    [sectionKey]: currentList.map(c =>
                        c.card.id === card.id ? { ...c, count: c.count + 1 } : c
                    )
                };
            }
            return {
                ...prev,
                [sectionKey]: [...currentList, { card, count: 1 }]
            };
        });

        // Trigger Flash Animation
        setLastAddedId(card.id);
        setTimeout(() => setLastAddedId(null), 500);
    };

    const removeCard = (cardId, section = 'mainDeck') => {
        // Clear hover state immediately to prevent "ghost" preview
        setHoveredCard(null);

        setDeckData(prev => {
            if (section === 'hero') {
                return { ...prev, hero: null };
            }

            const currentList = prev[section];

            // Equipment is an array of card objects directly
            if (section === 'equipment') {
                const indexToRemove = currentList.findIndex(c => c.id === cardId);
                if (indexToRemove === -1) return prev;
                const newList = [...currentList];
                newList.splice(indexToRemove, 1);
                return { ...prev, equipment: newList };
            }

            // Standard sections (main, side, maybe) have { card, count } wrappers
            const existing = currentList.find(c => c.card.id === cardId);

            if (existing && existing.count > 1) {
                return {
                    ...prev,
                    [section]: currentList.map(c =>
                        c.card.id === cardId ? { ...c, count: c.count - 1 } : c
                    )
                };
            }
            return {
                ...prev,
                [section]: currentList.filter(c => c.card.id !== cardId)
            };
        });
        // If we removed the last copy, close menu
        if (activeCardMenu?.id === cardId) setActiveCardMenu(null);
    };

    const moveCard = (cardItem, fromSection, toSection) => {
        const card = cardItem.card || cardItem; // Handle both wrapped and raw

        // Validation for Move (if source was Maybeboard and target is active)
        const targetKey = toSection === 'mainDeck' ? 'mainDeck' : toSection;
        const sourceKey = fromSection;

        // Check if we are effectively adding a card to the active pool
        const isSourceActive = ['mainDeck', 'sideboard', 'equipment'].includes(sourceKey);
        const isTargetActive = ['mainDeck', 'sideboard', 'equipment'].includes(targetKey);

        if (!isSourceActive && isTargetActive) {
            if (!validateDeckLimit(deckData, card, targetKey)) {
                setToastMessage(t('deckBuilder.limitReached') || "Deck Limit Reached (Max 80 cards for CC)");
                setToastType('error');
                setShowToast(true);
                return;
            }
        }

        // Remove one copy from source
        removeCard(card.id, fromSection);
        // Add one copy to destination
        addCardToDeck(card, toSection === 'mainDeck' ? 'main' : toSection, fromSection);
        setActiveCardMenu(null);
    };

    // Drag & Drop Handlers
    const handleDragStart = (e, card, section) => {
        // We persist data: cardId, section
        e.dataTransfer.setData('cardId', card.id);
        e.dataTransfer.setData('fromSection', section);
        e.dataTransfer.setData('cardData', JSON.stringify(card)); // Fallback if lookup fails

        // Set drag image or effect if desired
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';

        // Auto-Scroll Logic
        const SCROLL_ZONE = 100; // px from edge
        const SCROLL_SPEED = 10; // px per event (fires rapidly)

        const y = e.clientY;
        const windowHeight = window.innerHeight;

        if (y < SCROLL_ZONE) {
            // Scroll Up
            window.scrollBy(0, -SCROLL_SPEED);
        } else if (y > windowHeight - SCROLL_ZONE) {
            // Scroll Down
            window.scrollBy(0, SCROLL_SPEED);
        }
    };

    const handleDrop = (e, targetSection) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('cardId');
        const fromSection = e.dataTransfer.getData('fromSection');
        const cardDataStr = e.dataTransfer.getData('cardData');

        if (!cardId || !fromSection) return;
        if (fromSection === targetSection) return; // No op if same section

        // Reconstruct card object
        let cardObj = null;

        // Try to find in current deck data first for consistency
        if (fromSection === 'equipment') {
            cardObj = deckData.equipment.find(c => c.id === cardId);
        } else if (['mainDeck', 'sideboard', 'maybeboard'].includes(fromSection)) {
            const found = deckData[fromSection].find(c => c.card.id === cardId);
            if (found) cardObj = found.card;
        }

        // Fallback to transferred data
        if (!cardObj && cardDataStr) {
            try {
                cardObj = JSON.parse(cardDataStr);
            } catch (e) { console.error("Parse drag data fail", e); }
        }

        if (cardObj) {
            moveCard({ card: cardObj }, fromSection, targetSection);
        }
    };


    const totalCards = deckData.mainDeck.reduce((acc, curr) => acc + curr.count, 0);
    const sideboardCards = deckData.sideboard.reduce((acc, curr) => acc + curr.count, 0);
    const maybeboardCards = deckData.maybeboard.reduce((acc, curr) => acc + curr.count, 0);

    const [hoveredCard, setHoveredCard] = React.useState(null); // { image: string, side: 'left' | 'right' }

    const handleCardMouseEnter = (e, image) => {
        if (!image) {
            setHoveredCard(null);
            return;
        }
        const screenWidth = window.innerWidth;
        const mouseX = e?.clientX || 0;
        // If mouse is on the right half, show preview on the left. If on left half, show on right.
        const side = mouseX > screenWidth / 2 ? 'left' : 'right';
        setHoveredCard({ image, side });
    };

    // ... existing ...

    const renderCardItem = (item, section, index = 0) => {
        const isVisual = viewMode === 'visual';
        const card = item.card;
        const isStandardSection = ['mainDeck', 'sideboard', 'maybeboard'].includes(section);

        // Define menu variables
        const menuKey = `${card.id}-${section}-${index}`;
        const isMenuOpen = activeCardMenu === menuKey;

        return (
            <div
                key={`${card.id}-${index}`}
                draggable={canEdit}
                onDragStart={(e) => {
                    if (canEdit) handleDragStart(e, card, section);
                }}
                className={`deck-card-wrapper-dnd ${isVisual ? 'visual-wrapper' : 'text-wrapper'}`}
                style={{ display: 'contents' }} // Use contents so the inner div controls layout
            >
                {isVisual ? (
                    <div
                        className={`deck-card-visual ${isMenuOpen ? 'menu-open' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.innerWidth < 768) {
                                setPreviewCard({ item, section });
                            } else {
                                if (canEdit) {
                                    setActiveCardMenu(isMenuOpen ? null : menuKey);
                                }
                            }
                        }}
                        onMouseEnter={(e) => handleCardMouseEnter(e, card.imagen)}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <img src={card.imagen} alt={card.name} />
                        {item.count > 1 && <div className="visual-count-badge">{item.count}</div>}

                        {/* Popover Menu */}
                        {isMenuOpen && (
                            <div className="card-options-popover">
                                {isStandardSection && section !== 'mainDeck' && (
                                    <button className="popover-option" onClick={(e) => { e.stopPropagation(); moveCard(item, section, 'mainDeck'); }}>
                                        {t('deckBuilder.moveToDeck') || 'Move to Deck'}
                                    </button>
                                )}
                                {isStandardSection && (card.tipo?.toLowerCase().includes('weapon') || card.tipo?.toLowerCase().includes('arma') || card.tipo?.toLowerCase().includes('equipment') || card.tipo?.toLowerCase().includes('equipamiento')) && section !== 'equipment' && (
                                    <button className="popover-option" onClick={(e) => { e.stopPropagation(); moveCard(item, section, 'equipment'); }}>
                                        {t('deckBuilder.moveToEquipment') || 'Move to Equipment'}
                                    </button>
                                )}
                                {(isStandardSection || section === 'equipment') && section !== 'sideboard' && (
                                    <button className="popover-option" onClick={(e) => { e.stopPropagation(); moveCard(item, section, 'sideboard'); }}>
                                        {t('deckBuilder.moveToSideboard') || 'Move to Sideboard'}
                                    </button>
                                )}
                                {(isStandardSection || section === 'equipment') && section !== 'maybeboard' && (
                                    <button className="popover-option" onClick={(e) => { e.stopPropagation(); moveCard(item, section, 'maybeboard'); }}>
                                        {t('deckBuilder.moveToMaybeboard') || 'Move to Maybeboard'}
                                    </button>
                                )}
                                {(isStandardSection || section === 'equipment') && <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '2px 0' }}></div>}
                                <button className="popover-option danger" onClick={(e) => { e.stopPropagation(); removeCard(card.id, section); }}>
                                    <X size={14} /> {t('deckBuilder.remove') || 'Remove'}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div
                        className={`deck-card-row ${isMenuOpen ? 'menu-open' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.innerWidth < 768) {
                                setPreviewCard({ item, section });
                            } else {
                                if (canEdit) {
                                    setActiveCardMenu(isMenuOpen ? null : menuKey);
                                }
                            }
                        }}
                        onMouseEnter={(e) => handleCardMouseEnter(e, card.imagen)}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        {section !== 'hero' && (
                            <div className="card-count-badge" style={section === 'sideboard' ? { borderColor: '#fbbf24', background: 'rgba(251, 191, 36, 0.2)' } : section === 'maybeboard' ? { borderColor: '#60a5fa', background: 'rgba(96, 165, 250, 0.2)' } : {}}>{item.count}</div>
                        )}
                        <span className="deck-card-name" style={{ flex: 1 }}>{card.name}</span>

                        <div className="card-stats-text">
                            {(card.poder || card.defensa) && (
                                <>
                                    {card.poder && <span className="stat-icon">⚔️{card.poder}</span>}
                                    {card.defensa && <span className="stat-icon">🛡️{card.defensa}</span>}
                                    <span style={{ margin: '0 4px', opacity: 0.3 }}>|</span>
                                </>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            {card.costo !== null && <span className="cost-badge-small">{card.costo}</span>}
                            {card.pitch !== undefined && <span className={`pitch-pip-small pitch-${card.pitch}`}></span>}
                        </div>

                        {isMenuOpen && (
                            <div className="card-options-popover">
                                {section === 'hero' && (
                                    <button className="popover-option" onClick={(e) => { e.stopPropagation(); openHeroModal(); }}>
                                        {t('deckBuilder.changeHero') || 'Change Hero'}
                                    </button>
                                )}
                                {isStandardSection && section !== 'mainDeck' && (
                                    <button className="popover-option" onClick={(e) => { e.stopPropagation(); moveCard(item, section, 'mainDeck'); }}>
                                        {t('deckBuilder.moveToDeck') || 'Move to Deck'}
                                    </button>
                                )}
                                {isStandardSection && (card.tipo?.toLowerCase().includes('weapon') || card.tipo?.toLowerCase().includes('arma') || card.tipo?.toLowerCase().includes('equipment') || card.tipo?.toLowerCase().includes('equipamiento')) && section !== 'equipment' && (
                                    <button className="popover-option" onClick={(e) => { e.stopPropagation(); moveCard(item, section, 'equipment'); }}>
                                        {t('deckBuilder.moveToEquipment') || 'Move to Equipment'}
                                    </button>
                                )}
                                {(isStandardSection || section === 'equipment') && section !== 'sideboard' && (
                                    <button className="popover-option" onClick={(e) => { e.stopPropagation(); moveCard(item, section, 'sideboard'); }}>
                                        {t('deckBuilder.moveToSideboard') || 'Move to Sideboard'}
                                    </button>
                                )}
                                {(isStandardSection || section === 'equipment') && section !== 'maybeboard' && (
                                    <button className="popover-option" onClick={(e) => { e.stopPropagation(); moveCard(item, section, 'maybeboard'); }}>
                                        {t('deckBuilder.moveToMaybeboard') || 'Move to Maybeboard'}
                                    </button>
                                )}
                                {(isStandardSection || section === 'equipment') && <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '2px 0' }}></div>}
                                <button className="popover-option danger" onClick={(e) => { e.stopPropagation(); removeCard(card.id, section); }}>
                                    <X size={14} /> {t('deckBuilder.remove') || 'Remove'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const handleSectionAdd = (section) => {
        setActiveSection(section);
        const searchInput = document.querySelector('.main-search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    // Loading View
    if (loading || authLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-primary-red border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <p className="text-white/40 text-sm font-medium tracking-[0.2em] uppercase">
                            {t('common.loading') || 'Loading'}
                        </p>
                        <div className="h-[2px] w-24 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-red animate-[loading-bar_1.5s_infinite_ease-in-out]"></div>
                        </div>
                    </div>
                </div>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes loading-bar {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                    .border-t-primary-red { border-top-color: var(--color-primary-red, #ef4444); }
                    .bg-primary-red { background-color: var(--color-primary-red, #ef4444); }
                `}} />
            </div>
        );
    }

    // Initial Format Selection View
    if (step === STEPS.FORMAT) {
        return <FormatSelection onSelect={handleFormatSelect} />;
    }

    // Error View
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="bg-red-500/10 p-6 rounded-full mb-6 relative">
                    <FileQuestion size={64} className="text-red-500 opacity-80" />
                    <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse"></div>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 font-cinzel tracking-wide">
                    {t('deckBuilder.notFoundTitle') || 'Deck Not Found'}
                </h2>
                <p className="text-white/50 text-lg mb-8 max-w-md">
                    {t('deckBuilder.notFoundDesc') || 'This deck may have been deleted by the author or does not exist.'}
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all flex items-center gap-2 group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    {t('common.returnHome') || 'Return to Home'}
                </button>
            </div>
        );
    }




    // Helper for List View (Visual, Text, or Stacked)
    const renderListSection = (cardList, sectionName) => {
        if (!cardList || cardList.length === 0) {
            return (
                <div className="empty-deck-message">
                    {sectionName === 'mainDeck' ? (t('deckBuilder.emptyDeck') || "Start adding cards using the search bar above.") :
                        sectionName === 'sideboard' ? (t('deckBuilder.emptySideboard') || "No cards in sideboard.") :
                            (t('deckBuilder.emptyMaybeboard') || "No cards in maybeboard.")}
                </div>
            );
        }

        if (viewMode === 'stacked') {
            return (
                <StackedDeckList
                    cards={getSortedCards(cardList)}
                    onCardClick={(item) => {
                        // Mobile Preview for Stacked View
                        if (window.innerWidth < 768) {
                            setPreviewCard({ item, section: sectionName });
                        }
                    }}
                    onDragStart={(e, card) => handleDragStart(e, card, sectionName)}
                    isOwner={canEdit}
                    activeCardMenu={activeCardMenu}
                    setActiveCardMenu={setActiveCardMenu}
                    section={sectionName}
                    onMoveCard={moveCard}
                    onRemoveCard={removeCard}
                    onHoverCard={handleCardMouseEnter}
                />
            );
        }

        return getSortedCards(cardList).map((item, index) => renderCardItem(item, sectionName, index));
    };

    // Main Builder View
    return (
        <div className="deck-builder-minimal">
            <div className="container">
                {/* Top Bar */}
                {/* Top Bar - Buttons Only */}
                {/* Top Bar - Buttons Only */}
                <div className="deck-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <button
                        onClick={handleBackToFormat}
                        className="back-format-btn"
                        title={t('deckBuilder.changeFormat') || "Change Format"}
                    >
                        <ArrowLeft size={18} />
                    </button>



                    {/* Right Side Buttons Group */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {/* View Comments Button - Icon Only */}
                        {deckId && (
                            <button
                                className="view-comments-btn"
                                onClick={() => {
                                    const section = document.getElementById('comments-section');
                                    if (section) section.scrollIntoView({ behavior: 'smooth' });
                                }}
                                title={t('deckBuilder.comments') || 'Comments'}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    color: 'var(--color-text-main)',
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '36px',
                                    height: '36px'
                                }}
                            >
                                <MessageSquare size={18} />
                            </button>
                        )}

                        {/* Guide Button - Always show, but require save first for new decks */}
                        <button
                            className="view-guide-btn"
                            onClick={() => {
                                if (deckId) {
                                    navigate(`/decks/${deckId}/guide`);
                                } else {
                                    alert(t('deckBuilder.saveFirstForGuide') || 'Please save your deck first to create a guide.');
                                }
                            }}
                            style={{
                                background: deckId ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: deckId ? 'var(--color-text-main)' : 'rgba(255, 255, 255, 0.4)',
                                padding: '0.5rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '36px',
                                height: '36px',
                                opacity: deckId ? 1 : 0.6
                            }}
                            title={deckId ? (t('deck.guide') || 'Deck Guide') : (t('deckBuilder.saveFirstForGuide') || 'Save deck first')}
                        >
                            <BookOpen size={18} />
                        </button>

                        {/* Test Deck Button */}
                        {deckData.mainDeck.length > 0 && (
                            <button
                                className="test-deck-btn"
                                onClick={() => setShowPlaytester(true)}
                                style={{
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                    border: '1px solid rgba(139, 92, 246, 0.5)',
                                    color: 'white',
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '36px',
                                    height: '36px'
                                }}
                                title={t('deckBuilder.testDeck') || 'Test Deck'}
                            >
                                <Beaker size={18} />
                            </button>
                        )}


                        {/* Save/Clone Button (Moved) */}
                        {/* Use derived isOwner for robustness */}
                        {(deckId && !!user && !isOwner && deckData.id) ? (
                            <button
                                className="save-deck-btn"
                                onClick={async () => {
                                    try {
                                        const username = user?.user_metadata?.username || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown';
                                        const payload = {
                                            ...deckData,
                                            username, // Correctly attribute to current user
                                            name: `${deckData.name} (Copy)`,
                                            visibility: 'private',
                                            isOwner: undefined,
                                            id: undefined,
                                            user_id: undefined
                                        };
                                        const savedDeck = await DeckService.createDeck(payload);
                                        setDeckId(savedDeck.id);
                                        setDeckData(prev => ({ ...prev, isOwner: true, id: savedDeck.id, name: payload.name }));
                                        setToastMessage(t('deckBuilder.deckCloned') || 'Deck cloned to your library!');
                                        setToastType('success');
                                        setShowToast(true);
                                        setIsEditMode(true); // Switch to edit mode for the clone
                                        navigate(`/decks/${savedDeck.id}`);
                                    } catch (error) {
                                        console.error('Error cloning deck:', error);
                                        setToastMessage('Error cloning deck');
                                        setToastType('error');
                                        setShowToast(true);
                                    }
                                }}
                                style={{
                                    background: 'var(--color-primary-blue)',
                                    borderColor: 'var(--color-primary-blue)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer',
                                    color: 'white'
                                }}
                            >
                                <Save size={18} />
                                <span className="hide-mobile">{t('deckBuilder.clone') || 'Clone Deck'}</span>
                            </button>
                        ) : (
                            <>
                                {/* Owner: Toggle Edit/View Mode */}
                                {deckId && isOwner && (
                                    <button
                                        className="edit-toggle-btn"
                                        onClick={() => setIsEditMode(!isEditMode)}
                                        style={{
                                            background: isEditMode ? 'var(--color-bg-card)' : 'var(--color-primary-red)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            color: 'white',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        {isEditMode ? (
                                            <>
                                                <Eye size={16} />
                                                <span className="hide-mobile">{t('deckBuilder.viewPublic') || 'View Public'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Pencil size={16} />
                                                <span className="hide-mobile">{t('deckBuilder.editDeck') || 'Edit Deck'}</span>
                                            </>
                                        )}
                                    </button>
                                )}

                                {/* Save Button - Only visible in Edit Mode */}
                                {canEdit && (
                                    <button
                                        className="save-deck-btn"
                                        onClick={handleSaveDeck}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Save size={18} />
                                        <span className="hide-mobile">{t('common.save') || 'Save'}</span>
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                </div>

                {/* Deck Name and Privacy Row */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {canEdit ? (
                        <input
                            type="text"
                            placeholder={t('deckBuilder.deckName') || "Deck Name"}
                            value={deckData.name}
                            onChange={(e) => setDeckData(prev => ({ ...prev, name: e.target.value }))}
                            className="deck-name-input"
                            style={{ flex: 1, minWidth: '200px', maxWidth: '400px' }}
                        />
                    ) : (
                        <h1 style={{
                            flex: 1,
                            minWidth: '200px',
                            margin: 0,
                            fontSize: '2.5rem',
                            fontWeight: '800',
                            color: 'var(--color-text-main)',
                            letterSpacing: '-0.02em',
                            fontFamily: 'var(--font-cinzel)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                        }}>
                            {deckData.name}

                            {/* Like Button - Only show for existing decks */}
                            {deckId && (
                                <>
                                    <button
                                        onClick={handleToggleLike}
                                        disabled={isLiking}
                                        className={`like-button ${userHasLiked ? 'liked' : ''}`}
                                        title={user ? (userHasLiked ? t('deckBuilder.removeLike') : t('deckBuilder.addLike')) : t('deckBuilder.loginToLikeHint')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            background: userHasLiked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
                                            border: `1px solid ${userHasLiked ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255,255,255,0.1)'}`,
                                            borderRadius: '8px',
                                            padding: '8px 14px',
                                            color: userHasLiked ? '#ef4444' : 'rgba(255,255,255,0.7)',
                                            cursor: user ? 'pointer' : 'not-allowed',
                                            fontSize: '0.9rem',
                                            fontWeight: '500',
                                            transition: 'all 0.2s ease',
                                            opacity: isLiking ? 0.6 : 1
                                        }}
                                    >
                                        <Heart
                                            size={18}
                                            fill={userHasLiked ? '#ef4444' : 'none'}
                                            strokeWidth={2}
                                        />
                                        <span>{likesCount}</span>
                                    </button>

                                    <div className="deck-stat-pill" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        padding: '8px 14px',
                                        color: 'rgba(255,255,255,0.7)',
                                        fontSize: '0.9rem',
                                        fontWeight: '500'
                                    }}>
                                        <Eye size={18} />
                                        <span>{viewsCount}</span>
                                    </div>
                                </>
                            )}
                        </h1>
                    )}


                    {/* Privacy Selector - Only visible in Edit Mode */}
                    {isEditMode && (
                        <div className="privacy-selector">
                            <select
                                value={deckData.visibility || 'private'}
                                onChange={(e) => setDeckData(prev => ({ ...prev, visibility: e.target.value }))}
                                className="deck-privacy-select"
                                disabled={!canEdit}
                            >
                                <option value="private">🔒 {t('deckBuilder.private') || 'Private'}</option>
                                <option value="public">🌍 {t('deckBuilder.public') || 'Public'}</option>
                            </select>
                        </div>
                    )}


                </div>

                {/* Main Search and View Toggles */}
                {deckData.hero && (
                    <div
                        className={`main-search-bar ${activeSection !== 'main' ? 'section-active' : ''} fade-in-section`}
                        style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', maxWidth: '100%', justifyContent: 'space-between' }}
                    >
                        {/* 1. Search Bar (Only for Owner/Editor) */}
                        {canEdit ? (
                            <div className="search-container-large">
                                <Search className="search-icon-large" size={20} />
                                <input
                                    type="text"
                                    className="main-search-input"
                                    placeholder={t('deckBuilder.searchCards') || "Search cards..."}
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        if (e.target.value.length >= 2) {
                                            // Handle search via useEffect
                                            setSearching(true);
                                            setIsSearchDropdownOpen(true);
                                        } else {
                                            setSearchResults([]);
                                            setSearching(false);
                                            setIsSearchDropdownOpen(false);
                                        }
                                    }}
                                    onFocus={() => {
                                        if (searchTerm.length >= 2) setIsSearchDropdownOpen(true);
                                    }}
                                />


                                {/* Search Results Dropdown */}
                                {isSearchDropdownOpen && searchResults.length > 0 && (
                                    <div className="search-results-dropdown-large">
                                        {searchResults.map(card => {
                                            const banned = isCardBanned(card, deckData.format);
                                            const currentCount =
                                                (deckData.mainDeck.find(c => c.card.id === card.id)?.count || 0) +
                                                (deckData.sideboard.find(c => c.card.id === card.id)?.count || 0) +
                                                (deckData.maybeboard.find(c => c.card.id === card.id)?.count || 0);
                                            const isLimitReached = currentCount >= 3;
                                            const isDisabled = banned || isLimitReached;

                                            return (
                                                <div
                                                    key={card.id}
                                                    className={`search-result-item-large ${banned ? 'banned-item' : ''} ${isLimitReached ? 'limit-reached' : ''} ${lastAddedId === card.id ? 'flash-success' : ''}`}
                                                    onClick={() => !isDisabled && addCardToDeck(card)}
                                                    style={isDisabled ? { opacity: 0.6, cursor: 'default' } : {}}
                                                >
                                                    <div className="result-img-wrapper">
                                                        <img
                                                            src={card.imagen || '/placeholder-card.png'}
                                                            alt={card.name}
                                                            className="result-thumb-large"
                                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/62x87?text=No+Img'; }}
                                                        />
                                                    </div>
                                                    <div className="result-info">
                                                        <div className="result-header">
                                                            <span className="result-name">{card.name}</span>
                                                            {card.pitch > 0 && (
                                                                <div className="search-result-pitch-dots">
                                                                    {Array.from({ length: card.pitch }).map((_, i) => (
                                                                        <span key={i} className={`pitch-dot pitch-bg-${card.pitch}`} />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="result-meta">
                                                            <span className="result-cost">{card.costo !== null ? card.costo : '-'}</span>
                                                            <span className="result-type">{card.tipo}</span>
                                                            {banned && <span className="banned-badge">{t('common.banned')}</span>}
                                                            {isLimitReached && <span style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 'bold' }}>{t('common.max')}</span>}
                                                            {!isDisabled && <button className="add-btn-inline"><Plus size={14} /></button>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Spacer if no search bar
                            <div style={{ flex: 1 }}></div>
                        )}

                        {/* View Mode Toggle - Visible to ALL */}
                        <div className="view-selector-container">
                            <button
                                className={`view-selector-btn ${viewMode === 'text' ? 'active' : ''}`}
                                onClick={() => setViewMode('text')}
                            >
                                <span>{t('deckBuilder.sortBy.text') || 'Text'}</span>
                            </button>
                            <button
                                className={`view-selector-btn ${viewMode === 'stacked' ? 'active' : ''}`}
                                onClick={() => setViewMode('stacked')}
                            >
                                <span>{t('deckBuilder.sortBy.stacked') || 'Stacked'}</span>
                            </button>
                        </div>

                    </div>
                )}

                {/* Main Hero Selection Prompt - Only show if NO HERO and NO LOADING */}
                {!deckData.hero && !loading && !authLoading && (
                    <div className="select-hero-prompt fade-in">
                        <div className="prompt-content">
                            <h2>{t('deckBuilder.selectHeroTitle') || "Choose Your Hero"}</h2>
                            <p>{t('deckBuilder.selectHeroSubtitle') || "Select a hero to start building your deck."}</p>
                            <button className="primary-action-btn" onClick={openHeroModal}>
                                <Plus size={20} />
                                {t('deckBuilder.selectHero') || "Select Hero"}
                            </button>
                        </div>
                    </div>
                )}

                {deckData.hero && (
                    <>
                        <div className="builder-layout">
                            {/* Hero Section - FIXED */}
                            {/* Hero Section - FIXED */}
                            <div className="hero-section" ref={heroRef}>
                                <div className="hero-card-display">
                                    <div className={`deck-card-visual ${viewMode === 'stacked' ? 'visual-mode' : ''}`} style={{ width: viewMode === 'stacked' ? '130px' : '100%', margin: '0 0 1rem 0' }}>
                                        <div
                                            className="deck-card-visual"
                                            style={{
                                                width: viewMode === 'stacked' ? '130px' : 'auto', // Match StackedView.css width
                                                margin: '0',
                                                padding: viewMode === 'text' ? '0.5rem' : '0' // Add padding in Text Mode
                                            }}
                                            onMouseEnter={(e) => handleCardMouseEnter(e, deckData.hero.imagen)}
                                            onMouseLeave={() => setHoveredCard(null)}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (showHeroActions) {
                                                    openHeroModal();
                                                    setShowHeroActions(false);
                                                } else {
                                                    setShowHeroActions(true);
                                                }
                                            }}
                                        >
                                            {/* STACKED MODE: Image */}
                                            {viewMode === 'stacked' && (
                                                <img
                                                    src={deckData.hero.imagen}
                                                    alt={deckData.hero.name}
                                                    style={{ width: '100%', borderRadius: '10px', display: 'block' }}
                                                />
                                            )}

                                            {/* TEXT MODE: Name Row (Manually styled to avoid conflicts) */}
                                            {viewMode === 'text' && (
                                                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                    <span className="deck-card-name" style={{ flex: 1, color: 'white', fontWeight: '600' }}>
                                                        {deckData.hero.name || "(No Name)"}
                                                    </span>
                                                    <span style={{ fontSize: '0.8rem', opacity: 0.7, marginRight: '10px' }}>{t('common.hero')}</span>
                                                </div>
                                            )}

                                            {/* Overlay Actions (Click) - Shared for both modes to maintain aesthetic consistency */}
                                            {canEdit && (
                                                <div className={`hero-overlay-actions ${showHeroActions ? 'visible' : ''}`}>
                                                    <button className="change-hero-btn" onClick={(e) => {
                                                        e.stopPropagation();
                                                        openHeroModal();
                                                    }}>
                                                        {t('deckBuilder.changeHero') || 'Change Hero'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                                {/* END hero-card-display */}
                            </div>

                            <div className="equipment-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                                <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '1.2rem' }}>{t('deckBuilder.equipment') || "EQUIPMENT"}</h3>
                                {canEdit && (
                                    <button
                                        className="add-slot-button-small"
                                        onClick={openEquipmentModal}
                                    >
                                        <Plus size={16} />
                                    </button>
                                )}
                            </div>
                            <div
                                className="equipment-list"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'equipment')}
                            >
                                {/* Equipment always renders as list/grid, never "Stacked" piles */}
                                {deckData.equipment.length === 0 ? (
                                    canEdit ? (
                                        <div className="empty-equip-slot" onClick={openEquipmentModal}>
                                            <Plus size={32} style={{ opacity: 0.3 }} />
                                        </div>
                                    ) : (
                                        <div style={{ padding: '1rem', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                                            {t('deckBuilder.noEquipment') || "No Equipment"}
                                        </div>
                                    )
                                ) : (
                                    <div className={`deck-cards-list ${viewMode === 'visual' ? 'visual-mode' : viewMode === 'stacked' ? 'stacked-mode' : 'text-mode-columns text-columns-6'}`} style={viewMode === 'visual' ? { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' } : {}}>
                                        {(() => {
                                            // Helper to group equipment for display (like 2x Kodachi)
                                            const groupedEquipment = [];
                                            const equipmentMap = new Map();
                                            deckData.equipment.forEach(card => {
                                                if (equipmentMap.has(card.id)) {
                                                    equipmentMap.get(card.id).count++;
                                                } else {
                                                    const entry = { card, count: 1 };
                                                    equipmentMap.set(card.id, entry);
                                                    groupedEquipment.push(entry);
                                                }
                                            });

                                            if (viewMode === 'stacked') {
                                                return (
                                                    <StackedDeckList
                                                        cards={groupedEquipment}
                                                        onCardClick={(item) => { }}
                                                        onDragStart={(e, card) => handleDragStart(e, card, 'equipment')}
                                                        isOwner={canEdit}
                                                        activeCardMenu={activeCardMenu}
                                                        setActiveCardMenu={setActiveCardMenu}
                                                        section="equipment"
                                                        onMoveCard={moveCard}
                                                        onRemoveCard={removeCard}
                                                        onHoverCard={handleCardMouseEnter}
                                                    />
                                                );
                                            }

                                            return groupedEquipment.map((item, index) => (
                                                renderCardItem(item, 'equipment', index)
                                            ));
                                        })()}
                                    </div>
                                )}
                            </div>








                            {/* Main Deck Section (Always First) */}
                            <div
                                className="deck-section main-deck"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'mainDeck')}
                            >
                                <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <h2>{t('deckBuilder.mainDeck') || 'MAIN DECK'} ({totalCards})</h2>
                                    {canEdit && (
                                        <button
                                            className="add-slot-button-small"
                                            onClick={() => handleSectionAdd('main')}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className={`deck-cards-list ${viewMode === 'visual' ? 'visual-mode' : viewMode === 'stacked' ? 'stacked-mode' : 'text-mode-columns text-columns-10'}`}>
                                    {renderListSection(deckData.mainDeck, 'mainDeck')}
                                </div>
                            </div>

                            <div
                                className="deck-section"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'sideboard')}
                            >
                                <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <h2>{t('deckBuilder.sideboard') || 'SIDEBOARD'} ({sideboardCards}/{deckData.format === 'cc' ? 15 : 12})</h2>
                                    {canEdit && (
                                        <button
                                            className="add-slot-button-small"
                                            onClick={() => handleSectionAdd('sideboard')}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className={`deck-cards-list ${viewMode === 'visual' ? 'visual-mode' : viewMode === 'stacked' ? 'stacked-mode' : 'text-mode-columns text-columns-10'}`}>
                                    {renderListSection(deckData.sideboard, 'sideboard')}
                                </div>
                            </div>

                            <div
                                className="deck-section"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'maybeboard')}
                            >
                                <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <h2>{t('deckBuilder.maybeboard') || 'MAYBEBOARD'} ({maybeboardCards})</h2>
                                    {canEdit && (
                                        <button
                                            className="add-slot-button-small"
                                            onClick={() => handleSectionAdd('maybeboard')}
                                        >
                                            <Plus size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className={`deck-cards-list ${viewMode === 'stacked' ? 'stacked-mode' : 'text-mode-columns text-columns-10'}`}>
                                    {renderListSection(deckData.maybeboard, 'maybeboard')}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Comments Section - Only show if deck is saved (has ID) */}
                {deckId && (
                    <div id="comments-section" className="deck-comments-wrapper">
                        <CommentSection deckId={deckId} />
                    </div>
                )}

                {showModal && (
                    <CardSearchModal
                        isOpen={showModal}
                        onClose={() => setShowModal(false)}
                        onSelect={handleSelectFromModal}
                        type={modalType}
                        heroClass={deckData.hero?.clase} // Pass hero class string for filtering
                        format={deckData.format}
                    />
                )}

                {/* Mobile Card Preview Modal */}
                {previewCard && (
                    <CardPreviewModal
                        card={previewCard.item.card || previewCard.item}
                        onClose={() => setPreviewCard(null)}
                    >

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', width: '100%', maxWidth: '350px' }}>
                            {/* Move Options */}
                            {['mainDeck', 'sideboard', 'maybeboard'].includes(previewCard.section) && previewCard.section !== 'mainDeck' && (
                                <button className="preview-action-btn" onClick={() => { moveCard(previewCard.item, previewCard.section, 'mainDeck'); setPreviewCard(null); }}>
                                    {t('deckBuilder.moveToDeck') || 'To Main Deck'}
                                </button>
                            )}

                            {['mainDeck', 'sideboard', 'maybeboard'].includes(previewCard.section) && (previewCard.item.card?.tipo?.toLowerCase().includes('weapon') || previewCard.item.card?.tipo?.toLowerCase().includes('arma') || previewCard.item.card?.tipo?.toLowerCase().includes('equipment') || previewCard.item.card?.tipo?.toLowerCase().includes('equipamiento')) && previewCard.section !== 'equipment' && (
                                <button className="preview-action-btn" onClick={() => { moveCard(previewCard.item, previewCard.section, 'equipment'); setPreviewCard(null); }}>
                                    {t('deckBuilder.moveToEquipment') || 'To Equipment'}
                                </button>
                            )}

                            {(['mainDeck', 'sideboard', 'equipment'].includes(previewCard.section) || previewCard.section === 'mainDeck') && previewCard.section !== 'sideboard' && (
                                <button className="preview-action-btn" onClick={() => { moveCard(previewCard.item, previewCard.section, 'sideboard'); setPreviewCard(null); }}>
                                    {t('deckBuilder.moveToSideboard') || 'To Sideboard'}
                                </button>
                            )}

                            {(['mainDeck', 'sideboard', 'equipment'].includes(previewCard.section) || previewCard.section === 'equipment') && previewCard.section !== 'maybeboard' && (
                                <button className="preview-action-btn" onClick={() => { moveCard(previewCard.item, previewCard.section, 'maybeboard'); setPreviewCard(null); }}>
                                    {t('deckBuilder.moveToMaybeboard') || 'To Maybeboard'}
                                </button>
                            )}

                            <button className="preview-action-btn danger" style={{ gridColumn: '1 / -1', background: 'rgba(220, 38, 38, 0.8)' }} onClick={() => { removeCard(previewCard.item.card?.id || previewCard.item.id, previewCard.section); setPreviewCard(null); }}>
                                <X size={16} style={{ marginRight: '5px' }} />
                                {t('deckBuilder.remove') || 'Remove'}
                            </button>
                        </div>
                    </CardPreviewModal>
                )}

                {/* Card Hover Preview Overlay */}
                {hoveredCard && (
                    <div className={`card-preview-overlay visible ${hoveredCard.side}`}>
                        <img src={hoveredCard.image} alt="Preview" />
                    </div>
                )}

                {/* Toast Notification */}
                {showToast && (
                    <Toast
                        message={toastMessage}
                        type={toastType}
                        onClose={() => setShowToast(false)}
                    />
                )}

                {/* Deck Playtester Modal */}
                {showPlaytester && (
                    <DeckPlaytester
                        deck={deckData}
                        onClose={() => setShowPlaytester(false)}
                    />
                )}
            </div>
        </div >
    );
};

export default DeckBuilder;
