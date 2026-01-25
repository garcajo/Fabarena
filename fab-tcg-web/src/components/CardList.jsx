import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import '../styles/CardList.css';

/**
 * List layout for displaying cards (Text Format).
 */
const CardList = ({ cards, isLoading, onCardClick }) => {
    const { t } = useLanguage();

    const getTranslatedRarity = (rarityString) => {
        if (!rarityString) return t('rarities.common');

        const lower = rarityString.toLowerCase().trim();

        if (lower.includes('common') || lower.includes('comun') || lower.includes('común')) return t('rarities.common');
        if (lower.includes('super rare') || lower.includes('súper rara') || lower.includes('super rara')) return t('rarities.super_rare');
        if (lower.includes('rare') || lower.includes('rara')) return t('rarities.rare');
        if (lower.includes('majestic') || lower.includes('majestuosa')) return t('rarities.majestic');
        if (lower.includes('legendary') || lower.includes('legendaria')) return t('rarities.legendary');
        if (lower.includes('fabled') || lower.includes('fabulosa')) return t('rarities.fabled');
        if (lower.includes('marvel') || lower.includes('maravilla') || lower === 'v') return t('rarities.marvel');
        if (lower.includes('promo')) return t('rarities.promo');
        if (lower.includes('token') || lower.includes('ficha')) return t('rarities.token');

        return rarityString;
    };

    if (isLoading) {
        return <div className="loading-state">{t('common.loading')}</div>;
    }

    if (!cards || cards.length === 0) {
        return (
            <div className="no-cards">
                <p>{t('common.no_results') || 'No cards found.'}</p>
            </div>
        );
    }

    return (
        <div className="card-list">
            <div className="card-list-header">
                <div></div>
                <div>{t('common.name') || 'Name'}</div>
                <div>{t('card.set')}</div>
                <div>{t('card.cost')}</div>
                <div>{t('card.pitch')}</div>
                <div>{t('card.power')}</div>
                <div>{t('card.defense')}</div>
                <div>{t('filters.label_class')}</div>
                <div>{t('card.rarity')}</div>
            </div>

            {cards.map((card) => {


                return (
                    <div
                        key={card.id || card.name}
                        className="card-list-row"
                        onClick={() => onCardClick(card)}
                    >
                        <img
                            src={card.imagen}
                            alt={card.name}
                            className="list-image-thumb"
                            loading="lazy"
                        />
                        <div className="list-cell-name">{card.name || card.nombre}</div>
                        <div className="list-cell-set">{card.set || card.set_code}</div>
                        <div className="list-cell-cost">{card.costo}</div>
                        <div className="list-cell-pitch">
                            {Array.from({ length: card.pitch || 0 }).map((_, i) => (
                                <span key={i} className={`pitch-dot pitch-bg-${card.pitch}`} />
                            ))}
                        </div>
                        <div className="list-cell-power">{card.poder}</div>
                        <div className="list-cell-defense">{card.defensa}</div>
                        <div className="list-cell-class">{card.clase}</div>
                        <div className="list-cell-rarity">{getTranslatedRarity(card.rareza)}</div>
                    </div>
                );
            })}
        </div>
    );
};

export default CardList;
