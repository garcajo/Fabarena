export const HERO_SIGNATURES = {
    // Warriors
    "Dorinthea": ["Dawnblade"],
    "Dorinthea Ironsong": ["Dawnblade"],
    "Kassai": ["Cintari Saber"],
    "Kassai of the Golden Sand": ["Cintari Saber"],
    "Boltyn": ["Raydn, Duskbane"],
    "Ser Boltyn, Breaker of Dawn": ["Raydn, Duskbane"],
    "Olympia": ["Decimator Greataxe"],
    "Olympia, Prized Fighter": ["Decimator Greataxe"],
    "Fang": ["Obsidian Fire Vein"],
    "Fang, Dracai of Blades": ["Obsidian Fire Vein"],

    // Guardians
    "Bravo": ["Anothos"],
    "Bravo, Showstopper": ["Anothos"],
    "Bravo, Star of the Show": ["Anothos"],
    "Oldhim": ["Winter's Wail"],
    "Oldhim, Grandfather of Eternity": ["Winter's Wail"],
    "Valda": ["Anothos"],
    "Victor Goldmane": ["Miller's Grindstone"],
    "Betsy": ["High Riser", "Miller's Grindstone"],
    "Yoji": ["Anothos"],
    "Yoji, Royal Protector": ["Anothos"],

    // Brutes
    "Rhinar": ["Romping Club"],
    "Rhinar, Reckless Rampage": ["Romping Club"],
    "Levia": ["Ravenous Meataxe"],
    "Levia, Shadowborn Abomination": ["Ravenous Meataxe"],
    "Kayo": ["Mandible Claw"],
    "Kayo, Armed and Dangerous": ["Mandible Claw"],

    // Ninja
    "Katsu": ["Harmonized Kodachi"],
    "Katsu, the Wanderer": ["Harmonized Kodachi"],
    "Fai": ["Searing Emberblade"],
    "Fai, Rising Rebellion": ["Searing Emberblade"],
    "Ira, Crimson Haze": ["Harmonized Kodachi"],
    "Benji, the Piercing Wind": ["Harmonized Kodachi"],
    "Zen, Tamer of Purpose": ["Tiger Taming Khakkara"],
    "Cindra": ["Kunai of Retribution"],
    "Cindra, Dracai of Retribution": ["Kunai of Retribution"],

    // Ranger
    "Azalea": ["Death Dealer"],
    "Azalea, Ace in the Hole": ["Death Dealer"],
    "Lexi": ["Voltaire, Strike Twice"],
    "Lexi, Livewire": ["Voltaire, Strike Twice"],
    "Riptide": ["Barbed Castaway"],
    "Riptide, Lurker of the Deep": ["Barbed Castaway"],

    // Runeblade
    "Viserai": ["Nebula Blade"],
    "Viserai, Rune Blood": ["Nebula Blade"],
    "Chane": ["Galaxxi Black"],
    "Chane, Bound by Shadow": ["Galaxxi Black"],
    "Briar": ["Rosetta Thorn"],
    "Briar, Warden of Thorns": ["Rosetta Thorn"],
    "Vynnset": ["Flail of Agony"],
    "Vynnset, Iron Maiden": ["Flail of Agony"],
    "Florian": ["Rotwood Reaper"],
    "Aurora": ["Starfall"],

    // Wizard
    "Kano": ["Crucible of Aetherweave"],
    "Kano, Dracai of Aether": ["Crucible of Aetherweave"],
    "Iyslander": ["Waning Moon"],
    "Iyslander, Stormbind": ["Waning Moon"],
    "Oscilio": ["Volzar, the Lightning Rod"],
    "Verdance": ["Staff of Verdant Shoots"],

    // Mechanologist
    "Dash": ["Teklo Plasma Pistol"],
    "Dash, Inventor Extraordinaire": ["Teklo Plasma Pistol"],
    "Dash I/O": ["Symbiosis Shot"],
    "Maxx": ["Banksy"],
    "Teklovossen": ["Teklo Leveler"],
    "Data Doll": ["Teklo Plasma Pistol"],

    // Illusionist
    "Prism": ["Luminaris"],
    "Prism, Sculptor of Arc Light": ["Luminaris"],
    "Prism, Awakener of Sol": ["Luminaris"],
    "Dromai": ["Storm of Sandikai"],
    "Dromai, Ash Artist": ["Storm of Sandikai"],
    "Enigma": ["Cosmo, Scroll of Ancestral Tapestry"],

    // Assassin
    "Arakni": ["Spider's Bite"],
    "Arakni, Huntsman": ["Spider's Bite"],
    "Arakni, Marionette": ["Mark of the Huntsman"],
    "Uzuri": ["Spider's Bite"],
    "Uzuri, Switchblade": ["Spider's Bite"],
    "Nuu": ["Beckoning Mistblade"],

    // Generic/Others
    "Kavdaen": ["Talishar, the Lost Prince"],
    "Genis": ["Talishar, the Lost Prince"],
    "Shiyana": ["Talishar, the Lost Prince"],
    "Emperor": ["Command and Conquer"]
};

// Helper to normalize hero name to find signature
export const getHeroSignature = (heroName) => {
    if (!heroName) return null;

    // Direct match
    if (HERO_SIGNATURES[heroName]) return HERO_SIGNATURES[heroName];

    // Partial match (e.g. "Bravo" matches "Bravo, Showstopper")
    // Sort keys by length descending to match more specific names first (e.g. "Dash I/O" before "Dash")
    const keys = Object.keys(HERO_SIGNATURES).sort((a, b) => b.length - a.length);
    const match = keys.find(key => heroName.includes(key));
    if (match) return HERO_SIGNATURES[match];

    return null;
};
