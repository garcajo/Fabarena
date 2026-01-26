import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CardService } from '../services/api';

/**
 * Custom hook para manejar el estado de las cartas con paginación y filtros.
 * @returns {Object} - { cards, loading, error, refresh, totalCount, currentPage, totalPages, nextPage, prevPage, goToPage, filters, setFilters }
 */
export const useCards = () => {
    const [searchParams] = useSearchParams();

    const [cards, setCards] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estado de filtros inicializado desde URL
    // Para multiselect, usamos getAll() para obtener todos los valores si existen
    const getParam = (key) => {
        const values = searchParams.getAll(key);
        if (values.length > 1) return values;
        if (values.length === 1) return values[0];
        return '';
    };

    const [filters, setFilters] = useState({
        pitch: getParam('pitch'),
        costo: getParam('costo'),
        search: searchParams.get('search') || '',
        set: getParam('set'),
        clase: getParam('clase'),
        rareza: getParam('rareza')
    });

    const fetchCards = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const options = {
                page: currentPage,
                pageSize: 20,
                ...filters
            };

            const { data, count, error: apiError } = await CardService.getCards(options);

            if (apiError) {
                throw new Error(apiError);
            }

            setCards(data || []);
            setTotalCount(count || 0);
            setTotalPages(Math.ceil((count || 0) / 20));
        } catch (err) {
            console.error('Error al obtener cartas:', err);
            setError(err.message);
            setCards([]);
            setTotalCount(0);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }

    }, [currentPage, filters]);

    useEffect(() => {
        fetchCards();
    }, [fetchCards]);

    // Resetear a la primera página cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(0);
    }, [filters.pitch, filters.costo, filters.search]);

    // Funciones de navegación
    const nextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const goToPage = (page) => {
        if (page >= 0 && page < totalPages) {
            setCurrentPage(page);
        }
    };

    return {
        cards,
        loading,
        error,
        refresh: fetchCards,
        totalCount,
        currentPage,
        totalPages,
        nextPage,
        prevPage,
        goToPage,
        filters,
        setFilters
    };
};
