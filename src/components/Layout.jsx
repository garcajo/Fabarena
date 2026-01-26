import React from 'react';
import Navbar from './Navbar';
import AdBanner from './AdBanner';
import BuyMeCoffee from './BuyMeCoffee';
import '../styles/Layout.css';

/**
 * Main Layout component wrapping the application.
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 */
const Layout = ({ children }) => {
    return (
        <div className="layout">
            <Navbar />
            <main className="main-content">
                {children}
            </main>
            <footer className="footer">
                <div className="container">
                    {/* Ad Banner at bottom */}
                    <AdBanner position="bottom" />

                    <p style={{ opacity: 0.7, fontSize: '0.85rem', marginTop: '1rem' }}>
                        &copy; {new Date().getFullYear()} FabArena. Flesh and Blood™ and all associated assets are property of <a href="https://fabtcg.com" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Legend Story Studios</a>. All rights reserved.
                    </p>
                </div>
            </footer>
            {/* Mobile Floating BMC Button */}
            <BuyMeCoffee type="mobile" />
        </div>
    );
};

export default Layout;
