-- ================================================
-- Wants Feature Migration
-- Creates tables for user wishlists (wants lists)
-- ================================================

-- 1. Create 'wants_lists' table
CREATE TABLE IF NOT EXISTS wants_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    share_token UUID DEFAULT gen_random_uuid() UNIQUE,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create 'wants_items' table
CREATE TABLE IF NOT EXISTS wants_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    list_id UUID REFERENCES wants_lists(id) ON DELETE CASCADE NOT NULL,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(list_id, card_id) -- Prevent duplicate cards in same list
);

-- 3. Enable RLS on both tables
ALTER TABLE wants_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wants_items ENABLE ROW LEVEL SECURITY;

-- ================================================
-- RLS Policies for wants_lists
-- ================================================

-- Users can view their own lists
CREATE POLICY "Users can view own wants lists"
ON wants_lists
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Public can view shared lists (is_public = true) using share_token
-- This is handled via function/RPC for token-based access

-- Users can create their own lists
CREATE POLICY "Users can create own wants lists"
ON wants_lists
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own lists
CREATE POLICY "Users can update own wants lists"
ON wants_lists
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own lists
CREATE POLICY "Users can delete own wants lists"
ON wants_lists
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ================================================
-- RLS Policies for wants_items
-- ================================================

-- Users can view items in their own lists
CREATE POLICY "Users can view own wants items"
ON wants_items
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM wants_lists
        WHERE wants_lists.id = wants_items.list_id
        AND wants_lists.user_id = auth.uid()
    )
);

-- Users can add items to their own lists
CREATE POLICY "Users can add wants items"
ON wants_items
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM wants_lists
        WHERE wants_lists.id = wants_items.list_id
        AND wants_lists.user_id = auth.uid()
    )
);

-- Users can update items in their own lists
CREATE POLICY "Users can update wants items"
ON wants_items
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM wants_lists
        WHERE wants_lists.id = wants_items.list_id
        AND wants_lists.user_id = auth.uid()
    )
);

-- Users can delete items from their own lists
CREATE POLICY "Users can delete wants items"
ON wants_items
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM wants_lists
        WHERE wants_lists.id = wants_items.list_id
        AND wants_lists.user_id = auth.uid()
    )
);

-- ================================================
-- Public Access for Shared Lists
-- ================================================

-- Allow anonymous users to view public shared lists
CREATE POLICY "Public can view shared lists"
ON wants_lists
FOR SELECT
TO anon
USING (is_public = true);

-- Allow anonymous users to view items in public shared lists
CREATE POLICY "Public can view shared list items"
ON wants_items
FOR SELECT
TO anon
USING (
    EXISTS (
        SELECT 1 FROM wants_lists
        WHERE wants_lists.id = wants_items.list_id
        AND wants_lists.is_public = true
    )
);

-- ================================================
-- Indexes for performance
-- ================================================

CREATE INDEX IF NOT EXISTS idx_wants_lists_user_id ON wants_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_wants_lists_share_token ON wants_lists(share_token);
CREATE INDEX IF NOT EXISTS idx_wants_items_list_id ON wants_items(list_id);
CREATE INDEX IF NOT EXISTS idx_wants_items_card_id ON wants_items(card_id);

-- ================================================
-- Update trigger for updated_at
-- ================================================

CREATE OR REPLACE FUNCTION update_wants_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wants_lists_updated_at ON wants_lists;
CREATE TRIGGER wants_lists_updated_at
    BEFORE UPDATE ON wants_lists
    FOR EACH ROW EXECUTE FUNCTION update_wants_lists_updated_at();

-- Verify
SELECT 'Wants migration completed successfully' as status;
