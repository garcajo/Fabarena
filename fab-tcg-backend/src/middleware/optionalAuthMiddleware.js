
const supabase = require('../config/supabase');

/**
 * Middleware to OPTIONALLY verify Supabase JWT.
 * If token is present and valid, attaches user to req.user.
 * If token is missing or invalid, req.user remains undefined/null, but request proceeds.
 */
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            // No token, proceed as guest
            req.user = null;
            return next();
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            req.user = null;
            return next();
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            // Invalid token, proceed as guest (or should we warn?)
            // For optional auth, treating invalid token as guest is usually safer for "public" views
            // but might be confusing if user thought they were logged in.
            // Given the requirement, let's treat as guest.
            console.warn('Optional Auth: Invalid token, proceeding as guest');
            req.user = null;
        } else {
            req.user = user;
        }

        next();
    } catch (error) {
        console.error('Optional Auth Middleware Error:', error);
        // Fail open or closed? For optional, fail open (guest) is often acceptable, but let's log.
        req.user = null;
        next();
    }
};

module.exports = optionalAuthMiddleware;
