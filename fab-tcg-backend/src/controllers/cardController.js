const fetch = require('node-fetch');
const cardService = require('../services/cardService');

/**
 * Obtiene todas las cartas con opciones de paginación y filtros
 * Query params: page, pageSize, search, clase, set, rareza
 */
const getAllCards = async (req, res) => {
    try {
        const {
            page = 0,
            pageSize = 20,
            search = '',
            clase = '',
            set = '',
            rareza = '',
            pitch = '',
            costo = '',
            type = ''
        } = req.query;

        console.log('➡️ [DEBUG] Entered getAllCards controller'); // DEBUG LOG

        // Helper function to ensure array format for multi-value params
        const ensureArray = (param) => {
            if (!param) return param;
            return Array.isArray(param) ? param : [param];
        };

        const options = {
            page: parseInt(page, 10),
            pageSize: parseInt(pageSize, 10),
            search,
            clase: clase ? ensureArray(clase) : '',
            set: set ? ensureArray(set) : '',
            rareza: rareza ? ensureArray(rareza) : '',
            pitch: pitch ? ensureArray(pitch) : '',
            costo: costo ? ensureArray(costo) : '',
            type: type ? ensureArray(type) : ''
        };

        // Debug logging for rareza filter
        if (options.rareza && options.rareza.length > 0) {
            console.log('🔍 Rareza filter received:', options.rareza);
        }

        const { data, count } = await cardService.getAllCards(options);

        res.json({
            data,
            count,
            page: options.page,
            pageSize: options.pageSize,
            totalPages: Math.ceil(count / options.pageSize)
        });
    } catch (error) {
        console.error('Error fetching cards:', error);
        res.status(500).json({
            error: 'Error al obtener las cartas',
            message: error.message
        });
    }
};

/**
 * Obtiene una carta por su ID
 */
const getCardById = async (req, res) => {
    try {
        const { id } = req.params;
        const card = await cardService.getCardById(id);

        if (!card) {
            return res.status(404).json({
                error: 'Carta no encontrada',
                id
            });
        }

        res.json(card);
    } catch (error) {
        console.error('Error fetching card:', error);

        // Manejar error de ID inválido
        if (error.message.includes('invalid input syntax')) {
            return res.status(400).json({
                error: 'ID de carta inválido',
                message: 'El ID debe ser un UUID válido'
            });
        }

        res.status(500).json({
            error: 'Error al obtener la carta',
            message: error.message
        });
    }
};

/**
 * Obtiene las clases disponibles
 */
const getClasses = async (req, res) => {
    try {
        const classes = await cardService.getClasses();
        res.json(classes);
    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({
            error: 'Error al obtener las clases',
            message: error.message
        });
    }
};

/**
 * Obtiene los sets disponibles
 */
const getSets = async (req, res) => {
    try {
        const sets = await cardService.getSets();
        res.json(sets);
    } catch (error) {
        console.error('Error fetching sets:', error);
        res.status(500).json({
            error: 'Error al obtener los sets',
            message: error.message
        });
    }
};

/**
 * Endpoint para buscar múltiples cartas por nombre
 */
const getCardsByNames = async (req, res) => {
    try {
        const { names } = req.body;
        if (!Array.isArray(names)) {
            return res.status(400).json({ error: 'Body must contain "names" array' });
        }

        const cards = await cardService.getCardsByNames(names);
        res.json(cards);
    } catch (error) {
        console.error('Error batch looking up cards:', error);
        res.status(500).json({ error: 'Error al buscar cartas' });
    }
};

/**
 * Scrapes the official Living Legend Leaderboard
 */
