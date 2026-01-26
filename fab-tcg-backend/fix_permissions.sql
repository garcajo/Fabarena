-- Enable RLS on cards table (if not already enabled)
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Remove existing policy if it blocks access (optional cleaning)
DROP POLICY IF EXISTS "Public Read Access" ON public.cards;

-- Create policy to allow ANYONE to read cards
CREATE POLICY "Public Read Access" ON public.cards
FOR SELECT
USING (true);

-- Also ensure fetching decks is possible for everyone
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Decks" ON public.decks;
CREATE POLICY "Public Read Decks" ON public.decks
FOR SELECT
USING (visibility = 'public');
