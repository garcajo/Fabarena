require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SUFFIXES = [
    ' Attack Reaction', ' Defense Reaction', // Specific compounds first
    ' Action', ' Attack', ' Defense', ' Instant', ' Equipment',
    ' Weapon', ' Hero', ' Resource', ' Block', ' Mentor', ' Token',
    ' Reaction' // Fallback
];

function extractClass(tipo) {
    if (!tipo) return 'Generic';

    // Split by " - " to handle 'Type - Subtype'
    let mainType = tipo.split(' - ')[0];

    // Remove suffixes iteratively until no more matches
    // This is important because some might have multiple or order might matter
    let changed = true;
    while (changed) {
        changed = false;
        for (const suffix of SUFFIXES) {
            if (mainType.endsWith(suffix)) {
                mainType = mainType.substring(0, mainType.length - suffix.length);
                changed = true;
                // Restart loop to handle compounded suffixes if any (though usually type is cleaner)
                break;
            }
        }
    }

    return mainType.trim();
}

async function fixClasses() {
    console.log('Fetching all cards...');

    const { data: cards, error } = await supabase
        .from('cards')
        .select('id, tipo, clase');

    if (error) {
        console.error('Error fetching cards:', error);
        return;
    }

    console.log(`Processing ${cards.length} cards...`);

    const updates = [];

    for (const card of cards) {
        const newClass = extractClass(card.tipo);

        if (newClass !== card.clase) {
            updates.push({
                id: card.id,
                clase: newClass
            });
        }
    }

    console.log(`Found ${updates.length} cards needing updates.`);

    if (updates.length === 0) {
        console.log('No updates needed.');
        return;
    }

    // Update in batches
    const BATCH_SIZE = 100;
    let updatedCount = 0;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const batch = updates.slice(i, i + BATCH_SIZE);

        // Supabase upsert requires primary key match. 
        // We can't easily do bulk update of different values for different IDs with a single query in Supabase JS client 
        // commonly without upsert.
        // But upsert needs all required fields if they are missing? No, only PK is needed if we are updating.
        // Wait, 'cards' table likely has other required fields. Upserting sparse objects might fail if it tries to insert new rows.
        // But since IDs exist, it should update.

        // However, it's safer to loop or use a specialized query.
        // Given 1000 cards, looping promises is fine.

        await Promise.all(batch.map(async (update) => {
            const { error: updateError } = await supabase
                .from('cards')
                .update({ clase: update.clase })
                .eq('id', update.id);

            if (updateError) console.error(`Failed to update card ${update.id}:`, updateError);
        }));

        updatedCount += batch.length;
        if (updatedCount % 500 === 0) console.log(`Updated ${updatedCount} cards...`);
    }

    console.log('Update complete!');
}

fixClasses();
