const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function listHeroes() {
    console.log("Fetching heroes...");
    const { data, error } = await supabase
        .from('cards')
        .select('name, clase')
        .ilike('tipo', '%Hero%');

    if (error) {
        console.error("Error:", error);
    } else {
        // Unique names
        const uniqueHeroes = {};
        data.forEach(h => {
            const baseName = h.name.split(',')[0].trim();
            if (!uniqueHeroes[baseName]) {
                uniqueHeroes[baseName] = h.clase;
            }
        });
        console.log(JSON.stringify(uniqueHeroes, null, 2));
    }
}

listHeroes();
