-- Run this SQL in your Supabase SQL Editor
create table public.decks (
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

-- Enable Security
alter table public.decks enable row level security;

-- Policy to allow users to manage their own decks
create policy "User can manage own decks" 
on public.decks 
for all 
using (auth.uid() = user_id);
