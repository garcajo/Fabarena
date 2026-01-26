/**
 * Vercel Serverless Function to scrape Banned Cards
 */
export default async function handler(req, res) {
    try {
        const url = 'https://fabtcg.com/resources/rules-and-policy-center/card-legality-policy/';
        const response = await fetch(url);
        const html = await response.text();

        // Hardcoded Silver Age Bans
        const SILVER_AGE_BANS = [
            "Aether Flare", "Aether Ironweave", "Amulet of Ice", "Ball Lightning", "Belittle",
            "Bonds of Ancestry", "Cash In", "Count Your Blessings", "Deadwood Dirge",
            "Drone of Brutality", "Electromagnetic Somersault", "Fate Foreseen", "Fiddler's Green",
            "Flic Flak", "Goliath Gauntlet", "Heartened Cross Strap", "Honing Hood",
            "Mask of Three Tails", "Nimby", "Old Knocker", "Plunder Run", "Rake the Embers",
            "Ragamuffin's Hat", "Reality Refractor", "Rootbound Carapace", "Rosetta Thorn",
            "Seeds of Agony", "Sigil of Solace", "Sink Below", "Snapdragon Scalers",
            "Stubby Hammerers", "Vest of the First Fist", "Vigorous Smashup", "Waning Moon",
            "Zephyr Needle"
        ];

        const bannedData = {
            "Silver Age": SILVER_AGE_BANS
        };
        const formats = ["Classic Constructed", "Blitz", "Commoner", "Ultimate Pit Fight", "Living Legend"];

        for (const fmt of formats) {
            const regex = new RegExp(`(<h[1-6][^>]*>\\s*${fmt}.*?</h[1-6]>)`, 'i');
            const match = html.match(regex);

            if (match) {
                const idx = match.index;
                const snippet = html.substring(idx, idx + 10000);

                if (snippet.includes("Banned")) {
                    const bannedIdx = snippet.indexOf("Banned");
                    const ulStart = snippet.indexOf("<ul", bannedIdx);

                    if (ulStart !== -1) {
                        const ulEnd = snippet.indexOf("</ul>", ulStart);
                        if (ulEnd !== -1) {
                            const listHtml = snippet.substring(ulStart, ulEnd);
                            const listItems = listHtml.match(/<li[^>]*>(.*?)<\/li>/gs);

                            if (listItems) {
                                const cards = listItems.map(li => {
                                    let text = li.replace(/<[^>]*>/g, '').trim();
                                    return text.replace(/&nbsp;/g, ' ').replace(/&#8211;/g, '-').trim();
                                }).filter(c => c.length > 0);

                                bannedData[fmt] = cards;
                            }
                        }
                    }
                }
            }
        }

        res.status(200).json(bannedData);
    } catch (error) {
        console.error('Error scraping Bans:', error);
        res.status(500).json({ error: 'Failed to fetch Banned cards' });
    }
}
