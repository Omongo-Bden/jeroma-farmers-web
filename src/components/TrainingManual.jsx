import React, { useState, useEffect } from 'react';
import * as Icons from './Icons';
import { getManual } from '../utils/db';

const DEFAULT_STAGES = [
  {
    id: 'site-selection',
    num: '01',
    title_en: 'Site Selection',
    title_luo: 'Yer Lobo Pur',
    subtitle_en: 'Choose the right land for your crops',
    subtitle_luo: 'Yer lobo ma ber pi cam',
    image: '/sunflower_field.png',
    points: [
      'Select well-drained soils with good organic matter content.',
      'Avoid waterlogged areas and steep slopes to prevent erosion and root suffocation.',
      'Consider accessibility for input delivery and produce evacuation.',
      'Ensure adequate sunlight exposure throughout the day for maximum photosynthesis.',
      'Test soil pH and nutrient levels before planting to determine crop suitability.'
    ],
    naroAdvice: 'NARO recommends sandy loam or clay loam soils with high water retention but free drainage. Avoid waterlogged areas as they stunt root development and promote fungal root rot.'
  },
  {
    id: 'farmer-profiling',
    num: '02',
    title_en: 'Farmer Training & Profiling',
    title_luo: 'Pwonj kede Profiling Opur',
    subtitle_en: 'Know your farmers, build their capacity',
    subtitle_luo: 'Nge opur miri kede dongo twerogi',
    image: '/farmers_training_1.png',
    points: [
      'Farmer registration and profiling (location, farm size, crops, and household info).',
      'Classroom and field-based training on modern Good Agricultural Practices (GAP).',
      'Group formation and cooperative strengthening for bulk input purchasing and sales.',
      'Record-keeping and farm business management training.',
      'Financial literacy, savings culture (VSLA), and market access education.'
    ],
    tags: ['Farmer training', 'Community outreach', 'Women farmers group']
  },
  {
    id: 'quality-inputs',
    num: '03',
    title_en: 'Seed Selection & Quality Inputs',
    title_luo: 'Yer Kodi kede Agro-Inputs Maber',
    subtitle_en: 'Start with certified seeds',
    subtitle_luo: 'Cak kede kodi ma okadi maber',
    image: '/farmer_man_seedco.png',
    points: [
      'Use only certified seeds from trusted, licensed suppliers like Jeroma.',
      'Select improved varieties suited to your specific agro-ecological zone and season.',
      'Check seed germination rates (should be above 85%) before planting.',
      'Store seeds properly in cool, dry conditions away from pests and direct light.',
      'Purchase inputs (fertilizers, eco-friendly pesticides) early from Jeroma store.'
    ],
    naroAdvice: 'For maize, NARO recommends the Longe series (Longe 5, Longe 7-H, Longe 10-H) which are drought-tolerant and resistant to Maize Streak Virus. For sunflowers, use Sunfola, PAN 7057, or other high-oil certified hybrids.'
  },
  {
    id: 'land-preparation',
    num: '04',
    title_en: 'Land Preparation',
    title_luo: 'Cobo Poto me Pur',
    subtitle_en: 'Good land prep ensures a strong start',
    subtitle_luo: 'Cobo poto maber miyo cako maber',
    image: '/land_prep.png',
    points: [
      'Clear the land early (at least 4 weeks before rains) — remove weeds, stumps, and debris.',
      'Plow to a depth of 20–30 cm to loosen compacted soil and improve rooting depth.',
      'Make ridges or beds depending on crop requirements to manage water runoff.',
      'Allow soil to settle and organic matter to decompose before planting.',
      'Apply organic manure or compost during the final tillage stage.'
    ],
    reminderBox: {
      title_en: 'Why Good Land Prep Matters',
      title_luo: 'Pingo Cobo Poto Calo Aier Mitte',
      items: [
        'Loosens soil and allows fine tilth for optimal seed-soil contact.',
        'Conserves moisture and improves water infiltration/drainage.',
        'Reduces weed pressure from the very start of the season.',
        'Creates a better rooting environment for faster crop establishment.'
      ]
    },
    naroAdvice: 'Plough land twice: the first deep ploughing should be done early to allow buried weeds to decay. Perform the second ploughing (harrowing) just before the rains to achieve a fine, loose soil tilth that promotes uniform seed germination.'
  },
  {
    id: 'planting',
    num: '05',
    title_en: 'Planting',
    title_luo: 'Koyo Kodi i Poto',
    subtitle_en: 'Plant at the right time, depth, and spacing',
    subtitle_luo: 'Koyo kodi i dwe, dit kede spacing maber',
    image: '/planting_maize.png',
    points: [
      'Plant at the onset of reliable seasonal rains to avoid crop failure from false starts.',
      'Follow recommended spacing: maize 75×25 cm, sunflower 60×30 cm.',
      'Plant seeds at correct depth: 3–5 cm for most cereal and oil seeds.',
      'Apply basal fertilizer (DAP or NPK) at planting, placed in separate holes 5 cm away from seeds.',
      'Ensure uniform plant population across the entire field.'
    ],
    naroAdvice: 'Maize: spacing of 75 cm between rows and 25 cm between plants is recommended for single seeds. If planting 2 seeds per hole, increase plant spacing to 50 cm. Sunflower: row spacing should be 75 cm with 35 cm between plants. Plant at a depth of 4–5 cm.'
  },
  {
    id: 'crop-management',
    num: '06',
    title_en: 'Weeding & Crop Management',
    title_luo: 'Lilo Adoo kede Management me Pur',
    subtitle_en: 'Keep your fields clean and competitive',
    subtitle_luo: 'Kano poto miri maber kede lilo adoo',
    image: '/weeding_crops.png',
    points: [
      'First weeding: 2–3 weeks after crop emergence (critical stage to avoid yield loss).',
      'Second weeding: 5–6 weeks after emergence, before canopy closure.',
      'Use hand hoes or approved herbicides (strictly follow safety and dosage guidelines).',
      'Apply top-dressing fertilizer (Urea or CAN) during the first weeding or at knee-high stage.',
      'Gap-fill missing plants within 2 weeks of emergence to maintain plant population.'
    ],
    naroAdvice: 'The first 4 weeks of a crop\'s life are critical. Weed competition during this period can reduce final yields by up to 70%. Ensure top-dressing fertilizers are applied when the soil is moist to prevent nitrogen volatilization.'
  },
  {
    id: 'extension-services',
    num: '07',
    title_en: 'Extension Services',
    title_luo: 'Tic me Extension me Pur',
    subtitle_en: 'Ongoing technical support throughout the season',
    subtitle_luo: 'Kony me technical ducu i season pur',
    image: '/extension_visit.png',
    points: [
      'Regular field visits by trained extension officers from Jeroma.',
      'Pest and disease scouting and early detection techniques.',
      'Soil fertility assessments and tailored fertilizer recommendations.',
      'Climate smart agriculture and weather advisory services.',
      'Mobile-based support and SMS-based agronomic updates.'
    ]
  },
  {
    id: 'pest-management',
    num: '08',
    title_en: 'Pest & Disease Management',
    title_luo: 'Ronge me Ginnipiny kede Yat',
    subtitle_en: 'Protect your investment with IPM',
    subtitle_luo: 'Kwoyo cam miri kede Integrated Pest Management',
    image: '/pest_scouting.png',
    points: [
      'Scout fields weekly for pests (like Fall Armyworm) and disease symptoms.',
      'Use resistant crop varieties and clean certified seeds.',
      'Apply pesticides only when pest population reaches economic thresholds.',
      'Follow safe handling, protective gear, and chemical application practices.',
      'Maintain field hygiene — remove infected plants and destroy crop residues promptly.'
    ],
    naroAdvice: 'For Fall Armyworm control, NARO advocates Integrated Pest Management (IPM): hand-pick caterpillars, introduce natural predators, and apply systemic pesticides early in the morning or late evening when caterpillars are actively feeding.'
  },
  {
    id: 'record-keeping',
    num: '09',
    title_en: 'Monitoring & Record Keeping',
    title_luo: 'Neno poto kede Record Keeping',
    subtitle_en: 'Track your progress and profitability',
    subtitle_luo: 'Co wel me tic kede neno dongo miri',
    image: '/monitoring_records.png',
    points: [
      'Record all farm activities: planting dates, inputs used, weather patterns, and dates.',
      'Document input costs (seed, fertilizer, chemicals, labor) and final yields.',
      'Track pest and disease incidences and the effectiveness of control measures.',
      'Perform basic seasonal profitability analysis to guide next season\'s decisions.',
      'Use simple notebooks or mobile farm apps — consistency is key.'
    ]
  },
  {
    id: 'harvesting',
    num: '10',
    title_en: 'Harvesting',
    title_luo: 'Keyo Cam i Poto',
    subtitle_en: 'Harvest at the right physiological maturity',
    subtitle_luo: 'Keyo cam ka odongo maber woko',
    image: '/four_men_sunflowers.png',
    points: [
      'Maize: Harvest when moisture content is 18–20% (grains are hard and shiny, black layer visible).',
      'Sunflower: Harvest when the back of the head turns yellow-brown and outer bracts dry out.',
      'Use clean tools, tarpaulins, and baskets to prevent soil contact and contamination.',
      'Avoid harvesting during rainy or wet weather to reduce post-harvest rot.',
      'Handle produce carefully during harvesting to minimize physical damage.'
    ],
    naroAdvice: 'Delayed harvesting leads to termite damage, grain discoloration, and field infestation by maize weevils and molds (including Aspergillus, which causes toxic aflatoxins).'
  },
  {
    id: 'drying-storage',
    num: '11',
    title_en: 'Drying & Storage',
    title_luo: 'Toyo kede Kano Cam',
    subtitle_en: 'Dry to safe moisture levels to prevent contamination',
    subtitle_luo: 'Toyo i moisture maber me kwer aflatoxin',
    image: '/drying_maize.png',
    points: [
      'Dry maize to 12.5%–13% moisture and sunflower to 9%–10% before storage.',
      'Use clean drying surfaces (tarpaulins, concrete floors) — never dry directly on bare ground.',
      'Store bags in clean, dry, well-ventilated, pest-proof structures.',
      'Use hermetic bags (PICS bags) or treated bags for chemical-free long-term storage.',
      'Inspect stored grain regularly for signs of dampness, weevils, or rodent damage.',
      'Place bags on wooden pallets, away from walls, to prevent moisture absorption.'
    ],
    naroAdvice: 'To prevent aflatoxin contamination, dry grain immediately after harvest. Test moisture levels using a digital moisture meter (available at Jeroma hubs). Always store bags on wooden pallets, keeping them at least 30 cm away from walls.'
  },
  {
    id: 'bulking-cleaning',
    num: '12',
    title_en: 'Bulking & Cleaning',
    title_luo: 'Cogo kede Lilo Cam',
    subtitle_en: 'Aggregate and grade for premium prices',
    subtitle_luo: 'Cogo kede lilo cam pi wel maber',
    image: '/warehouse_storage.png',
    points: [
      'Join local farmer groups or cooperatives for collective marketing and transport savings.',
      'Pool produce at Jeroma collection centers to meet minimum wholesale quantities.',
      'Clean grain thoroughly — remove dirt, stones, chaff, cobs, and broken grains.',
      'Grade produce by size, moisture, color, and density to secure premium payouts.',
      'Use standardized weighing scales to ensure transparency and trust.'
    ],
    tags: ['Stock manager', 'Quality control', 'Stocked bags']
  },
  {
    id: 'milling-processing',
    num: '13',
    title_en: 'Processing & Milling',
    title_luo: 'Goyo kede Loko Cam i Jeroma',
    subtitle_en: 'Value addition multiplies farmer income',
    subtitle_luo: 'Miyo value addition pi wel mapol',
    image: '/jeroma_maize_flour_bag.png',
    points: [
      'Deliver quality grain to Jeroma\'s modern milling plant in Lira City.',
      'Pneumatic milling with cyclone separation ensures clean, sand-free flour.',
      'Hygienic packaging meeting national and regional food safety standards.',
      'Multiple retail and wholesale packaging sizes (2Kg, 5Kg, 10Kg, 25Kg, 50Kg).',
      'Farmers can bulk-sell grain or pay a toll-milling fee to take home packaged flour.'
    ],
    reminderBox: {
      title_en: 'Jeroma Milling Infrastructure',
      title_luo: 'Infrastructure me Goyo Cam i Jeroma',
      items: [
        'Pneumatic conveyor systems for fully contamination-free handling.',
        'Cyclone separators for thorough dust, husks, and chaff removal.',
        'Automated weighing and packaging lines for efficiency and hygiene.',
        'Standby diesel generators to ensure 100% processing continuity.'
      ]
    }
  },
  {
    id: 'marketing-distribution',
    num: '14',
    title_en: 'Marketing & Distribution',
    title_luo: 'Cato kede Lako Cam i Market',
    subtitle_en: 'Connecting farmers to secure formal markets',
    subtitle_luo: 'Ribbe opur i market me nyen kede migen',
    image: '/delivering_produce.png',
    points: [
      'Direct purchase of maize, sunflower, and beans with guaranteed offtake.',
      'Transparent weighing and moisture-testing at all regional collection hubs.',
      'Timely electronic payments — zero payment delays or exploitation by middlemen.',
      'Contract farming arrangements with guaranteed minimum pricing for committed groups.',
      'SMS and local radio updates on prevailing market prices and hub locations.'
    ],
    reminderBox: {
      title_en: 'Distribution Network',
      title_luo: 'Dwol me Lako Cam',
      items: [
        'Branded delivery fleet covering the entire Northern Uganda region.',
        'Wholesale supply to schools, hospitals, army barracks, and humanitarian agencies.',
        'Secure retail supply chain ensuring clean Jeroma Maize Flour reaches families.'
      ]
    }
  }
];

