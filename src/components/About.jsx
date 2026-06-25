import React, { useEffect, useRef, useState } from 'react';
import * as Icons from './Icons';
import { translations } from './translations';

export default function About({ lang, activeTab = 'overview', setActiveTab, translations: dynamicTranslations }) {
  const activeTranslations = dynamicTranslations || translations;
  const t = activeTranslations[lang] || activeTranslations.en;
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [staffQuery, setStaffQuery] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // 10 Core Values detailed text
  const coreValues = [
    { title: 'Honesty and Dignity', desc: 'To be guided by honesty and dignity in all the organization\'s work, relationship with partners and management of available resources.' },
    { title: 'Accountability', desc: 'Being responsible and answerable to all organization\'s undertakings.' },
    { title: 'Transparency', desc: 'Being accountable at all levels for the effectiveness of our actions and open in our judgments and communications with others.' },
    { title: 'Equity and Justice', desc: 'Requiring us to work to ensure equal opportunity to everyone, irrespective of race, age, gender, sexual orientation, HIV status, color, class, ethnicity, disability, location and religion.' },
    { title: 'Respect for Human Rights', desc: 'Everybody matters in the community and their views and contribution need to be recognized at all levels.' },
    { title: 'Information Sharing', desc: 'Ensure information reaches every person and within the required period.' },
    { title: 'Mutual Respect', desc: 'Requiring us to recognize the worth of all persons and the value of diversity.' },
    { title: 'Teamwork', desc: 'Jeroma staffs provide support to one another, working co-operatively, respecting one another’s views, and making their work environment fun and enjoyable.' },
    { title: 'Excellence', desc: 'Jeroma always does what they say they will and strive for excellence and quality in everything they do.' },
    { title: 'Ownership', desc: 'At Jeroma, they take ownership of customers\' needs and they are always accountable for delivering friendly and professional service to their clients.' },
    { title: 'Professionalism', desc: 'At all times Jeroma acts with integrity, providing quality service, being reliable and responsible.' },
    { title: 'Personal Development', desc: 'At Jeroma, they value learning, feedback and mentoring among team members as well as their clients.' }
  ];

  // Technical Staff Directory
  const staffMembers = [
    { name: 'Acuti Sam', position: 'Managing Director', phone: '0773623196', email: 'acutisam1@gmail.com' },
    { name: 'Apoc Emmanuel', position: 'General Secretary', phone: '0782608721', email: 'apocemmanuel@gmail.com' },
    { name: 'Logira Richard', position: 'General Manager', phone: '0772744198', email: 'Jeromafarmers.c@gmail.com' },
    { name: 'Ometo Silvia', position: 'Chief Executive Officer', phone: '0782314816', email: 'silviaometo@gmail.com' },
    { name: 'Adinga Marrish', position: 'Programme Coordinator', phone: '0774776442', email: 'adingamarrish@gmail.com' },
    { name: 'Akello Stella maris', position: 'Agricultural Field Officer', phone: '-', email: '-' },
    { name: 'Oyup Daniel', position: 'Agricultural Extension Officer', phone: '-', email: 'Jeromafarmers.c@gmail.com' },
    { name: 'Akello Oliver', position: 'Accountant', phone: '0774304101', email: 'oliverakello96@gmail.com' },
    { name: 'Acan Nancy', position: 'Procurement and Logistics Officer', phone: '0781137106', email: 'acanancy1989@gmail.com' },
    { name: 'Odulo Emmanuel', position: 'Receptionist', phone: '0782458347', email: 'oduloemmanueltabbo@gmail.com' },
    { name: 'Okwir Ronald', position: 'IT Specialist', phone: '0788556141', email: 'ronaldokwir1997@gmail.com' },
    { name: 'Ajok Alice Dina', position: 'Community Development Assistant', phone: '0771171682', email: 'alicedinaajok@gmail.com' },
    { name: 'Ajwang Juliet Holga', position: 'Monitoring and Evaluation (M & E)', phone: '0789280483', email: 'holgajulie88@gmail.com' },
    { name: 'Owiny Jimmy Eron', position: 'Extension Manager', phone: '0774862748', email: 'owinyjimmy@gmail.com' },
    { name: 'Adokorach Sunday Atupe', position: 'Environment Officer', phone: '0783778411', email: '-' },
    { name: 'Okot Patrick', position: 'Sales Officer', phone: '0782608721', email: '-' },
    { name: 'Oula George', position: 'Finance and Administration Manager', phone: '0773461885', email: 'Jeromafarmers.c@gmail.com' },
    { name: 'Okema Julius Lapyem', position: 'ICT Officer', phone: '-', email: 'Jeromafarmers.c@gmail.com' },
    { name: 'Grace Akullu Achot', position: 'Legal Advisor', phone: '0772374061', email: 'achotgrace@gmail.com' },
    { name: 'Tobby Okello', position: 'Advisor', phone: '0772660817', email: 'frtobbyok1999@gmail.com' }
  ];

  const businessHistory = [
    'Farm Consultancy & Agribusiness Project Design',
    'Agricultural Farm Input Supplies & Logistics',
    'Value chain Agricultural Extension Services: Farmers Group Mobilization & Training (GAP, Agribusiness, Farm Management, and cross-cutting issues)',
    'Farm Structure & Designing Agricultural Projects',
    'Compound Gardening & Landscaping',
    'Online Marketing & Direct Market Linkages',
    'Grain Supply and Commercial Trading',
    'V.S.L.A (Village Savings and Loan Association) Training',
    'Farmers Profiling & Database Registration',
    'Seeds and Agro-Input Subsidization Management'
  ];

  const partnersList = [
    { name: 'Pader District Local Government', role: 'Provides enabling environment for smooth operations, Farmer mobilization, quality assurance and regulations of our products/services.', url: 'https://www.pader.go.ug' },
    { name: 'Private Sector Foundation Uganda (PSFU)', role: 'Supporting capacity building, staffing under Work Readiness Programme for graduate employees.', url: 'https://www.psfuganda.org' },
    { name: 'GROW Project', role: 'Provide support to women entrepreneurs.', url: 'https://grow.go.ug' },
    { name: 'Eleglance Finance Ltd', role: 'Support farmer groups with soft agriculture and home improvement loans. Provide trainings on micro-support system, financial literacy, risk assessments, land acquisitions and documentations.', url: 'https://www.eleglancefinance.co.ug' },
    { name: 'NASECO Seed Company', role: 'Supply quality seeds to Jeroma FCC Ltd.', url: 'https://nasecoseeds.com' },
    { name: 'NIDO-Uganda', role: 'Supply organic fertilisers, imported seeds from S.Africa and Canada, garden mappings.', url: 'https://nindo.ca' },
    { name: 'Mukwano industries Uganda Ltd', role: 'Supply of Sunflower seeds(PANNAR) and grain market linkages.', url: 'https://www.mukwano.com' },
    { name: 'Bukola Inputs Ltd', role: 'Supply of plant protection products(agro-chemicals)', url: 'http://www.bukolachemicals.com' },
    { name: 'Farm Africa Solution', role: 'Supply of DK Maize seeds.', url: 'https://www.farmafrica.org' },
    { name: 'East African Seeds', role: 'Supply of maize seeds(PANNAR, Longe 5 and assorted vegetable seeds)', url: 'https://easeeds.com' }
  ];

  const filteredStaff = staffMembers.filter(s => 
    s.name.toLowerCase().includes(staffQuery.toLowerCase()) ||
    s.position.toLowerCase().includes(staffQuery.toLowerCase())
  );

  const tabsConfig = [
    { id: 'overview', label: lang === 'en' ? '1. Overview & History' : '1. Kwo & Acaki', icon: <Icons.Warehouse size={16} /> },
    { id: 'staffs', label: lang === 'en' ? '2. Staff & Governance' : '2. Luti & Tiye', icon: <Icons.Users size={16} /> },
    { id: 'partners', label: lang === 'en' ? '3. Partners' : '3. Oribbe mwa', icon: <Icons.Globe size={16} /> },
    { id: 'legal', label: lang === 'en' ? '4. Legal Status' : '4. Legal Status', icon: <Icons.Shield size={16} /> },
    { id: 'values', label: lang === 'en' ? '5. Core Values' : '5. Cik me Kwo', icon: <Icons.Award size={16} /> },
    { id: 'rationale', label: lang === 'en' ? '6. Partnership Rationale' : '6. Rationale me Pur', icon: <Icons.BarChart size={16} /> }
  ];

  return (
    <section id="about" className="section" style={{ backgroundColor: '#ffffff', padding: '40px 0' }} ref={sectionRef}>
      <div className="container">
        
        {/* Section Header */}
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="section-badge">{t.aboutBadge}</span>
          <h2 className="section-title" style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '12px 0' }}>
            {lang === 'en' ? 'Official Company Profile' : 'Nyig Lok me Jeroma Farmers'}
          </h2>
          <p className="section-subtitle" style={{ maxWidth: '700px', margin: '0 auto', color: 'var(--color-text-light)' }}>
            {lang === 'en' 
              ? 'Jeroma Farmers Collection Centre Limited operates legally across multiple districts in Northern and Eastern Uganda. Explore our governance, services, partners, and core values below.'
              : 'Jeroma Farmers Collection Centre Limited tiyo maber i adistrict mapol me Uganda. Nen tic mwa kede oribbe mwa piny.'}
          </p>
        </div>

        {/* Interactive Profile Tabs Layout */}
        <div className="profile-container" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid rgba(0,0,0,0.06)',
          padding: '24px',
          boxShadow: 'var(--shadow-md)',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          
          {/* Tab Navigation (Desktop) */}
          <div className="profile-tabs-header-desktop" style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            paddingBottom: '16px'
          }}>
            {tabsConfig.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (setActiveTab) setActiveTab(tab.id);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: '1px solid transparent',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  backgroundColor: activeTab === tab.id ? 'var(--color-primary)' : 'transparent',
                  color: activeTab === tab.id ? '#ffffff' : 'var(--color-text-light)',
                  transition: 'all 0.2s ease',
                  boxShadow: activeTab === tab.id ? '0 4px 12px rgba(27,67,50,0.2)' : 'none'
                }}
                className="profile-tab-btn"
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Navigation (Mobile Dropdown Select) */}
          <div className="profile-tabs-header-mobile" style={{ display: 'none', marginBottom: '8px' }}>
            <label htmlFor="profile-tab-select" style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-primary-dark)', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
              {lang === 'en' ? 'Select Section' : 'Yer Labolo'}
            </label>
            <select
              id="profile-tab-select"
              value={activeTab}
              onChange={(e) => {
                if (setActiveTab) setActiveTab(e.target.value);
              }}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(27,67,50,0.2)',
                background: '#ffffff',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                color: 'var(--color-primary-dark)'
              }}
            >
              {tabsConfig.map(tab => (
                <option key={tab.id} value={tab.id}>{tab.label.replace(/^\d\.\s/, '')}</option>
              ))}
            </select>
          </div>

          {/* Tab Content Panel */}
          <div className="profile-tab-content-panel" style={{ minHeight: '340px' }}>
            
            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary-dark)', fontWeight: 800, margin: 0 }}>
                    {lang === 'en' ? 'Company Overview' : 'Nyen me Company'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
                    <p style={{ margin: 0 }}><strong>{lang === 'en' ? 'Formal Name:' : 'Nying me Tic:'}</strong> Jeroma Farmers Collection Center Limited</p>
                    <p style={{ margin: 0 }}><strong>{lang === 'en' ? 'Formal Address:' : 'Keno me Tic:'}</strong> P.O. Box 330095, Lira City, Northern Uganda</p>
                    <p style={{ margin: 0 }}><strong>{lang === 'en' ? 'Operational Hubs:' : 'Kabedo me Tic:'}</strong> Lira, Kole, Pader, Agago, Kitgum, Abim, and Karenga districts</p>
                    <p style={{ margin: 0 }}><strong>{lang === 'en' ? 'Nature of Business:' : 'Kila me Tic:'}</strong> Private Limited Company</p>
                    <p style={{ margin: 0 }}><strong>{lang === 'en' ? 'Established:' : 'Dwe me Acaki:'}</strong> 2015 (Informally), Registered 2021</p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <div style={{ flex: 1, padding: '16px', background: 'rgba(27,67,50,0.04)', borderRadius: '12px', borderLeft: '3px solid var(--color-accent)' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 800, textTransform: 'uppercase' }}>{t.mission}</h4>
                      <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: '1.5' }}>
                        {t.missionText}
                      </p>
                    </div>
                    <div style={{ flex: 1, padding: '16px', background: 'rgba(27,67,50,0.04)', borderRadius: '12px', borderLeft: '3px solid var(--color-secondary)' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: 'var(--color-secondary)', fontWeight: 800, textTransform: 'uppercase' }}>{t.vision}</h4>
                      <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: '1.5' }}>
                        {t.visionText}
                      </p>
                    </div>
                  </div>

                  {/* Company Objectives Section */}
                  <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(27,67,50,0.04)', borderRadius: '12px', borderLeft: '3px solid var(--color-primary)' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--color-primary-dark)', fontWeight: 800, textTransform: 'uppercase' }}>
                      {lang === 'en' ? 'Company Objectives' : 'Cik me Anyim'}
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', lineHeight: '1.4' }}>
                      <li>To equip farmers with hands-on practical skills through the annual farmer training program.</li>
                      <li>To offer farmers consultancy services, farmer support, and farmers training to clients.</li>
                      <li>To carry on the business of selling and supplying high quality agro-inputs, general supplies, and construction works to esteemed customers.</li>
                      <li>To offer workshop services such as maintenance, planting seed, spraying, and other equipment hire.</li>
                      <li>To offer hands-on training on various farming skills and construction works.</li>
                      <li>To engage in market research to keep abreast with new trends and advise clients accordingly.</li>
                    </ul>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary-dark)', fontWeight: 800, margin: 0 }}>
                    {lang === 'en' ? 'Main Business History & Core Services' : 'Tic mwa me Meno'}
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                    {businessHistory.map((item, idx) => (
                      <li key={idx} style={{ lineHeight: '1.4' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 2. STAFFS & GOVERNANCE TAB */}
            {activeTab === 'staffs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: '#ffffff', fontWeight: 800, margin: 0 }}>
                      {lang === 'en' ? 'Governance & Technical Staff' : 'Luwak me Tic & Governance'}
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                      <strong>{lang === 'en' ? 'Total Employees:' : 'Employee Ducu:'}</strong> 24 (12 Male · 12 Female)
                    </p>
                  </div>
                  {/* Search Bar */}
                  <input
                    type="text"
                    placeholder={lang === 'en' ? 'Search staff by name or job title...' : 'Yen staff...'}
                    value={staffQuery}
                    onChange={(e) => setStaffQuery(e.target.value)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      width: '280px',
                      maxWidth: '100%'
                    }}
                  />
                </div>

                {/* Staff Gallery Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '10px' }}>
                  <div className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', border: 'var(--border-light)' }}>
                    <div style={{ height: '220px', overflow: 'hidden' }}>
                      <img src="/staff_directors.jpg" alt="Acuti Sam & Logira Richard" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '16px', flexGrow: 1 }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: 'var(--color-secondary)', fontWeight: 700 }}>Sam Acuti & Logira Richard</h4>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-light)', lineHeight: '1.4' }}>
                        {lang === 'en' ? 'Managing Director Acuti Sam (left) and General Manager Logira Richard (right) reviewing logistics at the Pader headquarters.' : 'MD Acuti Sam (tung cam) kede General Manager Logira Richard (tung lacuc) i ot tic me Pader.'}
                      </p>
                    </div>
                  </div>

                  <div className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', border: 'var(--border-light)' }}>
                    <div style={{ height: '220px', overflow: 'hidden' }}>
                      <img src="/staff_group_office.jpg" alt="Jeroma Technical Staff" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '16px', flexGrow: 1 }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: 'var(--color-secondary)', fontWeight: 700 }}>Technical & Extension Team</h4>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-light)', lineHeight: '1.4' }}>
                        {lang === 'en' ? 'Our professional team of managers, agronomy experts, and extension officers at the Jeroma Collection Centre office.' : 'Opur kede managers me Jeroma Farmers Collect Centre i ot tic me Lira.'}
                      </p>
                    </div>
                  </div>

                  <div className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', border: 'var(--border-light)' }}>
                    <div style={{ height: '220px', overflow: 'hidden' }}>
                      <img src="/staff_radio_partnership.jpg" alt="Broadcasting at Etoil A Karamoja FM" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '16px', flexGrow: 1 }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: 'var(--color-secondary)', fontWeight: 700 }}>Radio Outreach Broadcasts</h4>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-light)', lineHeight: '1.4' }}>
                        {lang === 'en' ? 'Jeroma Farmers representatives broadcasting weather warnings, planting guides, and crop prices on Etoil A Karamoja FM 92.7.' : 'Luwak me Jeroma i Etoil A Karamoja FM 92.7 pi pwonyo opur pi pur maber.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', background: 'var(--color-bg-white)', borderRadius: '12px', border: 'var(--border-light)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>{lang === 'en' ? 'Name' : 'Nying'}</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>{lang === 'en' ? 'Position' : 'Job Title'}</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>{lang === 'en' ? 'Telephone' : 'Simu'}</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>{lang === 'en' ? 'Email' : 'Email'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaff.map((staff, idx) => (
                        <tr key={idx} style={{ borderBottom: idx === filteredStaff.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 700 }}>{staff.name}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--color-accent)', fontWeight: 650 }}>{staff.position}</td>
                          <td style={{ padding: '12px 16px' }}>
                            {staff.phone !== '-' ? (
                              <a href={`tel:${staff.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>📞 {staff.phone}</a>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {staff.email !== '-' ? (
                              <a href={`mailto:${staff.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>✉️ {staff.email}</a>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                      {filteredStaff.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-light)' }}>
                            {lang === 'en' ? 'No staff members found matching your search.' : 'Pe anongo luti mo matching search ni.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '8px' }}>
                  <div style={{ padding: '16px', background: 'var(--color-bg-white)', borderRadius: '12px', border: 'var(--border-light)' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--color-secondary)', fontWeight: 800 }}>🏛️ Board & Governance</h4>
                    <p style={{ margin: '4px 0', fontSize: '0.82rem' }}><strong>Acuti Sam</strong> — Managing Director</p>
                    <p style={{ margin: '4px 0', fontSize: '0.82rem' }}><strong>Apoc Emmanuel</strong> — General Secretary</p>
                  </div>
                  <div style={{ padding: '16px', background: 'var(--color-bg-white)', borderRadius: '12px', border: 'var(--border-light)' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--color-secondary)', fontWeight: 800 }}>👥 Shareholders</h4>
                    <p style={{ margin: '4px 0', fontSize: '0.82rem' }}><strong>Acuti Sam</strong> — Managing Director</p>
                    <p style={{ margin: '4px 0', fontSize: '0.82rem' }}><strong>Apoc Emmanuel</strong> — General Secretary</p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. PARTNERS TAB */}
            {activeTab === 'partners' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary-dark)', fontWeight: 800, margin: 0 }}>
                  {lang === 'en' ? 'Strategic Affiliations & Partnerships' : 'Oribbe mwa me Pur'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                  {partnersList.map((partner, idx) => (
                    <a
                      key={idx}
                      href={partner.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        padding: '16px',
                        background: '#ffffff',
                        border: '1px solid rgba(0,0,0,0.06)',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                      className="profile-partner-card"
                    >
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.92rem', color: 'var(--color-primary-dark)', fontWeight: 800, paddingRight: '20px' }}>
                        {idx + 1}. {partner.name}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-light)', lineHeight: '1.4' }}>
                        {partner.role}
                      </p>
                      <div style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--color-accent)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="7" y1="17" x2="17" y2="7"></line>
                          <polyline points="7 7 17 7 17 17"></polyline>
                        </svg>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 4. LEGAL STATUS TAB */}
            {activeTab === 'legal' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary-dark)', fontWeight: 800, margin: 0 }}>
                  {lang === 'en' ? 'Legal Status & Registration Details' : 'Cik me Ndiga kede Registrations'}
                </h3>
                
                <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(27,67,50,0.04)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>{lang === 'en' ? 'Registered With' : 'Kabedo me Ndiga'}</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>{lang === 'en' ? 'Registration Number' : 'Namba me Ndiga'}</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>{lang === 'en' ? 'Registration Date' : 'Dwe me Ndiga'}</th>
                        <th style={{ padding: '12px 16px', fontWeight: 800 }}>{lang === 'en' ? 'Expiry Date' : 'Dwe me Expiry'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>URSB (Uganda Registration Services Bureau)</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>80020003312141</td>
                        <td style={{ padding: '12px 16px' }}>08/10/2021</td>
                        <td style={{ padding: '12px 16px', color: 'green', fontWeight: 600 }}>Open / Permanent</td>
                      </tr>
                      <tr style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>URA (Uganda Revenue Authority TIN)</td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>1020040260</td>
                        <td style={{ padding: '12px 16px' }}>07/12/2021</td>
                        <td style={{ padding: '12px 16px', color: 'green', fontWeight: 600 }}>Open / Permanent</td>
                      </tr>
                      <tr style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>NSSF (National Social Security Fund)</td>
                        <td style={{ padding: '12px 16px', color: 'var(--color-text-light)' }}>Registered / Compliant</td>
                        <td style={{ padding: '12px 16px' }}>-</td>
                        <td style={{ padding: '12px 16px', color: 'green', fontWeight: 600 }}>Open</td>
                      </tr>
                      <tr style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>MAAIF (Ministry of Agriculture, Animal Industry & Fisheries)</td>
                        <td style={{ padding: '12px 16px', color: 'var(--color-text-light)' }}>Licensed Agro-input Dealer</td>
                        <td style={{ padding: '12px 16px' }}>-</td>
                        <td style={{ padding: '12px 16px', color: 'green', fontWeight: 600 }}>Active</td>
                      </tr>
                      <tr style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>PPDA (Public Procurement & Disposal Authority)</td>
                        <td style={{ padding: '12px 16px', color: 'var(--color-text-light)' }}>Registered Provider</td>
                        <td style={{ padding: '12px 16px' }}>-</td>
                        <td style={{ padding: '12px 16px', color: 'green', fontWeight: 600 }}>Active</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. CORE VALUES TAB */}
            {activeTab === 'values' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary-dark)', fontWeight: 800, margin: 0 }}>
                  {lang === 'en' ? 'Core Values & Organisational Principles' : 'Cik me Kwo me Company'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {coreValues.map((val, idx) => (
                    <div key={idx} style={{ padding: '16px', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 800 }}>
                        ✨ {val.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-light)', lineHeight: '1.4' }}>
                        {val.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. PARTNERSHIP RATIONALE TAB */}
            {activeTab === 'rationale' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary-dark)', fontWeight: 800, margin: 0 }}>
                    {lang === 'en' ? 'Target Beneficiaries & Goals' : 'Luwak me target kede wel'}
                  </h3>
                  <div style={{ padding: '16px', background: 'rgba(82, 183, 136, 0.08)', border: '1px solid rgba(82, 183, 136, 0.3)', borderRadius: '12px' }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                      👥 3,000+ Youths Targeted
                    </p>
                    <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: '1.5' }}>
                      Aged 16 to 35 years old (<strong>70% females</strong>), including child-headed families, PWDs, school dropouts, and child mothers across Pader, Kitgum, Agago, Abim, Karenga, Kole, and Lamwo districts.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                    <h4 style={{ margin: '4px 0 2px 0', color: 'var(--color-primary-dark)', fontWeight: 800 }}>🔍 Identified Gaps Addressed:</h4>
                    <p style={{ margin: '2px 0' }}>• Limited access to and unavailability of quality improved seeds/inputs.</p>
                    <p style={{ margin: '2px 0' }}>• Inadequate youth knowledge/skills on value chain development.</p>
                    <p style={{ margin: '2px 0' }}>• Lack of credible market information and marketing skills.</p>
                    <p style={{ margin: '2px 0' }}>• Inadequate capital to support strategic agricultural production.</p>
                    <p style={{ margin: '2px 0' }}>• Negative attitude towards farming.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', color: 'var(--color-primary-dark)', fontWeight: 800, margin: 0 }}>
                    {lang === 'en' ? 'Strategic Interventions & Outcomes' : 'Interventions kede expected outcomes'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                    <p style={{ margin: '4px 0' }}><strong>🌾 Seed Subsidies:</strong> Managed at <strong>30% farmer contribution : 70% project contribution</strong> ratio.</p>
                    <p style={{ margin: '4px 0' }}><strong>📊 Profiling & Training:</strong> Registering and training lead youth on Good Agronomic Practices (GAP) and post-harvest technology.</p>
                    <p style={{ margin: '4px 0' }}><strong>📈 Economic Outcomes:</strong> Employment as lead farmers / site coordinators earning commission, positive mindset change, increased household incomes, and direct market accessibility.</p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
      
      {/* Dynamic Style Injection for Responsive Tabs */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 991px) {
          .profile-tabs-header-desktop {
            display: none !important;
          }
          .profile-tabs-header-mobile {
            display: block !important;
          }
        }
        .profile-partner-card:hover {
          border-color: var(--color-accent) !important;
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }
      `}} />
    </section>
  );
}
