-- Enable Row Level Security (RLS) on existing tables
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- 1. Policies for 'cards' table
-- Allow everyone (anon and authenticated) to read cards
CREATE POLICY "Public Read Access"
ON cards
FOR SELECT
TO public
USING (true);

-- Allow only Service Role (backend) to modify cards
-- (Implicitly denied for anon/authenticated if no policy exists, but we can be explicit or just rely on default deny)
-- Supabase Service Role bypasses RLS, so no specific policy needed for it to write, 
-- but we ensure no ONE ELSE can write.

-- 2. Create 'decks' table
CREATE TABLE IF NOT EXISTS decks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    format TEXT NOT NULL, -- 'Classic Constructed', 'Silver Age'
    hero_id UUID REFERENCES cards(id), -- Nullable initially if just creating draft
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    main_deck JSONB DEFAULT '[]'::jsonb, -- Array of card IDs or objects
    sideboard JSONB DEFAULT '[]'::jsonb,
    maybeboard JSONB DEFAULT '[]'::jsonb
);

-- Enable RLS on 'decks'
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see only their own decks
CREATE POLICY "Users can view own decks"
ON decks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own decks
CREATE POLICY "Users can create own decks"
ON decks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own decks
CREATE POLICY "Users can update own decks"
ON decks
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can delete their own decks
CREATE POLICY "Users can delete own decks"
ON decks
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 3. Create 'profiles' table (Secure User Metadata)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on 'profiles'
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view profiles (optional, usually needed for social features)
-- For now, let's restrict to "Users can view own profile" OR "Public read" depending on requirements.
-- Let's make it Public Read so deck authors can be shown later.
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles
FOR SELECT
TO public
USING (true);

-- Policy: Users can update own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 4. Auto-create profile trigger
-- Function to handle new user insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Verify configuration
SELECT 'Security configuration completed successfully' as status;
