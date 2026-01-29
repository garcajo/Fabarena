const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('=== Verificando Columnas de Decks ===\n');

    // Intentar obtener solo las columnas básicas
    const { data: decks, error } = await supabase
        .from('decks')
        .select('id, name, likes_count')
        .limit(1);

    if (error) {
        console.error('❌ Error:', error.message);
        return;
    }

    console.log('✅ likes_count existe');

    // Probar views_count
    const { error: viewsError } = await supabase
        .from('decks')
        .select('views_count')
        .limit(1);

    if (viewsError) {
        console.log('❌ views_count NO existe');
    } else {
        console.log('✅ views_count existe');
    }

    // Probar comments_count
    const { error: commentsError } = await supabase
        .from('decks')
        .select('comments_count')
        .limit(1);

    if (commentsError) {
        console.log('❌ comments_count NO existe');
    } else {
        console.log('✅ comments_count existe');
    }
}

checkColumns().catch(console.error);
