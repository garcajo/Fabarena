const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
    console.log('Checking tables...');
    // We can't easily list tables with supabase-js without Rpc or specific permissions usually.
    // But we can try to select 1 row from expected tables.

    const tables = ['cards', 'decks', 'user_collection', 'profiles'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error) {
            console.log(`❌ Table "${table}": Error/Missing (${error.message})`);
        } else {
            console.log(`✅ Table "${table}": Exists (Access OK)`);
        }
    }
}

checkTables();
