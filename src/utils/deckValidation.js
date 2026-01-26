/**
 * Validates if a card is legal for a given hero based on class matching rules.
 * 
 * Rules:
 * 1. Generic cards are always allowed.
 * 2. Hero class matches must be precise subsets (Talent matching).
 *    e.g. "Draconic Ninja" Hero can use "Draconic", "Ninja", or "Draconic Ninja" cards.
 *    e.g. "Ninja" Hero CANNOT use "Draconic Ninja" cards.
 * 3. Cards with "/" (slashes) represent OR options.
 *    e.g. "Assassin / Ninja" means it counts as "Assassin" OR "Ninja".
 *    If the hero matches EITHER side, the card is legal.
 * 
 * @param {string} cardClass - The class string of the card (e.g. "Assassin / Ninja")
 * @param {string} heroClass - The class string of the hero (e.g. "Royal Draconic Ninja")
 * @returns {boolean} - True if legal, false otherwise.
 */
export const isCardLegalForHero = (cardClass, heroClass) => {
    if (!cardClass) return true; // Assume safe if unknown, or handle as generic? Usually backend filters generic.
    if (!heroClass) return true; // No hero context? weak validation.

    const cardClassLower = cardClass.toLowerCase();
    const heroClassLower = heroClass.toLowerCase();

    // 1. Generic is always allowed
    if (cardClassLower.includes('generic')) return true;

    // 2. Split Hero traits (e.g. "royal draconic ninja" -> [royal, draconic, ninja])
    const heroTraits = heroClassLower.split(/\s+/);

    // 3. Handle "/" in card class as OR. (e.g. "Assassin / Ninja" -> ["Assassin", "Ninja"])
    // Split by slash first
    const cardOptions = cardClassLower.split('/').map(s => s.trim());

    // 4. Check if AT LEAST ONE option is valid
    // An option is valid if ALL its words are found in the hero's traits.
    return cardOptions.some(optionStr => {
        const optionTraits = optionStr.split(/\s+/);
        return optionTraits.every(trait => heroTraits.includes(trait));
    });
};
