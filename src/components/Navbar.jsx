import React, { useState, useEffect, useRef } from 'react';
import * as Icons from './Icons';
import { translations } from './translations';

export default function Navbar({ 
  lang, 
  setLang, 
  isOnline = true, 
  fontScale = 'standard', 
  toggleFontScale, 
  contrastMode = 'standard', 
  toggleContrastMode,
  isScrolled = false,
  isMobile = false,
  currentView = 'home',
  currentUser = null,
  onPortalClick,
  onDashboardClick,
  onLogout,
  translations: dynamicTranslations,
  onAboutTabSelect,
  onManualClick,
  onHomeClick,
  showInstallBtn = false,
  onInstallApp
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const activeTranslations = dynamicTranslations || translations;
  const t = activeTranslations[lang] || activeTranslations.en;
  
  const langRef = useRef(null);
  const prefsRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      // Track active section on scroll
      const sections = ['home', 'about', 'services', 'gallery', 'socials', 'contact'];
      const scrollPosition = window.scrollY + 150; // offset for the taller header

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    // Close menus on click outside
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setIsLangOpen(false);
      }
      if (prefsRef.current && !prefsRef.current.contains(e.target)) {
        setIsPrefsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsLangOpen(false);
    setIsPrefsOpen(false);
  };

  const handleNavClick = (sectionId) => {
    setIsMenuOpen(false);
    setIsLangOpen(false);
    setIsPrefsOpen(false);
    
    if (currentView !== 'home') {
      if (onHomeClick) {
        onHomeClick();
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) {
            const offset = isMobile ? 80 : (isScrolled ? 105 : 130);
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = el.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            setActiveSection(sectionId);
          }
        }, 150);
      }
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        const offset = isMobile ? 80 : (isScrolled ? 105 : 130); // height of navbar + ticker
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        setActiveSection(sectionId);
      }
    }
  };

  return (
    <header className={`header ${isScrolled ? 'header-scrolled' : ''}`} style={{
      padding: isMobile ? '10px 0' : (isScrolled ? '12px 0 6px 0' : '18px 0 10px 0'),
      height: 'auto',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      borderBottom: isScrolled ? '1px solid rgba(255,255,255,0.08)' : 'none'
    }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        
        {/* Row 1: Brand & Actions Panel */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          
          {/* Logo & Corrected Company Spelling */}
          <a href="#home" className="logo" onClick={(e) => { e.preventDefault(); handleNavClick('home'); }}>
            <img src="/logo.webp" alt="Jeroma Farmers Logo" className="logo-img" />
            <div className="logo-text-wrapper">
              <span className="logo-title">JEROMA FARMERS</span>
              <span className="logo-subtitle">Collection Centre Ltd</span>
            </div>
          </a>

          {/* Desktop Row 1 Options */}
          <div className="nav-actions-desktop">
            
            {/* Live Online/Offline Connectivity Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: isOnline ? 'rgba(82, 183, 136, 0.08)' : 'rgba(244, 162, 97, 0.08)',
              border: isOnline ? '1px solid rgba(82, 183, 136, 0.2)' : '1px solid rgba(244, 162, 97, 0.2)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: isOnline ? 'var(--color-text-white)' : '#d97706',
              userSelect: 'none'
            }}>
              <span style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: isOnline ? 'var(--color-text-white)' : '#f4a261', 
                display: 'inline-block',
                animation: 'wa-pulse 1.5s infinite'
              }}></span>
              <span>{isOnline ? (lang === 'en' ? 'Online' : 'Connected') : 'Offline'}</span>
            </div>

            {/* Accessibility Settings Toggle Button */}
            <div className="pref-switcher-container" style={{ position: 'relative' }} ref={prefsRef}>
              <button
                className="lang-switcher-btn"
                onClick={() => { setIsPrefsOpen(!isPrefsOpen); setIsLangOpen(false); }}
                aria-label="Accessibility Preferences"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '38px',
                  height: '38px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
              >
                <Icons.Settings size={18} style={{ color: '#ffffff' }} />
              </button>

              {/* Accessibility Settings Dropdown Menu */}
              {isPrefsOpen && (
                <div
                  className="lang-dropdown-menu glass-panel"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '260px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    zIndex: 1100,
                    boxShadow: 'var(--shadow-lg)',
                    animation: 'fadeIn 0.2s ease'
                  }}
                >
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '6px' }}>
                    {lang === 'en' ? 'Visual Preferences' : 'Nen me Settings'}
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', margin: 0 }}>
                      {lang === 'en' ? 'Text Scale' : 'Pek me Text'}
                    </p>
                    <button 
                      className={`lang-option-btn ${fontScale === 'large' ? 'active' : ''}`}
                      onClick={toggleFontScale}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}
                    >
                      <Icons.Type size={14} />
                      <span style={{ fontSize: '0.8rem' }}>{fontScale === 'large' ? (lang === 'en' ? 'Large (Active)' : 'Dongo (Tye Ka Tic)') : (lang === 'en' ? 'Set Large (1.25x)' : 'Keto me Dongo')}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', margin: 0 }}>
                      {lang === 'en' ? 'Legibility Theme' : 'Contrast me Theme'}
                    </p>
                    <button 
                      className={`lang-option-btn ${contrastMode === 'high' ? 'active' : ''}`}
                      onClick={toggleContrastMode}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}
                    >
                      <Icons.Eye size={14} />
                      <span style={{ fontSize: '0.8rem' }}>{contrastMode === 'high' ? (lang === 'en' ? 'High Contrast (Active)' : 'Contrast Mamit (Active)') : (lang === 'en' ? 'Set High Contrast' : 'Keto Contrast Mode')}</span>
                    </button>
                  </div>

                  {showInstallBtn && (
                    <div style={{ marginTop: '8px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '8px' }}>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => { setIsPrefsOpen(false); onInstallApp(); }}
                        style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '6px 10px', background: 'var(--color-secondary)', color: 'var(--color-primary-dark)', fontWeight: 800 }}
                      >
                        📲 {lang === 'en' ? 'Install Jeroma App' : 'Keto Jeroma App'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <div className="lang-switcher-container" style={{ position: 'relative' }} ref={langRef}>
              <button 
                className="lang-switcher-btn" 
                onClick={() => { setIsLangOpen(!isLangOpen); setIsPrefsOpen(false); }}
                aria-label="Change language"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: '#ffffff',
                  transition: 'var(--transition-fast)'
                }}
              >
                <span>🌐</span>
                <span>{{ en: 'English', luo: 'Luo (Lango)' }[lang] ?? 'English'}</span>
                <Icons.ChevronDown size={14} style={{ transform: isLangOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {isLangOpen && (
                <div 
                  className="lang-dropdown-menu glass-panel" 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '160px',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    zIndex: 1100,
                    boxShadow: 'var(--shadow-lg)'
                  }}
                >
                  <button 
                    className={`lang-option-btn ${lang === 'en' ? 'active' : ''}`}
                    onClick={() => { setLang('en'); setIsLangOpen(false); }}
                  >
                    English
                  </button>
                  <button 
                    className={`lang-option-btn ${lang === 'luo' ? 'active' : ''}`}
                    onClick={() => { setLang('luo'); setIsLangOpen(false); }}
                  >
                    Luo (Lango)
                  </button>
                </div>
              )}
            </div>

            {currentUser ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-primary nav-cta-desktop" 
                  style={{ display: 'inline-flex', padding: '10px 18px', fontSize: '0.85rem' }}
                  onClick={onDashboardClick}
                >
                  <Icons.Users size={16} />
                  <span>{t.navDashboard}</span>
                </button>
                <button 
                  className="btn btn-outline" 
                  style={{ display: 'inline-flex', padding: '10px 14px', fontSize: '0.85rem', borderColor: 'rgba(217, 4, 41, 0.4)', color: '#d90429' }}
                  onClick={onLogout}
                >
                  <span>{t.navLogout}</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-outline" 
                  style={{ display: 'inline-flex', padding: '10px 16px', fontSize: '0.85rem', borderColor: 'var(--color-primary-light)', color: 'var(--color-primary-light)' }}
                  onClick={onPortalClick}
                >
                  <Icons.Users size={16} />
                  <span>{t.navPortal}</span>
                </button>
                <button 
                  className="btn btn-primary nav-cta-desktop" 
                  style={{ display: 'inline-flex', padding: '10px 18px', fontSize: '0.85rem' }}
                  onClick={() => handleNavClick('contact')}
                >
                  <span>{t.navJoinUs}</span>
                  <Icons.ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger toggle and Portal/Login button */}
          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {currentUser ? (
                <button 
                  className="btn btn-primary" 
                  onClick={onDashboardClick}
                  style={{ 
                    padding: '8px 12px', 
                    fontSize: '0.8rem', 
                    height: '38px',
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 10px rgba(82, 183, 136, 0.15)',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Icons.Users size={14} />
                  <span>Portal</span>
                </button>
              ) : (
                <button 
                  onClick={onPortalClick}
                  style={{ 
                    padding: '8px 12px', 
                    fontSize: '0.8rem', 
                    height: '38px',
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    borderRadius: '8px',
                    background: 'var(--color-secondary)',
                    color: 'var(--color-primary-dark)',
                    border: 'none',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-heading)',
                    boxShadow: '0 4px 10px rgba(233,196,106,0.25)'
                  }}
                >
                  <Icons.Users size={14} />
                  <span>Login</span>
                </button>
              )}
              
              <button 
                className="nav-toggle" 
                onClick={toggleMenu} 
                aria-label="Toggle navigation menu"
                aria-expanded={isMenuOpen}
                style={{
                  padding: '9px',
                  borderRadius: '8px',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  background: isMenuOpen ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
              >
                {isMenuOpen ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                )}
              </button>
            </div>
          ) : (
            <button 
              className="nav-toggle" 
              onClick={toggleMenu} 
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen}
              style={{
                padding: '9px',
                borderRadius: '8px',
                border: '1.5px solid rgba(255, 255, 255, 0.2)',
                background: isMenuOpen ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                minWidth: '44px',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
            >
              {isMenuOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </button>
          )}

        </div>

        {/* Mobile Slide-Out Drawer Menu */}
        {isMobile && isMenuOpen && (
          <ul className="nav-menu active" style={{ display: 'flex', flexDirection: 'column' }}>
            <li>
              <a 
                href="#home" 
                className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleNavClick('home'); }}
              >
                {t.navHome}
              </a>
            </li>
            <li>
              <a 
                href="#about" 
                className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleNavClick('about'); }}
              >
                {t.navAbout}
              </a>
            </li>
            <li>
              <a 
                href="#about" 
                className="nav-link"
                onClick={(e) => { 
                  e.preventDefault(); 
                  setIsMenuOpen(false);
                  if (onAboutTabSelect) onAboutTabSelect('staffs'); 
                }}
              >
                {lang === 'en' ? 'Staffs' : 'Luwak me Tic'}
              </a>
            </li>
            <li>
              <a 
                href="#about" 
                className="nav-link"
                onClick={(e) => { 
                  e.preventDefault(); 
                  setIsMenuOpen(false);
                  if (onAboutTabSelect) onAboutTabSelect('partners'); 
                }}
              >
                {lang === 'en' ? 'Partners' : 'Oribbe mwa'}
              </a>
            </li>
            <li>
              <a 
                href="#services" 
                className={`nav-link ${activeSection === 'services' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleNavClick('services'); }}
              >
                {t.navServices}
              </a>
            </li>
            <li>
              <a 
                href="#gallery" 
                className={`nav-link ${activeSection === 'gallery' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleNavClick('gallery'); }}
              >
                {t.navGallery}
              </a>
            </li>
            <li>
              <a 
                href="#socials" 
                className={`nav-link ${activeSection === 'socials' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleNavClick('socials'); }}
              >
                {t.navCommunity}
              </a>
            </li>
            <li>
              <a 
                href="#contact" 
                className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); handleNavClick('contact'); }}
              >
                {t.navContact}
              </a>
            </li>
            <li>
              <a
                href="#manual"
                className={`nav-link ${currentView === 'manual' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); if (onManualClick) onManualClick(); }}
                style={{ color: 'var(--color-secondary)', fontWeight: 700 }}
              >
                📖 {lang === 'en' ? 'Training Manual' : 'Leb me Pwonj'}
              </a>
            </li>
            <li>
              <button
                className="nav-link chatbot-nav-trigger"
                onClick={(e) => { 
                  e.preventDefault(); 
                  setIsMenuOpen(false);
                  const launcher = document.querySelector('.chatbot-launcher');
                  if (launcher) launcher.click();
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  color: 'var(--color-secondary)',
                  fontWeight: 700,
                  padding: '12px 24px',
                  width: '100%',
                  textAlign: 'left'
                }}
              >
                💬 <span>{lang === 'en' ? 'Ask Jeroma AI' : 'Penye Jeroma AI'}</span>
              </button>
            </li>
            
            <li className="mobile-only-lang" style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px', textAlign: 'center', textTransform: 'uppercase' }}>
                🌐 {lang === 'en' ? 'Select Language' : 'Yer Lok'}
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px' }}>
                <button 
                  className={`btn-lang-tab ${lang === 'en' ? 'active' : ''}`} 
                  onClick={() => setLang('en')}
                >
                  English
                </button>
                <button 
                  className={`btn-lang-tab ${lang === 'luo' ? 'active' : ''}`} 
                  onClick={() => setLang('luo')}
                >
                  Luo
                </button>
              </div>

              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px', textAlign: 'center', textTransform: 'uppercase' }}>
                ⚙️ {lang === 'en' ? 'Visual Settings' : 'Nen me Settings'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 16px' }}>
                <button 
                  className="btn btn-outline" 
                  onClick={toggleFontScale}
                  style={{ justifyContent: 'center', padding: '8px 12px', fontSize: '0.85rem' }}
                >
                  <Icons.Type size={16} />
                  <span>{fontScale === 'large' ? (lang === 'en' ? 'Use Standard Text' : 'Keto Text me Standard') : (lang === 'en' ? 'Use Large Text (1.25x)' : 'Keto Text me Dongo')}</span>
                </button>
                <button 
                  className="btn btn-outline" 
                  onClick={toggleContrastMode}
                  style={{ justifyContent: 'center', padding: '8px 12px', fontSize: '0.85rem' }}
                >
                  <Icons.Eye size={16} />
                  <span>{contrastMode === 'high' ? (lang === 'en' ? 'Use Standard Theme' : 'Keto Theme me Standard') : (lang === 'en' ? 'High Contrast Mode' : 'Contrast Mode Mamit')}</span>
                </button>
                {showInstallBtn && (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => { setIsMenuOpen(false); onInstallApp(); }}
                    style={{ justifyContent: 'center', padding: '8px 12px', fontSize: '0.85rem', background: 'var(--color-secondary)', color: 'var(--color-primary-dark)', fontWeight: 800, marginTop: '4px' }}
                  >
                    <span>📲 {lang === 'en' ? 'Install Jeroma App' : 'Keto Jeroma App'}</span>
                  </button>
                )}
              </div>
            </li>
            
            {currentUser ? (
              <li style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 16px' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => { setIsMenuOpen(false); onDashboardClick(); }}
                >
                  <Icons.Users size={16} />
                  <span>{t.navDashboard}</span>
                </button>
                <button 
                  className="btn btn-outline" 
                  style={{ width: '100%', justifyContent: 'center', borderColor: '#d90429', color: '#d90429' }}
                  onClick={() => { setIsMenuOpen(false); onLogout(); }}
                >
                  <span>{t.navLogout}</span>
                </button>
              </li>
            ) : (
              <li style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 16px' }}>
                <button 
                  className="btn btn-outline" 
                  style={{ width: '100%', justifyContent: 'center', borderColor: 'rgba(255, 255, 255, 0.3)', color: '#ffffff' }}
                  onClick={() => { setIsMenuOpen(false); onPortalClick(); }}
                >
                  <Icons.Users size={16} />
                  <span>{t.navPortal}</span>
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => handleNavClick('contact')}
                >
                  {t.navJoinUs}
                </button>
              </li>
            )}
          </ul>
        )}

        {/* Row 2: Centered Desktop Navigation Tabs */}
        {!isMobile && (
          <nav className="desktop-only-tabs-container" style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '12px',
            marginTop: '4px'
          }}>
            <ul style={{
              display: 'flex',
              listStyle: 'none',
              gap: '36px',
              margin: 0,
              padding: 0,
              justifyContent: 'center'
            }}>
              <li>
                <a 
                  href="#home" 
                  className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); handleNavClick('home'); }}
                >
                  {t.navHome}
                </a>
              </li>
              <li>
                <a 
                  href="#about" 
                  className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); handleNavClick('about'); }}
                >
                  {t.navAbout}
                </a>
              </li>
              <li>
                <a 
                  href="#about" 
                  className="nav-link"
                  onClick={(e) => { 
                    e.preventDefault(); 
                    if (onAboutTabSelect) onAboutTabSelect('staffs'); 
                  }}
                >
                  {lang === 'en' ? 'Staffs' : 'Luwak me Tic'}
                </a>
              </li>
              <li>
                <a 
                  href="#about" 
                  className="nav-link"
                  onClick={(e) => { 
                    e.preventDefault(); 
                    if (onAboutTabSelect) onAboutTabSelect('partners'); 
                  }}
                >
                  {lang === 'en' ? 'Partners' : 'Oribbe mwa'}
                </a>
              </li>
              <li>
                <a 
                  href="#services" 
                  className={`nav-link ${activeSection === 'services' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); handleNavClick('services'); }}
                >
                  {t.navServices}
                </a>
              </li>
              <li>
                <a 
                  href="#gallery" 
                  className={`nav-link ${activeSection === 'gallery' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); handleNavClick('gallery'); }}
                >
                  {t.navGallery}
                </a>
              </li>
              <li>
                <a 
                  href="#socials" 
                  className={`nav-link ${activeSection === 'socials' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); handleNavClick('socials'); }}
                >
                  {t.navCommunity}
                </a>
              </li>
              <li>
                <a 
                  href="#contact" 
                  className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); handleNavClick('contact'); }}
                >
                  {t.navContact}
                </a>
              </li>
              <li>
                <a
                  href="#manual"
                  className={`nav-link ${currentView === 'manual' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); if (onManualClick) onManualClick(); }}
                  style={{ color: '#ffffff', fontWeight: 700 }}
                >
                  📖 {lang === 'en' ? 'Training Manual' : 'Leb me Pwonj'}
                </a>
              </li>
              <li>
                <button
                  className="nav-link chatbot-nav-trigger"
                  onClick={(e) => { 
                    e.preventDefault(); 
                    const launcher = document.querySelector('.chatbot-launcher');
                    if (launcher) launcher.click();
                  }}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    color: 'var(--color-secondary)',
                    fontWeight: 700,
                    padding: '8px 12px'
                  }}
                >
                  💬 <span>{lang === 'en' ? 'Ask Jeroma AI' : 'Penye Jeroma AI'}</span>
                </button>
              </li>
            </ul>
          </nav>
        )}

      </div>
    </header>
  );
}
