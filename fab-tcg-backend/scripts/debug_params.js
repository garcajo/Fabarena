const fetch = require('node-fetch');

async function testEquipmentSearch() {
    const baseUrl = 'http://localhost:3000/api/cards';

    // Simulate the request that CardSearchModal makes
    // type=['Equipment', 'Weapon', 'Head', 'Chest', 'Arms', 'Legs', 'Off-Hand']
    // clase=['Warrior', 'Generic']

    // Construct query string manually to match what the frontend sends
    const params = new URLSearchParams();
    params.append('pageSize', '10');

    // Add classes
    params.append('clase', 'Warrior');
    params.append('clase', 'Generic');

    // Add types - mimic what CardSearchModal does
    const types = ['Equipment', 'Weapon', 'Head', 'Chest', 'Arms', 'Legs', 'Off-Hand'];
    types.forEach(t => params.append('type', t));

    const url = `${baseUrl}?${params.toString()}`;
    console.log('Fetching:', url);

    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log(`Found ${data.count} items.`);
        if (data.data?.length > 0) {
            console.log('First item:', data.data[0].nombre, data.data[0].tipo, data.data[0].clase);
        } else {
            console.log('No data found.');
        }

        // Test simpler query - just Generic Class
        console.log('\n--- Test 2: Just Generic Class ---');
        const res2 = await fetch(`${baseUrl}?clase=Generic&pageSize=1`);
        const data2 = await res2.json();
        console.log(`Found ${data2.count} Generic items.`);
        if (data2.data?.length > 0) console.log(data2.data[0]);

        // Test simpler query - just Head Type
        console.log('\n--- Test 3: Just Head Type ---');
        const res3 = await fetch(`${baseUrl}?type=Head&pageSize=1`);
        const data3 = await res3.json();
        console.log(`Found ${data3.count} Head items.`);
        if (data3.data?.length > 0) console.log(data3.data[0]);

    } catch (e) {
        console.error("Error:", e);
    }
}

testEquipmentSearch();
