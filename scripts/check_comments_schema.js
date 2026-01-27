
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'no-key-found';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Checking 'comments' schema...");

    // We can't query information_schema easily with js client sometimes depending on permissions.
    // Instead, we try to insert a dummy comment with 'username' and see if it error about the column.
    // OR we select * limit 1 and see keys.

    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error selecting comments:", error);
    } else {
        if (data.length > 0) {
            console.log("Columns found:", Object.keys(data[0]));
        } else {
            console.log("No comments found, trying to infer from error on invalid insert...");
            // Try to insert a dummy record with a made-up column 'z_test_col'
            // If it complains about 'z_test_col', does it imply 'username' is valid if we tried that?
            // Let's just try to insert { username: 'test' } (plus required fields if any) logic.
        }
    }
}

checkSchema();
