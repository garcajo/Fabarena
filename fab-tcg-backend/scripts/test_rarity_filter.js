const API_URL = 'http://localhost:3000/api';

const testRarityFilter = async () => {
    // Test 1: Get equipment with rareza filter
    const params = new URLSearchParams();
    params.append('type', 'Weapon');
    params.append('clase', 'Assassin');
    params.append('rareza', 'Común');
    params.append('rareza', 'Rara');
    params.append('pageSize', '20');

    console.log('Testing rareza filter with params:', params.toString());

    try {
        const response = await fetch(`${API_URL}/cards?${params.toString()}`);
        const result = await response.json();

        console.log(`\nReceived ${result.data?.length || 0} cards`);
        console.log('\nRarities found:');
        const rarities = new Set();
        result.data?.forEach(card => {
            rarities.add(card.rareza);
        });
        console.log(Array.from(rarities));

        console.log('\nSample cards:');
        result.data?.slice(0, 5).forEach(card => {
            console.log(`- ${card.nombre}: ${card.rareza} (${card.tipo})`);
        });

        // Check if Hunter's Klaive appears (it shouldn't)
        const huntersKlaive = result.data?.find(c => c.nombre.includes('Hunter') && c.nombre.includes('Klaive'));
        if (huntersKlaive) {
            console.log('\n❌ ERROR: Hunter\'s Klaive (Majestuosa) appeared in results!');
            console.log(huntersKlaive);
        } else {
            console.log('\n✅ SUCCESS: Hunter\'s Klaive (Majestuosa) correctly filtered out');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
};

testRarityFilter();
