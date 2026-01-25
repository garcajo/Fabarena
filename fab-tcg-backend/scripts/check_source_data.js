const https = require('https');

const DATA_URL = 'https://raw.githubusercontent.com/the-fab-cube/flesh-and-blood-cards/main/json/english/card.json';

const fetchCards = () => {
    return new Promise((resolve, reject) => {
        https.get(DATA_URL, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
};

fetchCards().then(cards => {
    console.log('Sample card structure:');
    const sampleCard = cards.find(c => c.printings && c.printings.length > 0);
    console.log(JSON.stringify(sampleCard, null, 2).substring(0, 2000));

    console.log('\n\nChecking rarity fields:');
    console.log('card.rarity:', sampleCard.rarity);
    console.log('card.printings[0]:', sampleCard.printings[0]);
}).catch(console.error);
