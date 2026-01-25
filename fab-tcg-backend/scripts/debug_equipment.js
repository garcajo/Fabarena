require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const debug = async () => {
    // 1. Get a sample hero
    const { data: heroes } = await supabase
        .from('cards')
        .select('*')
        .ilike('tipo', '%Hero%')
        .limit(1);

    console.log('Sample Hero:', heroes[0]);
    console.log('Hero clase:', heroes[0]?.clase);

    // 2. Get equipment for that hero's class
    const heroClass = heroes[0]?.clase;
    const { data: equipment } = await supabase
        .from('cards')
        .select('*')
        .or(`clase.ilike.%${heroClass}%,clase.ilike.%Generic%`)
        .ilike('tipo', '%Equipment%')
        .limit(10);

    console.log('\nEquipment found:', equipment.length);
    console.log('Equipment classes:', equipment.map(e => ({ name: e.nombre, clase: e.clase })));

    // 3. Check what classes exist in equipment
    const { data: allEquipment } = await supabase
        .from('cards')
        .select('clase')
        .ilike('tipo', '%Equipment%');

    const uniqueClasses = [...new Set(allEquipment.map(e => e.clase))];
    console.log('\nAll equipment classes:', uniqueClasses);
};

debug().catch(console.error);
