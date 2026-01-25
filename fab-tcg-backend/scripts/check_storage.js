require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkStorage() {
    console.log('Checking storage buckets...');
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }

    const avatarBucket = buckets.find(b => b.name === 'avatars');

    if (avatarBucket) {
        console.log('✅ "avatars" bucket exists.');
    } else {
        console.log('⚠️ "avatars" bucket does NOT exist. Attempting to create...');
        const { data, error: createError } = await supabase.storage.createBucket('avatars', {
            public: true,
            fileSizeLimit: 1024 * 1024 * 2, // 2MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif']
        });

        if (createError) {
            console.error('❌ Failed to create bucket:', createError);
        } else {
            console.log('✅ "avatars" bucket created successfully.');
        }
    }
}

checkStorage();
