require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('Listing actual columns for "cards" table...');

    // We can just grab one row to see the keys
    const { data, error } = await supabase
        .from('cards')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting from cards:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found in "cards":', Object.keys(data[0]).join(', '));
        console.log(' Sample row:', JSON.stringify(data[0], null, 2));
    } else {
        console.log('Table "cards" is empty or could not be read.');
    }
}

checkColumns();
