/**
 * Servicio para comunicarse directamente con Supabase.
 * Reemplaza la conexión al backend Express API.
 */

import { supabase } from './supabase';

/**
 * Manejo centralizado de errores de Supabase
 */
const handleSupabaseError = (error) => {
    console.error('Supabase Error:', error);
    throw new Error(error.message || 'Error en la operación de base de datos');
};

/**
 * Servicio de autenticación
 */
export const AuthService = {
    /**
     * Registra un nuevo usuario
     * @param {Object} userData - Datos del usuario {username, email, password}
     */
    async register(userData) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        username: userData.username,
                        full_name: userData.username // Usamos username como full_name por defecto
                    }
                }
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    /**
     * Elimina la cuenta del usuario actual
     * Nota: Esto requiere que el usuario esté autenticado.
     * Supabase no permite autodelete por defecto sin función admin o política específica.
     * Usaremos una RPC o llamada directa si está permitido.
     */
    async updateProfile(profileData) {
        try {
            const { data, error } = await supabase.auth.updateUser({
                data: profileData
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    },

    async updateAvatar(file) {
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error('User not authenticated');

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Update User Metadata
            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateError) throw updateError;

            return publicUrl;
        } catch (error) {
            console.error('Avatar upload error:', error);
            throw error;
        }
    },

    async deleteAccount() {
        try {
            // Nota: Supabase Auth clientside no tiene deleteUser() por seguridad.
            // Se debe hacer vía RPC o función edge si se quiere permitir "Self Delete".
            // Por ahora, retornamos error no implementado o simulamos logout.
            console.warn("Self-deletion not directly supported by Supabase Client for security.");
            // Una opción es marcar una flag en user_metadata 'deleted: true' y bloquear acceso via RLS.
            // O usar una Edge Function 'admin-delete-user'.

            // Fallback for now: Logout
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Delete account error:', error);
            throw error;
        }
    },

    /**
     * Inicia sesión
     * @param {Object} credentials - {email, password}
     */
    async login(credentials) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password,
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    /**
     * Cierra sesión
     */
    async logout() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    }
};

/**
 * Sets de borde blanco a filtrar por defecto
 */
const WHITE_BORDER_SETS = ['1HP'];

/**
 * Servicio de cartas
 */
