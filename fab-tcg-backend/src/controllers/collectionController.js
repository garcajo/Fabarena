
const supabase = require('../config/supabase');

/**
 * Get user's collection with card details
 * GET /api/collection
 */
const getCollection = async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware
        const { page = 0, pageSize = 50, search = '', pitch, cost, set, rarity, class: heroClass } = req.query;

        // Start building query on user_collection joined with cards
        // Note: Supabase JS join syntax is: select('*, cards(*)')
        let query = supabase
            .from('user_collection')
            .select(`
                quantity,
                is_foil,
                card:cards (
                    id,
                    name,
                    pitch,
                    costo,
                    poder,
                    defensa,
                    clase,
                    tipo,
                    rareza,
                    set_code,
                    imagen
                )
            `, { count: 'exact' })
            .eq('user_id', userId);

        // Apply filters
        // Since we are filtering on the JOINED table 'cards', we need to use the foreign table notation !inner if we want to filter rows based on the child.
        // However, Supabase syntax for deep filtering can be tricky.
        // The pattern `cards!inner(name)` enforces inner join so we only get collection items where the card matches criteria.

        // Base select with inner join capability for filtering
        // We reconstruct the select if filters are present to ensure !inner is used where needed
        // Actually, simpler to just start with !inner if we plan to filter, but let's try standard filtering on the relationship.

        // Supabase filtering on foreign tables: .eq('cards.set_code', 'ARC') works if specified correctly? 
        // No, usually it's .ilike('cards.name', '%foo%') but that requires the embedding resource to filter.
        // Let's use the !inner syntax in the select for precise filtering.

        let selectString = `
            quantity,
            is_foil,
            card:cards!inner (
                id,
                name,
                pitch,
                costo,
                poder,
                defensa,
                clase,
                tipo,
                rareza,
                set_code,
                imagen
            )
        `;

        query = supabase.from('user_collection').select(selectString, { count: 'exact' }).eq('user_id', userId);

        if (search) {
            query = query.ilike('cards.name', `%${search}%`);
        }

        if (pitch) {
            query = query.eq('cards.pitch', pitch);
        }

        if (cost) {
            query = query.eq('cards.costo', cost);
        }

        if (set) {
            query = query.eq('cards.set_code', set);
        }

        if (rarity) {
            query = query.eq('cards.rareza', rarity);
        }

        if (heroClass) {
            query = query.ilike('cards.clase', `%${heroClass}%`);
        }

        // Pagination
        const from = page * pageSize;
        const to = from + pageSize - 1;

        query = query.range(from, to).order('created_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) throw error;

        // Flatten the structure for frontend convenience if needed, or send as is
        // Current: [{ quantity: 1, card: { name: '...' } }]
        // Frontend likely expects: [{ ...card, quantity: 1 }]

        const formattedData = data.map(item => ({
            ...item.card,
            quantity: item.quantity,
            is_foil: item.is_foil,
            collection_id: item.id // ID of the collection entry
        }));

        res.json({
            data: formattedData,
            count,
            page: parseInt(page),
            pageSize: parseInt(pageSize)
        });

    } catch (error) {
        console.error('Error fetching collection:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Add or Increment card in collection
 * POST /api/collection/add
 * Body: { cardId, quantity = 1, isFoil = false }
 */
const addCard = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cardId, quantity = 1, isFoil = false } = req.body;

        if (!cardId) {
            return res.status(400).json({ error: 'Card ID is required' });
        }

        // Check if exists to upsert (increment)
        const { data: existing } = await supabase
            .from('user_collection')
            .select('id, quantity')
            .eq('user_id', userId)
            .eq('card_id', cardId)
            .eq('is_foil', isFoil)
            .single();

        let result;
        if (existing) {
            const newQuantity = existing.quantity + quantity;
            const { data, error } = await supabase
                .from('user_collection')
                .update({ quantity: newQuantity })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;
            result = data;
        } else {
            const { data, error } = await supabase
                .from('user_collection')
                .insert({
                    user_id: userId,
                    card_id: cardId,
                    quantity: quantity,
                    is_foil: isFoil
                })
                .select()
                .single();

            if (error) throw error;
            result = data;
        }

        res.json(result);

    } catch (error) {
        console.error('Error adding to collection:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Remove or Decrement card in collection
 * POST /api/collection/remove
 * Body: { cardId, quantity = 1, removeAll = false, isFoil = false }
 */
const removeCard = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cardId, quantity = 1, removeAll = false, isFoil = false } = req.body;

        if (!cardId) {
            return res.status(400).json({ error: 'Card ID is required' });
        }

        const { data: existing } = await supabase
            .from('user_collection')
            .select('id, quantity')
            .eq('user_id', userId)
            .eq('card_id', cardId)
            .eq('is_foil', isFoil)
            .single();

        if (!existing) {
            return res.status(404).json({ error: 'Card not in collection' });
        }

        let result;
        if (removeAll || existing.quantity <= quantity) {
            // Delete entry
            const { error } = await supabase
                .from('user_collection')
                .delete()
                .eq('id', existing.id);

            if (error) throw error;
            result = { message: 'Card removed from collection', id: existing.id };
        } else {
            // Decrement
            const newQuantity = existing.quantity - quantity;
            const { data, error } = await supabase
                .from('user_collection')
                .update({ quantity: newQuantity })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;
            result = data;
        }

        res.json(result);

    } catch (error) {
        console.error('Error removing from collection:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getCollection,
    addCard,
    removeCard
};
