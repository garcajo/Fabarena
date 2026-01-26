import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase URL and Anon Key
// For now using placeholders or environment variables if available
const supabaseUrl = 'https://jvgchegzcicnwwsrzahz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2Z2NoZWd6Y2ljbnd3c3J6YWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDc0OTUsImV4cCI6MjA4MzI4MzQ5NX0.UZ8xLmqjjc1FlWopFqVcQQNbX2z8BBWlivhKlcSEoys';

export const supabase = createClient(supabaseUrl, supabaseKey);
