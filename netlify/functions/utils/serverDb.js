// Server-Side Database Adapter for Jeroma Farmers Netlify Functions
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const bcrypt = require('bcryptjs');

// Path to the persistent database file in the operating system's temp folder or custom persistent directory
const DB_FILE = process.env.DB_PATH || path.join(__dirname, '..', '..', 'jeroma_db.json');

// Secure password hashing helper using Bcrypt
const hashPassword = (password) => {
  return bcrypt.hashSync(String(password), 10);
};

// Backward-compatible password verification helper
const comparePassword = (password, hash) => {
  if (!hash) return false;
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
    return bcrypt.compareSync(String(password), hash);
  }
  // Fallback for pre-existing SHA-256 default accounts
  const sha256 = crypto.createHash('sha256').update(String(password)).digest('hex');
  return sha256 === hash;
};

// Helper to load state from disk
const loadDb = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.users && parsed.crops) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading db file, defaulting to memory:', e);
  }
  return null;
};

// Helper to save state to disk
const saveDb = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving db file:', e);
  }
};

// Default static tables seeded on start
const DEFAULT_CROPS = {
  coffee: { id: 'coffee', name: 'Coffee Beans', moisture: '12.0% - 13.0%', packaging: '60 kg Sisal Bags', marketPrice: 3.50, payoutRate: 'UGX 12,500', gradingGuide: 'Must be free of black beans, moldy odors, and insect damage. Maximum defect count: 5%.', tips: 'Pre-dry on raised beds for at least 14 days before delivery to achieve premium Grade-A valuation.' },
  sunflower: { id: 'sunflower', name: 'Sunflower Seeds', moisture: '9.0% - 10.0%', packaging: '50 kg Woven Bags', marketPrice: 0.60, payoutRate: 'UGX 2,200', gradingGuide: 'Silt and foreign matter must be under 2%. Seed breakage must be under 3%. Oil content minimum: 38%.', tips: 'Ensure proper thrashing and winnowing to remove dust and empty husks prior to bagging.' },
  maize: { id: 'maize', name: 'Maize (Corn)', moisture: '13.0% - 13.5%', packaging: '90 kg Polypropylene Bags', marketPrice: 0.35, payoutRate: 'UGX 1,300', gradingGuide: 'Weevil damage must be under 1%. Moldy or discolored kernels under 2%. Broken kernels under 2%.', tips: 'Shell using clean equipment to avoid kernel breakage, and sieve thoroughly to eliminate chaff.' },
  beans: { id: 'beans', name: 'Dry Beans', moisture: '14.0% - 14.5%', packaging: '90 kg Polypropylene Bags', marketPrice: 0.85, payoutRate: 'UGX 3,100', gradingGuide: 'Uniform size and color. Splitting under 2%. Moisture above 15% will require warehouse re-drying.', tips: 'Sort out stones, soil clods, and wrinkled seeds at the farm level to secure immediate Grade-A status.' }
};

const DEFAULT_USERS = [
  { username: 'admin', password: hashPassword('admin123'), name: 'Center Administrator', role: 'admin', phone: '+256 773 623 196', district: 'Lira' },
  { username: 'okello', password: hashPassword('pass123'), name: 'John Okello', role: 'client', phone: '+256 772 445 599', district: 'Lira', farmSize: '12 acres' },
  { username: 'akello', password: hashPassword('pass123'), name: 'Florence Akello', role: 'client', phone: '+256 782 608 721', district: 'Kole', farmSize: '8 acres' }
];

const DEFAULT_DELIVERIES = [
  { id: 'del-001', username: 'okello', farmerName: 'John Okello', cropId: 'sunflower', cropName: 'Sunflower Seeds', weight: 850, grade: 'A', rate: 2200, payout: 1870000, status: 'Completed', date: '2026-05-12' },
  { id: 'del-002', username: 'okello', farmerName: 'John Okello', cropId: 'maize', cropName: 'Maize (Corn)', weight: 1200, grade: 'A', rate: 1300, payout: 1560000, status: 'Completed', date: '2026-05-20' },
  { id: 'del-003', username: 'akello', farmerName: 'Florence Akello', cropId: 'sunflower', cropName: 'Sunflower Seeds', weight: 500, grade: 'B', rate: 2000, payout: 1000000, status: 'Completed', date: '2026-05-18' },
  { id: 'del-004', username: 'okello', farmerName: 'John Okello', cropId: 'beans', cropName: 'Dry Beans', weight: 400, grade: 'A', rate: 3100, payout: 1240000, status: 'Processing', date: '2026-06-05' }
];

