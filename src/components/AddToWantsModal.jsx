/**
 * AddToWantsModal.jsx - Modal para añadir cartas a listas de wants
 * 
 * Se muestra cuando el usuario hace clic en "Add to Wants" desde el CardModal.
 * Permite seleccionar una lista existente o crear una nueva.
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Heart, List } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { WantsService } from '../services/api';
import '../styles/Wants.css';

/**
 * Modal para añadir una carta a una lista de wants
 * @param {Object} props
 * @param {Object} props.card - La carta a añadir
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Function} props.onSuccess - Callback opcional al añadir exitosamente
 */
const AddToWantsModal = ({ card, onClose, onSuccess }) => {
    const { t } = useLanguage();
    const { addToast } = useToast();

    // Estado
    const [lists, setLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedListId, setSelectedListId] = useState(null);
    const [showNewList, setShowNewList] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Cargar listas al abrir
    useEffect(() => {
        fetchLists();
    }, []);

    /**
     * Obtiene las listas del usuario
     */
    const fetchLists = async () => {
        try {
            const data = await WantsService.getLists();
            setLists(data);
            // Auto-seleccionar la primera lista si existe
            if (data.length > 0) {
                setSelectedListId(data[0].id);
            } else {
                setShowNewList(true); // Mostrar crear nueva si no hay listas
            }
        } catch (error) {
            console.error('Error fetching lists:', error);
            addToast(t('common.error'), 'error');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Crea una nueva lista y la selecciona
     */
    const handleCreateList = async () => {
        if (!newListName.trim()) return;

        try {
            const newList = await WantsService.createList(newListName.trim());
            setLists(prev => [newList, ...prev]);
            setSelectedListId(newList.id);
            setNewListName('');
            setShowNewList(false);
            addToast(t('wants.list_created') || 'List created!', 'success');
        } catch (error) {
            console.error('Error creating list:', error);
            addToast(t('common.error'), 'error');
        }
    };

    /**
     * Añade la carta a la lista seleccionada
     */
    const handleAddToList = async () => {
        if (!selectedListId || !card) return;

        setSubmitting(true);
        try {
            await WantsService.addCardToList(selectedListId, card.id, quantity);
            addToast(t('wants.card_added') || 'Card added to wants!', 'success');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error adding card to list:', error);
            addToast(t('common.error'), 'error');
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * Cierra el modal al hacer clic en el fondo
     */
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay add-to-wants-overlay" onClick={handleBackdropClick}>
            <div className="modal-content add-to-wants-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="modal-header">
                    <Heart size={24} className="text-red" />
                    <h2>{t('wants.add_to_wants') || 'Add to Wants'}</h2>
                </div>

                {/* Preview de la carta */}
                <div className="card-preview">
                    {card.imagen ? (
                        <img src={card.imagen} alt={card.name} />
                    ) : (
                        <div className="card-placeholder-small">
                            <span>{card.name}</span>
                        </div>
                    )}
                    <div className="card-preview-info">
                        <span className="card-name">{card.name}</span>
                        <span className="card-set">{card.set_code}</span>
                    </div>
                </div>

                {/* Selector de cantidad */}
                <div className="quantity-selector">
                    <label>{t('wants.quantity') || 'Quantity'}</label>
                    <div className="quantity-controls">
                        <button
                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            disabled={quantity <= 1}
                        >
                            -
                        </button>
                        <span>{quantity}</span>
                        <button onClick={() => setQuantity(q => q + 1)}>
                            +
                        </button>
                    </div>
                </div>

                {/* Lista de listas o loading */}
                {loading ? (
                    <div className="loading-state small">{t('common.loading')}</div>
                ) : (
                    <>
                        <div className="lists-section">
                            <div className="section-header">
                                <span>{t('wants.select_list') || 'Select a list'}</span>
                                <button
                                    className="btn-link"
                                    onClick={() => setShowNewList(!showNewList)}
                                >
                                    <Plus size={14} />
                                    {t('wants.new_list') || 'New'}
                                </button>
                            </div>

                            {/* Crear nueva lista inline */}
                            {showNewList && (
                                <div className="new-list-inline">
                                    <input
                                        type="text"
                                        placeholder={t('wants.list_name_placeholder') || 'List name...'}
                                        value={newListName}
                                        onChange={(e) => setNewListName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleCreateList();
                                            if (e.key === 'Escape') setShowNewList(false);
                                        }}
                                        autoFocus
                                    />
                                    <button onClick={handleCreateList} disabled={!newListName.trim()}>
                                        <Check size={14} />
                                    </button>
                                </div>
                            )}

                            {/* Lista de listas existentes */}
                            {lists.length === 0 && !showNewList ? (
                                <div className="no-lists-hint">
                                    <List size={20} />
                                    <p>{t('wants.no_lists_hint') || 'Create a list to start adding cards'}</p>
                                </div>
                            ) : (
                                <div className="list-options">
                                    {lists.map(list => (
                                        <label
                                            key={list.id}
                                            className={`list-option ${selectedListId === list.id ? 'selected' : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                name="wantsList"
                                                value={list.id}
                                                checked={selectedListId === list.id}
                                                onChange={() => setSelectedListId(list.id)}
                                            />
                                            <span className="list-name">{list.name}</span>
                                            <span className="list-count">{list.card_count || 0}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Acciones */}
                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>
                        {t('common.cancel')}
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleAddToList}
                        disabled={!selectedListId || submitting}
                    >
                        {submitting ? t('common.loading') : (t('wants.add') || 'Add')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddToWantsModal;