export default function TrainingManual({ lang, onBackToHome }) {
  const [activeSection, setActiveSection] = useState('cover');
  const [stages, setStages] = useState(DEFAULT_STAGES);

  useEffect(() => {
    const fetchStages = async () => {
      const dynamicStages = await getManual();
      if (dynamicStages && dynamicStages.length > 0) {
        setStages(dynamicStages);
      }
    };
    fetchStages();
  }, []);

  const localizedStages = stages.map(s => {
    const title = lang === 'luo' ? (s.title_luo || s.title_ach || s.title) : (s.title_en || s.title);
    const subtitle = lang === 'luo' ? (s.subtitle_luo || s.subtitle) : (s.subtitle_en || s.subtitle);
    
    const pointsList = s.points || [];

    let reminderBox = null;
    if (s.reminderBox) {
      reminderBox = {
        title: lang === 'luo' ? (s.reminderBox.title_luo || s.reminderBox.title_ach || s.reminderBox.title) : (s.reminderBox.title_en || s.reminderBox.title),
        items: s.reminderBox.items || []
      };
    }

    return {
      ...s,
      title,
      subtitle,
      points: pointsList,
      reminderBox
    };
  });

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      // Check which section is in view
      if (scrollPos < 500) {
        setActiveSection('cover');
        return;
      }
      for (const stage of stages) {
        const el = document.getElementById(stage.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(stage.id);
            break;
          }
        }
      }
      const commitmentEl = document.getElementById('commitment');
      if (commitmentEl && scrollPos >= commitmentEl.offsetTop) {
        setActiveSection('commitment');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [stages]);

  const scrollToStage = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 120,
        behavior: 'smooth'
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-light)', color: '#ffffff', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>
      {/* ── Header Toolbar (Hidden in Print) ── */}
      <div className="manual-toolbar" style={{
        position: 'sticky', top: '80px', zIndex: 900,
        backgroundColor: 'var(--color-bg-white)', borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 0', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onBackToHome} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '8px 16px' }}>
            <Icons.ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
            <span>{lang === 'en' ? 'Back to Home' : 'Dok cen i Paco'}</span>
          </button>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handlePrint} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '8px 20px' }}>
              <Icons.Shield size={16} /> {/* Print Icon representation */}
              <span>{lang === 'en' ? 'Download / Print Manual' : 'Download / Go Manual'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Book Layout ── */}
      <div className="container" style={{ display: 'flex', gap: '40px', padding: '40px 0', position: 'relative' }}>
        
        {/* ── Sidebar Navigation (Hidden in Print) ── */}
        <aside className="manual-sidebar" style={{
          width: '280px', position: 'sticky', top: '160px', height: 'calc(100vh - 180px)',
          overflowY: 'auto', flexShrink: 0, paddingRight: '12px', borderRight: '1px solid rgba(255,255,255,0.08)'
        }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-secondary)', letterSpacing: '0.05em', margin: '0 0 16px 0' }}>
            {lang === 'en' ? 'Table of Contents' : 'Koko me Pwonj'}
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>
              <button
                onClick={() => scrollToStage('cover')}
                style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '8px 12px',
                  borderRadius: '6px', fontSize: '0.82rem', fontWeight: activeSection === 'cover' ? 800 : 500,
                  color: activeSection === 'cover' ? 'var(--color-accent)' : 'var(--color-text-dark)',
                  backgroundColor: activeSection === 'cover' ? 'rgba(82,183,136,0.1)' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
              >
                📕 {lang === 'en' ? 'Manual Cover & Intro' : 'Kwi me Pwonj'}
              </button>
            </li>
            
            <div style={{ margin: '8px 0 4px 12px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-primary-light)', textTransform: 'uppercase' }}>
              {lang === 'en' ? 'Training Stages' : 'Stages me Pur'}
            </div>
            
            {localizedStages.map(stage => (
              <li key={stage.id}>
                <button
                  onClick={() => scrollToStage(stage.id)}
                  style={{
                    width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '8px 12px',
                    borderRadius: '6px', fontSize: '0.82rem', fontWeight: activeSection === stage.id ? 800 : 500,
                    color: activeSection === stage.id ? 'var(--color-accent)' : 'var(--color-text-dark)',
                    backgroundColor: activeSection === stage.id ? 'rgba(82,183,136,0.1)' : 'transparent',
                    cursor: 'pointer', transition: 'all 0.15s', display: 'flex', gap: '8px'
                  }}
                >
                  <span style={{ opacity: 0.6 }}>{stage.num}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stage.title}</span>
                </button>
              </li>
            ))}
            
            <li style={{ marginTop: '8px' }}>
              <button
                onClick={() => scrollToStage('commitment')}
                style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '8px 12px',
                  borderRadius: '6px', fontSize: '0.82rem', fontWeight: activeSection === 'commitment' ? 800 : 500,
                  color: activeSection === 'commitment' ? 'var(--color-accent)' : 'var(--color-text-dark)',
                  backgroundColor: activeSection === 'commitment' ? 'rgba(82,183,136,0.1)' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
              >
                🌱 {lang === 'en' ? 'Our Commitment' : 'Cik mwa me Cwak'}
              </button>
            </li>
          </ul>
        </aside>

        {/* ── Book Pages Content Area ── */}
        <main style={{ flex: 1, minWidth: 0 }} className="manual-content">
          
          {/* ── Page 1: COVER PAGE ── */}
          <section id="cover" className="manual-page-section" style={{
            border: '2px solid var(--color-accent)', borderRadius: '24px',
            padding: '48px', background: 'var(--color-primary)', marginBottom: '40px',
            display: 'flex', flexDirection: 'column', minHeight: '680px', justifyContent: 'space-between'
          }}>
            {/* Logo and Institution header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '2.5px solid var(--color-accent)', paddingBottom: '24px' }}>
              <img src="/logo.webp" alt="Jeroma Farmers Logo" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--color-secondary)' }} />
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em' }}>JEROMA FARMERS</h2>
                <h3 style={{ margin: '2px 0 0 0', fontSize: '1rem', fontWeight: 700, color: 'var(--color-secondary)' }}>Collection Center Ltd</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Lira City · Northern Uganda</p>
              </div>
            </div>

            {/* Title & Banner */}
            <div style={{ margin: '40px 0', textAlign: 'center' }}>
              <span style={{
                background: 'rgba(255,255,255,0.08)', border: '1.5px solid var(--color-accent)',
                color: '#ffffff', padding: '6px 16px', borderRadius: '50px',
                fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em'
              }}>
                {lang === 'en' ? 'Comprehensive Guide' : 'Yore me Pur Aier'}
              </span>
              <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: '#ffffff', margin: '16px 0 8px 0', lineHeight: 1.15 }}>
                Farmer Training<br />Manual
              </h1>
              <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-secondary)', margin: 0 }}>
                {lang === 'en' ? 'From Land to Market' : 'Cakere ki i Poto nyaka Market'}
              </p>
            </div>

            {/* Description intro */}
            <div style={{
              background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.2)',
              borderRadius: '16px', padding: '24px', fontSize: '0.9rem', lineHeight: 1.6, color: '#ffffff'
            }}>
              A complete step-by-step guide covering all stages of crop production — from site selection and farmer profiling to harvesting, storage, bulking, and market-ready processing. Built on years of experience working with farmers across Lango and Acholi sub-regions.
            </div>

            {/* Icons row */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', margin: '24px 0', flexWrap: 'wrap' }}>
              {['Farmer training', 'Field technician', 'Land preparation', 'Community training'].map(tag => (
                <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
                  ✔ {tag}
                </span>
              ))}
            </div>

            {/* Contact details footer */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '20px',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px',
              fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)'
            }}>
              <div>
                <strong>📍 Address:</strong><br />
                P.O. Box 330095, Lira City, Uganda
              </div>
              <div>
                <strong>📞 Phone:</strong><br />
                0773 623 196 / 0782 608 721
              </div>
              <div>
                <strong>🌐 Web & Email:</strong><br />
                www.jeromafarmers.com<br />
                jeromafarmers.c@gmail.com
              </div>
            </div>
          </section>

          {/* ── Page 2+: THE 14 STAGES ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {localizedStages.map(stage => (
              <section key={stage.id} id={stage.id} className="manual-page-section" style={{
                border: '1px solid var(--color-accent)', borderRadius: '20px',
                padding: '36px', background: 'var(--color-primary)', boxShadow: '0 8px 24px rgba(15,48,32,0.25)',
                position: 'relative', overflow: 'hidden'
              }}>
                {/* Visual Accent Corner Ribbon */}
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  width: '60px', height: '60px', background: 'linear-gradient(135deg, transparent 50%, var(--color-accent) 50%)',
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '6px'
                }}>
                  <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}>{stage.num}</span>
                </div>

                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-secondary)', letterSpacing: '0.1em' }}>
                  {lang === 'en' ? `Phase ${stage.num}` : `Kaka ${stage.num}`}
                </span>
                
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginTop: '4px', marginBottom: '2px' }}>
                  {stage.title}
                </h2>
                <p style={{ margin: '0 0 20px 0', fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)', fontWeight: 550 }}>
                  {stage.subtitle}
                </p>

                {/* Section Image (Resized for clarity and aspect ratio) */}
                <div style={{
                  width: '100%', height: '300px', borderRadius: '12px', overflow: 'hidden',
                  marginBottom: '24px', border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
                }}>
                  <img
                    src={stage.image}
                    alt={stage.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                    loading="lazy"
                  />
                </div>

                {/* Bullet points */}
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', margin: '0 0 10px 0' }}>
                  {lang === 'en' ? 'Core Steps & Action Guidelines' : 'Koko me Cik me Anyim'}
                </h3>
                <ul style={{ margin: '0 0 24px 0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem', lineHeight: 1.5, color: '#ffffff' }}>
                  {stage.points.map((pt, idx) => (
                    <li key={idx}>{pt}</li>
                  ))}
                </ul>

                {/* Optional Reminder Box */}
                {stage.reminderBox && (
                  <div style={{
                    padding: '16px 20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
                    borderLeft: '4px solid var(--color-secondary)', marginBottom: '20px', color: '#ffffff'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: 'var(--color-secondary)', fontWeight: 850 }}>
                      💡 {stage.reminderBox.title}
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8rem', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '4px', color: 'rgba(255,255,255,0.9)' }}>
                      {stage.reminderBox.items.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* NARO Advice Callout (Green Background / White Text) */}
                {stage.naroAdvice && (
                  <div style={{
                    padding: '16px 20px', background: 'rgba(255,255,255,0.08)', borderRadius: '12px',
                    border: '1.5px solid var(--color-accent)', display: 'flex', gap: '12px', alignItems: 'flex-start'
                  }} className="naro-advice">
                    <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>🛡️</span>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#ffffff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        NARO Scientific Advisory
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.9)', fontWeight: 550 }}>
                        {stage.naroAdvice}
                      </p>
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* ── Final Page: OUR COMMITMENT ── */}
          <section id="commitment" className="manual-page-section" style={{
            border: '2px solid var(--color-primary-light)', borderRadius: '24px',
            padding: '44px', background: '#081c15', color: '#ffffff', marginTop: '40px'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-secondary)', margin: '0 0 12px 0' }}>
              Our Commitment
            </h2>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: '0 0 16px 0' }}>
              Jeroma's Support Services
            </h3>
            <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', marginBottom: '32px' }}>
              At Jeroma Farmers Collection Center Ltd, we walk with farmers every step of the way — from the first seed planted to the final product sold. Our integrated approach combines quality inputs, hands-on training, reliable extension services, guaranteed markets, and value-added processing to maximize farmer incomes and build sustainable livelihoods.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
              {[
                { title: 'Quality Inputs', desc: 'Certified seeds, fertilizers, pesticides, herbicides, and all agro inputs farmers need for productive seasons — available at competitive prices.', icon: '🌱' },
                { title: 'Farmer Training', desc: 'Regular classroom and field-based training on modern farming techniques, financial literacy, and cooperative management.', icon: '📚' },
                { title: 'Extension Services', desc: 'Field visits, pest/disease monitoring, soil testing, climate advisories, and technical support throughout the growing season.', icon: '🔬' },
                { title: 'Guaranteed Markets', desc: 'Direct purchase agreements, transparent grading, timely payment, and fair prices that reward quality production.', icon: '💰' },
                { title: 'Value Addition', desc: 'Modern milling facility producing premium Jeroma Maize Flour — creating jobs and adding value to local grain.', icon: '🏭' },
                { title: 'Distribution', desc: 'Regional delivery network ensuring products reach every corner of Lango, Acholi, and beyond.', icon: '🚚' }
              ].map((serv, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.04)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{serv.icon}</div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: 'var(--color-secondary)', fontWeight: 800 }}>{serv.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.7)' }}>{serv.desc}</p>
                </div>
              ))}
            </div>

            {/* Back to top footer */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }} className="print-hidden">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                style={{
                  background: 'none', border: 'none', color: 'var(--color-secondary)',
                  fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                ▲ {lang === 'en' ? 'Back to Top' : 'Dok Cen Anyim'}
              </button>
            </div>
          </section>

        </main>
      </div>

      {/* ── CSS Styles ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 991px) {
          .manual-sidebar {
            display: none !important;
          }
          .manual-toolbar {
            top: 70px !important;
          }
        }
        
        /* Print Optimized Styling */
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11pt !important;
          }
          
          /* Hide non-print content */
          .manual-toolbar, 
          .manual-sidebar,
          .header,
          .footer,
          .news-ticker-container,
          .whatsapp-float,
          .chatbot-container,
          .print-hidden,
          .sync-toast-notification {
            display: none !important;
          }
          
          /* Force content area to be full width */
          .container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }
          
          .manual-content {
            width: 100% !important;
            display: block !important;
          }
          
          /* Format page sections nicely as separate pages */
          .manual-page-section {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
            border-radius: 12px !important;
            padding: 30px !important;
            margin-bottom: 40px !important;
            page-break-inside: avoid !important;
          }
          
          #cover {
            page-break-after: always !important;
            min-height: 100% !important;
            border: 2px solid #1b4332 !important;
          }
          
          #commitment {
            page-break-before: always !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: 2px solid #1b4332 !important;
          }
          
          #commitment h2, #commitment h4 {
            color: #1b4332 !important;
          }
          
          #commitment p {
            color: #333333 !important;
          }
          
          #commitment div {
            background: #f9f9f9 !important;
            border: 1px solid #ddd !important;
            color: #000000 !important;
          }
          
          #commitment div p {
            color: #555555 !important;
          }

          .naro-advice {
            background: #f4faf6 !important;
            border: 1px solid #a7f3d0 !important;
            color: #1b4332 !important;
          }
          
          /* Limit image heights in print for cleaner page transitions */
          .manual-page-section img {
            max-height: 180px !important;
            width: 100% !important;
            object-fit: cover !important;
          }
        }
      `}} />
    </div>
  );
}
