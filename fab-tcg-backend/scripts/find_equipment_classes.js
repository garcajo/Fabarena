require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const getAllEquipmentClasses = async () => {
    const { data } = await supabase
        .from('cards')
        .select('tipo')
        .or('tipo.ilike.%Equipment%,tipo.ilike.%Weapon%');

    const classWords = new Set();

    data.forEach(card => {
        // Extract class part before "Equipment" or "Weapon"
        const match = card.tipo.match(/^(.+?)\s+(Equipment|Weapon)/i);
        if (match) {
            const classText = match[1].trim();
            if (classText) {
                // Split into words and add each one
                classText.split(/\s+/).forEach(word => {
                    if (word.length > 0) {
                        classWords.add(word.toLowerCase());
                    }
                });
            }
        }
    });

    const sortedClasses = Array.from(classWords).sort();
    console.log('All equipment class words found:');
    console.log(sortedClasses.join(', '));
    console.log('\nTotal unique class words:', sortedClasses.length);
    console.log('\nAs array for code:');
    console.log(JSON.stringify(sortedClasses));
};

getAllEquipmentClasses().catch(console.error);
