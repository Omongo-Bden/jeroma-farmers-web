import React, { useState } from 'react';
import * as Icons from './Icons';
import { translations } from './translations';

export default function Services({ lang, crops, translations: dynamicTranslations }) {
  const [selectedCrop, setSelectedCrop] = useState('coffee');
  const [weight, setWeight] = useState(500);

  const activeTranslations = dynamicTranslations || translations;
  const t = activeTranslations[lang] || activeTranslations.en;

  const cropNames = {
    en: { coffee: "Coffee Beans", sunflower: "Sunflower Seeds", maize: "Maize (Corn)", beans: "Dry Beans" },
    luo: { coffee: "Kawa (Coffee)", sunflower: "Sunflower Seeds", maize: "Anam (Maize)", beans: "Ngor (Beans)" }
  };

  const cropData = {
    coffee: {
      name: cropNames[lang]?.coffee || 'Coffee Beans',
      icon: <Icons.Coffee size={24} />,
      moisture: '12.0% - 13.0%',
      packaging: lang === 'en' ? '60 kg Sisal Bags' : 'Gunia me 60 kg',
      marketPrice: 3.50,
      payoutRatePerKg: 12500,
      payoutRate: 'UGX 12,500',
      gradingGuide: lang === 'en' 
        ? 'Must be free of black beans, moldy odors, and insect damage. Maximum defect count: 5%.' 
        : 'Kur obed kede black beans, odur me tocam, nyo pidi. Defect ma ocwiny: 5%.',
      tips: lang === 'en' 
        ? 'Pre-dry on raised beds for at least 14 days before delivery to achieve premium Grade-A valuation.' 
        : 'Omya i raised beds pi dwe 14 ka ogweyo me nongo Grade-A valuation.'
    },
    sunflower: {
      name: cropNames[lang]?.sunflower || 'Sunflower Seeds',
      icon: <Icons.Wheat size={24} />,
      moisture: '9.0% - 10.0%',
      packaging: lang === 'en' ? '50 kg Woven Bags' : 'Gunia me 50 kg',
      marketPrice: 0.60,
      payoutRatePerKg: 2200,
      payoutRate: 'UGX 2,200',
      gradingGuide: lang === 'en' 
        ? 'Silt and foreign matter must be under 2%. Seed breakage must be under 3%. Oil content minimum: 38%.' 
        : 'Silt kede odur ocwiny okat 2%. Seed breakage okat 3%. Oil content minimum: 38%.',
      tips: lang === 'en' 
        ? 'Ensure proper thrashing and winnowing to remove dust and empty husks prior to bagging.' 
        : 'Ngweo maber kede lilo pi gweny odur ducu woko ka okete i bags.'
    },
    maize: {
      name: cropNames[lang]?.maize || 'Maize (Corn)',
      icon: <Icons.Seed size={24} />,
      moisture: '13.0% - 13.5%',
      packaging: lang === 'en' ? '90 kg Polypropylene Bags' : 'Gunia me 90 kg',
      marketPrice: 0.35,
      payoutRatePerKg: 1300,
      payoutRate: 'UGX 1,300',
      gradingGuide: lang === 'en' 
        ? 'Weevil damage must be under 1%. Moldy or discolored kernels under 2%. Broken kernels under 2%.' 
        : 'Weevil damage ocwiny okat 1%. Tocam nyo discoloration okat 2%. Broken kernels okat 2%.',
      tips: lang === 'en' 
        ? 'Shell using clean equipment to avoid kernel breakage, and sieve thoroughly to eliminate chaff.' 
        : 'Koko maber kede lilo gweny kede odur ducu woko pyere me kwer broken kernels.'
    },
    beans: {
      name: cropNames[lang]?.beans || 'Dry Beans',
      icon: <Icons.Beans size={24} />,
      moisture: '14.0% - 14.5%',
      packaging: lang === 'en' ? '90 kg Polypropylene Bags' : 'Gunia me 90 kg',
      marketPrice: 0.85,
      payoutRatePerKg: 3100,
      payoutRate: 'UGX 3,100',
      gradingGuide: lang === 'en' 
        ? 'Uniform size and color. Splitting under 2%. Moisture above 15% will require warehouse re-drying.' 
        : 'Pek maber kede cal maber. Splitting ocwiny okat 2%. Moisture okat 15% bimitte od-omya kado.',
      tips: lang === 'en' 
        ? 'Sort out stones, soil clods, and wrinkled seeds at the farm level to secure immediate Grade-A status.' 
        : 'Lilo kidi, odur nyo seeds ma tocam woko i pur ka onongo Grade-A valuation cutcut.'
    }
  };

  // Merge db crops state if supplied
  const activeCrops = {};
  Object.keys(cropData).forEach(key => {
    const dbCrop = (crops && crops[key]) ? crops[key] : null;
    activeCrops[key] = {
      ...cropData[key],
      payoutRate: dbCrop ? dbCrop.payoutRate : cropData[key].payoutRate,
      payoutRatePerKg: dbCrop ? parseInt(dbCrop.payoutRate.replace('UGX ', '').replace(/,/g, '')) : cropData[key].payoutRatePerKg,
      moisture: dbCrop ? dbCrop.moisture : cropData[key].moisture,
      packaging: dbCrop ? dbCrop.packaging : cropData[key].packaging,
      gradingGuide: (dbCrop && lang === 'en') ? dbCrop.gradingGuide : cropData[key].gradingGuide,
      tips: (dbCrop && lang === 'en') ? dbCrop.tips : cropData[key].tips
    };
  });

  const currentCrop = activeCrops[selectedCrop];
  const calculatedValue = (weight * currentCrop.marketPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totalPayoutUGX = (weight * currentCrop.payoutRatePerKg).toLocaleString();
  const localPayout = currentCrop.payoutRate;

  return (
    <section id="services" className="section" style={{ backgroundColor: 'var(--color-bg-light)' }}>
      <div className="container">
        <div className="section-header">
          <span className="section-badge section-badge-gold">{t.servicesBadge}</span>
          <h2 className="section-title">{t.servicesTitle}</h2>
          <p className="section-subtitle">{t.servicesSubtitle}</p>
        </div>

        <div className="services-grid">
          {/* Card 1 – Logistics */}
          <div className="service-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="service-header">
              <div className="service-icon">
                <Icons.Truck size={24} />
              </div>
              <h3>{t.serviceLogistics}</h3>
            </div>
            
            {/* Added premium visual asset mapping */}
            <div style={{ width: '100%', height: '160px', overflow: 'hidden', borderRadius: '8px', border: '1px solid rgba(27,67,50,0.1)' }}>
              <img 
                src="/jeroma_motorcycle_transit.webp" 
                alt="Jeroma Motorcycle Transit Sack stack" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
              />
            </div>

            <p>{t.serviceLogisticsDesc}</p>
            <ul className="service-features" style={{ marginTop: 'auto' }}>
              <li><Icons.CheckCircle size={16} /> {t.serviceLogisticsFeat1}</li>
              <li><Icons.CheckCircle size={16} /> {t.serviceLogisticsFeat2}</li>
              <li><Icons.CheckCircle size={16} /> {t.serviceLogisticsFeat3}</li>
            </ul>
          </div>

          {/* Card 2 – Moisture & Quality */}
          <div className="service-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="service-header">
              <div className="service-icon">
                <Icons.Shield size={24} />
              </div>
              <h3>{t.serviceGrading}</h3>
            </div>
            
            <p>{t.serviceGradingDesc}</p>
            <ul className="service-features" style={{ marginTop: 'auto' }}>
              <li><Icons.CheckCircle size={16} /> {t.serviceGradingFeat1}</li>
              <li><Icons.CheckCircle size={16} /> {t.serviceGradingFeat2}</li>
              <li><Icons.CheckCircle size={16} /> {t.serviceGradingFeat3}</li>
            </ul>
          </div>

          {/* Card 3 – Silo Storage */}
          <div className="service-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="service-header">
              <div className="service-icon">
                <Icons.Warehouse size={24} />
              </div>
              <h3>{t.serviceStorage}</h3>
            </div>

            {/* Added premium processing factory visual */}
            <div style={{ width: '100%', height: '160px', overflow: 'hidden', borderRadius: '8px', border: '1px solid rgba(27,67,50,0.1)' }}>
              <img 
                src="/jeroma_processing_factory.webp" 
                alt="Jeroma Factory Silo Plant Machinery" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
              />
            </div>

            <p>{t.serviceStorageDesc}</p>
            <ul className="service-features" style={{ marginTop: 'auto' }}>
              <li><Icons.CheckCircle size={16} /> {t.serviceStorageFeat1}</li>
              <li><Icons.CheckCircle size={16} /> {t.serviceStorageFeat2}</li>
              <li><Icons.CheckCircle size={16} /> {t.serviceStorageFeat3}</li>
            </ul>
          </div>

          {/* Card 4 – Premium Inputs & Supplies */}
          <div className="service-card glass-panel" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
              <div className="service-header">
                <div className="service-icon">
                  <Icons.Seed size={24} />
                </div>
                <h3>{t.serviceInputs}</h3>
              </div>
              
              <p>{t.serviceInputsDesc}</p>

              {/* Flex container for Biofertilizer and Jeroma Maize Flour Bag */}
              <div style={{ display: 'flex', gap: '12px', margin: '8px 0' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(27,67,50,0.04)', borderRadius: '8px', padding: '8px 10px', border: '1px solid rgba(27,67,50,0.1)' }}>
                  <img 
                    src="/biofertilizer_bag.webp" 
                    alt="Biofertilizer Africa Bag" 
                    style={{ width: '38px', height: '46px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} 
                    loading="lazy"
                  />
                  <div>
                    <p style={{ color: 'var(--color-primary-light)', fontWeight: 700, fontSize: '0.8rem', marginBottom: '2px', lineHeight: 1.2 }}>Biofertilizer NPK</p>
                    <p style={{ color: 'var(--color-text-light)', fontSize: '0.7rem', marginBottom: 0 }}>NPK Organic · 25 Kg</p>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(27,67,50,0.04)', borderRadius: '8px', padding: '8px 10px', border: '1px solid rgba(27,67,50,0.1)' }}>
                  <img 
                    src="/jeroma_maize_flour_bag.webp" 
                    alt="Jeroma Maize Flour 5Kg Retail Bag" 
                    style={{ width: '38px', height: '46px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} 
                    loading="lazy"
                  />
                  <div>
                    <p style={{ color: 'var(--color-primary-light)', fontWeight: 700, fontSize: '0.8rem', marginBottom: '2px', lineHeight: 1.2 }}>Jeroma Flour</p>
                    <p style={{ color: 'var(--color-text-light)', fontSize: '0.7rem', marginBottom: 0 }}>Packed in Lira · 5 Kg</p>
                  </div>
                </div>
              </div>

              <ul className="service-features" style={{ marginTop: 'auto' }}>
                <li><Icons.CheckCircle size={16} /> {t.serviceInputsFeat1}</li>
                <li><Icons.CheckCircle size={16} /> {t.serviceInputsFeat2}</li>
                <li><Icons.CheckCircle size={16} /> {t.serviceInputsFeat3}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Interactive Calculator Section */}
        <div className="calculator-container glass-panel">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h3 className="calc-title">{t.calcHeader}</h3>
            <p className="calc-intro">{t.calcIntro}</p>
          </div>

          <div className="calc-grid">
            <div className="calc-form">
              <div className="form-group">
                <label>{t.calcLabelCrop}</label>
                <div className="crop-selector">
                  <button 
                    className={`crop-btn ${selectedCrop === 'coffee' ? 'active' : ''}`}
                    onClick={() => setSelectedCrop('coffee')}
                  >
                    <Icons.Coffee size={20} />
                    <span>{lang === 'en' ? 'Coffee' : 'Kawa'}</span>
                  </button>
                  <button 
                    className={`crop-btn ${selectedCrop === 'sunflower' ? 'active' : ''}`}
                    onClick={() => setSelectedCrop('sunflower')}
                  >
                    <Icons.Wheat size={20} />
                    <span>{lang === 'en' ? 'Sunflower' : lang === 'luo' ? 'Sunflower' : 'Sunflower'}</span>
                  </button>
                  <button 
                    className={`crop-btn ${selectedCrop === 'maize' ? 'active' : ''}`}
                    onClick={() => setSelectedCrop('maize')}
                  >
                    <Icons.Seed size={20} />
                    <span>{lang === 'en' ? 'Maize' : 'Anam'}</span>
                  </button>
                  <button 
                    className={`crop-btn ${selectedCrop === 'beans' ? 'active' : ''}`}
                    onClick={() => setSelectedCrop('beans')}
                  >
                    <Icons.Beans size={20} />
                    <span>{lang === 'en' ? 'Beans' : 'Ngor'}</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="weight">{t.calcLabelWeight}</label>
                <input 
                  type="number" 
                  id="weight" 
                  className="form-input" 
                  value={weight} 
                  onChange={(e) => setWeight(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                  step="50"
                  style={{ width: '100%' }}
                />
              </div>
              
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label>{t.calcChecklistHeader}</label>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icons.CheckCircle size={14} style={{ color: 'var(--color-primary-light)' }} />
                    <span>{t.calcCheck1}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icons.CheckCircle size={14} style={{ color: 'var(--color-primary-light)' }} />
                    <span>{t.calcCheck2}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icons.CheckCircle size={14} style={{ color: 'var(--color-primary-light)' }} />
                    <span>{t.calcCheck3}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="calc-result">
              <div className="result-header">
                <h4>{currentCrop.name} {t.calcGuidelineHeader}</h4>
                <p>{t.calcValuationHeader}</p>
              </div>

              <div className="result-stats" style={{ border: '2px dashed rgba(27,67,50,0.15)', padding: '16px', borderRadius: '8px', background: 'rgba(27,67,50,0.03)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-10px', left: '20px', background: '#ffffff', padding: '0 8px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-primary-light)', letterSpacing: '0.1em' }}>
                  {lang === 'en' ? 'OFFICIAL GRADING ESTIMATE' : 'WEL GRADING ME ADIER'}
                </div>
                
                <div className="result-row">
                  <span>{t.calcMoisture}</span>
                  <span className="result-value-highlight">{currentCrop.moisture}</span>
                </div>
                <div className="result-row">
                  <span>{t.calcPackaging}</span>
                  <span>{currentCrop.packaging}</span>
                </div>
                <div className="result-row">
                  <span>{lang === 'en' ? 'Bags Required:' : 'Bags ma mitte:'}</span>
                  <span style={{ fontWeight: 700 }}>
                    {Math.ceil(weight / (selectedCrop === 'coffee' ? 60 : selectedCrop === 'sunflower' ? 50 : 90))} {lang === 'en' ? 'Bags' : 'Gunia'}
                  </span>
                </div>
                <div className="result-row">
                  <span>{lang === 'en' ? 'Expected Cleaning Loss (2%):' : 'Sorting Loss (2%):'}</span>
                  <span style={{ opacity: 0.85 }}>~ {(weight * 0.02).toFixed(1)} Kg</span>
                </div>
                <div className="result-row">
                  <span>{t.calcPayoutRate}</span>
                  <span style={{ color: 'var(--color-primary-light)', fontWeight: '800' }}>{localPayout} / Kg</span>
                </div>

                {/* Highly requested local currency payout calculation card */}
                <div className="result-row total-payout-row" style={{ background: 'rgba(82, 183, 136, 0.12)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(82, 183, 136, 0.25)', marginTop: '8px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--color-primary-dark)' }}>{t.calcTotalPayout}</span>
                  <span style={{ color: 'var(--color-primary-dark)', fontWeight: '800', fontSize: '1.25rem' }}>UGX {totalPayoutUGX}</span>
                </div>

                <div className="result-row" style={{ opacity: 0.7, fontSize: '0.8rem', borderTop: '1px dotted rgba(27,67,50,0.15)', paddingTop: '8px' }}>
                  <span>{t.calcExportValue}</span>
                  <span>${calculatedValue} USD</span>
                </div>
              </div>

              <div className="result-guide">
                <h5>{t.calcGradingRule}</h5>
                <p style={{ marginBottom: '8px' }}>{currentCrop.gradingGuide}</p>
                <h5>{t.calcDryingTip}</h5>
                <p>{currentCrop.tips}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
