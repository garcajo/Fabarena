-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Enable RLS on deck_comments table
ALTER TABLE public.deck_comments ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Public Read Access
-- Allows anyone (including anonymous users) to see comments on public decks
DROP POLICY IF EXISTS "Enable read access for all users" ON public.deck_comments;
CREATE POLICY "Enable read access for all users" ON public.deck_comments
FOR SELECT USING (true);

-- 3. Policy: User Insert Access
-- Allows logged-in users to post comments (validated by user_id)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.deck_comments;
CREATE POLICY "Enable insert for authenticated users only" ON public.deck_comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Policy: User Delete Access
-- Allows users to delete their own comments
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.deck_comments;
CREATE POLICY "Enable delete for users based on user_id" ON public.deck_comments
FOR DELETE USING (auth.uid() = user_id);

-- Verify policies
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'deck_comments';
