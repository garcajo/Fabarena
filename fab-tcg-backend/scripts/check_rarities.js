require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const checkRarities = async () => {
    // Get all unique rarities from equipment
    const { data: equipment } = await supabase
        .from('cards')
        .select('rareza, nombre, tipo')
        .or('tipo.ilike.%Equipment%,tipo.ilike.%Weapon%')
        .limit(100);

    const rarities = new Set();
    equipment.forEach(card => {
        if (card.rareza) {
            rarities.add(card.rareza);
        }
    });

    console.log('Unique rarities found in equipment:');
    console.log(Array.from(rarities).sort());

    console.log('\nSample equipment with rarities:');
    equipment.slice(0, 10).forEach(card => {
        console.log(`- ${card.nombre} (${card.tipo}): ${card.rareza}`);
    });
};

checkRarities().catch(console.error);
