require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkSignatures() {
    const weapons = [
        "Dawnblade",
        "Anothos",
        "Romping Club",
        "Harmonized Kodachi",
        "Death Dealer",
        "Nebula Blade",
        "Crucible of Aetherweave",
        "Teklo Plasma Pistol",
        "Luminaris",
        "Spider's Bite"
    ];

    console.log('Checking for existence of signature weapons in DB...');

    for (const w of weapons) {
        const { data, error } = await supabase
            .from('cards')
            .select('name, tipo, set_code')
            .ilike('name', w)
            .limit(1);

        if (error) {
            console.error(`Error checking ${w}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(`✅ Found "${w}":`, data[0].name, `(${data[0].set_code})`);
        } else {
            console.log(`❌ NOT FOUND: "${w}"`);
        }
    }
}

checkSignatures();
