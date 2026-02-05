const fetch = require('node-fetch');
const cardService = require('../services/cardService');
const supabase = require('../config/supabase');

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
const livingLegendService = require('../services/livingLegendService');

const getLivingLegendData = async (req, res) => {
    try {
        const { force } = req.query;
        // Use service to get data (cache first, then scrape logic handled internally)
        const data = await livingLegendService.getLeaderboard(force === 'true');
        res.json(data);
    } catch (error) {
        console.error('Error fetching LL data:', error);
        res.json(livingLegendService.FALLBACK_DATA);
    }
};



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
