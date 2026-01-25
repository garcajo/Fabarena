-- Run this SQL in your Supabase SQL Editor to fix the Foreign Key error

-- 1. Drop the existing constraint (if it exists)
ALTER TABLE public.decks 
DROP CONSTRAINT IF EXISTS decks_user_id_fkey;

-- 2. Add the correct constraint referencing auth.users
ALTER TABLE public.decks
ADD CONSTRAINT decks_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Validation query (optional)
-- SELECT constraint_name, table_name, constraint_type 
-- FROM information_schema.table_constraints 
-- WHERE table_name = 'decks';
