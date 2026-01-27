
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'no-key-found';

const supabase = createClient(supabaseUrl, supabaseKey);

const cardNames = [
    "Edge of Autumn",
    "Fyendal's Spring Tunic",
    "Bittering Thorns",
    "Sink Below",
    "Ira, Scarlet Revenger"
];

async function checkCards() {
    console.log("Checking cards...", cardNames);
    const { data, error } = await supabase
        .from('cards')
        .select('name, id')
        .in('name', cardNames);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Found:", data.length);
        data.forEach(c => console.log(`- ${c.name} (${c.id})`));

        const foundNames = data.map(c => c.name);
        const missing = cardNames.filter(n => !foundNames.includes(n));
        if (missing.length > 0) {
            console.log("\nMISSING:", missing);
        }
    }
}

checkCards();
