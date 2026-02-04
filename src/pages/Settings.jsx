import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { CollectionService, DeckService, AuthService } from '../services/api';
import { EmailService } from '../services/emailService';
import { User, Database, Mail, Save, Download, Upload, Trash, AlertTriangle, X } from 'lucide-react';
import '../styles/Settings.css';

const Settings = () => {
    const { user, updateUser } = useAuth();
    const { t } = useLanguage();
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState('profile');

    // Profile State
    const [profile, setProfile] = useState({
        username: '',
        fullName: '',
        birthDate: '',
        avatarUrl: ''
    });

    // Suggestion State
    const [suggestion, setSuggestion] = useState({
        title: '',
        message: ''
    });

    useEffect(() => {
        if (user) {
            setProfile({
                username: user.user_metadata?.username || '',
                fullName: user.user_metadata?.full_name || '',
                birthDate: user.user_metadata?.birth_date || '',
                avatarUrl: user.user_metadata?.avatar_url || ''
            });
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await AuthService.updateProfile(profile);
            addToast(t('settings.profile_updated') || 'Profile updated successfully', 'success');
            // Refresh user data in context might be handled by auth listener, but for immediate UI validation:
            // updateUser({ ...user, user_metadata: { ...user.user_metadata, ...profile } }); // Optional manual sync
        } catch (error) {
            addToast(error.message || 'Failed to update profile', 'error');
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            addToast('Uploading avatar...', 'info');
            const publicUrl = await AuthService.updateAvatar(file);
            setProfile(prev => ({ ...prev, avatarUrl: publicUrl }));
            // Also update global user context if possible/needed
            // updateUser({ ...user, user_metadata: { ...user.user_metadata, avatar_url: publicUrl } });
            addToast('Avatar updated successfully', 'success');
        } catch (error) {
            console.error(error);
            addToast('Failed to upload avatar', 'error');
        }
    };

    const handleBackupExport = async () => {
        try {
            // Fetch all data
            addToast('Preparing backup... (Fetching fully detailed decks)', 'info');

            // 1. Start Collection Fetch
            const collectionPromise = CollectionService.getCollection({ pageSize: 10000 });

            // 2. Fetch User's Decks (Metadata)
            const decksResponse = await DeckService.getDecks('user');
            const decksList = decksResponse.data || [];

            // 3. Fetch Full Details (Cards) for each deck
            const fullDecks = await Promise.all(
                decksList.map(async (deck) => {
                    try {
                        // getDeckById returns { ...deck, cards: [...] }
                        return await DeckService.getDeckById(deck.id);
                    } catch (err) {
                        console.warn(`Failed to fetch detailed cards for deck ${deck.id}`, err);
                        return deck; // Fallback to metadata
                    }
                })
            );

            const collection = await collectionPromise;

            const backupData = {
                timestamp: new Date().toISOString(),
                user: { id: user.id, email: user.email },
                collection: collection.data,
                decks: fullDecks
            };

            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fabarena_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            addToast('Backup downloaded successfully', 'success');
        } catch (error) {
            console.error(error);
            addToast('Failed to generate backup', 'error');
        }
    };

    const handleBackupImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target.result);
                // Validate basic structure
                if (!data.collection || !data.decks) {
                    throw new Error('Invalid backup file format');
                }

                // Logic to restore would go here - likely sending to a "restore" endpoint
                // to avoid hundreds of individual API calls
                console.log('Restoring data:', data);
                addToast('Import feature not fully connected to backend yet', 'info');
            } catch (error) {
                addToast('Invalid backup file', 'error');
            }
        };
        reader.readAsText(file);
    };

    const handleSuggestionSubmit = async (e) => {
        e.preventDefault();
        try {
            addToast(t('settings.sending_feedback') || 'Sending feedback...', 'info');
            await EmailService.sendFeedback(suggestion.title, suggestion.message, user);
            addToast(t('settings.feedback_sent') || 'Feedback sent successfully!', 'success');
            setSuggestion({ title: '', message: '' });
        } catch (error) {
            console.error('Feedback Error:', error);
            addToast(t('settings.feedback_error') || 'Failed to send feedback', 'error');
        }
    };

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 style={{ marginBottom: '2rem' }}>{t('settings.title')}</h1>

            <div className="settings-container">
                <div className="settings-sidebar">
                    <button
                        className={`settings-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <User size={20} />
                        {t('settings.profile')}
                    </button>
                    <button
                        className={`settings-nav-item ${activeTab === 'backup' ? 'active' : ''}`}
                        onClick={() => setActiveTab('backup')}
                    >
                        <Database size={20} />
                        {t('settings.backup')}
                    </button>
                    <button
                        className={`settings-nav-item ${activeTab === 'feedback' ? 'active' : ''}`}
                        onClick={() => setActiveTab('feedback')}
                    >
                        <Mail size={20} />
                        {t('settings.feedback')}
                    </button>
                </div>

                <div className="settings-content">
                    {activeTab === 'profile' && (
                        <div className="settings-section">
                            <h2>{t('settings.personal_info')}</h2>

                            <div className="profile-header-edit" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div style={{ position: 'relative', width: '80px', height: '80px' }}>
                                    {profile.avatarUrl ? (
                                        <img
                                            src={profile.avatarUrl}
                                            alt="Profile"
                                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)' }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '50%',
                                            background: 'var(--color-primary-red)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '2.5rem',
                                            fontWeight: 'bold',
                                            color: 'white',
                                            border: '2px solid var(--color-border)'
                                        }}>
                                            {profile.username ? profile.username.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                    )}
                                    <label
                                        htmlFor="avatar-upload"
                                        style={{
                                            position: 'absolute',
                                            bottom: '-5px',
                                            right: '-5px',
                                            background: 'var(--color-primary-red)',
                                            borderRadius: '50%',
                                            width: '30px',
                                            height: '30px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            border: '2px solid #1a1a1a'
                                        }}
                                    >
                                        <Upload size={14} color="white" />
                                        <input
                                            id="avatar-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            hidden
                                        />
                                    </label>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0 }}>{profile.username || 'User'}</h3>
                                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{user?.email}</p>
                                </div>
                            </div>

                            <form onSubmit={handleProfileUpdate} className="settings-form" style={{ gap: '2rem' }}>
                                {/* Account Settings Section */}
                                <div className="settings-subsection" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem' }}>
                                    <h3>
                                        {t('settings.account_settings') || 'Account Settings'}
                                    </h3>
                                    <div className="form-group">
                                        <label>{t('auth.username')}</label>
                                        <input
                                            type="text"
                                            value={profile.username}
                                            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                            placeholder={t('auth.username')}
                                        />
                                        <small style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                            {t('settings.username_unique_desc') || 'This is your unique identifier on FabArena.'}
                                        </small>
                                    </div>
                                </div>

                                {/* Personal Info Section */}
                                <div className="settings-subsection">
                                    <h3>
                                        {t('settings.personal_details') || 'Personal Details'}
                                    </h3>
                                    <div className="form-group">
                                        <label>{t('settings.full_name')}</label>
                                        <input
                                            type="text"
                                            value={profile.fullName}
                                            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t('settings.birth_date')}</label>
                                        <input
                                            type="date"
                                            value={profile.birthDate}
                                            onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="save-btn">
                                    <Save size={18} />
                                    {t('settings.save_changes')}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'backup' && (
                        <div className="settings-section">
                            <h2>{t('settings.backup')}</h2>
                            <p className="section-desc">{t('settings.backup_desc')}</p>

                            <div className="backup-actions">
                                <div className="backup-card">
                                    <h3>{t('settings.export_title')}</h3>
                                    <p>{t('settings.export_desc')}</p>
                                    <button onClick={handleBackupExport} className="export-btn">
                                        <Download size={18} />
                                        {t('settings.download_backup')}
                                    </button>
                                </div>

                                <div className="backup-card">
                                    <h3>{t('settings.import_title')}</h3>
                                    <p>{t('settings.import_desc')}</p>
                                    <label className="import-btn">
                                        <Upload size={18} />
                                        {t('settings.upload_backup')}
                                        <input type="file" accept=".json" onChange={handleBackupImport} hidden />
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'feedback' && (
                        <div className="settings-section">
                            <h2>{t('settings.suggestions_title')}</h2>
                            <p className="section-desc">{t('settings.suggestions_desc')}</p>

                            <form onSubmit={handleSuggestionSubmit} className="settings-form">
                                <div className="form-group">
                                    <label>{t('settings.subject')}</label>
                                    <input
                                        type="text"
                                        value={suggestion.title}
                                        onChange={(e) => setSuggestion({ ...suggestion, title: e.target.value })}
                                        placeholder={t('settings.subject')}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('settings.message')}</label>
                                    <textarea
                                        value={suggestion.message}
                                        onChange={(e) => setSuggestion({ ...suggestion, message: e.target.value })}
                                        rows={6}
                                        placeholder={t('settings.message')}
                                        required
                                    />
                                </div>
                                <button type="submit" className="send-btn">
                                    <Mail size={18} />
                                    {t('settings.send_feedback')}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            <DeleteAccountModal />
        </div>
    );
};

const DeleteAccountModal = () => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const { addToast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const confirmationKeyword = t('settings.delete_confirmation_keyword') || 'delete';

    if (!isOpen) {
        return (
            <div style={{ marginTop: '3rem', borderTop: '1px solid var(--color-border)', paddingTop: '2rem' }}>
                <h3 style={{ color: 'var(--color-primary-red)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={20} />
                    {t('settings.danger_zone')}
                </h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', marginTop: '0.5rem' }}>
                    {t('settings.danger_desc')}
                </p>
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        background: 'rgba(220, 38, 38, 0.1)',
                        color: 'var(--color-primary-red)',
                        border: '1px solid var(--color-primary-red)',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Trash size={18} />
                    {t('settings.delete_account')}
                </button>
            </div>
        );
    }

    const handleDelete = async () => {
        if (confirmText.toLowerCase() !== confirmationKeyword.toLowerCase()) return;

        setIsDeleting(true);
        try {
            await AuthService.deleteAccount();
            addToast('Account deleted successfully', 'success');
            logout(); // Redirects to home/login
        } catch (error) {
            console.error(error);
            addToast(error.message || 'Failed to delete account', 'error');
            setIsDeleting(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: '#1a1a1a',
                padding: '2rem',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                maxWidth: '400px',
                width: '90%',
                position: 'relative'
            }}>
                <button
                    onClick={() => setIsOpen(false)}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-muted)',
                        cursor: 'pointer'
                    }}
                >
                    <X size={20} />
                </button>

                <h2 style={{ color: 'var(--color-primary-red)', marginTop: 0 }}>{t('settings.delete_modal_title')}</h2>
                <p style={{ lineHeight: '1.5', margin: '1rem 0' }}>
                    {t('settings.delete_modal_desc')}
                </p>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        {t('settings.type_to_confirm')} <span style={{ fontWeight: 'bold', color: 'white' }}>{confirmationKeyword}</span> {t('settings.to_confirm')}:
                    </label>
                    <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={confirmationKeyword}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            color: 'white',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{
                            background: 'none',
                            border: '1px solid var(--color-border)',
                            color: 'white',
                            padding: '0.75rem 1rem',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        {t('settings.cancel')}
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={confirmText.toLowerCase() !== confirmationKeyword.toLowerCase() || isDeleting}
                        style={{
                            background: confirmText.toLowerCase() === confirmationKeyword.toLowerCase() ? 'var(--color-primary-red)' : 'rgba(220, 38, 38, 0.3)',
                            border: 'none',
                            color: 'white',
                            padding: '0.75rem 1rem',
                            borderRadius: '4px',
                            cursor: confirmText.toLowerCase() === confirmationKeyword.toLowerCase() ? 'pointer' : 'not-allowed',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                        }}
                    >
                        {isDeleting ? '...' : t('settings.delete_account')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
