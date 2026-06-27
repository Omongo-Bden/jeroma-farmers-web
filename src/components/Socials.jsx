import React, { useState, useEffect } from 'react';
import * as Icons from './Icons';

export default function Socials({ lang, translations: _translations }) {
  const [activeAlert, setActiveAlert] = useState(0);

  const labels = {
    en: {
      badge: 'Digital Channels',
      title: 'Find Us on Every Platform',
      desc: 'We maintain branding consistency and share agricultural news, product stock updates, crop collection calendars, and farmer education across all digital media.',
      liveTitle: 'Live Cooperative Bulletin & Dispatches',
      liveSubtitle: 'Real-time updates from our Lira headquarters, moisture testing labs, and transit trucks.',
      liveBadge: 'LIVE STATUS BOARD',
      fbHead: 'Jeroma Farmers Collection Centre',
      fbSub: 'Facebook Business Page',
      fbDesc: 'Follow our Facebook page for daily collection updates, weather warnings, market pricing shifts, and community news.',
      fbPostStrong: 'Jeroma Farmers Collection Centre Ltd',
      fbPostText: 'Our team at the 2026 Regional Agricultural Exhibition! We are proud to be showcasing top-grade sunflower varieties for our registered farmers. 🌻👍',
      fbBtn: 'Visit Facebook Page',
      waHead: 'Jeroma Business Catalog',
      waSub: 'WhatsApp Business',
      waDesc: 'Chat directly to enquire about input stocks, collection schedule, moisture grading, or bulk pickup arrangements.',
      waTitle: 'Featured Farm Inputs',
      waBioText: '100% Organic NPK · In Stock',
      waSeedText: 'High-Oil Certified Seed · Available',
      waBtn: 'Chat: +256 773 623 196',
      tkHead: '@jeroma_farmers',
      tkSub: 'TikTok Channel',
      tkDesc: 'Watch short video guides on proper grain storage, sunflower seed selection, fertilizer application, and collection centre operations.',
      tkVideoText: 'Cooperative Training Day (8.2k views)',
      tkBtn: 'Visit TikTok Channel'
    },
    luo: {
      badge: 'Dwol me Socials',
      title: 'Nwang Kedwa i Platforms Ducu',
      desc: 'Wamiyo yore me nongo agro information, agro inputs stock updates, weather alerts, kede pwonj me opur i social media ducu.',
      liveTitle: 'Kabila me Nyen & Lela me Transit',
      liveSubtitle: 'Nyen cutcut ki i laboratory mwa i Lira, moisture testing lab, kede lela truck me cogo.',
      liveBadge: 'STATUS BOARD ME DYNAMIC',
      fbHead: 'Jeroma Farmers Collection Centre',
      fbSub: 'Facebook Business Page',
      fbDesc: 'Biyo Facebook page mwa pi collection schedules me nyen, tocam alerts, kede wel me market.',
      fbPostStrong: 'Jeroma Farmers Collection Centre Ltd',
      fbPostText: 'Team mwa i 2026 Regional Agricultural Exhibition! Waneno nyak me sunflower ma kabilo maber twotwo pi opur ducu. 🌻👍',
      fbBtn: 'Visit Facebook Page',
      waHead: 'Jeroma Business Catalog',
      waSub: 'WhatsApp Business',
      waDesc: 'Cano direct WhatsApp pi inputs stock, cogo guidelines, moisture grading nyo bulk truck pickups.',
      waTitle: 'Farm Inputs me Waco',
      waBioText: '100% Organic NPK · Tye ka od-cogo',
      waSeedText: 'High-Oil Certified Seed · Tye woko',
      waBtn: 'Peny: +256 773 623 196',
      tkHead: '@jeroma_farmers',
      tkSub: 'TikTok Channel',
      tkDesc: 'Neno video guidelines pi grain storage, kabilo selection, organic fertilizer application i poto.',
      tkVideoText: 'Training me Cooperative (8.2k views)',
      tkBtn: 'Visit TikTok Channel'
    }
  };

  const selectedSocial = labels[lang] || labels.en;

  // Real-time dynamic bulletins rotation dataset
  const liveBulletins = {
    en: [
      { id: 1, type: "transit", text: "🚚 Transit Alert: Dispatch truck heading to Erute North collection hub in 2 hours.", status: "IN ROUTE", color: "var(--color-accent)" },
      { id: 2, type: "yield", text: "🌻 High-Yield Record: Registered grower Okello John in Erute harvested a massive 4.2 Tons of Grade-A Sunflower seeds!", status: "RECORD", color: "var(--color-secondary)" },
      { id: 3, type: "input", text: "🌱 Subsidized NPK Stocks: 120 bags of organic Biofertilizer blends arrived at Lira hub. Register to secure yours.", status: "IN STOCK", color: "var(--color-accent)" },
      { id: 4, type: "lab", text: "☕ Moisture Lab Update: Coffee bean deliveries average 12.4% moisture level today—Grade-A payout bonus unlocked!", status: "GRADED", color: "var(--color-secondary)" },
      { id: 5, type: "coop", text: "🚜 Training Seminar: High-yield sunflower pre-drying and winnowing training scheduled next Tuesday at Lira Main Hub.", status: "UPCOMING", color: "var(--color-secondary)" }
    ],
    luo: [
      { id: 1, type: "transit", text: "🚚 Lela me Transit: Lela truck cito i Erute North collection point i cawa 2 me cogo cam.", status: "IN ROUTE", color: "var(--color-accent)" },
      { id: 2, type: "yield", text: "🌻 Nyak me Keyo: Opur Okello John i Lira okado keyo me 4.2 Tons me Sunflower seeds!", status: "RECORD", color: "var(--color-secondary)" },
      { id: 3, type: "input", text: "🌱 Subsidized NPK Stocks: Kabilo me organic NPK bags 120 ocopo i Lira hub. Subsidized wel tye woko.", status: "IN STOCK", color: "var(--color-accent)" },
      { id: 4, type: "lab", text: "☕ Moisture Lab Update: Moisture me kawa ocopo average 12.4% tin—cula me bonus oye woko!", status: "GRADED", color: "var(--color-secondary)" },
      { id: 5, type: "coop", text: "🚜 Training Seminar: Pwonj me organic winnowing kede sunflower selection scheduled i dwe abiri tar i Lira Center.", status: "UPCOMING", color: "var(--color-secondary)" }
    ]
  };

  const bulletinsList = liveBulletins[lang] || liveBulletins.en;

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveAlert((prev) => (prev + 1) % bulletinsList.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [bulletinsList.length]);

  return (
    <section id="socials" className="section" style={{ backgroundColor: 'var(--color-bg-light)' }}>
      <div className="container">
        
        {/* Section Header */}
        <div className="section-header">
          <span className="section-badge">{selectedSocial.badge}</span>
          <h2 className="section-title">{selectedSocial.title}</h2>
          <p className="section-subtitle">{selectedSocial.desc}</p>
        </div>

        {/* Live Cooperative Announcements Feed Card */}
        <div className="live-coop-feed-card glass-panel" style={{
          padding: '24px',
          borderRadius: 'var(--radius-md)',
          borderLeft: '5px solid var(--color-primary-light)',
          marginBottom: '40px',
          boxShadow: 'var(--shadow-md)',
          background: 'linear-gradient(135deg, rgba(27,67,50,0.03), rgba(255,255,255,0.9))',
          animation: 'fadeIn 0.5s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary-dark)', margin: 0 }}>
                📢 {selectedSocial.liveTitle}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', margin: '4px 0 0 0' }}>
                {selectedSocial.liveSubtitle}
              </p>
            </div>
            
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--color-primary-dark)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'red', animation: 'wa-pulse 1.2s infinite' }}></span>
              <span>{selectedSocial.liveBadge}</span>
            </div>
          </div>

          {/* Bulletins Active Slider */}
          <div style={{ minHeight: '60px', position: 'relative', overflow: 'hidden' }}>
            {bulletinsList.map((bulletin, index) => (
              <div
                key={bulletin.id}
                style={{
                  display: index === activeAlert ? 'flex' : 'none',
                  alignItems: 'center',
                  gap: '16px',
                  animation: 'slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <div style={{
                  padding: '6px 12px',
                  backgroundColor: 'rgba(27, 67, 50, 0.08)',
                  border: `1px solid ${bulletin.color}`,
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: 'var(--color-primary)',
                  letterSpacing: '0.05em',
                  flexShrink: 0
                }}>
                  {bulletin.status}
                </div>
                
                <p style={{ 
                  margin: 0, 
                  fontSize: '1rem', 
                  color: 'var(--color-primary-dark)', 
                  fontWeight: 500,
                  lineHeight: '1.5',
                  fontFamily: 'var(--font-heading)'
                }}>
                  {bulletin.text}
                </p>
              </div>
            ))}
          </div>

          {/* Dots Indicator */}
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginTop: '16px' }}>
            {bulletinsList.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveAlert(index)}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: index === activeAlert ? 'var(--color-primary-light)' : 'rgba(0,0,0,0.15)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'background-color 0.2s'
                }}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Social Mockup Panels Grid */}
        <div className="socials-grid">
          {/* Facebook Panel */}
          <div className="social-panel glass-panel">
            <div className="social-header-block">
              <div className="social-profile-info">
                <div className="social-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                  <img src="/logo.webp" alt="Jeroma Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} loading="lazy" />
                </div>
                <div className="social-handle">
                  <h4>{selectedSocial.fbHead}</h4>
                  <p>{selectedSocial.fbSub}</p>
                </div>
              </div>
              <div className="social-badge-icon bg-fb">
                <Icons.Facebook size={20} />
              </div>
            </div>

            <p className="social-description">
              {selectedSocial.fbDesc}
            </p>

            <div className="social-feed-mock fb-post">
              <img src="/four_men_sunflowers.png" alt="Jeroma team at sunflower exhibition" className="fb-post-img" loading="lazy" />
              <p className="fb-post-text">
                <strong>{selectedSocial.fbPostStrong}</strong><br />
                {selectedSocial.fbPostText}<br />
                <span style={{ color: '#1877f2', fontSize: '0.75rem' }}>#JeromaFarmers #Sunflower #AgriUganda</span>
              </p>
            </div>

            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
            >
              <Icons.Facebook size={16} /> {selectedSocial.fbBtn}
            </a>
          </div>

          {/* WhatsApp Business Panel */}
          <div className="social-panel glass-panel">
            <div className="social-header-block">
              <div className="social-profile-info">
                <div className="social-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                  <img src="/logo.webp" alt="Jeroma Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} loading="lazy" />
                </div>
                <div className="social-handle">
                  <h4>{selectedSocial.waHead}</h4>
                  <p>{selectedSocial.waSub}</p>
                </div>
              </div>
              <div className="social-badge-icon bg-wa">
                <Icons.MessageCircle size={20} />
              </div>
            </div>

            <p className="social-description">
              {selectedSocial.waDesc}
            </p>

            <div className="social-feed-mock wa-catalog">
              <h4 style={{ fontSize: '0.85rem', color: 'var(--color-primary-dark)', marginBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '4px' }}>
                {selectedSocial.waTitle}
              </h4>
              <div className="wa-catalog-item">
                <img src="/biofertilizer_bag.webp" alt="Biofertilizer Africa Bag" className="wa-item-img" loading="lazy" />
                <div className="wa-item-details">
                  <h5>Biofertilizer Africa – 25 Kg</h5>
                  <p>{selectedSocial.waBioText}</p>
                </div>
              </div>
              <div className="wa-catalog-item">
                <img src="/farmer_man_seedco.png" alt="SeedCo Sunflower Seeds" className="wa-item-img" loading="lazy" />
                <div className="wa-item-details">
                  <h5>SeedCo LG 50745 Sunflower</h5>
                  <p>{selectedSocial.waSeedText}</p>
                </div>
              </div>
            </div>

            <a
              href={`https://wa.me/256773623196?text=${encodeURIComponent(lang === 'en' ? 'Hello Jeroma Farmers, I would like to inquire about your services.' : 'Mirembe Jeroma Farmers, amit me nongo kony kom tije mwa.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', background: '#25d366', border: 'none' }}
            >
              <Icons.MessageCircle size={18} />
              {selectedSocial.waBtn}
            </a>
          </div>

          {/* TikTok Panel */}
          <div className="social-panel glass-panel">
            <div className="social-header-block">
              <div className="social-profile-info">
                <div className="social-avatar" style={{ overflow: 'hidden', padding: 0 }}>
                  <img src="/logo.webp" alt="Jeroma Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} loading="lazy" />
                </div>
                <div className="social-handle">
                  <h4>{selectedSocial.tkHead}</h4>
                  <p>{selectedSocial.tkSub}</p>
                </div>
              </div>
              <div className="social-badge-icon bg-tk">
                <Icons.Video size={20} />
              </div>
            </div>

            <p className="social-description">
              {selectedSocial.tkDesc}
            </p>

            <div className="social-feed-mock tk-video-mock">
              <img src="/women_coop_gathering.webp" alt="Farmers cooperative training" loading="lazy" />
              <div className="tk-play-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </div>
              <div style={{ position: 'absolute', bottom: '8px', left: '8px', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                {selectedSocial.tkVideoText}
              </div>
            </div>

            <a
              href="https://tiktok.com/@jeromafarmers"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
            >
              <Icons.Video size={16} /> {selectedSocial.tkBtn}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
