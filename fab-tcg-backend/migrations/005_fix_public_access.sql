-- Enable RLS on decks and deck_cards if not already enabled
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_cards ENABLE ROW LEVEL SECURITY;

-- Policy for viewing public decks
DROP POLICY IF EXISTS "Public decks are viewable by everyone" ON public.decks;
CREATE POLICY "Public decks are viewable by everyone" ON public.decks
    FOR SELECT USING (visibility = 'public');

-- Policy for viewing cards of public decks
DROP POLICY IF EXISTS "Cards of public decks are viewable by everyone" ON public.deck_cards;
CREATE POLICY "Cards of public decks are viewable by everyone" ON public.deck_cards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.decks
            WHERE id = public.deck_cards.deck_id
            AND visibility = 'public'
        )
    );

-- Policy for owners to see their own private decks (already exists likely, but ensuring)
DROP POLICY IF EXISTS "Users can see their own decks" ON public.decks;
CREATE POLICY "Users can see their own decks" ON public.decks
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for owners to see their own deck cards
DROP POLICY IF EXISTS "Users can see their own deck cards" ON public.deck_cards;
CREATE POLICY "Users can see their own deck cards" ON public.deck_cards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.decks
            WHERE id = public.deck_cards.deck_id
            AND auth.uid() = user_id
        )
    );
