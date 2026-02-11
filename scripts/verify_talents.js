
// IMPLEMENTATION LOGIC COPIED FOR STANDALONE TEST
const HERO_TRAIT_MAP = {
    'Oldhim': ['Ice', 'Earth', 'Elemental', 'Guardian'],
    'Briar': ['Earth', 'Lightning', 'Elemental', 'Runeblade'],
    'Florian': ['Earth', 'Elemental', 'Runeblade'],
    'Aurora': ['Lightning', 'Elemental', 'Runeblade'],
    'Lexi': ['Ice', 'Lightning', 'Elemental', 'Ranger'],
    'Iyslander': ['Ice', 'Elemental', 'Wizard'],
    'Verdance': ['Earth', 'Elemental', 'Wizard'],
    'Oscilio': ['Lightning', 'Elemental', 'Wizard'],
    'Terra': ['Earth', 'Elemental', 'Guardian'],
    'Fai': ['Draconic', 'Ninja'],
    'Dromai': ['Draconic', 'Illusionist'],
    'Prism': ['Light', 'Illusionist'],
    'Boltyn': ['Light', 'Warrior'],
    'Levia': ['Shadow', 'Brute'],
    'Chane': ['Shadow', 'Runeblade'],
    'Nuu': ['Mystic', 'Assassin'],
    'Zen': ['Mystic', 'Ninja'],
    'Enigma': ['Mystic', 'Illusionist'],
};

const getHeroTraits = (hero) => {
    if (!hero) return [];
    const explicitTraits = (hero.clase || '').toLowerCase().split(/\s+/).filter(Boolean);
    let implicitTraits = [];
    const heroName = (hero.name || '').toLowerCase();

    for (const [key, traits] of Object.entries(HERO_TRAIT_MAP)) {
        if (heroName.includes(key.toLowerCase())) {
            implicitTraits = traits.map(t => t.toLowerCase());
            break;
        }
    }
    const combined = new Set([...explicitTraits, ...implicitTraits, 'generic']);
    return Array.from(combined);
};

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
    const options = cardClass.split('/').map(s => s.trim());

    const nonTraitWords = [
        'equipment', 'weapon', 'hero', 'arma', 'equipamiento', 'héroe', 'token',
        'reaction', 'attack', 'defense', 'instant', 'action'
    ];

    return options.some(optionStr => {
        let cleanedOption = optionStr.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
        const traits = cleanedOption.split(/[\s,]+/)
            .filter(s => s && s !== 'generic' && !nonTraitWords.includes(s));

        if (traits.length === 0) return true;

        return traits.every(t => heroTraits.includes(t));
    });
};

// TEST RUNNER
console.log("Running Hero Traits Verification...");

const testCases = [
    { hero: { name: 'Oldhim', clase: 'Elemental Guardian' }, expected: ['ice', 'earth', 'elemental', 'guardian'] },
    { hero: { name: 'Briar', clase: 'Elemental Runeblade' }, expected: ['earth', 'lightning', 'elemental', 'runeblade'] },
    { hero: { name: 'Florian', clase: 'Elemental Runeblade' }, expected: ['earth', 'elemental', 'runeblade'] },
    { hero: { name: 'Katsu', clase: 'Ninja' }, expected: ['ninja', 'generic'] },
    { hero: { name: 'Fai', clase: 'Draconic Ninja' }, expected: ['draconic', 'ninja', 'generic'] }
];

let finalStatus = true;

testCases.forEach(({ hero, expected }) => {
    const traits = getHeroTraits(hero);
    // Relaxed check: just ensure expected are present
    const allExpectedPresent = expected.every(t => traits.includes(t));

    if (allExpectedPresent) {
        console.log(`✅ ${hero.name}: Traits OK`);
    } else {
        console.error(`❌ ${hero.name}: Failed. Expected at least ${expected.join(', ')}. Got ${traits.join(', ')}`);
        finalStatus = false;
    }
});

console.log("\nRunning Validation Logic Verification...");

const briarTraits = getHeroTraits({ name: 'Briar', clase: 'Elemental Runeblade' }).join(' ');
console.log(`Using helper method traits for Briar: "${briarTraits}"`);

const validationTests = [
    { cardClass: 'Earth Action', heroTraits: briarTraits, shouldPass: true, caseName: 'Briar uses Earth card' },
    { cardClass: 'Lightning Action', heroTraits: briarTraits, shouldPass: true, caseName: 'Briar uses Lightning card' },
    { cardClass: 'Ice Action', heroTraits: briarTraits, shouldPass: false, caseName: 'Briar uses Ice card (Should Fail)' },
    { cardClass: 'Elemental Action', heroTraits: briarTraits, shouldPass: true, caseName: 'Briar uses Elemental card' },
    { cardClass: 'Runeblade Action', heroTraits: briarTraits, shouldPass: true, caseName: 'Briar uses Runeblade card' }
];

validationTests.forEach(({ cardClass, heroTraits, shouldPass, caseName }) => {
    const result = isCardLegalForHero(cardClass, heroTraits);
    if (result === shouldPass) {
        console.log(`✅ ${caseName}: Passed`);
    } else {
        console.error(`❌ ${caseName}: Failed. Expected ${shouldPass}, got ${result}`);
        finalStatus = false;
    }
});

if (!finalStatus) process.exit(1);
