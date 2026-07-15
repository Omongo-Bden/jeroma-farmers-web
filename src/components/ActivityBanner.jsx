import React, { useState, useEffect, useRef } from 'react';
import { getSlides } from '../utils/db';

const getSlidesFallback = (lang) => [
  {
    id: 'districts',
    icon: '📢',
    tag_en: 'News',
    tag_ach: 'Kop Manyen',
    title_en: 'Jeroma Farmers Now Operational in 7 Districts!',
    title_ach: 'Jeroma Farmers Do tye ka tic i District 7!',
    body_en: 'Pader, Agago, Kitgum, Abim, Karenga, Lira and Kole districts are all connected to Jeroma\'s collection network. More than 1,200 registered farmers benefit from daily pickup routes.',
    body_ach: 'District me Pader, Agago, Kitgum, Abim, Karenga, Lira ki Kole ducu dong ocokke i kabedo me cogo keyo me Jeroma. Lupur ma okwoye makato 1,200 dong gunongo ber me tic man.',
    image: '/jeroma_banner_7_districts.jpg',
    color: '#081c15',
    accent: '#52b788',
    fit: 'contain',
  },
  {
    id: 'training',
    icon: '🌱',
    tag_en: 'Activity',
    tag_ach: 'Ginnipiny',
    title_en: 'GAP Farmer Training Sessions Underway',
    title_ach: 'Dwol me Pwonj me GAP pi Lupur Tye ka Medde',
    body_en: 'Our extension officers are conducting Good Agronomic Practice (GAP) training workshops for registered farmers across all 7 districts — covering soil health, pest management, and post-harvest handling.',
    body_ach: 'Lutic mwa me extension tye ka kuto pwonj me Good Agronomic Practice (GAP) bot lupur ma okwoye i district ducu 7 — lok i kom ngom maber, gengo kwoyo, ki cogo keyo maber.',
    image: '/farmers_training_1.jpg',
    color: '#081c15',
    accent: '#52b788',
    fit: 'cover',
  },
  {
    id: 'sunflower',
    icon: '🌻',
    tag_en: 'Activity',
    tag_ach: 'Ginnipiny',
    title_en: 'Sunflower Season: Grades Now Open for Delivery',
    title_ach: 'Cawa me Anyim (Sunflower): Rwom me Cogo tye Ayela',
    body_en: 'Sunflower is accepted at all collection hubs. Target moisture: 9–10%. Grade-A payout is UGX 2,200/Kg. Ensure proper drying on raised racks before delivery to secure premium rates.',
    body_ach: 'Cogo anyim (sunflower) dong tye i kabedo mwa ducu me cogo keyo. Dit me pii: 9-10%. Wel Grade-A payout tye UGX 2,200/Kg. Tim be itoyo maber anyim ma peya itero botwa.',
    image: '/maize_crop_banner.jpg',
    color: '#081c15',
    accent: '#52b788',
    fit: 'cover',
  },
  {
    id: 'team',
    icon: '👥',
    tag_en: 'Team',
    tag_ach: 'Lutic mwa',
    title_en: 'Meet Our Dedicated Jeroma FCC Ltd. Staff',
    title_ach: 'Nen Lutic mwa me Jeroma FCC Ltd.',
    body_en: 'Our professional team of managers, agronomy experts, extension officers, and support staff are committed to transforming subsistence farming into commercial agriculture and improving rural livelihoods.',
    body_ach: 'Team mwa me lutic madito, lutic me agronomy, extension officers, ki lutic ducu gubed guwankere pi loko pur me codo keyo me donyo i lobo me biro biyo kwo maber.',
    image: '/jeroma_staffs.jpg',
    color: '#081c15',
    accent: '#52b788',
    fit: 'cover',
  },
  {
    id: 'partnership_a2i',
    icon: '🤝',
    tag_en: 'Partnership',
    tag_ach: 'Ribbe Tic',
    title_en: 'Jeroma in Conjunction with Access to Innovation (A2I)',
    title_ach: 'Jeroma i Conjunction ki Access to Innovation (A2I)',
    body_en: 'Jeroma, in conjunction with Access to Innovation and with support from the Danish Government, completed its First Cohort field program from July 10 to July 14, 2026. The team visited SACCOs, cooperatives, and farming institutions in the Lango and Acholi subregions to identify needs, see capacities, and select machinery that best supports farmers without financial burden.',
    body_ach: 'Jeroma, i ribbe tic ki Access to Innovation kede cwak ma oa ki bot Gavumenti me Denmark, ocoyo Program me Cohort Mukwongo me abiri 10-14 July 2026. Team mwa olimo SACCOs kede cooperatives i Lango ki Acholi subregions pi neno machinery ma twero konyo lupur maber.',
    image: '/a2i_project_2.jpg',
    color: '#081c15',
    accent: '#52b788',
    fit: 'cover',
  }
];

