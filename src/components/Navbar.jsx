import React, { useState, useRef } from 'react';
import { Menu, X, Layers, Box, Layout as LayoutIcon, LogOut, Search, Package, PlusCircle, Settings, BookOpen, User, Crown, ShieldBan, Camera, Home } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';



/**
 * Navbar component with responsive mobile menu.
 */
const Navbar = () => {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const dropdownTimeoutRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const navbarToggleRef = useRef(null);

  // Mobile Menu Logic
  const [activeMobileMenu, setActiveMobileMenu] = useState(null); // 'nav', 'user', or null

  const toggleMobileNav = () => {
    setActiveMobileMenu(activeMobileMenu === 'nav' ? null : 'nav');
  };

  const toggleMobileUser = () => {
    setActiveMobileMenu(activeMobileMenu === 'user' ? null : 'user');
  };

  const closeMobileMenu = () => {
    setActiveMobileMenu(null);
  };

  // User Dropdown Logic
  const [isUserOpen, setIsUserOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const userTimeoutRef = useRef(null);

  // Library Dropdown Logic
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const libraryDropdownRef = useRef(null);
  const libraryTimeoutRef = useRef(null);

  // Encyclopedia Dropdown Logic
  const [isEncyclopediaOpen, setIsEncyclopediaOpen] = useState(false);
  const encyclopediaDropdownRef = useRef(null);
  const encyclopediaTimeoutRef = useRef(null);

  // Search Dropdown Logic
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchMode, setSearchMode] = useState('cards'); // 'cards' or 'decks'
  const [deckSearchType, setDeckSearchType] = useState('hero'); // 'hero', 'username', 'name'
  const [searchTerm, setSearchTerm] = useState('');
  const searchDropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setIsSearchOpen(false); // Close dropdown on search
      if (searchMode === 'cards') {
        navigate(`/cards?search=${encodeURIComponent(searchTerm)}`);
      } else {
        // Deck Search Logic
        if (deckSearchType === 'hero') {
          navigate(`/decks?hero=${encodeURIComponent(searchTerm)}`);
        } else if (deckSearchType === 'username') {
          navigate(`/decks?username=${encodeURIComponent(searchTerm)}`);
        } else {
          navigate(`/decks?name=${encodeURIComponent(searchTerm)}`);
        }
      }
    }
  };

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      // User Dropdown
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserOpen(false);
      }
      // Library Dropdown
      if (libraryDropdownRef.current && !libraryDropdownRef.current.contains(event.target)) {
        setIsLibraryOpen(false);
      }
      // Encyclopedia Dropdown
      if (encyclopediaDropdownRef.current && !encyclopediaDropdownRef.current.contains(event.target)) {
        setIsEncyclopediaOpen(false);
      }
      // Search Dropdown
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
      // Mobile Menu Click Outside
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) &&
        navbarToggleRef.current && !navbarToggleRef.current.contains(event.target)) {
        setActiveMobileMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleUserEnter = () => {
    if (userTimeoutRef.current) {
      clearTimeout(userTimeoutRef.current);
      userTimeoutRef.current = null;
    }
  };

  const handleUserLeave = () => {
    userTimeoutRef.current = setTimeout(() => {
      setIsUserOpen(false);
    }, 1500); // 1.5 seconds delay
  };

  const handleLibraryEnter = () => {
    if (libraryTimeoutRef.current) {
      clearTimeout(libraryTimeoutRef.current);
      libraryTimeoutRef.current = null;
    }
  };

  const handleLibraryLeave = () => {
    libraryTimeoutRef.current = setTimeout(() => {
      setIsLibraryOpen(false);
    }, 1500); // 1.5 seconds delay
  };

  const handleEncyclopediaEnter = () => {
    if (encyclopediaTimeoutRef.current) {
      clearTimeout(encyclopediaTimeoutRef.current);
      encyclopediaTimeoutRef.current = null;
    }
  };

  const handleEncyclopediaLeave = () => {
    encyclopediaTimeoutRef.current = setTimeout(() => {
      setIsEncyclopediaOpen(false);
    }, 1500);
  };


  const displayName = user?.user_metadata?.username || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  const navLinks = [
    { name: t('nav.cards'), path: '/cards', icon: <Layers size={18} /> },
    { name: t('nav.decks'), path: '/decks', icon: <LayoutIcon size={18} /> },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container container" style={{ position: 'relative' }}>
        <div className="navbar-start">
          <Link to="/" className="navbar-logo">
            <span className="logo-text desktop-only">FabArena</span>
          </Link>
          {/* Mobile Home Button */}
          <Link
            to="/"
            className="navbar-item mobile-only"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px'
            }}
            title={t('nav.home')}
          >
            <Home size={20} />
          </Link>

          {/* Search and Menu Wrapper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {/* Search Dropdown */}
            <div
              className="navbar-item-dropdown"
              style={{ position: 'relative' }}
              ref={searchDropdownRef}
            >
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`navbar-item ${isSearchOpen ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title={t('hero.search_button')}
              >
                <Search size={18} />
              </button>

              {/* Search Dropdown Content */}
              <div
                className={`dropdown-content search-dropdown ${isSearchOpen ? 'show' : ''}`}
              >
                <div className="mini-search-container">
                  <div className="mini-search-toggles">
                    <button
                      className={`mini-mode-toggle ${searchMode === 'cards' ? 'active' : ''}`}
                      onClick={() => setSearchMode('cards')}
                    >
                      {t('hero.mode_cards')}
                    </button>
                    <button
                      className={`mini-mode-toggle ${searchMode === 'decks' ? 'active' : ''}`}
                      onClick={() => setSearchMode('decks')}
                    >
                      {t('hero.mode_decks')}
                    </button>
                  </div>

                  {searchMode === 'decks' && (
                    <div className="mini-search-suboptions">
                      <button
                        className={`sub-filter-btn ${deckSearchType === 'hero' ? 'active' : ''}`}
                        onClick={() => setDeckSearchType('hero')}
                      >
                        {t('hero.filter_hero')}
                      </button>
                      <button
                        className={`sub-filter-btn ${deckSearchType === 'username' ? 'active' : ''}`}
                        onClick={() => setDeckSearchType('username')}
                      >
                        {t('hero.filter_user')}
                      </button>
                      <button
                        className={`sub-filter-btn ${deckSearchType === 'name' ? 'active' : ''}`}
                        onClick={() => setDeckSearchType('name')}
                      >
                        {t('hero.filter_title')}
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSearch} className="mini-search-form">
                    <input
                      type="text"
                      className="mini-search-input"
                      placeholder={
                        searchMode === 'cards'
                          ? t('hero.search_cards_placeholder')
                          : deckSearchType === 'hero' ? t('hero.placeholder_hero')
                            : deckSearchType === 'username' ? t('hero.placeholder_user')
                              : t('hero.placeholder_title')
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      autoFocus
                    />
                  </form>
                </div>
              </div>
            </div>

            {/* Nav Button (Hamburger) - Relocated to Left */}
            <button
              onClick={toggleMobileNav}
              className={`navbar-item mobile-only ${activeMobileMenu === 'nav' ? 'active' : ''}`}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                marginLeft: 0
              }}
            >
              {activeMobileMenu === 'nav' ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>


          {/* Library Dropdown (Moved to Left) */}
          <div
            className="navbar-item-dropdown desktop-only"
            style={{ position: 'relative' }}
            ref={libraryDropdownRef}
            onMouseEnter={handleLibraryEnter}
            onMouseLeave={handleLibraryLeave}
          >
            <button
              onClick={() => setIsLibraryOpen(!isLibraryOpen)}
              className={`navbar-item ${location.pathname.includes('/cards') || location.pathname.includes('/decks') ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', display: 'flex', alignItems: 'center' }}
              title={t('nav.library')}
            >
              <Layers size={18} />
            </button>

            {/* Dropdown Content */}
            <div
              className={`dropdown-content ${isLibraryOpen ? 'show' : ''}`}
              style={{
                left: '0',
                transform: 'translate(0, 10px)',
                minWidth: '200px',
                textAlign: 'left'
              }}
            >
              <Link to="/cards" className="dropdown-link" onClick={() => setIsLibraryOpen(false)}>
                <Box size={16} />
                <span>{t('nav.explore_cards')}</span>
              </Link>
              <Link to="/decks" className="dropdown-link" onClick={() => setIsLibraryOpen(false)}>
                <LayoutIcon size={16} />
                <span>{t('nav.explore_decks')}</span>
              </Link>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.25rem 0' }}></div>
              <Link to="/decks/new" className="dropdown-link" onClick={() => setIsLibraryOpen(false)} style={{ color: 'var(--color-primary-gold)' }}>
                <PlusCircle size={16} />
                <span>{t('nav.create_deck')}</span>
              </Link>
            </div>
          </div>

          {/* Encyclopedia Dropdown */}
          <div
            className="navbar-item-dropdown desktop-only"
            style={{ position: 'relative' }}
            ref={encyclopediaDropdownRef}
            onMouseEnter={handleEncyclopediaEnter}
            onMouseLeave={handleEncyclopediaLeave}
          >
            <button
              onClick={() => setIsEncyclopediaOpen(!isEncyclopediaOpen)}
              className={`navbar-item ${location.pathname.includes('/heroes') ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', display: 'flex', alignItems: 'center' }}
              title={t('nav.encyclopedia')}
            >
              <BookOpen size={18} />
            </button>

            {/* Dropdown Content */}
            <div
              className={`dropdown-content ${isEncyclopediaOpen ? 'show' : ''}`}
              style={{
                left: '0',
                transform: 'translate(0, 10px)',
                minWidth: '200px',
                textAlign: 'left'
              }}
            >
              <Link to="/heroes" className="dropdown-link" onClick={() => setIsEncyclopediaOpen(false)}>
                <User size={16} />
                <span>{t('nav.heroes')}</span>
              </Link>
              <Link to="/living-legend" className="dropdown-link" onClick={() => setIsEncyclopediaOpen(false)}>
                <Crown size={16} />
                <span>{t('nav.living_legend')}</span>
              </Link>
              <Link to="/bans" className="dropdown-link" onClick={() => setIsEncyclopediaOpen(false)}>
                <ShieldBan size={16} />
                <span>{t('nav.bans') || "Bans & Restrictions"}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Language Selector - Centered Absolutely */}
        <div className="language-selector desktop-only" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <button
            onClick={() => setLanguage('es')}
            className={`lang-btn ${language === 'es' ? 'active' : ''}`}
            title="Español"
          >
            🇪🇸
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
            title="English"
          >
            🇬🇧
          </button>
        </div>

        {/* Mobile Language Selector - Centered Absolutely (Same Position as Desktop) */}
        <div className="language-selector mobile-only" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <button
            onClick={() => setLanguage('es')}
            className={`lang-btn ${language === 'es' ? 'active' : ''}`}
            title="Español"
          >
            🇪🇸
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
            title="English"
          >
            🇬🇧
          </button>
        </div>

        <ul className="navbar-menu">
          {/* User Auth Section */}
          <li>
            {user ? (
              <div
                className="navbar-item-dropdown"
                style={{ position: 'relative' }}
                ref={userDropdownRef}
                onMouseEnter={handleUserEnter}
                onMouseLeave={handleUserLeave}
              >
                <div
                  className="navbar-item user-profile-chip"
                  onClick={() => setIsUserOpen(!isUserOpen)}
                >
                  <div className="user-avatar">
                    <span className="user-initial">{displayName.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="user-name">{displayName}</span>
                </div>

                {/* User Dropdown Content */}
                <div
                  className={`dropdown-content ${isUserOpen ? 'show' : ''}`}
                  style={{
                    left: '50%',
                    right: 'auto',
                    transform: 'translate(-50%, 10px)',
                    minWidth: '160px'
                  }}
                >
                  {/* Position adjustment to align right */}
                  <Link to="/collection" className="dropdown-link" onClick={() => setIsUserOpen(false)}>
                    <Package size={16} />
                    <span>{t('nav.collection')}</span>
                  </Link>
                  <Link to="/my-decks" className="dropdown-link" onClick={() => setIsUserOpen(false)}>
                    <LayoutIcon size={16} />
                    <span>{t('nav.your_decks') || 'Your Decks'}</span>
                  </Link>
                  <Link to="/settings" className="dropdown-link" onClick={() => setIsUserOpen(false)}>
                    <Settings size={16} />
                    <span>{t('nav.settings') || 'Settings'}</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsUserOpen(false);
                      logout();
                    }}
                    className="dropdown-link"
                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
                  >
                    <LogOut size={16} className="text-red" />
                    <span className="text-red">{t('auth.logout')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Link to="/login" className="navbar-login-btn">
                  {t('auth.login_button')}
                </Link>
                <Link to="/register" className="navbar-register-btn">
                  {t('auth.submit')}
                </Link>
              </div>
            )}
          </li>
        </ul>

        {/* Mobile Menu Toggle Section - Updated for Separated Logic */}
        <div
          className="navbar-toggle"
          ref={navbarToggleRef}
          style={{ cursor: 'pointer', gap: '1rem' }}
        >
          {/* User Button (Mobile Only) */}
          {user ? (
            <div
              className={`user-avatar ${activeMobileMenu === 'user' ? 'active-ring' : ''}`}
              onClick={toggleMobileUser}
              style={{
                width: '36px',
                height: '36px',
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: activeMobileMenu === 'user' ? '0 0 0 2px var(--color-primary-red)' : 'none',
                transition: 'box-shadow 0.2s'
              }}
            >
              <span className="user-initial">{displayName.charAt(0).toUpperCase()}</span>
            </div>
          ) : (
            // Keep user-related actions in main menu for logged out
            null
          )}
        </div>
      </div >

      {/* Mobile Menu Content - Conditional Rendering */}
      <div
        className={`mobile-menu ${activeMobileMenu ? 'active' : ''}`}
        ref={mobileMenuRef}
      >
        {/* === NAVIGATION MENU CONTENT === */}
        {activeMobileMenu === 'nav' && (
          <>
            <Link to="/cards" className="mobile-item" onClick={closeMobileMenu} >
              <Box size={18} />
              <span>{t('nav.cards')}</span>
            </Link >
            <Link to="/decks" className="mobile-item" onClick={closeMobileMenu}>
              <LayoutIcon size={18} />
              <span>{t('nav.decks')}</span>
            </Link>
            <Link to="/decks/new" className="mobile-item" onClick={closeMobileMenu} style={{ color: 'var(--color-primary-gold)' }}>
              <PlusCircle size={18} />
              <span>{t('nav.create_deck')}</span>
            </Link>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.5rem 0' }}></div>

            <Link to="/heroes" className="mobile-item" onClick={closeMobileMenu}>
              <BookOpen size={18} />
              <span>{t('nav.heroes')}</span>
            </Link>
            <Link to="/living-legend" className="mobile-item" onClick={closeMobileMenu}>
              <Crown size={18} />
              <span>{t('nav.living_legend')}</span>
            </Link>
            <Link to="/bans" className="mobile-item" onClick={closeMobileMenu}>
              <ShieldBan size={18} />
              <span>{t('nav.bans') || "Bans & Restrictions"}</span>
            </Link>

            {/* Login/Register for Logged Out users in Nav menu */}
            {!user && (
              <>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.5rem 0' }}></div>
                <Link to="/login" className="mobile-item" onClick={closeMobileMenu}>
                  <span>{t('auth.login_button')}</span>
                </Link>
                <Link to="/register" className="mobile-item" onClick={closeMobileMenu} style={{ color: 'var(--color-primary-red)' }}>
                  <span>{t('auth.submit')}</span>
                </Link>
              </>
            )}
          </>
        )}

        {/* === USER MENU CONTENT === */}
        {activeMobileMenu === 'user' && user && (
          <>
            <div className="mobile-item" style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <span className="user-initial" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-primary-red)', borderRadius: '50%', marginRight: '0.5rem', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span>{displayName}</span>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.5rem 0' }}></div>

            <Link to="/collection" className="mobile-item" onClick={closeMobileMenu}>
              <Package size={18} />
              <span>{t('nav.collection')}</span>
            </Link>
            <Link to="/my-decks" className="mobile-item" onClick={closeMobileMenu}>
              <LayoutIcon size={18} />
              <span>{t('nav.your_decks') || 'Your Decks'}</span>
            </Link>
            <Link to="/settings" className="mobile-item" onClick={closeMobileMenu}>
              <Settings size={18} />
              <span>{t('nav.settings') || 'Settings'}</span>
            </Link>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '0.5rem 0' }}></div>

            <button
              className="mobile-item"
              onClick={() => { logout(); closeMobileMenu(); }}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', fontFamily: 'inherit', fontSize: 'inherit', cursor: 'pointer' }}
            >
              <LogOut size={18} className="text-red" />
              <span className="text-red">{t('auth.logout')}</span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
