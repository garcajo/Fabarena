require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_KEY are required in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_URL = 'https://raw.githubusercontent.com/the-fab-cube/flesh-and-blood-cards/main/json/english/card.json';

const TYPE_MAP = {
    'Hero': 'Héroe',
    'Weapon': 'Arma',
    'Equipment': 'Equipamiento',
    'Action': 'Acción',
    'Attack Action': 'Acción de Ataque',
    'Defense Reaction': 'Reacción de Defensa',
    'Instant': 'Instantáneo',
    'Resource': 'Recurso'
};

const RARITY_MAP = {
    // Full names
    'Common': 'Común',
    'Rare': 'Rara',
    'Super Rare': 'Super Rara',
    'Majestic': 'Majestuosa',
    'Legendary': 'Legendaria',
    'Fabled': 'Fabulosa',
    'Token': 'Token',
    // Single-letter codes used in printings
    'C': 'Común',
    'R': 'Rara',
    'S': 'Super Rara',
    'M': 'Majestuosa',
    'L': 'Legendaria',
    'F': 'Fabulosa',
    'T': 'Token',
    'P': 'Promo'
};

const fetchCards = () => {
    return new Promise((resolve, reject) => {
        https.get(DATA_URL, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
};

const main = async () => {
    try {
        console.log('Fetching card data from FAB Cube repository...');
        const allCards = await fetchCards();

        console.log(`Total unique cards fetched: ${allCards.length}`);

        // Smart deduplication: 
        // - Heroes: Keep multiple versions (one per set for alternate arts)
        // - Equipment/Other: Keep only one per card name (most recent)
        const cardMap = new Map();
        const heroMap = new Map(); // For heroes, use name+set_id as key

        for (const card of allCards) {
            if (!card.printings || card.printings.length === 0) continue;

            const isHero = card.type_text && (card.type_text.includes('Hero') || card.type_text.includes('hero'));

            // Improved class extraction
            const extractClassFromType = (typeText) => {
                if (!typeText) return 'Generic';
                // Remove standard card types to leave only the class
                let cleaned = typeText
                    .replace(/\s*-\s*Young/gi, '')
                    .replace(/\s*-\s*Adult/gi, '')
                    .replace(/\s+Hero\s*/gi, '')
                    .replace(/\s+Equipment\s*/gi, '')
                    .replace(/\s+Weapon\s*/gi, '')
                    .replace(/\s+Action\s*/gi, '')
                    .replace(/\s+Attack\s*/gi, '')
                    .replace(/\s+Defense\s*/gi, '')
                    .replace(/\s+Reaction\s*/gi, '')
                    .replace(/\s+Instant\s*/gi, '')
                    .replace(/\s+Resource\s*/gi, '')
                    .replace(/\s*-\s*.*/, '') // Remove subtype after dash (e.g. "- Arms") if mixed with class? No, usually "Clase Equipment - Slot"
                    .trim();

                // Handle "Assassin Ninja" etc
                return cleaned || 'Generic';
            };

            // const isHero already defined above
            // Debug: Check for potentially missing cards
            if (card.name.toLowerCase().includes('sconce of stability')) {
                console.log('!!! FOUND SCONCE OF STABILITY IN RAW JSON !!!');
                console.log('   - Type:', card.type_text);
                console.log('   - Printings:', card.printings.length);
            }

            if (isHero) {
                // For heroes: Keep one per set (allows alternate arts)
                for (const printing of card.printings) {
                    if (!printing.set_id) continue;

                    const heroKey = `${card.name}-${printing.set_id}`; // Unique per set

                    if (!heroMap.has(heroKey)) {
                        const heroClass = card.class_ids?.[0] || extractClassFromType(card.type_text);

                        heroMap.set(heroKey, {
                            unique_id: crypto.randomUUID(),
                            name: card.name,
                            clase: heroClass,
                            card_type: TYPE_MAP[card.type_text] || card.type_text,
                            costo: card.cost !== undefined && card.cost !== null ? parseInt(card.cost) : null,
                            pitch: card.pitch !== undefined && card.pitch !== null ? parseInt(card.pitch) : null,
                            poder: card.power !== undefined && card.power !== null ? parseInt(card.power) : null,
                            defensa: card.defense !== undefined && card.defense !== null ? parseInt(card.defense) : null,
                            tipo: TYPE_MAP[card.type_text] || card.type_text,
                            rareza: RARITY_MAP[printing.rarity] || printing.rarity || 'Común',
                            set_code: printing.set_id,
                            imagen: printing.image_url,
                            texto: card.functional_text || card.functional_text_plain || card.effect_raw || card.text || '',
                            keywords: card.keywords || [],
                            artista: printing.artist || 'Unknown'
                        });
                    }
                }
            } else {
                // For non-heroes: NOW keeping one per Name + Pitch + Set (Store all printings)
                for (const printing of card.printings) {
                    if (!printing.set_id) continue;

                    const pitchSuffix = card.pitch !== undefined && card.pitch !== null ? `-${card.pitch}` : '';
                    const key = `${card.name}${pitchSuffix}-${printing.set_id}`; // Unique per Name+Pitch+Set

                    if (!cardMap.has(key)) {
                        const extractedClass = card.class_ids?.[0] || extractClassFromType(card.type_text);

                        cardMap.set(key, {
                            unique_id: crypto.randomUUID(),
                            name: card.name,
                            clase: extractedClass,
                            card_type: TYPE_MAP[card.type_text] || card.type_text,
                            costo: card.cost !== undefined && card.cost !== null ? parseInt(card.cost) : null,
                            pitch: card.pitch !== undefined && card.pitch !== null ? parseInt(card.pitch) : null,
                            poder: card.power !== undefined && card.power !== null ? parseInt(card.power) : null,
                            defensa: card.defense !== undefined && card.defense !== null ? parseInt(card.defense) : null,
                            tipo: TYPE_MAP[card.type_text] || card.type_text,
                            rareza: RARITY_MAP[printing.rarity] || printing.rarity || 'Común',
                            set_code: printing.set_id,
                            imagen: printing.image_url,
                            texto: card.functional_text || card.functional_text_plain || card.effect_raw || card.text || '',
                            keywords: card.keywords || [],
                            artista: printing.artist || 'Unknown'
                        });
                    }
                }
            }
        }

        // Combine both maps
        const cardsToInsert = [...Array.from(heroMap.values()), ...Array.from(cardMap.values())];

        console.log(`📦 Heroes found: ${heroMap.size}`);
        console.log(`📦 Other cards found: ${cardMap.size}`);
        console.log(`📦 Total unique cards to insert: ${cardsToInsert.length}`);

        // Clear existing data
        console.log('🗑️  Clearing existing cards...');
        const { error: deleteError } = await supabase.from('cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (deleteError) {
            console.error('⚠️  Warning clearing table:', deleteError.message);
        } else {
            console.log('✅ Table cleared.');
        }

        // Insert in batches
        const BATCH_SIZE = 100;
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < cardsToInsert.length; i += BATCH_SIZE) {
            const batch = cardsToInsert.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('cards').insert(batch);

            if (error) {
                console.error(`❌ Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
                errorCount += batch.length;
            } else {
                successCount += batch.length;
                if ((i + BATCH_SIZE) % 500 === 0 || (i + BATCH_SIZE) >= cardsToInsert.length) {
                    console.log(`✅ Progress: ${successCount}/${cardsToInsert.length} cards inserted...`);
                }
            }
        }

        console.log('\n🎉 Seeding completed!');
        console.log(`✅ Successfully inserted: ${successCount} cards`);
        if (errorCount > 0) {
            console.log(`❌ Failed to insert: ${errorCount} cards`);
        }

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

main();
