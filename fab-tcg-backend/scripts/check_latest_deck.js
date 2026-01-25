require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkLatestDecks() {
    console.log('Fetching latest 3 updated decks...');

    // Select * is simple, but let's be specific to see guide
    const { data: decks, error } = await supabase
        .from('decks')
        .select('id, name, updated_at, guide')
        .order('updated_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error('Error fetching decks:', error);
        return;
    }

    decks.forEach(deck => {
        console.log('------------------------------------------------');
        console.log(`Deck Name: ${deck.name}`);
        console.log(`ID: ${deck.id}`);
        console.log(`Updated At: ${deck.updated_at}`);
        console.log('Guide Content Type:', typeof deck.guide);
        console.log('Guide Content:', JSON.stringify(deck.guide, null, 2));
    });
}

checkLatestDecks();
