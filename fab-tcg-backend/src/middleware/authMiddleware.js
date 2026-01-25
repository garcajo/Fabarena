
const supabase = require('../config/supabase');

/**
 * Middleware to verify Supabase JWT.
 * Expects Authorization: Bearer <token>
 */
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.warn('Auth Middleware: Missing Authorization header');
            return res.status(401).json({ error: 'Missing Authorization header' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            console.warn('Auth Middleware: Invalid Authorization header format');
            return res.status(401).json({ error: 'Invalid Authorization header format' });
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error('Auth Middleware: Invalid or expired token', error);
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = authMiddleware;