export default function ActivityBanner({ lang }) {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch slides dynamically from database
  useEffect(() => {
    let active = true;
    const loadSlides = async () => {
      try {
        const fetched = await getSlides();
        if (active) {
          if (fetched && fetched.length > 0) {
            // Force colors to Emerald Green (#081c15 / #52b788)
            const forceColor = fetched.map(s => ({
              ...s,
              color: '#081c15',
              accent: '#52b788'
            }));
            setSlides(forceColor);
          } else {
            setSlides(getSlidesFallback(lang));
          }
        }
      } catch (err) {
        console.error('Error fetching slides:', err);
        if (active) {
          setSlides(getSlidesFallback(lang));
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };
    loadSlides();
    return () => { active = false; };
  }, [lang]);

  const goTo = (index) => {
    if (animating || slides.length === 0) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 300);
  };

  const goNext = () => {
    if (slides.length === 0) return;
    goTo((current + 1) % slides.length);
  };
  
  const goPrev = () => {
    if (slides.length === 0) return;
    goTo((current - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (slides.length === 0) return;
    timerRef.current = setInterval(goNext, 10000); // 10 seconds slide transition
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, slides, lang]);

  if (isLoading || slides.length === 0) {
    // Show a clean loading placeholder
    return (
      <div style={{
        width: '100%',
        height: isMobile ? '460px' : '400px',
        backgroundColor: '#081c15',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#52b788',
        fontSize: '1.2rem',
        fontWeight: 'bold'
      }}>
        Loading Slides...
      </div>
    );
  }

  const slide = slides[current];

  // Map translation properties
  const slideTag = slide[`tag_${lang}`] || slide.tag || slide.tag_en || '';
  const slideTitle = slide[`title_${lang}`] || slide.title || slide.title_en || '';
  const slideBody = slide[`body_${lang}`] || slide.body || slide.body_en || '';

  return (
    <div
      className="activity-banner-container"
      style={{
        position: 'relative',
        width: '100%',
        height: isMobile ? '460px' : '400px',
        overflow: 'hidden',
        backgroundColor: 'var(--color-bg-white)',
        zIndex: 490,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
      }}
    >
      {/* ── IMAGE/VIDEO SECTION (PC: Right 45% Column, Mobile: Top 190px Row) ── */}
      <div
        style={{
          width: isMobile ? '100%' : '45%',
          height: isMobile ? '190px' : '100%',
          position: 'relative',
          order: isMobile ? 1 : 2,
          backgroundColor: 'var(--color-bg-white)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {slide.video || (slide.image && (slide.image.endsWith('.mp4') || slide.image.endsWith('.webm') || slide.image.endsWith('.ogg'))) ? (
          <video
            src={slide.video || slide.image}
            controls
            autoPlay
            muted
            loop
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              boxSizing: 'border-box',
              transition: 'opacity 0.3s ease-in-out',
              opacity: animating ? 0.2 : 1,
            }}
          />
        ) : (
          <img
            src={slide.image}
            alt={slideTitle}
            style={{
              width: '100%',
              height: '100%',
              objectFit: slide.fit || 'cover',
              padding: slide.fit === 'contain' ? (isMobile ? '8px' : '20px') : '0',
              boxSizing: 'border-box',
              transition: 'opacity 0.3s ease-in-out',
              opacity: animating ? 0.2 : 1,
            }}
          />
        )}

        {/* Desktop Edge Blend - very narrow to prevent dark shadow overlay */}
        {!isMobile && slide.fit !== 'contain' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '16px',
              height: '100%',
              background: `linear-gradient(to right, var(--color-bg-white), transparent)`,
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
        )}
      </div>

      {/* ── CONTENT SECTION (PC: Left 55% Column, Mobile: Bottom Remaining height) ── */}
      <div
        style={{
          width: isMobile ? '100%' : '55%',
          height: isMobile ? '270px' : '100%',
          order: isMobile ? 2 : 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: isMobile ? '20px 24px' : '40px 50px',
          boxSizing: 'border-box',
          zIndex: 10,
        }}
      >
        <div
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? 'translateY(8px)' : 'translateY(0)',
            transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '10px' : '14px',
          }}
        >
          {/* Tag & Counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                background: 'rgba(82, 183, 136, 0.15)',
                color: 'var(--color-primary-dark)',
                border: `1px solid var(--color-accent)`,
                fontSize: '0.7rem',
                fontWeight: 900,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '3px 10px',
                borderRadius: '5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{slide.icon || '📢'}</span>
              <span>{slideTag}</span>
            </span>
            <span style={{ color: 'var(--color-text-light)', opacity: 0.8, fontSize: '0.78rem', fontWeight: 600 }}>
              {current + 1} / {slides.length}
            </span>
          </div>

          {/* Slide Title */}
          <h2
            style={{
              margin: 0,
              fontSize: isMobile ? '1.25rem' : '1.9rem',
              fontWeight: 800,
              color: 'var(--color-text-white)',
              lineHeight: 1.25,
              textShadow: 'var(--shadow-text-sm, 0 1px 1px rgba(0,0,0,0.15))',
              letterSpacing: '-0.01em',
            }}
          >
            {slideTitle}
          </h2>

          {/* Slide Body */}
          <p
            style={{
              margin: 0,
              fontSize: isMobile ? '0.82rem' : '0.94rem',
              color: 'var(--color-text-light)',
              lineHeight: '1.55',
              textShadow: 'none',
              display: '-webkit-box',
              WebkitLineClamp: isMobile ? 3 : 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {slideBody}
          </p>

          {/* Navigation Controls Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: isMobile ? '6px' : '12px',
              gap: '15px',
            }}
          >
            {/* Dots */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  style={{
                    width: i === current ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    border: 'none',
                    background: i === current ? 'var(--color-accent)' : 'rgba(82, 183, 136, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    padding: 0,
                  }}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Manual Arrows */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={goPrev}
                aria-label="Previous Slide"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid rgba(27,67,50,0.12)',
                  background: 'rgba(27,67,50,0.04)',
                  color: 'var(--color-primary-dark)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(2px)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-accent)';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.borderColor = 'var(--color-accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(27,67,50,0.04)';
                  e.currentTarget.style.color = 'var(--color-primary-dark)';
                  e.currentTarget.style.borderColor = 'rgba(27,67,50,0.12)';
                }}
              >
                ◀
              </button>
              <button
                onClick={goNext}
                aria-label="Next Slide"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1px solid rgba(27,67,50,0.12)',
                  background: 'rgba(27,67,50,0.04)',
                  color: 'var(--color-primary-dark)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backdropFilter: 'blur(2px)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-accent)';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.borderColor = 'var(--color-accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(27,67,50,0.04)';
                  e.currentTarget.style.color = 'var(--color-primary-dark)';
                  e.currentTarget.style.borderColor = 'rgba(27,67,50,0.12)';
                }}
              >
                ▶
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '4px',
          background: `linear-gradient(90deg, var(--color-primary-dark), var(--color-accent), var(--color-primary-dark))`,
          zIndex: 20,
        }}
      />
    </div>
  );
}
