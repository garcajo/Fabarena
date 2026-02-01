import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Image as ImageIcon, Type, AlignLeft, Edit, Eye, X } from 'lucide-react';
import { DeckService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import MarkdownContent from '../components/common/MarkdownContent';
import Toast from '../components/common/Toast';
import '../styles/DeckBuilder.css'; // Reusing some basic styles

const DeckGuide = () => {
    const { deckId } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { user } = useAuth(); // Logged in user

    const [loading, setLoading] = useState(true);
    const [deck, setDeck] = useState(null);
    const [isOwner, setIsOwner] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [guideTitle, setGuideTitle] = useState('');
    const [sections, setSections] = useState([]);

    // Toast State
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    useEffect(() => {
        loadDeck();
    }, [deckId]);

    const loadDeck = async () => {
        try {
            setLoading(true);
            const data = await DeckService.getDeckById(deckId);
            setDeck(data);
            // Check ownership - Use service flag if available, otherwise strict comparison
            const isOwnerCheck = data.isOwner || (user && user.id && data.user_id && data.user_id === user.id);
            console.log('[DeckGuide] Ownership check:', { serviceFlag: data.isOwner, user: user?.id, deckOwner: data.user_id, result: isOwnerCheck });
            setIsOwner(!!isOwnerCheck);

            // Parse guide if exists
            let guideData = [];
            let loadedTitle = '';

            if (data.guide) {
                if (typeof data.guide === 'string') {
                    try {
                        const parsed = JSON.parse(data.guide);
                        if (Array.isArray(parsed)) {
                            guideData = parsed;
                        } else if (parsed && typeof parsed === 'object') {
                            guideData = parsed.sections || [];
                            loadedTitle = parsed.title || '';
                        }
                    } catch (e) {
                        console.error('Failed to parse guide JSON', e);
                    }
                } else if (Array.isArray(data.guide)) {
                    // Legacy array format
                    guideData = data.guide;
                } else if (typeof data.guide === 'object') {
                    // New object format direct from DB (if JSONB automatically parsed)
                    guideData = data.guide.sections || [];
                    loadedTitle = data.guide.title || '';
                }
            }
            setSections(guideData);
            setGuideTitle(loadedTitle); // Initialize title (empty if none)

        } catch (error) {
            console.error('Error loading deck:', error);
            setToastMessage('Error loading deck details');
            setToastType('error');
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!isOwner) return;

        try {
            // Update only the guide field
            await DeckService.updateDeck(deckId, {
                guide: {
                    title: guideTitle,
                    sections: sections
                }
            });
            setToastMessage(t('common.saved') || 'Saved successfully');
            setToastType('success');
            setShowToast(true);
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving guide:', error);
            setToastMessage(`Error saving guide: ${error.message || 'Unknown error'}`);
            setToastType('error');
            setShowToast(true);
        }
    };

    const addSection = () => {
        setSections([
            ...sections,
            {
                id: Date.now(),
                title: '',
                subtitle: '',
                content: '',
                imageUrl: ''
            }
        ]);
    };

    const updateSection = (index, field, value) => {
        const newSections = [...sections];
        newSections[index] = { ...newSections[index], [field]: value };
        setSections(newSections);
    };

    const removeSection = (index) => {
        if (window.confirm(t('guide.confirm_delete_section') || 'Are you sure you want to delete this section?')) {
            const newSections = sections.filter((_, i) => i !== index);
            setSections(newSections);
        }
    };

    const getVideoId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    if (loading) return <div className="container" style={{ paddingTop: '2rem' }}>{t('common.loading')}</div>;

    if (!deck) return <div className="container" style={{ paddingTop: '2rem' }}>{t('deckBuilder.notFoundTitle')}</div>;

    return (
        <div className="deck-guide-page" style={{ paddingBottom: '4rem' }}>
            <div className="container">
                {/* Header */}
                <div className="guide-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    paddingTop: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={() => navigate(`/decks/${deckId}`)}
                            className="back-btn"
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                transition: 'all 0.2s ease',
                                fontSize: '0.95rem'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-text-main)';
                                e.currentTarget.style.color = 'var(--color-text-main)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                e.currentTarget.style.color = 'var(--color-text-muted)';
                            }}
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={guideTitle}
                                    onChange={(e) => setGuideTitle(e.target.value)}
                                    placeholder={t('deck.write_title') || 'Write a title'}
                                    style={{
                                        fontSize: '1.8rem',
                                        fontWeight: '700',
                                        background: 'rgba(0, 0, 0, 0.2)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        padding: '0.2rem 0.5rem',
                                        color: 'var(--color-text-main)',
                                        width: '100%',
                                        minWidth: '300px'
                                    }}
                                />
                            ) : (
                                <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {guideTitle ? (
                                        <span>{guideTitle}</span>
                                    ) : (
                                        <span style={{ opacity: 0.7 }}>{t('deck.guide') || 'Guide'}</span>
                                    )}
                                </h1>
                            )}
                        </div>
                    </div>

                    {isOwner && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="edit-guide-btn"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        color: 'var(--color-text-main)',
                                        border: '1px solid var(--color-border)',
                                        padding: '0.6rem 1.2rem',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <Edit size={18} />
                                    {t('common.edit') || 'Edit'}
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => {
                                            if (window.confirm(t('guide.discard_changes') || 'Discard changes?')) {
                                                loadDeck(); // Revert to saved
                                                setIsEditing(false);
                                            }
                                        }}
                                        style={{
                                            background: 'transparent',
                                            color: 'var(--color-text-muted)',
                                            border: '1px solid transparent',
                                            padding: '0.6rem 1rem',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                        }}
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="save-guide-btn"
                                        style={{
                                            background: 'var(--color-primary-red)',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '0.6rem 1.2rem',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            boxShadow: '0 4px 6px -1px rgba(197, 34, 34, 0.2), 0 2px 4px -1px rgba(197, 34, 34, 0.1)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Save size={18} />
                                        {t('common.save') || 'Save Guide'}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="guide-content" style={{ maxWidth: '800px', margin: '0 auto' }}>

                    {sections.length === 0 && (
                        <div className="empty-state" style={{
                            textAlign: 'center',
                            padding: '4rem 2rem',
                            background: 'var(--color-surface)',
                            borderRadius: '12px',
                            border: '1px dashed var(--color-border)'
                        }}>
                            <h3 style={{ marginBottom: '1rem' }}>
                                {isOwner
                                    ? (t('guide.empty_owner') || 'Write a guide for your deck!')
                                    : (t('guide.empty_viewer') || 'No guide has been written for this deck yet.')}
                            </h3>

                        </div>
                    )}

                    {sections.map((section, index) => (
                        <div key={section.id || index} className="guide-section" style={{
                            marginBottom: '2rem',
                            background: isEditing ? 'rgba(0,0,0,0.2)' : 'transparent',
                            padding: isEditing ? '1.5rem' : '0',
                            borderRadius: '8px',
                            border: isEditing ? '1px solid var(--color-border)' : 'none',
                            position: 'relative'
                        }}>
                            {/* OWNER EDITOR MODE */}
                            {isOwner && isEditing ? (
                                <div className="section-editor">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <h4 style={{ margin: 0, opacity: 0.7 }}>{t('guide.section')} {index + 1}</h4>
                                        <button
                                            onClick={() => removeSection(index)}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                padding: '0.4rem',
                                                borderRadius: '6px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                            }}
                                            title={t('guide.delete_section') || "Delete Section"}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>{t('common.title') || 'TITLE'}</label>
                                        <input
                                            type="text"
                                            value={section.title}
                                            onChange={(e) => updateSection(index, 'title', e.target.value)}
                                            placeholder={t('guide.title_placeholder') || "Section Title (e.g., 'Core Strategy')"}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: 'rgba(0,0,0,0.3)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '6px',
                                                color: 'var(--color-text-main)',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>{t('common.subtitle') || 'SUBTITLE (OPTIONAL)'}</label>
                                        <input
                                            type="text"
                                            value={section.subtitle}
                                            onChange={(e) => updateSection(index, 'subtitle', e.target.value)}
                                            placeholder={t('guide.subtitle_placeholder') || "Subtitle or Context"}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: 'rgba(0,0,0,0.3)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '6px',
                                                color: 'var(--color-text-main)',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>

                                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>{t('guide.media_label') || 'IMAGE OR VIDEO URL (YOUTUBE)'}</label>
                                        <input
                                            type="text"
                                            value={section.imageUrl}
                                            onChange={(e) => updateSection(index, 'imageUrl', e.target.value)}
                                            placeholder={t('guide.media_placeholder') || "https://example.com/image.jpg or YouTube URL"}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: 'rgba(0,0,0,0.3)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '6px',
                                                color: 'var(--color-text-main)',
                                                fontSize: '0.9rem',
                                                fontFamily: 'monospace'
                                            }}
                                        />
                                        {section.imageUrl && (
                                            <div style={{ marginTop: '0.75rem', height: 'auto', minHeight: '150px', overflow: 'hidden', borderRadius: '8px', border: '1px solid var(--color-border)', background: '#000' }}>
                                                {getVideoId(section.imageUrl) ? (
                                                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                                                        <iframe
                                                            src={`https://www.youtube.com/embed/${getVideoId(section.imageUrl)}`}
                                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                            title="Embedded video"
                                                        />
                                                    </div>
                                                ) : (
                                                    <img src={section.imageUrl} style={{ height: 'auto', maxHeight: '300px', width: '100%', objectFit: 'contain', display: 'block' }} alt="Preview" />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>{t('guide.content') || 'CONTENT'}</label>
                                        <textarea
                                            value={section.content}
                                            onChange={(e) => updateSection(index, 'content', e.target.value)}
                                            placeholder={t('guide.content_placeholder') || "Write your guide content here..."}
                                            rows={8}
                                            style={{
                                                width: '100%',
                                                padding: '1rem',
                                                background: 'rgba(0,0,0,0.3)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '6px',
                                                color: 'var(--color-text-main)',
                                                resize: 'vertical',
                                                fontFamily: 'inherit',
                                                lineHeight: '1.6',
                                                fontSize: '1rem'
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* VIEWER MODE */
                                <div className="section-viewer">
                                    {section.title && <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--color-text-main)', fontWeight: '700' }}>{section.title}</h2>}
                                    {section.subtitle && <h4 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--color-primary-red)', fontWeight: '500', marginTop: 0 }}>{section.subtitle}</h4>}

                                    {section.imageUrl && (
                                        <div style={{ marginBottom: '2rem', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)', background: '#000' }}>
                                            {getVideoId(section.imageUrl) ? (
                                                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                                                    <iframe
                                                        src={`https://www.youtube.com/embed/${getVideoId(section.imageUrl)}`}
                                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                        title={section.title || "Embedded video"}
                                                    />
                                                </div>
                                            ) : (
                                                <img src={section.imageUrl} alt={section.title} style={{ maxWidth: '100%', maxHeight: '500px', display: 'block', margin: '0 auto' }} />
                                            )}
                                        </div>
                                    )}

                                    {section.content && (
                                        <div className="guide-text-content" style={{ fontSize: '1.1rem', color: 'var(--color-text-main)' }}>
                                            <MarkdownContent text={section.content} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {isOwner && isEditing && (
                        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                            <button
                                onClick={addSection}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px dashed var(--color-border)',
                                    color: 'var(--color-text-muted)',
                                    padding: '1.5rem 2rem',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    fontSize: '1.1rem',
                                    transition: 'all 0.2s',
                                    fontWeight: '500'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-primary-red)';
                                    e.currentTarget.style.color = 'var(--color-primary-red)';
                                    e.currentTarget.style.background = 'rgba(197, 34, 34, 0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                    e.currentTarget.style.color = 'var(--color-text-muted)';
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                }}
                            >
                                <Plus size={24} />
                                {t('guide.add_section') || 'Add New Section'}
                            </button>
                        </div>
                    )}

                </div>
            </div>
            {
                showToast && (
                    <Toast
                        message={toastMessage}
                        type={toastType}
                        onClose={() => setShowToast(false)}
                    />
                )
            }
        </div >
    );
};

export default DeckGuide;
