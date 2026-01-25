require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkHeroNames() {
    console.log('Checking Hero names...');

    const { data, error } = await supabase
        .from('cards')
        .select('name')
        .ilike('tipo', '%Hero%')
        .limit(20);

    if (error) {
        console.error(error);
        return;
    }

    console.log('Sample Hero Names:', data.map(c => c.name));
}

checkHeroNames();