const getLivingLegendData = async (req, res) => {
    try {
        console.log("Scraping Living Legend data...");
        const url = 'https://fabtcg.com/resources/rules-and-policy-center/living-legend/';
        const response = await fetch(url);
        const html = await response.text();

        const activeHeroes = [];

        // Find the "Living Legend Leaderboard" section manually or via regex
        // Simple regex for table rows: 
        // <tr>...<td>Rank</td><td>Hero</td><td>Season</td><td>Points</td>...</tr>

        // Match all rows in the table body. 
        // Note: HTML might have attributes or newlines.
        // We look for patterns like: <td>1</td><td>Florian...</td>

        // Split by <tr> to process row by row
        // Skip header row if possible, but our logic checks for 4 cells which usually only body rows have in this specific table
        const rows = html.split('<tr');

        // Helper to decode HTML entities
        const decodeHtmlEntities = (text) => {
            if (!text) return text;
            return text
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'")
                .replace(/&#x27;/g, "'")
                .replace(/&#8216;/g, "'") // Left single quote
                .replace(/&#8217;/g, "'") // Right single quote (apostrophe)
                .replace(/&#8220;/g, '"') // Left double quote
                .replace(/&#8221;/g, '"') // Right double quote
                .replace(/&#8211;/g, '-') // En dash
                .replace(/&#8212;/g, '-') // Em dash
                .replace(/&ndash;/g, '-')
                .replace(/&mdash;/g, '-')
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();
        };

        for (const row of rows) {
            // Check if this row looks like a data row (has 4 columns roughly)
            // It should contain the hero name and points

            // Extract cell contents
            // Simple approach: split by <td...>, then take content before </td>
            const cells = row.split(/<td[^>]*>/).slice(1).map(c => c.split('</td>')[0].trim());

            // Expected: [Rank, Hero, Season, Points] OR [Rank(LL), Hero, Points]
            if (cells.length >= 3) {
                let rank = decodeHtmlEntities(cells[0].replace(/<[^>]*>/g, ''));
                let heroName = decodeHtmlEntities(cells[1].replace(/<[^>]*>/g, ''));
                let pointsStr = decodeHtmlEntities(cells[cells.length - 1].replace(/<[^>]*>/g, '')); // Points is always last

                // Handle LL rank
                let status = 'Active';
                if (rank === 'LL' || rank === 'Ascended') {
                    status = 'Ascended';
                }

                // Parse points
                const points = parseInt(pointsStr, 10);

                // Use simple validation to skip headers or separators masquerading as rows
                const isValidName = heroName && heroName.length > 2 && heroName !== '-' && !heroName.includes('Season');

                if (isValidName && !isNaN(points) && points > 0) {
                    // Try to avoid duplicates if scraping multiple tables
                    // (Official page sometimes lists them twice or in summary tables)
                    const existing = activeHeroes.find(h => h.name === heroName);
                    if (!existing) {
                        activeHeroes.push({
                            name: heroName,
                            points: points,
                            rank: rank,
                            status: status,
                            // Class is not in table, frontend can map or we can add map
                            class: 'Unknown' // Frontend maps name to class via hero data
                        });
                    }
                }
            }
        }

        // Removed static list to rely on dynamic scraping which is more accurate
        const ascendedHeroes = [];


        // Combine and Sort
        const allHeroes = [...ascendedHeroes, ...activeHeroes].sort((a, b) => b.points - a.points);

        res.json(allHeroes);
    } catch (error) {
        console.error('Error scraping LL:', error);
        res.status(500).json({ error: 'Failed to fetch Living Legend data' });
    }
};

// ... getLivingLegendData ...

// Hardcoded Silver Age Bans (as per user instruction)
const SILVER_AGE_BANS = [
    "Aether Flare",
    "Aether Ironweave",
    "Amulet of Ice",
    "Ball Lightning",
    "Belittle",
    "Bonds of Ancestry",
    "Cash In",
    "Count Your Blessings",
    "Deadwood Dirge",
    "Drone of Brutality",
    "Electromagnetic Somersault",
    "Fate Foreseen",
    "Fiddler's Green",
    "Flic Flak",
    "Goliath Gauntlet",
    "Heartened Cross Strap",
    "Honing Hood",
    "Mask of Three Tails",
    "Nimby",
    "Old Knocker",
    "Plunder Run",
    "Rake the Embers",
    "Ragamuffin's Hat",
    "Reality Refractor",
    "Rootbound Carapace",
    "Rosetta Thorn",
    "Seeds of Agony",
    "Sigil of Solace",
    "Sink Below",
    "Snapdragon Scalers",
    "Stubby Hammerers",
    "Vest of the First Fist",
    "Vigorous Smashup",
    "Waning Moon",
    "Zephyr Needle"
];

/**
 * Scrapes the official Banned & Suspended list
 */
const getBannedCards = async (req, res) => {
    try {
        console.log("Scraping Banned Cards data...");
        const url = 'https://fabtcg.com/resources/rules-and-policy-center/card-legality-policy/';
        const response = await fetch(url);
        const html = await response.text();

        const bannedData = {
            "Silver Age": SILVER_AGE_BANS // Always include hardcoded Silver Age list
        };
        const formats = ["Classic Constructed", "Blitz", "Commoner", "Ultimate Pit Fight", "Living Legend"];

        for (const fmt of formats) {
            // Find format header area
            // We look for the Header tag containing the format name
            const regex = new RegExp(`(<h[1-6][^>]*>\\s*${fmt}.*?</h[1-6]>)`, 'i');
            const match = html.match(regex);

            if (match) {
                const idx = match.index;
                // Look ahead for "Banned" 
                // We define a reasonable search window (e.g. 2000 chars) or until next format header?
                // Easier: Look for "Banned" within next 5000 chars
                const snippet = html.substring(idx, idx + 10000); // 10k chars should cover it

                if (snippet.includes("Banned")) {
                    // Find <ul> after "Banned"
                    // Be careful not to pick "Suspended" lists or "Living Legend" lists unless targeted
                    // We specifically look for "Banned" header or text

                    const bannedIdx = snippet.indexOf("Banned");
                    // Now find the first <ul> after this "Banned" text
                    const ulStart = snippet.indexOf("<ul", bannedIdx);

                    if (ulStart !== -1) {
                        // Check if this <ul> is too far away (e.g. belonging to another section)
                        // But for now assumes structure <Header>...<Banned>...<ul>

                        const ulEnd = snippet.indexOf("</ul>", ulStart);
                        if (ulEnd !== -1) {
                            const listHtml = snippet.substring(ulStart, ulEnd);
                            // Parse LIs
                            const listItems = listHtml.match(/<li[^>]*>(.*?)<\/li>/gs);

                            if (listItems) {
                                const cards = listItems.map(li => {
                                    // Remove tags
                                    let text = li.replace(/<[^>]*>/g, '').trim();
                                    // Remove explanations in parens if needed (e.g. " (official events only)")
                                    // User might want to keep them or not. Let's keep them for clarity or strip for card matching.
                                    // For now, keep simplest string
                                    return text.replace(/&nbsp;/g, ' ').replace(/&#8211;/g, '-').trim();
                                }).filter(c => c.length > 0);

                                bannedData[fmt] = cards;
                            }
                        }
                    }
                }
            }
        }

        // Return structured data
        res.json(bannedData);
    } catch (error) {
        console.error('Error scraping Bans:', error);
        res.status(500).json({ error: 'Failed to fetch Banned cards' });
    }
};

module.exports = {
    getAllCards,
    getCardById,
    getClasses,
    getSets,
    getCardsByNames,
    getLivingLegendData,
    getBannedCards
};
