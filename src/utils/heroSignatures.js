export const HERO_SIGNATURES = {
    // Warriors
    "Dorinthea": ["Dawnblade"],
    "Dorinthea Ironsong": ["Dawnblade"],
    "Kassai": ["Cintari Saber"],
    "Kassai of the Golden Sand": ["Cintari Saber"],
    "Boltyn": ["Raydn, Duskbane"],
    "Ser Boltyn, Breaker of Dawn": ["Raydn, Duskbane"],
    "Olympia": ["Prized Fighter"], // Using specialization or common weapon? Olympia uses axes usually? Or maybe "Decimator"

    // Guardians
    "Bravo": ["Anothos"],
    "Bravo, Showstopper": ["Anothos"],
    "Oldhim": ["Winter's Wail"],
    "Valda": ["Earthlore Bounty"], // Not a weapon. Hammer?
    "Victor Goldmane": ["Miller's Grindstone"],
    "Betsy": ["Good Time Chime"],
    "Yoji": ["Ironrot Helm"], // Wait, weapon?

    // Brutes
    "Rhinar": ["Romping Club"],
    "Levia": ["Ravenous Meataxe"],
    "Kayo": ["Mandible Claw"],

    // Ninja
    "Katsu": ["Harmonized Kodachi"],
    "Fai": ["Searing Emberblade"],
    "Ira": ["Harmonized Kodachi"],
    "Benji": ["Harmonized Kodachi"],
    "Zen": ["Tiger Taming Khakkara"],

    // Ranger
    "Azalea": ["Death Dealer"],
    "Lexi": ["Voltaire, Strike Twice"],
    "Riptide": ["Barbed Castaway"],
    "Riptide, Lurker of the Deep": ["Barbed Castaway"],

    // Runeblade
    "Viserai": ["Nebula Blade"],
    "Chane": ["Galaxxi Black"],
    "Briar": ["Rosetta Thorn"],
    "Vynnset": ["Flail of Agony"], // Or widespread annihilation? 

    // Wizard
    "Kano": ["Crucible of Aetherweave"],
    "Iyslander": ["Waning Moon"],
    "Oscilio": ["Voltic Bolt"], // ?

    // Mechanologist
    "Dash": ["Teklo Plasma Pistol"],
    "Maxx": ["Banksy"],
    "Teklovossen": ["Teklo Leveler"],
    "Data Doll": ["Teklo Plasma Pistol"],

    // Illusionist
    "Prism": ["Luminaris"],
    "Dromai": ["Storm of Sandikai"],
    "Enigma": ["Cosmos, Scroll of Ancestral Tapestry"], // ?

    // Assassin
    "Arakni": ["Spider's Bite"],
    "Uzuri": ["Spider's Bite"],
    "Nuu": ["Beckon Apparition"], // ?

    // Generic/Others
    "Kavdaen": ["Talishar, the Lost Prince"],
    "Genis": ["Talishar, the Lost Prince"]
};

// Helper to normalize hero name to find signature
export const getHeroSignature = (heroName) => {
    if (!heroName) return null;

    // Direct match
    if (HERO_SIGNATURES[heroName]) return HERO_SIGNATURES[heroName];

    // Partial match (e.g. "Bravo" matches "Bravo, Showstopper")
    const keys = Object.keys(HERO_SIGNATURES);
    const match = keys.find(key => heroName.includes(key));
    if (match) return HERO_SIGNATURES[match];

    return null;
};
