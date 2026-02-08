import React from 'react';
import Hero from '../components/Hero';
import RecentCards from '../components/RecentCards';
import AdBanner from '../components/AdBanner';

const Home = () => {
    return (
        <div>
            <Hero />
            <div className="container">
                <AdBanner position="top" />
                <RecentCards />
            </div>
        </div>
    );
};

export default Home;
