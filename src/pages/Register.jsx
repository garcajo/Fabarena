import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { AuthService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import '../styles/Register.css'; // Will create this next

const Register = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error when user types
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Basic validation
        if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
            setError(t('auth.all_fields_required'));
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError(t('auth.password_mismatch'));
            return;
        }

        setIsLoading(true);

        try {
            await AuthService.register({
                username: formData.username,
                email: formData.email,
                password: formData.password
            });
            setSuccess(t('auth.success'));
            // Optional: Redirect after delay
            setTimeout(() => {
                navigate('/'); // Or to login
            }, 3000);
        } catch (err) {
            setError(err.message || t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-container">
                <div className="register-header">
                    <h2>{t('auth.register_title')}</h2>
                    <p className="register-subtitle">Fab<span className="text-red">Arena</span></p>
                </div>

                <form onSubmit={handleSubmit} className="register-form">
                    {error && (
                        <div className="auth-alert error">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="auth-alert success">
                            <CheckCircle size={18} />
                            <span>{success}</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="username">{t('auth.username')}</label>
                        <div className="auth-input-wrapper">
                            <User size={18} className="auth-input-icon" />
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder={t('auth.username')}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">{t('auth.email')}</label>
                        <div className="auth-input-wrapper">
                            <Mail size={18} className="auth-input-icon" />
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="email..."
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">{t('auth.password')}</label>
                        <div className="auth-input-wrapper">
                            <Lock size={18} className="auth-input-icon" />
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">{t('auth.confirm_password')}</label>
                        <div className="auth-input-wrapper">
                            <Lock size={18} className="auth-input-icon" />
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button type="submit" className="auth-button" disabled={isLoading}>
                        {isLoading ? t('common.loading') : t('auth.submit')}
                    </button>

                    <div className="auth-footer">
                        <Link to="/" className="auth-link">{t('auth.already_have_account')}</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
