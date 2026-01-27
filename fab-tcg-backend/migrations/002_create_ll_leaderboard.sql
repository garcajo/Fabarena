-- Create a table to cache Living Legend data
create table if not exists living_legend_leaderboard (
  id uuid default gen_random_uuid() primary key,
  hero_name text not null unique,
  points integer not null default 0,
  rank text,
  status text not null default 'Active',
  class text,
  updated_at timestamptz default now()
);

-- Enable RLS just in case, though it's public read usually
alter table living_legend_leaderboard enable row level security;

-- Allow public read access
create policy "Public read access"
  on living_legend_leaderboard for select
  using (true);

-- Allow backend (service role) to insert/update
-- (Service role bypasses RLS, but explicit policies are good practice if using anon key in future)
create policy "Service role full access"
  on living_legend_leaderboard for all
  using (true)
  with check (true);
