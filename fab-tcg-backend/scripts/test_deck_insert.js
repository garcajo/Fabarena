require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('🔍 Testing Deck Insert Functionality\n');
console.log('📍 Supabase URL:', supabaseUrl);
console.log('🔑 Using service key:', supabaseKey ? 'Yes' : 'No');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDeckInsert() {
    console.log('\n=== Test 1: Check table structure ===');
    const { data: columns, error: columnsError } = await supabase
        .from('decks')
        .select('*')
        .limit(0);

    if (columnsError) {
        console.error('❌ Error checking table:', JSON.stringify(columnsError, null, 2));
        return;
    }
    console.log('✅ Table is accessible');

    console.log('\n=== Test 2: Try inserting test deck ===');
    const testDeck = {
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        name: 'Test Deck',
        format: 'cc',
        hero: { nombre: 'Test Hero' },
        equipment: [],
        main_deck: [],
        sideboard: [],
        maybeboard: []
    };

    const { data: insertData, error: insertError } = await supabase
        .from('decks')
        .insert([testDeck])
        .select();

    if (insertError) {
        console.error('❌ Insert failed:');
        console.error('Code:', insertError.code);
        console.error('Message:', insertError.message);
        console.error('Details:', insertError.details);
        console.error('Hint:', insertError.hint);
        console.error('\nFull error:', JSON.stringify(insertError, null, 2));

        if (insertError.message.includes('schema cache')) {
            console.log('\n💡 This is a PostgREST schema cache issue');
            console.log('   The table exists but PostgREST API cannot see it');
        }
    } else {
        console.log('✅ Insert successful!');
        console.log('Inserted deck:', insertData);

        // Clean up
        await supabase
            .from('decks')
            .delete()
            .eq('id', insertData[0].id);
        console.log('🧹 Test data cleaned up');
    }
}

testDeckInsert().catch(console.error);
