import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and Anon Key
// For now using placeholders or environment variables if available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('--- Supabase Debug ---');
console.log('VITE_SUPABASE_URL defined:', !!supabaseUrl);
console.log('VITE_SUPABASE_ANON_KEY defined:', !!supabaseKey);
console.log('Current Mode:', import.meta.env.MODE);

if (supabaseKey) {
    console.log('Key start:', supabaseKey.substring(0, 10) + '...');
    const parts = supabaseKey.split('.');
    console.log('Key parts count:', parts.length);
    if (parts.length !== 3) {
        console.error('CRITICAL: VITE_SUPABASE_ANON_KEY is NOT a valid JWT. It must have 3 parts separated by dots.');
    } else {
        try {
            // Check if header is valid base64
            atob(parts[0]);
            console.log('Key header is valid Base64');
        } catch (e) {
            console.error('CRITICAL: VITE_SUPABASE_ANON_KEY header is NOT valid Base64. Check for spaces or corrupted characters.');
        }
    }
}
console.log('----------------------');

if (!supabaseUrl || !supabaseKey) {
    console.error('CRITICAL ERROR: Supabase environment variables are missing. Please check your .env file or Vercel project settings.');
    throw new Error('Supabase environment variables are missing.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
