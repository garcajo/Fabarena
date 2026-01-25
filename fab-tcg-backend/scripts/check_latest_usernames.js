const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLatestDecks() {
    console.log('Checking latest decks for username...');

    const { data, error } = await supabase
        .from('decks')
        .select('id, name, username, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching decks:', error);
        return;
    }

    console.table(data);
}

checkLatestDecks();
