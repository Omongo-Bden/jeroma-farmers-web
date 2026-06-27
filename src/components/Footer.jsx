import React from 'react';
import * as Icons from './Icons';

export default function Footer({ lang, translations: _translations }) {
  const handleScrollTo = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const offsetPosition = elementRect - bodyRect - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    const alertMsg = {
      en: 'Thank you for subscribing! We will send you crop pricing alerts and collection schedule updates.',
      luo: 'Apwoyo woco nyingoni! Wabinoni nyak me payout kede collection schedule me nyen.'
    };
    alert(alertMsg[lang] || alertMsg.en);
    e.target.reset();
  };

  const navLabels = {
    en: { home: 'Home', about: 'About Us', services: 'Services & Calculator', gallery: 'Photo Gallery', socials: 'Digital Channels', contact: 'Contact Us' },
    luo: { home: 'Paco', about: 'Kwo Mwa', services: 'Tic & Calculator', gallery: 'Od-Cal me Pur', socials: 'Dwol me Socials', contact: 'Twero Woko' }
  };

  const navLinks = [
    { label: navLabels[lang]?.home || navLabels.en.home, id: 'home' },
    { label: navLabels[lang]?.about || navLabels.en.about, id: 'about' },
    { label: navLabels[lang]?.services || navLabels.en.services, id: 'services' },
    { label: navLabels[lang]?.gallery || navLabels.en.gallery, id: 'gallery' },
    { label: navLabels[lang]?.socials || navLabels.en.socials, id: 'socials' },
    { label: navLabels[lang]?.contact || navLabels.en.contact, id: 'contact' },
  ];

  const serviceLabels = {
    en: [
      'Crop Collection & Transit',
      'Moisture & Quality Grading',
      'Grain Cleaning & Sorting',
      'Warehouse Safe Storage',
      'Subsidized Seeds & Fertilizers',
      'Agro Construction Supplies'
    ],
    luo: [
      'Cogo Cam & Logistics',
      'Moisture & Quality Grading',
      'Lilo cam kede sorting',
      'Od-Kano cam me safe',
      'SeedCo kede Organic Fertilizer',
      'Construction me pur'
    ]
  };

  const serviceLinks = serviceLabels[lang] || serviceLabels.en;

  const newsletterText = {
    en: {
      title: 'Stay Updated',
      desc: 'Subscribe to receive weekly grain pricing reports, seasonal weather alerts, and seed stock availability from our Lira center.',
      taglineHead: 'We Deliver More Than Just Products.',
      taglineBody: 'Here. There. Everywhere. Our network covers Uganda end-to-end. No place left behind.'
    },
    luo: {
      title: 'Dwe me Pur',
      desc: 'Oro email ni me nongo grain pricing reports, weather alerts, kede agro inputs stocks me main center Lira.',
      taglineHead: 'Wamiyo kony makato jami me pur.',
      taglineBody: 'Keno. Ka. Kabila ducu. Dwol mwa cobo Uganda ducu woko end-to-end. Kur paco mo dong piny.'
    }
  };

  const selectedText = newsletterText[lang] || newsletterText.en;

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">

          {/* Col 1 – Brand */}
          <div className="footer-col" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="logo footer-logo">
              <img src="/logo.webp" alt="Jeroma Farmers Logo" className="logo-img" loading="lazy" />
              <span style={{ color: '#fff', fontSize: '1.1rem' }}>JEROMA FARMERS</span>
            </div>
            <p className="footer-desc">
              {lang === 'en' 
                ? 'Dealers in Agro Inputs, General Supplies & Construction. Empowering Uganda\'s smallholder farmers through certified crop grading, safe storage, and direct market access.'
                : 'Dealers in Agro Inputs, General Supplies & Construction. Cwako opur me Uganda ducu kede grading maber, safe storage, kede direct market.'}
            </p>
            {/* Real contact snippet */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)' }}>
              <span>📍 Rwot Awich Rd, Pader Town Council, Pader, Uganda</span>
              <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.45)' }}>Also operational in: Agago · Kitgum · Abim · Karenga · Lira · Kole</span>
              <a href="tel:+256773623196" style={{ color: 'rgba(255,255,255,0.7)' }}>📞 +256 773 623 196 (Acuti Sam, MD)</a>
              <a href="mailto:jeromafarmers.c@gmail.com" style={{ color: 'rgba(255,255,255,0.7)' }}>✉ jeromafarmers.c@gmail.com</a>
              <a href="http://www.jeromafarmers.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-secondary)' }}>🌐 www.jeromafarmers.com</a>
            </div>
            <div className="footer-social-links" style={{ marginTop: '4px' }}>
              <a href="https://www.facebook.com/jeromafarmers" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="Facebook">
                <Icons.FacebookOriginal size={18} />
              </a>
              <a href="https://wa.me/256773623196" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="WhatsApp">
                <Icons.MessageCircle size={18} />
              </a>
              <a href="https://www.tiktok.com/@jeromafarmers" target="_blank" rel="noopener noreferrer" className="footer-social-btn" aria-label="TikTok">
                <Icons.TikTokOriginal size={18} />
              </a>
            </div>
          </div>

          {/* Col 2 – Quick Links */}
          <div className="footer-col">
            <h4>{lang === 'en' ? 'Quick Links' : 'Dwol me Paco'}</h4>
            <ul className="footer-links">
              {navLinks.map(link => (
                <li key={link.id}>
                  <a href={`#${link.id}`} onClick={(e) => { e.preventDefault(); handleScrollTo(link.id); }}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 – Services */}
          <div className="footer-col">
            <h4>{lang === 'en' ? 'Our Services' : 'Tic Mwa'}</h4>
            <ul className="footer-links">
              {serviceLinks.map(s => (
                <li key={s}>
                  <a href="#services" onClick={(e) => { e.preventDefault(); handleScrollTo('services'); }}>
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 – Newsletter */}
          <div className="footer-col">
            <h4>{selectedText.title}</h4>
            <p style={{ fontSize: '0.88rem', marginBottom: '16px', color: 'rgba(255,255,255,0.65)' }}>
              {selectedText.desc}
            </p>
            <form onSubmit={handleSubscribe} className="newsletter-form">
              <input
                type="email"
                placeholder="Enter your email..."
                className="newsletter-input"
                required
                aria-label="Newsletter email"
              />
              <button type="submit" className="btn btn-secondary newsletter-btn" aria-label="Subscribe">
                <Icons.ArrowRight size={18} />
              </button>
            </form>

            {/* Delivery tagline from flyer */}
            <div style={{
              marginTop: '20px', padding: '14px 16px',
              background: 'rgba(233,196,106,0.08)',
              border: '1px solid rgba(233,196,106,0.2)',
              borderRadius: 'var(--radius-sm)'
            }}>
              <p style={{ color: 'var(--color-secondary)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
                {selectedText.taglineHead}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}>
                {selectedText.taglineBody}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Jeroma Farmers Collection Centre Ltd · Rwot Awich Rd, Pader, Uganda · TIN: 1020040260 · All rights reserved.</p>
          <button
            className="scroll-top-btn"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Scroll to top"
          >
            <Icons.ArrowUp size={20} />
          </button>
        </div>
      </div>
    </footer>
  );
}
