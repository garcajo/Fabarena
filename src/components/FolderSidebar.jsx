import React, { useState, useEffect } from 'react';
import { Folder, FolderPlus, MoreVertical, Edit2, Trash2, X, Check } from 'lucide-react';
import { FolderService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import '../styles/FolderSidebar.css';

/**
 * FolderSidebar - Sidebar component for managing deck folders
 * 
 * @param {string} selectedFolderId - Current active folder filter
 * @param {function} onFolderSelect - Callback when folder is selected
 * @param {function} onAssignDeck - Callback when deck is dragged to folder
 */
const FolderSidebar = ({ selectedFolderId, onFolderSelect, onAssignDeck }) => {
    const { t } = useLanguage();
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateInput, setShowCreateInput] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [editingFolder, setEditingFolder] = useState(null);
    const [editName, setEditName] = useState('');
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const [dragOverFolderId, setDragOverFolderId] = useState(null);

    // Fetch folders on mount
    useEffect(() => {
        loadFolders();
    }, []);

    const loadFolders = async () => {
        try {
            const data = await FolderService.getFolders();
            setFolders(data || []);
        } catch (error) {
            console.error('Error loading folders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            const newFolder = await FolderService.createFolder(newFolderName.trim());
            setFolders(prev => [...prev, newFolder]);
            setNewFolderName('');
            setShowCreateInput(false);
        } catch (error) {
            console.error('Error creating folder:', error);
        }
    };

    const handleRenameFolder = async (id) => {
        if (!editName.trim()) {
            setEditingFolder(null);
            return;
        }

        try {
            await FolderService.updateFolder(id, { name: editName.trim() });
            setFolders(prev => prev.map(f =>
                f.id === id ? { ...f, name: editName.trim() } : f
            ));
            setEditingFolder(null);
        } catch (error) {
            console.error('Error renaming folder:', error);
        }
    };

    const handleDeleteFolder = async (id) => {
        if (!window.confirm(t('folders.confirmDelete') || 'Delete this folder? Decks inside will be unassigned.')) {
            return;
        }

        try {
            await FolderService.deleteFolder(id);
            setFolders(prev => prev.filter(f => f.id !== id));
            if (selectedFolderId === id) {
                onFolderSelect(null); // Reset filter
            }
        } catch (error) {
            console.error('Error deleting folder:', error);
        }
    };

    // Drag and Drop handlers
    const handleDragOver = (e, folderId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverFolderId(folderId);
    };

    const handleDragLeave = () => {
        setDragOverFolderId(null);
    };

    const handleDrop = (e, folderId) => {
        e.preventDefault();
        setDragOverFolderId(null);

        const deckId = e.dataTransfer.getData('deckId');
        if (deckId && onAssignDeck) {
            onAssignDeck(deckId, folderId);
        }
    };

    return (
        <div className="folder-sidebar">
            <div className="folder-header">
                <h3><Folder size={18} /> {t('folders.title') || 'Folders'}</h3>
                <button
                    className="add-folder-btn"
                    onClick={() => setShowCreateInput(true)}
                    title={t('folders.create') || 'New Folder'}
                >
                    <FolderPlus size={18} />
                </button>
            </div>

            {/* Create New Folder Input */}
            {showCreateInput && (
                <div className="folder-create-input">
                    <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder={t('folders.placeholder') || 'Folder name...'}
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateFolder();
                            if (e.key === 'Escape') setShowCreateInput(false);
                        }}
                    />
                    <button onClick={handleCreateFolder}><Check size={16} /></button>
                    <button onClick={() => setShowCreateInput(false)}><X size={16} /></button>
                </div>
            )}

            {/* All Decks option */}
            <div
                className={`folder-item ${selectedFolderId === null ? 'active' : ''}`}
                onClick={() => onFolderSelect(null)}
            >
                <Folder size={16} />
                <span>{t('folders.all') || 'All Decks'}</span>
            </div>

            {/* Folder List */}
            {loading ? (
                <div className="folder-loading">Loading...</div>
            ) : (
                folders.map(folder => (
                    <div
                        key={folder.id}
                        className={`folder-item ${selectedFolderId === folder.id ? 'active' : ''} ${dragOverFolderId === folder.id ? 'drag-over' : ''}`}
                        onClick={() => onFolderSelect(folder.id)}
                        onDragOver={(e) => handleDragOver(e, folder.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, folder.id)}
                    >
                        {editingFolder === folder.id ? (
                            <div className="folder-edit-input" onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRenameFolder(folder.id);
                                        if (e.key === 'Escape') setEditingFolder(null);
                                    }}
                                />
                                <button onClick={() => handleRenameFolder(folder.id)}><Check size={14} /></button>
                            </div>
                        ) : (
                            <>
                                <Folder size={16} style={{ color: folder.color || '#C52222' }} />
                                <span className="folder-name">{folder.name}</span>
                                <button
                                    className="folder-menu-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setMenuPosition({ top: rect.bottom + 4, left: rect.left - 100 });
                                        setMenuOpenId(menuOpenId === folder.id ? null : folder.id);
                                    }}
                                >
                                    <MoreVertical size={14} />
                                </button>

                                {/* Context Menu */}
                                {menuOpenId === folder.id && (
                                    <div
                                        className="folder-context-menu"
                                        style={{ top: menuPosition.top, left: menuPosition.left }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button onClick={() => {
                                            setEditingFolder(folder.id);
                                            setEditName(folder.name);
                                            setMenuOpenId(null);
                                        }}>
                                            <Edit2 size={14} /> {t('folders.rename') || 'Rename'}
                                        </button>
                                        <button className="danger" onClick={() => {
                                            handleDeleteFolder(folder.id);
                                            setMenuOpenId(null);
                                        }}>
                                            <Trash2 size={14} /> {t('folders.delete') || 'Delete'}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ))
            )}


        </div>
    );
};

export default FolderSidebar;
