-- ================================================
-- Refined Wants Security Migration
-- Ensures ONLY owners can modify, but everyone can view shared content.
-- ================================================

-- 1. DROP existing policies to reset clean
DROP POLICY IF EXISTS "Users can view own wants lists" ON wants_lists;
DROP POLICY IF EXISTS "Public can view shared lists" ON wants_lists;
DROP POLICY IF EXISTS "Users can view own wants items" ON wants_items;
DROP POLICY IF EXISTS "Public can view shared list items" ON wants_items;

-- 2. Refined wants_lists policies
-- Unified SELECT: Owners can see their lists, and anyone (auth or anon) can see public lists.
CREATE POLICY "Viewable wants lists"
ON wants_lists
FOR SELECT
TO public
USING (
    auth.uid() = user_id 
    OR is_public = true
);

-- Management remains strictly for owners
-- (INSERT, UPDATE, DELETE already existed but we reinforce the check)

-- 3. Refined wants_items policies
-- Unified SELECT: Anyone can see items if they belong to a list they are allowed to see.
CREATE POLICY "Viewable wants items"
ON wants_items
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM wants_lists
        WHERE wants_lists.id = wants_items.list_id
        AND (wants_lists.user_id = auth.uid() OR wants_lists.is_public = true)
    )
);

-- 4. Audit Decks (just in case, ensuring they have public visibility policy)
-- This ensures visitors can see public decks, but only creators can edit.
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Decks" ON public.decks;
CREATE POLICY "Public Read Decks" ON public.decks
FOR SELECT
TO public
USING (visibility = 'public' OR auth.uid() = user_id);

-- Verify
SELECT 'Wants and Decks security refinement applied' as status;
