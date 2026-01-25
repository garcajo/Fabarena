require('dotenv').config();
const supabase = require('./src/config/supabase');

const createAdmin = async () => {
    const email = 'cabjosue16@gmail.com';

    const password = 'Levi007123*';
    const username = 'Qrtzx';

    console.log(`Creating user ${username} (${email})...`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username,
            },
        },
    });

    if (error) {
        console.error('Error creating user:', error.message);
    } else {
        console.log('User created successfully:', data.user);
    }
};

createAdmin();
