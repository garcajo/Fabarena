export const StorageService = {
    KEY: 'recent_cards',
    MAX_ITEMS: 5,

    KEY_DECKS: 'recent_decks',

    getRecentCards: () => {
        try {
            const stored = localStorage.getItem(StorageService.KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return [];
        }
    },

    getRecentDecks: () => {
        try {
            const stored = localStorage.getItem(StorageService.KEY_DECKS);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error reading decks from localStorage:', error);
            return [];
        }
    },

    addToHistory: (card) => {
        try {
            const current = StorageService.getRecentCards();

            // Remove if already exists (to move to top)
            const filtered = current.filter(c => c.id !== card.id);

            // Add to beginning
            const updated = [card, ...filtered].slice(0, StorageService.MAX_ITEMS);

            localStorage.setItem(StorageService.KEY, JSON.stringify(updated));
            return updated;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return [];
        }
    },

    addDeckToHistory: (deck) => {
        try {
            const current = StorageService.getRecentDecks();
            // Remove if already exists
            const filtered = current.filter(d => d.id !== deck.id);
            // Add to beginning
            const updated = [deck, ...filtered].slice(0, StorageService.MAX_ITEMS);
            localStorage.setItem(StorageService.KEY_DECKS, JSON.stringify(updated));
            return updated;
        } catch (error) {
            console.error('Error saving deck to localStorage:', error);
            return [];
        }
    },

    clearHistory: () => {
        localStorage.removeItem(StorageService.KEY);
        localStorage.removeItem(StorageService.KEY_DECKS);
    }
};
