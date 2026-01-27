const fetch = require('node-fetch');

async function scrapeLL() {
    try {
        const url = 'https://fabtcg.com/resources/rules-and-policy-center/living-legend/';
        console.log(`Fetching ${url}...`);
        const response = await fetch(url);
        console.log(`Status: ${response.status} ${response.statusText}`);
        const html = await response.text();

        console.log("HTML Length:", html.length);
        console.log("HTML Content:", html);

        // Helper to decode HTML entities (SAME AS CONTROLLER)
        const decodeHtmlEntities = (text) => {
            if (!text) return text;
            return text
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'")
                .replace(/&#8211;/g, '-')
                .replace(/&#x27;/g, "'")
                .replace(/&ndash;/g, '-')
                .replace(/&mdash;/g, '-')
                .replace(/\s+/g, ' ')
                .trim();
        };

        const rows = html.split('<tr');
        console.log(`Processing ${rows.length} rows...`);

        rows.forEach((row, i) => {
            // Check for Florian specifically in rows
            if (row.includes('Florian')) {
                console.log(`\n--- Raw Row with Florian ---`);
                console.log(row.substring(0, 200));

                const cells = row.split(/<td[^>]*>/).slice(1).map(c => c.split('</td>')[0].trim());
                console.log('Cells extracted:', cells);

                if (cells.length >= 3) {
                    const cleanName = decodeHtmlEntities(cells[1].replace(/<[^>]*>/g, ''));
                    console.log('CLEAN NAME:', cleanName);

                    // Check characters codes
                    console.log('Char codes:');
                    for (let j = 0; j < cleanName.length; j++) {
                        console.log(`${cleanName[j]}: ${cleanName.charCodeAt(j)}`);
                    }
                }
            }
        });

    } catch (e) {
        console.error(e);
    }
}

scrapeLL();
