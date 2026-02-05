import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import AdBanner from './AdBanner';
import { useLanguage } from '../context/LanguageContext';
import '../styles/Layout.css';

/**
 * Main Layout component wrapping the application.
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 */
const Layout = ({ children }) => {
    const location = useLocation();
    const { t } = useLanguage();

    // Hide bottom banner on pages that have a top banner to avoid redundancy/clutter
    const hideBottomBanner = ['/decks', '/my-decks', '/cards', '/collection'].some(path => location.pathname.startsWith(path));

    return (
        <div className="layout">
            <Navbar />
            <main className="main-content">
                {children}
            </main>
            <footer className="footer">
                <div className="container">
                    {/* Ad Banner at bottom - Conditional */}
                    {!hideBottomBanner && <AdBanner position="bottom" />}

                    <p style={{ opacity: 0.7, fontSize: '0.85rem', marginTop: '1rem' }}>
                        &copy; {new Date().getFullYear()} FabArena. {t('footer.copyright')} <a href="https://fabtcg.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Legend Story Studios</a>. {t('footer.rights')}
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
