const https = require('https');

const DATA_URL = 'https://raw.githubusercontent.com/the-fab-cube/flesh-and-blood-cards/main/json/english/card.json';

console.log('Fetching JSON...');

https.get(DATA_URL, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            console.log('JSON Length:', data.length);
            const cards = JSON.parse(data);
            console.log('Total cards:', cards.length);

            const missing = ['Sconce of Stability', 'Beam of Bravery', 'Coeur of Yen', 'Honour\'s Estep', 'Mithril Street Jester', 'Arakni, Solitary Confinement'];

            missing.forEach(name => {
                const found = cards.find(c => c.name.toLowerCase() === name.toLowerCase());
                console.log('Found ' + name + ': ' + !!found);
                if (found) {
                    // console.log('  - Sets: ' + JSON.stringify(found.printings.map(p => p.set_id)));
                    console.log('  - Type: ' + found.type_text);
                }
            });

        } catch (e) {
            console.error('Error:', e.message);
        }
    });

}).on('error', (e) => {
    console.error('Request error:', e);
});
