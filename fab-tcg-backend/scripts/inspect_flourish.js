
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectCard() {
    console.log("Searching for 'Flourish'...");
    const { data, error } = await supabase
        .from('cards')
        .select('*')
        .ilike('name', '%Flourish%');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${data.length} cards.`);
    if (data.length > 0) {
        data.forEach(card => {
            console.log("---");
            console.log(`Name: ${card.name}`);
            console.log(`Class (clase): '${card.clase}'`);
            console.log(`Type (tipo): '${card.tipo}'`);
            console.log(`Talent (talento): '${card.talento}'`); // likely undefined in schema but checking
            console.log(`Set: ${card.set_code}`);
        });
    }
}

inspectCard();
