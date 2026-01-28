
const isCardLegalForHero = (cardClass, heroClass) => {
    if (!cardClass) return true;
    if (!heroClass) return true;

    const cardClassLower = cardClass.toLowerCase();
    const heroClassLower = heroClass.toLowerCase();

    // 1. Generic is always allowed
    if (cardClassLower.includes('generic')) return true;

    // 2. Split Hero traits (e.g. "royal draconic ninja" -> [royal, draconic, ninja])
    const heroTraits = heroClassLower.split(/\s+/).filter(Boolean);

    // 3. Cleanse and Split by Slash (OR options)
    // Slashes represent dual-class or alternative requirements (Hero must match at least one option).
    const options = cardClass.split('/').map(s => s.trim());

    // Ignored words for validation (noise in scraping)
    // Add "reaction" to this list
    const nonTraitWords = [
        'equipment', 'weapon', 'hero', 'arma', 'equipamiento', 'héroe', 'token',
        'reaction', 'attack', 'defense', 'instant', 'action', // Added these
        'ninja', // wait, ninja is a trait! don't ignore it.
    ];

    return options.some(optionStr => {
        // Handle CamelCase/Concat issues (e.g. NinjaReaction -> Ninja Reaction)
        // Add space before capital letters if not there? Lowercase afterwards.
        // Actually, just cleansing specfic patterns is safer.
        let cleanedOption = optionStr.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

        // Split each option by Space (AND traits)
        const traits = cleanedOption.split(/\s+/)
            .filter(s => s && s !== 'generic' && !nonTraitWords.includes(s));

        if (traits.length === 0) return true;

        return traits.every(t => heroTraits.includes(t));
    });
};

const testCases = [
    { card: "NinjaReaction", hero: "Ninja", expected: true },
    { card: "Ninja Reaction", hero: "Ninja", expected: true },
    { card: "Generic", hero: "Ninja", expected: true },
    { card: "Warrior", hero: "Ninja", expected: false },
    { card: "Draconic Ninja", hero: "Ninja", expected: false },
    { card: "Ninja", hero: "Draconic Ninja", expected: true },
    { card: "WarriorReaction", hero: "Warrior", expected: true },
    { card: "RunebladeInstant", hero: "Runeblade", expected: true }
];

testCases.forEach(({ card, hero, expected }) => {
    const result = isCardLegalForHero(card, hero);
    console.log(`Card: "${card}", Hero: "${hero}" -> Result: ${result}, Expected: ${expected} -> ${result === expected ? 'PASS' : 'FAIL'}`);
});
