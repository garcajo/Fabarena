
require('dotenv').config({ path: 'fab-tcg-backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDeckCardsColumns() {
    console.log('--- Checking deck_cards Table Columns ---');

    // Attempt select specific columns to see if they exist
    const { data, error } = await supabase
        .from('deck_cards')
        .select('deck_id, card_id, is_sideboard, section')
        .limit(1);

    if (error) {
        console.error('Error fetching columns:', error.message);
        if (error.message.includes('section')) {
            console.log("CONFIRMED: 'section' column is MISSING.");
        }
    } else {
        console.log('Success! Columns including "section" exist.');
    }
}

checkDeckCardsColumns();
