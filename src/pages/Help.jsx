import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { EmailService } from '../services/emailService';
import { BookOpen, Target, Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import '../styles/Help.css';

const Help = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('welcome');

    // Form State
    const [formData, setFormData] = useState({
        email: user?.email || '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formStatus, setFormStatus] = useState(null); // 'success' | 'error' | null

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.subject || !formData.message) {
            return;
        }

        setIsSubmitting(true);
        setFormStatus(null);

        try {
            const { error } = await supabase
                .from('contact_messages')
                .insert([
                    {
                        email: formData.email,
                        subject: formData.subject,
                        message: formData.message,
                        user_id: user?.id || null // Optional relation
                    }
                ]);

            if (error) throw error;

            // Send email notification in background (non-blocking for UI, but good to try)
            try {
                await EmailService.sendContactMessage(formData.email, formData.subject, formData.message);
            } catch (emailError) {
                console.warn('Failed to send email notif:', emailError);
                // We don't fail the whole submission if just email fails, since DB saved it.
            }

            setFormStatus('success');
            setFormData({
                email: user?.email || '',
                subject: '',
                message: ''
            });
        } catch (error) {
            console.error('Error submitting form:', error);
            setFormStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="help-page-container container">
            <div className="help-sidebar">
                <h2 className="help-sidebar-title">{t('help.title')}</h2>
                <nav className="help-nav">
                    <button
                        className={`help-nav-item ${activeTab === 'welcome' ? 'active' : ''}`}
                        onClick={() => setActiveTab('welcome')}
                    >
                        <BookOpen size={20} />
                        <span>{t('help.welcome')}</span>
                    </button>
                    <button
                        className={`help-nav-item ${activeTab === 'goal' ? 'active' : ''}`}
                        onClick={() => setActiveTab('goal')}
                    >
                        <Target size={20} />
                        <span>{t('help.goal')}</span>
                    </button>
                    <button
                        className={`help-nav-item ${activeTab === 'contact' ? 'active' : ''}`}
                        onClick={() => setActiveTab('contact')}
                    >
                        <Mail size={20} />
                        <span>{t('help.contact')}</span>
                    </button>
                </nav>
            </div>

            <main className="help-content">
                {activeTab === 'welcome' && (
                    <section className="help-section fade-in">
                        <h1>{t('help.welcome_title')}</h1>
                        <p className="help-text-lead">
                            {t('help.welcome_lead')}
                        </p>
                        <p className="help-text">
                            {t('help.welcome_text')}
                        </p>
                    </section>
                )}

                {activeTab === 'goal' && (
                    <section className="help-section fade-in">
                        <h1>{t('help.goal_title')}</h1>
                        <p className="help-text">
                            {t('help.goal_text')}
                        </p>
                    </section>
                )}

                {activeTab === 'contact' && (
                    <section className="help-section fade-in">
                        <h1>{t('help.contact_title')}</h1>
                        <p className="help-text">
                            {t('help.contact_lead')}
                        </p>
                        <p className="help-text-small text-muted">
                            {t('help.contact_note')}
                        </p>

                        <form className="contact-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="email">{t('help.email_label')}</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder={t('help.email_placeholder')}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="subject">{t('help.subject_label')}</label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    placeholder={t('help.subject_placeholder')}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="message">{t('help.message_label')}</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    placeholder={t('help.message_placeholder')}
                                    rows={5}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            {formStatus === 'success' && (
                                <div className="form-alert success">
                                    <CheckCircle size={20} />
                                    <span>{t('help.success_message')}</span>
                                </div>
                            )}

                            {formStatus === 'error' && (
                                <div className="form-alert error">
                                    <AlertCircle size={20} />
                                    <span>{t('help.error_message')}</span>
                                </div>
                            )}

                            <button type="submit" className="submit-btn" disabled={isSubmitting}>
                                {isSubmitting ? t('help.sending') : (
                                    <>
                                        <Send size={18} />
                                        <span>{t('help.send_button')}</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </section>
                )}
            </main>
        </div>
    );
};

export default Help;
