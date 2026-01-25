require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const checkWeapons = async () => {
    const { data } = await supabase
        .from('cards')
        .select('tipo, nombre')
        .ilike('tipo', '%weapon%')
        .limit(20);

    console.log('Sample weapon types:');
    data.forEach(card => console.log(`- ${card.tipo} (${card.nombre})`));

    // Also check if weapons are in the equipment call
    const { data: equipment } = await supabase
        .from('cards')
        .select('tipo, nombre')
        .or('tipo.ilike.%Equipment%,tipo.ilike.%Weapon%,tipo.ilike.%Head%,tipo.ilike.%Chest%,tipo.ilike.%Arms%,tipo.ilike.%Legs%,tipo.ilike.%Off-Hand%')
        .limit(10);

    console.log('\n\nSample equipment/weapon query results:');
    equipment.forEach(card => console.log(`- ${card.tipo} (${card.nombre})`));
};

checkWeapons().catch(console.error);
