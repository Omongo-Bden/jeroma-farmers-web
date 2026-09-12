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
  { 
    username: 'admin', 
    password: hashPassword('admin123'), 
    name: 'Center Administrator', 
    role: 'admin', 
    department: 'Managing Director',
    phone: '+256 773 623 196', 
    district: 'Lira',
    permissions: ['prices', 'deliveries', 'dispatches', 'projects', 'staff', 'cooperatives', 'departments', 'forms', 'inquiries', 'users', 'logins', 'language', 'manual', 'chatbot', 'slides']
  },
  { 
    username: 'md', 
    password: hashPassword('jeroma2026'), 
    name: 'Acuti Sam', 
    title: 'Managing Director',
    role: 'managing_director', 
    department: 'Managing Director',
    phone: '+256 773 623 196', 
    district: 'Pader',
    permissions: ['prices', 'deliveries', 'dispatches', 'projects', 'staff', 'cooperatives', 'departments', 'forms', 'inquiries', 'users', 'logins', 'language', 'manual', 'chatbot', 'slides']
  },
  { 
    username: 'finance', 
    password: hashPassword('jeroma2026'), 
    name: 'Sharon Akello', 
    title: 'Finance Manager',
    role: 'finance_manager', 
    department: 'Finance manager',
    phone: '+256 774 332 901', 
    district: 'Lira',
    permissions: ['departments', 'prices', 'deliveries', 'inquiries']
  },
  { 
    username: 'projects', 
    password: hashPassword('jeroma2026'), 
    name: 'Daniel Okot', 
    title: 'Project / Program Manager',
    role: 'project_manager', 
    department: 'project/Program manager',
    phone: '+256 775 889 012', 
    district: 'Pader',
    permissions: ['projects', 'cooperatives', 'manual', 'forms']
  },
  { 
    username: 'secretary', 
    password: hashPassword('jeroma2026'), 
    name: 'Logira Richard', 
    title: 'General Secretary',
    role: 'general_secretary', 
    department: 'General Secretary',
    phone: '+256 772 890 123', 
    district: 'Lira',
    permissions: ['staff', 'cooperatives', 'inquiries', 'departments']
  },
  { 
    username: 'logistics', 
    password: hashPassword('jeroma2026'), 
    name: 'Denis Ojok', 
    title: 'Procurement & Logistic Officer',
    role: 'procurement_officer', 
    department: 'Procurement and logistic officer',
    phone: '+256 773 998 877', 
    district: 'Lira',
    permissions: ['dispatches', 'deliveries', 'cooperatives', 'slides']
  },
  { 
    username: 'mne', 
    password: hashPassword('jeroma2026'), 
    name: 'David Odongo', 
    title: 'Monitoring & Evaluation Officer',
    role: 'mne_officer', 
    department: 'Monitoring and Evaluation',
    phone: '+256 771 889 900', 
    district: 'Agago',
    permissions: ['forms', 'projects', 'cooperatives', 'departments']
  },
  { 
    username: 'okello', 
    password: hashPassword('pass123'), 
    name: 'John Okello', 
    role: 'client', 
    department: 'Registered Farmer',
    phone: '+256 772 445 599', 
    district: 'Lira', 
    farmSize: '12 acres' 
  },
  { 
    username: 'akello', 
    password: hashPassword('pass123'), 
    name: 'Florence Akello', 
    role: 'client', 
    department: 'Registered Farmer',
    phone: '+256 782 608 721', 
    district: 'Kole', 
    farmSize: '8 acres' 
  }
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
  },
  {
    id: 'video_a2i_lira',
    icon: '🎥',
    tag_en: 'Training Video',
    tag_ach: 'Video me Pwonj',
    title_en: 'A2I Lira Farmer Training in Action',
    title_ach: 'Pwonj me A2I i Lira pi Lupur',
    body_en: 'Watch Jeroma, Access to Innovation (A2I), and partner bank teams conducting practical field training with local farmers and SACCOs in Lira on modern agro-machinery and financial literacy.',
    body_ach: 'Nen team me Jeroma, A2I, kede Bank tye ka pwonjo lupur kede SACCOs i Lira kom mashini me pur kede neno cente.',
    video: '/videos/a2i_lira_training.mp4',
    color: '#081c15',
    accent: '#52b788',
    fit: 'cover',
  },
  {
    id: 'video_fallarmy_worm',
    icon: '🐛',
    tag_en: 'Crop Protection Video',
    tag_ach: 'Gengo Kwoyo (Video)',
    title_en: 'Fall Armyworm Field Scouting & Protection',
    title_ach: 'Gengo Fall Armyworm kede Kwoyo i Cam',
    body_en: 'Field extension guidance on scouting, early detection, and safe biological control techniques to protect maize and sunflower crops against fall armyworm outbreaks.',
    body_ach: 'Pwonj me poto kom gengo Fall Armyworm ma balu anwanyi kede cam, pwonjo lupur yore me yeyi kabilo maber wek cam obed ma kwo.',
    video: '/videos/fallarmy_worm.mp4',
    color: '#081c15',
    accent: '#52b788',
    fit: 'cover',
  },
  {
    id: 'partnership_a2i',
    icon: '🚀',
    tag_en: 'Implementation',
    tag_ach: 'Dwol me Tic',
    title_en: 'A2I Cohort 1: Implementation Stage & Joint Farmer Trainings',
    title_ach: 'A2I Cohort 1: Dwol me Tic & Pwonj me Lupur ki Bank, Jeroma & A2I',
    body_en: 'The Agricultural Modernization & Capacity Building Initiative (Cohort 1) is now under the Implementation Stage! In conjunction with Access to Innovation (A2I) and supported by the Danish Government, joint farmer trainings are actively underway conducted by commercial partner banks, Jeroma agronomy experts, and A2I teams.',
    body_ach: 'Prujek me A2I Cohort 1 dong ocopo i dwol me tic me poto! I ribbe tic ki Access to Innovation (A2I) kede Gavumenti me Denmark, pwonj dongo bot lupur tye ka medde ma team me commercial banks, Jeroma, kede A2I tye ka miyo kanyacel.',
    image: '/a2i_project_2.jpg',
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

const DEFAULT_PROJECTS = [
  {
    id: 'proj-a2i-01',
    code: 'A2I-COHORT-1',
    title: 'Agricultural Modernization & Capacity Building Initiative — Cohort 1',
    partner: 'Access to Innovation (A2I) & Danish Government',
    status: 'Implementation',
    progressPercent: 68,
    budget: 450000000,
    spent: 245000000,
    currency: 'UGX',
    startDate: '2026-07-01',
    endDate: '2027-06-30',
    targetBeneficiaries: 1800,
    achievedBeneficiaries: 1350,
    targetCooperatives: 15,
    engagedCooperatives: 12,
    cooperatives: [
      'Pader Sunflower Growers Cooperative Society',
      'Agago Grain Producers SACCO',
      'Kitgum Mixed Farming Cooperative Society',
      'Lira Central Smallholders Cooperative',
      'Kole Agro-Producers Association'
    ],
    objectives: 'Implementation Stage: Conducting intensive hands-on farmer training sessions jointly delivered by commercial partner banks, Jeroma agronomy specialists, and Access to Innovation (A2I) teams. Equipping farmers with financial literacy, credit access, modern machinery operation (threshers, shellers, solar dryers), and high-grade post-harvest crop preservation supported by the Danish Government.',
    riskMitigation: 'Machine maintenance trained local operators; commercial bank financial advisory; warranty backed by Danida and equipment manufacturers.',
    milestones: [
      { id: 'm1', phase: 'Initiation', title: 'Cohort 1 Field Needs Assessment in Lango & Acholi', completed: true, targetDate: '2026-07-14' },
      { id: 'm2', phase: 'Planning', title: 'Selection & Vetting of 12 Pilot Cooperatives & SACCOs', completed: true, targetDate: '2026-08-01' },
      { id: 'm3', phase: 'Implementation', title: 'Joint Farmer Trainings by Commercial Banks, Jeroma & A2I Teams', completed: true, targetDate: '2026-09-10' },
      { id: 'm4', phase: 'Implementation', title: 'Deployment of Multi-Crop Threshers & Cyclone Shellers', completed: false, targetDate: '2026-10-15' },
      { id: 'm5', phase: 'Monitoring', title: 'Mid-Term Machine Utilization & Yield Quality Audit', completed: false, targetDate: '2026-11-15' },
      { id: 'm6', phase: 'Completed', title: 'Cohort 2 Handover & Annual Impact Evaluation', completed: false, targetDate: '2027-06-15' }
    ],
    manager: 'Daniel Okot (Projects Manager)'
  },
  {
    id: 'proj-seed-02',
    code: 'SEED-SUB-2026',
    title: 'Certified Sunflower & Hybrid Maize Seed Subsidy Initiative',
    partner: 'Jeroma FCC Ltd & SeedCo Uganda',
    status: 'On Process',
    progressPercent: 40,
    budget: 180000000,
    spent: 145000000,
    currency: 'UGX',
    startDate: '2026-03-01',
    endDate: '2026-11-30',
    targetBeneficiaries: 2500,
    achievedBeneficiaries: 2150,
    targetCooperatives: 20,
    engagedCooperatives: 18,
    cooperatives: [
      'Pader Sunflower Growers Cooperative Society',
      'Agago Grain Producers SACCO',
      'Kitgum Mixed Farming Cooperative Society',
      'Abim Oilseed & Agroforestry Association',
      'Karenga Green Growers Farmer Group'
    ],
    objectives: 'Subsidize high-oil hybrid sunflower seeds (LG 56.58 / Aguara) and drought-tolerant certified maize (Longe 10H) with guaranteed buy-back contracts.',
    riskMitigation: 'Weather index insurance bundled with seed distribution to protect against drought delays.',
    milestones: [
      { id: 'm1', phase: 'Initiation', title: 'Seed Supplier MoUs & Subsidy Framework Agreement', completed: true, targetDate: '2026-03-15' },
      { id: 'm2', phase: 'Planning', title: 'Farmer Registration & Seed Volume Forecasting', completed: true, targetDate: '2026-04-10' },
      { id: 'm3', phase: 'On Process', title: 'Distribution Hub Mobilization & Seed Bag Tagging', completed: false, targetDate: '2026-05-20' },
      { id: 'm4', phase: 'Implementation', title: 'Field Distribution to 2,500 Smallholder Farmers', completed: false, targetDate: '2026-08-30' },
      { id: 'm5', phase: 'Monitoring', title: 'Germination & Pest Control Field Verification', completed: false, targetDate: '2026-10-15' },
      { id: 'm6', phase: 'Completed', title: 'Harvest Aggregation & Offtake Buy-Back Closure', completed: false, targetDate: '2026-11-30' }
    ],
    manager: 'Sharon Akello (Finance & Input Credit)'
  },
  {
    id: 'proj-tree-03',
    code: 'ENV-NURSERY-07',
    title: 'Northern Uganda Commercial Tree Nursery & Afforestation Initiative',
    partner: 'National Forestry Authority (NFA) & Jeroma Environmental Hub',
    status: 'Implementation',
    progressPercent: 55,
    budget: 95000000,
    spent: 52000000,
    currency: 'UGX',
    startDate: '2026-01-15',
    endDate: '2026-12-31',
    targetBeneficiaries: 1200,
    achievedBeneficiaries: 890,
    targetCooperatives: 10,
    engagedCooperatives: 8,
    cooperatives: [
      'Kitgum Mixed Farming Cooperative Society',
      'Abim Oilseed & Agroforestry Association',
      'Karenga Green Growers Farmer Group'
    ],
    objectives: 'Establish commercial tree nurseries propagating 250,000 seedlings (Fruit trees, Melia Volkensii, Grevillea, Teak) for agroforestry, shade cover, and carbon resilience.',
    riskMitigation: 'Nursery shades equipped with solar-powered drip irrigation against dry season seedling mortality.',
    milestones: [
      { id: 'm1', phase: 'Initiation', title: 'NFA Land Use Permission & Seedling Viability Protocol', completed: true, targetDate: '2026-02-28' },
      { id: 'm2', phase: 'Planning', title: 'Soil Potting Mix & Shade Netting Procurement', completed: true, targetDate: '2026-04-15' },
      { id: 'm3', phase: 'On Process', title: 'Seedbed Germination & 180,000 Seedlings Potting', completed: true, targetDate: '2026-05-15' },
      { id: 'm4', phase: 'Implementation', title: 'Distribution of Fruit & Agroforestry Trees to Farmers', completed: false, targetDate: '2026-09-30' },
      { id: 'm5', phase: 'Monitoring', title: 'Survival Rate Audit & Tree Growth Tracking', completed: false, targetDate: '2026-11-20' },
      { id: 'm6', phase: 'Completed', title: 'Forestry Handover & Carbon Offset Assessment', completed: false, targetDate: '2026-12-31' }
    ],
    manager: 'Patrick Ocen (Environment & Forestry Supervisor)'
  },
  {
    id: 'proj-gap-04',
    code: 'GAP-TRAIN-2026',
    title: 'Good Agronomic Practices (GAP) & Aflatoxin Reduction Training',
    partner: 'NARO Uganda & Jeroma Agronomy Division',
    status: 'Implementation',
    progressPercent: 75,
    budget: 65000000,
    spent: 48000000,
    currency: 'UGX',
    startDate: '2026-02-01',
    endDate: '2026-10-31',
    targetBeneficiaries: 3000,
    achievedBeneficiaries: 2640,
    targetCooperatives: 25,
    engagedCooperatives: 22,
    cooperatives: [
      'Pader Sunflower Growers Cooperative Society',
      'Agago Grain Producers SACCO',
      'Kitgum Mixed Farming Cooperative Society',
      'Lira Central Smallholders Cooperative',
      'Kole Agro-Producers Association'
    ],
    objectives: 'Train smallholder farmers on raised-rack drying, digital moisture grading, IPM pest control, and proper hermetic grain storage to achieve 0% aflatoxin contamination.',
    riskMitigation: 'Practical hands-on village field training plots with local language (Acholi / Lango) manuals.',
    milestones: [
      { id: 'm1', phase: 'Initiation', title: 'Curriculum Harmonization with NARO & Ministry of Agriculture', completed: true, targetDate: '2026-02-20' },
      { id: 'm2', phase: 'Planning', title: 'TOT Training of 24 Field Extension Officers', completed: true, targetDate: '2026-04-10' },
      { id: 'm3', phase: 'On Process', title: 'Community Mobilization & Field Plot Preparation', completed: true, targetDate: '2026-06-15' },
      { id: 'm4', phase: 'Implementation', title: 'Raised Racks & Hermetic Storage Bag Distribution', completed: true, targetDate: '2026-08-20' },
      { id: 'm5', phase: 'Monitoring', title: 'Aflatoxin Lab Testing & Grain Quality Sampling', completed: false, targetDate: '2026-09-30' },
      { id: 'm6', phase: 'Completed', title: 'Farmer Certification & Final Training Report', completed: false, targetDate: '2026-10-31' }
    ],
    manager: 'James Opio (Extension & Agronomy Lead)'
  }
];

const DEFAULT_STAFF = [
  { id: 'stf-001', employeeId: 'JER-MD-001', name: 'Acuti Sam', title: 'Managing Director', department: 'Managing Director', district: 'Pader', phone: '+256 773 623 196', email: 'acuti.sam@jeromafarmers.co.ug', gender: 'Male', status: 'Active', employmentType: 'Full-time', responsibilities: 'Executive oversight, overall operations, strategic donor partnerships' },
  { id: 'stf-002', employeeId: 'JER-FIN-002', name: 'Sharon Akello', title: 'Finance Manager', department: 'Finance manager', district: 'Lira', phone: '+256 774 332 901', email: 'finance@jeromafarmers.co.ug', gender: 'Female', status: 'Active', employmentType: 'Full-time', responsibilities: 'Treasury, grain payout rates, seed subsidy disbursements, accounting ledger' },
  { id: 'stf-003', employeeId: 'JER-PRJ-003', name: 'Daniel Okot', title: 'Project / Program Manager', department: 'project/Program manager', district: 'Pader', phone: '+256 775 889 012', email: 'projects@jeromafarmers.co.ug', gender: 'Male', status: 'Active', employmentType: 'Full-time', responsibilities: 'Access to Innovation (A2I), seed programs, partner cooperatives, deliverables' },
  { id: 'stf-004', employeeId: 'JER-SEC-004', name: 'Logira Richard', title: 'General Secretary', department: 'General Secretary', district: 'Lira', phone: '+256 772 890 123', email: 'secretary@jeromafarmers.co.ug', gender: 'Male', status: 'Active', employmentType: 'Full-time', responsibilities: 'Corporate governance, staff positions, cooperative legal profiling, records' },
  { id: 'stf-005', employeeId: 'JER-LOG-005', name: 'Denis Ojok', title: 'Procurement & Logistic Officer', department: 'Procurement and logistic officer', district: 'Lira', phone: '+256 773 998 877', email: 'logistics@jeromafarmers.co.ug', gender: 'Male', status: 'Active', employmentType: 'Full-time', responsibilities: 'Grain collections, truck dispatch, warehouse receiving, machinery fleet' },
  { id: 'stf-006', employeeId: 'JER-MNE-006', name: 'David Odongo', title: 'Monitoring & Evaluation Officer', department: 'Monitoring and Evaluation', district: 'Agago', phone: '+256 771 889 900', email: 'mne@jeromafarmers.co.ug', gender: 'Male', status: 'Active', employmentType: 'Full-time', responsibilities: 'Google Forms ingestion, field surveys, impact evaluation, beneficiary verification' },
  { id: 'stf-007', employeeId: 'JER-AGR-007', name: 'James Opio', title: 'Senior Agronomist & Field Lead', department: 'project/Program manager', district: 'Agago', phone: '+256 781 445 678', email: 'agronomy@jeromafarmers.co.ug', gender: 'Male', status: 'Active', employmentType: 'Full-time', responsibilities: 'GAP training, field extension supervision, soil and seed quality testing' },
  { id: 'stf-008', employeeId: 'JER-ENV-008', name: 'Patrick Ocen', title: 'Environment & Forestry Supervisor', department: 'Monitoring and Evaluation', district: 'Kitgum', phone: '+256 752 334 556', email: 'environment@jeromafarmers.co.ug', gender: 'Male', status: 'Active', employmentType: 'Full-time', responsibilities: 'Tree nursery propagation, commercial forestry, reforestation monitoring' },
  { id: 'stf-009', employeeId: 'JER-OPS-009', name: 'Isaac Ogwang', title: 'Warehouse & Storekeeper Lead', department: 'Procurement and logistic officer', district: 'Lira', phone: '+256 785 667 890', email: 'stores@jeromafarmers.co.ug', gender: 'Male', status: 'Active', employmentType: 'Full-time', responsibilities: 'Grain inventory, bagging scales, moisture testing, stock security' }
];

const DEFAULT_COOPERATIVES = [
  {
    id: 'coop-001',
    name: 'Pader Sunflower Growers Cooperative Society Ltd',
    district: 'Pader',
    subcounty: 'Pader Town Council / Lapul',
    contactPerson: 'Okot George',
    phone: '+256 772 345 678',
    email: 'pader.sunflower@gmail.com',
    memberCount: 340,
    maleMembers: 160,
    femaleMembers: 180,
    primaryCrops: ['Sunflower', 'Maize', 'Soybeans'],
    linkedProjects: ['proj-a2i-01', 'proj-seed-02', 'proj-gap-04'],
    machineryAssigned: ['Multi-Crop Thresher (JF-TH-01)', '2x Moisture Meters'],
    status: 'Active',
    registeredDate: '2024-03-12'
  },
  {
    id: 'coop-002',
    name: 'Agago Grain Producers SACCO',
    district: 'Agago',
    subcounty: 'Kalongo / Patongo',
    contactPerson: 'Akello Beatrice',
    phone: '+256 782 901 234',
    email: 'agago.grains@gmail.com',
    memberCount: 290,
    maleMembers: 130,
    femaleMembers: 160,
    primaryCrops: ['Maize', 'Sunflower', 'Dry Beans'],
    linkedProjects: ['proj-a2i-01', 'proj-seed-02'],
    machineryAssigned: ['Tractor Walking Unit (JF-TR-01)', 'Maize Sheller'],
    status: 'Active',
    registeredDate: '2024-05-18'
  },
  {
    id: 'coop-003',
    name: 'Kitgum Mixed Farming Cooperative Society',
    district: 'Kitgum',
    subcounty: 'Kitgum Matidi / Mucwini',
    contactPerson: 'Ocen Patrick',
    phone: '+256 752 678 901',
    email: 'kitgum.farmers@yahoo.com',
    memberCount: 410,
    maleMembers: 195,
    femaleMembers: 215,
    primaryCrops: ['Sunflower', 'Simsim', 'Maize'],
    linkedProjects: ['proj-a2i-01', 'proj-tree-03', 'proj-gap-04'],
    machineryAssigned: ['Solar Drying Rack Unit (JF-SR-01)', 'Multi-Crop Thresher'],
    status: 'Active',
    registeredDate: '2023-11-04'
  },
  {
    id: 'coop-004',
    name: 'Abim Oilseed & Agroforestry Association',
    district: 'Abim',
    subcounty: 'Nyakwae / Morulem',
    contactPerson: 'Auma Lucy',
    phone: '+256 779 889 012',
    email: 'abim.oilseeds@gmail.com',
    memberCount: 185,
    maleMembers: 80,
    femaleMembers: 105,
    primaryCrops: ['Sunflower', 'Sorghum', 'Melia Trees'],
    linkedProjects: ['proj-seed-02', 'proj-tree-03'],
    machineryAssigned: ['Seed Planter Unit', 'Digital Moisture Meter'],
    status: 'Active',
    registeredDate: '2025-01-20'
  },
  {
    id: 'coop-005',
    name: 'Karenga Green Growers Farmer Group',
    district: 'Karenga',
    subcounty: 'Karenga Sub-county / Sangar',
    contactPerson: 'Lokiru Moses',
    phone: '+256 788 123 456',
    email: 'karenga.growers@gmail.com',
    memberCount: 160,
    maleMembers: 75,
    femaleMembers: 85,
    primaryCrops: ['Sorghum', 'Sunflower', 'Grevillea'],
    linkedProjects: ['proj-tree-03', 'proj-gap-04'],
    machineryAssigned: ['Nursery Shade Net System', 'Manual Seed Sorter'],
    status: 'Active',
    registeredDate: '2025-04-10'
  },
  {
    id: 'coop-006',
    name: 'Lira Central Smallholders Cooperative Union',
    district: 'Lira',
    subcounty: 'Erute North / Adekokwok',
    contactPerson: 'Ogwang Richard',
    phone: '+256 774 556 789',
    email: 'lira.centralcoop@gmail.com',
    memberCount: 520,
    maleMembers: 240,
    femaleMembers: 280,
    primaryCrops: ['Maize', 'Sunflower', 'Soybeans', 'Beans'],
    linkedProjects: ['proj-a2i-01', 'proj-seed-02', 'proj-gap-04'],
    machineryAssigned: ['Heavy-Duty Maize Sheller (JF-MS-01)', 'Multi-Crop Thresher', '2x Moisture Meters'],
    status: 'Active',
    registeredDate: '2023-08-15'
  },
  {
    id: 'coop-007',
    name: 'Kole Organic Farmers Cooperative Society',
    district: 'Kole',
    subcounty: 'Bala / Ayer',
    contactPerson: 'Adongo Joyce',
    phone: '+256 783 778 990',
    email: 'kole.organic@gmail.com',
    memberCount: 310,
    maleMembers: 140,
    femaleMembers: 170,
    primaryCrops: ['Soybeans', 'Sunflower', 'Maize'],
    linkedProjects: ['proj-a2i-01', 'proj-seed-02'],
    machineryAssigned: ['Multi-Crop Thresher', 'Solar Drying Rack'],
    status: 'Active',
    registeredDate: '2024-09-02'
  }
];

const DEFAULT_MACHINERY = [
  { id: 'mac-001', code: 'JF-TH-01', name: 'Multi-Crop High-Capacity Thresher', type: 'Thresher', serialNumber: 'TH-2026-UG-014', assignedCoopId: 'coop-001', assignedCoopName: 'Pader Sunflower Growers Cooperative', projectId: 'proj-a2i-01', projectName: 'Access to Innovation (A2I)', status: 'Operational', maintenanceDate: '2026-08-10', condition: 'Excellent' },
  { id: 'mac-002', code: 'JF-MS-01', name: 'Motorized Cyclone Maize Sheller (5T/Hr)', type: 'Sheller', serialNumber: 'MS-2026-UG-088', assignedCoopId: 'coop-006', assignedCoopName: 'Lira Central Smallholders Cooperative', projectId: 'proj-a2i-01', projectName: 'Access to Innovation (A2I)', status: 'Operational', maintenanceDate: '2026-08-25', condition: 'Good' },
  { id: 'mac-003', code: 'JF-MM-01', name: 'Digital Grain Moisture Meter (Unimeter Digital)', type: 'Moisture Meter', serialNumber: 'MM-2026-042', assignedCoopId: 'coop-001', assignedCoopName: 'Pader Sunflower Growers Cooperative', projectId: 'proj-gap-04', projectName: 'Good Agronomic Practices (GAP)', status: 'Operational', maintenanceDate: '2026-07-30', condition: 'Calibrated' },
  { id: 'mac-004', code: 'JF-SR-01', name: 'Commercial Raised Solar Drying Rack (20m x 4m)', type: 'Solar Dryer', serialNumber: 'SR-2026-003', assignedCoopId: 'coop-003', assignedCoopName: 'Kitgum Mixed Farming Cooperative', projectId: 'proj-a2i-01', projectName: 'Access to Innovation (A2I)', status: 'Operational', maintenanceDate: '2026-06-15', condition: 'Excellent' },
  { id: 'mac-005', code: 'JF-TR-01', name: 'Walking Two-Wheel Tractor & Tiller Unit', type: 'Tractor', serialNumber: 'TR-2026-009', assignedCoopId: 'coop-002', assignedCoopName: 'Agago Grain Producers SACCO', projectId: 'proj-a2i-01', projectName: 'Access to Innovation (A2I)', status: 'Operational', maintenanceDate: '2026-08-01', condition: 'Good' }
];

const DEFAULT_FINANCE = [
  { id: 'fin-001', type: 'Income', category: 'Offtake Sales', description: 'Bulk Maize Flour supply to World Vision / Schools', amount: 48500000, date: '2026-08-15', department: 'Operations', reference: 'INV-2026-084', status: 'Completed' },
  { id: 'fin-002', type: 'Expense', category: 'Farmer Payouts', description: 'Disbursement for Grade-A Sunflower Deliveries (Cohort 1)', amount: 32400000, date: '2026-08-18', department: 'Finance', reference: 'PAY-SUN-019', status: 'Completed' },
  { id: 'fin-003', type: 'Income', category: 'Grant / Project Tranche', description: 'A2I Project Cohort 1 Danish Support Tranche', amount: 110000000, date: '2026-07-05', department: 'Projects', reference: 'GRT-A2I-01', status: 'Completed' },
  { id: 'fin-004', type: 'Expense', category: 'Input Subsidy', description: 'SeedCo Hybrid Sunflower seed procurement subsidy matching', amount: 28000000, date: '2026-07-22', department: 'Finance', reference: 'SUB-SEED-04', status: 'Completed' },
  { id: 'fin-005', type: 'Expense', category: 'Logistics & Fuel', description: 'Produce evacuation transit fleet diesel & maintenance for 7 districts', amount: 8600000, date: '2026-08-28', department: 'Logistics', reference: 'LOG-FLEET-08', status: 'Completed' }
];

const DEFAULT_NURSERIES = [
  { id: 'nur-pader', district: 'Pader', location: 'Pader Town Council / Lapul Nursery Hub', supervisor: 'Eunice Akot', totalTarget: 40000, currentStock: 32500, distributed: 18400, species: [{ name: 'Melia Volkensii', count: 12000 }, { name: 'Hass Avocado', count: 8500 }, { name: 'Grafted Mangoes', count: 6000 }, { name: 'Teak', count: 6000 }], status: 'Active' },
  { id: 'nur-agago', district: 'Agago', location: 'Kalongo Agroforestry Centre', supervisor: 'Francis Otim', totalTarget: 35000, currentStock: 28000, distributed: 14200, species: [{ name: 'Grevillea Robusta', count: 10000 }, { name: 'Melia Volkensii', count: 9000 }, { name: 'Citrus / Orange', count: 5000 }, { name: 'Moringa', count: 4000 }], status: 'Active' },
  { id: 'nur-kitgum', district: 'Kitgum', location: 'Kitgum Matidi Environmental Centre', supervisor: 'Brenda Aber', totalTarget: 45000, currentStock: 38200, distributed: 22000, species: [{ name: 'Teak Wood', count: 15000 }, { name: 'Melia Volkensii', count: 12000 }, { name: 'Hass Avocado', count: 6200 }, { name: 'Moringa', count: 5000 }], status: 'Active' },
  { id: 'nur-abim', district: 'Abim', location: 'Morulem Afforestation Hub', supervisor: 'Walter Okumu', totalTarget: 30000, currentStock: 24000, distributed: 11500, species: [{ name: 'Melia Volkensii', count: 11000 }, { name: 'Grevillea', count: 7000 }, { name: 'Grafted Mangoes', count: 6000 }], status: 'Active' },
  { id: 'nur-karenga', district: 'Karenga', location: 'Karenga Valley Nursery Site', supervisor: 'Patrick Ocen', totalTarget: 25000, currentStock: 19800, distributed: 9200, species: [{ name: 'Acacia Senegal', count: 8000 }, { name: 'Melia Volkensii', count: 6800 }, { name: 'Moringa Oleifera', count: 5000 }], status: 'Active' },
  { id: 'nur-lira', district: 'Lira', location: 'Lira Central Environmental Nursery (Railway Road)', supervisor: 'Grace Auma', totalTarget: 50000, currentStock: 46000, distributed: 29000, species: [{ name: 'Hass Avocado', count: 18000 }, { name: 'Melia Volkensii', count: 14000 }, { name: 'Grevillea', count: 8000 }, { name: 'Eucalyptus Grandis', count: 6000 }], status: 'Active' },
  { id: 'nur-kole', district: 'Kole', location: 'Bala Sub-county Agro Nursery', supervisor: 'Harriet Adongo', totalTarget: 30000, currentStock: 26500, distributed: 13800, species: [{ name: 'Hass Avocado', count: 10500 }, { name: 'Melia Volkensii', count: 9000 }, { name: 'Citrus', count: 7000 }], status: 'Active' }
];

const DEFAULT_FORM_SUBMISSIONS = [
  {
    id: 'sub-001',
    formName: 'Farmer Profiling & Crop Registration Survey',
    formType: 'Farmer Profiling',
    fullName: 'Oola Samuel',
    phone: '+256 774 123 999',
    district: 'Pader',
    subcounty: 'Lapul Sub-county',
    village: 'Oporot Village',
    cooperativeName: 'Pader Sunflower Growers Cooperative',
    cropSpecialization: 'Sunflower & Maize',
    acreage: '6.5 acres',
    seedRequirement: '12 kg LG 56.58 Sunflower Seed',
    machineryNeeds: 'Threshing service at harvest',
    submittedAt: '2026-09-02T14:32:00.000Z',
    status: 'Pending Review',
    notes: 'Requires seed delivery by next week.'
  },
  {
    id: 'sub-002',
    formName: 'Cooperative Needs & A2I Machinery Survey',
    formType: 'Cooperative Assessment',
    fullName: 'Akello Christine (Chairperson)',
    phone: '+256 782 555 444',
    district: 'Agago',
    subcounty: 'Patongo',
    village: 'Alerek Center',
    cooperativeName: 'Patongo Sunflower & Grains Farmers Group',
    cropSpecialization: 'Sunflower & Soya',
    acreage: '45 acres total group',
    seedRequirement: '80 kg Hybrid seeds',
    machineryNeeds: 'Multi-crop thresher & moisture testing meter',
    submittedAt: '2026-09-03T09:15:00.000Z',
    status: 'Reviewed',
    notes: 'Qualified for A2I Cohort 2 machinery allocation.'
  }
];

const DEFAULT_SOCIALS = {
  whatsapp: { enabled: true, handle: '+256 773 623 196', url: 'https://wa.me/256773623196', title: 'WhatsApp Business', subtitle: 'Direct Chat & Agro Input Inquiries', greeting: 'Hello Jeroma Farmers, I would like to inquire about input subsidies, crop collection, and prices.' },
  facebook: { enabled: true, handle: '@jeromafarmers', url: 'https://www.facebook.com/jeromafarmers', title: 'Facebook Page', subtitle: 'Jeroma Farmers Collection Centre Ltd' },
  tiktok: { enabled: true, handle: '@jeromafarmers', url: 'https://www.tiktok.com/@jeromafarmers', title: 'TikTok Channel', subtitle: 'Farmer Training & Field Operations' },
  x: { enabled: true, handle: '@JeromaFarmers', url: 'https://x.com/JeromaFarmers', title: 'X (Twitter)', subtitle: 'Real-time Bulletins & Commodity Updates' },
  youtube: { enabled: true, handle: '@jeromafarmers', url: 'https://www.youtube.com/@jeromafarmers', title: 'YouTube Channel', subtitle: 'Farmer Testimonials & Machinery Field Operations' },
  linkedin: { enabled: true, handle: 'jeromafarmers', url: 'https://www.linkedin.com/company/jeromafarmers', title: 'LinkedIn', subtitle: 'Corporate & Institutional Partnerships' },
  instagram: { enabled: true, handle: '@jeromafarmers', url: 'https://www.instagram.com/jeromafarmers', title: 'Instagram', subtitle: 'Farm Photography & Community Highlights' },
  telegram: { enabled: false, handle: '@jeromafarmers', url: 'https://t.me/jeromafarmers', title: 'Telegram Community', subtitle: 'Broadcasts & Cooperative Alerts' }
};

// Persistent state in memory across serverless invocations (if warm)
let dbState = loadDb() || {
  crops: { ...DEFAULT_CROPS },
  users: [...DEFAULT_USERS],
  deliveries: [...DEFAULT_DELIVERIES],
  dispatches: [...DEFAULT_DISPATCHES],
  inquiries: [...DEFAULT_INQUIRIES],
  translations: null,
  slides: [...DEFAULT_SLIDES],
  manual: [...DEFAULT_MANUAL],
  projects: [...DEFAULT_PROJECTS],
  staff: [...DEFAULT_STAFF],
  cooperatives: [...DEFAULT_COOPERATIVES],
  machinery: [...DEFAULT_MACHINERY],
  finance: [...DEFAULT_FINANCE],
  nurseries: [...DEFAULT_NURSERIES],
  formSubmissions: [...DEFAULT_FORM_SUBMISSIONS],
  socials: { ...DEFAULT_SOCIALS },
  logins: []
};

if (!dbState.projects) dbState.projects = [...DEFAULT_PROJECTS];
if (!dbState.staff) dbState.staff = [...DEFAULT_STAFF];
if (!dbState.cooperatives) dbState.cooperatives = [...DEFAULT_COOPERATIVES];
if (!dbState.machinery) dbState.machinery = [...DEFAULT_MACHINERY];
if (!dbState.finance) dbState.finance = [...DEFAULT_FINANCE];
if (!dbState.nurseries) dbState.nurseries = [...DEFAULT_NURSERIES];
if (!dbState.formSubmissions) dbState.formSubmissions = [...DEFAULT_FORM_SUBMISSIONS];
if (!dbState.socials) dbState.socials = { ...DEFAULT_SOCIALS };

if (!dbState.slides) {
  dbState.slides = [...DEFAULT_SLIDES];
}
if (dbState.slides && Array.isArray(dbState.slides)) {
  const hasA2I = dbState.slides.some(s => s.id === 'partnership_a2i');
  if (!hasA2I) {
    const a2iSlide = DEFAULT_SLIDES.find(s => s.id === 'partnership_a2i');
    if (a2iSlide) {
      dbState.slides.push(a2iSlide);
      saveDb();
    }
  } else {
    const a2iSlide = dbState.slides.find(s => s.id === 'partnership_a2i');
    if (a2iSlide && a2iSlide.tag_en !== 'Implementation') {
      const freshSlide = DEFAULT_SLIDES.find(s => s.id === 'partnership_a2i');
      if (freshSlide) {
        Object.assign(a2iSlide, freshSlide);
        saveDb();
      }
    }
  }
  const hasA2iVid = dbState.slides.some(s => s.id === 'video_a2i_lira');
  if (!hasA2iVid) {
    const s1 = DEFAULT_SLIDES.find(s => s.id === 'video_a2i_lira');
    if (s1) {
      dbState.slides.push(s1);
      saveDb();
    }
  }
  const hasWormVid = dbState.slides.some(s => s.id === 'video_fallarmy_worm');
  if (!hasWormVid) {
    const s2 = DEFAULT_SLIDES.find(s => s.id === 'video_fallarmy_worm');
    if (s2) {
      dbState.slides.push(s2);
      saveDb();
    }
  }
}

if (dbState.projects && Array.isArray(dbState.projects)) {
  const a2iProj = dbState.projects.find(p => p.id === 'proj-a2i-01');
  if (a2iProj && (a2iProj.status !== 'Implementation' || !a2iProj.objectives.includes('commercial partner banks'))) {
    const freshProj = DEFAULT_PROJECTS.find(p => p.id === 'proj-a2i-01');
    if (freshProj) {
      Object.assign(a2iProj, freshProj);
      saveDb();
    }
  }
}
if (!dbState.manual) {
  dbState.manual = [...DEFAULT_MANUAL];
}
if (!dbState.logins) {
  dbState.logins = [];
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
  
  getLogins: async () => dbState.logins || [],
  addLogin: async (login) => {
    if (!dbState.logins) dbState.logins = [];
    const newLogin = {
      id: 'login-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      ...login
    };
    dbState.logins.unshift(newLogin);
    if (dbState.logins.length > 1000) dbState.logins = dbState.logins.slice(0, 1000);
    saveDb();
    return newLogin;
  },

  getCrops: async () => dbState.crops,
  saveCrops: async (crops) => {
    dbState.crops = crops;
    saveDb();
    return dbState.crops;
  },

  getUsers: async () => dbState.users,
  registerUser: async (user, role = 'client') => {
    const targetUser = (user.username || '').toLowerCase();
    const existing = dbState.users.find(u => (u.username || '').toLowerCase() === targetUser);
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
    const target = (username || '').toLowerCase();
    const idx = dbState.users.findIndex(u => (u.username || '').toLowerCase() === target);
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
    const target = (username || '').toLowerCase();
    const originalLength = dbState.users.length;
    dbState.users = dbState.users.filter(u => (u.username || '').toLowerCase() !== target);
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
  updateDispatch: async (id, updatedFields) => {
    const idx = dbState.dispatches.findIndex(d => d.id === id);
    if (idx !== -1) {
      dbState.dispatches[idx] = { ...dbState.dispatches[idx], ...updatedFields };
      saveDb();
      return dbState.dispatches[idx];
    }
    return null;
  },
  deleteDispatch: async (id) => {
    const idx = dbState.dispatches.findIndex(d => d.id === id);
    if (idx !== -1) {
      dbState.dispatches.splice(idx, 1);
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
  replyToInquiry: async (id, reply) => {
    const idx = dbState.inquiries.findIndex(i => i.id === id);
    if (idx !== -1) {
      dbState.inquiries[idx].reply = reply;
      dbState.inquiries[idx].status = 'Replied';
      saveDb();
      return true;
    }
    return false;
  },
  replyToDispatch: async (id, reply) => {
    const idx = dbState.dispatches.findIndex(d => d.id === id);
    if (idx !== -1) {
      dbState.dispatches[idx].reply = reply;
      saveDb();
      return true;
    }
    return false;
  },
  // ── Universal Projects Management ──────────────────────────────────────
  getProjects: async () => dbState.projects || [],
  saveProject: async (project) => {
    if (!dbState.projects) dbState.projects = [];
    if (!project.id) {
      project.id = 'proj-' + Date.now();
    }
    const idx = dbState.projects.findIndex(p => p.id === project.id);
    if (idx !== -1) {
      dbState.projects[idx] = { ...dbState.projects[idx], ...project, updatedAt: new Date().toISOString() };
    } else {
      dbState.projects.unshift({ ...project, createdAt: new Date().toISOString() });
    }
    saveDb();
    return project;
  },
  deleteProject: async (id) => {
    if (!dbState.projects) return false;
    const initialLen = dbState.projects.length;
    dbState.projects = dbState.projects.filter(p => p.id !== id);
    if (dbState.projects.length !== initialLen) {
      saveDb();
      return true;
    }
    return false;
  },

  // ── Staff & Positions HR Management ─────────────────────────────────────
  getStaff: async () => dbState.staff || [],
  saveStaff: async (staffMember) => {
    if (!dbState.staff) dbState.staff = [];
    if (!staffMember.id) {
      staffMember.id = 'stf-' + Date.now();
    }
    const idx = dbState.staff.findIndex(s => s.id === staffMember.id);
    if (idx !== -1) {
      dbState.staff[idx] = { ...dbState.staff[idx], ...staffMember, updatedAt: new Date().toISOString() };
    } else {
      dbState.staff.unshift({ ...staffMember, createdAt: new Date().toISOString() });
    }
    saveDb();
    return staffMember;
  },
  deleteStaff: async (id) => {
    if (!dbState.staff) return false;
    const initialLen = dbState.staff.length;
    dbState.staff = dbState.staff.filter(s => s.id !== id);
    if (dbState.staff.length !== initialLen) {
      saveDb();
      return true;
    }
    return false;
  },

  // ── Cooperatives & SACCOs Directory ─────────────────────────────────────
  getCooperatives: async () => dbState.cooperatives || [],
  saveCooperative: async (coop) => {
    if (!dbState.cooperatives) dbState.cooperatives = [];
    if (!coop.id) {
      coop.id = 'coop-' + Date.now();
    }
    const idx = dbState.cooperatives.findIndex(c => c.id === coop.id);
    if (idx !== -1) {
      dbState.cooperatives[idx] = { ...dbState.cooperatives[idx], ...coop, updatedAt: new Date().toISOString() };
    } else {
      dbState.cooperatives.unshift({ ...coop, createdAt: new Date().toISOString() });
    }
    saveDb();
    return coop;
  },
  deleteCooperative: async (id) => {
    if (!dbState.cooperatives) return false;
    const initialLen = dbState.cooperatives.length;
    dbState.cooperatives = dbState.cooperatives.filter(c => c.id !== id);
    if (dbState.cooperatives.length !== initialLen) {
      saveDb();
      return true;
    }
    return false;
  },

  // ── Machinery & Technology Allocation ──────────────────────────────────
  getMachinery: async () => dbState.machinery || [],
  saveMachinery: async (machine) => {
    if (!dbState.machinery) dbState.machinery = [];
    if (!machine.id) {
      machine.id = 'mac-' + Date.now();
    }
    const idx = dbState.machinery.findIndex(m => m.id === machine.id);
    if (idx !== -1) {
      dbState.machinery[idx] = { ...dbState.machinery[idx], ...machine, updatedAt: new Date().toISOString() };
    } else {
      dbState.machinery.unshift({ ...machine, createdAt: new Date().toISOString() });
    }
    saveDb();
    return machine;
  },
  deleteMachinery: async (id) => {
    if (!dbState.machinery) return false;
    const initialLen = dbState.machinery.length;
    dbState.machinery = dbState.machinery.filter(m => m.id !== id);
    if (dbState.machinery.length !== initialLen) {
      saveDb();
      return true;
    }
    return false;
  },

  // ── Department Operations: Finance & Ledger ─────────────────────────────
  getFinance: async () => dbState.finance || [],
  saveFinanceRecord: async (record) => {
    if (!dbState.finance) dbState.finance = [];
    if (!record.id) {
      record.id = 'fin-' + Date.now();
    }
    const idx = dbState.finance.findIndex(f => f.id === record.id);
    if (idx !== -1) {
      dbState.finance[idx] = { ...dbState.finance[idx], ...record, updatedAt: new Date().toISOString() };
    } else {
      dbState.finance.unshift({ ...record, createdAt: new Date().toISOString() });
    }
    saveDb();
    return record;
  },
  deleteFinanceRecord: async (id) => {
    if (!dbState.finance) return false;
    const initialLen = dbState.finance.length;
    dbState.finance = dbState.finance.filter(f => f.id !== id);
    if (dbState.finance.length !== initialLen) {
      saveDb();
      return true;
    }
    return false;
  },

  // ── Department Operations: 7-District Tree Nurseries ─────────────────────
  getNurseries: async () => dbState.nurseries || [],
  saveNursery: async (nursery) => {
    if (!dbState.nurseries) dbState.nurseries = [];
    if (!nursery.id) {
      nursery.id = 'nur-' + Date.now();
    }
    const idx = dbState.nurseries.findIndex(n => n.id === nursery.id);
    if (idx !== -1) {
      dbState.nurseries[idx] = { ...dbState.nurseries[idx], ...nursery, updatedAt: new Date().toISOString() };
    } else {
      dbState.nurseries.push({ ...nursery, createdAt: new Date().toISOString() });
    }
    saveDb();
    return nursery;
  },
  deleteNursery: async (id) => {
    if (!dbState.nurseries) return false;
    const initialLen = dbState.nurseries.length;
    dbState.nurseries = dbState.nurseries.filter(n => n.id !== id);
    if (dbState.nurseries.length !== initialLen) {
      saveDb();
      return true;
    }
    return false;
  },

  // ── Google Forms & External Surveys Live Ingestion ───────────────────────
  getFormSubmissions: async () => dbState.formSubmissions || [],
  submitFormResponse: async (submission) => {
    if (!dbState.formSubmissions) dbState.formSubmissions = [];
    const newSubmission = {
      id: 'sub-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      submittedAt: new Date().toISOString(),
      status: 'New',
      ...submission
    };
    dbState.formSubmissions.unshift(newSubmission);
    if (dbState.formSubmissions.length > 5000) {
      dbState.formSubmissions = dbState.formSubmissions.slice(0, 5000);
    }
    saveDb();
    return newSubmission;
  },
  deleteFormSubmission: async (id) => {
    if (!dbState.formSubmissions) return false;
    const initialLen = dbState.formSubmissions.length;
    dbState.formSubmissions = dbState.formSubmissions.filter(s => s.id !== id);
    if (dbState.formSubmissions.length !== initialLen) {
      saveDb();
      return true;
    }
    return false;
  },

  getSocials: async () => {
    return dbState.socials || { ...DEFAULT_SOCIALS };
  },
  updateSocials: async (socialsData) => {
    if (!socialsData || typeof socialsData !== 'object') return dbState.socials;
    dbState.socials = {
      ...DEFAULT_SOCIALS,
      ...(dbState.socials || {}),
      ...socialsData
    };
    saveDb();
    return dbState.socials;
  },

  restoreBackup: async (backup) => {
    if (backup.crops) dbState.crops = backup.crops;
    if (backup.users && Array.isArray(backup.users)) {
      const existingUsernames = new Set(dbState.users.map(u => u.username.toLowerCase()));
      backup.users.forEach(u => {
        if (!existingUsernames.has(u.username.toLowerCase())) {
          dbState.users.push(u);
        }
      });
    }
    if (backup.deliveries && Array.isArray(backup.deliveries)) {
      const existingIds = new Set(dbState.deliveries.map(d => d.id));
      backup.deliveries.forEach(d => {
        if (!existingIds.has(d.id)) {
          dbState.deliveries.push(d);
        }
      });
    }
    if (backup.dispatches && Array.isArray(backup.dispatches)) {
      const existingIds = new Set(dbState.dispatches.map(d => d.id));
      backup.dispatches.forEach(d => {
        if (!existingIds.has(d.id)) {
          dbState.dispatches.push(d);
        }
      });
    }
    if (backup.inquiries && Array.isArray(backup.inquiries)) {
      const existingIds = new Set(dbState.inquiries.map(i => i.id));
      backup.inquiries.forEach(i => {
        if (!existingIds.has(i.id)) {
          dbState.inquiries.push(i);
        }
      });
    }
    if (backup.translations) dbState.translations = backup.translations;
    if (backup.manual && Array.isArray(backup.manual)) dbState.manual = backup.manual;
    if (backup.slides && Array.isArray(backup.slides)) dbState.slides = backup.slides;
    if (backup.projects && Array.isArray(backup.projects)) dbState.projects = backup.projects;
    if (backup.staff && Array.isArray(backup.staff)) dbState.staff = backup.staff;
    if (backup.cooperatives && Array.isArray(backup.cooperatives)) dbState.cooperatives = backup.cooperatives;
    if (backup.machinery && Array.isArray(backup.machinery)) dbState.machinery = backup.machinery;
    if (backup.finance && Array.isArray(backup.finance)) dbState.finance = backup.finance;
    if (backup.nurseries && Array.isArray(backup.nurseries)) dbState.nurseries = backup.nurseries;
    if (backup.formSubmissions && Array.isArray(backup.formSubmissions)) dbState.formSubmissions = backup.formSubmissions;
    if (backup.socials) dbState.socials = { ...DEFAULT_SOCIALS, ...backup.socials };
    if (backup.settings) dbState.settings = backup.settings;
    
    saveDb();
    return true;
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
      projects: [...DEFAULT_PROJECTS],
      staff: [...DEFAULT_STAFF],
      cooperatives: [...DEFAULT_COOPERATIVES],
      machinery: [...DEFAULT_MACHINERY],
      finance: [...DEFAULT_FINANCE],
      nurseries: [...DEFAULT_NURSERIES],
      formSubmissions: [...DEFAULT_FORM_SUBMISSIONS],
      socials: { ...DEFAULT_SOCIALS },
      alerts: [],
      logins: [],
      settings: { hideManual: false }
    };
    saveDb();
  }
};
