import React, { useEffect, useRef } from 'react';
import '../styles/AdBanner.css';

/**
 * AdBanner Component
 * 
 * Displays advertisement banners. Currently shows a placeholder.
 * When you have your Google AdSense code, replace the placeholder with the ad script.
 * 
 * @param {string} position - 'top' | 'sidebar' | 'inline' | 'bottom'
 * @param {string} adSlot - Your AdSense ad slot ID (when ready)
 * @param {string} adClient - Your AdSense client ID (when ready)
 */
const AdBanner = ({
    position = 'top',
    adSlot = '8911247227', // Default to the requested slot if not provided
    adClient = 'ca-pub-5842541392737931'
}) => {
    const adRef = useRef(null);
    const isAdSenseEnabled = adSlot && adClient;

    useEffect(() => {
        // When AdSense is configured, initialize the ad
        if (isAdSenseEnabled && adRef.current && window.adsbygoogle) {
            try {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
                console.error('AdSense error:', e);
            }
        }
    }, [isAdSenseEnabled]);

    // Size configurations based on position
    const getSizeClass = () => {
        switch (position) {
            case 'top':
            case 'bottom':
                return 'ad-banner-horizontal'; // 728x90 or responsive
            case 'sidebar':
                return 'ad-banner-vertical'; // 300x250 or 160x600
            case 'inline':
                return 'ad-banner-inline'; // 300x250 in-content
            default:
                return 'ad-banner-horizontal';
        }
    };

    // If AdSense is configured, render the real ad
    if (isAdSenseEnabled) {
        return (
            <div className={`ad-banner ${getSizeClass()}`}>
                <ins
                    ref={adRef}
                    className="adsbygoogle"
                    style={{ display: 'block' }}
                    data-ad-client={adClient}
                    data-ad-slot={adSlot}
                    data-ad-format="auto"
                    data-full-width-responsive="true"
                />
            </div>
        );
    }

    // Placeholder while waiting for AdSense approval
    return (
        <div className={`ad-banner ad-placeholder ${getSizeClass()}`}>
            <div className="ad-placeholder-content">
                <span className="ad-label">Publicidad</span>
                <p className="ad-placeholder-text">
                    Tu anuncio aquí
                </p>
            </div>
        </div>
    );
};

export default AdBanner;
