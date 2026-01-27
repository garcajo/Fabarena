const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// LOGIC FROM NEW api.js
async function fetchPage(from, to, options) {
    let query = supabase.from('cards').select('name, clase, tipo, set_code', { count: 'exact' });

    // Mimic EquipmentSelection filters
    const { clase, type, includeWhiteBorder } = options;
    const WHITE_BORDER_SETS = ['1HP'];

    if (!includeWhiteBorder && WHITE_BORDER_SETS.length > 0) {
        query = query.not('set_code', 'in', `(${WHITE_BORDER_SETS.join(',')})`);
    }

    if (clase) {
        if (Array.isArray(clase)) {
            const orCondition = clase.map(c => `clase.ilike.%${c}%`).join(',');
            query = query.or(orCondition);
        }
    }

    if (type) {
        if (Array.isArray(type)) {
            const typeOr = type.map(t => `tipo.ilike.%${t}%`).join(',');
            query = query.or(typeOr);
        }
    }

    query = query.order('name', { ascending: true });
    return await query.range(from, to);
}

async function getCards(options = {}) {
    const { pageSize = 5000 } = options;
    const MAX_SUPABASE_PAGE = 1000;

    let allData = [];
    let currentOffset = 0;
    let totalCount = 0;
    let hasMore = true;

    console.log('--- STARTING PAGINATED FETCH (OFFSET LOGIC) ---');

    while (hasMore && allData.length < pageSize) {
        const nextBatchSize = Math.min(pageSize - allData.length, MAX_SUPABASE_PAGE);
        const from = currentOffset;
        const to = from + nextBatchSize - 1;

        console.log(`Fetching Range: ${from} - ${to} (BatchSize: ${nextBatchSize})`);

        const { data, count, error } = await fetchPage(from, to, options);
        if (error) { console.error(error); break; }
        if (!data || data.length === 0) break;

        allData = [...allData, ...data];
        totalCount = count;
        currentOffset += data.length;

        console.log(`Received: ${data.length} items. Total So Far: ${allData.length}`);

        if (data.length < nextBatchSize || allData.length >= totalCount) {
            hasMore = false;
        }
    }
    return { data: allData, count: totalCount };
}

async function run() {
    console.log('--- TEST 1: WITHOUT WHITE BORDER (Old Behavior) ---');
    let res = await getCards({
        clase: ['Ninja', 'Generic'],
        type: ['Equipment', 'Weapon', 'Head', 'Chest', 'Arms', 'Legs', 'Off-Hand'],
        pageSize: 5000,
        includeWhiteBorder: false
    });
    let unique = [...new Set(res.data.map(d => d.name))].sort();
    if (unique.includes('Zephyr Needle')) console.log('❌ Zephyr Needle Found (Unexpected)');
    else console.log('✅ Zephyr Needle NOT Found (Expected constraint)');

    console.log('\n--- TEST 2: WITH WHITE BORDER (New Behavior) ---');
    res = await getCards({
        clase: ['Ninja', 'Generic'],
        type: ['Equipment', 'Weapon', 'Head', 'Chest', 'Arms', 'Legs', 'Off-Hand'],
        pageSize: 5000,
        includeWhiteBorder: true
    });
    unique = [...new Set(res.data.map(d => d.name))].sort();

    console.log(`Total Unique Items: ${unique.length}`);
    if (unique.includes('Zephyr Needle')) console.log('✅ Zephyr Needle Found (FIX CONFIRMED)');
    else console.log('❌ Zephyr Needle STILL MISSING');
}

run();
