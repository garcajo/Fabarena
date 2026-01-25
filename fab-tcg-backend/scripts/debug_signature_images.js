require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkSignatures() {
    const weapons = [
        "Dawnblade",
        "Anothos",
        "Spider's Bite"
    ];

    console.log('Checking for image_url of signature weapons in DB...');

    for (const w of weapons) {
        const { data, error } = await supabase
            .from('cards')
            .select('name, imagen, image_url, set_code')
            .ilike('name', w)
            .limit(1);

        if (error) {
            console.error(`Error checking ${w}:`, error.message);
        } else if (data && data.length > 0) {
            console.log(`✅ Found "${w}":`,
                `\n   Set: ${data[0].set_code}`,
                `\n   imagen: ${data[0].imagen}`,
                `\n   image_url: ${data[0].image_url}`
            );
        } else {
            console.log(`❌ NOT FOUND: "${w}"`);
        }
    }
}

checkSignatures();
