import React, { useState } from 'react';
import CardList from '../components/CardList';
import CardFilters from '../components/CardFilters';
import Pagination from '../components/Pagination';
import CardModal from '../components/CardModal';
import { useCards } from '../hooks/useCards';
import { useLanguage } from '../context/LanguageContext';
import AdBanner from '../components/AdBanner';

const Cards = () => {
    const { t } = useLanguage();
    const {
        cards,
        loading,
        error,
        totalCount,
        currentPage,
        totalPages,
        goToPage,
        filters,
        setFilters
    } = useCards();

    const [selectedCard, setSelectedCard] = useState(null);

    return (
        <div className="container">
            <div style={{ padding: '2rem 0' }}>
                <AdBanner position="top" adSlot="8911247227" />
                <h1 style={{ marginBottom: '1rem' }}>{t('cardsPage.title') || 'Card Database'}</h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                    {t('cardsPage.subtitle') || 'Explore the complete library of Flesh and Blood cards.'}
                    {totalCount > 0 && ` ${t('cardsPage.showing_results')} ${cards.length} ${t('cardsPage.of')} ${totalCount} ${t('cardsPage.cards')}.`}
                </p>

                <CardFilters
                    filters={filters}
                    onFilterChange={setFilters}
                    isLoading={loading}
                />

                {error && (
                    <div style={{
                        color: 'var(--color-pitch-red)',
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1rem'
                    }}>
                        <strong>{t('cardsPage.error_loading')}</strong> {error}
                        <br />
                        <small>{t('cardsPage.backend_check')}</small>
                    </div>
                )}

                <CardList
                    cards={cards}
                    isLoading={loading}
                    onCardClick={setSelectedCard}
                />

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                />

                {selectedCard && (
                    <CardModal
                        card={selectedCard}
                        onClose={() => setSelectedCard(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default Cards;
