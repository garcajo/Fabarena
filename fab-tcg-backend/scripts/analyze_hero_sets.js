require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function analyzeHeroSets() {
    console.log('Fetching all cards with "Hero" type to analyze set codes...');

    // We want to see name and set_code for all Heroes
    const { data: heroes, error } = await supabase
        .from('cards')
        .select('name, set_code')
        .ilike('tipo', '%Hero%');

    if (error) {
        console.error('Error fetching heroes:', error);
        return;
    }

    console.log(`Total hero cards found: ${heroes.length}`);

    // Group by name to see which ones have multiple sets
    const heroesByName = {};
    heroes.forEach(h => {
        if (!heroesByName[h.name]) heroesByName[h.name] = [];
        heroesByName[h.name].push(h.set_code);
    });

    // Print heroes available in multiple sets, especially if one might be HP
    Object.entries(heroesByName).forEach(([name, sets]) => {
        if (sets.length > 1) {
            console.log(`Hero: "${name}" available in sets: [${sets.join(', ')}]`);
        }
    });

    // List all unique set codes found for heroes
    const allSets = [...new Set(heroes.map(h => h.set_code))];
    console.log('\nAll Hero Set Codes:', allSets.sort().join(', '));
}

analyzeHeroSets();
