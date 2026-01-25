/**
 * Servicio para comunicarse con el backend Express API.
 * Reemplaza la conexión directa a Supabase.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
import { supabase } from './supabase';

/**
 * Manejo centralizado de errores de la API
 */
const handleResponse = async (response) => {
    if (!response.ok) {
        if (response.status === 401) {
            console.warn('Unauthorized (401) - clearing session and redirecting to login');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }

        const error = await response.json().catch(() => ({
            error: 'Error desconocido',
            message: response.statusText
        }));
        throw new Error(error.message || error.error || 'Error en la petición');
    }
    return response.json();
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
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });
            return await handleResponse(response);
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },

    /**
     * Elimina la cuenta del usuario actual
     */
    async updateProfile(profileData) {
        try {
            const token = localStorage.getItem('token');
            // Assuming we have a backend endpoint for this now, or still mocking?
            // "Mock update - in real app would call API" was in Settings.jsx.
            // Let's implement a real call or handle it here if we want to use Supabase client directly in the service.
            // But waiting for backend implementation might be better. 
            // However, for avatar we will use the Service.

            // For now, let's just support the method signature.
            const response = await fetch(`${API_URL}/user/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileData)
            });
            return await handleResponse(response);
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

            // 3. Update User Metadata (and ideally syncs to profile table via trigger)
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
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/user/me`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) return true;
            return await handleResponse(response);
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
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });
            return await handleResponse(response);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
};

/**
 * Servicio de cartas que se comunica con el backend
 */
