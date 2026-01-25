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

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
