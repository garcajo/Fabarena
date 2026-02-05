const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const supabase = require('../src/config/supabase');

async function listUnknown() {
    const { data, error } = await supabase
        .from('living_legend_leaderboard')
        .select('hero_name')
        .eq('class', 'Unknown');

    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

listUnknown();