export const CardService = {
    /**
     * Obtiene todas las cartas con opciones de paginación y filtros
     * @param {Object} options - Opciones de consulta
     * @param {number} options.page - Número de página (0-indexed)
     * @param {number} options.pageSize - Número de items por página
     * @param {string} options.search - Término de búsqueda
     * @param {string} options.clase - Filtro por clase
     * @param {string} options.set - Filtro por set
     * @param {string} options.rareza - Filtro por rareza
     * @returns {Promise<{data: Array, count: number, page: number, pageSize: number, totalPages: number}>}
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
            costo = ''
        } = options;

        // Construir query params
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('pageSize', pageSize);
        if (search) params.append('search', search);

        // Handle array params
        if (Array.isArray(clase)) {
            clase.forEach(c => params.append('clase', c));
        } else if (clase) {
            params.append('clase', clase);
        }

        if (Array.isArray(set)) {
            set.forEach(s => params.append('set', s));
        } else if (set) {
            params.append('set', set);
        }


        if (Array.isArray(rareza)) {
            rareza.forEach(r => params.append('rareza', r));
        } else if (rareza) {
            params.append('rareza', rareza);
        }

        if (pitch) params.append('pitch', pitch);
        if (costo) params.append('costo', costo);

        if (Array.isArray(options.type)) {
            options.type.forEach(t => params.append('type', t));
        } else if (options.type) {
            params.append('type', options.type);
        }

        try {
            const response = await fetch(`${API_URL}/cards?${params.toString()}`);
            const result = await handleResponse(response);
            return { data: result.data, count: result.count, error: null };
        } catch (error) {
            console.error('Error fetching cards:', error);
            return { data: null, count: 0, error: error.message };
        }
    },

    /**
     * Get all versions of a card by name
     * @param {string} name 
     */
    async getCardsByName(name) {
        try {
            const params = new URLSearchParams();
            params.append('search', name);
            params.append('pageSize', 100);

            const response = await fetch(`${API_URL}/cards?${params.toString()}`);
            const result = await handleResponse(response);
            return result.data || [];
        } catch (error) {
            console.error('Error fetching card versions:', error);
            return [];
        }
    },

    /**
     * Obtiene una carta por su ID
     * @param {string} id - UUID de la carta
     * @returns {Promise<{data: Object|null, error: string|null}>}
     */
    async getCardById(id) {
        try {
            const response = await fetch(`${API_URL}/cards/${id}`);
            const data = await handleResponse(response);
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching card:', error);
            return { data: null, error: error.message };
        }
    },

    /**
     * Get Living Legend data (scraped from official site)
     */
    async getLivingLegendData() {
        try {
            const response = await fetch(`${API_URL}/cards/living-legend`);
            const data = await handleResponse(response);
            // Returns array of heroes
            return { data, error: null };
        } catch (error) {
            console.error("Error fetching LL data:", error);
            return { data: [], error: error.message };
        }
    },

    /**
     * Get Banned Cards (scraped)
     */
    async getBannedCards() {
        try {
            const response = await fetch(`${API_URL}/cards/bans`);
            const data = await handleResponse(response);
            return { data, error: null };
        } catch (error) {
            console.error("Error fetching Bans data:", error);
            return { data: {}, error: error.message };
        }
    },

    /**
     * Obtiene las clases disponibles
     * @returns {Promise<{data: Array<string>|null, error: string|null}>}
     */
    async getClasses() {
        try {
            const response = await fetch(`${API_URL}/cards/metadata/classes`);
            const data = await handleResponse(response);
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching classes:', error);
            return { data: null, error: error.message };
        }
    },

    /**
     * Obtiene los sets disponibles
     * @returns {Promise<{data: Array<string>|null, error: string|null}>}
     */
    async getSets() {
        try {
            const response = await fetch(`${API_URL}/cards/metadata/sets`);
            const data = await handleResponse(response);
            return { data, error: null };
        } catch (error) {
            console.error('Error fetching sets:', error);
            return { data: null, error: error.message };
        }
    },

    /**
     * Obtiene cartas por lista de nombres
     * @param {string[]} names 
     */
    async getCardsByNames(names) {
        try {
            const response = await fetch(`${API_URL}/cards/batch-lookup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ names })
            });
            const data = await handleResponse(response);
            return { data, error: null };
        } catch (error) {
            console.error('Error batch fetching cards:', error);
            return { data: null, error: error.message };
        }
    }
};

/**
 * Servicio para gestión de mazos
 */
export const DeckService = {
    /**
     * Obtiene los mazos del usuario
     */
    async getDecks(scope = '', filters = {}) {
        try {
            const token = localStorage.getItem('token');
            // Construct URL with params
            const params = new URLSearchParams();
            if (scope) params.append('scope', scope);

            if (filters.hero) params.append('hero', filters.hero);
            if (filters.username) params.append('username', filters.username);
            if (filters.sort) params.append('sortOrder', filters.sort); // 'newest' or 'oldest'

            const url = `${API_URL}/decks?${params.toString()}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return await handleResponse(response);
        } catch (error) {
            console.error('Error fetching decks:', error);
            throw error;
        }
    },

    /**
     * Obtiene un mazo por ID
     */
    async getDeckById(id) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/decks/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return await handleResponse(response);
        } catch (error) {
            console.error('Error fetching deck:', error);
            throw error;
        }
    },

    /**
     * Crea un nuevo mazo
     */
    async createDeck(deckData) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/decks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(deckData)
            });
            return await handleResponse(response);
        } catch (error) {
            console.error('Error creating deck:', error);
            throw error;
        }
    },

    /**
     * Actualiza un mazo existente
     */
    async updateDeck(id, deckData) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/decks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(deckData)
            });
            return await handleResponse(response);
        } catch (error) {
            console.error('Error updating deck:', error);
            throw error;
        }
    },

    /**
     * Elimina un mazo
     */
    async deleteDeck(id) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/decks/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to delete deck');
            return true;
        } catch (error) {
            console.error('Error deleting deck:', error);
            throw error;
        }
    },

    /**
     * Obtiene los comentarios de un mazo
     */
    async getDeckComments(deckId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/decks/${deckId}/comments`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return await handleResponse(response);
        } catch (error) {
            console.error('Error fetching comments:', error);
            throw error;
        }
    },

    /**
     * Publica un comentario en un mazo
     */
    async postDeckComment(deckId, commentData) {
        try {
            const token = localStorage.getItem('token');
            // commentData: { content, parentId }
            // Backend expects userId and username in body for now, but really should be from token.
            // Let's pass what we can.
            const user = JSON.parse(localStorage.getItem('user'));
            const payload = {
                ...commentData,
                userId: user?.id,
                username: user?.user_metadata?.username || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
            };

            const response = await fetch(`${API_URL}/decks/${deckId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            return await handleResponse(response);
        } catch (error) {
            console.error('Error posting comment:', error);
            throw error;
        }
    },

    /**
     * Obtiene el estado de likes de un mazo (count y si el usuario actual ha dado like)
     */
    async getLikeStatus(deckId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/decks/${deckId}/likes`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return await handleResponse(response);
        } catch (error) {
            console.error('Error fetching like status:', error);
            throw error;
        }
    },

    /**
     * Toggle like en un mazo (añade si no existe, quita si existe)
     */
    async toggleLike(deckId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/decks/${deckId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return await handleResponse(response);
        } catch (error) {
            console.error('Error toggling like:', error);
            throw error;
        }
    }
};

/**
 * Servicio para gestión de colección de usuario
 */
export const CollectionService = {
    /**
     * Obtiene la colección del usuario con filtros
     */
    async getCollection(filters = {}) {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();

            // Standard filters
            if (filters.page) params.append('page', filters.page);
            if (filters.pageSize) params.append('pageSize', filters.pageSize);
            if (filters.search) params.append('search', filters.search);
            if (filters.pitch) params.append('pitch', filters.pitch);
            if (filters.costo) params.append('cost', filters.costo);
            if (filters.set) params.append('set', filters.set);
            if (filters.rareza) params.append('rarity', filters.rareza);
            if (filters.clase) params.append('class', filters.clase);

            const response = await fetch(`${API_URL}/collection?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return await handleResponse(response);
        } catch (error) {
            console.error('Error fetching collection:', error);
            throw error;
        }
    },

    /**
     * Añade una carta a la colección
     * @param {string} cardId - ID de la carta
     * @param {number} quantity - Cantidad a añadir (default 1)
     * @param {boolean} isFoil - Si es foil (default false)
     */
    async addCard(cardId, quantity = 1, isFoil = false) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/collection/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ cardId, quantity, isFoil })
            });
            return await handleResponse(response);
        } catch (error) {
            console.error('Error adding to collection:', error);
            throw error;
        }
    },

    /**
     * Elimina una carta de la colección
     * @param {string} cardId 
     * @param {number} quantity - Cantidad a eliminar
     * @param {boolean} removeAll - Si se debe eliminar la entrada completa
     */
    async removeCard(cardId, quantity = 1, removeAll = false, isFoil = false) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/collection/remove`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ cardId, quantity, removeAll, isFoil })
            });
            return await handleResponse(response);
        } catch (error) {
            console.error('Error removing from collection:', error);
            throw error;
        }
    }
};

/**
 * Servicio para gestión de carpetas de mazos
 */
export const FolderService = {
    /**
     * Get all folders for the current user
     */
    async getFolders() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/folders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return await handleResponse(response);
        } catch (error) {
            console.error('Error fetching folders:', error);
            throw error;
        }
    },

    /**
     * Create a new folder
     */
    async createFolder(name, color = '#C52222') {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/folders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, color })
            });
            return await handleResponse(response);
        } catch (error) {
            console.error('Error creating folder:', error);
            throw error;
        }
    },

    /**
     * Update a folder
     */
    async updateFolder(id, updates) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/folders/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });
            return await handleResponse(response);
        } catch (error) {
            console.error('Error updating folder:', error);
            throw error;
        }
    },

    /**
     * Delete a folder
     */
    async deleteFolder(id) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/folders/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to delete folder');
            return true;
        } catch (error) {
            console.error('Error deleting folder:', error);
            throw error;
        }
    },

    /**
     * Assign a deck to a folder
     */
    async assignDeckToFolder(deckId, folderId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/folders/assign/${deckId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ folder_id: folderId })
            });
            return await handleResponse(response);
        } catch (error) {
            console.error('Error assigning deck to folder:', error);
            throw error;
        }
    }
};
