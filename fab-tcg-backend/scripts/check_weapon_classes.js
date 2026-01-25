require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const checkWeaponClasses = async () => {
    // Get some Assassin weapons
    const { data: weapons } = await supabase
        .from('cards')
        .select('nombre, clase, tipo, rareza')
        .ilike('tipo', '%Weapon%')
        .ilike('tipo', '%Assassin%')
        .limit(10);

    console.log('Assassin Weapons:');
    weapons.forEach(w => {
        console.log(`- ${w.nombre}`);
        console.log(`  Clase: "${w.clase}"`);
        console.log(`  Tipo: ${w.tipo}`);
        console.log(`  Rareza: ${w.rareza}\n`);
    });
};

checkWeaponClasses().catch(console.error);
