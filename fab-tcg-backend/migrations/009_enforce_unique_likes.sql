-- Ensure we don't have duplicates before adding the constraint
-- (This deletes older duplicates, keeping the most recent one)
DELETE FROM public.deck_likes a USING public.deck_likes b
WHERE a.id < b.id
AND a.deck_id = b.deck_id
AND a.user_id = b.user_id;

-- Now add the unique constraint
ALTER TABLE public.deck_likes
ADD CONSTRAINT deck_likes_deck_id_user_id_key UNIQUE (deck_id, user_id);

-- Verify counts one last time
UPDATE public.decks d
SET likes_count = (
    SELECT count(*)
    FROM public.deck_likes l
    WHERE l.deck_id = d.id
);
