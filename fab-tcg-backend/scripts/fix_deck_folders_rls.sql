-- Fix RLS policies for deck_folders table
-- This script ensures users can manage their own folders

-- Enable RLS if not already enabled
ALTER TABLE public.deck_folders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Users can view own folders" ON public.deck_folders;
DROP POLICY IF EXISTS "Users can create own folders" ON public.deck_folders;
DROP POLICY IF EXISTS "Users can update own folders" ON public.deck_folders;
DROP POLICY IF EXISTS "Users can delete own folders" ON public.deck_folders;

-- Create policies for all CRUD operations
CREATE POLICY "Users can view own folders" ON public.deck_folders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders" ON public.deck_folders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders" ON public.deck_folders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders" ON public.deck_folders
    FOR DELETE USING (auth.uid() = user_id);

-- Verify the policies were created
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'deck_folders';
