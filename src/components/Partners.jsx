import React, { useEffect, useRef, useState } from 'react';

export default function Partners({ lang, translations: _translations }) {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const titles = {
    en: {
      pre: "Collaborative Network",
      main: "Our Partners & Affiliations",
      sub: "Jeroma Farmers Collection Centre Ltd works in partnership with government bodies, development foundations, agro-input suppliers, and financial institutions to support our farmers."
    },
    luo: {
      pre: "Ribbe ma Waco",
      main: "Dwol me Ribbe & Partners",
      sub: "Jeroma Farmers tiyo kacel ki gavumenti, foundations, input suppliers, kede banes me cente me cwako opur mwa ducu."
    }
  };

  const partnerNames = {
    en: {
      pader: 'Pader District Local Government',
      psfu: 'Private Sector Foundation Uganda (PSFU)',
      grow: 'GROW Project',
      eleglance: 'Eleglance Finance Ltd',
      naseco: 'NASECO Seed Company',
      nido: 'NIDO-Uganda',
      mukwano: 'Mukwano Industries Uganda Ltd',
      bukola: 'Bukola Inputs Ltd',
      farmafrica: 'Farm Africa Solution',
      easeeds: 'East African Seeds'
    },
    luo: {
      pader: 'Gavumenti me Pader District',
      psfu: 'Private Sector Foundation Uganda (PSFU)',
      grow: 'GROW Project me Mon',
      eleglance: 'Eleglance Finance Ltd',
      naseco: 'NASECO Seed Company',
      nido: 'NIDO-Uganda',
      mukwano: 'Mukwano Industries Uganda Ltd',
      bukola: 'Bukola Inputs Ltd',
      farmafrica: 'Farm Africa Solution',
      easeeds: 'East African Seeds'
    }
  };

  const roles = {
    en: {
      pader: 'Provides enabling environment for smooth operations, Farmer mobilization, quality assurance and regulations of our products/services.',
      psfu: 'Supporting capacity building, staffing under Work Readiness Programme for graduate employees.',
      grow: 'Provide support to women entrepreneurs.',
      eleglance: 'Support farmer groups with soft agriculture and home improvement loans. Provide trainings on micro-support system, financial literacy, risk assessments, land acquisitions and documentations.',
      naseco: 'Supply quality seeds to Jeroma FCC Ltd.',
      nido: 'Supply organic fertilisers, imported seeds from S.Africa and Canada, garden mappings.',
      mukwano: 'Supply of Sunflower seeds(PANNAR) and grain market linkages.',
      bukola: 'Supply of plant protection products(agro-chemicals).',
      farmafrica: 'Supply of DK Maize seeds.',
      easeeds: 'Supply of maize seeds(PANNAR, Longe 5 and assorted vegetable seeds).'
    },
    luo: {
      pader: 'Miyo enabling environment me tic maber, cogo opur, quality assurance kede regulations me tije mwa.',
      psfu: 'Cwako capacity building kede staffing te program me Work Readiness pi employees.',
      grow: 'Miyo kony kede cwako mon ma tiyo tic me business.',
      eleglance: 'Cwako cente me pur kede home improvement loans. Miyo training me financial literacy, risk assessments kede land documentations.',
      naseco: 'Miyo seeds me quality maber bot Jeroma FCC Ltd.',
      nido: 'Miyo organic fertilisers, seeds ma okel ki S.Africa kede Canada, kede garden mapping.',
      mukwano: 'Miyo kabilo me Sunflower (PANNAR) kede grain market linkages.',
      bukola: 'Miyo jami me kony kom yat me pur (agro-chemicals).',
      farmafrica: 'Miyo seeds me DK Maize bot opur.',
      easeeds: 'Miyo seeds me anango (PANNAR, Longe 5 kede assorted vegetable seeds).'
    }
  };

  const tags = {
    en: {
      govt: 'Government & Regulation',
      dev: 'Capacity & Development',
      finance: 'Agro Finance & Literacy',
      input: 'Agro Inputs & Seeds',
      market: 'Market & Processing'
    },
    luo: {
      govt: 'Gavumenti & Cik',
      dev: 'Capacity & Mon',
      finance: 'Agro Finance & Cula',
      input: 'Inputs & Seeds',
      market: 'Market & Cogo'
    }
  };

  const tagColors = {
    govt: { bg: 'rgba(27,67,50,0.08)', color: 'var(--color-primary-light)', border: 'rgba(27,67,50,0.15)' },
    dev: { bg: 'rgba(82,183,136,0.12)', color: 'var(--color-accent)', border: 'rgba(82,183,136,0.25)' },
    finance: { bg: 'rgba(244,162,97,0.1)', color: '#d97706', border: 'rgba(244,162,97,0.25)' },
    input: { bg: 'rgba(82,183,136,0.08)', color: 'var(--color-primary-light)', border: 'rgba(82,183,136,0.2)' },
    market: { bg: 'rgba(220,38,38,0.08)', color: '#dc2626', border: 'rgba(220,38,38,0.2)' }
  };

  const partnerMetadata = {
    pader: { initials: 'PLG', gradient: 'linear-gradient(135deg, #1b4332, #40916c)', url: 'https://www.pader.go.ug', tag: 'govt' },
    psfu: { initials: 'PSF', gradient: 'linear-gradient(135deg, #2d3748, #4a5568)', url: 'https://www.psfuganda.org', tag: 'dev' },
    grow: { initials: 'GRW', gradient: 'linear-gradient(135deg, #b83280, #d53f8c)', url: 'https://grow.go.ug', tag: 'dev' },
    eleglance: { initials: 'EFL', gradient: 'linear-gradient(135deg, #2b6cb0, #3182ce)', url: 'https://www.eleglancefinance.co.ug', tag: 'finance' },
    naseco: { initials: 'NAS', gradient: 'linear-gradient(135deg, #2f855a, #48bb78)', url: 'https://nasecoseeds.com', tag: 'input' },
    nido: { initials: 'NID', gradient: 'linear-gradient(135deg, #744210, #975a16)', url: 'https://nindo.ca', tag: 'input' },
    mukwano: { initials: 'MUK', gradient: 'linear-gradient(135deg, #c05621, #dd6b20)', url: 'https://www.mukwano.com', tag: 'market' },
    bukola: { initials: 'BUK', gradient: 'linear-gradient(135deg, #805ad5, #9f7aea)', url: 'http://www.bukolachemicals.com', tag: 'input' },
    farmafrica: { initials: 'FAS', gradient: 'linear-gradient(135deg, #2c7a7b, #319795)', url: 'https://www.farmafrica.org', tag: 'input' },
    easeeds: { initials: 'EAS', gradient: 'linear-gradient(135deg, #9b2c2c, #c53030)', url: 'https://easeeds.com', tag: 'input' }
  };

  const partners = Object.keys(partnerMetadata).map(key => {
    const meta = partnerMetadata[key];
    return {
      id: key,
      name: partnerNames[lang]?.[key] || partnerNames.en[key],
      role: roles[lang]?.[key] || roles.en[key],
      initials: meta.initials,
      gradient: meta.gradient,
      url: meta.url,
      tagKey: meta.tag,
      tag: tags[lang]?.[meta.tag] || tags.en[meta.tag]
    };
  });

  const selectedTitle = titles[lang] || titles.en;

  return (
    <section id="partners" className="partners-section" ref={sectionRef} style={{ padding: '40px 0', backgroundColor: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
      <div className="container">
        {/* Section header */}
        <div className="partners-section-header" style={{
          textAlign: 'center',
          marginBottom: '36px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease'
        }}>
          <span className="partners-section-label" style={{
            fontSize: '0.8rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: 'var(--color-accent)',
            display: 'inline-block',
            marginBottom: '12px',
            backgroundColor: 'rgba(82, 183, 136, 0.1)',
            padding: '6px 16px',
            borderRadius: '50px'
          }}>
            {selectedTitle.pre}
          </span>
          <h3 className="partners-section-title" style={{
            fontSize: '2.2rem',
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            color: 'var(--color-primary-dark)',
            marginBottom: '16px'
          }}>
            {selectedTitle.main}
          </h3>
          <p style={{
            fontSize: '1rem',
            color: 'var(--color-text-light)',
            maxWidth: '650px',
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            {selectedTitle.sub}
          </p>
        </div>

        {/* Partner grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '48px'
        }}>
          {partners.map((p, i) => {
            const accent = tagColors[p.tagKey] || tagColors.input;
            return (
              <a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="partner-card-link"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#ffffff',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  borderRadius: '16px',
                  padding: '24px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)',
                  position: 'relative',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.97)',
                  transitionDelay: `${i * 0.05}s`
                }}
              >
                {/* External link diagonal arrow indicator */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  color: 'rgba(0, 0, 0, 0.3)',
                  transition: 'transform 0.3s ease, color 0.3s ease'
                }} className="partner-arrow-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7"></line>
                    <polyline points="7 7 17 7 17 17"></polyline>
                  </svg>
                </div>

                {/* Brand Initial Circle */}
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '12px',
                  background: p.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  fontFamily: 'var(--font-heading)',
                  marginBottom: '16px',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)'
                }}>
                  {p.initials}
                </div>

                {/* Tag pill */}
                <span style={{
                  alignSelf: 'flex-start',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: accent.bg,
                  color: accent.color,
                  border: `1px solid ${accent.border}`,
                  padding: '4px 10px',
                  borderRadius: '100px',
                  marginBottom: '12px',
                  letterSpacing: '0.02em'
                }}>
                  {p.tag}
                </span>

                {/* Partner Name */}
                <h4 style={{
                  fontSize: '1.1rem',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 750,
                  color: 'var(--color-primary-dark)',
                  marginBottom: '8px',
                  lineHeight: '1.3',
                  paddingRight: '16px'
                }}>
                  {p.name}
                </h4>

                {/* Partner Role / Description */}
                <p style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-text-light)',
                  lineHeight: '1.5',
                  flexGrow: 1
                }}>
                  {p.role}
                </p>

                {/* Hover animation CSS trick */}
                <style dangerouslySetInnerHTML={{__html: `
                  .partner-card-link:hover {
                    transform: translateY(-5px) !important;
                    border-color: var(--color-accent) !important;
                    box-shadow: 0 12px 24px rgba(27, 67, 50, 0.08) !important;
                  }
                  .partner-card-link:hover .partner-arrow-icon {
                    transform: translate(2px, -2px);
                    color: var(--color-accent) !important;
                  }
                `}} />
              </a>
            );
          })}
        </div>

        {/* Verification strip */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '32px',
          flexWrap: 'wrap',
          marginTop: '40px',
          paddingTop: '32px',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.7s ease 0.4s'
        }}>
          {[
            lang === 'en' ? '✅ URSB Registered (2021)' : '✅ Ocobbe URSB 2021',
            lang === 'en' ? '🏛️ Pader District Approved' : '🏛️ Approved i Pader District',
            lang === 'en' ? '🤝 PSFU Partner Organisation' : '🤝 PSFU Partner',
            lang === 'en' ? '📦 7 Districts Operational' : '📦 Adistrict 7 me tic',
          ].map((trust, idx) => (
            <span key={idx} style={{
              fontSize: '0.82rem',
              fontWeight: 650,
              color: 'var(--color-text-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              {trust}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

