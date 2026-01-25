require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function countHeroes() {
    console.log('Counting cards with tipo ILIKE "%Hero%"...');

    const { count, error } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .ilike('tipo', '%Hero%');

    if (error) {
        console.error('Error counting heroes:', error);
        return;
    }

    console.log('Total Heroes found:', count);

    // Fetch a few examples
    const { data } = await supabase
        .from('cards')
        .select('name, tipo, clase, is_young')
        .ilike('tipo', '%Hero%')
        .limit(5);

    console.log('Examples:', data);
}

countHeroes();
