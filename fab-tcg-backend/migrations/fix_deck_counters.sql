-- ============================================================
-- MIGRACIÓN COMPLETA: Contadores de Decks (Likes, Views, Comments)
-- ============================================================

-- 1. Agregar columna comments_count
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='decks' AND COLUMN_NAME='comments_count') THEN
        ALTER TABLE public.decks ADD COLUMN comments_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Agregar columna views_count
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='decks' AND COLUMN_NAME='views_count') THEN
        ALTER TABLE public.decks ADD COLUMN views_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- 3. Función para actualizar contador de comentarios
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

-- 4. Trigger para comentarios
DROP TRIGGER IF EXISTS on_deck_comment_change ON public.deck_comments;
CREATE TRIGGER on_deck_comment_change
AFTER INSERT OR DELETE ON public.deck_comments
FOR EACH ROW EXECUTE FUNCTION update_deck_comments_count();

-- 5. Función RPC para incrementar vistas
CREATE OR REPLACE FUNCTION increment_deck_views(target_deck_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.decks
    SET views_count = views_count + 1
    WHERE id = target_deck_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Sincronizar contadores existentes con datos reales
-- Likes (debería estar sincronizado por el trigger existente, pero por si acaso)
UPDATE public.decks d
SET likes_count = (
    SELECT count(*)
    FROM public.deck_likes l
    WHERE l.deck_id = d.id
);

-- Comments
UPDATE public.decks d
SET comments_count = (
    SELECT count(*)
    FROM public.deck_comments c
    WHERE c.deck_id = d.id
);

-- Views se mantienen en 0 ya que no hay historial

-- ============================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================
