require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkProfiles() {
    console.log('Checking for "profiles" table...');
    const { data, error } = await supabase.from('profiles').select('*').limit(1);

    if (error) {
        console.log('❌ Error checking profiles table:', error.message);
        // If error is 404 or "relation ... does not exist", it's missing.
    } else {
        console.log('✅ "profiles" table exists.');
        console.log('Data sample:', data);
    }
}

checkProfiles();
