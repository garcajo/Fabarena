const supabase = require('../src/config/supabase');

async function debugSearch() {
    const searchTerm = 'Wounding Blow'; // A generic card likely to have all 3 pitches
    console.log(`Searching for "${searchTerm}"...`);

    const { data, error } = await supabase
        .from('cards')
        .select('*')
        .ilike('name', `%${searchTerm}%`);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} results.`);
    data.forEach(card => {
        console.log(`- [${card.id}] ${card.name} | Pitch: ${card.pitch} | Set: ${card.set_code}`);
    });
}

debugSearch();
