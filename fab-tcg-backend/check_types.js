require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTypes() {
    console.log('Checking unique types in DB...');

    // Get all distinct types
    const { data, error } = await supabase
        .from('cards')
        .select('tipo');

    if (error) {
        console.error('Error fetching types:', error);
        return;
    }

    const uniqueTypes = [...new Set(data.map(c => c.tipo))].sort();
    console.log(`Found ${uniqueTypes.length} unique types:`);
    console.log(uniqueTypes);
}

checkTypes();
