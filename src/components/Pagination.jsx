import React from 'react';
import '../styles/Pagination.css';
import { useLanguage } from '../context/LanguageContext';

/**
 * Componente de paginación reutilizable
 * @param {Object} props
 * @param {number} props.currentPage - Página actual (0-indexed)
 * @param {number} props.totalPages - Total de páginas disponibles
 * @param {Function} props.onPageChange - Callback al cambiar de página
 * @param {boolean} props.isLoading - Indica si se están cargando datos
 */
const Pagination = ({ currentPage, totalPages, onPageChange, isLoading = false }) => {
    const { t } = useLanguage();

    const handlePrevious = () => {
        if (currentPage > 0 && !isLoading) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages - 1 && !isLoading) {
            onPageChange(currentPage + 1);
        }
    };

    // No mostrar paginación si solo hay una página o ninguna
    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="pagination">
            <button
                className="pagination__button"
                onClick={handlePrevious}
                disabled={currentPage === 0 || isLoading}
                aria-label={t('pagination.previous') || "Previous"}
            >
                {t('pagination.previous') || "← Previous"}
            </button>

            <span className="pagination__info">
                {t('pagination.page') || "Page"} {currentPage + 1} {t('pagination.of') || "of"} {totalPages}
            </span>

            <button
                className="pagination__button"
                onClick={handleNext}
                disabled={currentPage >= totalPages - 1 || isLoading}
                aria-label={t('pagination.next') || "Next"}
            >
                {t('pagination.next') || "Next →"}
            </button>
        </div>
    );
};

export default Pagination;
