require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_KEY are required in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PEN_CARDS_PATH = path.join(__dirname, 'data', 'pen_cards.json');

const main = async () => {
    try {
        console.log('Reading PEN cards from JSON...');
        const rawData = fs.readFileSync(PEN_CARDS_PATH, 'utf8');
        const penCards = JSON.parse(rawData);
        console.log(`Loaded ${penCards.length} cards.`);

        // Group by Name to determine Pitch
        const grouped = {};
        for (const card of penCards) {
            if (!grouped[card.name]) grouped[card.name] = [];
            grouped[card.name].push(card);
        }

        const cardsToInsert = [];
        const missingStats = [];

        console.log('Enriching data with existing card stats...');

        for (const name of Object.keys(grouped)) {
            const group = grouped[name];

            // Fetch stats from DB
            const { data: existingCards, error } = await supabase
                .from('cards')
                .select('*')
                .eq('name', name);

            if (error) {
                console.error(`Error fetching ${name}:`, error.message);
                continue;
            }

            // Determine if we have stats
            let statsSource = null;
            if (existingCards && existingCards.length > 0) {
                statsSource = existingCards.find(c => c.costo !== null || c.defensa !== null) || existingCards[0];
            }

            // Map pitches
            group.forEach((card, index) => {
                let pitch = null;

                if (group.length === 3) {
                    pitch = index + 1;
                } else if (group.length === 1) {
                    if (statsSource) {
                        if (statsSource.tipo && (statsSource.tipo.includes('Hero') || statsSource.tipo.includes('Equipment') || statsSource.tipo.includes('Weapon'))) {
                            pitch = null;
                        } else {
                            pitch = statsSource.pitch;
                        }
                    } else {
                        // Guess based on index? No, if 1 card, pitch likely null or we don't know.
                        pitch = null;
                    }
                } else if (group.length === 2) {
                    pitch = index + 1;
                }

                // Construct new card object
                const newCard = {
                    unique_id: crypto.randomUUID(),
                    name: card.name,

                    // Set details
                    set_code: 'PEN',
                    set_id: 'PEN',
                    set_name: 'Compendium of Rathe',

                    imagen: card.imageUrl,

                    // Stats (handle nulls if statsSource is null)
                    costo: statsSource ? statsSource.costo : null,
                    cost: statsSource ? statsSource.cost : null,

                    poder: statsSource ? statsSource.poder : null,
                    power: statsSource ? statsSource.power : null,

                    defensa: statsSource ? statsSource.defensa : null,
                    defense: statsSource ? statsSource.defense : null,

                    health: statsSource ? statsSource.health : null,
                    intelligence: statsSource ? statsSource.intelligence : null,

                    pitch: pitch,

                    // Types
                    tipo: statsSource ? statsSource.tipo : 'Desconocido',
                    card_type: statsSource ? statsSource.card_type : 'Unknown', // Required

                    clase: statsSource ? statsSource.clase : null,
                    class_type: statsSource ? statsSource.class_type : null,

                    rareza: statsSource ? statsSource.rareza : 'Common',
                    rarity: statsSource ? statsSource.rarity : 'Common',

                    texto: statsSource ? statsSource.texto : null,
                    text: statsSource ? statsSource.text : null,

                    keywords: statsSource ? statsSource.keywords : [],
                    artista: statsSource ? statsSource.artista : 'Unknown'
                };

                cardsToInsert.push(newCard);
            });
        }

        console.log(`\nReady to insert: ${cardsToInsert.length} cards.`);
        // console.log(`Missing stats for: ${missingStats.length} cards.`);

        // Dry run mode (comment out to run for real)
        // return;

        if (cardsToInsert.length === 0) {
            console.log('No cards to insert.');
            return;
        }

        console.log('Inserting into database...');

        // Batch insert
        const BATCH_SIZE = 50;
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < cardsToInsert.length; i += BATCH_SIZE) {
            const batch = cardsToInsert.slice(i, i + BATCH_SIZE);
            const { error: insertError } = await supabase.from('cards').insert(batch);

            if (insertError) {
                console.error(`Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, insertError.message);
                errorCount += batch.length;
            } else {
                console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} cards)`);
                successCount += batch.length;
            }
        }

        console.log(`Done. Success: ${successCount}, Errors: ${errorCount}`);

    } catch (e) {
        console.error('Script failed:', e);
    }
};

main();
