const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration(filename) {
    console.log(`\n=== Ejecutando ${filename} ===\n`);

    const filePath = path.join(__dirname, '..', 'migrations', filename);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Split by semicolons and execute each statement
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';
        console.log(`Ejecutando statement ${i + 1}/${statements.length}...`);

        try {
            const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

            if (error) {
                // Try direct execution if RPC doesn't exist
                console.log('RPC no disponible, intentando ejecución directa...');

                // For Supabase, we need to use the REST API directly
                // This is a workaround - ideally migrations should be run via Supabase CLI
                console.log('⚠️  No se puede ejecutar SQL directamente desde el cliente.');
                console.log('Por favor, ejecuta este SQL manualmente en el SQL Editor de Supabase:');
                console.log('\n' + statement + '\n');

                // Continue to show all statements
                continue;
            }

            console.log('✅ Statement ejecutado correctamente');
        } catch (err) {
            console.error(`❌ Error: ${err.message}`);
        }
    }
}

async function applyMigrations() {
    console.log('=== Aplicando Migraciones Faltantes ===');

    // Since we can't execute SQL directly, we'll output the SQL for manual execution
    console.log('\n⚠️  IMPORTANTE: Estas migraciones deben ejecutarse manualmente en Supabase.');
    console.log('Ve a: https://supabase.com/dashboard/project/[tu-proyecto]/sql\n');

    const migrations = [
        '006_add_deck_comments_count.sql',
        '007_add_deck_views_count.sql'
    ];

    for (const migration of migrations) {
        const filePath = path.join(__dirname, '..', 'migrations', migration);
        const sql = fs.readFileSync(filePath, 'utf8');

        console.log(`\n${'='.repeat(60)}`);
        console.log(`MIGRACIÓN: ${migration}`);
        console.log('='.repeat(60));
        console.log(sql);
        console.log('='.repeat(60));
    }

    console.log('\n✅ Copia y pega el SQL anterior en el SQL Editor de Supabase');
    console.log('   y ejecútalo para aplicar las migraciones.\n');
}

applyMigrations().catch(console.error);
