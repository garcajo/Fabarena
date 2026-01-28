
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { CollectionService } from '../services/api';
import CardFilters from '../components/CardFilters';
import Pagination from '../components/Pagination';
import CardModal from '../components/CardModal';
import AdBanner from '../components/AdBanner';
import { Package, Plus } from 'lucide-react';
import '../styles/Card.css';
import '../styles/CardGrid.css';
import '../styles/Collection.css';

const Collection = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 24;

    const [filters, setFilters] = useState({
        search: '',
        clase: '',
        set: '',
        rareza: '',
        pitch: '',
        costo: ''
    });

    const [selectedCard, setSelectedCard] = useState(null);

    // Initial load check
    useEffect(() => {
        if (!user && !loading) { // Wait for auth check? Usually protected route handles this, but good safety.
            // navigate('/login');
        }
    }, [user, navigate, loading]);

    const fetchCollection = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await CollectionService.getCollection({
                page: currentPage - 1, // API is 0-indexed
                pageSize: PAGE_SIZE,
                ...filters
            });

            setCards(result.data || []);
            setTotalCount(result.count || 0);

        } catch (err) {
            console.error('Failed to load collection:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchCollection();
        }
    }, [currentPage, filters, user]);

    // Handlers
    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1); // Reset to page 1 on filter change
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    if (!user) return null; // Or loading spinner

    return (

        <div className="container">
            <AdBanner position="top" adSlot="8911247227" />
            <div className="collection-container">
                <div className="collection-header">
                    <div className="collection-title-section">
                        <h1>
                            <Package size={32} />
                            {t('collection.title')}
                        </h1>
                        <p className="collection-subtitle">
                            {t('collection.subtitle')}
                        </p>
                    </div>

                    <div className="collection-actions">
                        <button
                            className="action-btn primary"
                            onClick={() => navigate('/cards')}
                        >
                            <Plus size={18} />
                            {t('collection.browse_db')}
                        </button>
                    </div>
                </div>

                <CardFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    isLoading={loading}
                />

                {/* reuse card-grid styling from CardList? Or custom? Let's use custom simple grid for now reusing Cards.css classes if possible */}
                {loading ? (
                    <div className="text-center py-20">{t('common.loading')}</div>
                ) : cards.length === 0 ? (
                    <div className="decks-empty-container" style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>
                            {t('collection.empty_desc')}
                        </div>
                    </div>
                ) : (
                    <div className="card-grid">
                        {cards.map((item) => (
                            <div
                                key={item.collection_id}
                                className="card-item"
                                onClick={() => setSelectedCard(item)}
                                style={{ position: 'relative' }}
                            >
                                <div className="card-image-wrapper">
                                    <img
                                        src={item.imagen}
                                        alt={item.name}
                                        className="card-image"
                                        loading="lazy"
                                    />
                                    {/* Quantity Badge */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px',
                                        backgroundColor: 'rgba(220, 38, 38, 0.9)',
                                        color: 'white',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                        zIndex: 5
                                    }}>
                                        x{item.quantity}
                                    </div>
                                    {item.is_foil && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '10px',
                                            left: '10px',
                                            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                                            color: '#000',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            zIndex: 5
                                        }}>
                                            FOIL
                                        </div>
                                    )}
                                </div>
                                <div className="card-info">
                                    <h3 className="card-name">{item.name}</h3>
                                    <div className="card-meta">
                                        <span className={`pitch-dot pitch-${item.pitch}`}></span>
                                        <span>{item.costo} Cost</span>
                                        {item.poder && <span>{item.poder} Pow</span>}
                                        {item.defensa && <span>{item.defensa} Def</span>}
                                    </div>
                                    <div className="card-meta-secondary">
                                        <small>{item.rarity} • {item.set_code}</small>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />

                {selectedCard && (
                    <CardModal
                        card={selectedCard}
                        onClose={() => setSelectedCard(null)}
                        onCollectionUpdate={fetchCollection}
                    />
                )}
            </div>
        </div>
    );
};

export default Collection;
