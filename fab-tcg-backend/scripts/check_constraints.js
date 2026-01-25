require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_KEY are required in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const checkConstraints = async () => {
    console.log('Checking foreign key constraints for table "decks"...');

    // Query information_schema to find what table the FK references
    // Note: accessing information_schema via PostgREST might be restricted depending on Supabase config.
    // If this fails, we might have to infer or ask the user to check dashboard.

    // We can try to RPC call if we had one, but let's try raw SQL via a helper if available, likely not.
    // We will try to rely on error messages or basic inference, but let's try this standard PostgREST inspection relevant for Supabase if exposed

    // Actually, Supabase doesn't expose information_schema via API by default.
    // We'll rely on a known trick: try to insert and see the error (user already did).

    // Let's check if we can query 'auth.users' to see if our user exists.
    // We need a valid user ID to check.

    console.log("Cannot query information_schema directly via client usually.");
    console.log("Assumption: decks.user_id references auth.users.");

    // Let's trying to list users (requires Service Role Key usually, do we have it?)
    // The .env usually has ANON or SERVICE key?
    // If it's a service key, we can list users.

    // Let's check if the key is a service key by trying to list users.
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.log("Could not list users (likely not using Service Role Key):", error.message);
        console.log("Please check if the user ID you see in the backend logs exists in the Supabase Authentication tab.");
    } else {
        console.log(`Found ${users.length} users in auth.users.`);
        users.forEach(u => console.log(`- ${u.id} (${u.email})`));
    }
};

checkConstraints();
