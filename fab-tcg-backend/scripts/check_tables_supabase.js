
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: deckFolders, error: dfError } = await supabase.from('deck_folders').select('count').limit(1);
    const { data: folders, error: fError } = await supabase.from('folders').select('count').limit(1);

    console.log('deck_folders check:', dfError ? dfError.message : 'EXISTS');
    console.log('folders check:', fError ? fError.message : 'EXISTS');
}

check();
