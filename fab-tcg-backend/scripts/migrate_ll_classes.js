const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const LivingLegendService = require('../src/services/livingLegendService');
const supabase = require('../src/config/supabase');

async function migrateClasses() {
    console.log("Starting hero class migration...");

    // 1. Fetch current leaderboard entries
    const { data: heroes, error: fetchError } = await supabase
        .from('living_legend_leaderboard')
        .select('hero_name, class');

    if (fetchError) {
        console.error("Fetch error:", fetchError);
        return;
    }

    console.log(`Found ${heroes.length} heroes. Updating classes...`);

    // 2. Map through and update
    const updates = heroes.map(h => ({
        hero_name: h.hero_name,
        class: LivingLegendService.getHeroClass(h.hero_name)
    }));

    // 3. Chunk updates to avoid payload size limits if necessary (though 70ish is fine)
    const { error: updateError } = await supabase
        .from('living_legend_leaderboard')
        .upsert(updates, { onConflict: 'hero_name' });

    if (updateError) {
        console.error("Update error:", updateError);
    } else {
        console.log("Successfully updated all hero classes based on mapper.");

        // Final check: how many are still Unknown?
        const { count } = await supabase
            .from('living_legend_leaderboard')
            .select('*', { count: 'exact', head: true })
            .eq('class', 'Unknown');

        console.log(`Remaining 'Unknown' classes: ${count}`);
    }
}

migrateClasses();
