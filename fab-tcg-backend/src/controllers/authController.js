const supabase = require('../config/supabase');

/**
 * Registers a new user.
 * @param {Object} req - The request object.
 * @param {Object} req.body - The request body containing email, password, and username.
 * @param {Object} res - The response object.
 */
const register = async (req, res) => {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
        return res.status(400).json({ error: 'Email, password, and username are required' });
    }

    try {
        // Enforce unique username
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', username)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }

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
            return res.status(400).json({ error: error.message });
        }

        return res.status(201).json({
            message: 'User registered successfully',
            user: data.user,
        });
    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Logs in a user.
 * @param {Object} req - The request object.
 * @param {Object} req.body - The request body containing email and password.
 * @param {Object} res - The response object.
 */
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return res.status(401).json({ error: error.message });
        }

        return res.status(200).json({
            message: 'Login successful',
            user: data.user,
            session: data.session,
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    register,
    login
};
