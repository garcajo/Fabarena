/**
 * Weapon Resource Costs
 * 
 * Fallback database for weapon activation costs since API text data is missing.
 * Based on "Once per Turn Action - {r}: Attack" abilities.
 * 
 * Key: Weapon Name (exact match)
 * Value: Resource cost (number)
 */
export const WEAPON_COSTS = {
    // Guardian
    'Anothos': 3,
    "Winter's Wail": 3,
    'Sledge of Anvilheim': 4,
    'Titan\'s Fist': 1,
    'Hammer of Havoc': 2,

    // Ninja
    'Harmonized Kodachi': 1,
    'Kadachi, Walking Stick': 1,

    // Warrior
    'Dawnblade': 1,
    'Hatchet of Body': 1,
    'Hatchet of Mind': 1,
    'Cintari Saber': 1,
    'Searing Emberblade': 1,

    // Runeblade
    'Rosetta Thorn': 1,
    'Reaping Blade': 1,
    'Dread Scythe': 3,
    'Nebula Blade': 1,

    // Ranger
    'Death Dealer': 1,
    'Red Liner': 1,
    'Sand Sketched Plan': 0,

    // Mechanologist
    'Teklo Plasma Pistol': 1,
    'Hanabi Blaster': 2,

    // Brute
    'Romping Club': 2,
    'Mandible Claw': 1,

    // Wizard
    'Crucible of Aetherweave': 1,
    'Waning Moon': 2, // Technically instant damage, but treated as attack cost here

    // Illusionist
    'Luminaris': 0, // 0 cost to attack with auras
    'Iris of Reality': 0, // 3 to attack with aura, but weapon itself is passive

    // Generic / Other
    'Talishar, the Lost Prince': 0, // No activation cost
    'Ravenous Rabble': 0
};

/**
 * Default cost if weapon is not found in database
 * Safest to assume 1 so player is prompted to pitch resources
 */
export const DEFAULT_WEAPON_COST = 1;
