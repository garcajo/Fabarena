const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSearch(term) {
    console.log(`\nSearching for: "${term}"`);
    const { data, count, error } = await supabase
        .from('cards')
        .select('name, set_code, rareza')
        .ilike('name', `%${term}%`)
        .limit(20);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log(`Found ${data ? data.length : 0} results:`);
        if (data) data.forEach(c => console.log(`- ${c.name} (${c.set_code}) [${c.rareza}]`));
    }
}

async function run() {
    await testSearch('Ira');
    await testSearch('Scarlet');
    await testSearch('Crimson Haze');
}

run();
