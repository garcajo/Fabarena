
require('dotenv').config({ path: '/Users/josue/Documents/fabarena/fab-tcg-backend/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    // There isn't a direct RPC to list tables via Supabase JS client easily without SQL access
    // But we can try to select from the table and see if it errors.

    console.log('Checking for deck_folders table...');
    const { data, error } = await supabase
        .from('deck_folders')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting from deck_folders:', error);
    } else {
        console.log('Success! Table exists. Data:', data);
    }
}

listTables();
