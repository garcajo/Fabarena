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
                <h2 className="help-sidebar-title">{t('help.title') || 'Help Center'}</h2>
                <nav className="help-nav">
                    <button
                        className={`help-nav-item ${activeTab === 'welcome' ? 'active' : ''}`}
                        onClick={() => setActiveTab('welcome')}
                    >
                        <BookOpen size={20} />
                        <span>{t('help.welcome') || 'Welcome'}</span>
                    </button>
                    <button
                        className={`help-nav-item ${activeTab === 'goal' ? 'active' : ''}`}
                        onClick={() => setActiveTab('goal')}
                    >
                        <Target size={20} />
                        <span>{t('help.goal') || 'Our Goal'}</span>
                    </button>
                    <button
                        className={`help-nav-item ${activeTab === 'contact' ? 'active' : ''}`}
                        onClick={() => setActiveTab('contact')}
                    >
                        <Mail size={20} />
                        <span>{t('help.contact') || 'Contact Us'}</span>
                    </button>
                </nav>
            </div>

            <main className="help-content">
                {activeTab === 'welcome' && (
                    <section className="help-section fade-in">
                        <h1>{t('help.welcome_title') || 'Welcome to FabArena'}</h1>
                        <p className="help-text-lead">
                            Fabarena es una creación personal donde todos puedan gestionar lo que más gusta de Flesh and Blood: las cartas.
                        </p>
                        <p className="help-text">
                            Estará siempre en continuo crecimiento y mejoría, añadiendo siempre las funcionalidades que mejor ayuden a la comunidad.
                        </p>
                    </section>
                )}

                {activeTab === 'goal' && (
                    <section className="help-section fade-in">
                        <h1>{t('help.goal_title') || 'The Goal of FabArena'}</h1>
                        <p className="help-text">
                            Conseguir que todos puedan gestionar su colección y sus mazos de manera eficiente, compartiendo con los demás tus creaciones, además de añadiendo guas para conectar a todos de manera intuitiva con lo que pueda ser tu mejor mazo.
                        </p>
                    </section>
                )}

                {activeTab === 'contact' && (
                    <section className="help-section fade-in">
                        <h1>{t('help.contact_title') || 'Contact Us'}</h1>
                        <p className="help-text">
                            Si necesitas contactar, puedes hacerlo aquí.
                        </p>
                        <p className="help-text-small text-muted">
                            Estos mensajes se enviarán directamente al administrador.
                        </p>

                        <form className="contact-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="your@email.com"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="subject">Asunto</label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    placeholder="Motivo del contacto"
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="message">Mensaje</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    placeholder="¿En qué podemos ayudarte?"
                                    rows={5}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>

                            {formStatus === 'success' && (
                                <div className="form-alert success">
                                    <CheckCircle size={20} />
                                    <span>Mensaje enviado correctamente. Contactaremos contigo pronto.</span>
                                </div>
                            )}

                            {formStatus === 'error' && (
                                <div className="form-alert error">
                                    <AlertCircle size={20} />
                                    <span>Error al enviar el mensaje. Por favor intenta de nuevo.</span>
                                </div>
                            )}

                            <button type="submit" className="submit-btn" disabled={isSubmitting}>
                                {isSubmitting ? 'Enviando...' : (
                                    <>
                                        <Send size={18} />
                                        <span>Enviar Mensaje</span>
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
