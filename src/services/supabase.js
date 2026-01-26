import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and Anon Key
// For now using placeholders or environment variables if available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('--- Supabase Config ---');
// Soft check
if (!supabaseUrl) console.warn('Supabase URL missing - Auth features will be disabled');
if (!supabaseKey) console.warn('Supabase Key missing - Auth features will be disabled');

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder-key'
);
