
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_KEY are required in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const checkSchema = async () => {
    // Try to insert a dummy row to see valid columns if we can't query schema directly
    // Or just try to select
    const { data, error } = await supabase.from('decks').select('*').limit(1);

    if (error) {
        console.error('Error selecting from decks:', error.message);
        return;
    }

    console.log('Decks table is accessible.');
    if (data.length > 0) {
        console.log('Columns found in first row:', Object.keys(data[0]));
    } else {
        console.log('Table is empty, cannot infer columns from data.');
        // Try to insert a row with all expected columns to see if it fails
        console.log('Attempting dry-run insert to verify schema compatibility...');
        const testDeck = {
            user_id: '00000000-0000-0000-0000-000000000000', // likely to fail FK but will check columns first
            name: 'Test Schema',
            format: 'cc',
            hero: {},
            equipment: [],
            main_deck: [],
            sideboard: [],
            maybeboard: []
        };
        const { error: insertError } = await supabase.from('decks').insert(testDeck);
        if (insertError) {
            console.log('Insert check result:', insertError.message);
        } else {
            console.log('Insert check passed (or at least columns exist).');
        }
    }
};

checkSchema();
