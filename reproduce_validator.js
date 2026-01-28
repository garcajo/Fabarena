
import { isCardLegalForHero } from './src/utils/deckValidation.js';

const testCases = [
    { card: "NinjaReaction", hero: "Ninja", expected: true },
    { card: "Ninja Reaction", hero: "Ninja", expected: true },
    { card: "Generic", hero: "Ninja", expected: true },
    { card: "Warrior", hero: "Ninja", expected: false },
    { card: "Draconic Ninja", hero: "Ninja", expected: false }, // Ninja implies pure ninja? No, Draconic Ninja card needs Draconic AND Ninja traits from Hero. Wait.
    // Rule: Card requirements must be met by Hero traits.
    // Card: "Draconic Ninja" -> Needs Draconic AND Ninja.
    // Hero: "Ninja" -> Only has Ninja. Missing Draconic. Legal? NO.
    { card: "Ninja", hero: "Draconic Ninja", expected: true },
];

testCases.forEach(({ card, hero, expected }) => {
    const result = isCardLegalForHero(card, hero);
    console.log(`Card: "${card}", Hero: "${hero}" -> Result: ${result}, Expected: ${expected} -> ${result === expected ? 'PASS' : 'FAIL'}`);
});
