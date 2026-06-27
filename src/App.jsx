import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Partners from './components/Partners';
import Gallery from './components/Gallery';
import Socials from './components/Socials';
import Contact from './components/Contact';
import Footer from './components/Footer';
import WhatsAppFloat from './components/WhatsAppFloat';
import ChatBot from './components/ChatBot';
import ActivityBanner from './components/ActivityBanner';
import AuthPortal from './components/AuthPortal';
import TrainingManual from './components/TrainingManual';
import * as Icons from './components/Icons';
import { initDb, getCrops, initTranslations, getTranslations, syncOfflineData } from './utils/db';
import { translations as defaultTranslations } from './components/translations';

// Helper to retry dynamic imports when a redeploy changes the chunk hashes (prevents ChunkLoadErrors)
const lazyWithRetry = (componentImport) => 
  lazy(() => 
    componentImport().catch((error) => {
      if (error.name === 'ChunkLoadError' || /Failed to fetch dynamically imported module/i.test(error.message)) {
        console.warn('New deployment detected! Reloading page to fetch latest version...', error);
        window.location.reload();
        return new Promise(() => {}); // Return a pending promise to hold state while page reloads
      }
      throw error;
    })
  );

// Code splitting: Load heavy dashboard components only when needed
const AdminDashboard = lazyWithRetry(() => import('./components/AdminDashboard'));
const ClientDashboard = lazyWithRetry(() => import('./components/ClientDashboard'));

const DashboardFallback = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: 'var(--color-bg-light)' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
      <p style={{ color: '#ffffff', fontSize: '0.9rem' }}>Loading dashboard...</p>
    </div>
  </div>
);

