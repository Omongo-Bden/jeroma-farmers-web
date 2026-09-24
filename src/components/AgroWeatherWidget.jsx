import React, { useState } from 'react';
import { getDistrictAgroWeather } from '../utils/weatherAgroService';

const SUPPORTED_DISTRICTS = ['Pader', 'Kitgum', 'Agago', 'Lira', 'Kole', 'Abim', 'Karenga'];

export default function AgroWeatherWidget({ initialDistrict = 'Pader' }) {
  const [district, setDistrict] = useState(initialDistrict);
  const weather = getDistrictAgroWeather(district);

  const getDryingBadgeColor = (idx) => {
    if (idx === 'Optimal') return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' };
    if (idx === 'Moderate') return { bg: '#fffbeb', text: '#92400e', border: '#fde68a' };
    return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' };
  };

  const badgeStyle = getDryingBadgeColor(weather.grainDryingIndex);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
        border: '1.5px solid #86efac',
        borderRadius: '14px',
        padding: '16px 20px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
        marginBottom: '20px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.4rem' }}>🌤️</span>
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', color: '#14532d', fontWeight: 800 }}>
              Regional Agro-Climatic & Grain Drying Advisory
            </h4>
            <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>
              Hyperlocal monitoring for {weather.zone}
            </div>
          </div>
        </div>

        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1.5px solid #059669',
            background: '#ffffff',
            color: '#065f46',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer'
          }}
        >
          {SUPPORTED_DISTRICTS.map((d) => (
            <option key={d} value={d}>
              📍 {d} District
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '12px' }}>
        <div style={{ background: '#ffffff', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Temperature</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', marginTop: '2px' }}>
            {weather.temperatureCelsius}°C
          </div>
        </div>
        <div style={{ background: '#ffffff', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Relative Humidity</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>
            {weather.humidityPercentage}%
          </div>
        </div>
        <div style={{ background: '#ffffff', padding: '10px', borderRadius: '10px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>Precipitation Risk</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: weather.rainfallChancePercentage > 50 ? '#d97706' : '#15803d', marginTop: '2px' }}>
            {weather.rainfallChancePercentage}%
          </div>
        </div>
        <div style={{ background: badgeStyle.bg, padding: '10px', borderRadius: '10px', textAlign: 'center', border: `1.5px solid ${badgeStyle.border}` }}>
          <div style={{ fontSize: '0.7rem', color: badgeStyle.text, fontWeight: 700 }}>Grain Drying Index</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: badgeStyle.text, marginTop: '2px' }}>
            {weather.grainDryingIndex}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#334155' }}>
        <div>
          <strong>🌾 Grain Drying Guidance:</strong> {weather.dryingAdvice}
        </div>
        <div style={{ color: '#065f46' }}>
          <strong>🌱 Agronomy Tip:</strong> {weather.agronomicTip}
        </div>
      </div>
    </div>
  );
}
