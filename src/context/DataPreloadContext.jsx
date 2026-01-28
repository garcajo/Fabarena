import React, { createContext, useContext, useEffect, useState } from 'react';
import { CardService } from '../services/api';

/**
 * DataPreloadContext
 * 
 * Pre-fetches critical data at app startup to improve perceived performance.
 * Data includes: Heroes list, Living Legend data, Banned cards.
 * 
 * This data is loaded once and cached for the lifetime of the app session.
 */
const DataPreloadContext = createContext({
    heroes: [],
    livingLegend: { active: [], ascended: [] },
    bans: {},
    isLoading: true,
    isHeroesLoading: true,
    isLivingLegendLoading: true,
    isBansLoading: true,
    error: null
});

export const DataPreloadProvider = ({ children }) => {
    const [heroes, setHeroes] = useState([]);
    const [livingLegend, setLivingLegend] = useState({ active: [], ascended: [] });
    const [bans, setBans] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isHeroesLoading, setIsHeroesLoading] = useState(true);
    const [isLivingLegendLoading, setIsLivingLegendLoading] = useState(true);
    const [isBansLoading, setIsBansLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Pre-fetch all critical data in parallel on app startup
        const preloadData = async () => {
            try {
                // Fetch heroes
                CardService.getCards({ type: 'Hero', pageSize: 1000, sort: 'name' })
                    .then(response => {
                        if (!response.error) {
                            setHeroes(response.data || []);
                        }
                        setIsHeroesLoading(false);
                    })
                    .catch(err => {
                        console.error('Error preloading heroes:', err);
                        setIsHeroesLoading(false);
                    });

                // Fetch living legend data
                CardService.getLivingLegendData()
                    .then(response => {
                        if (!response.error && response.data) {
                            setLivingLegend(response.data);
                        }
                        setIsLivingLegendLoading(false);
                    })
                    .catch(err => {
                        console.error('Error preloading living legend:', err);
                        setIsLivingLegendLoading(false);
                    });

                // Fetch bans data
                CardService.getBannedCards()
                    .then(response => {
                        if (!response.error && response.data) {
                            setBans(response.data);
                        }
                        setIsBansLoading(false);
                    })
                    .catch(err => {
                        console.error('Error preloading bans:', err);
                        setIsBansLoading(false);
                    });

            } catch (err) {
                console.error('Error in data preload:', err);
                setError(err.message);
            }
        };

        preloadData();
    }, []);

    // Update overall loading state when all individual loads complete
    useEffect(() => {
        if (!isHeroesLoading && !isLivingLegendLoading && !isBansLoading) {
            setIsLoading(false);
        }
    }, [isHeroesLoading, isLivingLegendLoading, isBansLoading]);

    const value = {
        heroes,
        livingLegend,
        bans,
        isLoading,
        isHeroesLoading,
        isLivingLegendLoading,
        isBansLoading,
        error
    };

    return (
        <DataPreloadContext.Provider value={value}>
            {children}
        </DataPreloadContext.Provider>
    );
};

/**
 * Hook to access preloaded data
 */
export const usePreloadedData = () => {
    const context = useContext(DataPreloadContext);
    if (context === undefined) {
        throw new Error('usePreloadedData must be used within a DataPreloadProvider');
    }
    return context;
};

export default DataPreloadContext;
