/**
 * Folder Controller - CRUD operations for deck folders
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get all folders for the authenticated user
 */
exports.getFolders = async (req, res) => {
    try {
        const user_id = req.user.id;

        const { data, error } = await supabase
            .from('deck_folders')
            .select('*')
            .eq('user_id', user_id)
            .order('name', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching folders:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Create a new folder
 */
exports.createFolder = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { name, color } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Folder name is required' });
        }

        const { data, error } = await supabase
            .from('deck_folders')
            .insert([{
                user_id,
                name,
                color: color || '#C52222'
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update a folder (rename, change color)
 */
exports.updateFolder = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        const { name, color } = req.body;

        const updates = {};
        if (name) updates.name = name;
        if (color) updates.color = color;

        const { data, error } = await supabase
            .from('deck_folders')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user_id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Folder not found' });

        res.json(data);
    } catch (error) {
        console.error('Error updating folder:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Delete a folder (decks inside become unassigned)
 */
exports.deleteFolder = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const { error } = await supabase
            .from('deck_folders')
            .delete()
            .eq('id', id)
            .eq('user_id', user_id);

        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Assign a deck to a folder (or remove from folder if folder_id is null)
 */
exports.assignDeckToFolder = async (req, res) => {
    try {
        const { deckId } = req.params;
        const { folder_id } = req.body; // null to unassign
        const user_id = req.user.id;

        const { data, error } = await supabase
            .from('decks')
            .update({ folder_id })
            .eq('id', deckId)
            .eq('user_id', user_id)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Deck not found' });

        res.json(data);
    } catch (error) {
        console.error('Error assigning deck to folder:', error);
        res.status(500).json({ error: error.message });
    }
};
