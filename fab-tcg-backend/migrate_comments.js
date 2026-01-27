const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
});

async function migrate() {
    try {
        await client.connect();
        console.log('Connected to database...');

        // Check if table exists
        const checkTableQuery = `
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'deck_comments'
            );
        `;
        const res = await client.query(checkTableQuery);
        const tableExists = res.rows[0].exists;

        if (!tableExists) {
            console.log('Creating deck_comments table...');
            const createTableQuery = `
                CREATE TABLE deck_comments (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    deck_id UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
                    user_id UUID NOT NULL, -- Storing UUID from auth system
                    username VARCHAR(255) NOT NULL,
                    content TEXT NOT NULL,
                    parent_id UUID REFERENCES deck_comments(id) ON DELETE CASCADE,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            `;
            await client.query(createTableQuery);

            // Add index for performance
            const createIndexQuery = `
                CREATE INDEX idx_deck_comments_deck_id ON deck_comments(deck_id);
            `;
            await client.query(createIndexQuery);

            console.log('deck_comments table created successfully!');
        } else {
            console.log('deck_comments table already exists.');
        }

        // Enable RLS and add policies (Idempotent-ish check helps, but we will just try-catch or IF NOT EXISTS in SQL)
        console.log('Ensuring RLS policies...');

        // Enable RLS
        await client.query(`ALTER TABLE deck_comments ENABLE ROW LEVEL SECURITY;`);

        // Policy: Public Read
        // Drop first to update
        await client.query(`DROP POLICY IF EXISTS "Enable read access for all users" ON deck_comments;`);
        await client.query(`
            CREATE POLICY "Enable read access for all users" ON deck_comments
            FOR SELECT USING (true);
        `);

        // Policy: Authenticated Insert
        await client.query(`DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON deck_comments;`);
        await client.query(`
            CREATE POLICY "Enable insert for authenticated users only" ON deck_comments
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        `);

        // Policy: User Delete
        await client.query(`DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON deck_comments;`);
        await client.query(`
            CREATE POLICY "Enable delete for users based on user_id" ON deck_comments
            FOR DELETE USING (auth.uid() = user_id);
        `);

        console.log('RLS policies applied successfully!');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
