-- Fix foreign key constraint on collections table
-- The collections.user_id should reference auth.users(id), not a separate users table

-- Step 1: Drop the existing constraint
ALTER TABLE public.collections DROP CONSTRAINT IF EXISTS collections_user_id_fkey;

-- Step 2: Add the correct foreign key constraint to auth.users
ALTER TABLE public.collections 
ADD CONSTRAINT collections_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Verify RLS policies exist for collections
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own collection" ON public.collections;
DROP POLICY IF EXISTS "Users can insert own collection" ON public.collections;
DROP POLICY IF EXISTS "Users can update own collection" ON public.collections;
DROP POLICY IF EXISTS "Users can delete own collection" ON public.collections;

-- Create proper RLS policies
CREATE POLICY "Users can view own collection" ON public.collections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collection" ON public.collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collection" ON public.collections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collection" ON public.collections
    FOR DELETE USING (auth.uid() = user_id);

-- Verify changes
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.collections'::regclass AND contype = 'f';
