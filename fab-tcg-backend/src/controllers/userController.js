const supabase = require('../config/supabase');

/**
 * Deletes the authenticated user's account.
 * Uses Supabase Admin API (via service role key in config) to delete user from auth.users.
 */
const deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id; // From authMiddleware

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Delete user from Auth (this cascades to public tables if foreign keys are set up correctly)
        // Note: supabase client initialized in config/supabase.js MUST use SERVICE_KEY for this to work
        const { error } = await supabase.auth.admin.deleteUser(userId);

        if (error) {
            console.error('Error deleting user:', error);
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error('Delete account server error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    deleteAccount
};
