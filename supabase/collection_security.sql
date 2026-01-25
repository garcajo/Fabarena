-- Create 'user_collections' table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    is_foil BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, card_id, is_foil)
);

-- Enable RLS (safe to run multiple times)
ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;

-- Policies: Drop first to avoid 'already exists' errors, then recreate
DROP POLICY IF EXISTS "Users can view own collection" ON user_collections;
CREATE POLICY "Users can view own collection"
ON user_collections FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own collection" ON user_collections;
CREATE POLICY "Users can insert own collection"
ON user_collections FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own collection" ON user_collections;
CREATE POLICY "Users can update own collection"
ON user_collections FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own collection" ON user_collections;
CREATE POLICY "Users can delete own collection"
ON user_collections FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Verify
SELECT 'Collection security configuration completed' as status;
