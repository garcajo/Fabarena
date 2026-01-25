import React from 'react';
import '../styles/CardSkeleton.css';

const CardSkeleton = () => {
    return (
        <div className="card-skeleton">
            <div className="skeleton-image"></div>
            <div className="skeleton-info">
                <div className="skeleton-line title"></div>
                <div className="skeleton-line meta"></div>
            </div>
        </div>
    );
};

export default CardSkeleton;
