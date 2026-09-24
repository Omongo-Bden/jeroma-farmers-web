/**
 * Jeroma Farmers Hyperlocal Agro-Weather & Crop Advisory Engine
 * Tailored specifically to Northern Uganda agricultural zones (Acholi & Lango sub-regions).
 */

const DISTRICT_COORDINATES = {
  Pader: { lat: 2.8242, lon: 33.0039, zone: 'Acholi Sub-region' },
  Kitgum: { lat: 3.2783, lon: 32.8867, zone: 'Acholi Sub-region' },
  Agago: { lat: 2.8333, lon: 33.3333, zone: 'Acholi Sub-region' },
  Lira: { lat: 2.2472, lon: 32.8998, zone: 'Lango Sub-region' },
  Kole: { lat: 2.3789, lon: 32.7667, zone: 'Lango Sub-region' },
  Abim: { lat: 2.7056, lon: 33.6606, zone: 'Karamoja Sub-region' },
  Karenga: { lat: 3.5333, lon: 33.7000, zone: 'Karamoja Sub-region' }
};

/**
 * Generates an agro-climatic assessment and grain drying index for the selected district.
 */
export const getDistrictAgroWeather = (districtName = 'Pader') => {
  const normalized = districtName.replace(/^\d+\.\s*/, '').trim();
  const districtData = DISTRICT_COORDINATES[normalized] || DISTRICT_COORDINATES.Pader;

  // Seasonal simulation aligned with Northern Uganda bimodal rainfall seasons
  const month = new Date().getMonth(); // 0 = Jan, 8 = Sep, etc.
  const isWetSeason = (month >= 2 && month <= 5) || (month >= 7 && month <= 10);

  const tempC = Math.round(27 + Math.sin(Date.now() / 100000) * 4);
  const humidityPct = isWetSeason ? 68 : 42;
  const rainChancePct = isWetSeason ? 65 : 15;

  let dryingIndex = 'Optimal';
  let dryingAdvice = 'Excellent sun-drying conditions for sunflower & maize. Target <13% moisture.';
  if (rainChancePct > 50) {
    dryingIndex = 'Moderate';
    dryingAdvice = 'Keep grain tarpaulins ready. Brief showers expected in late afternoon.';
  }
  if (rainChancePct > 70) {
    dryingIndex = 'High Moisture Risk';
    dryingAdvice = 'Use mobile solar dryers or covered warehouse drying racks to prevent mold.';
  }

  return {
    district: normalized,
    zone: districtData.zone,
    temperatureCelsius: tempC,
    humidityPercentage: humidityPct,
    rainfallChancePercentage: rainChancePct,
    grainDryingIndex: dryingIndex,
    dryingAdvice,
    agronomicTip: isWetSeason
      ? 'Optimal soil moisture for top-dressing fertilizer and weeding soya beans & sunflower.'
      : 'Dry spell period: inspect grain warehouses for weevils, ensure hermetic storage bags are tightly sealed.'
  };
};
