import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and Anon Key
// For now using placeholders or environment variables if available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
