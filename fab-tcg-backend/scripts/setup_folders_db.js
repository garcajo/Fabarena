
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client } = require('pg');

const runMigration = async () => {
    const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

    if (!connectionString) {
        console.error('DATABASE_URL or SUPABASE_DB_URL is not set in .env');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database...');

        // 1. Create deck_folders table
        console.log('Creating deck_folders table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.deck_folders (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID NOT NULL,
                name TEXT NOT NULL,
                color TEXT DEFAULT '#C52222',
                created_at TIMESTAMPTZ DEFAULT now()
            );
        `);

        // 2. Add folder_id to decks table
        console.log('Checking decks table columns...');
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'decks' 
            AND column_name = 'folder_id';
        `);

        if (res.rows.length === 0) {
            console.log('Adding folder_id to decks table...');
            await client.query(`
                ALTER TABLE public.decks 
                ADD COLUMN folder_id UUID REFERENCES public.deck_folders(id) ON DELETE SET NULL;
            `);
        } else {
            console.log('folder_id already exists in decks table.');
        }

        console.log('Migration completed successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
};

runMigration();
