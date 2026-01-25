require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function listColumns() {
    console.log('Listing actual columns for "cards" table...');

    // We can't query information_schema directly via supabase-js easily unless we use rpc or just try to select * and look at the error/data structure.
    // Actually, `supabase.rpc` is best if we had a function, but we don't.
    // We can simply SELECT * LIMIT 1 and look at the keys if data exists, or use the error if it doesn't.
    // But better: use the `rpc` if we can, or just try to access known variants.

    // Let's try to infer from a "select everything" but mapped.
    // Or... assuming we have permissions, we CAN query pg_catalog or information_schema views if they are exposed. 
    // Usually they are not exposed to the API.

    // So let's try a brute force check of likely column names.
    const profileCandidates = [
        'id', 'username', 'full_name', 'avatar_url', 'website', 'updated_at'
    ];

    console.log('\nChecking "profiles" table...');
    for (const col of profileCandidates) {
        const { error } = await supabase.from('profiles').select(col).limit(1);
        if (!error) {
            console.log(`✅ Column exists: ${col}`);
        } else {
            console.log(`❌ Missing: ${col} - ${error.message}`);
        }
    }
}

listColumns();
