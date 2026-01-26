import { WEAPON_COSTS, DEFAULT_WEAPON_COST } from './weapon-data';

/**
 * Flesh and Blood Comprehensive Rules Summary
 * Extracted from official FAB CR document for use in Deck Playtester
 * 
 * Key Game Concepts (from FAB Comprehensive Rules):
 */

export const FAB_RULES = {
    /**
     * GAME STRUCTURE (Section 4)
     * - Start Phase: Effects at start of turn, no priority
     * - Action Phase: Main gameplay, players gain priority
     * - End Phase: Cleanup, draw up to intellect
     */

    /**
     * RESOURCES AND PITCHING (Section 1.13-1.14)
     * 
     * Resource Points (1.13.3):
     * - Used to play cards and activate abilities
     * - Gained by pitching cards or effects
     * 
     * Pitching (1.14.3):
     * - Move card from hand to pitch zone
     * - Gain resources equal to pitch value (1, 2, or 3)
     * - Card color corresponds to pitch: Red=1, Yellow=2, Blue=3
     * - Cards without pitch property cannot be pitched
     */
    PITCH_VALUES: {
        RED: 1,
        YELLOW: 2,
        BLUE: 3
    },

    /**
     * ZONES (Section 3)
     * 
     * Arsenal (3.3):
     * - Private zone, can hold 1 face-down or face-up card
     * - Cards can be played from arsenal
     * - At end of turn, may put 1 card face-down from hand
     * 
     * Pitch Zone (3.14):
     * - Public zone, holds pitched cards
     * - At end of turn, all cards go to bottom of deck
     * 
     * Graveyard (3.8):
     * - Public zone for destroyed/discarded cards
     * 
     * Banished Zone (3.4):
     * - Public zone for banished cards
     * - Some cards can be played from banished zone
     * 
     * Combat Chain (3.6):
     * - Zone for attacks and defending cards during combat
     */

    /**
     * EQUIPMENT (Section 8.1.4)
     * 
     * Equipment Rules:
     * - Equipment can be declared as defending during Defend Step (8.1.4b)
     * - Equipment with activated abilities may have resource costs
     * - Battleworn: -1 defense counter when defends (8.3.2)
     * - Blade Break: Destroyed after defending (8.3.3)
     * - Temper: -1 defense counter, destroy if 0 defense (8.3.10)
     */

    /**
     * WEAPONS (Section 8.1.9)
     * 
     * Weapon Rules:
     * - Activated abilities have costs written as {r} symbols
     * - Example: "Once per Turn Action -- {r}{r}: Attack"
     * - Cost is paid before attack resolves
     * - 1H = one-handed, 2H = two-handed
     */

    /**
     * COMBAT (Section 7)
     * 
     * Combat Chain Steps:
     * 1. Layer Step: Attack on stack, players can respond
     * 2. Attack Step: Attack resolves, moves to combat chain
     * 3. Defend Step: Defender declares blocking cards
     * 4. Reaction Step: Attack/Defense reactions can be played
     * 5. Damage Step: Calculate and apply damage
     * 6. Resolution Step: Resolve chain link, gain go again if applicable
     * 7. Close Step: Combat chain closes
     * 
     * Hit (7.5.5):
     * - Attack hits if it deals damage during Damage Step
     * - Power - Total Defense = Damage dealt
     */

    /**
     * GO AGAIN (Section 8.3.5)
     * - Gain 1 action point when card/ability with go again resolves
     * - Player starts action phase with 1 action point
     * - Playing an action card/ability costs 1 action point
     */

    /**
     * END PHASE (Section 4.4)
     * 
     * End of Turn Procedure:
     * 1. Allies life totals reset
     * 2. May put 1 card from hand face-down into arsenal
     * 3. All cards in pitch zone go to bottom of deck
     * 4. Turn player untaps all permanents
     * 5. All players lose all action and resource points
     * 6. Draw up to hero's intellect
     */

    /**
     * COMMON EQUIPMENT ABILITIES
     */
    EQUIPMENT_ABILITIES: {
        ARCANE_BARRIER: 'Pay {r} to prevent arcane damage',
        SPELLVOID: 'Destroy to prevent arcane damage',
        WARD: 'Destroy to prevent damage',
        BATTLEWORN: 'Gets -1 defense counter when defends',
        BLADE_BREAK: 'Destroyed after defending',
        TEMPER: 'Gets -1 defense counter when defends, destroy if 0'
    },

    /**
     * DEFAULT INTELLECT
     * - Most heroes have intellect 4 (draw up to 4 at end of turn)
     * - Opening hand is also typically 4 cards
     */
    DEFAULT_INTELLECT: 4,
    DEFAULT_HAND_SIZE: 4
};

