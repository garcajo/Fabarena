
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyLogic() {
    const classes = ['Pirate', 'Necromancer', 'Generic'];
    const orCondition = classes.map(c => `clase.ilike.%${c}%`).join(',');

    console.log('Testing OR condition:', orCondition);

    const { data, error } = await supabase
        .from('cards')
        .select('name, clase, set_code')
        .or(orCondition)
        .ilike('name', '%Golden Tipple%'); // Limit to target card to confirm match

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Results:', JSON.stringify(data, null, 2));

    if (data.length > 0) {
        console.log("SUCCESS: Golden Tipple found with split class logic.");
    } else {
        console.log("FAILURE: Golden Tipple NOT found.");
    }
}

verifyLogic();
