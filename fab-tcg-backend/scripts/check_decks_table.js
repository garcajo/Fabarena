
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_KEY are required in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const checkTable = async () => {
    try {
        const { data, error } = await supabase.from('decks').select('*').limit(1);
        if (error) {
            console.error('Error selecting from decks:', error.message);
        } else {
            console.log('Decks table exists. Rows:', data.length);
        }
    } catch (e) {
        console.error('Exception:', e);
    }
};

checkTable();
