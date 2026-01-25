-- Drop existing table to ensure schema update
DROP TABLE IF EXISTS cards;

-- Create the cards table
CREATE TABLE IF NOT EXISTS cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    clase TEXT NOT NULL,
    costo TEXT,
    pitch INTEGER,
    poder TEXT,
    defensa TEXT,
    tipo TEXT NOT NULL,
    rareza TEXT NOT NULL,
    set_code TEXT NOT NULL,
    imagen TEXT,
    texto TEXT,
    keywords TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for optimization
CREATE INDEX IF NOT EXISTS idx_cards_nombre ON cards(nombre);
CREATE INDEX IF NOT EXISTS idx_cards_clase ON cards(clase);
CREATE INDEX IF NOT EXISTS idx_cards_set_code ON cards(set_code);
