export const BANNED_CARDS = {
    cc: [
        "Art of War",
        "Awakening",
        "Ball Lightning",
        "Belittle",
        "Berserk",
        "Bloodsheath Skeleta",
        "Bonds of Agony",
        { name: "Bonds of Ancestry", pitch: [2, 3] }, // Yellow, Blue
        "Brand with Cinderclaw",
        "Cash In",
        "Chart the High Seas",
        "Count Your Blessings",
        "Crown of Seeds",
        "Drone of Brutality",
        "Duskblade",
        { name: "Golden Tipple", pitch: [1, 2] }, // Red, Yellow
        "High Octane",
        { name: "Orb-Weaver Spinneret", pitch: [2, 3] }, // Yellow, Blue
        "Orihon of Mystic Tenets",
        "Plume of Evergrowth",
        "Plunder Run",
        "Rootbound Carapace",
        "Scepter of Pain",
        "Stubby Hammerers",
        "Talk a Big Game",
        "Tome of Aetherwind",
        "Tome of Divinity",
        "Tome of Fyendal",
        "Tome of Firebrand",
        "Wrath of Retribution",
        "Zephyr Needle"
    ],
    silver: [
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

export const isCardBanned = (cardOrName, format) => {
    if (!format || !BANNED_CARDS[format]) return false;

    const cardName = typeof cardOrName === 'string' ? cardOrName : cardOrName.name;
    const cardPitch = typeof cardOrName === 'string' ? null : (cardOrName.pitch !== undefined ? cardOrName.pitch : null);

    const bannedList = BANNED_CARDS[format];

    // Find entry
    const entry = bannedList.find(item => {
        if (typeof item === 'string') return item === cardName;
        return item.name === cardName;
    });

    if (!entry) return false;

    // If string match, it's fully banned
    if (typeof entry === 'string') return true;

    // If object match, check pitch
    if (entry.pitch && cardPitch !== null) {
        // FAB Pitch: 1 (Red), 2 (Yellow), 3 (Blue). Sometimes 0 works for some logic but usually 1-3.
        return entry.pitch.includes(cardPitch);
    }

    // If we rely on name only but it's a specific pitch ban, strictly speaking we can't be sure.
    // However, usually `isCardBanned` is called with the full card object in the new code.
    // If called with name only, we return true (conservative) OR false?
    // "Golden Tipple" (no pitch info) -> Is it banned? Yes, some versions are.
    // But legal version exists (Blue). 
    // If we flag it as banned, user can't pick Blue.
    // Better to return FALSE if data is insufficient?
    // Or return 'partial'?
    // Let's default to FALSE if pitch is missing for a pitch-specific ban, 
    // because it means "Is the abstract card banned?", no, only copies.
    if (entry.pitch && cardPitch === null) {
        return false;
    }

    return true;
};
