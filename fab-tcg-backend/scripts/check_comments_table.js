
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking for tables...');

    const { data: comments, error: cError } = await supabase.from('deck_comments').select('count', { count: 'exact', head: true });
    console.log('deck_comments check:', cError ? `MISSING/ERROR (${cError.message})` : `EXISTS (Count: ${comments})`);

    const { data: likes, error: lError } = await supabase.from('deck_likes').select('count', { count: 'exact', head: true });
    console.log('deck_likes check:', lError ? `MISSING/ERROR (${lError.message})` : `EXISTS (Count: ${likes})`);
}

check();
