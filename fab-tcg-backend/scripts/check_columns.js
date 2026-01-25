require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkColumns() {
    console.log('Checking columns for "cards" table...');

    // Attempt to insert a dummy record with JUST the artista column to see specific error
    // Or just select it
    const { data, error } = await supabase
        .from('cards')
        .select('card_type, artist')
        .limit(1);

    if (error) {
        console.log('❌ Error selecting "card_type, artist":', error.message);
        console.log('Full error:', JSON.stringify(error, null, 2));
    } else {
        console.log('✅ Column "artista" exists and is selectable.');
    }

    // Also check if we can insert generally
    const { error: insertError } = await supabase
        .from('cards')
        .insert([{ nombre: 'Test', artista: 'Test Artist' }]);

    if (insertError) {
        console.log('❌ Insert failed:', insertError.message);
    } else {
        console.log('✅ Insert worked (cleaned up automatically if RLS blocks, or remains if not)');
    }
}

checkColumns();
