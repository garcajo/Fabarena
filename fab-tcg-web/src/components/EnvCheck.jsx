import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const EnvCheck = () => {
    const [status, setStatus] = useState({ loading: true, error: null, info: '' });
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const check = async () => {
            const url = import.meta.env.VITE_SUPABASE_URL;
            const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

            let infoMsg = `URL: ${url ? url.substring(0, 15) + '...' : 'MISSING'} | Key: ${key ? 'PRESENT' : 'MISSING'}`;

            if (!url || url.includes('your-project') || !key || key.includes('your-anon')) {
                setStatus({
                    loading: false,
                    error: "CRITICAL: Environment Variables missing or default. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.",
                    info: infoMsg
                });
                return;
            }

            try {
                const { data, error } = await supabase.from('cards').select('count').limit(1).single();

                if (error) {
                    setStatus({
                        loading: false,
                        error: `Supabase Error: ${error.message} (Code: ${error.code || 'N/A'})`,
                        info: infoMsg
                    });
                } else {
                    // Success case - auto hide after 3s unless user wants to see
                    // setStatus({ loading: false, error: null, info: "Connected Successfully!" });
                    // setTimeout(() => setIsVisible(false), 3000);
                    setIsVisible(false); // Hide immediately if success
                }
            } catch (err) {
                setStatus({
                    loading: false,
                    error: `Network/Client Error: ${err.message}`,
                    info: infoMsg
                });
            }
        };

        check();
    }, []);

    if (!isVisible || (!status.error && !status.loading)) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '0',
            left: '0',
            right: '0',
            backgroundColor: status.error ? '#d32f2f' : '#2e7d32',
            color: 'white',
            padding: '16px',
            zIndex: 99999,
            textAlign: 'center',
            fontFamily: 'monospace',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.3)'
        }}>
            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                {status.loading ? 'Checking Connection...' : (status.error ? '⚠️ CONNECTION FAILED' : '✅ CONNECTED')}
            </div>
            {status.error && (
                <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                    {status.error}
                </div>
            )}
            <div style={{ fontSize: '11px', opacity: 0.8 }}>
                {status.info}
            </div>
            <button
                onClick={() => setIsVisible(false)}
                style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'transparent',
                    border: '1px solid white',
                    color: 'white',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                X
            </button>
        </div>
    );
};

export default EnvCheck;