export const CardService = {
    /**
     * Obtiene todas las cartas con opciones de paginación y filtros
     */
    async getCards(options = {}) {
        const {
            page = 0,
            pageSize = 20,
            search = '',
            clase = '',
            set = '',
            rareza = '',
            pitch = '',
            costo = '',
            type = '',
            includeWhiteBorder = false
        } = options;

        try {
            let query = supabase
                .from('cards')
                .select('*', { count: 'exact' });

            // Apply filters
            if (!includeWhiteBorder) {
                query = query.not('set_code', 'in', `(${WHITE_BORDER_SETS.join(',')})`);
            }

            if (search) {
                query = query.ilike('name', `%${search}%`);
            }

            if (clase) {
                if (Array.isArray(clase)) {
                    const orQuery = clase.map(c => `clase.ilike.%${c}%`).join(',');
                    query = query.or(orQuery);
                } else {
                    query = query.ilike('clase', `%${clase}%`);
                }
            }

            if (set) {
                if (Array.isArray(set)) {
                    query = query.in('set_code', set);
                } else {
                    query = query.eq('set_code', set);
                }
            }

            if (rareza) {
                if (Array.isArray(rareza)) {
                    query = query.in('rareza', rareza);
                } else {
                    query = query.eq('rareza', rareza);
                }
            }

            if (pitch) {
                if (Array.isArray(pitch)) {
                    const pitchInts = pitch.map(p => parseInt(p, 10));
                    query = query.in('pitch', pitchInts);
                } else {
                    query = query.eq('pitch', parseInt(pitch, 10));
                }
            }

            if (costo) {
                if (Array.isArray(costo)) {
                    query = query.in('costo', costo);
                } else {
                    query = query.eq('costo', costo);
                }
            }

            if (type) {
                if (Array.isArray(type)) {
                    const orQuery = type.map(t => `tipo.ilike.%${t}%`).join(',');
                    query = query.or(orQuery);
                } else {
                    query = query.ilike('tipo', `%${type}%`);
                }
            }

            // Pagination
            const from = page * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);

            // Order
            query = query.order('name', { ascending: true });

            const { data, error, count } = await query;

            if (error) throw error;

            return {
                data,
                count,
                page,
                pageSize,
                totalPages: Math.ceil(count / pageSize),
                error: null
            };
        } catch (error) {
            console.error('Error fetching cards:', error);
            return { data: null, count: 0, error: error.message };
        }
    },

    /**
     * Get all versions of a card by name
     */
    async getCardsByName(name) {
        try {
            const { data, error } = await supabase
                .from('cards')
                .select('*')
                .ilike('name', name); // Use exact match or ilike? Frontend logic assumed loosely.

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching card versions:', error);
            return [];
        }
    },

    /**
     * Obtiene una carta por su ID
     */
    async getCardById(id) {
        try {
            const { data, error } = await supabase
                .from('cards')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching card:', error);
            return { data: null, error: error.message };
        }
    },

    /**
     * Get Living Legend data
     * For now, returning hardcoded or scraped data via separate serverless function if needed.
     * Reverting to fetching from Vercel function /api/living-legend
     */
    async getLivingLegendData() {
        try {
            const response = await fetch('/api/living-legend');
            if (!response.ok) throw new Error('Failed to fetch LL data');
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            // Fallback or ignore for now as we haven't implemented the function yet
            console.warn("LL data fetch failed (function not implemented?)", error);
            return { data: [], error: null };
        }
    },

    /**
     * Get Banned Cards
     */
    async getBannedCards() {
        try {
            const response = await fetch('/api/bans');
            if (!response.ok) throw new Error('Failed to fetch Banned data');
            const data = await response.json();
            return { data, error: null };
        } catch (error) {
            console.warn("Bans data fetch failed", error);
            return { data: {}, error: null };
        }
    },

    /**
     * Obtiene las clases disponibles
     */
    async getClasses() {
        try {
            const { data, error } = await supabase
                .from('cards')
                .select('clase')
                .not('clase', 'is', null);

            if (error) throw error;

            const classes = [...new Set(data.map(c => c.clase))].sort();
            return { data: classes, error: null };
        } catch (error) {
            return { data: null, error: error.message };
        }
    },

    /**
     * Obtiene los sets disponibles
     */
    async getSets() {
        try {
            const { data, error } = await supabase
                .from('cards')
                .select('set_code')
                .not('set_code', 'is', null);

            if (error) throw error;

            const sets = [...new Set(data.map(c => c.set_code))].sort();
            return { data: sets, error: null };
        } catch (error) {
            return { data: null, error: error.message };
        }
    },

    /**
     * Obtiene cartas por lista de nombres
     */
    async getCardsByNames(names) {
        try {
            // "name.ilike.A,name.ilike.B"
            const orFilter = names.map(name => `name.ilike."${name.replace(/"/g, '')}"`).join(',');

            const { data, error } = await supabase
                .from('cards')
                .select('id, name, pitch, costo, tipo, imagen, set_code, clase, card_type, power, defense, texto')
                .or(orFilter)
                .not('set_code', 'in', `(${WHITE_BORDER_SETS.join(',')})`);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return { data: null, error: error.message };
        }
    }
};

/**
 * Servicio para gestión de mazos
 */
