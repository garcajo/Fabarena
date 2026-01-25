
require('dotenv').config({ path: '/Users/josue/Documents/fabarena/fab-tcg-backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWeapons() {
    const { data, error } = await supabase
        .from('cards')
        .select('name, texto, cost, card_type')
        .not('texto', 'is', null)
        .limit(5);

    if (error) {
        console.error('Error fetching cards:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log(`Found ${data.length} cards with text:`);
        data.forEach(card => {
            console.log(`\n--- ${card.name} ---`);
            console.log('Type:', card.card_type);
            console.log('Text:', card.texto);
        });
    } else {
        console.log('No cards found with text content.');
    }
}

checkWeapons();
