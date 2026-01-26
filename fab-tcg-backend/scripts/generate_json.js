const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_URL = 'https://raw.githubusercontent.com/the-fab-cube/flesh-and-blood-cards/main/json/english/card.json';
const OUTPUT_FILE = path.join(__dirname, '../../fab-tcg-web/src/data/cards.json');

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
    'Token': 'Token',
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
        console.log('Fetching card data...');
        const allCards = await fetchCards();
        console.log(`Fetched ${allCards.length} raw records.`);

        const cardMap = new Map();
        const heroMap = new Map();

        // Helper to mimic the database ID generation if needed, though simpler is better for JSON
        // We'll generate stable IDs if possible, or random ones.

        const extractClassFromType = (typeText) => {
            if (!typeText) return 'Generic';
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
                .replace(/\s*-\s*.*/, '')
                .trim();
            return cleaned || 'Generic';
        };

        for (const card of allCards) {
            if (!card.printings || card.printings.length === 0) continue;

            const isHero = card.type_text && (card.type_text.includes('Hero') || card.type_text.includes('hero'));

            if (isHero) {
                for (const printing of card.printings) {
                    if (!printing.set_id) continue;
                    const heroKey = `${card.name}-${printing.set_id}`;
                    if (!heroMap.has(heroKey)) {
                        heroMap.set(heroKey, {
                            id: crypto.randomUUID(), // Keeping 'id' for compatibility
                            name: card.name,
                            clase: card.class_ids?.[0] || extractClassFromType(card.type_text),
                            card_type: TYPE_MAP[card.type_text] || card.type_text,
                            costo: parseInt(card.cost) || null,
                            pitch: parseInt(card.pitch) || null,
                            power: parseInt(card.power) || null,
                            defense: parseInt(card.defense) || null,
                            tipo: TYPE_MAP[card.type_text] || card.type_text,
                            rareza: RARITY_MAP[printing.rarity] || printing.rarity || 'Común',
                            set_code: printing.set_id,
                            imagen: printing.image_url,
                            texto: card.functional_text || card.text || '',
                            keywords: card.keywords || []
                        });
                    }
                }
            } else {
                for (const printing of card.printings) {
                    if (!printing.set_id) continue;
                    const pitchSuffix = card.pitch !== undefined && card.pitch !== null ? `-${card.pitch}` : '';
                    const key = `${card.name}${pitchSuffix}-${printing.set_id}`;

                    if (!cardMap.has(key)) {
                        cardMap.set(key, {
                            id: crypto.randomUUID(),
                            name: card.name,
                            clase: card.class_ids?.[0] || extractClassFromType(card.type_text),
                            card_type: TYPE_MAP[card.type_text] || card.type_text,
                            costo: parseInt(card.cost) || null,
                            pitch: parseInt(card.pitch) || null,
                            power: parseInt(card.power) || null,
                            defense: parseInt(card.defense) || null,
                            tipo: TYPE_MAP[card.type_text] || card.type_text,
                            rareza: RARITY_MAP[printing.rarity] || printing.rarity || 'Común',
                            set_code: printing.set_id,
                            imagen: printing.image_url,
                            texto: card.functional_text || card.text || '',
                            keywords: card.keywords || []
                        });
                    }
                }
            }
        }

        const cards = [...heroMap.values(), ...cardMap.values()];

        console.log(`Generated ${cards.length} unique cards.`);
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cards, null, 2));
        console.log(`Check ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('Error generating JSON:', error);
    }
};

main();
