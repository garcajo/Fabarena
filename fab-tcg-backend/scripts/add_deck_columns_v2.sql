-- Run this SQL in your Supabase SQL Editor to fix the missing columns error

ALTER TABLE public.decks 
ADD COLUMN IF NOT EXISTS equipment jsonb default '[]'::jsonb,
ADD COLUMN IF NOT EXISTS main_deck jsonb default '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sideboard jsonb default '[]'::jsonb,
ADD COLUMN IF NOT EXISTS maybeboard jsonb default '[]'::jsonb;

-- Verify columns (optional, for manual check)
-- SELECT * FROM public.decks LIMIT 1;
