const fetch = require('node-fetch');
const supabase = require('../config/supabase');

/**
 * LivingLegendService
 * Handles fetching, scraping, and updating Living Legend points.
 */
const LivingLegendService = {

    /**
     * Fallback data in case scraping fails entirely.
     * Updated Feb 2026.
     */
    FALLBACK_DATA: [
        // Active Heroes
        { name: "Kayo, Armed and Dangerous", points: 959, rank: "1", status: "Active", class: "Brute" },
        { name: "Verdance, Thorn of the Rose", points: 876, rank: "2", status: "Active", class: "Wizard" },
        { name: "Prism, Awakener of Sol", points: 874, rank: "3", status: "Active", class: "Illusionist" },
        { name: "Fai, Rising Rebellion", points: 821, rank: "4", status: "Active", class: "Ninja" },
        { name: "Cindra, Dracai of Retribution", points: 778, rank: "5", status: "Active", class: "Dracai" },
        { name: "Bravo, Showstopper", points: 769, rank: "6", status: "Active", class: "Guardian" },
        { name: "Dorinthea Ironsong", points: 708, rank: "7", status: "Active", class: "Warrior" },
        { name: "Katsu, the Wanderer", points: 690, rank: "8", status: "Active", class: "Ninja" },
        { name: "Kassai of the Golden Sand", points: 688, rank: "9", status: "Active", class: "Warrior" },

        // Ascended Heroes
        { name: "Zen, Tamer of Purpose", points: 1000, rank: "Ascended", status: "Ascended", class: "Ninja" },
        { name: "Bravo, Star of the Show", points: 1582, rank: "Ascended", status: "Ascended", class: "Guardian" },
        { name: "Briar, Warden of Thorns", points: 1158, rank: "Ascended", status: "Ascended", class: "Runeblade" },
        { name: "Chane, Bound by Shadow", points: 1102, rank: "Ascended", status: "Ascended", class: "Runeblade" },
        { name: "Dromai, Ash Artist", points: 1096, rank: "Ascended", status: "Ascended", class: "Illusionist" },
        { name: "Lexi, Livewire", points: 1276, rank: "Ascended", status: "Ascended", class: "Ranger" },
        { name: "Oldhim, Grandfather of Eternity", points: 1186, rank: "Ascended", status: "Ascended", class: "Guardian" },
        { name: "Prism, Sculptor of Arc Light", points: 1098, rank: "Ascended", status: "Ascended", class: "Illusionist" },
        { name: "Iyslander, Stormbind", points: 1012, rank: "Ascended", status: "Ascended", class: "Wizard" },
        { name: "Kano, Dracai of Aether", points: 1028, rank: "Ascended", status: "Ascended", class: "Wizard" },
        { name: "Viserai, Rune Blood", points: 1016, rank: "Ascended", status: "Ascended", class: "Runeblade" },
        { name: "Dash, Inventor Extraordinaire", points: 1013, rank: "Ascended", status: "Ascended", class: "Mechanologist" },
        { name: "Nuu, Alluring Desire", points: 1004, rank: "Ascended", status: "Ascended", class: "Assassin" },
        { name: "Enigma, Ledger of Ancestry", points: 1046, rank: "Ascended", status: "Ascended", class: "Illusionist" },
        { name: "Azalea, Ace in the Hole", points: 1036, rank: "Ascended", status: "Ascended", class: "Ranger" },
        { name: "Florian, Rotwood Harbinger", points: 1029, rank: "Ascended", status: "Ascended", class: "Runeblade" },
        { name: "Aurora, Shooting Star", points: 1051, rank: "Ascended", status: "Ascended", class: "Runeblade" }
    ],

    /**
     * Comprehensive mapper of heroes to their primary class/type.
     * Used to enrich scraped data.
     */
    HERO_CLASS_MAP: {
        "Arakni": "Assassin",
        "Aurora": "Elemental Runeblade",
        "Azalea": "Ranger",
        "Benji": "Ninja",
        "Betsy": "Guardian",
        "Blasmophet": "Shadow Demi",
        "Blaze": "Wizard",
        "Bolfar": "Guardian",
        "Boltyn": "Light Warrior",
        "Bravo": "Guardian",
        "Brevant": "Guardian",
        "Briar": "Elemental Runeblade",
        "Chane": "Shadow Runeblade",
        "Cindra": "Draconic Ninja",
        "Dash": "Mechanologist",
        "Data Doll": "Mechanologist",
        "Dorinthea": "Warrior",
        "Dromai": "Draconic Illusionist",
        "Emperor": "Royal Draconic Warrior Wizard",
        "Enigma": "Mystic Illusionist",
        "Fai": "Draconic Ninja",
        "Fang": "Warrior",
        "Florian": "Elemental Runeblade",
        "Genis Wotchuneed": "Merchant",
        "Ira": "Ninja",
        "Iyslander": "Elemental Wizard",
        "Jarl": "Elemental Guardian",
        "Kano": "Wizard",
        "Kassai": "Warrior",
        "Katsu": "Ninja",
        "Kavdaen": "Merchant",
        "Kayo": "Brute",
        "Levia": "Shadow Brute",
        "Lexi": "Elemental Ranger",
        "Maxx Nitro": "Mechanologist",
        "Maxx 'The Hype' Nitro": "Mechanologist",
        "Melody": "Bard",
        "Nuu": "Mystic Assassin",
        "Oldhim": "Elemental Guardian",
        "Olympia": "Warrior",
        "Oscilio": "Elemental Wizard",
        "Prism": "Light Illusionist",
        "Pleiades": "Guardian",
        "Puffin": "Mechanologist",
        "Marlynn": "Ranger",
        "Lyath Goldmane": "Guardian",
        "Gravy Bones": "Brute",
        "Rhinar": "Brute",
        "Riptide": "Ranger",
        "Shiyana": "Shapeshifter",
        "Teklovossen": "Mechanologist",
        "Terra": "Elemental Guardian",
        "Uzuri": "Assassin",
        "Zen": "Mystic Ninja",
        "Valda": "Guardian",
        "Verdance": "Elemental Wizard",
        "Victor": "Guardian",
        "Viserai": "Runeblade",
        "Vynnset": "Shadow Runeblade",
        "Yoji": "Guardian"
    },

    /**
     * Infers the hero class from their name.
     */
    getHeroClass(heroName) {
        if (!heroName) return 'Unknown';

        // Try exact match or base name (before comma)
        const baseName = heroName.split(',')[0].trim();
        if (this.HERO_CLASS_MAP[baseName]) return this.HERO_CLASS_MAP[baseName];

        // Try substring match in common names
        for (const [key, value] of Object.entries(this.HERO_CLASS_MAP)) {
            if (heroName.includes(key)) return value;
        }

        return 'Unknown';
    },

    /**
     * Helper to decode HTML entities
     */
    decodeHtmlEntities(text) {
        if (!text) return text;
        return text
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&#x27;/g, "'")
            .replace(/&#8216;/g, "'")
            .replace(/&#8217;/g, "'")
            .replace(/&#8220;/g, '"')
            .replace(/&#8221;/g, '"')
            .replace(/&#8211;/g, '-')
            .replace(/&#8212;/g, '-')
            .replace(/&ndash;/g, '-')
            .replace(/&mdash;/g, '-')
            .replace(/\s+/g, ' ')
            .trim();
    },

    /**
     * Scrapes the official FABTCG Living Legend page.
     * Returns an array of hero objects or throws error.
     */
    async scrapeOfficialSite() {
        console.log("[LivingLegendService] Starting scrape...");
        const url = 'https://fabtcg.com/resources/rules-and-policy-center/living-legend/';

        // Use realistic headers to avoid basic 403 blocks
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://fabtcg.com/',
                'Cache-Control': 'max-age=0',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-User': '?1'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch LL page: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        const activeHeroes = [];

        // Simple parsing logic (robust enough for standard table structure)
        // We look for <tr> tags and extract <td> content
        const rows = html.split('<tr');

        for (const row of rows) {
            // Extract cell content
            const cells = row.split(/<td[^>]*>/).slice(1).map(c => c.split('</td>')[0].trim());

            if (cells.length >= 3) {
                // Approximate column structure: Rank | Hero Name | ... | Points
                let rank = this.decodeHtmlEntities(cells[0].replace(/<[^>]*>/g, ''));
                let heroName = this.decodeHtmlEntities(cells[1].replace(/<[^>]*>/g, ''));
                let pointsStr = this.decodeHtmlEntities(cells[cells.length - 1].replace(/<[^>]*>/g, ''));

                // Determine Status
                let status = 'Active';
                if (rank === 'LL' || rank.includes('Ascended')) {
                    status = 'Ascended';
                }

                const points = parseInt(pointsStr, 10);

                // Validation
                // Filter out headers, empty rows, or invalid names
                const isValidName = heroName && heroName.length > 2 && heroName !== '-' && !heroName.includes('Season');

                if (isValidName && !isNaN(points) && points > 0) {
                    // Avoid duplicates (sometimes scraping picks up multiple tables)
                    const existing = activeHeroes.find(h => h.name === heroName);
                    if (!existing) {
                        activeHeroes.push({
                            hero_name: heroName,
                            points: points,
                            rank: rank,
                            status: status,
                            class: this.getHeroClass(heroName),
                            updated_at: new Date()
                        });
                    }
                }
            }
        }

        if (activeHeroes.length === 0) {
            throw new Error("Scrape successful but found 0 heroes. HTML structure might have changed.");
        }

        console.log(`[LivingLegendService] Scraped ${activeHeroes.length} heroes successfully.`);
        return activeHeroes;
    },

    /**
     * Updates the database with fresh data.
     * Called by Cron Job or manual trigger.
     */
    async updateLeaderboard() {
        try {
            console.log("[LivingLegendService] Triggering leaderboard update...");
            const heroData = await this.scrapeOfficialSite();

            // Upsert to Supabase
            const { error: upsertError } = await supabase
                .from('living_legend_leaderboard')
                .upsert(heroData, { onConflict: 'hero_name' });

            if (upsertError) {
                console.error("[LivingLegendService] DB Upsert failed:", upsertError);
                throw upsertError;
            }

            console.log("[LivingLegendService] Database updated successfully.");
            return { success: true, count: heroData.length };
        } catch (error) {
            console.error("[LivingLegendService] Update failed:", error);
            // We don't return fallback here, as this is an update action.
            // We return error details.
            return { success: false, error: error.message };
        }
    },

    /**
     * Gets the current leaderboard.
     * Serves from DB Cache if fresh (> 7 days).
     * Triggers scraping if stale or forced.
     */
    async getLeaderboard(forceRefresh = false) {
        try {
            // 1. Check DB Cache first
            const { data: cachedData, error: dbError } = await supabase
                .from('living_legend_leaderboard')
                .select('*')
                .order('points', { ascending: false });

            if (dbError) throw dbError;

            // Check freshness
            const lastUpdated = (cachedData && cachedData.length > 0 && cachedData[0].updated_at)
                ? new Date(cachedData[0].updated_at) : new Date(0);

            // 7 days expiration
            const isStale = (new Date() - lastUpdated) > (7 * 24 * 60 * 60 * 1000);

            // If fresh and not forced, return cache
            if (!forceRefresh && !isStale && cachedData.length > 0) {
                return this.normalizeForFrontend(cachedData);
            }

            // If stale or forced, try to update
            if (forceRefresh || isStale) {
                console.log("[LivingLegendService] Cache stale or refresh requested. Updating...");
                const updateResult = await this.updateLeaderboard();

                if (updateResult.success) {
                    // Fetch fresh data
                    const { data: freshData } = await supabase
                        .from('living_legend_leaderboard')
                        .select('*')
                        .order('points', { ascending: false });
                    return this.normalizeForFrontend(freshData);
                } else {
                    console.warn("[LivingLegendService] Update failed, serving stale cache if available.");
                    if (cachedData.length > 0) return this.normalizeForFrontend(cachedData);
                }
            }

            // Fallback if no cache and update failed
            return this.normalizeForFrontend(this.FALLBACK_DATA, true);

        } catch (error) {
            console.error("[LivingLegendService] getLeaderboard error:", error);
            return this.normalizeForFrontend(this.FALLBACK_DATA, true);
        }
    },

    /**
     * Normalizes DB/Internal data to Frontend format
     */
    normalizeForFrontend(data, isFallback = false) {
        if (isFallback) {
            // Fallback data already has 'name', 'status' etc keys correct for frontend?
            // Actually FALLBACK_DATA uses 'name', DB uses 'hero_name'.
            // Let's standardise.
            return data.map(h => ({
                name: h.name || h.hero_name,
                points: h.points,
                rank: h.rank,
                status: h.status || (h.rank === 'Ascended' ? 'Ascended' : 'Active'),
                class: h.class || 'Unknown'
            }));
        }

        return data.map(h => ({
            name: h.hero_name,
            points: h.points,
            rank: h.rank,
            status: h.status,
            class: h.class
        }));
    }
};

module.exports = LivingLegendService;