const DEFAULT_DISPATCHES = [
  { id: 'disp-001', username: 'okello', farmerName: 'John Okello', cropId: 'sunflower', cropName: 'Sunflower Seeds', weight: 1500, date: '2026-06-12', location: 'Lira Sub-county, Okolo Village', status: 'Scheduled', notes: 'Access road is dry. Easy for 3-ton truck.' },
  { id: 'disp-002', username: 'akello', farmerName: 'Florence Akello', cropId: 'maize', cropName: 'Maize (Corn)', weight: 2000, date: '2026-06-15', location: 'Kole Center, Bala Road', status: 'Pending', notes: 'Require bagging sacks from center.' }
];

const DEFAULT_INQUIRIES = [
  { id: 'inq-001', name: 'Sarah Odongo', email: 'sarah.odongo@gmail.com', phone: '+256 701 445 990', subject: 'Biofertilizer Supply Inquiry', message: 'Hello, I want to inquire if you have enough Biofertilizer Africa NPK bags for planting. I need about 15 bags for my farm in Lira. Thank you.', date: '2026-06-04', status: 'Unread' },
  { id: 'inq-002', name: 'Moses Ocen', email: 'moses.ocen@yahoo.com', phone: '+256 754 332 110', subject: 'Sunflower Seeds Order', message: 'Can I purchase SeedCo LG sunflower seeds under the credit harvest scheme? I am a registered farmer in Lira.', date: '2026-06-05', status: 'Read' }
];

const DEFAULT_SLIDES = [
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
  }
];

