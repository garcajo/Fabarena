const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// --- MOCK UTILS ---
const isCardLegalForHero = (cardClass, heroClass) => {
    if (!cardClass || cardClass.toLowerCase().includes('generic')) return true;
    if (!heroClass) return true;

    const heroClassLower = heroClass.toLowerCase();
    const heroTraits = heroClassLower.split(/\s+/).filter(Boolean);
    const nonTraitWords = ['equipment', 'weapon', 'hero', 'arma', 'equipamiento', 'héroe', 'token'];

    const options = cardClass.toLowerCase().split('/').map(s => s.trim());

    return options.some(optionStr => {
        const traits = optionStr.split(/\s+/)
            .filter(s => s && s !== 'generic' && !nonTraitWords.includes(s));

        if (traits.length === 0) return true;

        return traits.every(t => heroTraits.includes(t));
    });
};

const getSlot = (tipo) => {
    const t = (tipo || '').toLowerCase();
    if (t.includes('head') || t.includes('cabeza')) return 'Head';
    if (t.includes('chest') || t.includes('pecho')) return 'Chest';
    if (t.includes('arms') || t.includes('brazos')) return 'Arms';
    if (t.includes('legs') || t.includes('piernas')) return 'Legs';
    if (t.includes('off-hand') || t.includes('offhand') || t.includes('mano-secundaria')) return 'Off-Hand';
    if (t.includes('weapon') || t.includes('arma')) return 'Weapon';
    return 'Other';
};

// --- MOCK API ---
async function fetchPage(from, to, options) {
    let query = supabase.from('cards').select('name, clase, tipo, set_code', { count: 'exact' });
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

    while (hasMore && allData.length < pageSize) {
        const nextBatchSize = Math.min(pageSize - allData.length, MAX_SUPABASE_PAGE);
        const from = currentOffset;
        const to = from + nextBatchSize - 1;

        const { data, count, error } = await fetchPage(from, to, options);
        if (error) throw error;
        if (!data || data.length === 0) break;

        allData = [...allData, ...data];
        totalCount = count;
        currentOffset += data.length;

        if (data.length < nextBatchSize || allData.length >= totalCount) {
            hasMore = false;
        }
    }
    return { data: allData, count: totalCount };
}

// --- MAIN RUN ---
async function run() {
    console.log('--- DEBUGGING EQUIPMENT SELECTION LOGIC ---');
    const hero = { clase: 'Assassin' }; // Arakni
    const heroClassKeywords = ['Assassin'];

    const equipmentTypes = [
        'Equipment', 'Weapon', 'Head', 'Chest', 'Arms', 'Legs', 'Off-Hand',
        'Equipamiento', 'Arma', 'Cabeza', 'Pecho', 'Brazos', 'Piernas', 'Mano-Secundaria'
    ];

    console.log('1. Fetching...');
    const { data } = await getCards({
        clase: [...heroClassKeywords, 'Generic'],
        pageSize: 5000,
        type: equipmentTypes,
        includeWhiteBorder: true
    });
    console.log(`Fetched Raw: ${data.length}`);

    // DEDUPLICATE
    console.log('2. Deduplicating...');
    const uniqueCards = [];
    const seenNames = new Set();
    data.forEach(card => {
        if (!seenNames.has(card.name)) {
            seenNames.add(card.name);
            uniqueCards.push(card);
        }
    });
    console.log(`Unique Cards: ${uniqueCards.length}`);

    // SORT
    console.log('3. Sorting...');
    const sortedEquipment = [...uniqueCards].sort((a, b) => {
        const aClase = (a.clase || '').toLowerCase();
        const bClase = (b.clase || '').toLowerCase();
        const heroClase = (hero.clase || '').toLowerCase();
        const aMatchesPrimary = heroClase.includes(aClase) && !aClase.includes('generic');
        const bMatchesPrimary = heroClase.includes(bClase) && !bClase.includes('generic');
        if (aMatchesPrimary && !bMatchesPrimary) return -1;
        if (!aMatchesPrimary && bMatchesPrimary) return 1;
        const aIsGeneric = aClase.includes('generic');
        const bIsGeneric = bClase.includes('generic');
        if (aIsGeneric && !bIsGeneric) return 1;
        if (!aIsGeneric && bIsGeneric) return -1;
        return a.name.localeCompare(b.name);
    });

    // FILTER (Legality)
    console.log('4. Filtering...');
    const filteredEquipment = sortedEquipment.filter(card => {
        return isCardLegalForHero(card.clase, hero.clase);
    });
    console.log(`Filtered Legal: ${filteredEquipment.length}`);

    // SEARCH FOR BLACKTEK
    const blacktek = filteredEquipment.find(c => c.name.toLowerCase().includes('blacktek'));
    if (blacktek) {
        console.log(`✅ Blacktek Whisperers FOUND! Slot: ${getSlot(blacktek.tipo)}`);
    } else {
        console.log('❌ Blacktek Whisperers MISSING from filtered list.');
    }

    // LIST ALL LEGS
    const legs = filteredEquipment.filter(c => getSlot(c.tipo) === 'Legs');
    console.log(`\nLegs Found (${legs.length}):`);
    legs.forEach(l => console.log(`- ${l.name} (${l.clase})`));
}

run();
