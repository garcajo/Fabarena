
const https = require('https');

const DATA_URL = 'https://raw.githubusercontent.com/the-fab-cube/flesh-and-blood-cards/main/json/english/card.json';

https.get(DATA_URL, (res) => {
    let data = '';
    // Only fetch first 100KB to inspect structure
    res.on('data', (chunk) => {
        data += chunk;
        if (data.length > 100000) {
            res.destroy(); // Stop downloading
            try {
                // Find the first valid closing object to make it parseable or just regex
                // JSON is an array [ ... ]
                // We'll just regex for keys to look for text fields

                console.log('--- First 1000 chars ---');
                console.log(data.substring(0, 1000));

                // Parse first item if possible
                const firstItemEnd = data.indexOf('},');
                if (firstItemEnd > 0) {
                    const firstItem = data.substring(1, firstItemEnd + 1);
                    try {
                        const parsed = JSON.parse(firstItem);
                        console.log('\n--- Parsed First Item Keys ---');
                        console.log(Object.keys(parsed));
                        console.log('\n--- Text Fields content ---');
                        console.log('text:', parsed.text);
                        console.log('effect:', parsed.effect);
                        console.log('effect_raw:', parsed.effect_raw);
                        console.log('functional_text:', parsed.functional_text);
                    } catch (e) {
                        console.log('Could not parse exact item, raw snippet:', firstItem);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }
    });
}).on('error', (e) => {
    console.error(e);
});
