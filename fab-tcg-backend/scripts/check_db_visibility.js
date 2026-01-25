
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env');
    process.exit(1);
}

console.log('📍 Connecting to Supabase at:', supabaseUrl);
// console.log('🔑 Using Key:', supabaseKey.substring(0, 10) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDecks() {
    console.log('🔍 Attempting to query public.decks...');

    // Attempt 1: Simple Select
    const { count, error } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('❌ Error querying cards table:');
        console.error(JSON.stringify(error, null, 2));

        if (error.message.includes('schema cache')) {
            console.log('\n💡 DIAGNOSIS: The table exists but Supabase API has not refreshed its cache.');
            console.log('   Please run NOTIFY pgrst, "reload config"; in the Supabase SQL Editor.');
        } else if (error.code === '42P01') {
            console.log('\n💡 DIAGNOSIS: The table "decks" DOES NOT EXIST in this database.');
        }
    } else {
        console.log('✅ Success! The "cards" table is visible.');
        console.log(`   Row count: ${count}`);
    }
}

checkDecks();
