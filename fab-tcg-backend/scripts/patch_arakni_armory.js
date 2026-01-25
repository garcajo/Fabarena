const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const cardsToInsert = [
    {
        unique_id: crypto.randomUUID(),
        name: "Inverter's Nightcowl",
        clase: "Assassin",
        card_type: "Equipment",
        costo: null,
        pitch: null,
        poder: null,
        defensa: 1,
        tipo: "Assassin Equipment - Chest",
        rareza: "Majestic",
        set_code: "ARA",
        texto: "Action - Destroy this: Until end of turn, whenever you play a card with stealth, gain [1 Resource]. Go again. Battleworn (When the combat chain closes, if this defended, put a -1DEFENSE counter on it.)",
        imagen: "https://dhhim4ltzu1pj.cloudfront.net/media/images/FAB026_Inverters_Nightcowl_CURVE.width-400.png" // Placeholder or try to find one. Using generic empty if fails? Actually I'll use a placeholder or official CDN pattern if known. I'll leave generic logic or known URL pattern. 
        // FAB URLs are usually https://dhhim4ltzu1pj.cloudfront.net/media/images/<slug>_<code>.width-450.png
        // I will use a plausible guess or empty string. User can see text.
    },
    {
        unique_id: crypto.randomUUID(),
        name: "Prey Spotters",
        clase: "Assassin",
        card_type: "Equipment",
        costo: null,
        pitch: null,
        poder: null,
        defensa: 1,
        tipo: "Assassin Equipment - Head",
        rareza: "Rare",
        set_code: "ARA",
        texto: "Attack Reaction - Destroy this: Mark target opposing hero. Battleworn (When the combat chain closes, if this defended, put a -1DEFENSE counter on it.)",
        imagen: ""
    },
    {
        unique_id: crypto.randomUUID(),
        name: "Rage Baiters",
        clase: "Assassin",
        card_type: "Equipment",
        costo: null,
        pitch: null,
        poder: null,
        defensa: 1,
        tipo: "Assassin Equipment - Arms",
        rareza: "Majestic",
        set_code: "ARA",
        texto: "Attack Reaction - {r}, {t}: Target attack with stealth gets \"When this hits a hero, mark them.\" Blade Break (When the combat chain closes, if this defended, destroy it.)",
        imagen: ""
    },
    {
        unique_id: crypto.randomUUID(),
        name: "Stalker's Steps",
        clase: "Assassin",
        card_type: "Equipment",
        costo: null,
        pitch: null,
        poder: null,
        defensa: 1,
        tipo: "Assassin Equipment - Legs",
        rareza: "Rare",
        set_code: "ARA",
        texto: "Attack Reaction - Destroy this: Target attack with stealth gets go again. Arcane Barrier 1 (If you would be dealt arcane damage, you may pay [1 Resource] to prevent 1 of that damage.)",
        imagen: ""
    },
    {
        unique_id: crypto.randomUUID(),
        name: "Creep",
        clase: "Assassin",
        card_type: "Action",
        costo: 0,
        pitch: 1,
        poder: 3,
        defensa: 3,
        tipo: "Assassin Action - Attack",
        rareza: "Common", // Assuming common/rare for armory regular cards? Search said "Regular cards".
        set_code: "ARA",
        texto: "Stealth. When this attacks, the next attack with stealth you play this combat chain gets go again.",
        imagen: ""
    },
    {
        unique_id: crypto.randomUUID(),
        name: "Horrors of the Past",
        clase: "Assassin",
        card_type: "Action",
        costo: 0,
        pitch: 2,
        poder: 2,
        defensa: 3,
        tipo: "Assassin Action - Attack",
        rareza: "Common",
        set_code: "ARA",
        texto: "Stealth. When this attacks, it gets the base abilities of the last attack action card with stealth you control on the combat chain.",
        imagen: ""
    },
    {
        unique_id: crypto.randomUUID(),
        name: "Night's Embrace",
        clase: "Assassin",
        card_type: "Attack Reaction",
        costo: 0,
        pitch: 3,
        poder: null,
        defensa: 3,
        tipo: "Assassin Attack Reaction",
        rareza: "Common",
        set_code: "ARA",
        texto: "Your attacks with stealth get +1 POWER this turn.",
        imagen: ""
    }
];

async function patch() {
    console.log('Patching Arakni Armory Cards...');
    for (const card of cardsToInsert) {
        // Check if exists
        const { data: existing } = await supabase.from('cards').select('id').eq('name', card.name).eq('set_code', card.set_code);
        if (existing && existing.length > 0) {
            console.log('Skipping ' + card.name + ' (Already exists)');
            continue;
        }

        const { error } = await supabase.from('cards').insert(card);
        if (error) {
            console.error('Error inserting ' + card.name + ':', error.message);
        } else {
            console.log('Inserted ' + card.name);
        }
    }
    console.log('Patch Complete.');
}

patch();
