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
    const heroTraits = heroClassLower.split(/\s+/).filter(Boolean);

    // 3. Cleanse and Split by Slash (OR options)
    // Slashes represent dual-class or alternative requirements (Hero must match at least one option).
    const options = cardClassLower.split('/').map(s => s.trim());
    const nonTraitWords = ['equipment', 'weapon', 'hero', 'arma', 'equipamiento', 'héroe', 'token'];

    return options.some(optionStr => {
        // Split each option by Space (AND traits)
        // Spaces represent combined requirements like Talent + Class (Hero must match ALL traits in the option).
        const traits = optionStr.split(/\s+/)
            .filter(s => s && s !== 'generic' && !nonTraitWords.includes(s));

        if (traits.length === 0) return true; // Effectively generic or just meta-words

        return traits.every(t => heroTraits.includes(t));
    });
};
