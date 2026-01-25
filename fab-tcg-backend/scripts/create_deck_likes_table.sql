-- Script para crear la tabla deck_likes
-- Ejecutar en Supabase Dashboard > SQL Editor

-- Crear tabla de likes para mazos
CREATE TABLE IF NOT EXISTS deck_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    deck_id UUID REFERENCES decks(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, deck_id)
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_deck_likes_deck ON deck_likes(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_likes_user ON deck_likes(user_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE deck_likes ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden ver todos los likes (para contar)
CREATE POLICY "Anyone can view deck likes" ON deck_likes
    FOR SELECT USING (true);

-- Política: Usuarios autenticados pueden insertar sus propios likes
CREATE POLICY "Users can insert their own likes" ON deck_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Usuarios pueden eliminar sus propios likes
CREATE POLICY "Users can delete their own likes" ON deck_likes
    FOR DELETE USING (auth.uid() = user_id);
