-- Ensure comments_count column exists on decks
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='decks' AND COLUMN_NAME='comments_count') THEN
        ALTER TABLE public.decks ADD COLUMN comments_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Function to update comments count
CREATE OR REPLACE FUNCTION update_deck_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.decks
        SET comments_count = comments_count + 1
        WHERE id = NEW.deck_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.decks
        SET comments_count = GREATEST(0, comments_count - 1)
        WHERE id = OLD.deck_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep comments_count updated
DROP TRIGGER IF EXISTS on_deck_comment_change ON public.deck_comments;
CREATE TRIGGER on_deck_comment_change
AFTER INSERT OR DELETE ON public.deck_comments
FOR EACH ROW EXECUTE FUNCTION update_deck_comments_count();

-- Initialization: Synchronize current counts
UPDATE public.decks d
SET comments_count = (
    SELECT count(*)
    FROM public.deck_comments c
    WHERE c.deck_id = d.id
);