/**
 * Helper function to get pitch value from card data
 * @param {Object} card - Card object with pitch property
 * @returns {number} - Resource value (1-3, or 0 if no pitch)
 */
export function getPitchValue(card) {
    // Pitch can be stored as number or in various formats
    if (typeof card.pitch === 'number') {
        return card.pitch;
    }

    // If pitch is stored as color string
    if (typeof card.pitch === 'string') {
        const pitchLower = card.pitch.toLowerCase();
        if (pitchLower.includes('red') || pitchLower === '1') return 1;
        if (pitchLower.includes('yellow') || pitchLower === '2') return 2;
        if (pitchLower.includes('blue') || pitchLower === '3') return 3;
    }

    return 0; // No pitch value (cannot be pitched for resources)
}

/**
 * Helper function to get card cost (resource cost to play)
 * @param {Object} card - Card object with cost/costo property
 * @returns {number} - Resource cost to play
 */
export function getCardCost(card) {
    // Try various property names for cost
    const cost = card.cost ?? card.costo ?? card.resource_cost ?? 0;
    return typeof cost === 'number' ? cost : parseInt(cost) || 0;
}

/**
 * Helper function to check if card can be pitched
 * @param {Object} card - Card object
 * @returns {boolean} - True if card has pitch property
 */
export function canPitchCard(card) {
    return getPitchValue(card) > 0;
}

/**
 * Helper function to check if card can defend
 * Cards with defense property can defend
 * @param {Object} card - Card object
 * @returns {boolean} - True if card can be used to defend
 */
export function canDefendWith(card) {
    const defense = card.defense ?? card.defensa ?? card.def ?? null;
    return defense !== null && defense !== undefined;
}

/**
 * Helper function to get defense value
 * @param {Object} card - Card object
 * @returns {number} - Defense value
 */
export function getDefenseValue(card) {
    const defense = card.defense ?? card.defensa ?? card.def ?? 0;
    return typeof defense === 'number' ? defense : parseInt(defense) || 0;
}

/**
 * White-bordered sets in FAB (English)
 * Only History Pack 1 (1HP) has white borders in English
 * All other sets have black borders
 */
export const WHITE_BORDER_SETS = ['1HP'];

/**
 * Check if a card is from a black-bordered set
 * @param {Object} card - Card object with set_code property
 * @returns {boolean} - True if black-bordered
 */
export function isBlackBorder(card) {
    const setCode = card.set_code || card.setCode || '';
    return !WHITE_BORDER_SETS.includes(setCode);
}

/**
 * Check if a card is a Weapon
 * Weapons have "Weapon" in their card_type (e.g., "Guardian Weapon - Hammer (2H)")
 * @param {Object} card - Card object
 * @returns {boolean} - True if weapon
 */
export function isWeapon(card) {
    const cardType = (card.card_type || card.tipo || '').toLowerCase();
    return cardType.includes('weapon');
}

/**
 * Check if a card is Equipment (not a weapon)
 * Equipment has "Equipment" in card_type but NOT "Weapon"
 * @param {Object} card - Card object
 * @returns {boolean} - True if equipment (not weapon)
 */
export function isEquipment(card) {
    const cardType = (card.card_type || card.tipo || '').toLowerCase();
    return cardType.includes('equipment') && !cardType.includes('weapon');
}

/**
 * Get power value from card
 * @param {Object} card - Card object
 * @returns {number} - Power value
 */
export function getPowerValue(card) {
    const power = card.power ?? card.poder ?? 0;
    return typeof power === 'number' ? power : parseInt(power) || 0;
}

/**
 * Get weapon activation cost (fallback to hardcoded list if text missing)
 * @param {Object} card - Card object
 * @returns {number} - Resource cost
 */
export function getWeaponCost(card) {
    if (!card) return DEFAULT_WEAPON_COST;
    const name = card.name || '';

    // Check exact match
    if (WEAPON_COSTS[name] !== undefined) {
        return WEAPON_COSTS[name];
    }

    // Check partial match (e.g. if name has pitch info appended)
    const knownWeapons = Object.keys(WEAPON_COSTS);
    const match = knownWeapons.find(w => name.includes(w));
    if (match) {
        return WEAPON_COSTS[match];
    }

    return DEFAULT_WEAPON_COST;
}

/**
 * Check if card has "Go again"
 * @param {Object} card - Card object
 * @returns {boolean} - True if card has go again
 */
export function hasGoAgain(card) {
    if (!card) return false;
    // Check keywords array if available
    if (card.keywords && Array.isArray(card.keywords)) {
        if (card.keywords.some(k => k.toLowerCase() === 'go again')) return true;
    }

    // Check text/texto fields
    const text = (card.texto || card.text || '').toLowerCase();
    return text.includes('go again');
}

export default FAB_RULES;

