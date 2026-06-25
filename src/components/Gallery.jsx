import React, { useState, useEffect } from 'react';
import { translations } from './translations';
// ActivityBanner is rendered globally in App.jsx (right after the news ticker)

export default function Gallery({ lang, translations: dynamicTranslations }) {
  const [filter, setFilter] = useState('all');
  const [activeImage, setActiveImage] = useState(null);

  const activeTranslations = dynamicTranslations || translations;
  const t = activeTranslations[lang] || activeTranslations.en;

  const filterLabels = {
    en: { all: 'All Photos', harvests: 'Harvests & Seeds', farms: 'Farms & Fields', community: 'Community', team: 'Our Team', inputs: 'Agro Inputs & Products' },
    luo: { all: 'Cal Ducu', harvests: 'Cam & Kabilo', farms: 'Pur & Potowa', community: 'Lwak Paco', team: 'Dwol me Tic', inputs: 'Agro Inputs & Cam' }
  };

  const galleryItems = [
    // ── 5 NEW PHOTOS FROM USER ────────────────────────────────────────────────
    {
      id: 20,
      src: '/farmers_training_1.png',
      title: lang === 'en' ? 'Jeroma GAP Farmer Training Workshop' : 'Pwonj me GAP pi Opur me Jeroma',
      category: 'community',
      desc: lang === 'en'
        ? 'Jeroma extension officers conducting a Good Agronomic Practice (GAP) training session for registered farmers, covering soil health, pest management, and post-harvest best practices.'
        : 'Lajok tic me Jeroma tye ka pwonyo opur me GAP i odola training.'
    },
    {
      id: 21,
      src: '/etoil_karamoja_fm.jpg',
      title: lang === 'en' ? 'Media Partnership — Etoil A Karamoja FM 92.7' : 'Ribbe me Media — Etoil A Karamoja FM 92.7',
      category: 'team',
      desc: lang === 'en'
        ? 'Jeroma Farmers leadership team at Etoil A Karamoja FM 92.7 radio station to broadcast agricultural tips, price updates, and farmer registration information to rural communities.'
        : 'Team me Jeroma i Etoil A Karamoja FM 92.7 pi oro nyen me pur me paco.'
    },
    {
      id: 22,
      src: '/integrated_farming.jpg',
      title: lang === 'en' ? 'Integrated & Climate-Smart Farming Systems' : 'Pur me Climate-Smart me Jeroma',
      category: 'farms',
      desc: lang === 'en'
        ? 'A showcase of integrated farming systems: compost worms, silage bales, hydroponic greens, mushrooms, greenhouse vegetables, and multi-crop plots — all promoted by Jeroma extension services.'
        : 'Cal me pur me integrated farming — compost, greenhouse, kede hydroponics i Northern Uganda.'
    },
    {
      id: 23,
      src: '/farmers_training_2.jpg',
      title: lang === 'en' ? 'Agribusiness Capacity Building Conference' : 'Odola me Agribusiness me Jeroma',
      category: 'community',
      desc: lang === 'en'
        ? 'A large-scale farmer capacity building and agribusiness conference attended by Jeroma-registered farmers and partner organisations — building skills in farm management and market access.'
        : 'Odola dongo me agribusiness pi opur me Jeroma kede oribbe mwa.'
    },
    {
      id: 24,
      src: '/maize_cob.jpg',
      title: lang === 'en' ? 'Quality Maize Crop — Ready for Harvest' : 'Anam me Grade-A — Ire Keyo',
      category: 'harvests',
      desc: lang === 'en'
        ? 'A healthy, mature maize cob in the field — indicative of the high-yield hybrid varieties (Longe 5H, SeedCo SC403) promoted by Jeroma Farmers through subsidized seed programmes.'
        : 'Anam me grade A maber i poto — kabilo me Jeroma Seeds Programme.'
    },
    // ── EXISTING PHOTOS ───────────────────────────────────────────────────────
    {
      id: 1,
      src: '/four_men_sunflowers.png',
      title: lang === 'en' ? 'Jeroma Team at Harvest Exhibition' : 'Team me Jeroma i Ot-Cal me Pur',
      category: 'team',
      desc: lang === 'en'
        ? 'The Jeroma Farmers leadership team proudly displaying mature sunflower heads at a regional agricultural exhibition.'
        : 'Team me Jeroma Farmers pur kede sunflower i regional agricultural exhibition.'
    },
    {
      id: 2,
      src: '/farmer_man_seedco.png',
      title: lang === 'en' ? 'Premium Sunflower Seeds – SeedCo LG 50745' : 'Kabilo me Sunflower me SeedCo LG 50745',
      category: 'harvests',
      desc: lang === 'en'
        ? 'One of our certified seed supplier partners displaying high-yield LG 50745 sunflower heads from SeedCo, The African Seed Company.'
        : 'Kabilo me SeedCo LG 50745 sunflower i lobowa me Lira.'
    },
    {
      id: 10,
      src: '/jeroma_motorcycle_transit.webp',
      title: lang === 'en' ? 'Direct Farm-to-Hub Transit Assistance' : 'Logistics me Lela me Cogo Cam i Paco',
      category: 'community',
      desc: lang === 'en'
        ? 'Jeroma field agents loading bags of quality maize onto direct transit motorbikes, ensuring no farmer is left behind.'
        : 'Lela me cogo cam direct farm-to-hub logistics i paco Lira.'
    },
    {
      id: 3,
      src: '/farmer_woman.png',
      title: lang === 'en' ? 'Harvesting Quality Sunflowers' : 'Cogo Sunflower me Grade-A i Paco',
      category: 'harvests',
      desc: lang === 'en'
        ? 'A dedicated registered farmer proudly holding a fully matured Grade-A sunflower head, ready for seed extraction.'
        : 'Opur cal maber twotwo twol sunflower keyo maber i poto.'
    },
    {
      id: 11,
      src: '/jeroma_maize_flour_bag.png',
      title: lang === 'en' ? 'Jeroma Maize Flour 5 Kg – Produced in Lira' : 'Mogo Kacumir me Jeroma – 5 Kg Lira City',
      category: 'inputs',
      desc: lang === 'en'
        ? 'High-quality, Grade-A retail maize flour produced, packed, and distributed by Jeroma Company directly in Lira City.'
        : 'Mogo anywagi maber ma Jeroma Company tye ka goyo kede pako i Lira City.'
    },
    {
      id: 4,
      src: '/sunflower_close.webp',
      title: lang === 'en' ? 'Perfect Seed Pattern Density' : 'Pattern me Kabilo me Sunflower me Lira',
      category: 'harvests',
      desc: lang === 'en'
        ? 'A macro shot showing high seed density and excellent ripening – indicating a successful crop cycle.'
        : 'Cal me macro sunflower seed density maber twotwo.'
    },
    {
      id: 5,
      src: '/sunflower_field.png',
      title: lang === 'en' ? 'Jeroma Sunflower Plantations' : 'Poto me Sunflower me Jeroma',
      category: 'farms',
      desc: lang === 'en'
        ? 'Lush sunflower plantations stretching towards the hills, optimized with modern soil nutrient management.'
        : 'Poto me sunflower dongo maber twotwo i Northern Uganda.'
    },
    {
      id: 12,
      src: '/jeroma_processing_factory.webp',
      title: lang === 'en' ? 'State-of-the-Art Milling & Silo Facility' : 'Dwol-Mashin me Goyo kede Kano Cam i Lira',
      category: 'inputs',
      desc: lang === 'en'
        ? 'Our high-capacity industrial milling factory, equipped with advanced pneumatic silos for flour processing.'
        : 'Dwol me processing silo kede pneumatic machines me goyo mogo anam i Lira City.'
    },
    {
      id: 6,
      src: '/watering_crops.webp',
      title: lang === 'en' ? 'Irrigation & Seedbed Preparation' : 'Koo Pii kede Lela me Seedbed',
      category: 'farms',
      desc: lang === 'en'
        ? 'Farmers setting up pipeline connections to water seedbeds, ensuring resilient growth during dry weather spells.'
        : 'Opur tye ka keto yore me koo pii me cwak dongo maber twotwo.'
    },
    {
      id: 7,
      src: '/women_coop_gathering.webp',
      title: lang === 'en' ? 'Farmers Cooperative Gathering' : 'Ribbe me Cooperative me Opur Lira',
      category: 'community',
      desc: lang === 'en'
        ? 'Members of a registered Jeroma farmers cooperative group meeting for seasonal training and input distribution planning.'
        : 'Opur cooperative me Lira dwe dwe me ribbe nongo pwonj me pur.'
    },
    {
      id: 8,
      src: '/community_gathering.webp',
      title: lang === 'en' ? 'Community Input Distribution' : 'Miyo Lela me Konyo Lwak i Paco',
      category: 'community',
      desc: lang === 'en'
        ? 'Jeroma organizers distributing livestock assets and water collection basins to school clubs and community families.'
        : 'Jeroma Farmers miyo kony me pii kede kabilo me pur pi lwak paco.'
    },
    {
      id: 9,
      src: '/biofertilizer_bag.webp',
      title: lang === 'en' ? 'Biofertilizer Africa – 100% Organic NPK' : 'Biofertilizer Africa – 100% Organic NPK Yat me pur',
      category: 'inputs',
      desc: lang === 'en'
        ? 'Our stocked Biofertilizer Africa 25 Kg organic fertilizer bags offering NPK blends for planting, vegetative, and flowering crop stages.'
        : 'Biofertilizer Africa NPK blend ma cako pur kede dongo cam.'
    }
  ];

  const filters = [
    { key: 'all', label: filterLabels[lang]?.all || filterLabels.en.all },
    { key: 'harvests', label: filterLabels[lang]?.harvests || filterLabels.en.harvests },
    { key: 'farms', label: filterLabels[lang]?.farms || filterLabels.en.farms },
    { key: 'community', label: filterLabels[lang]?.community || filterLabels.en.community },
    { key: 'team', label: filterLabels[lang]?.team || filterLabels.en.team },
    { key: 'inputs', label: filterLabels[lang]?.inputs || filterLabels.en.inputs },
  ];

  const filteredItems = filter === 'all'
    ? galleryItems
    : galleryItems.filter(item => item.category === filter);

  const categoryLabel = (cat) => filters.find(f => f.key === cat)?.label || cat;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveImage(null);
    };
    if (activeImage) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeImage]);

  return (
    <section id="gallery" className="section" style={{ backgroundColor: '#ffffff' }}>
      <div className="container">
        <div className="section-header">
          <span className="section-badge">{t.navGallery}</span>
          <h2 className="section-title">{lang === 'en' ? 'Jeroma Farmers in Action' : 'Pur me Jeroma i Paco Cal'}</h2>
          <p className="section-subtitle">
            {lang === 'en'
              ? 'A visual overview of our farms, harvest activities, cooperative gatherings, agro-input supplies, and team operations across Uganda.'
              : 'Cal me poto pur mwa, od-tic me cogo keyo, pwonj me cooperative, kede dongo cam me Jeroma i Lira Uganda.'}
          </p>
        </div>

        {/* Filter buttons */}
        <div className="gallery-filters">
          {filters.map(f => (
            <button
              key={f.key}
              className={`filter-btn ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="gallery-grid">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="gallery-item"
              onClick={() => setActiveImage(item)}
            >
              <img
                src={item.src}
                alt={item.title}
                loading="lazy"
                width="400"
                height="300"
                style={{ objectFit: 'cover' }}
              />
              <div className="gallery-overlay">
                <h4>{item.title}</h4>
                <p style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--color-secondary)', letterSpacing: '0.05em' }}>
                  {categoryLabel(item.category)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {activeImage && (
          <div
            className="lightbox"
            onClick={() => setActiveImage(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Image Lightbox"
          >
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="lightbox-close"
                onClick={() => setActiveImage(null)}
                aria-label="Close lightbox"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <img src={activeImage.src} alt={activeImage.title} className="lightbox-img" />
              <div className="lightbox-caption">
                <h4>{activeImage.title}</h4>
                <p>{activeImage.desc}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
