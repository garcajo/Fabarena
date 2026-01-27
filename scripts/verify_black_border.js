
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'no-key-found';

const supabase = createClient(supabaseUrl, supabaseKey);

const cardNames = [
    "Sink Below",
    "Snatch"
];

const WHITE_BORDER_SETS = ['1HP', 'HP1']; // Common set codes for History Pack

async function checkCards() {
    console.log("Checking cards (Black Border)...\n");

    for (const name of cardNames) {
        const { data, error } = await supabase
            .from('cards')
            .select('name, id, set_code, pitch, rareza')
            .eq('name', name);

        if (error) {
            console.error(`Error fetching ${name}:`, error);
        } else {
            console.log(`Results for "${name}":`);
            if (data.length === 0) {
                console.log("  - No cards found with this name.");
            } else {
                data.forEach(c => {
                    const isWhiteBorder = WHITE_BORDER_SETS.includes(c.set_code);
                    console.log(`  - Set: ${c.set_code} | Pitch: ${c.pitch} | ID: ${c.id} | WhiteBorder? ${isWhiteBorder ? 'YES' : 'NO'}`);
                });
            }
        }
        console.log("---");
    }
}

checkCards();
