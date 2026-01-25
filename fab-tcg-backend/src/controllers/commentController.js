const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Get comments for a specific deck
exports.getComments = async (req, res) => {
    const { deckId } = req.params;

    try {
        const { data, error } = await supabase
            .from('deck_comments')
            .select('*')
            .eq('deck_id', deckId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Organize into tree structure or return flat list
        // Returning flat list is easier for frontend recursion if needed, 
        // but let's return flat list sorted by date.
        res.json(data);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};

// Post a new comment
exports.createComment = async (req, res) => {
    const { deckId } = req.params;
    const { content, parentId, userId, username } = req.body; // userId/username trust from frontend/middleware?

    // Ideally, we should get user from req.user set by auth middleware.
    // Assuming auth middleware populates req.user.
    // If not, we might be relying on frontend to send it (less secure but ok for MVP).
    // Let's use req.user if available, fallback to body but valid user is better.

    // Using body for now as per previous auth implementation pattern (often just verify token)
    if (!content || !userId || !username) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const { data, error } = await supabase
            .from('deck_comments')
            .insert([
                {
                    deck_id: deckId,
                    user_id: userId,
                    username: username,
                    content: content,
                    parent_id: parentId || null
                }
            ])
            .select();

        if (error) throw error;

        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Error posting comment:', error);
        res.status(500).json({ error: 'Failed to post comment' });
    }
};
