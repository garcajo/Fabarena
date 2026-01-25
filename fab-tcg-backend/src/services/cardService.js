const supabase = require('../config/supabase');

/**
 * White-bordered sets to filter out by default
 * Only 1HP (History Pack 1) has white borders in English
 */
const WHITE_BORDER_SETS = ['1HP'];

/**
 * Obtiene todas las cartas con opciones de paginación, búsqueda y filtros
 * @param {Object} options - Opciones de consulta
 * @param {number} options.page - Número de página (0-indexed)
 * @param {number} options.pageSize - Tamaño de página
 * @param {string} options.search - Término de búsqueda para el nombre
 * @param {string} options.clase - Filtro por clase
 * @param {string} options.set - Filtro por set
 * @param {string} options.rareza - Filtro por rareza
 * @param {string} options.pitch - Filtro por pitch/color (1=rojo, 2=amarillo, 3=azul)
 * @param {string} options.costo - Filtro por costo de recursos
 * @returns {Promise<{data: Array, count: number}>}
 */
const getAllCards = async (options = {}) => {
    const {
        page = 0,
        pageSize = 20,
        search = '',
        clase = '',
        set = '',
        rareza = '',
        pitch = '',
        costo = '',
        includeWhiteBorder = false // Exclude 1HP (white border) by default
    } = options;

    console.log('🔍 getAllCards options:', JSON.stringify(options, null, 2));

    // Construir query base
    let query = supabase
        .from('cards')
        .select('*', { count: 'exact' });

    // Aplicar filtros

    // Filter out white-bordered sets (1HP) unless explicitly requested
    if (!includeWhiteBorder) {
        query = query.not('set_code', 'in', `(${WHITE_BORDER_SETS.join(',')})`);
    }

    if (search) {
        query = query.ilike('name', `%${search}%`);
    }

    if (clase) {
        if (Array.isArray(clase)) {
            // "clase.ilike.%A%,clase.ilike.%B%" layout for OR logic in Supabase is clunky with .or() top level?
            // Supabase JS .or() expects strict syntax. "clase.ilike.%Ninja%,clase.ilike.%Warrior%"
            const orQuery = clase.map(c => `clase.ilike.%${c}%`).join(',');
            console.log('🔍 Applying class OR filter:', orQuery);
            query = query.or(orQuery);
        } else {
            console.log('🔍 Applying class filter:', clase);
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
            console.log('🔍 Applying rareza filter (array):', rareza);
            query = query.in('rareza', rareza);
        } else {
            console.log('🔍 Applying rareza filter (single):', rareza);
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

    if (options.type) {
        // 'tipo' column in DB
        if (Array.isArray(options.type)) {
            const orQuery = options.type.map(t => `tipo.ilike.%${t}%`).join(',');
            query = query.or(orQuery);
        } else {
            query = query.ilike('tipo', `%${options.type}%`);
        }
    }

    // Aplicar paginación
    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Ordenar por nombre
    query = query.order('name', { ascending: true });

    const { data, error, count } = await query;

    if (error) {
        throw error;
    }

    return { data, count };
};

/**
 * Obtiene una carta por su ID
 * @param {string} id - UUID de la carta
 * @returns {Promise<Object>}
 */
const getCardById = async (id) => {
    const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        throw error;
    }
    return data;
};

/**
 * Obtiene las clases únicas disponibles
 * @returns {Promise<Array<string>>}
 */
const getClasses = async () => {
    const { data, error } = await supabase
        .from('cards')
        .select('clase')
        .not('clase', 'is', null);

    if (error) {
        throw error;
    }

    // Extraer clases únicas
    const classes = [...new Set(data.map(card => card.clase))].sort();
    return classes;
};

/**
 * Obtiene los sets únicos disponibles
 * @returns {Promise<Array<string>>}
 */
const getSets = async () => {
    const { data, error } = await supabase
        .from('cards')
        .select('set_code')
        .not('set_code', 'is', null);

    if (error) {
        throw error;
    }

    // Extraer sets únicos
    const sets = [...new Set(data.map(card => card.set_code))].sort();
    return sets;
};

/**
 * Obtiene cartas por una lista de nombres exactos (para importación)
 * @param {string[]} names - Lista de nombres de cartas
 * @param {Object} options - Options
 * @param {boolean} options.includeWhiteBorder - Include white-bordered (1HP) cards
 * @returns {Promise<Object[]>}
 */
const getCardsByNames = async (names, options = {}) => {
    if (!names || names.length === 0) return [];

    const { includeWhiteBorder = false } = options;

    // Normalize names to handle minor variations if needed, but for now exact match or ILIKE
    // Supabase .in() works for exact matches.
    // Issue: Deck imports might have "Sink Below (Red)" vs DB "Sink Below".
    // The parser should clean this, so we assume names are relatively clean.
    // However, DB might have "Sink Below" with multiple pitches.
    // We want ALL matching cards, frontend will pick the right pitch.

    // Use .in() for names. 
    // NOTE: If list is huge, might hit url limit? RPC or POST body usually OK.

    // Use .or() with ilike for case-insensitive matching
    // Handle special characters in names (especially commas and quotes) for PostgREST syntax
    // Format: name.ilike."Val1",name.ilike."Val2"
    const orFilter = names.map(name => {
        // Sanitize name for filter string: remove quotes to prevent injection/breakage, 
        // strictly speaking we should escape, but simpler is safer for now?
        // Better: just wrap in double quotes as per PostgREST spec.
        return `name.ilike."${name.replace(/"/g, '')}"`;
    }).join(',');

    let query = supabase
        .from('cards')
        .select('id, name, pitch, costo, tipo, imagen, set_code, clase, card_type, power, defense, texto')
        .or(orFilter);

    // Filter out white-bordered sets (1HP) unless explicitly requested
    if (!includeWhiteBorder) {
        query = query.not('set_code', 'in', `(${WHITE_BORDER_SETS.join(',')})`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
};

module.exports = {
    getAllCards,
    getCardById,
    getClasses,
    getSets,
    getCardsByNames
};
