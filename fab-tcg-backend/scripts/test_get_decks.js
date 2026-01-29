const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testGetDecks() {
    console.log('=== Simulando llamada getDecks() del frontend ===\n');

    // Simular la llamada exacta que hace el frontend
    let query = supabase
        .from('decks')
        .select('*', { count: 'exact' })
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log(`✅ Encontrados ${count} decks públicos\n`);

    data.forEach(deck => {
        console.log(`📦 ${deck.name}`);
        console.log(`   ID: ${deck.id}`);
        console.log(`   Likes: ${deck.likes_count || 0}`);
        console.log(`   Views: ${deck.views_count || 0}`);
        console.log(`   Comments: ${deck.comments_count || 0}`);
        console.log(`   Username: ${deck.username}`);
        console.log('');
    });
}

testGetDecks().catch(console.error);
