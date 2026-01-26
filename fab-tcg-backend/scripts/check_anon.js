const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../fab-tcg-web/.env' }); // Load values from frontend .env

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Anon Access...');
console.log('URL:', supabaseUrl);
console.log('Key (Length):', supabaseKey ? supabaseKey.length : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing variables!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data, error, count } = await supabase
        .from('cards')
        .select('*', { count: 'exact' })
        .limit(1);

    if (error) {
        console.error('❌ RLS/Auth Error:', error.message);
    } else {
        console.log(`✅ Success! Access Granted.`);
        console.log(`📊 Total Cards Visible to Anon: ${count}`);
        console.log('🃏 Sample:', data.length > 0 ? data[0].name : 'No rows');
    }
}

test();