function App() {
  const [lang, setLang] = useState('en');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncToast, setSyncToast] = useState('');
  
  // App View Routing: 'home' | 'portal' | 'dashboard' | 'manual'
  const [currentView, setCurrentView] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);

  // Global Dynamic Pricing State (persisted to/from local storage)
  const [crops, setCrops] = useState({});
  
  // Accessibility States (saved to localStorage for persistent offline use)
  const [fontScale, setFontScale] = useState(() => localStorage.getItem('jeroma_font_scale') || 'standard');
  const [contrastMode, setContrastMode] = useState(() => localStorage.getItem('jeroma_contrast_mode') || 'standard');

  // Responsive & Scroll Tracking for 2-Row Header Layout
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 992 : false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Profile Tab state
  const [activeAboutTab, setActiveAboutTab] = useState('overview');

  // Dynamic translations state (seeded in the bootstrap effect; use static defaults until ready)
  const [translations, setTranslations] = useState(defaultTranslations);

  const refreshTranslations = async () => {
    const latest = await getTranslations();
    if (latest) setTranslations(latest);
  };

  const handleAboutTabClick = (tabId) => {
    setActiveAboutTab(tabId);
    const el = document.getElementById('about');
    if (el) {
      const offset = isMobile ? 80 : (isScrolled ? 105 : 130);
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Ref so the online handler always sees the latest lang without re-registering listeners
  const langRef = useRef(lang);
  useEffect(() => { langRef.current = lang; }, [lang]);

  useEffect(() => {
    // Initialize database (async — fetches from API or falls back to localStorage)
    const bootstrap = async () => {
      await initDb();
      const cropsData = await getCrops();
      setCrops(cropsData || {});

      // Seed translations if not already stored
      await initTranslations(defaultTranslations);
      const translationsData = await getTranslations();
      setTranslations(translationsData || defaultTranslations);

      // Sync offline data if online at boot
      if (navigator.onLine) {
        try {
          await syncOfflineData();
        } catch (e) {
          console.error('Failed to sync offline data on boot:', e);
        }
      }

      // Check if user is already logged in (session preservation)
      const savedUser = localStorage.getItem('jeroma_logged_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setCurrentUser(parsed);
          if (!window.location.hash || window.location.hash === '#home') {
            setCurrentView('dashboard');
          }
        } catch (e) {
          localStorage.removeItem('jeroma_logged_user');
        }
      }
    };
    bootstrap();
  }, []);

  // Hash-based routing effect
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#portal' || hash === '#login') {
        setCurrentView('portal');
      } else if (hash === '#manual') {
        setCurrentView('manual');
      } else if (hash === '#dashboard') {
        const savedUser = localStorage.getItem('jeroma_logged_user');
        if (savedUser) {
          setCurrentView('dashboard');
        } else {
          setCurrentView('portal');
          window.location.hash = '#portal';
        }
      } else if (hash === '' || hash === '#home') {
        setCurrentView('home');
      }
    };
    
    // Check hash on load
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleStateChange = async () => {
    // Refresh crops pricing states when admin updates prices
    const cropsData = await getCrops();
    setCrops(cropsData || {});
    // Refresh translations when admin updates language content
    await refreshTranslations();
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('jeroma_logged_user', JSON.stringify(user));
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('jeroma_logged_user');
    localStorage.removeItem('jeroma_jwt_token');
    setCurrentView('home');
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      handleLogout();
    };
    window.addEventListener('jeroma_unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('jeroma_unauthorized', handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
    };

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    const handleOnline = async () => {
      setIsOnline(true);
      // Read the latest language via ref — avoids re-registering listeners on lang change
      const currentLang = langRef.current;
      const queuedLeads = JSON.parse(localStorage.getItem('jeroma_offline_leads') || '[]');
      if (queuedLeads.length > 0) {
        setSyncToast(
          currentLang === 'en'
            ? `Syncing ${queuedLeads.length} queued offline changes...`
            : `Cogo ${queuedLeads.length} lok me oro oro...`
        );
        
        const result = await syncOfflineData();
        
        if (result.success) {
          setSyncToast(
            currentLang === 'en'
              ? `Reconnected! ${result.successCount} change(s) synchronized successfully.`
              : 'Ocogo maber! Jami me oro oro ducu ocopo maber woko.'
          );
        } else {
          setSyncToast(
            currentLang === 'en'
              ? `Sync partially completed: ${result.successCount} synced, ${result.errorCount} failed.`
              : `Sync okako moko: ${result.successCount} ocogo, ${result.errorCount} pe ocopo.`
          );
        }
        
        setTimeout(() => setSyncToast(''), 4000);
        
        // Refresh local UI states after sync finishes
        await handleStateChange();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps — langRef keeps this in sync without re-registering

  // Persist accessibility changes
  const toggleFontScale = () => {
    const next = fontScale === 'standard' ? 'large' : 'standard';
    setFontScale(next);
    localStorage.setItem('jeroma_font_scale', next);
  };

  const toggleContrastMode = () => {
    const next = contrastMode === 'standard' ? 'high' : 'standard';
    setContrastMode(next);
    localStorage.setItem('jeroma_contrast_mode', next);
  };

  // Dynamic values for the news ticker from localStorage database
  const sunflowerPrice = crops.sunflower ? crops.sunflower.payoutRate : 'UGX 2,200';
  const coffeePrice = crops.coffee ? crops.coffee.payoutRate : 'UGX 12,500';
  const maizePrice = crops.maize ? crops.maize.payoutRate : 'UGX 1,300';
  const beansPrice = crops.beans ? crops.beans.payoutRate : 'UGX 3,100';

  const rawTickerEn = translations.en?.newsTickerText || defaultTranslations.en?.newsTickerText || '';
  const rawTickerLuo = translations.luo?.newsTickerText || defaultTranslations.luo?.newsTickerText || '';

  const formatTicker = (raw) => {
    return raw
      .replace(/{sunflowerPrice}/g, sunflowerPrice)
      .replace(/{coffeePrice}/g, coffeePrice)
      .replace(/{maizePrice}/g, maizePrice)
      .replace(/{beansPrice}/g, beansPrice);
  };

  const newsTicker = {
    en: formatTicker(rawTickerEn),
    luo: formatTicker(rawTickerLuo)
  };

  return (
    <div className={`App view-${currentView} ${fontScale === 'large' ? 'font-large' : ''} ${contrastMode === 'high' ? 'high-contrast' : ''}`}>
      
      {/* Dynamic Header & Navigation (Only shown when not in full-screen Dashboard/Portal mode) */}
      {currentView !== 'dashboard' && currentView !== 'portal' && (
        <>
          {/* Offline Mode Pulse Banner (Only appears when offline) */}
          {!isOnline && (
            <div className="offline-banner" style={{
              backgroundColor: '#f4a261',
              color: '#081c15',
              textAlign: 'center',
              padding: '8px 16px',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              zIndex: 1600,
              position: 'sticky',
              top: isMobile ? '80px' : (isScrolled ? '105px' : '130px'),
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              animation: 'fadeIn 0.3s ease'
            }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#081c15', animation: 'wa-pulse 1.2s infinite' }}></span>
              <span>
                {lang === 'en' 
                  ? "OFFLINE MODE ACTIVE: Harvest Calculator, quality guides, and FAQs are fully available offline!" 
                  : "OFFLINE MODE ACTIVE: Calculator me keyo, moisture checklists, kede FAQs tye fully offline!"}
              </span>
            </div>
          )}

          <Navbar 
            lang={lang} 
            setLang={setLang} 
            isOnline={isOnline}
            fontScale={fontScale}
            toggleFontScale={toggleFontScale}
            contrastMode={contrastMode}
            toggleContrastMode={toggleContrastMode}
            isScrolled={isScrolled}
            isMobile={isMobile}
            currentView={currentView}
            currentUser={currentUser}
            onPortalClick={() => window.open('#portal', '_blank')}
            onDashboardClick={() => setCurrentView('dashboard')}
            onLogout={handleLogout}
            translations={translations}
            onAboutTabSelect={handleAboutTabClick}
            onManualClick={() => setCurrentView('manual')}
            onHomeClick={() => setCurrentView('home')}
          />
          
          {/* Horizontal News Ticker / Moving News - hidden on manual view */}
          {currentView !== 'manual' && (
          <div className="news-ticker-container" style={{
            marginTop: isMobile ? '80px' : (isScrolled ? '105px' : '130px'),
            backgroundColor: 'var(--color-primary-dark)',
            borderBottom: '1px solid rgba(233,196,106,0.2)',
            padding: '10px 0',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 500,
            transition: 'margin-top 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div className="news-ticker-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
              <div className="news-ticker-label" style={{
                background: 'var(--color-secondary)',
                color: 'var(--color-primary-dark)',
                padding: '4px 12px',
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderRadius: '4px',
                marginLeft: '24px',
                marginRight: '12px',
                flexShrink: 0,
                zIndex: 10,
                boxShadow: 'var(--shadow-sm)'
              }}>
                {lang === 'en' ? "Breaking News" : "Nyen Okelle"}
              </div>
              <div className="ticker-text-scroll" style={{
                whiteSpace: 'nowrap',
                display: 'inline-block',
                animation: 'marquee 55s linear infinite',
                color: 'rgba(255, 255, 255, 0.95)',
                fontSize: '0.85rem',
                fontWeight: 500,
                fontFamily: 'var(--font-heading)'
              }}>
                {newsTicker[lang] || newsTicker.en}
              </div>
            </div>
          </div>
          )}

          {/* ── Animated News / Activities / Services Banner ── */}
          {currentView !== 'manual' && <ActivityBanner lang={lang} />}
        </>
      )}

      {/* Main App Workspace Router */}
      <main style={{ marginTop: '0px' }}>
        {currentView === 'home' && (
          <>
            <Hero lang={lang} translations={translations} />
            <About lang={lang} activeTab={activeAboutTab} setActiveTab={setActiveAboutTab} translations={translations} />
            <Services lang={lang} translations={translations} />
            <Gallery lang={lang} translations={translations} />
            <Socials lang={lang} translations={translations} />
            <Partners lang={lang} translations={translations} />
            <Contact lang={lang} translations={translations} />
          </>
        )}

        {currentView === 'manual' && (
          <TrainingManual
            lang={lang}
            onBackToHome={() => setCurrentView('home')}
          />
        )}
        
        {currentView === 'portal' && (
          <AuthPortal 
            lang={lang}
            translations={translations}
            onLoginSuccess={handleLoginSuccess} 
            onCancel={() => setCurrentView('home')} 
          />
        )}

        {currentView === 'dashboard' && currentUser && (
          <Suspense fallback={<DashboardFallback />}>
            {currentUser.role === 'admin' ? (
              <AdminDashboard 
                lang={lang} 
                translations={translations}
                user={currentUser} 
                onLogout={handleLogout} 
                onBackToSite={() => setCurrentView('home')} 
                onStateChange={handleStateChange}
              />
            ) : (
              <ClientDashboard 
                lang={lang} 
                translations={translations}
                user={currentUser} 
                onLogout={handleLogout} 
                onBackToSite={() => setCurrentView('home')} 
              />
            )}
          </Suspense>
        )}
      </main>
      
      {currentView !== 'dashboard' && currentView !== 'manual' && currentView !== 'portal' && (
        <>
          <Footer lang={lang} translations={translations} />
          <WhatsAppFloat lang={lang} />
          <ChatBot lang={lang} />
        </>
      )}

      {/* Floating Synchronization Toast Notification */}
      {syncToast && (
        <div className="sync-toast-notification glass-panel" style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          zIndex: 2000,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '380px',
          borderLeft: '4px solid var(--color-accent)',
          animation: 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{
            color: 'var(--color-accent)',
            backgroundColor: 'rgba(82, 183, 136, 0.15)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Icons.CheckCircle size={20} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              {lang === 'en' ? "Sync Centre" : "Dwol me Sync"}
            </p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
              {syncToast}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
