-- Enable RLS
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- 1. Create Cards Table
create table if not exists public.cards (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  clase text,
  costo text,
  pitch text,
  poder text,
  defensa text,
  tipo text,
  rareza text,
  set_code text,
  imagen text,
  texto text,
  keywords text[],
  artista text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Decks Table
create table if not exists public.decks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  format text not null,
  hero jsonb,
  equipment jsonb default '[]'::jsonb,
  main_deck jsonb default '[]'::jsonb,
  sideboard jsonb default '[]'::jsonb,
  maybeboard jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS
alter table public.cards enable row level security;
alter table public.decks enable row level security;

-- 4. Create Policies
-- Cards (Public Read)
drop policy if exists "Cards are public" on public.cards;
create policy "Cards are public" on public.cards for select using (true);

-- Decks (User Managed)
drop policy if exists "User can manage own decks" on public.decks;
create policy "User can manage own decks" on public.decks for all using (auth.uid() = user_id);

-- 5. Force Schema Cache Reload
notify pgrst, 'reload schema';
notify pgrst, 'reload config';
