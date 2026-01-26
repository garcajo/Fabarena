
import React, { useEffect, useState } from 'react';
import '../styles/BuyMeCoffee.css';

// Official BMC Icon SVG Path
const BMCIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="bmc-icon">
        <path d="M20.216 6.415l-.132-.666c-.119-.596-.387-1.144-.798-1.587-.66-.711-1.638-1.077-2.911-1.077H5.66c-1.272 0-2.25.366-2.911 1.077-.411.442-.679.99-.798 1.587l-.132.666C1.527 8.163 1.258 10.334 1.25 12.56h1.232c.008.21.037.42.086.63.385 1.635 1.77 2.898 3.481 3.164v.05c0 1.522 1.218 2.76 2.723 2.76h6.455c1.505 0 2.723-1.238 2.723-2.76v-.051c1.712-.266 3.097-1.529 3.481-3.164.049-.21.078-.42.086-.63h1.232c-.008-2.226-.277-4.397-.571-6.145zm-2.071 6.845c-.294 1.256-1.396 2.193-2.738 2.373V9.285h1.968c.22 1.341.526 2.684.77 3.975zM8.303 3.655h7.394c.94 0 1.674.227 2.112.7.272.292.455.65.549 1.05l.096.48h-11.3l.096-.48c.094-.4.277-.758.549-1.05.438-.473 1.173-.7 2.112-.7l-.608-.577z" />
    </svg>
);

const BuyMeCoffee = ({ type = 'desktop' }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (type === 'mobile') {
            const handleScroll = () => {
                // Show on scroll logic if desired, or always show.
                // User said: "siempre que el usuario haga scroll". 
                // Let's toggle visibility based on scroll Y > 100
                if (window.scrollY > 100) {
                    setIsVisible(true);
                } else {
                    setIsVisible(false);
                }
            };

            window.addEventListener('scroll', handleScroll);
            handleScroll(); // Check initial
            return () => window.removeEventListener('scroll', handleScroll);
        } else {
            setIsVisible(true); // Always visible on desktop (position relative)
        }
    }, [type]);

    if (!isVisible && type === 'mobile') return null;

    return (
        <a
            href="https://buymeacoffee.com/garcajottty"
            target="_blank"
            rel="noopener noreferrer"
            className={`bmc-button ${type === 'mobile' ? 'bmc-mobile' : 'bmc-desktop'}`}
            title="Buy me a coffee"
        >
            <BMCIcon />
            {type === 'desktop' && <span>Buy me a coffee</span>}
        </a>
    );
};

export default BuyMeCoffee;
