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
            // 1. Check Username Uniqueness
            if (userData.username) {
                const { data: existing, error: checkError } = await supabase
                    .from('profiles')
                    .select('id')
                    .ilike('username', userData.username)
                    .maybeSingle();

                if (checkError && checkError.code !== 'PGRST116') throw checkError;

                if (existing) {
                    throw new Error('Username already taken');
                }
            }

            // 2. Register User
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
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // 1. Check Username Uniqueness if changing
            if (profileData.username) {
                // Fetch current profile or just check collision
                const { data: existing, error: checkError } = await supabase
                    .from('profiles')
                    .select('id')
                    .ilike('username', profileData.username) // Case insensitive check
                    .maybeSingle();

                if (checkError && checkError.code !== 'PGRST116') throw checkError;

                // If exists and not me
                if (existing && existing.id !== user.id) {
                    throw new Error('Username already taken');
                }
            }

            // 2. Update Auth Metadata
            const metadataUpdates = {};
            if (profileData.username) metadataUpdates.username = profileData.username;
            if (profileData.fullName) metadataUpdates.full_name = profileData.fullName;
            if (profileData.birthDate) metadataUpdates.birth_date = profileData.birthDate;

            const { data, error } = await supabase.auth.updateUser({
                data: metadataUpdates
            });

            if (error) throw error;

            // 3. Sync with Profiles Table (Public)
            // Ideally triggered by DB, but explicit update ensures consistency
            const profileUpdates = {};
            if (profileData.username) profileUpdates.username = profileData.username;
            if (profileData.fullName) profileUpdates.full_name = profileData.fullName;
            // Add other fields as needed if they exist in profiles schema

            // Only update if we have fields to update
            if (Object.keys(profileUpdates).length > 0) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update(profileUpdates)
                    .eq('id', user.id);

                if (profileError) {
                    console.warn('Failed to sync profile table (non-critical if metadata updated):', profileError);
                    // We don't throw, as Auth is the source of truth for login. 
                    // But for social features, profiles table is key.
                }
            }

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
// Import static data
import staticCards from '../data/cards.json';
import { BANNED_LISTS } from '../data/bans';

