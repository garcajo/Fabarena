
-- Create user_collection table
CREATE TABLE IF NOT EXISTS public.user_collection (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    is_foil BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, card_id, is_foil)
);

-- Enable RLS
ALTER TABLE public.user_collection ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. View: Users can view their own collection
CREATE POLICY "Users can view their own collection" ON public.user_collection
FOR SELECT
USING (auth.uid() = user_id);

-- 2. Insert: Users can add to their own collection
CREATE POLICY "Users can insert into their own collection" ON public.user_collection
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. Update: Users can update their own collection
CREATE POLICY "Users can update their own collection" ON public.user_collection
FOR UPDATE
USING (auth.uid() = user_id);

-- 4. Delete: Users can delete from their own collection
CREATE POLICY "Users can delete from their own collection" ON public.user_collection
FOR DELETE
USING (auth.uid() = user_id);
