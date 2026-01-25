const supabase = require('../src/config/supabase');

const SILVER_AGE_BANS = [
    "Aether Flare",
    "Ball Lightning",
    "Belittle",
    "Drone of Brutality",
    "Rosetta Thorn"
];

async function checkNames() {
    console.log("Checking Silver Age names...");

    // Check exact matches
    const { data, error } = await supabase
        .from('cards')
        .select('name')
        .in('name', SILVER_AGE_BANS);

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${data.length} matches.`);
    data.forEach(d => console.log(`- ${d.name}`));

    // Check ILIKE for specific ones not found?
    // Let's assume most should be found.
}

checkNames();
