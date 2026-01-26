export const BANNED_CARDS = {
    cc: [
        "Art of War",
        "Awakening",
        "Ball Lightning",
        "Belittle",
        "Berserk",
        "Bloodsheath Skeleta",
        "Bonds of Agony",
        "Bonds of Ancestry",
        "Brand with Cinderclaw",
        "Cash In",
        "Chart the High Seas",
        "Count Your Blessings",
        "Crown of Seeds",
        "Drone of Brutality",
        "Duskblade",
        "Golden Tipple",
        "High Octane",
        "Orb-Weaver Spinneret",
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
    ],
    silver: [
        // Official Silver Age banned list (as of August 19, 2025)
        // Source: Legend Story Studios official announcement
        "Aether Flare",
        "Aether Ironweave",
        "Amulet of Ice",
        "Ball Lightning",
        "Belittle",
        "Bonds of Ancestry",
        "Cash In",
        "Count Your Blessings",
        "Deadwood Dirge",
        "Drone of Brutality",
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
    ]
};

export const isCardBanned = (cardName, format) => {
    if (!format || !BANNED_CARDS[format]) return false;

    // Normalize checks
    const bannedList = BANNED_CARDS[format];
    return bannedList.includes(cardName);
};
