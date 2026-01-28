import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Layers, Sword, Calendar, Trash2, FolderInput, X, Heart, MessageSquare, Eye } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { DeckService, CardService, FolderService } from '../services/api'; // Import DeckService, CardService, and FolderService
import AdBanner from '../components/AdBanner';
import CustomSelect from '../components/common/CustomSelect';
import FolderSidebar from '../components/FolderSidebar';
import '../styles/Decks.css';

const Decks = ({ mode = 'public' }) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const location = useLocation();

    // Force scroll to top on mount or mode change
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, [mode, location.pathname]);

    return (
        <div className="decks-page">
            <div className="container mx-auto">
                <AdBanner position="top" adSlot="8911247227" />
                <div className="decks-header">
                    <h1 className="decks-title">
                        <Layers size={42} />
                        {mode === 'mine' ? (t('decks.title') || 'My Decks') : (t('nav.explore_decks') || 'Explore Decks')}
                    </h1>
                </div>

                {!user && mode === 'mine' ? (
                    <div className="decks-login-prompt">
                        <h2 className="login-prompt-title">{t('auth.join_community_title') || 'Join the Arena'}</h2>
                        <p className="login-prompt-desc">
                            {t('auth.decks_login_msg') || 'Sign up or log in to create and manage your own decks.'}
                        </p>
                        <div className="login-prompt-actions">
                            <Link to="/login" className="prompt-btn-primary">
                                {t('auth.login_button') || 'Login'}
                            </Link>
                            <Link to="/register" className="prompt-btn-secondary">
                                {t('auth.submit') || 'Register'}
                            </Link>
                        </div>
                    </div>
                ) : (
                    <DeckList key={`${location.key}-${mode}`} mode={mode} />
                )}
            </div>
        </div>
    );
};

