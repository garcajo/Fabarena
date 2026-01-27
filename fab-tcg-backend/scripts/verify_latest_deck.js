
require('dotenv').config({ path: 'fab-tcg-backend/.env' }); // Adjust path if needed, running from root
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL; // Try both
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Must use service key to bypass RLS for verification

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestDecks() {
    console.log('--- Checking Latest Decks ---');

    // 1. Get last 5 decks
    const { data: decks, error: deckError } = await supabase
        .from('decks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (deckError) {
        console.error('Error fetching decks:', deckError);
        return;
    }

    if (!decks || decks.length === 0) {
        console.log('No decks found in the database.');
        return;
    }

    for (const deck of decks) {
        console.log(`\nDeck: "${deck.name}" (ID: ${deck.id})`);
        console.log(`- Created At: ${deck.created_at}`);
        console.log(`- User ID: ${deck.user_id}`);
        console.log(`- Visibility: ${deck.visibility}`);
        console.log(`- Username: ${deck.username}`);

        // 2. Count cards for this deck
        const { count, error: cardError } = await supabase
            .from('deck_cards')
            .select('*', { count: 'exact', head: true })
            .eq('deck_id', deck.id);

        if (cardError) {
            console.error('  Error checking cards:', cardError);
        } else {
            console.log(`- Card Count (deck_cards table): ${count}`);
        }
    }
}

checkLatestDecks();
