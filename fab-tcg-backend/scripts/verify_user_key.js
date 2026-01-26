const { createClient } = require('@supabase/supabase-js');

// User provided key
const KEY_TO_TEST = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2Z2NoZWd6Y2ljbnd3c3J6YWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDc0OTUsImV4cCI6MjA4MzI4MzQ5NX0.UZ8xLmqjjc1FlWopFqVcQQNbX2z8BBWlivhKlcSEoys";
const URL = "https://jvgchegzcicnwwsrzahz.supabase.co";

console.log("Testing Key:", KEY_TO_TEST.substring(0, 20) + "...");

const supabase = createClient(URL, KEY_TO_TEST);

async function verify() {
    try {
        const { data, error, count } = await supabase
            .from('cards')
            .select('name', { count: 'exact' })
            .limit(1);

        if (error) {
            console.error("❌ KEY FAILED:", error.message);
        } else {
            console.log("✅ KEY WORKING PERFECTLY!");
            console.log(`📊 Access to ${count} cards confirmed.`);
            console.log(`🃏 Sample read: "${data[0].name}"`);
        }
    } catch (e) {
        console.error("❌ CRASH:", e.message);
    }
}

verify();
