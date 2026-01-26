
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClasses() {
    const { data: classes, error: classError } = await supabase
        .from('cards')
        .select('clase')
        .not('clase', 'is', null);

    if (classError) { console.error(classError); return; }

    const uniqueClasses = [...new Set(classes.map(c => c.clase))].sort();
    console.log('Unique Classes:', uniqueClasses);

    const { data: heroes, error: heroError } = await supabase
        .from('cards')
        .select('name, clase, tipo')
        .ilike('tipo', '%Hero%');

    if (heroError) { console.error(heroError); return; }

    // Search for Gravy
    const gravy = await supabase
        .from('cards')
        .select('*')
        .ilike('name', '%Gravy%');

    console.log('Gravy Hero:', JSON.stringify(gravy.data, null, 2));

    // List All Pirate Cards
    const pirateCards = await supabase
        .from('cards')
        .select('name, clase, tipo, set_code')
        .eq('clase', 'Pirate');

    console.log('All Pirate Cards:', JSON.stringify(pirateCards.data, null, 2));

    // Filter for Merchant heroes
    const merchantHeroes = heroes.filter(h => h.clase === 'Merchant' || h.clase === 'Mercader');
    console.log('Merchant Heroes:', JSON.stringify(merchantHeroes, null, 2));
}

checkClasses();
