-- SCRIPT DE VERIFICACIÓN Y REPARACIÓN EXHAUSTIVA
-- Ejecuta esto en el Editor SQL de Supabase para asegurar que la tabla 'contact_messages' funciona.

BEGIN;

-- 1. Verificar si la extensión UUID existe (por si acaso)
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; 

-- 2. Asegurar que la tabla existe con la estructura correcta
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    subject TEXT NOT NULL CHECK (length(subject) > 0),
    message TEXT NOT NULL CHECK (length(message) > 0),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitar RLS (Seguridad a nivel de fila)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 4. REINICIAR POLÍTICAS (Borrar y crear de nuevo para asegurar que están bien)
DROP POLICY IF EXISTS "Allow public insert to contact_messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow users to view own messages" ON public.contact_messages;

-- Política para permitir INSERT a cualquier persona (anon o logueado)
CREATE POLICY "Allow public insert to contact_messages"
    ON public.contact_messages
    FOR INSERT
    WITH CHECK (true);

-- Política para permitir a usuarios ver sus propios mensajes
CREATE POLICY "Allow users to view own messages"
    ON public.contact_messages
    FOR SELECT
    USING (auth.uid() = user_id);

-- 5. Dar permisos explícitos al rol 'anon' y 'authenticated' para usar la tabla
GRANT SELECT, INSERT ON public.contact_messages TO anon;
GRANT SELECT, INSERT ON public.contact_messages TO authenticated;
-- GRANT USAGE, SELECT ON SEQUENCE contact_messages_id_seq TO anon, authenticated; -- REMOVED: No sequence for UUID

COMMIT;

-- 6. PRUEBA DE INSERCIÓN (Opcional, verifica si esto devuelve un ID)
-- INSERT INTO public.contact_messages (email, subject, message)
-- VALUES ('test@verify.com', 'Prueba de Verificación', 'Este es un mensaje de prueba para validar la tabla.')
-- RETURNING id;
