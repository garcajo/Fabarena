/**
 * Parses decklist text to extract card names and quantities.
 * Supports Fabrary and standard list formats.
 * 
 * @param {string} text - The raw decklist text
 * @returns {Object} - { heroName: string|null, cards: Array<{name, count, pitch?}> }
 */
export const parseDecklist = (text) => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const cards = [];
    let heroName = null;
    let deckName = null;
    let format = null;

    // Regex patterns
    // 1. "3 Sink Below (Red)" -> count: 3, name: Sink Below, pitch: Red
    // 2. "Sink Below (Red) x3" -> count: 3, name: Sink Below, pitch: Red
    // 3. "Hero: Katsu" -> hero

    // Pitch map
    const pitchMap = {
        'Red': 1,
        'Yellow': 2,
        'Blue': 3
    };

    lines.forEach((line, index) => {
        const cleanLine = line.trim();

        // Metadata detection
        // More robust regex for Hero detection (handles "Hero:", "Hero :", "Hero: ")
        const heroMatch = cleanLine.match(/^hero\s*:\s*(.+)$/i);
        if (heroMatch) {
            heroName = heroMatch[1].trim();
            return;
        }

        if (cleanLine.toLowerCase().startsWith('format:')) {
            const rawFormat = cleanLine.split(':')[1].trim().toLowerCase();
            if (rawFormat.includes('classic') || rawFormat.includes('constructed')) format = 'cc';
            else if (rawFormat.includes('silver') || rawFormat.includes('age')) format = 'silver';
            else if (rawFormat.includes('blitz')) format = 'silver'; // Map Blitz to Silver for now? Or maintain Blitz if supported.
            return;
        }

        if (cleanLine.toLowerCase().startsWith('name:')) {
            deckName = cleanLine.split(':')[1].trim();
            return;
        }

        // Heuristic: First line is often the Deck Name if it's not a card or other metadata
        // And if we haven't found a name yet.
        if (index === 0 && !deckName && !cleanLine.includes(':') && !cleanLine.match(/^\d/)) {
            // Check if it looks like a card? 
            // If it doesn't start with a number and doesn't look like a known header.
            deckName = cleanLine;
            return;
        }

        // Check for Card
        // First checks for headers to ignore
        const ignoredHeaders = ['arena cards', 'deck cards', 'sideboard', 'inventory', 'main deck', 'weapons', 'equipment'];
        if (ignoredHeaders.some(h => cleanLine.toLowerCase().includes(h))) return;

        // Pattern A: Quantity First "3 Card Name" or "3x Card Name"
        const qtyFirstMatch = cleanLine.match(/^(\d+)[xX]?\s+(.+)$/);

        // Pattern B: Quantity Last "Card Name x3"
        const qtyLastMatch = cleanLine.match(/^(.+)\s+x(\d+)$/);

        let count = 1;
        let rawName = cleanLine;

        if (qtyFirstMatch) {
            count = parseInt(qtyFirstMatch[1], 10);
            rawName = qtyFirstMatch[2];
        } else if (qtyLastMatch) {
            count = parseInt(qtyLastMatch[2], 10);
            rawName = qtyLastMatch[1];
        }

        // Extract Color/Pitch if present "(Red)"
        let pitch = null;
        let name = rawName;

        const pitchMatch = rawName.match(/\((Red|Yellow|Blue)\)/i);
        if (pitchMatch) {
            const color = pitchMatch[1]; // Case insensitive match, but map keys are Title Case
            // Capitalize first letter
            const colorKey = color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
            pitch = pitchMap[colorKey] || null;
            name = rawName.replace(/\s*\(.*\)/, '').trim();
        }

        // Ignore sections headers (Sideboard, Equipment, etc if they don't look like cards)
        // Heuristic: If it has no quantity and wasn't parsed as such, maybe check if known header?
        // But some lists are just "Card Name" (count 1).
        // Let's assume if it looks like a header (endswith ":") skip it.
        if (cleanLine.endsWith(':')) return;

        if (name) {
            cards.push({
                name,
                count,
                pitch
            });
        }
    });

    return { heroName, deckName, format, cards };
};
