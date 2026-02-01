/**
 * SharedWantsList.jsx - Página pública para ver listas compartidas
 * 
 * Accesible mediante /wants/shared/:shareToken
 * Muestra una lista de wants en modo solo lectura.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { WantsService } from '../services/api';
import CardModal from '../components/CardModal';
import { Heart, ArrowLeft } from 'lucide-react';
import '../styles/Wants.css';

/**
 * Componente para visualizar una lista compartida
 */
const SharedWantsList = () => {
    const { shareToken } = useParams();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [list, setList] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCard, setSelectedCard] = useState(null);

    // Cargar lista al montar
    useEffect(() => {
        if (shareToken) {
            fetchSharedList();
        }
    }, [shareToken]);

    /**
     * Obtiene la lista pública por su token
     */
    const fetchSharedList = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await WantsService.getSharedList(shareToken);
            setList(data);
        } catch (err) {
            console.error('Error fetching shared list:', err);
            setError(t('wants.list_not_found') || 'List not found or no longer shared');
        } finally {
            setLoading(false);
        }
    };

    // Estados de carga y error
    if (loading) {
        return (
            <div className="shared-wants-page loading">
                <div className="loading-spinner" />
                <p>{t('common.loading')}</p>
            </div>
        );
    }

    if (error || !list) {
        return (
            <div className="shared-wants-page error">
                <Heart size={64} className="error-icon" />
                <h2>{t('wants.list_not_found') || 'List Not Found'}</h2>
                <p>{error || (t('wants.list_unavailable') || 'This list may have been deleted or is no longer shared.')}</p>
                <button className="btn-primary" onClick={() => navigate('/')}>
                    <ArrowLeft size={16} />
                    {t('common.back') || 'Back to Home'}
                </button>
            </div>
        );
    }

    return (
        <div className="shared-wants-page">
            <header className="shared-header">
                <button className="btn-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} />
                </button>
                <div className="header-content">
                    <Heart size={24} className="text-red" />
                    <h1>{list.name}</h1>
                </div>
                <span className="cards-count">
                    {list.cards?.length || 0} {t('wants.cards') || 'cards'}
                </span>
            </header>

            {list.cards?.length === 0 ? (
                <div className="empty-shared-list">
                    <Heart size={48} />
                    <p>{t('wants.empty_shared') || 'This list has no cards yet'}</p>
                </div>
            ) : (
                <div className="shared-cards-grid">
                    {list.cards.map((card, index) => (
                        <div
                            key={card.id || index}
                            className="wants-card"
                            onClick={() => setSelectedCard(card)}
                        >
                            <div className="card-image-container">
                                {card.imagen ? (
                                    <img src={card.imagen} alt={card.name} loading="lazy" />
                                ) : (
                                    <div className="card-placeholder">
                                        <span>{card.name}</span>
                                    </div>
                                )}
                                {card.quantity > 1 && (
                                    <span className="quantity-badge">x{card.quantity}</span>
                                )}
                            </div>
                            <div className="card-info">
                                <span className="card-name">{card.name}</span>
                                <span className="card-set">{card.set_code}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de carta (solo vista) */}
            {selectedCard && (
                <CardModal
                    card={selectedCard}
                    onClose={() => setSelectedCard(null)}
                />
            )}
        </div>
    );
};

export default SharedWantsList;
