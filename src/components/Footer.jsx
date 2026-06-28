import React from 'react';
import * as Icons from './Icons';

export default function Footer({ lang, translations: _translations, showInstallBtn = false, onInstallApp }) {
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
            {showInstallBtn && (
              <button 
                onClick={onInstallApp}
                className="btn btn-primary"
                style={{ 
                  alignSelf: 'flex-start',
                  fontSize: '0.8rem', 
                  padding: '8px 14px', 
                  marginTop: '12px', 
                  background: 'var(--color-secondary)', 
                  color: 'var(--color-primary-dark)', 
                  fontWeight: 800,
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                📲 {lang === 'en' ? 'Install Jeroma App' : 'Keto Jeroma App'}
              </button>
            )}
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

        {/* Privacy & Legal Section */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '28px 0 0',
          marginTop: '8px'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            {/* Privacy Policy */}
            <div>
              <h5 style={{ color: 'var(--color-secondary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                🔒 {lang === 'en' ? 'Privacy Policy' : 'Cik me Privacy'}
              </h5>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                {lang === 'en'
                  ? 'We collect only the information necessary to manage your account, process crop deliveries, and improve our services. Your personal data (name, phone, district) is stored securely and is never sold to third parties.'
                  : 'Wakano data keken me tic — nying, simu, kede district. Data ni coyo maber kede pe wamiyo bot dano mukene mo ceng.'}
              </p>
              <button
                onClick={() => alert(lang === 'en'
                  ? 'PRIVACY POLICY — Jeroma Farmers Collection Centre Ltd\n\nData We Collect: Name, phone number, district, crop delivery records, and app usage data.\n\nHow We Use It: To process deliveries, manage payouts, send collection schedule alerts, and improve our services.\n\nData Sharing: We do NOT sell or share your personal information with any third party. Data may be shared only with licensed government agricultural bodies as required by Uganda law.\n\nData Storage: All data is encrypted and stored on secure servers. You may request deletion of your account data at any time by contacting us at jeromafarmers.c@gmail.com.\n\nContact: Jeroma Farmers Collection Centre Ltd, Rwot Awich Rd, Pader · +256 773 623 196'
                  : 'CIKE ME PRIVACY — Jeroma Farmers Collection Centre Ltd\n\nData ma wakano: Nying, simu, district, rekodi me cam, kede tic me app.\n\nTwero data: Pe wamiyo data ni bot dano mo pe. Wamiyo keken bot government me Uganda ka mite.\n\nLworo data: Data ducu coy maber i server me secure. Ka imito kwanyo data ni, bidh bot jeromafarmers.c@gmail.com.\n\nKama wabet: Jeroma Farmers Collection Centre Ltd, Rwot Awich Rd, Pader · +256 773 623 196'
                )}
                style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', fontSize: '0.72rem', cursor: 'pointer', padding: 0, textDecoration: 'underline', marginTop: '6px' }}
              >
                {lang === 'en' ? 'Read Full Policy →' : 'Kwan Cik ducu →'}
              </button>
            </div>

            {/* Terms & Conditions */}
            <div>
              <h5 style={{ color: 'var(--color-secondary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                📋 {lang === 'en' ? 'Terms & Conditions' : 'Cik me Tic'}
              </h5>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                {lang === 'en'
                  ? 'By using this platform, you agree to provide accurate registration information, handle crop deliveries responsibly, and comply with Jeroma grading standards. Misrepresentation of crop quality may result in account suspension.'
                  : 'Ka iketo tic app man, igam me miyo ngec me adwi, kede lubo cik me grading pa Jeroma. Ka imiyo ngec lagen, akaunti ni twero gikwero.'}
              </p>
              <button
                onClick={() => alert(lang === 'en'
                  ? 'TERMS & CONDITIONS — Jeroma Farmers Collection Centre Ltd\n\n1. Eligibility: The platform is open to registered smallholder farmers and authorized Jeroma staff in Uganda.\n\n2. Accurate Information: Users must provide accurate personal and crop data. Fraudulent records will result in immediate account suspension.\n\n3. Crop Grading: All crops are subject to standard moisture and quality testing. Payout rates are based on certified Grade-A or Grade-B classification.\n\n4. Payout Terms: Mobile money payouts are processed within 2–3 business days of grading approval. Jeroma is not liable for delays caused by mobile network providers.\n\n5. Account Security: Users are responsible for keeping their login credentials secure. Report any unauthorized access immediately.\n\n6. Limitation of Liability: Jeroma is not liable for losses arising from force majeure events, market price fluctuations, or third-party service failures.\n\n7. Amendments: These terms may be updated periodically. Continued use of the platform constitutes acceptance of revised terms.\n\nContact: jeromafarmers.c@gmail.com · +256 773 623 196'
                  : 'CIK ME TIC — Jeroma Farmers Collection Centre Ltd\n\n1. Ŋat mitic: App man yelo apur ma coyote i Uganda kede lutic ma Jeroma omako.\n\n2. Ngec me adwi: Ŋat ducu myero omiyo ngec me adwi. Ka ngec lim, akaunti ni twero gikwero liwa.\n\n3. Grading: Cam ducu myero kato testing me moisture kede quality. Payout obedo ki Grade-A onyo Grade-B.\n\n4. Payout: Mobile money twero bino i kin nino 2–3 me tic. Jeroma pe tye ki tam pi nino ma network okelogi.\n\n5. Kicony me login: In aye tye ki tam pi kicony me akaunti ni. Miyo ŋec ka dano mukene ocomo i.\n\n6. Jeroma pe tye ki tam pi tika ma oa ki tika ma oa ki piny, market onyo dano mukene.\n\nKama wabet: jeromafarmers.c@gmail.com · +256 773 623 196'
                )}
                style={{ background: 'none', border: 'none', color: 'var(--color-secondary)', fontSize: '0.72rem', cursor: 'pointer', padding: 0, textDecoration: 'underline', marginTop: '6px' }}
              >
                {lang === 'en' ? 'Read Full Terms →' : 'Kwan Cik ducu →'}
              </button>
            </div>

            {/* Disclaimer */}
            <div>
              <h5 style={{ color: 'var(--color-secondary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ⚖️ {lang === 'en' ? 'Legal Disclaimer' : 'Cik me Loya'}
              </h5>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                {lang === 'en'
                  ? 'Crop prices displayed are indicative and subject to change based on market conditions. Jeroma Farmers Collection Centre Ltd is a licensed commodity trader registered under Uganda Registration Services Bureau (URSB).'
                  : 'Wel me cam ma i app man twero loko ki yo me market. Jeroma Farmers Collection Centre Ltd coyote maber i URSB me Uganda.'}
              </p>
            </div>
          </div>

          {/* Legal links row */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            marginBottom: '4px'
          }}>
            {[
              { label: lang === 'en' ? '🔒 Privacy Policy' : '🔒 Privacy', action: 'privacy' },
              { label: lang === 'en' ? '📋 Terms of Use' : '📋 Cik me Tic', action: 'terms' },
              { label: lang === 'en' ? '🍪 Cookie Policy' : '🍪 Cookie', action: 'cookie' },
              { label: lang === 'en' ? '📞 Contact Support' : '📞 Kony', action: 'contact' },
            ].map(link => (
              <button
                key={link.action}
                onClick={() => {
                  if (link.action === 'contact') {
                    window.location.href = 'mailto:jeromafarmers.c@gmail.com';
                  } else if (link.action === 'cookie') {
                    alert(lang === 'en'
                      ? 'COOKIE POLICY\n\nJeroma Farmers web platform uses only essential cookies required for user authentication and session management. We do not use advertising or tracking cookies. Your browser\'s local storage is used to save language preferences and app settings only.'
                      : 'CIKE ME COOKIE\n\nApp pa Jeroma keto cookie keken me login kede session. Pe waketo cookie me ads onyo tracking. Local storage i browser ni kano keken leb kede settings me app.'
                    );
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'color 0.2s'
                }}
                onMouseOver={e => e.target.style.color = 'var(--color-secondary)'}
                onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
              >
                {link.label}
              </button>
            ))}
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
