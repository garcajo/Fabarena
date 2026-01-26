
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.createDeck = async (req, res) => {
    try {
        const { name, format, hero, equipment, mainDeck, sideboard, maybeboard, visibility, username } = req.body;
        const user_id = req.user.id; // From authMiddleware

        console.log(`[createDeck] Attempting to create deck for user_id: ${user_id}`);

        if (!name || !format) {
            return res.status(400).json({ error: 'Name and format are required' });
        }

        // Fetch username from profiles to ensure accuracy
        let ownerUsername = username;
        if (!ownerUsername || ownerUsername === 'Unknown') {
            const { data: profile } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', user_id)
                .single();
            if (profile) ownerUsername = profile.username;
        }

        const { data, error } = await supabase
            .from('decks')
            .insert([{
                user_id,
                name,
                format,
                hero,
                visibility: visibility || 'private',
                username: ownerUsername || 'Unknown', // Use fetched username
                equipment: equipment || [],
                main_deck: mainDeck || [],
                sideboard: sideboard || [],
                maybeboard: maybeboard || [],
                guide: req.body.guide || []
            }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Error creating deck:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getDecks = async (req, res) => {
    try {
        const user_id = req.user ? req.user.id : null;
        const scope = req.query.scope; // 'public' or 'mine'

        console.log(`[getDecks] Fetching decks. Scope: ${scope}, User: ${user_id}`);

        let query = supabase
            .from('decks')
            .select('*')
            .order('updated_at', { ascending: false });

        if (scope === 'mine' && user_id) {
            // ONLY my decks
            query = query.eq('user_id', user_id);
        } else if (scope === 'public') {
            // ONLY public decks
            query = query.eq('visibility', 'public');
        } else {
            // Default / Fallback: If logged in, mine + public. If not, only public.
            if (user_id) {
                query = query.or(`user_id.eq.${user_id},visibility.eq.public`);
            } else {
                query = query.eq('visibility', 'public');
            }
        }

        // Apply filters
        const { hero, username, sortOrder } = req.query;

        if (hero) {
            // Hero is JSONB, so we might need to check the name field inside it?
            // Or if it's stored as string.
            // Based on previous code: "hero" column is JSONB? 
            // Let's check: createDeck inserts `hero` object.
            // If it's JSONB, `hero->>name` should work. 
            // If it's Text (previous versions?), `hero` woud be exact match?
            // Let's assume JSONB based on usage. 
            // BUT wait, `check_latest_usernames` showed deck 'prueba' has content.
            // Let's rely on ILIKE on the text representation if possible, or arrow operator.
            // Supabase JS: .ilike('hero->>name', `%${hero}%`) 
            // Note: `->>` gets field as text.
            query = query.ilike('hero->>name', `%${hero}%`);
        }

        if (username) {
            query = query.ilike('username', `%${username}%`);
        }

        if (req.query.name) {
            query = query.ilike('name', `%${req.query.name}%`);
        }

        if (sortOrder === 'oldest') {
            query = query.order('created_at', { ascending: true });
        } else if (sortOrder === 'likes') {
            // Sort by likes_count (descending)
            query = query.order('likes_count', { ascending: false });
        } else {
            // Default newest
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching decks:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getDeckById = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user ? req.user.id : null;

        const { data, error } = await supabase
            .from('decks')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Deck not found' });

        // Check permissions
        // Check permissions
        const isOwner = !!(user_id && data.user_id === user_id);
        const isPublic = data.visibility === 'public';

        if (!isOwner && !isPublic) {
            return res.status(403).json({ error: 'Access denied: Private deck' });
        }

        // Add metadata for frontend to know if it's read-only
        const responseData = { ...data, isOwner };
        res.json(responseData);
    } catch (error) {
        console.error('Error fetching deck:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateDeck = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        const updates = req.body;

        const safeUpdates = {
            updated_at: new Date().toISOString()
        };
        if (updates.name) safeUpdates.name = updates.name;
        if (updates.format) safeUpdates.format = updates.format;
        if (updates.hero) safeUpdates.hero = updates.hero;
        if (updates.visibility) safeUpdates.visibility = updates.visibility;
        if (updates.equipment) safeUpdates.equipment = updates.equipment;
        if (updates.mainDeck) safeUpdates.main_deck = updates.mainDeck;
        if (updates.sideboard) safeUpdates.sideboard = updates.sideboard;
        if (updates.maybeboard) safeUpdates.maybeboard = updates.maybeboard;
        console.log(`[updateDeck] Updating deck ${id}. Updates received:`, Object.keys(updates));

        if (updates.guide) {
            console.log(`[updateDeck] Guide update found. Length: ${Array.isArray(updates.guide) ? updates.guide.length : 'Not Array'}`);
            safeUpdates.guide = updates.guide;
        }

        const { data, error } = await supabase
            .from('decks')
            .update(safeUpdates)
            .eq('id', id)
            .eq('user_id', user_id)
            .select();

        if (error) {
            console.error('[updateDeck] Supabase Error:', error);
            throw error;
        }
        console.log('[updateDeck] Update successful. Rows affected:', data?.length);
        if (data && data.length > 0) {
            console.log('[updateDeck] Guide in DB:', data[0].guide ? 'Present' : 'NULL');
        }

        if (data.length === 0) return res.status(404).json({ error: 'Deck not found or unauthorized' });

        res.json(data[0]);
    } catch (error) {
        console.error('Error updating deck:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteDeck = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const { error } = await supabase
            .from('decks')
            .delete()
            .eq('id', id)
            .eq('user_id', user_id);

        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting deck:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Toggle like on a deck (add if not exists, remove if exists)
 * Requires authentication
 */
exports.toggleLike = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        // Check if user already liked this deck
        const { data: existingLike, error: checkError } = await supabase
            .from('deck_likes')
            .select('id')
            .eq('user_id', user_id)
            .eq('deck_id', id)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            // PGRST116 = not found, which is expected if no like exists
            throw checkError;
        }

        if (existingLike) {
            // Unlike: Remove the existing like
            const { error: deleteError } = await supabase
                .from('deck_likes')
                .delete()
                .eq('id', existingLike.id);

            if (deleteError) throw deleteError;

            res.json({ liked: false, message: 'Like removed' });
        } else {
            // Like: Add new like
            const { error: insertError } = await supabase
                .from('deck_likes')
                .insert([{ user_id, deck_id: id }]);

            if (insertError) throw insertError;

            res.json({ liked: true, message: 'Like added' });
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get like status for a deck
 * Returns count and whether current user has liked (if authenticated)
 */
exports.getLikeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user ? req.user.id : null;

        // Get total like count
        const { count, error: countError } = await supabase
            .from('deck_likes')
            .select('*', { count: 'exact', head: true })
            .eq('deck_id', id);

        if (countError) throw countError;

        // Check if current user has liked (if logged in)
        let userHasLiked = false;
        if (user_id) {
            const { data: userLike, error: userError } = await supabase
                .from('deck_likes')
                .select('id')
                .eq('user_id', user_id)
                .eq('deck_id', id)
                .single();

            if (userError && userError.code !== 'PGRST116') {
                throw userError;
            }
            userHasLiked = !!userLike;
        }

        res.json({
            count: count || 0,
            userHasLiked
        });
    } catch (error) {
        console.error('Error getting like status:', error);
        res.status(500).json({ error: error.message });
    }
};
