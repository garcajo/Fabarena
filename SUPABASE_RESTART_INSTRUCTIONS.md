# Supabase PostgREST Schema Cache Issue - Solution

## Problem
The `decks` table exists in the database but Supabase's PostgREST API layer hasn't reloaded its schema cache to recognize it.

## Solution: Restart the Supabase Project

Since running `NOTIFY pgrst, 'reload config';` hasn't resolved the issue, you need to **restart your Supabase project's API service**.

### Steps:

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard/project/sbzdgydudrsdrhxjbycv

2. Navigate to **Settings** → **API** 

3. Look for a **"Restart project"** or **"Restart services"** button

   OR

4. Go to **Settings** → **General** and find the **"Restart project"** option

5. Click **Restart** and wait 30-60 seconds for the project to come back online

6. Once restarted, try saving your deck again

### Why this works:
The Supabase PostgREST API caches the database schema for performance. When you create a new table, sometimes the `NOTIFY` command doesn't properly refresh this cache. A full project restart forces all services (including PostgREST) to reload their configuration and schema.

### Alternative (if restart button not available):
If you don't see a restart option, you can:
1. Pause the project
2. Wait 30 seconds
3. Resume the project

This achieves the same result.
