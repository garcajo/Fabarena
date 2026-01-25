const API_URL = 'http://localhost:3000/api';

const testEquipmentRarityFilter = async () => {
    // Test equipment query WITHOUT clase filter, WITH rareza filter
    const params = new URLSearchParams();
    params.append('type', 'Weapon');
    params.append('type', 'Equipment');
    params.append('rareza', 'Común');
    params.append('rareza', 'Rara');
    params.append('pageSize', '50');

    console.log('Testing equipment with rareza filter (NO clase filter):');
    console.log('Params:', params.toString());

    try {
        const response = await fetch(`${API_URL}/cards?${params.toString()}`);
        const result = await response.json();

        console.log(`\n✅ Received ${result.data?.length || 0} cards`);

        // Check rarities
        const rarities = new Set();
        result.data?.forEach(card => rarities.add(card.rareza));
        console.log('\nRarities found:', Array.from(rarities).sort());

        // Check if Hunter's Klaive appears (it shouldn't - it's Majestuosa)
        const huntersKlaive = result.data?.find(c => c.nombre.includes('Hunter') && c.nombre.includes('Klaive'));
        if (huntersKlaive) {
            console.log('\n❌ ERROR: Hunter\'s Klaive (Majestuosa) appeared in results!');
        } else {
            console.log('\n✅ SUCCESS: Hunter\'s Klaive (Majestuosa) correctly filtered out');
        }

        // Show some Assassin weapons that should appear
        const assassinWeapons = result.data?.filter(c => c.tipo?.includes('Assassin') && c.tipo?.includes('Weapon'));
        console.log(`\nAssassin weapons found: ${assassinWeapons?.length || 0}`);
        assassinWeapons?.slice(0, 5).forEach(w => {
            console.log(`  - ${w.nombre}: ${w.rareza}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
};

testEquipmentRarityFilter();
