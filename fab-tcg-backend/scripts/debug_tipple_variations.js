
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVariations() {
    const { data, error } = await supabase
        .from('cards')
        .select('name, pitch, costo, set_code')
        .ilike('name', 'Golden Tipple');

    if (error) { console.error(error); return; }

    console.log('Golden Tipple Variations:', JSON.stringify(data, null, 2));
}

checkVariations();