export const DeckService = {
    async getDecks(scope = '', filters = {}) {
        try {
            let query = supabase
                .from('decks')
                .select(`
                    *,
                    user:users(username, avatar_url)
                `, { count: 'exact' });

            if (scope === 'user') {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) query = query.eq('user_id', user.id);
            } else if (scope === 'public') {
                query = query.eq('visibility', 'public');
            }

            if (filters.hero) query = query.ilike('hero', `%${filters.hero}%`);
            if (filters.username) {
                // Join filtering is trickier in Supabase JS standard syntax
                // But we can filter on the joined relation if configured?
                // Or perform separate lookup. For now, skip complex join filter.
            }

            if (filters.sort === 'oldest') {
                query = query.order('created_at', { ascending: true });
            } else {
                query = query.order('created_at', { ascending: false });
            }

            const { data, error, count } = await query;
            if (error) throw error;
            return { data, count };
        } catch (error) {
            console.error('Error fetching decks:', error);
            throw error;
        }
    },

    async getDeckById(id) {
        try {
            // Fetch deck header
            const { data: deck, error } = await supabase
                .from('decks')
                .select(`
                    *,
                    user:users(username, avatar_url)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            // Fetch deck cards
            const { data: cards, error: cardsError } = await supabase
                .from('deck_cards')
                .select('*, card:cards(*)')
                .eq('deck_id', id);

            if (cardsError) throw cardsError;

            // Combine
            return {
                ...deck, cards: cards.map(c => ({
                    ...c.card,
                    quantity: c.quantity,
                    is_sideboard: c.is_sideboard,
                    section: c.section // if supported
                }))
            };
        } catch (error) {
            console.error('Error fetching deck:', error);
            throw error;
        }
    },

    async createDeck(deckData) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Must be logged in');

            // 1. Insert Deck
            const { data: deck, error } = await supabase
                .from('decks')
                .insert({
                    name: deckData.name,
                    hero: deckData.hero,
                    format: deckData.format,
                    description: deckData.description,
                    visibility: deckData.visibility || 'public',
                    user_id: user.id
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Insert Cards
            if (deckData.cards && deckData.cards.length > 0) {
                const deckCards = deckData.cards.map(c => ({
                    deck_id: deck.id,
                    card_id: c.id,
                    quantity: c.quantity || 1,
                    is_sideboard: c.is_sideboard || false,
                    section: c.section || 'main'
                }));

                const { error: cardsError } = await supabase
                    .from('deck_cards')
                    .insert(deckCards);

                if (cardsError) throw cardsError;
            }

            return deck;
        } catch (error) {
            console.error('Error creating deck:', error);
            throw error;
        }
    },

    async updateDeck(id, deckData) {
        try {
            // 1. Update Deck Details
            const { error } = await supabase
                .from('decks')
                .update({
                    name: deckData.name,
                    hero: deckData.hero,
                    format: deckData.format,
                    description: deckData.description,
                    visibility: deckData.visibility
                })
                .eq('id', id);

            if (error) throw error;

            // 2. Update Cards (easiest strategy: delete all and re-insert)
            // Ideally use upsert or diffing, but for MVP re-insert is safer for consistency.
            if (deckData.cards) {
                // Delete existing
                await supabase.from('deck_cards').delete().eq('deck_id', id);

                // Insert new
                if (deckData.cards.length > 0) {
                    const deckCards = deckData.cards.map(c => ({
                        deck_id: id,
                        card_id: c.id,
                        quantity: c.quantity || 1,
                        is_sideboard: c.is_sideboard || false,
                        section: c.section || 'main'
                    }));

                    const { error: cardsError } = await supabase
                        .from('deck_cards')
                        .insert(deckCards);

                    if (cardsError) throw cardsError;
                }
            }

            return { id, ...deckData };
        } catch (error) {
            console.error('Error updating deck:', error);
            throw error;
        }
    },

    async deleteDeck(id) {
        try {
            const { error } = await supabase
                .from('decks')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            throw error;
        }
    },

    async getDeckComments(deckId) {
        try {
            const { data, error } = await supabase
                .from('comments')
                .select('*, user:users(username, avatar_url)')
                .eq('deck_id', deckId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            throw error;
        }
    },

    async postDeckComment(deckId, commentData) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Must be logged in');

            const { data, error } = await supabase
                .from('comments')
                .insert({
                    deck_id: deckId,
                    user_id: user.id,
                    content: commentData.content,
                    parent_id: commentData.parentId || null
                })
                .select('*, user:users(username, avatar_url)')
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            throw error;
        }
    },

    async getLikeStatus(deckId) {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Get count
            const { count, error } = await supabase
                .from('deck_likes')
                .select('*', { count: 'exact', head: true })
                .eq('deck_id', deckId);

            if (error) throw error;

            let liked = false;
            if (user) {
                const { data } = await supabase
                    .from('deck_likes')
                    .select('id')
                    .eq('deck_id', deckId)
                    .eq('user_id', user.id)
                    .single();
                liked = !!data;
            }

            return { likes: count, liked };
        } catch (error) {
            throw error;
        }
    },

    async toggleLike(deckId) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Must be logged in');

            // Check if exists
            const { data: existing } = await supabase
                .from('deck_likes')
                .select('id')
                .eq('deck_id', deckId)
                .eq('user_id', user.id)
                .single();

            if (existing) {
                // Unlike
                await supabase
                    .from('deck_likes')
                    .delete()
                    .eq('id', existing.id);
                return { liked: false };
            } else {
                // Like
                await supabase
                    .from('deck_likes')
                    .insert({
                        deck_id: deckId,
                        user_id: user.id
                    });
                return { liked: true };
            }
        } catch (error) {
            throw error;
        }
    }
};

/**
 * Servicio para colección
 */
export const CollectionService = {
    async getCollection(filters = {}) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Must be logged immediately');

            let query = supabase
                .from('collection')
                .select('*, card:cards(*)')
                .eq('user_id', user.id);

            // Filters implementation for collection is tricky because filtering applies to the CARD not the collection entry usually.
            // Supabase allows filtering on joined tables: card:cards!inner(...)

            // Simplified for now: Fetch all and filter in memory if small, or apply inner join filter.
            // Let's assume user collection is not massive (<1000 unique cards).

            const { data, error } = await query;
            if (error) throw error;

            // Map to flat structure expected by frontend
            const flattened = data.map(item => ({
                ...item.card,
                collection_id: item.id,
                quantity: item.quantity,
                is_foil: item.is_foil
            }));

            // In-memory filter for now (safer than complex queries without verifying schema)
            let result = flattened;
            if (filters.search) result = result.filter(c => c.name.toLowerCase().includes(filters.search.toLowerCase()));

            return { data: result, count: result.length };
        } catch (error) {
            console.error('Error fetching collection:', error);
            throw error;
        }
    },

    async addCard(cardId, quantity = 1, isFoil = false) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Must be logged in');

            // Upsert mechanism
            // Check if exists
            const { data: existing } = await supabase
                .from('collection')
                .select('*')
                .eq('user_id', user.id)
                .eq('card_id', cardId)
                .eq('is_foil', isFoil)
                .single();

            if (existing) {
                const { error } = await supabase
                    .from('collection')
                    .update({ quantity: existing.quantity + quantity })
                    .eq('id', existing.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('collection')
                    .insert({
                        user_id: user.id,
                        card_id: cardId,
                        quantity,
                        is_foil: isFoil
                    });
                if (error) throw error;
            }
            return true;
        } catch (error) {
            throw error;
        }
    },

    async removeCard(cardId, quantity = 1, removeAll = false, isFoil = false) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Must be logged in');

            const { data: existing } = await supabase
                .from('collection')
                .select('*')
                .eq('user_id', user.id)
                .eq('card_id', cardId)
                .eq('is_foil', isFoil)
                .single();

            if (!existing) return;

            if (removeAll || existing.quantity <= quantity) {
                await supabase.from('collection').delete().eq('id', existing.id);
            } else {
                await supabase.from('collection').update({ quantity: existing.quantity - quantity }).eq('id', existing.id);
            }
            return true;
        } catch (error) {
            throw error;
        }
    }
};

/**
 * Servicio para carpetas (Folders)
 */
export const FolderService = {
    async getFolders() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { data: [] };

            const { data, error } = await supabase
                .from('folders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at');

            if (error) throw error;
            return data;
        } catch (error) {
            throw error;
        }
    },

    async createFolder(name, color = '#C52222') {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data, error } = await supabase
                .from('folders')
                .insert({ name, color, user_id: user.id })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            throw error;
        }
    },

    async updateFolder(id, updates) {
        try {
            const { data, error } = await supabase
                .from('folders')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (error) {
            throw error;
        }
    },

    async deleteFolder(id) {
        try {
            const { error } = await supabase.from('folders').delete().eq('id', id);
            if (error) throw error;
            return true;
        } catch (error) {
            throw error;
        }
    },

    async assignDeckToFolder(deckId, folderId) {
        try {
            const { error } = await supabase
                .from('decks')
                .update({ folder_id: folderId })
                .eq('id', deckId);

            if (error) throw error;
            return true;
        } catch (error) {
            throw error;
        }
    }
};