const DEFAULT_MANUAL = [
  {
    id: 'site-selection',
    num: '01',
    title_en: 'Site Selection',
    title_luo: 'Yer Lobo Pur',
    subtitle_en: 'Choose the right land for your crops',
    subtitle_luo: 'Yer lobo ma ber pi cam',
    image: '/sunflower_field.webp',
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
    image: '/farmers_training_1.jpg',
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
    image: '/farmer_man_seedco.webp',
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
    image: '/four_men_sunflowers.webp',
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
    image: '/jeroma_maize_flour_bag.webp',
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

// Persistent state in memory across serverless invocations (if warm)
let dbState = loadDb() || {
  crops: { ...DEFAULT_CROPS },
  users: [...DEFAULT_USERS],
  deliveries: [...DEFAULT_DELIVERIES],
  dispatches: [...DEFAULT_DISPATCHES],
  inquiries: [...DEFAULT_INQUIRIES],
  translations: null,
  slides: [...DEFAULT_SLIDES],
  manual: [...DEFAULT_MANUAL]
};

if (!dbState.slides) {
  dbState.slides = [...DEFAULT_SLIDES];
}
if (!dbState.manual) {
  dbState.manual = [...DEFAULT_MANUAL];
}

// Database migration to repair manual image paths
if (dbState.manual && Array.isArray(dbState.manual)) {
  let wasUpdated = false;
  dbState.manual = dbState.manual.map(stage => {
    if (stage.id === 'site-selection' && stage.image === '/sunflower_field.png') {
      stage.image = '/sunflower_field.webp';
      wasUpdated = true;
    }
    if (stage.id === 'farmer-profiling' && stage.image === '/farmers_training_1.png') {
      stage.image = '/farmers_training_1.jpg';
      wasUpdated = true;
    }
    if (stage.id === 'quality-inputs' && stage.image === '/farmer_man_seedco.png') {
      stage.image = '/farmer_man_seedco.webp';
      wasUpdated = true;
    }
    if (stage.id === 'harvesting' && stage.image === '/four_men_sunflowers.png') {
      stage.image = '/four_men_sunflowers.webp';
      wasUpdated = true;
    }
    if (stage.id === 'milling-processing' && stage.image === '/jeroma_maize_flour_bag.png') {
      stage.image = '/jeroma_maize_flour_bag.webp';
      wasUpdated = true;
    }
    return stage;
  });
  if (wasUpdated) {
    saveDb();
  }
}

// Database interfaces
module.exports = {
  hashPassword,
  comparePassword,
  
  getCrops: async () => dbState.crops,
  saveCrops: async (crops) => {
    dbState.crops = crops;
    saveDb();
    return dbState.crops;
  },

  getUsers: async () => dbState.users,
  registerUser: async (user, role = 'client') => {
    const existing = dbState.users.find(u => u.username === user.username);
    if (existing) return { success: false, error: 'Username already exists' };
    const newUser = {
      ...user,
      password: hashPassword(user.password),
      role
    };
    dbState.users.push(newUser);
    saveDb();
    return { success: true, user: newUser };
  },
  
  updateUser: async (username, updatedData) => {
    const idx = dbState.users.findIndex(u => u.username === username);
    if (idx !== -1) {
      if (updatedData.password) {
        updatedData.password = hashPassword(updatedData.password);
      }
      dbState.users[idx] = { ...dbState.users[idx], ...updatedData };
      saveDb();
      return true;
    }
    return false;
  },
  
  deleteUser: async (username) => {
    const originalLength = dbState.users.length;
    dbState.users = dbState.users.filter(u => u.username !== username);
    const deleted = dbState.users.length !== originalLength;
    if (deleted) {
      saveDb();
    }
    return deleted;
  },

  getDeliveries: async () => dbState.deliveries,
  saveDelivery: async (delivery) => {
    const newDelivery = {
      id: 'del-' + Math.floor(Math.random() * 900000 + 100000),
      status: 'Processing',
      date: new Date().toISOString().split('T')[0],
      ...delivery
    };
    dbState.deliveries.unshift(newDelivery);
    saveDb();
    return newDelivery;
  },
  updateDeliveryStatus: async (id, status) => {
    const idx = dbState.deliveries.findIndex(d => d.id === id);
    if (idx !== -1) {
      dbState.deliveries[idx].status = status;
      saveDb();
      return true;
    }
    return false;
  },

  getDispatches: async () => dbState.dispatches,
  saveDispatch: async (dispatch) => {
    const newDispatch = {
      id: 'disp-' + Math.floor(Math.random() * 900000 + 100000),
      status: 'Pending',
      ...dispatch
    };
    dbState.dispatches.unshift(newDispatch);
    saveDb();
    return newDispatch;
  },
  updateDispatchStatus: async (id, status) => {
    const idx = dbState.dispatches.findIndex(d => d.id === id);
    if (idx !== -1) {
      dbState.dispatches[idx].status = status;
      saveDb();
      return true;
    }
    return false;
  },

  getInquiries: async () => dbState.inquiries,
  saveInquiry: async (inquiry) => {
    const newInquiry = {
      id: 'inq-' + Math.floor(Math.random() * 900000 + 100000),
      status: 'Unread',
      date: new Date().toISOString().split('T')[0],
      ...inquiry
    };
    dbState.inquiries.unshift(newInquiry);
    saveDb();
    return newInquiry;
  },
  updateInquiryStatus: async (id, status) => {
    const idx = dbState.inquiries.findIndex(i => i.id === id);
    if (idx !== -1) {
      dbState.inquiries[idx].status = status;
      saveDb();
      return true;
    }
    return false;
  },
  
  getTranslations: async () => dbState.translations,
  saveTranslations: async (translations) => {
    dbState.translations = translations;
    saveDb();
    return dbState.translations;
  },

  getSlides: async () => dbState.slides,
  saveSlides: async (slides) => {
    // Force all slides to Emerald Green colors
    dbState.slides = slides.map(s => ({
      ...s,
      color: '#081c15',
      accent: '#52b788'
    }));
    saveDb();
    return dbState.slides;
  },

  getManual: async () => dbState.manual,
  saveManual: async (manual) => {
    dbState.manual = manual;
    saveDb();
    return dbState.manual;
  },

  getAlerts: async () => dbState.alerts || [],
  addAlert: async (alert) => {
    if (!dbState.alerts) dbState.alerts = [];
    const newAlert = { id: 'alert-' + Date.now() + '-' + Math.floor(Math.random()*1000), timestamp: new Date().toISOString(), ...alert };
    dbState.alerts.unshift(newAlert);
    if (dbState.alerts.length > 100) dbState.alerts = dbState.alerts.slice(0, 100);
    saveDb();
    return newAlert;
  },
  getSettings: async () => {
    if (!dbState.settings) {
      dbState.settings = { hideManual: false };
    }
    return dbState.settings;
  },
  saveSettings: async (settings) => {
    if (!dbState.settings) {
      dbState.settings = { hideManual: false };
    }
    dbState.settings = { ...dbState.settings, ...settings };
    saveDb();
    return dbState.settings;
  },
  resetDatabase: async () => {
    dbState = {
      crops: { ...DEFAULT_CROPS },
      users: [...DEFAULT_USERS],
      deliveries: [...DEFAULT_DELIVERIES],
      dispatches: [...DEFAULT_DISPATCHES],
      inquiries: [...DEFAULT_INQUIRIES],
      translations: null,
      slides: [...DEFAULT_SLIDES],
      manual: [...DEFAULT_MANUAL],
      alerts: [],
      settings: { hideManual: false }
    };
    saveDb();
  }
};
