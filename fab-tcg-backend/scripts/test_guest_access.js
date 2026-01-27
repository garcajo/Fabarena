const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testGuestAccess() {
    console.log("Testing Guest Access to 'decks' table...");
    try {
        const { data, error, count } = await supabase
            .from('decks')
            .select('*', { count: 'exact' })
            .eq('visibility', 'public')
            .limit(5);

        if (error) {
            console.error("Error fetching public decks:", error.message);
        } else {
            console.log(`Successfully fetched ${data.length} public decks (Total count: ${count})`);
            if (data.length > 0) {
                const firstDeckId = data[0].id;
                console.log(`Testing access to deck cards for ID: ${firstDeckId}`);
                const { data: cards, error: cardsError } = await supabase
                    .from('deck_cards')
                    .select('*')
                    .eq('deck_id', firstDeckId);

                if (cardsError) {
                    console.error("Error fetching deck cards:", cardsError.message);
                } else {
                    console.log(`Successfully fetched ${cards.length} cards for the deck.`);
                }
            }
        }
    } catch (e) {
        console.error("Unexpected error:", e);
    }
}

testGuestAccess();