const DeckList = ({ mode }) => {
    const { t } = useLanguage();
    const { user } = useAuth(); // Needed to check ownership for delete
    const [decks, setDecks] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    // Folder filter state (only for 'mine' mode)
    const [selectedFolderId, setSelectedFolderId] = React.useState(null);

    // Active filters for fetching
    const [filters, setFilters] = React.useState({
        hero: '',
        username: '',
        format: '',
        sort: 'newest'
    });

    // Temporary filters for input state (manual trigger)
    const [tempFilters, setTempFilters] = React.useState({
        hero: '',
        username: '',
        format: '',
        sort: 'newest'
    });



    // Hero Autocomplete State
    const [heroList, setHeroList] = React.useState([]);
    const [showHeroDropdown, setShowHeroDropdown] = React.useState(false);
    const heroInputRef = React.useRef(null);

    // Fetch heroes for autocomplete on mount
    React.useEffect(() => {
        const fetchHeroes = async () => {
            try {
                // Fetch cards of type Hero, Hero Young, Hero Adult
                const response = await CardService.getCards({ type: ['Hero', 'Hero Young', 'Hero Adult'], pageSize: 200 });
                if (response && response.data) {
                    // Extract unique names and sort
                    const uniqueHeroes = [...new Set(response.data.map(c => c.name))].sort();
                    setHeroList(uniqueHeroes);
                }
            } catch (e) {
                console.error("Failed to fetch heroes for autocomplete", e);
            }
        };
        fetchHeroes();

        // Close dropdown on outside click
        const handleClickOutside = (event) => {
            if (heroInputRef.current && !heroInputRef.current.contains(event.target)) {
                setShowHeroDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadDecks = async (currentFilters) => {
        setLoading(true);
        try {
            // Pass mode as scope ('public' or 'mine')
            const result = await DeckService.getDecks(mode, currentFilters);
            if (result && result.data) {
                console.log("[Decks] Loaded decks:", result);
                setDecks(result.data); // Use result.data (the array), not the whole object
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Initial Load - use initial filters
    React.useEffect(() => {
        loadDecks(filters);
    }, [mode, filters]);

    const handleInputChange = (key, value) => {
        setTempFilters(prev => ({ ...prev, [key]: value }));
        if (key === 'hero') {
            setShowHeroDropdown(true);
        }
    };

    const handleHeroSelect = (heroName) => {
        setTempFilters(prev => ({ ...prev, hero: heroName }));
        setShowHeroDropdown(false);
    };

    const handleSearch = () => {
        // Commit temp filters to active filters to trigger load
        setFilters(tempFilters);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
            setShowHeroDropdown(false);
        }
    };

    // Opens delete confirmation modal
    const handleDeleteDeck = (e, deckId, deckName) => {
        e.preventDefault();
        e.stopPropagation();
        setDeleteModal({ show: true, deckId, deckName: deckName || 'this deck' });
    };

    // Actually performs the delete after modal confirmation
    const confirmDelete = async () => {
        if (!deleteModal.deckId) return;
        try {
            await DeckService.deleteDeck(deleteModal.deckId);
            setDecks(prev => prev.filter(d => d.id !== deleteModal.deckId));
            setDeleteModal({ show: false, deckId: null, deckName: '' });
        } catch (err) {
            console.error("Failed to delete deck:", err);
            alert("Failed to delete deck. Please try again.");
            setDeleteModal({ show: false, deckId: null, deckName: '' });
        }
    };

    // Filtered Hero List for Dropdown
    const filteredHeroes = heroList.filter(h =>
        h.toLowerCase().includes(tempFilters.hero.toLowerCase())
    );

    // Filter decks by selected folder (client-side) - Must be before any conditional returns!
    const filteredDecks = React.useMemo(() => {
        if (mode !== 'mine' || selectedFolderId === null) return decks;
        if (selectedFolderId === 'unassigned') {
            return decks.filter(d => !d.folder_id);
        }
        return decks.filter(d => d.folder_id === selectedFolderId);
    }, [decks, selectedFolderId, mode]);

    // Move to folder state
    const [moveModal, setMoveModal] = React.useState({
        show: false,
        deckId: null,
        folders: []
    });

    // Delete confirmation modal state (replaces window.confirm which gets dismissed by re-renders)
    const [deleteModal, setDeleteModal] = React.useState({
        show: false,
        deckId: null,
        deckName: ''
    });

    // Handler to open move modal
    const openMoveModal = async (e, deckId) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const folders = await FolderService.getFolders();
            setMoveModal({
                show: true,
                deckId,
                folders: folders || []
            });
        } catch (error) {
            console.error("Failed to load folders for modal", error);
        }
    };

    const handleMoveDeck = async (deckId, folderId) => {
        await handleAssignDeckToFolder(deckId, folderId);
        setMoveModal({ ...moveModal, show: false });
    };

    const handleAssignDeckToFolder = async (deckId, folderId) => {
        try {
            await FolderService.assignDeckToFolder(deckId, folderId);
            // Update local state
            setDecks(prev => prev.map(d =>
                d.id === deckId ? { ...d, folder_id: folderId } : d
            ));
        } catch (error) {
            console.error('Error assigning deck to folder:', error);
        }
    };

    const renderFilterBar = () => (
        <div className="decks-filter-bar">
            {/* Hero Filter with Autocomplete */}
            <div className="filter-group" ref={heroInputRef}>
                <label>
                    {t('filters.label_hero') || 'Hero'}
                </label>
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        placeholder={t('filters.placeholder_hero')}
                        value={tempFilters.hero}
                        onChange={(e) => handleInputChange('hero', e.target.value)}
                        onFocus={() => setShowHeroDropdown(true)}
                        onKeyDown={handleKeyDown}
                    />
                    {/* Dropdown */}
                    {showHeroDropdown && tempFilters.hero && filteredHeroes.length > 0 && (
                        <div className="hero-autocomplete-dropdown">
                            {filteredHeroes.map(h => (
                                <div
                                    key={h}
                                    onClick={() => handleHeroSelect(h)}
                                    className="hero-autocomplete-item"
                                >
                                    {h}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Username Filter */}
            <div className="filter-group">
                <label>
                    {t('filters.label_username') || 'Creator'}
                </label>
                <input
                    type="text"
                    placeholder={t('filters.placeholder_username')}
                    value={tempFilters.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    onKeyDown={handleKeyDown}
                />
            </div>

            {/* Format Filter */}
            <div className="filter-group">
                <label>
                    {t('filters.label_format') || 'Format'}
                </label>
                <CustomSelect
                    options={[
                        { value: '', label: t('filters.format_any') || 'Any Format' },
                        { value: 'cc', label: t('filters.format_cc') || 'Classic Constructed' },
                        { value: 'sa', label: t('filters.format_sa') || 'Silver Age' }
                    ]}
                    value={tempFilters.format}
                    onChange={(value) => handleInputChange('format', value)}
                    placeholder={t('filters.format_any') || 'Any Format'}
                />
            </div>

            {/* Sort Filter */}
            <div className="filter-group">
                <label>
                    {t('filters.label_sort') || 'Sort'}
                </label>
                <CustomSelect
                    options={[
                        { value: 'newest', label: t('filters.sort_newest') },
                        { value: 'likes', label: t('filters.sort_likes') || 'Most Liked' },
                        { value: 'oldest', label: t('filters.sort_oldest') }
                    ]}
                    value={tempFilters.sort}
                    onChange={(value) => handleInputChange('sort', value)}
                    placeholder={t('filters.sort_newest')}
                />
            </div>

            {/* Search Button */}
            <div className="filter-group">
                <button
                    onClick={handleSearch}
                    className="search-btn"
                >
                    <Sword size={18} />
                    {t('hero.search_button') || 'Search'}
                </button>
            </div>
        </div>
    );

    const renderEmptyState = () => {
        // If we have filters active (even if just default sort, but mainly if hero/username/sort changes)
        // Actually, if decks are empty, we check if it's because of filters or because no decks exist at all.
        // For 'public' mode, "no decks exist" is rare unless app is new.
        // For 'mine' mode, "no decks exist" is common for new users.

        // A simple heuristic: if we searched (filters are set beyond defaults or just length is 0 after load)
        const hasActiveFilters = filters.hero || filters.username || filters.sort !== 'newest';

        if (decks.length === 0) {
            if (hasActiveFilters || mode === 'public') {
                return (
                    <div className="decks-empty-container" style={{ textAlign: 'center', marginTop: '4rem' }}>
                        <div className="decks-empty-message" style={{ fontSize: '1.2rem', color: '#aaa' }}>
                            {t('decks.no_results_filters') || 'No decks to show'}
                        </div>
                    </div>
                );
            }

            return (
                <div className="decks-empty-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '2rem' }}>
                    <div className="decks-empty-message">
                        {t('decks.empty_desc') || 'No decks found'}
                    </div>
                    {/* Show create button below message for My Decks */}
                    {mode === 'mine' && (
                        <Link to="/decks/new" className="deck-card create-new" style={{ maxWidth: '300px', height: 'auto', aspectRatio: '2/3', maxHeight: '400px' }}>
                            <div className="create-icon-wrapper">
                                <Plus size={32} />
                            </div>
                            <span className="create-text">{t('decks.create_button') || 'Forge New Deck'}</span>
                        </Link>
                    )}
                </div>
            )
        }
        return null;
    };

    const renderListView = () => (
        <div className="decks-list-container">
            <div className="decks-list-header">
                <div className="list-header-cell cell-title">{t('hero.filter_title') || 'Title'}</div>
                <div className="list-header-cell cell-format">{t('filters.label_class') || 'Format'}</div>
                <div className="list-header-cell cell-creator">{t('hero.filter_user') || 'Creator'}</div>
                <div className="list-header-cell cell-date">{t('common.date') || 'Date'}</div>
                {mode === 'mine' && <div className="list-header-cell cell-actions">{t('common.action')}</div>}
            </div>
            <div className="decks-list-body">
                {decks.map(deck => {
                    let hero = deck.hero;
                    if (typeof hero === 'string') { try { hero = JSON.parse(hero); } catch (e) { } }
                    const isOwner = user && user.id === deck.user_id;

                    return (
                        <div key={deck.id} className="decks-list-row-wrapper">
                            <Link to={`/decks/${deck.id}`} className="decks-list-row">
                                <div className="list-cell cell-title">
                                    <div className="list-hero-avatar" style={{ backgroundImage: `url(${hero?.imagen || '/placeholder-hero.jpg'})` }}></div>
                                    <div className="list-deck-info">
                                        <span className="list-deck-name">{deck.name}</span>
                                        <span className="list-hero-name">{hero?.name || 'Unknown Hero'}</span>
                                    </div>
                                </div>
                                <div className="list-cell cell-format">
                                    <span className={`format-badge-small ${deck.format === 'cc' ? 'format-cc' : 'format-sa'}`}>
                                        {deck.format === 'cc' ? 'CC' : 'Silver'}
                                    </span>
                                </div>
                                <div className="list-cell cell-creator">
                                    <div className="creator-info-wrapper">
                                        <span className="creator-name">{deck.username || 'Unknown'}</span>
                                        <div className="deck-engagement-stats">
                                            <div className="engagement-stat-item" title={t('deckBuilder.views') || 'Views'}>
                                                <Eye size={14} className="opacity-50" />
                                                <span>{deck.views_count || 0}</span>
                                            </div>
                                            <div className="engagement-stat-item" title={t('deckBuilder.addLike') || 'Likes'}>
                                                <Heart size={14} className={deck.likes_count > 0 ? 'text-red fill-red' : 'opacity-50'} />
                                                <span>{deck.likes_count || 0}</span>
                                            </div>
                                            <div className="engagement-stat-item" title={t('deckBuilder.comments') || 'Comments'}>
                                                <MessageSquare size={14} className={deck.comments_count > 0 ? 'text-blue' : 'opacity-50'} />
                                                <span>{deck.comments_count || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="list-cell cell-date">
                                    {new Date(deck.updated_at).toLocaleDateString()}
                                </div>
                            </Link>

                            {isOwner && (
                                <div className="flex items-center gap-2">
                                    <button
                                        className="list-action-btn"
                                        style={{ color: '#f97316' }}
                                        onClick={(e) => openMoveModal(e, deck.id)}
                                        title={t('folders.moveTo') || "Move to Folder"}
                                        data-label={t('folders.moveTo') || "Move to Folder"}
                                    >
                                        <FolderInput size={18} />
                                    </button>
                                    <button
                                        className="list-action-btn list-action-btn-danger"
                                        onClick={(e) => handleDeleteDeck(e, deck.id, deck.name)}
                                        title={t('common.delete') || "Delete"}
                                        data-label={t('common.delete') || "Delete"}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );



    return (
        <div className="decks-grid-container">
            {renderFilterBar()}

            {mode === 'mine' && (
                <div className="decks-with-sidebar">
                    <FolderSidebar
                        selectedFolderId={selectedFolderId}
                        onFolderSelect={setSelectedFolderId}
                        onAssignDeck={handleAssignDeckToFolder}
                    />
                    <div className="decks-main-content">
                        {loading ? (
                            <div className="text-center py-20 text-white opacity-50">{t('common.loading')}</div>
                        ) : filteredDecks.length === 0 ? (
                            renderEmptyState()
                        ) : (
                            <>
                                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', width: '100%', boxSizing: 'border-box' }}>
                                    <Link to="/decks/new" className="create-deck-btn-small">
                                        <Plus size={18} />
                                        {t('decks.create_button') || 'New Deck'}
                                    </Link>
                                </div>
                                {renderListView()}
                            </>
                        )}
                    </div>
                </div>
            )}

            {mode !== 'mine' && (
                <>
                    {loading ? (
                        <div className="text-center py-20 text-white opacity-50">{t('common.loading')}</div>
                    ) : decks.length === 0 ? (
                        renderEmptyState()
                    ) : (
                        <>{renderListView()}</>
                    )}
                </>
            )}

            {/* Move to Folder Modal */}
            {moveModal.show && (
                <div className="move-modal-overlay" onClick={() => setMoveModal({ ...moveModal, show: false })}>
                    <div
                        className="move-modal-content"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="move-modal-header">
                            <h3 className="move-modal-title">
                                <FolderInput size={20} />
                                {t('folders.moveTo') || 'Move to Folder'}
                            </h3>
                            <button
                                onClick={() => setMoveModal({ ...moveModal, show: false })}
                                className="move-modal-close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="move-modal-body">
                            {/* All Decks (Unassign) Option */}
                            <button
                                onClick={() => handleMoveDeck(moveModal.deckId, null)}
                                className="move-modal-item"
                            >
                                <div className="move-folder-icon default">
                                    <Layers size={16} />
                                </div>
                                <span className="move-folder-name">{t('nav.all_decks') || 'All Decks'}</span>
                            </button>

                            {moveModal.folders.map(folder => (
                                <button
                                    key={folder.id}
                                    onClick={() => handleMoveDeck(moveModal.deckId, folder.id)}
                                    className="move-modal-item"
                                >
                                    <div className="move-folder-icon" style={{ backgroundColor: `${folder.color}20` }}>
                                        <div className="move-folder-dot" style={{ backgroundColor: folder.color || '#C52222' }} />
                                    </div>
                                    <span className="move-folder-name">{folder.name}</span>
                                </button>
                            ))}

                            {moveModal.folders.length === 0 && (
                                <p className="move-modal-empty">
                                    {t('folders.noFolders') || 'No folders created yet'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.show && (
                <div className="move-modal-overlay" onClick={() => setDeleteModal({ show: false, deckId: null, deckName: '' })}>
                    <div
                        className="move-modal-content"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="move-modal-header">
                            <h3 className="move-modal-title">
                                <Trash2 size={20} />
                                {t('decks.confirm_delete_title') || 'Delete Deck'}
                            </h3>
                            <button
                                onClick={() => setDeleteModal({ show: false, deckId: null, deckName: '' })}
                                className="move-modal-close"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="move-modal-body" style={{ padding: '1.5rem' }}>
                            <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1.5rem', textAlign: 'center' }}>
                                {t('decks.confirm_delete') || 'Are you sure you want to delete'} <strong>"{deleteModal.deckName}"</strong>?
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <button
                                    onClick={() => setDeleteModal({ show: false, deckId: null, deckName: '' })}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '8px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {t('common.cancel') || 'Cancel'}
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: 'var(--color-primary-red)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {t('common.delete') || 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Decks;
