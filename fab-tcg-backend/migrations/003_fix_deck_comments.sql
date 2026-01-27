-- Create deck_comments table if not exists
create table if not exists deck_comments (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deck_id uuid not null references decks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references deck_comments(id) on delete cascade,
  content text not null,
  username text -- Cache username to avoid joins/auth lookups for display
);

-- Enable RLS
alter table deck_comments enable row level security;

-- Policies

-- 1. Everyone can read comments
create policy "Public can view comments"
  on deck_comments for select
  using (true);

-- 2. Authenticated users can insert comments
create policy "Authenticated users can comment"
  on deck_comments for insert
  with check (auth.uid() = user_id);

-- 3. Users can update their own comments (optional but good)
create policy "Users can update own comments"
  on deck_comments for update
  using (auth.uid() = user_id);

-- 4. Users can delete their own comments
create policy "Users can delete own comments"
  on deck_comments for delete
  using (auth.uid() = user_id);

-- Add index for performance on deck lookups
create index if not exists idx_deck_comments_deck_id on deck_comments(deck_id);
create index if not exists idx_deck_comments_parent_id on deck_comments(parent_id);
