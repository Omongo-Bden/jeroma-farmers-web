import React, { useState } from 'react';
import { translations } from './translations';

export default function Projects({ lang, translations: dynamicTranslations }) {
  const [activeImage, setActiveImage] = useState(null);
  
  const activeTranslations = dynamicTranslations || translations;
  const t = activeTranslations[lang] || activeTranslations.en;

  const projectList = [
    {
      id: 'a2i_cohort1',
      badge: lang === 'en' ? 'Active Project' : 'Prujek me Tice',
      title: lang === 'en' ? 'Access to Innovation (A2I) — Cohort 1' : 'Access to Innovation (A2I) — Cohort 1',
      subtitle: lang === 'en' ? 'In partnership with A2I and supported by the Danish Government' : 'Oribbe ki A2I kede cwak me Gavumenti me Denmark',
      timeline: lang === 'en' ? 'July 10, 2026 — July 14, 2026' : 'July 10, 2026 — July 14, 2026',
      description: lang === 'en'
        ? 'Jeroma, in conjunction with Access to Innovation and with support from the Danish Government, successfully completed its First Cohort field program. From Saturday July 10 to Tuesday July 14, 2026, the joint delegation visited SACCOs, cooperatives, and farming institutions in the Lango and Acholi subregions. The program aimed to assess local capacities, identify technical and business needs, and identify appropriate machinery that can optimize farming workflows without placing financial burdens on farmers.'
        : 'Jeroma, i ribbe tic ki Access to Innovation kede cwak ma oa ki bot Gavumenti me Denmark, ocoyo Program me Cohort Mukwongo me abiri 10-14 July 2026. Team mwa olimo SACCOs kede cooperatives i Lango ki Acholi subregions pi neno machinery ma twero konyo lupur maber me pe kelo burden bot lupur.',
      images: [
        { src: '/a2i_project_1.jpg', label: lang === 'en' ? 'Field Visitation' : 'Limo Poto' },
        { src: '/a2i_project_2.jpg', label: lang === 'en' ? 'Store & Honey Grading' : 'Ot me Kic' },
        { src: '/a2i_project_3.jpg', label: lang === 'en' ? 'Millet Packaging' : 'Pako Mogo' },
        { src: '/a2i_project_4.jpg', label: lang === 'en' ? 'Cooperative Discussion' : 'Lok me Lwak' },
        { src: '/a2i_project_5.jpg', label: lang === 'en' ? 'Payira Dit Ltd Visit' : 'Payira Dit Ltd' }
      ]
    }
  ];

  return (
    <section id="projects" style={{
      padding: '80px 16px',
      backgroundColor: '#081c15',
      backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(15,51,34,0.3) 0%, rgba(8,28,21,1) 90%)',
      color: '#fff',
      borderTop: '1px solid rgba(82,183,136,0.1)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: '#52b788',
            fontWeight: 700,
            background: 'rgba(82,183,136,0.1)',
            padding: '6px 14px',
            borderRadius: '20px',
            display: 'inline-block',
            marginBottom: '14px',
            boxShadow: 'inset 0 0 10px rgba(82,183,136,0.15)'
          }}>
            📁 {lang === 'en' ? 'Initiatives & Programs' : 'Program me Tice'}
          </span>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: '#fff',
            margin: '0 0 16px',
            fontFamily: 'var(--font-heading)',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            {lang === 'en' ? 'Our Projects' : 'Prujek Mwa'}
          </h2>
          <p style={{
            maxWidth: '650px',
            margin: '0 auto',
            color: 'rgba(168,230,200,0.7)',
            fontSize: '1rem',
            lineHeight: 1.6
          }}>
            {lang === 'en' 
              ? 'Discover our collaborative initiatives aimed at building capacity, introducing smart machinery, and improving livelihoods across the region.'
              : 'Nen oribbe tic kede program mwa ducu pi dongo pur kede machinery maber me konyo kwo me lupur.'}
          </p>
        </div>

        {/* Project List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {projectList.map((project) => (
            <div key={project.id} style={{
              background: 'rgba(15,48,32,0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(82,183,136,0.2)',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              transition: 'transform 0.3s ease, border-color 0.3s ease',
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'flex-start' }}>
                {/* Info Text */}
                <div style={{ flex: '1 1 500px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: '#52b788',
                      color: '#081c15',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      textTransform: 'uppercase'
                    }}>
                      {project.badge}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'rgba(168,230,200,0.6)', fontWeight: 500 }}>
                      📅 {project.timeline}
                    </span>
                  </div>

                  <h3 style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: '#fff',
                    marginBottom: '8px',
                    fontFamily: 'var(--font-heading)'
                  }}>
                    {project.title}
                  </h3>
                  <h4 style={{
                    fontSize: '1rem',
                    color: '#52b788',
                    fontWeight: 600,
                    margin: '0 0 20px'
                  }}>
                    {project.subtitle}
                  </h4>
                  
                  <p style={{
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: '1rem',
                    lineHeight: 1.7,
                    margin: 0
                  }}>
                    {project.description}
                  </p>
                </div>

                {/* Local Gallery Grid inside the project card */}
                <div style={{ flex: '1 1 450px', width: '100%' }}>
                  <h5 style={{
                    fontSize: '0.9rem',
                    textTransform: 'uppercase',
                    color: 'rgba(168,230,200,0.5)',
                    letterSpacing: '1px',
                    marginBottom: '14px',
                    fontWeight: 700
                  }}>
                    📸 {lang === 'en' ? 'Project Gallery' : 'Ot me Cal'}
                  </h5>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: '12px'
                  }}>
                    {project.images.map((img, index) => (
                      <div 
                        key={index}
                        onClick={() => setActiveImage(img.src)}
                        style={{
                          aspectRatio: '4/3',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          border: '2px solid rgba(82,183,136,0.15)',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.borderColor = '#52b788';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.borderColor = 'rgba(82,183,136,0.15)';
                        }}
                      >
                        <img 
                          src={img.src} 
                          alt={img.label}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }} 
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                          padding: '6px 8px',
                          textAlign: 'center'
                        }}>
                          <span style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 600 }}>
                            {img.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox / Modal */}
      {activeImage && (
        <div 
          onClick={() => setActiveImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            animation: 'fadeIn 0.25s ease-out'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <img 
              src={activeImage} 
              alt="Expanded project photo"
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                borderRadius: '16px',
                border: '3px solid rgba(82,183,136,0.3)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
              }}
            />
            <button 
              onClick={() => setActiveImage(null)}
              style={{
                position: 'absolute',
                top: '-45px',
                right: '0',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                fontSize: '1.5rem',
                cursor: 'pointer',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
