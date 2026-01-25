import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import '../styles/Card.css';

/**
 * Card component para mostrar cartas individuales de FAB.
 * @param {Object} props
 * @param {Object} props.card - Objeto con datos de la carta
 * @param {Function} props.onClick - Manejador de click
 */
const Card = ({ card, onClick }) => {
    const { t } = useLanguage();

    // Determinar la clase de color basada en pitch
    const getPitchClass = (pitch) => {
        switch (parseInt(pitch)) {
            case 1: return 'pitch-red';
            case 2: return 'pitch-yellow';
            case 3: return 'pitch-blue';
            default: return '';
        }
    };

    return (
        <div
            className="card-item"
            onClick={() => onClick && onClick(card)}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div className={`card-image-container ${getPitchClass(card.pitch)}`}>
                {card.imagen ? (
                    <img src={card.imagen} alt={card.name} className="card-image" loading="lazy" />
                ) : (
                    <div className="card-placeholder">
                        <span>{card.name}</span>
                    </div>
                )}
            </div>
            <div className="card-info">
                <h3 className="card-name">{card.name}</h3>
                <div className="card-meta">
                    <span className="card-class">{card.clase}</span>
                    {card.costo !== undefined && card.costo !== null && (
                        <span className="card-cost">{t('card.cost')}: {card.costo}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Card;
