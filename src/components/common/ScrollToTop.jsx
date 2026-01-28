import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component that resets window scroll to top on every route change.
 * It doesn't render anything.
 */
const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Immediate reset
        window.scrollTo(0, 0);

        // Delayed backup for heavy pages/component mounts
        const timeout = setTimeout(() => {
            window.scrollTo(0, 0);
        }, 100);

        return () => clearTimeout(timeout);
    }, [pathname]);

    return null;
};

export default ScrollToTop;
