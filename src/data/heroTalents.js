// Mapping of Heroes to their Implicit Talents
// This is needed because the DB 'clase' column often just says "Elemental Runeblade"
// without explicitly listing "Earth" or "Lightning", causing filters to miss cards.

export const HERO_TALENTS = {
    // Runeblades
    'Briar': ['Earth', 'Lightning'],
    'Florian': ['Earth'],
    'Verdance': ['Earth'],
    'Aurora': ['Lightning'],
    'Viserai': ['Shadow'], // Sometimes needed if just "Runeblade" in DB
    'Chane': ['Shadow'],

    // Guardians
    'Oldhim': ['Earth', 'Ice'],

    // Rangers
    'Lexi': ['Ice', 'Lightning'],

    // Wizards
    'Iyslander': ['Ice'],
    'Oscilio': ['Lightning'],

    // Illusionists
    'Prism': ['Light'], // Usually explicit, but safe to add
    'Dromai': ['Draconic'],

    // Ninjas
    'Fai': ['Draconic'],

    // Brutes
    // Levia (Shadow) usually explicit

    // Mechanologist
    // Dash I/O etc usually just Mech

    // Warrior
    // Kassai, Dori etc.

    // Assassin
    'Arakni': [], // Solitary?
    'Uzuri': [],
    'Nuu': ['Mystic'],

    // Mystic
    'Zen': ['Mystic'],

    // Dracai (Enigma, etc)
};
