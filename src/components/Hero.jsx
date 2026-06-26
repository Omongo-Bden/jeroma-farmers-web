import React, { useEffect, useRef, useState } from 'react';
import * as Icons from './Icons';
import { translations } from './translations';

// Animated counter hook
function useCountUp(target, duration = 1600, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

export default function Hero({ lang, translations: dynamicTranslations }) {
  const activeTranslations = dynamicTranslations || translations;
  const t = activeTranslations[lang] || activeTranslations.en;
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [priceFlash, setPriceFlash] = useState(false);

  const farmers = useCountUp(1200, 1800, statsVisible);
  const hubs = useCountUp(15, 1200, statsVisible);
  const tons = useCountUp(20, 1400, statsVisible);

  // Flash market price every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceFlash(true);
      setTimeout(() => setPriceFlash(false), 700);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const handleScrollTo = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const offset = 130;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const marketPrices = {
    en: [
      { crop: 'Sunflower', price: 'UGX 2,200/Kg', trend: '▲' },
      { crop: 'Coffee A', price: 'UGX 12,500/Kg', trend: '▲' },
      { crop: 'Maize', price: 'UGX 1,300/Kg', trend: '→' },
    ],
    luo: [
      { crop: 'Sunflower', price: 'UGX 2,200/Kg', trend: '▲' },
      { crop: 'Kawa Grade A', price: 'UGX 12,500/Kg', trend: '▲' },
      { crop: 'Anam', price: 'UGX 1,300/Kg', trend: '→' },
    ]
  };
  const prices = marketPrices[lang] || marketPrices.en;
  const [priceIndex, setPriceIndex] = useState(0);

  useEffect(() => {
    const rotate = setInterval(() => {
      setPriceIndex(i => (i + 1) % prices.length);
    }, 3500);
    return () => clearInterval(rotate);
  }, [prices.length]);

  const currentPrice = prices[priceIndex];

  return (
    <section id="home" className="hero-section">
      <div className="container">
        <div className="hero-grid">
          {/* Content Column */}
          <div className="hero-content" style={{ animation: 'heroSlideIn 0.7s cubic-bezier(0.16,1,0.3,1) both' }}>
            <span className="section-badge">{t.heroBadge}</span>
            <h1 className="hero-title">
              {t.heroTitle} <br />
              <span className="text-gradient">{t.heroTitleGrad}</span>
            </h1>
            <p className="hero-description">{t.heroDesc}</p>

            {/* Live Market Price Mini-Widget */}
            <div className="hero-price-widget">
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: priceFlash ? '#f4a261' : 'var(--color-accent)',
                display: 'inline-block',
                transition: 'background-color 0.3s',
                animation: 'wa-pulse 2s infinite'
              }}></span>
              <span className="hero-price-label">
                {lang === 'en' ? 'Live Price' : 'Wel Kati'}
              </span>
              <span className="hero-price-crop">
                {currentPrice.crop}:
              </span>
              <span className="hero-price-value">
                {currentPrice.price} <span className="hero-price-trend">{currentPrice.trend}</span>
              </span>
            </div>

            <div className="hero-ctas">
              <button className="btn btn-primary" onClick={() => handleScrollTo('services')}>
                {t.heroCtaServices}
                <Icons.ArrowRight size={18} />
              </button>
              <button className="btn btn-outline" onClick={() => handleScrollTo('contact')}>
                {t.heroCtaContact}
              </button>
            </div>

            {/* Animated Stats Panel */}
            <div className="hero-stats glass-panel" ref={statsRef}>
              <div className="hero-stat-card">
                <span className="hero-stat-num">
                  {farmers.toLocaleString()}+
                </span>
                <span className="hero-stat-label">{t.statFarmers}</span>
              </div>
              <div className="hero-stat-card" style={{ borderLeft: '1px solid rgba(27, 67, 50, 0.1)', borderRight: '1px solid rgba(27, 67, 50, 0.1)' }}>
                <span className="hero-stat-num">
                  {hubs}+
                </span>
                <span className="hero-stat-label">{t.statHubs}</span>
              </div>
              <div className="hero-stat-card">
                <span className="hero-stat-num">
                  {tons}k+
                </span>
                <span className="hero-stat-label">{t.statTons}</span>
              </div>
            </div>
          </div>

          {/* Visual Column */}
          <div className="hero-visual" style={{ animation: 'heroSlideInRight 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both' }}>
            <div className="hero-blob-bg"></div>
            <div className="hero-image-wrapper" style={{ border: '3px solid var(--color-secondary)' }}>
              <img
                src="/farmer_woman.png"
                alt="Jeroma Farmers Community"
                className="hero-image"
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
