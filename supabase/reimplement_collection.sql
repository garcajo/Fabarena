-- Nuke everything related to collections (Clean Slate)
DROP TABLE IF EXISTS user_collections CASCADE;
DROP TABLE IF EXISTS user_inventory CASCADE;
DROP TABLE IF EXISTS user_collection CASCADE;

-- Create 'user_collection' table (Singular, Fresh start)
CREATE TABLE IF NOT EXISTS user_collection (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    is_foil BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, card_id, is_foil)
);

-- Enable RLS
ALTER TABLE user_collection ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own collection"
ON user_collection FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collection"
ON user_collection FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collection"
ON user_collection FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collection"
ON user_collection FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Grants
GRANT ALL ON user_collection TO postgres;
GRANT ALL ON user_collection TO service_role;
GRANT ALL ON user_collection TO authenticated;

-- Force Cache Reload
NOTIFY pgrst, 'reload schema';

SELECT 'Collection re-implementation completed' as status;
