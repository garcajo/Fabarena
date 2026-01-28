-- Migration: Create contact_messages table

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional, if logged in
    email TEXT CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'), -- Basic email validation regex
    subject TEXT NOT NULL CHECK (length(subject) > 0),
    message TEXT NOT NULL CHECK (length(message) > 0),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Allow anyone (anon or authenticated) to INSERT messages
CREATE POLICY "Allow public insert to contact_messages"
    ON public.contact_messages
    FOR INSERT
    WITH CHECK (true);

-- 2. Allow users to view ONLY their own messages (if logged in)
CREATE POLICY "Allow users to view own messages"
    ON public.contact_messages
    FOR SELECT
    USING (auth.uid() = user_id);

-- 3. Allow admins (service role or specific admin flag) to view all
-- Ideally we'd have an is_admin function, but for now we rely on Supabase Dashboard access or direct DB access
-- or if we implement an admin panel later.
-- For now, purely backend storage.
