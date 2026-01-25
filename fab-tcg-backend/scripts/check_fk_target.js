require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const checkFK = async () => {
    // We can't query information_schema easily via JS client without a stored procedure or unrestricted access.
    // So we will try to infer by checking if 'public.users' exists and if it has data.

    console.log("Checking for 'public.users' table...");
    const { data: publicUsers, error: publicError } = await supabase.from('users').select('*').limit(5);

    if (publicError) {
        console.log("Could not select from 'public.users' (it might not exist or RLS blocks it):", publicError.message);
    } else {
        console.log(`'public.users' exists. Rows found: ${publicUsers.length}`);
        publicUsers.forEach(u => console.log(`- ${u.id} (${u.email || u.username || 'no info'})`));
    }

    // Also check if 'public.profiles' exists (common alternative)
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*').limit(5);
    if (!profilesError) {
        console.log(`'public.profiles' exists. Rows: ${profiles.length}`);
    } else {
        console.log("'public.profiles' query error (or table missing):", profilesError.message);
    }
};

checkFK();
