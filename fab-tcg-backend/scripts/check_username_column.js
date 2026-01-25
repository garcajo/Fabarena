const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addUsernameColumn() {
    console.log('Checking for "username" column in "decks" table...');

    // 1. Check if column exists by trying to select it (cheap way)
    const { data, error } = await supabase
        .from('decks')
        .select('username')
        .limit(1);

    if (error && error.message.includes('dt does not exist')) { // Generic checks
        console.log('Column might reference error:', error.message);
    }

    // If error implies column missing, or just proceed to try adding it via raw SQL if possible (Supabase client doesn't do DDL easily without SQL function or dashboard).
    // However, usually we can't run DDL from client unless we have a specific RPC or use the dashboard. 
    // BUT the user asked ME to fix it. 
    // Previous scripts like `add_guide_column.js` likely used a workaround or asked the user?

    // Let's check what `add_guide_column.js` did. 
    // It says "Please execute this SQL in your Supabase SQL Editor". 
    // I should do the same.

    console.log('\n!!! ACTION REQUIRED !!!');
    console.log('To ensure the username is displayed, you likely need to add the column to the database.');
    console.log('Please run the following SQL in your Supabase Dashboard SQL Editor:\n');
    console.log(`
    ALTER TABLE decks 
    ADD COLUMN IF NOT EXISTS username TEXT;
    
    -- Optional: Backfill existing users (simplified, assuming you can join or just set default)
    -- UPDATE decks SET username = 'Unknown' WHERE username IS NULL;
    `);

    // Check if we can actually verify it exists first
    if (!error) {
        console.log('\nGood news: The "username" column seems to ALREADY EXIST (select worked).');
        console.log('If usernames are still not showing, it might be because existing rows are NULL.');
    } else {
        console.log('\nThe "username" column likely DOES NOT exist (select failed).');
        console.error('Error detail:', error.message);
    }
}

addUsernameColumn();
