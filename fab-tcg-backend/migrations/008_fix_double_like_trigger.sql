-- Comprehensive Fix for Double Like Count
-- 1. Drop ALL potential triggers that might be causing double counts
DROP TRIGGER IF EXISTS trigger_update_deck_likes_count ON public.deck_likes;
DROP TRIGGER IF EXISTS on_deck_like_change ON public.deck_likes;
DROP TRIGGER IF EXISTS update_likes_count ON public.deck_likes; -- Possible other name

-- 2. Drop the function to ensure we replace it with the correct logic
DROP FUNCTION IF EXISTS update_deck_likes_count CASCADE;

-- 3. Recreate the Function
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

-- 4. Recreate the Trigger (Single Source of Truth)
CREATE TRIGGER on_deck_like_change
AFTER INSERT OR DELETE ON public.deck_likes
FOR EACH ROW EXECUTE FUNCTION update_deck_likes_count();

-- 5. Force Recalculation of All Counts
-- This fixes any decks that already have incorrect values
UPDATE public.decks d
SET likes_count = (
    SELECT count(*)
    FROM public.deck_likes l
    WHERE l.deck_id = d.id
);
