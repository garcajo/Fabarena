
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const createCollectionTable = async () => {
    console.log('Creating user_collection table...');

    // We use a raw SQL query via RPC or just assume we have permissions if using service key.
    // However, the JS client doesn't support raw SQL easily without a stored procedure.
    // BUT! I see 'pg' in package.json. I should use 'pg' for DDL if I have the connection string.

    // Let's check environment variables structure via a safe check (not printing keys).
    // If 'pg' is installed, we likely have a DATABASE_URL.

    // Fallback: If we can't use 'pg', we might need to ask user to run SQL.
    // But let's assume we can try to use 'pg' first if DATABASE_URL is present.
}

// Rewriting to use 'pg' directly as it is more reliable for DDL
const { Client } = require('pg');

const runMigration = async () => {
    console.log('Starting migration...');

    // Try to get connection string from env
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('DATABASE_URL not found in .env. Cannot run DDL migration with pg.');
        console.log('Please create the table manually using the SQL provided in the implementation plan or ensure DATABASE_URL is set.');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase usually
    });

    try {
        await client.connect();

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS public.user_collection (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
                card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
                quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
                is_foil BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
                UNIQUE(user_id, card_id, is_foil)
            );
            
            -- Enable RLS
            ALTER TABLE public.user_collection ENABLE ROW LEVEL SECURITY;
            
            -- Policies
            -- View: Users can view their own collection
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies WHERE tablename = 'user_collection' AND policyname = 'Users can view their own collection'
                ) THEN
                    CREATE POLICY "Users can view their own collection" ON public.user_collection
                    FOR SELECT
                    USING (auth.uid() = user_id);
                END IF;
            END
            $$;

            -- Insert: Users can add to their own collection
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies WHERE tablename = 'user_collection' AND policyname = 'Users can insert into their own collection'
                ) THEN
                    CREATE POLICY "Users can insert into their own collection" ON public.user_collection
                    FOR INSERT
                    WITH CHECK (auth.uid() = user_id);
                END IF;
            END
            $$;

            -- Update: Users can update their own collection
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies WHERE tablename = 'user_collection' AND policyname = 'Users can update their own collection'
                ) THEN
                    CREATE POLICY "Users can update their own collection" ON public.user_collection
                    FOR UPDATE
                    USING (auth.uid() = user_id);
                END IF;
            END
            $$;

            -- Delete: Users can delete from their own collection
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_policies WHERE tablename = 'user_collection' AND policyname = 'Users can delete from their own collection'
                ) THEN
                    CREATE POLICY "Users can delete from their own collection" ON public.user_collection
                    FOR DELETE
                    USING (auth.uid() = user_id);
                END IF;
            END
            $$;
        `;

        await client.query(createTableQuery);
        console.log('✅ table user_collection created successfully with RLS policies.');
    } catch (err) {
        console.error('Error running migration:', err);
    } finally {
        await client.end();
    }
};

runMigration();
