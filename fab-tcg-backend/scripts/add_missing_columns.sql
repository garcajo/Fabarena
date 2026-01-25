-- Add missing 'artista' column
ALTER TABLE public.cards ADD COLUMN IF NOT EXISTS artista text;

-- Reload schema cache to be safe
NOTIFY pgrst, 'reload schema';
