
-- Add likes_count column to decks if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'decks' AND column_name = 'likes_count') THEN
        ALTER TABLE decks ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Function to update the likes count
CREATE OR REPLACE FUNCTION update_deck_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE decks SET likes_count = likes_count + 1 WHERE id = NEW.deck_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE decks SET likes_count = likes_count - 1 WHERE id = OLD.deck_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function on insert or delete
DROP TRIGGER IF EXISTS trigger_update_deck_likes_count ON deck_likes;
CREATE TRIGGER trigger_update_deck_likes_count
AFTER INSERT OR DELETE ON deck_likes
FOR EACH ROW
EXECUTE FUNCTION update_deck_likes_count();

-- Recalculate existing counts (Backfill)
WITH counts AS (
    SELECT deck_id, COUNT(*) as cnt
    FROM deck_likes
    GROUP BY deck_id
)
UPDATE decks
SET likes_count = counts.cnt
FROM counts
WHERE decks.id = counts.deck_id;
