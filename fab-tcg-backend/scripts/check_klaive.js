require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const checkHuntersKlaive = async () => {
    // Check Hunter's Klaive specifically
    const { data: klaive } = await supabase
        .from('cards')
        .select('*')
        .ilike('nombre', '%Hunter%Klaive%');

    console.log('Hunter\'s Klaive cards found:');
    klaive.forEach(card => {
        console.log(`\n- ${card.nombre}`);
        console.log(`  Tipo: ${card.tipo}`);
        console.log(`  Rareza: ${card.rareza}`);
        console.log(`  Set: ${card.set_code}`);
        console.log(`  Clase: ${card.clase}`);
    });

    // Check a few other Assassin equipment
    const { data: assassinEquip } = await supabase
        .from('cards')
        .select('nombre, tipo, rareza, clase')
        .ilike('tipo', '%Assassin%Equipment%')
        .limit(10);

    console.log('\n\nSample Assassin Equipment:');
    assassinEquip.forEach(card => {
        console.log(`- ${card.nombre}: ${card.rareza} (${card.tipo})`);
    });
};

checkHuntersKlaive().catch(console.error);
