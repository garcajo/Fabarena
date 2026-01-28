import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import AdBanner from './AdBanner';
import '../styles/Layout.css';

/**
 * Main Layout component wrapping the application.
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 */
const Layout = ({ children }) => {
    const location = useLocation();

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
                        &copy; {new Date().getFullYear()} FabArena. Flesh and Blood™ and all associated assets are property of <a href="https://fabtcg.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Legend Story Studios</a>. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
