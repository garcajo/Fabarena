import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component that resets window scroll to top on every route change.
 * It doesn't render anything.
 */
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Reset scroll to top
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};

export default ScrollToTop;
