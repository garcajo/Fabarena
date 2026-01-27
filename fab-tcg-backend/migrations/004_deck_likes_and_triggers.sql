-- Create deck_likes table
CREATE TABLE IF NOT EXISTS public.deck_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(deck_id, user_id)
);

-- Enable RLS
ALTER TABLE public.deck_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can view likes" ON public.deck_likes;
CREATE POLICY "Public can view likes" ON public.deck_likes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can toggle likes" ON public.deck_likes;
CREATE POLICY "Authenticated users can toggle likes" ON public.deck_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own likes" ON public.deck_likes;
CREATE POLICY "Users can remove their own likes" ON public.deck_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Ensure likes_count column exists on decks
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='decks' AND COLUMN_NAME='likes_count') THEN
        ALTER TABLE public.decks ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Trigger to keep likes_count updated
CREATE OR REPLACE FUNCTION update_deck_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.decks
        SET likes_count = likes_count + 1
        WHERE id = NEW.deck_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.decks
        SET likes_count = GREATEST(0, likes_count - 1)
        WHERE id = OLD.deck_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_deck_like_change ON public.deck_likes;
CREATE TRIGGER on_deck_like_change
AFTER INSERT OR DELETE ON public.deck_likes
FOR EACH ROW EXECUTE FUNCTION update_deck_likes_count();
