/**
 * Script to create deck_folders table and add folder_id to decks
 * Run: node scripts/create_folders_schema.js
 */
const supabase = require('../src/config/supabase');

async function createFoldersSchema() {
    console.log('Creating deck_folders schema...');

    // Check if deck_folders table exists
    const { data: existingTable, error: checkError } = await supabase
        .from('deck_folders')
        .select('id')
        .limit(1);

    if (!checkError) {
        console.log('✅ deck_folders table already exists');
        return;
    }

    // Create deck_folders table using raw SQL via RPC or manual creation
    console.log('⚠️  Please create the following table in Supabase Dashboard:');
    console.log(`
-- Run this SQL in Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS deck_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#C52222',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add folder_id column to decks table
ALTER TABLE decks ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES deck_folders(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_deck_folders_user ON deck_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_decks_folder ON decks(folder_id);

-- RLS Policies
ALTER TABLE deck_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own folders" ON deck_folders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders" ON deck_folders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders" ON deck_folders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders" ON deck_folders
    FOR DELETE USING (auth.uid() = user_id);
    `);
}

createFoldersSchema();
