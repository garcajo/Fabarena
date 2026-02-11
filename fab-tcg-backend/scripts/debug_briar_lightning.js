const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('--- Check Briar ---');
    const { data: briar, error: briarError } = await supabase
        .from('cards')
        .select('name, clase, tipo, keywords')
        .ilike('name', '%Briar%')
        .limit(1);
    if (briarError) console.error('Briar Error:', briarError);
    console.log('Briar:', briar);

    console.log('\n--- Check Lightning Equipment ---');
    const { data: equipment, error: equipError } = await supabase
        .from('cards')
        .select('name, clase, tipo, keywords')
        .ilike('clase', '%Lightning%')
        .ilike('tipo', '%Equipment%')
        .limit(5);
    if (equipError) console.error('Equip Error:', equipError);
    console.log('Lightning Equipment:', equipment);
}

checkData();
