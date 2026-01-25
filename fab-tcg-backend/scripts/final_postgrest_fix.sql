-- FINAL FIX: Expose decks table to PostgREST API
-- Run this EXACTLY as shown in Supabase SQL Editor

-- Step 1: Grant access to the postgrest role (anon/authenticated use this)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.decks TO anon, authenticated, service_role;

-- Step 2: Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

-- Step 3: Verify the policy exists
DROP POLICY IF EXISTS "User can manage own decks" ON public.decks;
CREATE POLICY "User can manage own decks" 
  ON public.decks 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Step 4: Final reload
NOTIFY pgrst, 'reload config';

SELECT 'Setup complete - try saving your deck now!' as status;
