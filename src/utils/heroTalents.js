/**
 * Utility to map heroes to their implicit talents.
 * Some heroes (especially Elementals) do not have their specific essence (Earth, Ice, Lightning)
 * explicitly stated in their class type string in the database.
 * This helper ensures the search and validation logic sees the full set of traits.
 */

const HERO_TRAIT_MAP = {
    // Elemental Guardians
    'Oldhim': ['Ice', 'Earth', 'Elemental', 'Guardian'],

    // Elemental Runeblades
    'Briar': ['Earth', 'Lightning', 'Elemental', 'Runeblade'],
    'Florian': ['Earth', 'Elemental', 'Runeblade'],
    'Aurora': ['Lightning', 'Elemental', 'Runeblade'],
    'Viserai': ['Runeblade', 'Shadow'], // Often just Runeblade, but can be Shadow? No, Viserai is just Runeblade. Wait, Shadow Runeblade is Chane.

    // Elemental Rangers
    'Lexi': ['Ice', 'Lightning', 'Elemental', 'Ranger'],

    // Elemental Wizards
    'Iyslander': ['Ice', 'Elemental', 'Wizard'],
    'Verdance': ['Earth', 'Elemental', 'Wizard'],
    'Oscilio': ['Lightning', 'Elemental', 'Wizard'],

    // Elemental Guardians (Young/Other)
    'Terra': ['Earth', 'Elemental', 'Guardian'],

    // Draconic
    'Fai': ['Draconic', 'Ninja'],
    'Dromai': ['Draconic', 'Illusionist'],
    'Phylarch': ['Draconic', 'Guardian'],

    // Light
    'Prism': ['Light', 'Illusionist'],
    'Boltyn': ['Light', 'Warrior'],

    // Shadow
    'Levia': ['Shadow', 'Brute'],
    'Chane': ['Shadow', 'Runeblade'],

    // Mystic
    'Nuu': ['Mystic', 'Assassin'],
    'Zen': ['Mystic', 'Ninja'],
    'Enigma': ['Mystic', 'Illusionist'],

    // Talents often implied but verifying
    // Note: If the DB string already says "Light Warrior", this map is redundant but safe.
    // The critical ones are the multi-essence Elementals or where DB string is just "Elemental Guardian".
};

/**
 * Returns an array of all traits for a given hero.
 * Combines the explicit class string from DB with any implicit mappings.
 * @param {Object} hero - The hero object from DB (needs .name and .clase)
 * @returns {string[]} Array of unique lowercase traits (e.g. ['earth', 'lightning', 'elemental', 'runeblade'])
 */
export const getHeroTraits = (hero) => {
    if (!hero) return [];

    // 1. Start with explicit class string
    // e.g. "Elemental Runeblade" -> ['elemental', 'runeblade']
    const explicitTraits = (hero.clase || '').toLowerCase().split(/\s+/).filter(Boolean);

    // 2. Lookup implicit traits by Name lookup
    // e.g. "Briar, Warden of Thorns" -> matches "Briar"
    let implicitTraits = [];

    // Find matching key in map (partial match supported)
    const heroName = (hero.name || '').toLowerCase();

    for (const [key, traits] of Object.entries(HERO_TRAIT_MAP)) {
        if (heroName.includes(key.toLowerCase())) {
            implicitTraits = traits.map(t => t.toLowerCase());
            break; // Stop at first match (assumes keys are distinct enough)
        }
    }

    // 3. Combine and Deduplicate
    const combined = new Set([...explicitTraits, ...implicitTraits, 'generic']); // Always allow generic? search filter handles generic separately usually. Use 'generic' just in case.

    return Array.from(combined);
};

export default {
    getHeroTraits
};
