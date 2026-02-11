
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHeroes() {
    console.log("Checking Hero Classes...");
    const heroesToCheck = ['Oldhim', 'Briar', 'Florian', 'Verdance', 'Prism', 'Kayo', 'Terra'];

    // Using OR with ilike for multiple names
    const orQuery = heroesToCheck.map(h => `name.ilike.%${h}%`).join(',');

    const { data, error } = await supabase
        .from('cards')
        .select('name, clase, tipo, talents')
        .or(orQuery)
        .eq('type', 'Hero') // Assuming 'type' or 'tipo' is used for Card Type
        .limit(20);

    if (error) { // The column might be 'tipo' not 'type', and 'talents' might not exist.
        // let's try a safer query first to inspect columns or just select *
        console.log("Error or column missing, retrying with select *");
        const { data: retryData, error: retryError } = await supabase
            .from('cards')
            .select('*')
            .or(orQuery)
            //.ilike('tipo', '%Hero%') // 'tipo' is usually 'Hero' or 'HeroYoung'
            // But let's just fetch by name and client filter
            .limit(20);

        if (retryData) {
            printHeroes(retryData);
            return;
        }
        console.error("Retry Error:", retryError);
        return;
    }

    printHeroes(data);
}

function printHeroes(data) {
    if (!data || data.length === 0) {
        console.log("No heroes found.");
        return;
    }
    data.forEach(h => {
        // Simple client filter for "Hero" type if we pulled too much
        if (h.tipo && !h.tipo.includes('Hero')) return;

        console.log("---");
        console.log(`Name: ${h.name}`);
        console.log(`Clase: '${h.clase}'`);
        console.log(`Tipo: '${h.tipo}'`);
        console.log(`Talents (if any column): '${h.talents || h.talento || 'N/A'}'`);
    });
}

checkHeroes();
