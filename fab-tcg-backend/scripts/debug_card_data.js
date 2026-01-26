
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCard() {
    const { data, error } = await supabase
        .from('cards')
        .select('*')
        .ilike('name', '%Golden Tipple%');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Found Cards:', JSON.stringify(data.map(c => ({
        name: c.name,
        clase: c.clase,
        type: c.tipo,
        set: c.set_code,
        rarity: c.rareza
    })), null, 2));
}

checkCard();
