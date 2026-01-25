require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const debug = async () => {
    // Get all equipment types
    const { data: equipment } = await supabase
        .from('cards')
        .select('nombre, clase, tipo, texto')
        .or('tipo.ilike.%Weapon%,tipo.ilike.%Equipment%,tipo.ilike.%Head%,tipo.ilike.%Chest%,tipo.ilike.%Arms%,tipo.ilike.%Legs%')
        .limit(50);

    console.log('Sample equipment:');
    equipment.forEach(e => {
        console.log({
            name: e.nombre,
            clase: e.clase,
            tipo: e.tipo,
            hasRestriction: e.texto?.includes('only') || e.texto?.includes('requires')
        });
    });
};

debug().catch(console.error);
