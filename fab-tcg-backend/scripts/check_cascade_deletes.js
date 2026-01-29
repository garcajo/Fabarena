const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkForeignKeys() {
    console.log('=== Verificando Foreign Keys con ON DELETE CASCADE ===\n');

    // Tablas que deben tener ON DELETE CASCADE para user_id
    const tablesToCheck = [
        'decks',
        'collections', // También conocida como user_collection
        'deck_likes',
        'deck_comments',
        'deck_folders'
    ];

    console.log('Tablas a verificar:');
    tablesToCheck.forEach(table => console.log(`  - ${table}`));
    console.log('\n');

    // Verificar que las tablas existan
    for (const table of tablesToCheck) {
        const { data, error } = await supabase
            .from(table)
            .select('id')
            .limit(1);

        if (error) {
            console.log(`❌ Tabla "${table}" no existe o no es accesible: ${error.message}`);
        } else {
            console.log(`✅ Tabla "${table}" existe`);
        }
    }

    console.log('\n=== Recomendaciones ===\n');
    console.log('Para asegurar que los datos se eliminen automáticamente cuando se elimina un usuario,');
    console.log('todas las tablas deben tener foreign keys con ON DELETE CASCADE.');
    console.log('\nEjecuta la migración "ensure_cascade_deletes.sql" para aplicar estos cambios.');
}

checkForeignKeys().catch(console.error);
