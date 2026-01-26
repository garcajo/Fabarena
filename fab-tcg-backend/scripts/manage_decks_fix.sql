
-- 1. Add likes_count column if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'decks' AND column_name = 'likes_count') THEN
        ALTER TABLE decks ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add username column if missing (legacy support)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'decks' AND column_name = 'username') THEN
        ALTER TABLE decks ADD COLUMN username TEXT;
    END IF;
END $$;

-- 2. Enable RLS ensuring it's on
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_likes ENABLE ROW LEVEL SECURITY;

-- 3. Policies for DECKS
-- Allow anyone to view public decks
DROP POLICY IF EXISTS "Public decks are viewable by everyone" ON decks;
CREATE POLICY "Public decks are viewable by everyone" ON decks FOR SELECT USING (visibility = 'public');

-- Allow users to view their own decks (even private)
DROP POLICY IF EXISTS "Users can view own decks" ON decks;
CREATE POLICY "Users can view own decks" ON decks FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own decks
DROP POLICY IF EXISTS "Users can insert own decks" ON decks;
CREATE POLICY "Users can insert own decks" ON decks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own decks
DROP POLICY IF EXISTS "Users can update own decks" ON decks;
CREATE POLICY "Users can update own decks" ON decks FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own decks
DROP POLICY IF EXISTS "Users can delete own decks" ON decks;
CREATE POLICY "Users can delete own decks" ON decks FOR DELETE USING (auth.uid() = user_id);


-- 4. Policies for DECK_CARDS (The likely culprit for saving issues)
-- Allow unlimited view for now (or refine to public/owned decks)
DROP POLICY IF EXISTS "Deck cards are viewable by everyone" ON deck_cards;
CREATE POLICY "Deck cards are viewable by everyone" ON deck_cards FOR SELECT USING (true);

-- Allow users to insert cards into THEIR OWN decks
-- Check that the deck belongs to the user
DROP POLICY IF EXISTS "Users can insert cards into own decks" ON deck_cards;
CREATE POLICY "Users can insert cards into own decks" ON deck_cards FOR INSERT WITH CHECK (
    deck_id IN (SELECT id FROM decks WHERE user_id = auth.uid())
);

-- Allow users to delete cards from THEIR OWN decks
DROP POLICY IF EXISTS "Users can delete cards from own decks" ON deck_cards;
CREATE POLICY "Users can delete cards from own decks" ON deck_cards FOR DELETE USING (
    deck_id IN (SELECT id FROM decks WHERE user_id = auth.uid())
);


-- 5. Policies for DECK_LIKES
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON deck_likes;
CREATE POLICY "Likes are viewable by everyone" ON deck_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like decks" ON deck_likes;
CREATE POLICY "Users can like decks" ON deck_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike decks" ON deck_likes;
CREATE POLICY "Users can unlike decks" ON deck_likes FOR DELETE USING (auth.uid() = user_id);


-- 6. Triggers for Likes Count (From previous step)
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

DROP TRIGGER IF EXISTS trigger_update_deck_likes_count ON deck_likes;
CREATE TRIGGER trigger_update_deck_likes_count
AFTER INSERT OR DELETE ON deck_likes
FOR EACH ROW
EXECUTE FUNCTION update_deck_likes_count();
