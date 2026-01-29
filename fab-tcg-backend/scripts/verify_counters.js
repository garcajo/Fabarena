const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCounters() {
    console.log('=== Verificando Contadores de Decks ===\n');

    // Obtener decks con sus contadores
    const { data: decks, error: decksError } = await supabase
        .from('decks')
        .select('id, name, likes_count, views_count, comments_count')
        .order('created_at', { ascending: false })
        .limit(10);

    if (decksError) {
        console.error('❌ Error al obtener decks:', decksError);
        return;
    }

    console.log(`✅ Encontrados ${decks.length} decks\n`);

    // Verificar precisión de contadores
    for (const deck of decks) {
        // Contar likes reales
        const { count: realLikes, error: likesError } = await supabase
            .from('deck_likes')
            .select('*', { count: 'exact', head: true })
            .eq('deck_id', deck.id);

        if (likesError) {
            console.error(`❌ Error contando likes para ${deck.name}:`, likesError);
            continue;
        }

        // Contar comentarios reales
        const { count: realComments, error: commentsError } = await supabase
            .from('deck_comments')
            .select('*', { count: 'exact', head: true })
            .eq('deck_id', deck.id);

        if (commentsError) {
            console.error(`❌ Error contando comentarios para ${deck.name}:`, commentsError);
            continue;
        }

        const likesMatch = realLikes === (deck.likes_count || 0);
        const commentsMatch = realComments === (deck.comments_count || 0);

        console.log(`📦 ${deck.name}`);
        console.log(`   Likes: ${deck.likes_count || 0} (Real: ${realLikes}) ${likesMatch ? '✅' : '❌'}`);
        console.log(`   Comments: ${deck.comments_count || 0} (Real: ${realComments}) ${commentsMatch ? '✅' : '❌'}`);
        console.log(`   Views: ${deck.views_count || 0}`);
        console.log('');
    }

    // Probar la función de incrementar vistas
    console.log('=== Probando increment_deck_views ===\n');

    const testDeck = decks[0];
    const viewsBefore = testDeck.views_count || 0;

    console.log(`Deck de prueba: ${testDeck.name}`);
    console.log(`Views antes: ${viewsBefore}`);

    const { error: rpcError } = await supabase.rpc('increment_deck_views', {
        target_deck_id: testDeck.id
    });

    if (rpcError) {
        console.error('❌ Error llamando a increment_deck_views:', rpcError);
    } else {
        // Verificar que se incrementó
        const { data: updated } = await supabase
            .from('decks')
            .select('views_count')
            .eq('id', testDeck.id)
            .single();

        console.log(`Views después: ${updated.views_count}`);

        if (updated.views_count === viewsBefore + 1) {
            console.log('✅ increment_deck_views funciona correctamente');
        } else {
            console.log('❌ increment_deck_views no incrementó correctamente');
        }
    }

    console.log('\n=== Verificación Completa ===');
}

verifyCounters().catch(console.error);
