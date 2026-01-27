-- Create deck_comments table if it doesn't exist
create table if not exists public.deck_comments (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  deck_id uuid not null references public.decks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  parent_id uuid references public.deck_comments(id) on delete cascade,
  username text
);

-- Enable Row Level Security
alter table public.deck_comments enable row level security;

-- Drop existing policies for deck_comments to avoid conflicts
drop policy if exists "Comments are viewable by everyone" on public.deck_comments;
drop policy if exists "Users can insert their own comments" on public.deck_comments;
drop policy if exists "Users can update their own comments" on public.deck_comments;
drop policy if exists "Users can delete their own comments" on public.deck_comments;

-- Create policies for deck_comments
create policy "Comments are viewable by everyone"
  on public.deck_comments for select
  using ( true );

create policy "Users can insert their own comments"
  on public.deck_comments for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own comments"
  on public.deck_comments for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own comments"
  on public.deck_comments for delete
  using ( auth.uid() = user_id );


-- Verify deck_likes table exists
create table if not exists public.deck_likes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  deck_id uuid not null references public.decks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  unique(deck_id, user_id)
);

alter table public.deck_likes enable row level security;

-- Drop existing policies for deck_likes to avoid conflicts
drop policy if exists "Likes are viewable by everyone" on public.deck_likes;
drop policy if exists "Users can insert their own likes" on public.deck_likes;
drop policy if exists "Users can delete their own likes" on public.deck_likes;

-- Create policies for deck_likes
create policy "Likes are viewable by everyone"
  on public.deck_likes for select
  using ( true );

create policy "Users can insert their own likes"
  on public.deck_likes for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own likes"
  on public.deck_likes for delete
  using ( auth.uid() = user_id );
