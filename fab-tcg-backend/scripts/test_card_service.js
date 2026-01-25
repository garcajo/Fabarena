
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const cardService = require('../src/services/cardService');

async function test() {
    console.log("Testing cardService.getAllCards...");
    try {
        const start = Date.now();
        const result = await cardService.getAllCards({ pageSize: 1 });
        const end = Date.now();
        console.log(`Success! Took ${end - start}ms`);
        console.log("Count:", result.count);
        console.log("Data length:", result.data ? result.data.length : 0);
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

test();
