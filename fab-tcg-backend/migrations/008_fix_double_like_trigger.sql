-- Drop the redundant trigger that causes double increments (cleaning up legacy scripts)
DROP TRIGGER IF EXISTS trigger_update_deck_likes_count ON public.deck_likes;
DROP TRIGGER IF EXISTS trigger_update_deck_likes_count ON decks;

-- Ensure the canonical trigger exists (as defined in migration 004)
DROP TRIGGER IF EXISTS on_deck_like_change ON public.deck_likes;
CREATE TRIGGER on_deck_like_change
AFTER INSERT OR DELETE ON public.deck_likes
FOR EACH ROW EXECUTE FUNCTION update_deck_likes_count();

-- Recalculate counts to fix any existing discrepancies caused by the double-trigger
UPDATE public.decks d
SET likes_count = (
    SELECT count(*)
    FROM public.deck_likes l
    WHERE l.deck_id = d.id
);
