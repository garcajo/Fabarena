const fs = require('fs');
const https = require('https');
const path = require('path');

const DATA_URL = 'https://raw.githubusercontent.com/the-fab-cube/flesh-and-blood-cards/main/json/english/card.json';
const OUTPUT_FILE = path.join(__dirname, '../db/seed.sql');
const TARGET_SET = 'WTR'; // Welcome to Rathe

// Spanish translation mappings (basic)
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
    'Common': 'Común',
    'Rare': 'Rara',
    'Super Rare': 'Super Rara',
    'Majestic': 'Majestuosa',
    'Legendary': 'Legendaria',
    'Fabled': 'Fabulosa',
    'Token': 'Token'
};

const escapeSql = (str) => {
    if (!str) return 'NULL';
    if (typeof str !== 'string') str = String(str);
    return `'${str.replace(/'/g, "''")}'`;
};

const escapeArray = (arr) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return 'NULL';
    const values = arr.map(val => `"${val.replace(/"/g, '\\"')}"`).join(',');
    return `'{${values}}'`;
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

        console.log(`Total cards fetched: ${allCards.length}`);

        // Instead of filtering by set, we'll process ALL cards but deduplicate
        // We want to keep one printing per card (preferring newer sets)
        const cardMap = new Map();

        allCards.forEach(card => {
            // Skip cards without printings
            if (!card.printings || card.printings.length === 0) {
                return;
            }

            // Get the most recent printing (last one in array is usually newest)
            const printing = card.printings[card.printings.length - 1];

            // Use card name + pitch as key to avoid duplicates but keep pitch variations
            // Pitch can be 1, 2, 3 or undefined (for equipment etc)
            const pitchSuffix = card.pitch !== undefined && card.pitch !== null ? `-${card.pitch}` : '';
            const key = `${card.name}${pitchSuffix}`;

            // If we haven't seen this card, or if we want to replace with newer version
            if (!cardMap.has(key)) {
                cardMap.set(key, { card, printing });
            }
        });

        console.log(`Unique cards after deduplication: ${cardMap.size}`);

        const insertStatements = Array.from(cardMap.values()).map(({ card, printing }) => {
            // Map fields
            const nombre = escapeSql(card.name);
            const clase = escapeSql(card.class_ids?.[0] || 'Generic'); // Take first class or Generic
            const costo = card.cost !== undefined && card.cost !== null ? parseInt(card.cost) : 'NULL';
            const pitch = card.pitch !== undefined && card.pitch !== null ? parseInt(card.pitch) : 'NULL';
            const poder = card.power !== undefined && card.power !== null ? parseInt(card.power) : 'NULL';
            const defensa = card.defense !== undefined && card.defense !== null ? parseInt(card.defense) : 'NULL';
            const tipo = escapeSql(TYPE_MAP[card.type_text] || card.type_text);
            const rareza = escapeSql(RARITY_MAP[card.rarity] || card.rarity);
            const set_code = escapeSql(printing.set_id);
            const imagen = escapeSql(printing.image_url);
            const texto = escapeSql(card.effect_raw || card.text || '');
            const keywords = escapeArray(card.keywords);
            const artista = escapeSql(printing.artist);

            return `INSERT INTO cards (nombre, clase, costo, pitch, poder, defensa, tipo, rareza, set_code, imagen, texto, keywords, artista) VALUES (${nombre}, ${clase}, ${costo}, ${pitch}, ${poder}, ${defensa}, ${tipo}, ${rareza}, ${set_code}, ${imagen}, ${texto}, ${keywords}, ${artista});`;
        });

        const sqlContent = `-- Seed data for ALL Flesh and Blood cards
-- Generated: ${new Date().toISOString()}
-- Total cards: ${insertStatements.length}

-- Clear existing data
TRUNCATE TABLE cards;

${insertStatements.join('\n')}
`;

        fs.writeFileSync(OUTPUT_FILE, sqlContent);
        console.log(`✅ Successfully generated ${OUTPUT_FILE} with ${insertStatements.length} cards.`);
        console.log(`📁 File location: ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('❌ Error generating seed:', error);
        process.exit(1);
    }
};

main();
