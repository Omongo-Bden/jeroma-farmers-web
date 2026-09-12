import React, { useState } from 'react';
import { translations } from './translations';

export default function Projects({ lang, translations: dynamicTranslations }) {
  const [activeImage, setActiveImage] = useState(null);
  
  const activeTranslations = dynamicTranslations || translations;
  const t = activeTranslations[lang] || activeTranslations.en;

  const projectList = [
    {
      id: 'a2i_cohort1',
      badge: lang === 'en' ? 'Agro-Modernization' : 'Dongopur me Nyen',
      statusBadge: lang === 'en' ? 'Implementation Stage' : 'Dwol me Tic me Poto',
      title: lang === 'en' ? 'Agricultural Modernization & Capacity Building Initiative — Cohort 1' : 'Agricultural Modernization & Capacity Building Initiative — Cohort 1',
      subtitle: lang === 'en' ? 'In conjunction with Access to Innovation (A2I) & supported by the Danish Government' : 'Oribbe ki Access to Innovation (A2I) kede cwak ma oa ki bot Gavumenti me Denmark',
      timeline: lang === 'en' ? 'July 2026 — Present (Active Implementation)' : 'July 2026 — Kombedi (Dwol me Tic me Poto)',
      calloutTitle: lang === 'en' ? 'Active Operations: Hands-On Farmer Training in Progress' : 'Tic me Poto ma Tye ka Medde: Pwonj me Lupur',
      calloutLead: lang === 'en'
        ? 'Jeroma Farmers Collection Centre Ltd is actively conducting field training with local farmers, jointly conducted by Commercial Partner Banks, Jeroma Agronomy Experts, and Access to Innovation (A2I) teams.'
        : 'Jeroma Farmers Collection Centre Ltd tye ka kuto pwonj matek bot lupur i paco, ma team me Bank me Biacara, Agronomy me Jeroma, kede Access to Innovation (A2I) tye ka miyo kanyacel.',
      trainingPillars: [
        {
          icon: '🏦',
          title: lang === 'en' ? 'Commercial Partner Banks' : 'Bank me Biacara',
          desc: lang === 'en'
            ? 'Financial literacy, cooperative savings schemes, farm cash-flow management, and fair agricultural credit access.'
            : 'Pwonj me neno cente (financial literacy), gwoko cente i SACCO, kede yero credit me bank ma konyo opur.'
        },
        {
          icon: '🌾',
          title: lang === 'en' ? 'Jeroma Agronomy & Field Team' : 'Agronomy me Jeroma',
          desc: lang === 'en'
            ? 'Good Agronomic Practices (GAP), moisture control testing, post-harvest grain preservation, and guaranteed market off-taking.'
            : 'Pur maber (GAP), pimo moisture me cam, kano keyo maber wek pe obale, kede market me cula cutcut.'
        },
        {
          icon: '⚙️',
          title: lang === 'en' ? 'A2I & Danish Support' : 'Machinery ki A2I & Denmark',
          desc: lang === 'en'
            ? 'Demonstrations and operation of modern threshers, cyclone shellers, and solar dryers designed to avoid smallholder debt burdens.'
            : 'Pwonjo tic ki mashini me pur (threshers, shellers, solar dryers) kede cwak me Gavumenti me Denmark ma pe kelo deni bot lupur.'
        }
      ],
      milestones: [
        { label: lang === 'en' ? 'Field Assessment' : 'Limo Poto', status: 'done', detail: lang === 'en' ? 'Lango & Acholi' : 'Lango & Acholi' },
        { label: lang === 'en' ? 'SACCO Selection' : 'Yer Cooperatives', status: 'done', detail: lang === 'en' ? '12 Pilot Cooperatives' : 'SACCOs 12' },
        { label: lang === 'en' ? 'Farmer Training' : 'Pwonj me Lupur', status: 'active', detail: lang === 'en' ? 'Banks + Jeroma + A2I' : 'Bank + Jeroma + A2I' },
        { label: lang === 'en' ? 'Machinery Rollout' : 'Keto Mashini', status: 'progress', detail: lang === 'en' ? 'Threshers & Dryers' : 'Mashini me pur' },
        { label: lang === 'en' ? 'Impact Review' : 'Neno Adwogi', status: 'upcoming', detail: lang === 'en' ? 'Annual Evaluation' : 'Neno dongo' },
      ],
      descriptionParagraphs: lang === 'en'
        ? [
            'The Agricultural Modernization & Capacity Building Initiative (Cohort 1) has officially advanced into its active Implementation Stage. In close conjunction with Access to Innovation (A2I) and backed by the Danish Government, Jeroma Farmers Collection Centre Ltd is actively conducting hands-on training sessions with smallholder farmers, agricultural cooperatives, and SACCO members across the Lango and Acholi subregions.',
            'These multi-stakeholder training sessions are jointly conducted in the field by commercial partner banks, Jeroma agronomy specialists, and A2I technical teams. Together, they are bridging the gap between modern financial management, practical farm mechanization, and efficient post-harvest handling. Farmers receive direct instruction on operating motorized threshers and raised solar drying units, maintaining optimal grain moisture to eliminate aflatoxins, and leveraging formal banking credit to expand production sustainably without capital-intensive debt.'
          ]
        : [
            'Prujek me Agricultural Modernization & Capacity Building Initiative (Cohort 1) dong ocopo i Dwol me Tic me Poto (Implementation Stage). I ribbe tic ki Access to Innovation (A2I) kede cwak ma oa ki bot Gavumenti me Denmark, Jeroma Farmers Collection Centre Ltd tye ka timo pwonj mapol me poto kanyacel ki lupur, cooperatives, kede SACCOs i Lango ki Acholi subregions.',
            'Dwol me tic man kelo kanyacel commercial partner banks, agronomy specialists me Jeroma, kede technical team me A2I i kabedo me lupur. Pwonj man konyo lupur me niang neno cente me bank (financial literacy kede credit), tic ki mashini me pur ma nyen (threshers, maize shellers, kede solar drying racks), kede gengo bal me keyo wek cam onong wel ma lye i market ma pe kelo twon burcent kede banja bot lupur.'
          ],
      images: [
        { src: '/a2i_project_1.jpg', label: lang === 'en' ? 'Della Will Outlet (Anaka)' : 'Della Will Outlet (Anaka)' },
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
            maxWidth: '700px',
            margin: '0 auto',
            color: 'rgba(168,230,200,0.75)',
            fontSize: '1rem',
            lineHeight: 1.6
          }}>
            {lang === 'en' 
              ? 'Discover our collaborative initiatives aimed at building capacity, introducing smart machinery, and improving farmer livelihoods in Northern Uganda.'
              : 'Nen oribbe tic kede program mwa ducu pi dongo pur kede machinery maber me konyo kwo me lupur i Northern Uganda.'}
          </p>
        </div>

        {/* Project List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {projectList.map((project) => (
            <div key={project.id} style={{
              background: 'rgba(15,48,32,0.55)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(82,183,136,0.25)',
              borderRadius: '24px',
              padding: '36px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              transition: 'transform 0.3s ease, border-color 0.3s ease',
            }}>
              {/* Badges & Timeline Row */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  backgroundColor: '#1b4332',
                  color: '#52b788',
                  border: '1.5px solid #52b788',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  letterSpacing: '0.04em'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#22c55e',
                    boxShadow: '0 0 8px #22c55e',
                    display: 'inline-block'
                  }}></span>
                  🚀 {project.statusBadge}
                </span>

                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(82,183,136,0.15)',
                  color: '#a8e6c8',
                  border: '1px solid rgba(82,183,136,0.3)',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  textTransform: 'uppercase'
                }}>
                  🏷️ {project.badge}
                </span>

                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.85)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  🇩🇰 {lang === 'en' ? 'Danish Gov & A2I Partnership' : 'Cwak me Gavumenti me Denmark & A2I'}
                </span>

                <span style={{ fontSize: '0.85rem', color: 'rgba(168,230,200,0.7)', fontWeight: 500, marginLeft: 'auto' }}>
                  📅 {project.timeline}
                </span>
              </div>

              {/* Title & Subtitle */}
              <h3 style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#fff',
                marginBottom: '8px',
                fontFamily: 'var(--font-heading)',
                lineHeight: 1.3
              }}>
                {project.title}
              </h3>

              <h4 style={{
                fontSize: '1.05rem',
                color: '#52b788',
                fontWeight: 600,
                margin: '0 0 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                <span>🤝</span>
                <span>{project.subtitle}</span>
              </h4>

              {/* Active Training Highlight Box */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(27,67,50,0.8) 0%, rgba(10,38,23,0.9) 100%)',
                border: '1.5px solid rgba(82,183,136,0.4)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '28px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span style={{
                    backgroundColor: '#d8f3dc',
                    color: '#081c15',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    {lang === 'en' ? 'Live Phase' : 'Dwol ma Kombedi'}
                  </span>
                  <h5 style={{
                    margin: 0,
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    fontFamily: 'var(--font-heading)'
                  }}>
                    📍 {project.calloutTitle}
                  </h5>
                </div>

                <p style={{
                  color: 'rgba(255,255,255,0.92)',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  margin: '0 0 18px',
                  fontWeight: 500
                }}>
                  {project.calloutLead}
                </p>

                {/* 3 Partner Pillars Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '14px'
                }}>
                  {project.trainingPillars.map((pillar, idx) => (
                    <div key={idx} style={{
                      backgroundColor: 'rgba(8,28,21,0.65)',
                      border: '1px solid rgba(82,183,136,0.25)',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.3rem' }}>{pillar.icon}</span>
                        <h6 style={{
                          margin: 0,
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: '#52b788',
                          fontFamily: 'var(--font-heading)'
                        }}>
                          {pillar.title}
                        </h6>
                      </div>
                      <p style={{
                        margin: 0,
                        fontSize: '0.82rem',
                        color: 'rgba(255,255,255,0.8)',
                        lineHeight: 1.5
                      }}>
                        {pillar.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestones Horizontal Lifecycle Bar */}
              <div style={{
                backgroundColor: 'rgba(8,28,21,0.5)',
                border: '1px solid rgba(82,183,136,0.2)',
                borderRadius: '14px',
                padding: '18px 20px',
                marginBottom: '28px'
              }}>
                <div style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: 'rgba(168,230,200,0.6)',
                  fontWeight: 700,
                  marginBottom: '12px'
                }}>
                  📈 {lang === 'en' ? 'Project Lifecycle & Milestones' : 'Dwol me Tic me Prujek'}
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: '10px'
                }}>
                  {project.milestones.map((ms, idx) => {
                    const isDone = ms.status === 'done';
                    const isActive = ms.status === 'active';
                    return (
                      <div key={idx} style={{
                        backgroundColor: isActive ? 'rgba(82,183,136,0.18)' : 'rgba(255,255,255,0.03)',
                        border: isActive ? '1.5px solid #52b788' : isDone ? '1px solid rgba(82,183,136,0.35)' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.7rem', color: isActive ? '#52b788' : isDone ? '#a8e6c8' : 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
                            {idx + 1}. {ms.label}
                          </span>
                          <span style={{ fontSize: '0.8rem' }}>
                            {isDone ? '✅' : isActive ? '🔄' : '⏳'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: isActive ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: isActive ? 600 : 400 }}>
                          {ms.detail}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Main Content & Gallery Split Layout */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', alignItems: 'flex-start' }}>
                {/* Narrative Description */}
                <div style={{ flex: '1 1 500px' }}>
                  <h5 style={{
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: 'rgba(168,230,200,0.6)',
                    fontWeight: 700,
                    marginBottom: '12px'
                  }}>
                    📋 {lang === 'en' ? 'Program Overview & Implementation Details' : 'Lok me Tic me Prujek'}
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {project.descriptionParagraphs.map((para, idx) => (
                      <p key={idx} style={{
                        color: 'rgba(255,255,255,0.88)',
                        fontSize: '0.98rem',
                        lineHeight: 1.7,
                        margin: 0
                      }}>
                        {para}
                      </p>
                    ))}
                  </div>

                  {/* Impact Stats Row */}
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    flexWrap: 'wrap',
                    marginTop: '24px',
                    paddingTop: '20px',
                    borderTop: '1px solid rgba(82,183,136,0.15)'
                  }}>
                    <div style={{ flex: '1 1 120px' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#52b788', fontFamily: 'var(--font-heading)' }}>1,800+</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>{lang === 'en' ? 'Target Farmers' : 'Opur ma Watimo'}</div>
                    </div>
                    <div style={{ flex: '1 1 120px' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#52b788', fontFamily: 'var(--font-heading)' }}>15</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>{lang === 'en' ? 'Partner SACCOs' : 'SACCOs me Tic'}</div>
                    </div>
                    <div style={{ flex: '1 1 120px' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#52b788', fontFamily: 'var(--font-heading)' }}>3 Pillars</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>{lang === 'en' ? 'Banks · Jeroma · A2I' : 'Bank · Jeroma · A2I'}</div>
                    </div>
                    <div style={{ flex: '1 1 120px' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#52b788', fontFamily: 'var(--font-heading)' }}>0% Debt</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>{lang === 'en' ? 'Zero Debt Burden' : 'Pe Kelo Banja'}</div>
                    </div>
                  </div>
                </div>

                {/* Local Gallery Grid inside the project card */}
                <div style={{ flex: '1 1 420px', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <h5 style={{
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      color: 'rgba(168,230,200,0.6)',
                      letterSpacing: '1px',
                      margin: 0,
                      fontWeight: 700
                    }}>
                      📸 {lang === 'en' ? 'Field & Implementation Gallery' : 'Ot me Cal me Tic me Poto'}
                    </h5>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(168,230,200,0.5)' }}>
                      {lang === 'en' ? 'Click photo to expand' : 'Dii cal me yab'}
                    </span>
                  </div>

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
                          border: '2px solid rgba(82,183,136,0.2)',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.04)';
                          e.currentTarget.style.borderColor = '#52b788';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.borderColor = 'rgba(82,183,136,0.2)';
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
                          background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                          padding: '8px 6px',
                          textAlign: 'center'
                        }}>
                          <span style={{ fontSize: '0.68rem', color: '#fff', fontWeight: 600, display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
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
                background: 'rgba(255,255,255,0.15)',
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
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
