-- Add views_count column to decks
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='decks' AND COLUMN_NAME='views_count') THEN
        ALTER TABLE public.decks ADD COLUMN views_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- RPC Function to safely increment views
CREATE OR REPLACE FUNCTION increment_deck_views(target_deck_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.decks
    SET views_count = views_count + 1
    WHERE id = target_deck_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
