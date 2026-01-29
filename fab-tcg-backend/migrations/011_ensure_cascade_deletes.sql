-- ============================================================
-- MIGRACIÓN: Asegurar CASCADE DELETE en todas las tablas de usuario
-- ============================================================
-- Esta migración asegura que cuando un usuario elimina su cuenta,
-- todos sus datos relacionados (decks, colección, likes, comentarios, carpetas)
-- se eliminen automáticamente.
-- ============================================================

-- 1. TABLA: decks
-- Eliminar constraint existente si existe y recrear con CASCADE
DO $$ 
BEGIN
    -- Buscar y eliminar constraint de user_id si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%decks_user_id%' 
        AND table_name = 'decks'
    ) THEN
        ALTER TABLE public.decks DROP CONSTRAINT IF EXISTS decks_user_id_fkey;
    END IF;
    
    -- Agregar constraint con CASCADE
    ALTER TABLE public.decks 
    ADD CONSTRAINT decks_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'decks: Foreign key actualizada con ON DELETE CASCADE';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'decks: Constraint ya existe';
END $$;

-- 2. TABLA: collections (user_collection)
-- Esta tabla ya debería tener CASCADE, pero lo verificamos
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%collections_user_id%' 
        AND table_name = 'collections'
    ) THEN
        ALTER TABLE public.collections DROP CONSTRAINT IF EXISTS collections_user_id_fkey;
    END IF;
    
    ALTER TABLE public.collections 
    ADD CONSTRAINT collections_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'collections: Foreign key actualizada con ON DELETE CASCADE';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'collections: Constraint ya existe';
END $$;

-- 3. TABLA: deck_likes
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%deck_likes_user_id%' 
        AND table_name = 'deck_likes'
    ) THEN
        ALTER TABLE public.deck_likes DROP CONSTRAINT IF EXISTS deck_likes_user_id_fkey;
    END IF;
    
    ALTER TABLE public.deck_likes 
    ADD CONSTRAINT deck_likes_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'deck_likes: Foreign key actualizada con ON DELETE CASCADE';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'deck_likes: Constraint ya existe';
END $$;

-- 4. TABLA: deck_comments
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%deck_comments_user_id%' 
        AND table_name = 'deck_comments'
    ) THEN
        ALTER TABLE public.deck_comments DROP CONSTRAINT IF EXISTS deck_comments_user_id_fkey;
    END IF;
    
    ALTER TABLE public.deck_comments 
    ADD CONSTRAINT deck_comments_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'deck_comments: Foreign key actualizada con ON DELETE CASCADE';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'deck_comments: Constraint ya existe';
END $$;

-- 5. TABLA: deck_folders
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%deck_folders_user_id%' 
        AND table_name = 'deck_folders'
    ) THEN
        ALTER TABLE public.deck_folders DROP CONSTRAINT IF EXISTS deck_folders_user_id_fkey;
    END IF;
    
    ALTER TABLE public.deck_folders 
    ADD CONSTRAINT deck_folders_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'deck_folders: Foreign key actualizada con ON DELETE CASCADE';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'deck_folders: Constraint ya existe';
END $$;

-- 6. TABLA: deck_cards (relación deck -> cards)
-- Asegurar que cuando se elimina un deck, sus cartas también se eliminen
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%deck_cards_deck_id%' 
        AND table_name = 'deck_cards'
    ) THEN
        ALTER TABLE public.deck_cards DROP CONSTRAINT IF EXISTS deck_cards_deck_id_fkey;
    END IF;
    
    ALTER TABLE public.deck_cards 
    ADD CONSTRAINT deck_cards_deck_id_fkey 
    FOREIGN KEY (deck_id) 
    REFERENCES public.decks(id) 
    ON DELETE CASCADE;
    
    RAISE NOTICE 'deck_cards: Foreign key actualizada con ON DELETE CASCADE';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'deck_cards: Constraint ya existe';
END $$;

-- 7. TABLA: contact_messages (si existe)
-- Los mensajes de contacto también deberían eliminarse con el usuario
DO $$ 
BEGIN
    -- Verificar si la tabla existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_messages') THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name LIKE '%contact_messages_user_id%' 
            AND table_name = 'contact_messages'
        ) THEN
            ALTER TABLE public.contact_messages DROP CONSTRAINT IF EXISTS contact_messages_user_id_fkey;
        END IF;
        
        ALTER TABLE public.contact_messages 
        ADD CONSTRAINT contact_messages_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'contact_messages: Foreign key actualizada con ON DELETE CASCADE';
    ELSE
        RAISE NOTICE 'contact_messages: Tabla no existe, saltando';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'contact_messages: Constraint ya existe';
END $$;

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
-- Mostrar todas las foreign keys relacionadas con auth.users
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== FOREIGN KEYS CONFIGURADAS ===';
    FOR rec IN 
        SELECT 
            tc.table_name,
            tc.constraint_name,
            rc.delete_rule
        FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc 
            ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND rc.delete_rule IN ('CASCADE', 'NO ACTION', 'RESTRICT', 'SET NULL')
        AND tc.table_schema = 'public'
        ORDER BY tc.table_name
    LOOP
        RAISE NOTICE 'Tabla: % | Constraint: % | Delete Rule: %', 
            rec.table_name, rec.constraint_name, rec.delete_rule;
    END LOOP;
END $$;

-- ============================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================
