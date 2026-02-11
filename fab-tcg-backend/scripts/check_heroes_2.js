
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHeroes() {
    console.log("Checking Hero Classes...");
    const heroesToCheck = ['Chane', 'Prism', 'Nuu', 'Zen', 'Enigma', 'Fai', 'Dromai'];

    const orQuery = heroesToCheck.map(h => `name.ilike.%${h}%`).join(',');

    const { data, error } = await supabase
        .from('cards')
        .select('name, clase, tipo')
        .or(orQuery)
        .limit(20);

    if (error) {
        console.error("Error:", error);
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
        if (h.tipo && !h.tipo.includes('Hero')) return;

        console.log("---");
        console.log(`Name: ${h.name}`);
        console.log(`Clase: '${h.clase}'`);
    });
}

checkHeroes();
