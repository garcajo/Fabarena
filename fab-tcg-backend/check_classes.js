require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClasses() {
    console.log('Checking unique classes in DB...');

    // Get all distinct classes
    const { data, error } = await supabase
        .from('cards')
        .select('clase');

    if (error) {
        console.error('Error fetching classes:', error);
        return;
    }

    const uniqueClasses = [...new Set(data.map(c => c.clase))].sort();
    console.log(`Found ${uniqueClasses.length} unique classes:`);
    console.log(uniqueClasses);

    // Check count of cards per class
    console.log('\nCard count per class:');
    const counts = {};
    data.forEach(c => {
        counts[c.clase] = (counts[c.clase] || 0) + 1;
    });
    console.log(counts);
}

checkClasses();
