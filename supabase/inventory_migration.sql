-- Nuke the old table to be sure
DROP TABLE IF EXISTS user_collections CASCADE;

-- Create 'user_inventory' table (Fresh start)
CREATE TABLE IF NOT EXISTS user_inventory (
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
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

-- Policies (We use DROP IF EXISTS to be safe, though table is new)
DROP POLICY IF EXISTS "Users can view own inventory" ON user_inventory;
CREATE POLICY "Users can view own inventory"
ON user_inventory FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own inventory" ON user_inventory;
CREATE POLICY "Users can insert own inventory"
ON user_inventory FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own inventory" ON user_inventory;
CREATE POLICY "Users can update own inventory"
ON user_inventory FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own inventory" ON user_inventory;
CREATE POLICY "Users can delete own inventory"
ON user_inventory FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Explicitly grant permissions to standard roles (just in case)
GRANT ALL ON user_inventory TO postgres;
GRANT ALL ON user_inventory TO service_role;
GRANT ALL ON user_inventory TO authenticated; -- check existing permissions

SELECT 'Inventory migration completed' as status;
