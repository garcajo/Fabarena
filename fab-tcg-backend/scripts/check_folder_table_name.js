
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { Client } = require('pg');

const checkTables = async () => {
    const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('folders', 'deck_folders');
        `);
        console.log('Existing tables:', res.rows.map(r => r.table_name));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
};

checkTables();
