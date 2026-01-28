
const isCardLegalForHero = (cardClass, heroClass) => {
    if (!cardClass) return true;
    if (!heroClass) return true;

    const cardClassLower = cardClass.toLowerCase();
    const heroClassLower = heroClass.toLowerCase();

    // 1. Generic is always allowed
    if (cardClassLower.includes('generic')) return true;

    // 2. Split Hero traits
    const heroTraits = heroClassLower.split(/\s+/).filter(Boolean);

    // 3. Cleanse and Split by Slash
    const options = cardClass.split('/').map(s => s.trim());

    // Ignored words for validation (noise in scraping or malformed data)
    const nonTraitWords = [
        'equipment', 'weapon', 'hero', 'arma', 'equipamiento', 'héroe', 'token',
        'reaction', 'attack', 'defense', 'instant', 'action'
    ];

    return options.some(optionStr => {
        // Handle CamelCase/Concat issues (e.g. NinjaReaction -> Ninja Reaction)
        let cleanedOption = optionStr.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

        const traits = cleanedOption.split(/\s+/)
            .filter(s => s && s !== 'generic' && !nonTraitWords.includes(s));

        if (traits.length === 0) return true;

        return traits.every(t => heroTraits.includes(t));
    });
};

// Simulated card data for Flic Flak
const flicFlak = {
    name: "Flic Flak",
    clase: "NinjaReaction",
    tipo: "Ninja Defense Reaction",
    pitch: 1
};

// Verify client side filtering logic from DeckBuilder
const testDeckBuilderLogic = (heroClass) => {
    console.log(`--- Testing Hero Class: ${heroClass} ---`);

    // 1. Simulate Backend Params Construction
    const paramsClase = [...(heroClass || '').split(' '), ...(heroClass || '').split('/'), 'Generic'].filter(Boolean);
    console.log("Backend Params 'clase':", paramsClase);

    // 2. Simulate Client Side Filtering
    const legal = isCardLegalForHero(flicFlak.clase, heroClass);
    console.log(`isCardLegalForHero("${flicFlak.clase}", "${heroClass}") -> ${legal}`);

    // 3. Simulate Type Exclusion
    const type = (flicFlak.tipo || '').toLowerCase();
    const excludedTypes = ['weapon', 'arma', 'head', 'cabeza', 'chest', 'pecho', 'arms', 'brazos', 'legs', 'piernas', 'off-hand', 'mano-secundaria', 'equipment', 'equipamiento'];
    const isExcluded = excludedTypes.some(t => type.includes(t));
    console.log(`Is Excluded Type ("${type}")? ${isExcluded}`);
};

testDeckBuilderLogic("Ninja");
testDeckBuilderLogic("Draconic Ninja");
