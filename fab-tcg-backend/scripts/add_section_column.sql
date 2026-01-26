
-- 1. Add section column if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deck_cards' AND column_name = 'section') THEN
        ALTER TABLE deck_cards ADD COLUMN section TEXT DEFAULT 'main';
    END IF;
END $$;

-- 2. Backfill existing data
-- If is_sideboard is true, set section to 'sideboard'
UPDATE deck_cards SET section = 'sideboard' WHERE is_sideboard = true;

-- 3. Ensure 'equipment' logic for future (currently no way to distinguish equipment from main deck in old schema unless we infer from card type, but 'main' is safe default for now)

-- 4. Verify
-- You can verify by running: SELECT * FROM deck_cards LIMIT 5;
