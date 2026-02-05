const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAscendedHeroes() {
    console.log("Fetching heroes with 'Ascended' status...");

    const { data, error } = await supabase
        .from('living_legend_leaderboard')
        .select('hero_name')
        .eq('status', 'Ascended');

    if (error) {
        console.error("Error fetching ascended heroes:", error);
    } else {
        console.log("Ascended heroes found:", data.length);
        console.log("Heroes list:", data.map(i => i.hero_name));
    }
}

checkAscendedHeroes();