/**
 * Servicio de cartas (Updated to use Static JSON)
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
            talento = '',
            set = '',
            rareza = '',
            pitch = '',
            costo = '',
            type = '',
            includeWhiteBorder = false
        } = options;

        try {
            // Internal function to perform a single query with explicit range
            const fetchPage = async (from, to) => {
                let query = supabase
                    .from('cards')
                    .select('*', { count: 'exact' });

                // 1. Filter out White Border sets if requested
                if (!includeWhiteBorder && WHITE_BORDER_SETS.length > 0) {
                    query = query.not('set_code', 'in', `(${WHITE_BORDER_SETS.join(',')})`);
                }

                // 2. Search by name (Smarter multi-word handling)
                if (search) {
                    const terms = search.trim().split(/\s+/).filter(Boolean);
                    terms.forEach(term => {
                        query = query.ilike('name', `%${term}%`);
                    });
                }

                // 3. Filter by Class (can be array or string)
                if (clase) {
                    if (Array.isArray(clase) && clase.length > 0) {
                        const orCondition = clase.map(c => `clase.ilike.%${c}%`).join(',');
                        query = query.or(orCondition);
                    } else if (typeof clase === 'string' && clase) {
                        query = query.ilike('clase', `%${clase}%`);
                    }
                }

                // 3.1 Filter by Talent (new)
                if (talento) {
                    if (Array.isArray(talento) && talento.length > 0) {
                        const orCondition = talento.map(t => `clase.ilike.%${t}%`).join(',');
                        query = query.or(orCondition);
                    } else if (typeof talento === 'string' && talento) {
                        query = query.ilike('clase', `%${talento}%`);
                    }
                }

                // 4. Filter by Set
                if (set) {
                    if (Array.isArray(set)) query = query.in('set_code', set);
                    else query = query.eq('set_code', set);
                }

                // 5. Filter by Rarity
                if (rareza) {
                    if (Array.isArray(rareza)) query = query.in('rareza', rareza);
                    else query = query.eq('rareza', rareza);
                }

                // 6. Filter by Pitch
                if (pitch !== '') {
                    if (Array.isArray(pitch)) query = query.in('pitch', pitch);
                    else query = query.eq('pitch', pitch);
                }

                // 7. Filter by Cost
                if (costo !== '') {
                    if (Array.isArray(costo)) query = query.in('costo', costo);
                    else query = query.eq('costo', costo);
                }

                // 8. Filter by Type (e.g. Weapon, Action)
                if (type) {
                    if (Array.isArray(type)) {
                        const typeOr = type.map(t => `tipo.ilike.%${t}%`).join(',');
                        query = query.or(typeOr);
                    } else if (type) {
                        query = query.ilike('tipo', `%${type}%`);
                    }
                }

                query = query.order('name', { ascending: true });
                return await query.range(from, to);
            };

            // Postgrest limit is typically 1000 cards. If we want more, we need to loop.
            const MAX_SUPABASE_PAGE = 1000;

            if (pageSize > MAX_SUPABASE_PAGE) {
                let allData = [];
                let currentOffset = 0;
                let totalCount = 0;
                let hasMore = true;

                while (hasMore && allData.length < pageSize) {
                    const nextBatchSize = Math.min(pageSize - allData.length, MAX_SUPABASE_PAGE);
                    const from = currentOffset;
                    const to = from + nextBatchSize - 1;

                    const { data, count, error } = await fetchPage(from, to);

                    if (error) throw error;
                    if (!data || data.length === 0) break;

                    allData = [...allData, ...data];
                    totalCount = count;
                    currentOffset += data.length;

                    if (data.length < nextBatchSize || allData.length >= totalCount) {
                        hasMore = false;
                    }
                }

                return {
                    data: allData,
                    count: totalCount,
                    page,
                    pageSize,
                    totalPages: Math.ceil(totalCount / pageSize),
                    error: null
                };
            } else {
                // Normal single page fetch
                const from = page * pageSize;
                const to = from + pageSize - 1;
                const { data, count, error } = await fetchPage(from, to);
                if (error) throw error;
                return {
                    data,
                    count,
                    page,
                    pageSize,
                    totalPages: Math.ceil(count / pageSize),
                    error: null
                };
            }
        } catch (error) {
            return handleSupabaseError(error);
        }
    },

    /**
     * Get all versions of a card by name
     */
    async getCardsByName(name) {
        try {
            if (!name) return [];
            const { data, error } = await supabase
                .from('cards')
                .select('*')
                .ilike('name', `%${name}%`);

            if (error) throw error;
            return data;
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
            return { data, error };
        } catch (error) {
            console.error('Error fetching card:', error);
            return { data: null, error: error.message };
        }
    },

    /**
     * Get Living Legend data
     */
    async getLivingLegendData() {
        const FALLBACK_LL_DATA = [
            // Active Heroes
            { name: "Kayo, Armed and Dangerous", points: 959, rank: "1", status: "Active", class: "Brute" },
            { name: "Verdance, Thorn of the Rose", points: 876, rank: "2", status: "Active", class: "Wizard" },
            { name: "Prism, Awakener of Sol", points: 874, rank: "3", status: "Active", class: "Illusionist" },
            { name: "Fai, Rising Rebellion", points: 821, rank: "4", status: "Active", class: "Ninja" },
            { name: "Cindra, Dracai of Retribution", points: 778, rank: "5", status: "Active", class: "Dracai" },
            { name: "Bravo, Showstopper", points: 769, rank: "6", status: "Active", class: "Guardian" },
            { name: "Dorinthea Ironsong", points: 708, rank: "7", status: "Active", class: "Warrior" },
            { name: "Katsu, the Wanderer", points: 690, rank: "8", status: "Active", class: "Ninja" },
            { name: "Kassai of the Golden Sand", points: 688, rank: "9", status: "Active", class: "Warrior" },

            // Ascended Heroes
            { name: "Zen, Tamer of Purpose", points: 1000, rank: "Ascended", status: "Ascended", class: "Ninja" },
            { name: "Bravo, Star of the Show", points: 1582, rank: "Ascended", status: "Ascended", class: "Guardian" },
            { name: "Briar, Warden of Thorns", points: 1158, rank: "Ascended", status: "Ascended", class: "Runeblade" },
            { name: "Chane, Bound by Shadow", points: 1102, rank: "Ascended", status: "Ascended", class: "Runeblade" },
            { name: "Dromai, Ash Artist", points: 1096, rank: "Ascended", status: "Ascended", class: "Illusionist" },
            { name: "Lexi, Livewire", points: 1276, rank: "Ascended", status: "Ascended", class: "Ranger" },
            { name: "Oldhim, Grandfather of Eternity", points: 1186, rank: "Ascended", status: "Ascended", class: "Guardian" },
            { name: "Prism, Sculptor of Arc Light", points: 1098, rank: "Ascended", status: "Ascended", class: "Illusionist" },
            { name: "Iyslander, Stormbind", points: 1012, rank: "Ascended", status: "Ascended", class: "Wizard" },
            { name: "Kano, Dracai of Aether", points: 1028, rank: "Ascended", status: "Ascended", class: "Wizard" },
            { name: "Viserai, Rune Blood", points: 1016, rank: "Ascended", status: "Ascended", class: "Runeblade" },
            { name: "Dash, Inventor Extraordinaire", points: 1013, rank: "Ascended", status: "Ascended", class: "Mechanologist" },
            { name: "Nuu, Alluring Desire", points: 1004, rank: "Ascended", status: "Ascended", class: "Assassin" },
            { name: "Enigma, Ledger of Ancestry", points: 1046, rank: "Ascended", status: "Ascended", class: "Illusionist" },
            { name: "Azalea, Ace in the Hole", points: 1036, rank: "Ascended", status: "Ascended", class: "Ranger" },
            { name: "Florian, Rotwood Harbinger", points: 1029, rank: "Ascended", status: "Ascended", class: "Runeblade" },
            { name: "Aurora, Shooting Star", points: 1051, rank: "Ascended", status: "Ascended", class: "Runeblade" }
        ];

        try {
            // 1. Try fetching directly from Supabase (fastest, no proxy needed)
            const { data: sbData, error: sbError } = await supabase
                .from('living_legend_leaderboard')
                .select('*')
                .order('points', { ascending: false });

            if (!sbError && sbData && sbData.length > 0) {
                // Normalize keys from DB (hero_name) to Frontend (name)
                // Note: backend controller also does this. We need to match.
                // Our DB has hero_name, points, rank, status, class
                const normalized = sbData.map(h => ({
                    name: h.hero_name,
                    points: h.points,
                    rank: h.rank,
                    status: h.status,
                    class: h.class
                }));
                console.log("[api.js] Loaded LL data from Supabase directly.");
                return { data: normalized, error: null };
            }

            // 2. If empty or error (e.g. table empty), try Backend API (triggers scrape)
            console.log("[api.js] Supabase LL empty/error, calling backend to trigger scrape...", sbError);
            const response = await fetch('/api/cards/living-legend');

            if (!response.ok) {
                console.warn('Backend LL fetch failed, using frontend fallback');
                return { data: FALLBACK_LL_DATA, error: null };
            }
            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                console.warn('Backend LL returned empty/invalid, using frontend fallback');
                return { data: FALLBACK_LL_DATA, error: null };
            }
            return { data, error: null };
        } catch (error) {
            console.warn("LL data fetch failed (network/proxy), using frontend fallback", error);
            // Last resort
            return { data: FALLBACK_LL_DATA, error: null };
        }
    },

    /**
     * Get Banned Cards
     */
    async getBannedCards() {
        try {
            // Return local static data immediately
            return { data: BANNED_LISTS, error: null };
        } catch (error) {
            console.warn("Bans data fetch failed", error);
            return { data: {}, error: null };
        }
    },

    /**
     * Obtiene las clases disponibles
     */
    /**
     * Obtiene las clases disponibles
     */
    async getClasses() {
        try {
            // Retrieve all classes from DB (lightweight distinct if possible, else fetch all claa)
            // Supabase doesn't support .distinct() directly in query builder. 
            // We fetch all non-null classes.
            const { data, error } = await supabase
                .from('cards')
                .select('clase');

            if (error) throw error;

            const classes = [...new Set(data.map(c => c.clase).filter(Boolean))].sort();
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
                .select('set_code');

            if (error) throw error;

            const sets = [...new Set(data.map(c => c.set_code).filter(Boolean))].sort();
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
            // names is array of strings
            // Case insensitive match is hard for array.
            // But usually names come from the DB itself (e.g. deck list).
            // We can use .in('name', names) if they match exactly.
            // Or we iterate? No.
            // Let's assume exact match for now, or use textSearch if names are space separated strings?
            // Safer: fetch cards where name is in the list.
            const { data, error } = await supabase
                .from('cards')
                .select('*')
                .in('name', names);

            if (error) throw error;

            console.log(`[api.js] getCardsByNames looked for ${names.length} names. Found raw: ${data?.length}`);
            if (names.length < 5) console.log("[api.js] Names:", names); // inspect names if few
            if (data?.length === 0) console.warn("[api.js] WARNING: No cards found for names:", names);

            // Filter sets if needed (white border)
            const filtered = data.filter(c => !WHITE_BORDER_SETS.includes(c.set_code));
            console.log(`[api.js] After WB filter: ${filtered.length}`);

            return { data: filtered, error: null };
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
            // Simplified query: We no longer join to 'users' table (which may not exist).
            // 'username' is stored directly on 'decks' now.
            let query = supabase
                .from('decks')
                .select('*', { count: 'exact' });

            if (scope === 'user' || scope === 'mine') {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    query = query.eq('user_id', user.id);
                } else {
                    return { data: [], count: 0 };
                }
            } else if (scope === 'public') {
                query = query.eq('visibility', 'public');
            }

            if (filters.hero) query = query.ilike('hero', `%${filters.hero}%`);
            if (filters.format) query = query.eq('format', filters.format);
            if (filters.username) {
                query = query.ilike('username', `%${filters.username}%`);
            }

            if (filters.sort === 'oldest') {
                query = query.order('created_at', { ascending: true });
            } else if (filters.sort === 'likes') {
                query = query.order('likes_count', { ascending: false });
            } else if (filters.sort === 'views') {
                query = query.order('views_count', { ascending: false });
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
            // Get current user for ownership check
            const { data: { user } } = await supabase.auth.getUser();

            // Fetch deck header
            const { data: deck, error } = await supabase
                .from('decks')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            // Fetch deck cards
            const { data: cards, error: cardsError } = await supabase
                .from('deck_cards')
                .select('*, card:cards(*)')
                .eq('deck_id', id);

            if (cardsError) throw cardsError;

            // Determine ownership
            const isOwner = user && deck.user_id === user.id;

            // Combine and return with isOwner flag
            return {
                ...deck,
                isOwner,
                cards: cards.map(c => ({
                    ...c.card,
                    quantity: c.quantity,
                    is_sideboard: c.is_sideboard,
                    section: c.section
                }))
            };
        } catch (error) {
            console.error('Error fetching deck:', error);
            throw error;
        }
    },

    async createDeck(deckData) {
        try {
            console.log("[api.js] createDeck called with:", deckData);
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
                    user_id: user.id,
                    username: deckData.username || user.user_metadata?.username || 'Unknown'
                })
                .select()
                .single();

            if (error) throw error;
            console.log("[api.js] Deck created:", deck.id);

            // 2. Auto-Like for Creator
            // The user automatically likes their own deck upon creation.
            const { error: likeError } = await supabase
                .from('deck_likes')
                .insert({
                    deck_id: deck.id,
                    user_id: user.id
                });

            if (likeError) {
                console.warn("[api.js] Auto-like failed (non-critical):", likeError);
                // We don't throw here to avoid failing the whole deck creation
            }

            // 2. Insert Cards
            // Normalize cards from different sections if not provided as 'cards'
            let cardsToInsert = deckData.cards || [];
            if (!cardsToInsert.length) {
                if (deckData.mainDeck) {
                    const main = deckData.mainDeck.map(item => {
                        if (!item || !item.card || !item.card.id) {
                            console.warn("[api.js] Invalid mainDeck item:", item);
                            return null;
                        }
                        return {
                            id: item.card.id,
                            quantity: item.count,
                            is_sideboard: false,
                            section: 'main'
                        };
                    }).filter(Boolean);
                    cardsToInsert = [...cardsToInsert, ...main];
                }
                if (deckData.sideboard) {
                    const side = deckData.sideboard.map(item => {
                        if (!item || !item.card || !item.card.id) {
                            console.warn("[api.js] Invalid sideboard item:", item);
                            return null;
                        }
                        return {
                            id: item.card.id,
                            quantity: item.count,
                            is_sideboard: true,
                            section: 'sideboard'
                        };
                    }).filter(Boolean);
                    cardsToInsert = [...cardsToInsert, ...side];
                }
                if (deckData.maybeboard) {
                    const maybe = deckData.maybeboard.map(item => {
                        if (!item || !item.card || !item.card.id) {
                            console.warn("[api.js] Invalid maybeboard item:", item);
                            return null;
                        }
                        return {
                            id: item.card.id,
                            quantity: item.count,
                            is_sideboard: false,
                            section: 'maybeboard'
                        };
                    }).filter(Boolean);
                    cardsToInsert = [...cardsToInsert, ...maybe];
                }
                if (deckData.equipment) {
                    const equipMap = new Map();
                    deckData.equipment.forEach(card => {
                        if (!card || !card.id) {
                            console.warn("[api.js] Invalid equipment item:", card);
                            return;
                        }
                        const existing = equipMap.get(card.id) || 0;
                        equipMap.set(card.id, existing + 1);
                    });

                    for (const [id, qty] of equipMap.entries()) {
                        cardsToInsert.push({
                            id: id,
                            quantity: qty,
                            is_sideboard: false,
                            section: 'equipment'
                        });
                    }
                }
            }

            console.log("[api.js] Final cardsToInsert:", JSON.stringify(cardsToInsert, null, 2));


            if (cardsToInsert.length > 0) {
                const deckCards = cardsToInsert.map(c => ({
                    deck_id: deck.id,
                    card_id: c.id,
                    quantity: c.quantity || 1,
                    is_sideboard: c.is_sideboard || false,
                    section: c.section || 'main'
                }));

                console.log("[api.js] Inserting deck_cards rows:", JSON.stringify(deckCards, null, 2));

                const { error: cardsError } = await supabase
                    .from('deck_cards')
                    .insert(deckCards);

                if (cardsError) {
                    console.error("[api.js] Deck cards insert ERROR:", cardsError);
                    throw cardsError;
                }
                console.log("[api.js] Deck cards joined successfully");
            } else {
                console.warn("[api.js] WARN: cardsToInsert is empty! Deck created without cards.");
            }

            return deck;
        } catch (error) {
            console.error('Error creating deck:', error);
            throw error;
        }
    },

    async updateDeck(id, deckData) {
        try {
            console.log("[api.js] updateDeck called with:", id, deckData);
            // 1. Update Deck Details
            // 1. Update Deck Details
            const updatePayload = {};
            const allowedFields = ['name', 'hero', 'format', 'description', 'visibility', 'guide'];

            allowedFields.forEach(field => {
                if (deckData[field] !== undefined) {
                    updatePayload[field] = deckData[field];
                }
            });

            if (deckData.username) {
                updatePayload.username = deckData.username;
            }

            const { error } = await supabase
                .from('decks')
                .update(updatePayload)
                .eq('id', id);

            if (error) throw error;
            console.log("[api.js] Deck details updated");

            // 2. Update Cards (easiest strategy: delete all and re-insert)

            // Normalize cards from different sections
            let cardsToInsert = deckData.cards || [];
            if (!cardsToInsert.length) {
                if (deckData.mainDeck) {
                    cardsToInsert = [
                        ...cardsToInsert,
                        ...deckData.mainDeck.map(item => {
                            if (!item || !item.card || !item.card.id) {
                                console.warn("[api.js] updateDeck: Invalid mainDeck item:", item);
                                return null;
                            }
                            return {
                                id: item.card.id,
                                quantity: item.count,
                                is_sideboard: false,
                                section: 'main'
                            };
                        }).filter(Boolean)
                    ];
                }
                if (deckData.sideboard) {
                    cardsToInsert = [
                        ...cardsToInsert,
                        ...deckData.sideboard.map(item => {
                            if (!item || !item.card || !item.card.id) {
                                console.warn("[api.js] updateDeck: Invalid sideboard item:", item);
                                return null;
                            }
                            return {
                                id: item.card.id,
                                quantity: item.count,
                                is_sideboard: true,
                                section: 'sideboard'
                            };
                        }).filter(Boolean)
                    ];
                }
                if (deckData.maybeboard) {
                    cardsToInsert = [
                        ...cardsToInsert,
                        ...deckData.maybeboard.map(item => {
                            if (!item || !item.card || !item.card.id) {
                                console.warn("[api.js] updateDeck: Invalid maybeboard item:", item);
                                return null;
                            }
                            return {
                                id: item.card.id,
                                quantity: item.count,
                                is_sideboard: false,
                                section: 'maybeboard'
                            };
                        }).filter(Boolean)
                    ];
                }
                if (deckData.equipment) {
                    const equipMap = new Map();
                    deckData.equipment.forEach(card => {
                        if (!card || !card.id) {
                            console.warn("[api.js] updateDeck: Invalid equipment item:", card);
                            return;
                        }
                        const existing = equipMap.get(card.id) || 0;
                        equipMap.set(card.id, existing + 1);
                    });

                    for (const [eid, qty] of equipMap.entries()) {
                        cardsToInsert.push({
                            id: eid,
                            quantity: qty,
                            is_sideboard: false,
                            section: 'equipment'
                        });
                    }
                }
            }

            console.log("[api.js] updateDeck cardsToInsert:", cardsToInsert);

            if (cardsToInsert.length > 0 || (deckData.mainDeck && deckData.mainDeck.length === 0)) {
                // Only delete/re-insert if we actually have new data or explicitly clearing.
                // Assuming if deckData comes in, we want to replace the deck contents.

                // Delete existing
                await supabase.from('deck_cards').delete().eq('deck_id', id);

                // Insert new
                if (cardsToInsert.length > 0) {
                    const deckCards = cardsToInsert.map(c => ({
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
            // Check if 'users' table exists or if we should use 'profiles'
            // For now, let's keep the join but Log the error.
            const { data, error } = await supabase
                .from('deck_comments')
                .select('*') // Simplify: Drop the join if it's causing issues. We stored username on the comment record.
                .eq('deck_id', deckId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error("getDeckComments API Error:", error);
                throw error;
            }
            return data;
        } catch (error) {
            console.error("getDeckComments Catch:", error);
            throw error;
        }
    },

    async postDeckComment(deckId, commentData) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Must be logged in');

            console.log("[api.js] Posting comment:", { deckId, userId: user.id, content: commentData.content });

            const { data, error } = await supabase
                .from('deck_comments')
                .insert({
                    deck_id: deckId,
                    user_id: user.id,
                    content: commentData.content,
                    parent_id: commentData.parentId || null,
                    username: user.user_metadata?.username || user.email?.split('@')[0] || 'User'
                })
                .select()
                .single();

            if (error) {
                console.error("postDeckComment API Error:", error);
                throw error;
            }

            // Return with injected user object
            return {
                ...data,
                user: {
                    username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
                    avatar_url: user.user_metadata?.avatar_url
                }
            };
        } catch (error) {
            console.error("postDeckComment Catch:", error);
            throw error;
        }
    },

    async deleteDeckComment(commentId) {
        try {
            const { error } = await supabase
                .from('deck_comments')
                .delete()
                .eq('id', commentId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error deleting comment:", error);
            throw error;
        }
    },

    async updateDeckComment(commentId, content) {
        try {
            const { data, error } = await supabase
                .from('deck_comments')
                .update({ content, updated_at: new Date() })
                .eq('id', commentId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error updating comment:", error);
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
                    .maybeSingle();
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
                .maybeSingle();

            if (existing) {
                // Unlike
                const { error } = await supabase
                    .from('deck_likes')
                    .delete()
                    .eq('id', existing.id);

                if (error) throw error;
                return { liked: false };
            } else {
                // Like
                const { error } = await supabase
                    .from('deck_likes')
                    .insert({
                        deck_id: deckId,
                        user_id: user.id
                    });

                if (error) throw error;
                return { liked: true };
            }
        } catch (error) {
            throw error;
        }
    },

    async incrementViews(deckId) {
        try {
            const { error } = await supabase.rpc('increment_deck_views', {
                target_deck_id: deckId
            });
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error incrementing views:', error);
            // Non-blocking, so we don't throw
            return false;
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
            if (!user) throw new Error('Must be logged in');

            let query = supabase
                .from('collections')
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
            if (filters.cardId) result = result.filter(c => c.id === filters.cardId);

            return { data: result, count: result.length };
        } catch (error) {
            console.error('Error fetching collection:', error);
            throw error;
        }
    },

    async addCard(cardId, quantity = 1) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Must be logged in');

            // Check if card already exists in collection
            const { data: existing } = await supabase
                .from('collections')
                .select('*')
                .eq('user_id', user.id)
                .eq('card_id', cardId)
                .single();

            if (existing) {
                // Update quantity
                const { error } = await supabase
                    .from('collections')
                    .update({ quantity: existing.quantity + quantity })
                    .eq('id', existing.id);
                if (error) throw error;
            } else {
                // Insert new entry
                const { error } = await supabase
                    .from('collections')
                    .insert({
                        user_id: user.id,
                        card_id: cardId,
                        quantity
                    });
                if (error) throw error;
            }
            return true;
        } catch (error) {
            console.error('Error adding card to collection:', error);
            throw error;
        }
    },

    async removeCard(cardId, quantity = 1, removeAll = false) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Must be logged in');

            const { data: existing } = await supabase
                .from('collections')
                .select('*')
                .eq('user_id', user.id)
                .eq('card_id', cardId)
                .single();

            if (!existing) return;

            if (removeAll || existing.quantity <= quantity) {
                await supabase.from('collections').delete().eq('id', existing.id);
            } else {
                await supabase.from('collections').update({ quantity: existing.quantity - quantity }).eq('id', existing.id);
            }
            return true;
        } catch (error) {
            console.error('Error removing card from collection:', error);
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
            if (!user) return [];

            const { data, error } = await supabase
                .from('deck_folders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at');

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching folders:', error);
            throw error;
        }
    },

    async createFolder(name, color = '#C52222') {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Must be logged in');

            const { data, error } = await supabase
                .from('deck_folders')
                .insert({ name, color, user_id: user.id })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating folder:', error);
            throw error;
        }
    },

    async updateFolder(id, updates) {
        try {
            const { data, error } = await supabase
                .from('deck_folders')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating folder:', error);
            throw error;
        }
    },

    async deleteFolder(id) {
        try {
            const { error } = await supabase.from('deck_folders').delete().eq('id', id);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting folder:', error);
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

/**
 * Servicio para listas de cartas buscadas (Wants Lists)
 */
export const WantsService = {
    /**
     * Obtiene todas las listas de wants del usuario
     */
    async getLists() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('wants_lists')
                .select('*, wants_items(count)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform to include card count
            return data.map(list => ({
                ...list,
                card_count: list.wants_items?.[0]?.count || 0
            }));
        } catch (error) {
            console.error('Error fetching wants lists:', error);
            throw error;
        }
    },

    /**
     * Crea una nueva lista de wants
     */
    async createList(name) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Must be logged in');

            const { data, error } = await supabase
                .from('wants_lists')
                .insert({ name, user_id: user.id })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating wants list:', error);
            throw error;
        }
    },

    /**
     * Actualiza una lista de wants
     */
    async updateList(id, updates) {
        try {
            const { data, error } = await supabase
                .from('wants_lists')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating wants list:', error);
            throw error;
        }
    },

    /**
     * Elimina una lista de wants
     */
    async deleteList(id) {
        try {
            const { error } = await supabase
                .from('wants_lists')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting wants list:', error);
            throw error;
        }
    },

    /**
     * Obtiene los items de una lista con datos completos de cartas
     */
    async getListItems(listId) {
        try {
            const { data, error } = await supabase
                .from('wants_items')
                .select(`
                    id,
                    quantity,
                    notes,
                    created_at,
                    card:cards(*)
                `)
                .eq('list_id', listId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Flatten card data
            return data.map(item => ({
                ...item.card,
                item_id: item.id,
                quantity: item.quantity,
                notes: item.notes,
                added_at: item.created_at
            }));
        } catch (error) {
            console.error('Error fetching wants items:', error);
            throw error;
        }
    },

    /**
     * Añade una carta a una lista de wants
     */
    async addCardToList(listId, cardId, quantity = 1, notes = '') {
        try {
            // Check if card already in list
            const { data: existing } = await supabase
                .from('wants_items')
                .select('id, quantity')
                .eq('list_id', listId)
                .eq('card_id', cardId)
                .single();

            if (existing) {
                // Update quantity
                const { data, error } = await supabase
                    .from('wants_items')
                    .update({ quantity: existing.quantity + quantity, notes })
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } else {
                // Insert new
                const { data, error } = await supabase
                    .from('wants_items')
                    .insert({ list_id: listId, card_id: cardId, quantity, notes })
                    .select()
                    .single();

                if (error) throw error;
                return data;
            }
        } catch (error) {
            console.error('Error adding card to wants list:', error);
            throw error;
        }
    },

    /**
     * Elimina una carta de una lista de wants
     */
    async removeCardFromList(listId, cardId) {
        try {
            const { error } = await supabase
                .from('wants_items')
                .delete()
                .eq('list_id', listId)
                .eq('card_id', cardId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error removing card from wants list:', error);
            throw error;
        }
    },

    /**
     * Actualiza la cantidad de una carta en la lista
     */
    async updateCardQuantity(listId, cardId, quantity) {
        try {
            const { data, error } = await supabase
                .from('wants_items')
                .update({ quantity })
                .eq('list_id', listId)
                .eq('card_id', cardId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating wants item quantity:', error);
            throw error;
        }
    },

    /**
     * Regenera el token de compartir de una lista
     */
    async regenerateShareToken(listId) {
        try {
            // Generate new UUID in client-side (crypto API available in modern browsers)
            const newToken = crypto.randomUUID();

            const { data, error } = await supabase
                .from('wants_lists')
                .update({ share_token: newToken, is_public: true })
                .eq('id', listId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error regenerating share token:', error);
            throw error;
        }
    },

    /**
     * Desactiva el enlace compartido de una lista
     */
    async disableSharing(listId) {
        try {
            const { data, error } = await supabase
                .from('wants_lists')
                .update({ is_public: false })
                .eq('id', listId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error disabling sharing:', error);
            throw error;
        }
    },

    /**
     * Obtiene una lista compartida por su token (público)
     */
    async getSharedList(shareToken) {
        try {
            // Fetch list by token (public access via RLS policy)
            const { data: list, error: listError } = await supabase
                .from('wants_lists')
                .select('id, name, created_at, updated_at')
                .eq('share_token', shareToken)
                .eq('is_public', true)
                .single();

            if (listError) throw listError;
            if (!list) throw new Error('List not found or not public');

            // Fetch items
            const { data: items, error: itemsError } = await supabase
                .from('wants_items')
                .select(`
                    id,
                    quantity,
                    notes,
                    card:cards(*)
                `)
                .eq('list_id', list.id)
                .order('created_at', { ascending: false });

            if (itemsError) throw itemsError;

            return {
                ...list,
                cards: items.map(item => ({
                    ...item.card,
                    quantity: item.quantity,
                    notes: item.notes
                }))
            };
        } catch (error) {
            console.error('Error fetching shared list:', error);
            throw error;
        }
    }
};
