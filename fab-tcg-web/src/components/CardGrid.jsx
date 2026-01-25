import React from 'react';
import Card from './Card';
import CardSkeleton from './CardSkeleton';
import '../styles/CardGrid.css';

/**
 * Grid layout para mostrar cartas.
 * @param {Object} props
 * @param {Array} props.cards - Array de objetos de carta
 * @param {boolean} props.isLoading - Estado de carga
 * @param {Function} props.onCardClick - Manejador de click en carta
 */
const CardGrid = ({ cards, isLoading, onCardClick }) => {
    if (isLoading) {
        return (
            <div className="card-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (!cards || cards.length === 0) {
        return (
            <div className="no-cards">
                <p>No se encontraron cartas.</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    Intenta ajustar tus filtros de búsqueda o verifica la conexión al servidor.
                </p>
            </div>
        );
    }

    return (
        <div className="card-grid">
            {cards.map((card) => (
                <Card
                    key={card.id || card.name}
                    card={card}
                    onClick={onCardClick}
                />
            ))}
        </div>
    );
};

export default CardGrid;
