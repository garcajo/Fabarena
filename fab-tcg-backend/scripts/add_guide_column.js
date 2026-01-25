
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Must use Service Key for Admin schema changes if not done via SQL Editor

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY are required in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const addGuideColumn = async () => {
    console.log('Attempting to add "guide" column to "decks" table...');

    // Since we can't easily run DDL via the JS client without a stored procedure or direct SQL access (which we might not have exposed),
    // we will check if we can simply use the `rpc` if a "exec_sql" function exists, or rely on the user to run SQL.
    // However, for this environment, often the user expects us to try.
    // If we assume we are using the Service Key, we might have privileges, but the JS client is data-focused.

    // Alternative: We can try to use the PostgreSQL connection if available, but we only see Supabase JS usage.
    // Actually, looking at previous scripts (not shown), usually we might fallback to asking the user or using a specialized endpoint.
    // But check if `check_decks_schema.js` worked? No, it failed because of missing .env.

    // Let's assume we can't run DDL via JS Client directly unless we have a specific RPC.
    // I will write this script to LOG the SQL needed, and try to execute a dummy update to see if the column exists.

    console.log('\n--- MANUAL SQL REQUIRED ---');
    console.log('Run this in your Supabase SQL Editor:');
    console.log('ALTER TABLE decks ADD COLUMN IF NOT EXISTS guide JSONB;');
    console.log('---------------------------\n');

    // Attempt verification
    const { data, error } = await supabase.from('decks').select('guide').limit(1);

    if (error) {
        if (error.message.includes('column "guide" does not exist')) {
            console.error('VERIFICATION FAILED: Column "guide" does NOT exist yet.');
            console.error('Please run the SQL command above.');
        } else {
            console.error('Verification error:', error.message);
        }
    } else {
        console.log('VERIFICATION SUCCESS: Column "guide" exists!');
    }
};

addGuideColumn();
