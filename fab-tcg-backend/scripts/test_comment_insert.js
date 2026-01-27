
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Testing Comment Schema ---');

    // 1. Get a deck
    const { data: deck, error: dError } = await supabase.from('decks').select('id').limit(1).single();
    if (dError || !deck) {
        console.error('Could not fetch a deck:', dError);
        return;
    }
    console.log('Found deck:', deck.id);

    // 2. Get a user
    // We can't select from auth.users easily without service key, which we have.
    const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();
    if (uError || !users || users.length === 0) {
        console.error('Could not fetch users:', uError);
        return;
    }
    const user = users[0];
    console.log('Found user:', user.id);

    // 3. Try to insert a comment
    const payload = {
        deck_id: deck.id,
        user_id: user.id,
        content: 'Test comment from backend script',
        username: 'TestBackend'
    };

    console.log('Attempting insert with payload:', payload);

    const { data, error } = await supabase.from('deck_comments').insert(payload).select().single();

    if (error) {
        console.error('INSERT FAILED:', error.message);
        console.error('Full Error:', error);
    } else {
        console.log('INSERT SUCCESS:', data.id);
        // clean up
        await supabase.from('deck_comments').delete().eq('id', data.id);
        console.log('Test comment cleaned up.');
    }
}

check();
