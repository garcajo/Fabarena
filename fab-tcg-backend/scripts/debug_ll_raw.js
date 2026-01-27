const fetch = require('node-fetch');

async function debugScrape() {
    try {
        console.log("Fetching LL page...");
        const url = 'https://fabtcg.com/resources/rules-and-policy-center/living-legend/';
        const response = await fetch(url);
        const html = await response.text();

        // Find line with Maxx
        const lines = html.split('\n');
        const maxxLine = lines.find(l => l.includes("Maxx"));
        console.log("Raw Maxx line:", maxxLine);

        if (!maxxLine) {
            // It might be minified or different structure
            console.log("Maxx not found in simple split. Searching full text...");
            const idx = html.indexOf("Maxx");
            console.log("Snippet around Maxx:", html.substring(idx - 50, idx + 100));
        }

    } catch (e) {
        console.error(e);
    }
}

debugScrape();
