import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const TestDB = () => {
    const [result, setResult] = useState('Testing...');
    const [logs, setLogs] = useState([]);

    const addLog = (msg) => setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1]} - ${msg}`]);

    useEffect(() => {
        const runTest = async () => {
            const url = import.meta.env.VITE_SUPABASE_URL;
            const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

            addLog(`URL Configured: ${url ? 'YES' : 'NO'} (${url ? url.substring(0, 15) + '...' : ''})`);
            addLog(`Key Configured: ${key ? 'YES' : 'NO'}`);

            if (!url || !key) {
                setResult('FAILED: Missing Variables');
                return;
            }

            try {
                addLog('Attempting to fetch 1 card...');
                // Use count='exact' and head=false to get data and count
                const { data, error, count } = await supabase
                    .from('cards')
                    .select('id, name, set_code', { count: 'exact' })
                    .limit(5);

                if (error) {
                    addLog(`ERROR: ${error.message}`);
                    addLog(`Details: ${JSON.stringify(error)}`);
                    setResult('FAILED: Supabase Error');
                } else {
                    addLog(`SUCCESS! Found ${count} total cards.`);
                    addLog(`Returned ${data.length} rows.`);
                    if (data.length > 0) {
                        addLog(`Sample: ${data[0].name} (${data[0].set_code})`);
                        setResult('PASSED');
                    } else {
                        addLog('WARNING: Returned 0 rows. RLS might be blocking reads?');
                        setResult('PASSED (Empty)');
                    }
                }
            } catch (err) {
                addLog(`EXCEPTION: ${err.message}`);
                setResult('CRASHED');
            }
        };

        runTest();
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace', background: '#222', color: '#eee', minHeight: '100vh' }}>
            <h1>Supabase Connection Test</h1>
            <h2 style={{ color: result.includes('PASSED') ? '#4caf50' : '#f44336' }}>Result: {result}</h2>

            <div style={{ background: '#333', padding: '15px', borderRadius: '5px', marginTop: '20px' }}>
                <h3>Logs:</h3>
                {logs.map((log, i) => (
                    <div key={i} style={{ borderBottom: '1px solid #444', padding: '5px 0' }}>{log}</div>
                ))}
            </div>

            <div style={{ marginTop: '20px' }}>
                <button onClick={() => window.location.reload()} style={{ padding: '10px 20px' }}>Retry Test</button>
                <a href="/" style={{ marginLeft: '10px', color: '#646cff' }}>Back to Home</a>
            </div>
        </div>
    );
};

export default TestDB;
