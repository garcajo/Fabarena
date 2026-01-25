const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_FILE = path.join(__dirname, '../../fab-tcg-web/src/data/bannedCards.js');

const updateBannedList = async () => {
    console.log('Fetching high rarity cards...');

    // Get all cards with rarity higher than Rare
    const { data: cards, error } = await supabase
        .from('cards')
        .select('nombre')
        .in('rareza', ['Majestuosa', 'Legendaria', 'Fabulosa', 'Super Rara', 'Promo', 'B', 'V'])
        .order('nombre');

    if (error) {
        console.error('Error fetching cards:', error);
        return;
    }

    const highRarityCards = [...new Set(cards.map(c => c.nombre))].sort();
    console.log(`Found ${highRarityCards.length} high rarity cards`);

    // Define the CC banned list (static)
    const ccBanned = [
        "Art of War",
        "Awakening",
        "Ball Lightning",
        "Belittle",
        "Berserk",
        "Bloodsheath Skeleta",
        "Bonds of Agony",
        "Bonds of Ancestry", // Blue and Yellow
        "Brand with Cinderclaw",
        "Cash In",
        "Chart the High Seas",
        "Count Your Blessings",
        "Crown of Seeds",
        "Drone of Brutality",
        "Duskblade",
        "Golden Tipple", // Red and Yellow
        "High Octane",
        "Orb-Weaver Spinneret", // Blue and Yellow
        "Orihon of Mystic Tenets",
        "Plume of Evergrowth",
        "Plunder Run",
        "Pulse of Isenloft",
        "Rootbound Carapace",
        "Scepter of Pain",
        "Stubby Hammerers",
        "Talk a Big Game",
        "Tome of Aetherwind",
        "Tome of Divinity",
        "Tome of Firebrand",
        "Tome of Fyendal",
        "Withstand",
        "Wrath of Retribution"
    ];

    // Combine high rarity cards with official Silver Age bans that might be Common/Rare
    // (though most bans are high power/rarity anyway, let's keep the explicit ones too just in case)
    const officialSilverBans = [
        "Drone of Brutality",
        "Aether Flare",
        "Aether Ironweave",
        "Amulet of Ice",
        "Ball Lightning",
        "Belittle",
        "Bonds of Ancestry",
        "Cash In",
        "Count Your Blessings",
        "Deadwood Dirge",
        "Electromagnetic Somersault",
        "Fate Foreseen",
        "Fiddler's Green",
        "Flic Flak",
        "Goliath Gauntlet",
        "Heartened Cross Strap",
        "Honing Hood",
        "Mask of Three Tails",
        "Nimby",
        "Old Knocker",
        "Plunder Run",
        "Rake the Embers",
        "Ragamuffin's Hat",
        "Reality Refractor",
        "Rootbound Carapace",
        "Rosetta Thorn",
        "Seeds of Agony",
        "Sigil of Solace",
        "Sink Below",
        "Snapdragon Scalers",
        "Stubby Hammerers",
        "Vest of the First Fist",
        "Vigorous Smashup",
        "Waning Moon",
        "Zephyr Needle"
    ];

    // Merge lists
    const finalSilverList = [...new Set([...highRarityCards, ...officialSilverBans])].sort();

    const fileContent = `export const BANNED_CARDS = {
    cc: [
${ccBanned.map(card => `        "${card}"`).join(',\n')}
    ],
    silver: [
        // Silver Age Restricted List
        // 1. Official Silver Age Bans (35 cards)
        // 2. ALL High Rarity Cards (Majestic, Legendary, Fabled, Super Rare, Promo)
        // Total: ${finalSilverList.length} cards
${finalSilverList.map(card => `        "${card}"`).join(',\n')}
    ]
};

export const isCardBanned = (cardName, format) => {
    if (!format || !BANNED_CARDS[format]) return false;

    // Normalize checks
    const bannedList = BANNED_CARDS[format];
    return bannedList.includes(cardName);
};
`;

    fs.writeFileSync(TARGET_FILE, fileContent);
    console.log(`✅ updated ${TARGET_FILE}`);
};

updateBannedList().catch(console.error);
