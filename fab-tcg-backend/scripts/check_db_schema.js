
require('dotenv').config({ path: 'fab-tcg-backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('--- Checking Decks Table Columns ---');

    // We can't query information_schema easily via JS client (requires SQL or special access).
    // Instead, we fetch one row and inspect keys, OR try to select the specific columns.

    // Attempt select
    const { data, error } = await supabase
        .from('decks')
        .select('id, name, username, likes_count')
        .limit(1);

    if (error) {
        console.error('Error fetching columns:', error);
        console.error('Likely cause: One of the requested columns (username, likes_count) DOES NOT EXIST.');
    } else {
        console.log('Success! Columns exist.');
        if (data.length > 0) {
            console.log('Sample row:', data[0]);
        } else {
            console.log('Table is empty, but query succeeded (columns exist).');
        }
    }
}

checkColumns();
