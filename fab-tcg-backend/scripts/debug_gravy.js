
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGravy() {
    const { data: gravy, error } = await supabase
        .from('cards')
        .select('name, clase, tipo, set_code')
        .ilike('name', '%Gravy%');

    if (error) { console.error(error); return; }

    console.log('Gravy Search Results:', JSON.stringify(gravy, null, 2));
}

checkGravy();
