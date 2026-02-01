/**
 * Wants.jsx - Página para gestión de listas de cartas buscadas
 * 
 * Permite a los usuarios crear, ver y gestionar sus listas de cartas que desean obtener.
 * Incluye funcionalidad de compartir mediante enlaces únicos.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { WantsService } from '../services/api';
import CardModal from '../components/CardModal';
import {
    Heart, Plus, Trash2, Share2, Copy, Check, Edit2,
    X, ExternalLink, RefreshCw, Eye, EyeOff, List
} from 'lucide-react';
import '../styles/Wants.css';

/**
 * Componente principal de gestión de Wants
 */
const Wants = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();

    // Estado
    const [lists, setLists] = useState([]);
    const [selectedList, setSelectedList] = useState(null);
    const [listItems, setListItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingItems, setLoadingItems] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);

    // UI State
    const [showNewListModal, setShowNewListModal] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [editingList, setEditingList] = useState(null);
    const [editName, setEditName] = useState('');
    const [copiedLink, setCopiedLink] = useState(false);

    // Cargar listas al montar
    useEffect(() => {
        if (user) {
            fetchLists();
        }
    }, [user]);

    // Cargar items cuando se selecciona una lista
    useEffect(() => {
        if (selectedList) {
            fetchListItems(selectedList.id);
        } else {
            setListItems([]);
        }
    }, [selectedList]);

    /**
     * Obtiene todas las listas del usuario
     */
    const fetchLists = async () => {
        setLoading(true);
        try {
            const data = await WantsService.getLists();
            setLists(data);
            // Auto-seleccionar la primera lista si existe
            if (data.length > 0 && !selectedList) {
                setSelectedList(data[0]);
            }
        } catch (error) {
            console.error('Error fetching lists:', error);
            addToast(t('common.error'), 'error');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Obtiene los items de una lista específica
     */
    const fetchListItems = async (listId) => {
        setLoadingItems(true);
        try {
            const data = await WantsService.getListItems(listId);
            setListItems(data);
        } catch (error) {
            console.error('Error fetching list items:', error);
            addToast(t('common.error'), 'error');
        } finally {
            setLoadingItems(false);
        }
    };

    /**
     * Crea una nueva lista
     */
    const handleCreateList = async () => {
        if (!newListName.trim()) return;

        try {
            const newList = await WantsService.createList(newListName.trim());
            setLists(prev => [newList, ...prev]);
            setSelectedList(newList);
            setNewListName('');
            setShowNewListModal(false);
            addToast(t('wants.list_created') || 'List created!', 'success');
        } catch (error) {
            console.error('Error creating list:', error);
            addToast(t('common.error'), 'error');
        }
    };

    /**
     * Actualiza el nombre de una lista
     */
    const handleUpdateList = async (listId) => {
        if (!editName.trim()) return;

        try {
            const updated = await WantsService.updateList(listId, { name: editName.trim() });
            setLists(prev => prev.map(l => l.id === listId ? { ...l, name: updated.name } : l));
            if (selectedList?.id === listId) {
                setSelectedList(prev => ({ ...prev, name: updated.name }));
            }
            setEditingList(null);
            setEditName('');
        } catch (error) {
            console.error('Error updating list:', error);
            addToast(t('common.error'), 'error');
        }
    };

    /**
     * Elimina una lista
     */
    const handleDeleteList = async (listId) => {
        if (!window.confirm(t('wants.confirm_delete') || 'Are you sure you want to delete this list?')) {
            return;
        }

        try {
            await WantsService.deleteList(listId);
            setLists(prev => prev.filter(l => l.id !== listId));
            if (selectedList?.id === listId) {
                setSelectedList(lists[0] || null);
            }
            addToast(t('wants.list_deleted') || 'List deleted', 'success');
        } catch (error) {
            console.error('Error deleting list:', error);
            addToast(t('common.error'), 'error');
        }
    };

    /**
     * Elimina una carta de la lista actual
     */
    const handleRemoveCard = async (cardId) => {
        if (!selectedList) return;

        try {
            await WantsService.removeCardFromList(selectedList.id, cardId);
            setListItems(prev => prev.filter(item => item.id !== cardId));
            addToast(t('wants.card_removed') || 'Card removed', 'success');
        } catch (error) {
            console.error('Error removing card:', error);
            addToast(t('common.error'), 'error');
        }
    };

    /**
     * Genera/regenera el enlace de compartir
     */
    const handleShare = async () => {
        if (!selectedList) return;

        try {
            const updated = await WantsService.regenerateShareToken(selectedList.id);
            setSelectedList(prev => ({ ...prev, share_token: updated.share_token, is_public: true }));
            setLists(prev => prev.map(l =>
                l.id === selectedList.id
                    ? { ...l, share_token: updated.share_token, is_public: true }
                    : l
            ));

            // Copiar enlace al portapapeles
            const shareUrl = `${window.location.origin}/wants/shared/${updated.share_token}`;
            await navigator.clipboard.writeText(shareUrl);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
            addToast(t('wants.link_copied') || 'Link copied to clipboard!', 'success');
        } catch (error) {
            console.error('Error sharing list:', error);
            addToast(t('common.error'), 'error');
        }
    };

    /**
     * Copia el enlace existente al portapapeles
     */
    const handleCopyLink = async () => {
        if (!selectedList?.share_token) return;

        const shareUrl = `${window.location.origin}/wants/shared/${selectedList.share_token}`;
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        addToast(t('wants.link_copied') || 'Link copied!', 'success');
    };

    /**
     * Desactiva el compartir de la lista
     */
    const handleDisableSharing = async () => {
        if (!selectedList) return;

        try {
            await WantsService.disableSharing(selectedList.id);
            setSelectedList(prev => ({ ...prev, is_public: false }));
            setLists(prev => prev.map(l =>
                l.id === selectedList.id
                    ? { ...l, is_public: false }
                    : l
            ));
            addToast(t('wants.sharing_disabled') || 'Sharing disabled', 'success');
        } catch (error) {
            console.error('Error disabling sharing:', error);
            addToast(t('common.error'), 'error');
        }
    };

    // Renderizado
    return (
        <div className="wants-page">
            {/* Sidebar con listas */}
            <aside className="wants-sidebar">
                <div className="sidebar-header">
                    <h2>
                        <Heart size={20} />
                        {t('wants.title') || 'Wants'}
                    </h2>
                    <button
                        className="btn-icon-primary"
                        onClick={() => setShowNewListModal(true)}
                        title={t('wants.new_list') || 'New List'}
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <div className="lists-container">
                    {loading ? (
                        <div className="loading-state">{t('common.loading')}</div>
                    ) : lists.length === 0 ? (
                        <div className="empty-state">
                            <List size={32} />
                            <p>{t('wants.no_lists') || 'No lists yet'}</p>
                            <button
                                className="btn-primary"
                                onClick={() => setShowNewListModal(true)}
                            >
                                {t('wants.create_first') || 'Create your first list'}
                            </button>
                        </div>
                    ) : (
                        lists.map(list => (
                            <div
                                key={list.id}
                                className={`list-item ${selectedList?.id === list.id ? 'active' : ''}`}
                                onClick={() => setSelectedList(list)}
                            >
                                {editingList === list.id ? (
                                    <div className="edit-inline">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleUpdateList(list.id);
                                                if (e.key === 'Escape') setEditingList(null);
                                            }}
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <button onClick={(e) => { e.stopPropagation(); handleUpdateList(list.id); }}>
                                            <Check size={14} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setEditingList(null); }}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="list-name">{list.name}</span>
                                        <span className="list-count">{list.card_count || 0}</span>
                                        <div className="list-actions">
                                            {list.is_public && (
                                                <Eye size={12} className="shared-indicator" title={t('wants.is_shared') || 'Shared'} />
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingList(list.id);
                                                    setEditName(list.name);
                                                }}
                                                title={t('common.edit')}
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}
                                                className="delete-btn"
                                                title={t('common.delete')}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* Contenido principal */}
            <main className="wants-content">
                {selectedList ? (
                    <>
                        <div className="content-header">
                            <h1>{selectedList.name}</h1>
                            <div className="header-actions">
                                {selectedList.is_public ? (
                                    <>
                                        <button
                                            className="btn-secondary"
                                            onClick={handleCopyLink}
                                        >
                                            {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                                            {copiedLink ? (t('wants.copied') || 'Copied!') : (t('wants.copy_link') || 'Copy Link')}
                                        </button>
                                        <button
                                            className="btn-secondary"
                                            onClick={handleShare}
                                            title={t('wants.regenerate_link') || 'Generate new link'}
                                        >
                                            <RefreshCw size={16} />
                                        </button>
                                        <button
                                            className="btn-secondary danger"
                                            onClick={handleDisableSharing}
                                            title={t('wants.disable_sharing') || 'Disable sharing'}
                                        >
                                            <EyeOff size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className="btn-primary"
                                        onClick={handleShare}
                                    >
                                        <Share2 size={16} />
                                        {t('wants.share') || 'Share'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {loadingItems ? (
                            <div className="loading-state">{t('common.loading')}</div>
                        ) : listItems.length === 0 ? (
                            <div className="empty-content">
                                <Heart size={48} />
                                <h3>{t('wants.empty_list') || 'This list is empty'}</h3>
                                <p>{t('wants.empty_hint') || 'Add cards from the card database or when viewing decks'}</p>
                                <button
                                    className="btn-primary"
                                    onClick={() => navigate('/cards')}
                                >
                                    {t('nav.explore_cards') || 'Explore Cards'}
                                </button>
                            </div>
                        ) : (
                            <div className="cards-grid">
                                {listItems.map(card => (
                                    <div
                                        key={card.item_id || card.id}
                                        className="wants-card"
                                        onClick={() => setSelectedCard(card)}
                                    >
                                        <div className="card-image-container">
                                            {card.imagen ? (
                                                <img src={card.imagen} alt={card.name} />
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
                                        <button
                                            className="remove-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveCard(card.id);
                                            }}
                                            title={t('common.remove')}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="no-list-selected">
                        <Heart size={64} />
                        <h2>{t('wants.select_list') || 'Select a list'}</h2>
                        <p>{t('wants.select_hint') || 'Choose a list from the sidebar or create a new one'}</p>
                    </div>
                )}
            </main>

            {/* Modal para nueva lista */}
            {showNewListModal && (
                <div className="modal-overlay" onClick={() => setShowNewListModal(false)}>
                    <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowNewListModal(false)}>
                            <X size={20} />
                        </button>
                        <h2>{t('wants.new_list') || 'New List'}</h2>
                        <input
                            type="text"
                            placeholder={t('wants.list_name_placeholder') || 'List name...'}
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateList();
                            }}
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowNewListModal(false)}>
                                {t('common.cancel')}
                            </button>
                            <button className="btn-primary" onClick={handleCreateList}>
                                {t('wants.create') || 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de carta */}
            {selectedCard && (
                <CardModal
                    card={selectedCard}
                    onClose={() => setSelectedCard(null)}
                />
            )}
        </div>
    );
};

export default Wants;
