require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const getHighRarityCards = async () => {
    // Get all cards with rarity higher than Rare
    const { data: cards } = await supabase
        .from('cards')
        .select('nombre, rareza')
        .in('rareza', ['Majestuosa', 'Legendaria', 'Fabulosa', 'Super Rara'])
        .order('nombre');

    console.log(`Found ${cards.length} cards with high rarity`);

    // Group by rarity
    const byRarity = {};
    cards.forEach(card => {
        if (!byRarity[card.rareza]) {
            byRarity[card.rareza] = [];
        }
        byRarity[card.rareza].push(card.nombre);
    });

    console.log('\nCards by rarity:');
    Object.keys(byRarity).sort().forEach(rarity => {
        console.log(`\n${rarity}: ${byRarity[rarity].length} cards`);
    });

    // Get unique card names
    const uniqueNames = [...new Set(cards.map(c => c.nombre))].sort();

    console.log(`\n\nTotal unique card names: ${uniqueNames.length}`);
    console.log('\nFormatted for bannedCards.js:');
    console.log('        // High rarity cards (Majestic, Legendary, Fabled, Super Rare)');
    uniqueNames.forEach(name => {
        console.log(`        "${name}",`);
    });
};

getHighRarityCards().catch(console.error);
