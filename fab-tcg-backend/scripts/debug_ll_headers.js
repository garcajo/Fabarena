const fetch = require('node-fetch');

async function check() {
    const url = 'https://fabtcg.com/resources/rules-and-policy-center/living-legend/';
    console.log(`Fetching ${url} with headers...`);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const html = await response.text();
        console.log(`Length: ${html.length}`);

        if (response.ok) {
            console.log("Success! Preview:");
            console.log(html.substring(0, 500));
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

check();
