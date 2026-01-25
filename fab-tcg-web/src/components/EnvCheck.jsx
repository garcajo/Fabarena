import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const EnvCheck = () => {
    const [envError, setEnvError] = useState(null);

    useEffect(() => {
        // 1. Check if using placeholders
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!url || url.includes('your-project.supabase.co')) {
            setEnvError("CRITICAL: VITE_SUPABASE_URL is missing or default.");
            return;
        }

        if (!key || key.includes('your-anon-key')) {
            setEnvError("CRITICAL: VITE_SUPABASE_ANON_KEY is missing or default.");
            return;
        }

        // 2. Simple Connection Test
        const testConnection = async () => {
            try {
                const { error } = await supabase.from('cards').select('id').limit(1);
                // 400 or 200 is fine, connection worked. 
                // Network error means bad URL/CORS. 401 means bad key.
                if (error && error.message && error.message.includes('Failed to fetch')) {
                    setEnvError(`Network Error: Cannot connect to Supabase. Check VITE_SUPABASE_URL (${url})`);
                }
            } catch (err) {
                setEnvError("Unknown connection error: " + err.message);
            }
        };

        testConnection();
    }, []);

    if (!envError) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '0',
            left: '0',
            right: '0',
            backgroundColor: '#ff0000',
            color: 'white',
            padding: '20px',
            zIndex: 9999,
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '18px'
        }}>
            ⚠️ CONFIG ERROR: {envError} <br />
            <small>Please check Vercel Environment Variables.</small>
        </div>
    );
};

export default EnvCheck;
