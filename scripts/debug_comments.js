
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'no-key-found';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testComment() {
    console.log("Testing Comment Post...");

    // 1. Get a deck ID to comment on (pick first one)
    const { data: deck } = await supabase.from('decks').select('id').limit(1).single();
    if (!deck) {
        console.error("No decks found to comment on.");
        return;
    }
    const deckId = deck.id;
    console.log("Using Deck ID:", deckId);

    // 2. Mock a user ID if we can't login easily.
    // Ideally we need to be logged in for RLS policies if enforced.
    // If we assume ANON key has permissions (for dev), we might need a valid user_id.
    // Let's try to fetch a user or assume one from a previous run if possible, 
    // OR just try to insert with a random UUID if RLS allows it (unlikely).
    // BETTER: Use `signInWithPassword` if we had credentials, but we don't.
    // So we will just query the COMMENTS table to check structure and relationships.

    console.log("Checking relationships for 'comments' table...");
    try {
        const { data, error } = await supabase
            .from('comments')
            .select('*, user:users(username)')
            .limit(1);

        if (error) {
            console.error("Join Query Error:", error);
        } else {
            console.log("Join Query Success! Result:", data);
        }
    } catch (err) {
        console.error("Crash:", err);
    }
}

testComment();
