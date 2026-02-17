require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Setup Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Load Local Data Source (Legacy cards.json)
const CARDS_JSON_PATH = path.join(__dirname, '..', '..', 'src', 'data', 'cards.json');

async function enrichPenCards() {
    console.log('📦 Loading local card data...');
    let localCards = [];
    try {
        const rawData = fs.readFileSync(CARDS_JSON_PATH, 'utf8');
        localCards = JSON.parse(rawData);
        console.log(`✅ Loaded ${localCards.length} cards from ${CARDS_JSON_PATH}`);
    } catch (err) {
        console.error('❌ Error reading local cards.json:', err.message);
        process.exit(1);
    }

    // Create a lookup map: Name -> Card Data
    const cardMap = new Map();
    localCards.forEach(card => {
        if (!cardMap.has(card.name)) {
            cardMap.set(card.name, card);
        } else {
            const existing = cardMap.get(card.name);
            if (existing.costo == null && card.costo != null) {
                cardMap.set(card.name, card);
            }
        }
    });

    console.log(`ℹ️  Unique card names in local DB: ${cardMap.size}`);

    // 3. Fetch PEN cards from Supabase
    console.log('📡 Fetching PEN cards from Supabase...');
    const { data: penCards, error } = await supabase
        .from('cards')
        .select('*')
        .eq('set_code', 'PEN');

    if (error) {
        console.error('❌ Supabase fetch error:', error);
        process.exit(1);
    }

    console.log(`found ${penCards.length} PEN cards in DB.`);

    let updatedCount = 0;
    let missingCount = 0;

    // 4. Update Loop
    for (const penCard of penCards) {
        const cleanName = penCard.name.trim();
        const sourceCard = cardMap.get(cleanName);

        // Prepare updates
        let updates = {};
        let needsUpdate = false;

        if (sourceCard) {
            // MATCH FOUND
            if (!penCard.clase && sourceCard.clase) { updates.clase = sourceCard.clase; needsUpdate = true; }
            if ((!penCard.tipo || penCard.tipo === 'Desconocido') && sourceCard.tipo) { updates.tipo = sourceCard.tipo; needsUpdate = true; }
            if ((!penCard.card_type || penCard.card_type === 'Unknown') && sourceCard.card_type) { updates.card_type = sourceCard.card_type; needsUpdate = true; }

            if (penCard.cost === null && sourceCard.costo !== undefined) { updates.cost = sourceCard.costo; needsUpdate = true; }
            if (penCard.power === null && sourceCard.power !== undefined) { updates.power = sourceCard.power; needsUpdate = true; }
            if (penCard.defense === null && sourceCard.defense !== undefined) { updates.defense = sourceCard.defense; needsUpdate = true; }
            if (penCard.pitch === null && sourceCard.pitch !== undefined) { updates.pitch = sourceCard.pitch; needsUpdate = true; }
            if ((!penCard.text || penCard.text === '') && sourceCard.texto) { updates.text = sourceCard.texto; needsUpdate = true; }

        } else {
            // NO MATCH FOUND - MANUAL OVERRIDES OR FALLBACK
            missingCount++;

            // Specific Fixes
            if (cleanName === 'Savage Claw' && !penCard.clase) {
                updates = {
                    clase: 'Brute',
                    tipo: 'Weapon - Claw (1H)',
                    card_type: 'Weapon',
                    cost: 2, power: 3, defense: null, pitch: null
                };
                console.log('  🛠️  Manually patched Savage Claw');
                needsUpdate = true;
            }
            else if (cleanName === 'Buzzard Helm' && !penCard.clase) {
                updates = {
                    clase: 'Generic',
                    tipo: 'Equipment - Head',
                    card_type: 'Equipment',
                    defense: 1
                };
                console.log('  🛠️  Manually patched Buzzard Helm');
                needsUpdate = true;
            }
            else if (!penCard.clase) {
                // GENERAL FALLBACK
                // Set to Generic Action so it shows up.
                updates = {
                    clase: 'Generic',
                    tipo: penCard.tipo === 'Desconocido' ? 'Action' : penCard.tipo,
                    card_type: penCard.card_type === 'Unknown' ? 'Action' : penCard.card_type,
                    cost: 0
                };
                // Minimal update to make it visible
                needsUpdate = true;
                // console.log(`  Set fallback for: ${cleanName}`);
            }
        }

        if (needsUpdate) {
            const { error: updateError } = await supabase
                .from('cards')
                .update(updates)
                .eq('id', penCard.id);

            if (updateError) {
                console.error(`  ❌ Failed to update ${cleanName}:`, updateError.message);
            } else {
                updatedCount++;
            }
        }
    }

    console.log('--------------------------------------------------');
    console.log(`✅ Finished processing.`);
    console.log(`   Updated/Patched: ${updatedCount}`);
    console.log(`   (Original Missing Match count: ${missingCount})`);

    // Final sanity check
    const { count } = await supabase
        .from('cards')
        .select('*', { count: 'exact', head: true })
        .eq('set_code', 'PEN')
        .is('clase', null);

    console.log(`🔍 Remaining PEN cards with NULL class: ${count}`);
}

enrichPenCards();
