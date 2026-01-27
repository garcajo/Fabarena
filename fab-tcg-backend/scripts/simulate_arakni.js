const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// 1. DUPLICATE LOGIC FROM deckValidation.js
const isCardLegalForHero = (cardClass, heroClass) => {
    if (!cardClass || cardClass.toLowerCase().includes('generic')) return true;
    if (!heroClass) return true;

    const heroClassLower = heroClass.toLowerCase();
    const heroTraits = heroClassLower.split(/\s+/).filter(Boolean);
    const nonTraitWords = ['equipment', 'weapon', 'hero', 'arma', 'equipamiento', 'héroe', 'token'];

    // Split by slash
    const options = cardClass.toLowerCase().split('/').map(s => s.trim());

    return options.some(optionStr => {
        // Split by space
        const traits = optionStr.split(/\s+/)
            .filter(s => s && s !== 'generic' && !nonTraitWords.includes(s));

        if (traits.length === 0) return true;
        return traits.every(t => heroTraits.includes(t));
    });
};

// 2. DUPLICATE LOGIC FROM EquipmentSelection.jsx / api.js
async function simulateFetch() {
    console.log('--- SIMULATING ARRAY FETCH FOR ARAKNI ---');

    const hero = { clase: 'Assassin' };
    const heroClassKeywords = hero.clase.split(/[\s\/]+/).filter(Boolean);
    // ["Assassin"]

    const claseFilter = [...heroClassKeywords, 'Generic']; // ["Assassin", "Generic"]
    const typeFilter = [
        'Equipment', 'Weapon', 'Head', 'Chest', 'Arms', 'Legs', 'Off-Hand',
        'Equipamiento', 'Arma', 'Cabeza', 'Pecho', 'Brazos', 'Piernas', 'Mano-Secundaria'
    ];

    // Build Query
    let query = supabase.from('cards').select('name, clase, tipo, set_code');

    // Filter by Class (OR)
    const orCondition = claseFilter.map(c => `clase.ilike.%${c}%`).join(',');
    query = query.or(orCondition);

    // Filter by Type (OR)
    const typeOr = typeFilter.map(t => `tipo.ilike.%${t}%`).join(',');
    query = query.or(typeOr);

    // FETCH
    const { data, error } = await query.limit(1000); // Just grab a batch

    if (error) { console.error(error); return; }

    console.log(`Fetched ${data.length} items.`);

    // 3. CHECK BLACKTEK WHISPERERS
    const blackteks = data.filter(c => c.name.includes('Blacktek'));
    console.log(`Found ${blackteks.length} Blacktek items in fetch.`);

    if (blackteks.length > 0) {
        const check = blackteks[0];
        const legal = isCardLegalForHero(check.clase, hero.clase);
        console.log(`Legality Check for ${check.name} (${check.clase}) vs Hero (${hero.clase}): ${legal}`);
    } else {
        console.log('❌ Blacktek Whisperers NOT found in basic fetch. Query issue?');
        // Debug query params
        console.log('Class Filter Sent:', orCondition);
        console.log('Type Filter Sent:', typeOr);
    }
}

simulateFetch();
