const fetch = require('node-fetch');

async function scrapeBans() {
    try {
        const url = 'https://fabtcg.com/resources/rules-and-policy-center/card-legality-policy/';
        const response = await fetch(url);
        const html = await response.text();

        // Find format headers
        const formats = ["Classic Constructed", "Blitz", "Living Legend", "Commoner"];

        for (const fmt of formats) {
            console.log(`\n--- Looking for ${fmt} ---`);
            // Find the header for this format
            // usually <h3 ...>Classic Constructed</h3> or <h1>
            // Or just the string followed by "Banned" nearby

            const regex = new RegExp(`(<h[1-6][^>]*>\\s*${fmt}\\s*</h[1-6]>)`, 'i');
            const match = html.match(regex);

            if (match) {
                console.log(`Found header: ${match[0]}`);
                const idx = match.index;
                // Look ahead for "Banned"
                const snippet = html.substring(idx, idx + 5000); // 5000 chars context

                // Find "Banned" or "Suspended" lists
                if (snippet.includes("Banned")) {
                    console.log("Found 'Banned' in snippet.");
                    // Try to print the list
                    // Find <ul> after "Banned"
                    const bannedIdx = snippet.indexOf("Banned");
                    const ulStart = snippet.indexOf("<ul", bannedIdx);
                    const ulEnd = snippet.indexOf("</ul>", ulStart);

                    if (ulStart !== -1 && ulEnd !== -1) {
                        console.log("List found:");
                        console.log(snippet.substring(ulStart, ulEnd + 5));
                    } else {
                        console.log("No list found after 'Banned'.");
                        console.log("Snippet context:", snippet.substring(bannedIdx, bannedIdx + 300));
                    }
                }
            } else {
                console.log(`Header for ${fmt} not found.`);
            }
        }

    } catch (e) {
        console.error(e);
    }
}

scrapeBans();
