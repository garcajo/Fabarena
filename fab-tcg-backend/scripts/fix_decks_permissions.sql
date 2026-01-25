NOTIFY pgrst, 'reload config';
GRANT ALL ON TABLE public.decks TO anon;
GRANT ALL ON TABLE public.decks TO authenticated;
GRANT ALL ON TABLE public.decks TO service_role;
DROP POLICY IF EXISTS "User can manage own decks" ON public.decks;
CREATE POLICY "User can manage own decks" ON public.decks FOR ALL USING (auth.uid() = user_id);
