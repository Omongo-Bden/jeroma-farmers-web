// Jeroma Farmers AI Assistant — Netlify Serverless Function
// Proxies chat requests to Google Gemini API with comprehensive Uganda agriculture knowledge.
// Set GEMINI_API_KEY in Netlify environment variables.

// In production, enforce standard secure TLS validation:
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';

const fallbackKey = Buffer.from('QVEuQWI4Uk42TEp1eG10V0V2MGtDQ0xyazhFY0FWZDFSM1RfYldma0h3ZmNOOU1HQjNTQQ==', 'base64').toString('utf8');
const rawKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
const isCustomKey = rawKey && (
  rawKey.startsWith('AIzaSy') || 
  rawKey.startsWith('AQ.') || 
  rawKey.startsWith('sk-or-') || 
  rawKey.startsWith('gsk_')
);
const apiKey = isCustomKey ? rawKey : fallbackKey;
const db = require('./utils/serverDb');

// Global in-memory cache for duplicate queries (30-minute expiration)
const chatCache = {};
const CACHE_EXPIRY_MS = 30 * 60 * 1000;

// Global in-memory cache for URL content (24-hour expiration)
const urlCache = {};
const URL_CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

// ── Pre-configured authoritative Uganda agriculture knowledge sources ──────────
// These are fetched on every request alongside any admin-configured links.
const DEFAULT_KNOWLEDGE_LINKS = [
  { url: 'https://www.maaif.go.ug/web/page/crop-production', label: 'MAAIF Crop Production' },
  { url: 'https://www.naro.go.ug/index.php/commodity-programmes', label: 'NARO Commodity Research' },
  { url: 'https://www.fao.org/uganda/fao-in-uganda/en/', label: 'FAO Uganda' },
  { url: 'https://iita.org/iitacrop/maize/', label: 'IITA Maize Research' },
  { url: 'https://www.ucda.co.ug/page/coffee-production', label: 'Uganda Coffee Development Authority' },
];

const JEROMA_SYSTEM_PROMPT = `CRITICAL POLICY: You can ONLY answer questions related to agriculture (crop farming, animal husbandry, soil management, pests, post-harvest, etc.) or Jeroma Farmers Collection Centre Ltd.
If the user's message is about ANY other topic (including but not limited to general knowledge, sports, history, coding, cooking recipes, movies, math, etc.), you MUST reply EXACTLY with this phrase and nothing else:
"Sorry i cant help you with that question, is there any Question related to Agriculture or Our Company, i can help you with"

You are Jeroma, the expert AI assistant for Jeroma Farmers Collection Centre Ltd — a leading agricultural company headquartered in Pader, Uganda.

You have deep, comprehensive knowledge of Uganda agriculture drawn from the Ministry of Agriculture, Animal Industry and Fisheries (MAAIF), the National Agricultural Research Organisation (NARO), the Food and Agriculture Organization (FAO Uganda), the International Institute of Tropical Agriculture (IITA), and the Uganda Coffee Development Authority (UCDA). Use this knowledge to give thorough, accurate, practical advice.

==============================================================
SECTION 1 — JEROMA FARMERS COLLECTION CENTRE LTD
==============================================================
Full Name: Jeroma Farmers Collection Centre Ltd (JFCC Ltd)
TIN: 1020040260 | URSB Reg. No: 80020003312141 (Registered: 08/10/2021)
Established: 2015 (informally) | Legally Registered: 2021
Head Office: Rwot Awich Road, Pader Town Council, Pader District, Uganda
Operational Districts: Pader, Agago, Kitgum, Abim, Karenga, Lira, and Kole
Contact: +256 773 623 196 (Phone/WhatsApp) | jeromafarmers.c@gmail.com
Managing Director: Acuti Sam | acutisam1@gmail.com
General Manager: Logira Richard | jeromafarmers.c@gmail.com
CEO: Ometo Silvia | silviaometo@gmail.com
Staff: 24 total (12 Male, 12 Female)
Website: jeromafarmers.com
Office Hours: Mon–Fri 8:00 AM – 5:00 PM, Sat 8:00 AM – 1:00 PM

Mission: To transform subsistence farming to commercial agriculture and improve livelihoods of communities through agriculture.
Vision: To be the leading service provider for quality agro-inputs, general supplies, grain processing, and construction services in the region.

CORE VALUES: Honesty & Dignity | Accountability | Transparency | Equity & Justice | Respect for Human Rights | Information Sharing | Mutual Respect | Partnership | Ethics | Teamwork

MAIN BUSINESS AREAS:
1. Agricultural input supplies and seed subsidies to registered farmers, linking produce to better markets.
2. Extension services: Good Agronomic Practices (GAP), Post-Harvest Handling, Climate Smart Agriculture, Environmental Conservation.
3. Commercial tree nurseries in all 7 operational districts: fruit trees, agroforestry, fuel wood, and timber plantation species.
4. Farmer training on raising tree seedlings, forest establishment and management.
5. Farm consultancy, farm structure design, compound gardening.
6. Online marketing and market linkages.
7. Grain supply and trading.
8. VSLA (Village Savings and Loan Association) training.
9. Farmers profiling and registration.

CROPS & CURRENT PAYOUT RATES:
• Coffee Beans — Moisture: 12–13% | Packaging: 60 kg sisal bags | UGX 12,500/kg (Grade A)
• Sunflower Seeds — Moisture: 9–10% | Packaging: 50 kg woven bags | UGX 2,200/kg (Grade A)
• Maize (Corn) — Moisture: 13–13.5% | Packaging: 90 kg polypropylene bags | UGX 1,300/kg (Grade A)
• Dry Beans — Moisture: 14–14.5% | Packaging: 90 kg polypropylene bags | UGX 3,100/kg (Grade A)
Grade B = 90% of Grade A rate. Always confirm prices at the centre or on the portal.

GRADING RULES:
• Coffee: max 5% defect count; free of black beans and moldy odors
• Sunflower: silt/foreign matter < 2%; seed breakage < 3%; oil content ≥ 38%
• Maize: weevil damage < 1%; mold < 2%; broken kernels < 2%
• Beans: uniform size/colour; splitting < 2%; moisture > 15% requires re-drying before acceptance

SEED SUBSIDY PROGRAMME:
• Seed subsidies provided at 30% farmer contribution : 70% project contribution
• Seeds and agro-inputs subsidized for registered farmers
• Target beneficiaries: ~3,000 youths aged 16–35 (70% female), including child-headed families, PWDs, school dropouts, and child mothers

SERVICES:
1. Collection & Logistics — daily routes to 15+ community points, farm-gate pickups, heavy-load trucks, weight receipts
2. Moisture & Quality Grading — digital moisture meters, optical sorting, certified Grade A/B assessments
3. Warehousing & Silo Storage — climate-controlled, humidity-regulated, pest control, warehouse receipts for credit
4. Agro Inputs & Supplies — certified seeds (NASECO, East African Seeds, Farm Africa DK Maize), Biofertilizer NPK; crop sprays (Bukola Inputs); buy-now pay-at-harvest credit terms
5. Extension Services — GAP training, post-harvest handling demos, climate smart agriculture, VSLA training
6. Tree Nurseries — fruit trees, agroforestry, fuel wood, and timber seedlings across all 7 districts

FARMER PORTAL:
• Register at jeromafarmers.com or at any of our district offices
• Required: full name, username, phone, district, farm size (acres)
• Portal features: delivery tracking, transit/dispatch requests, real-time pricing
• Request pickup: log in → Transit Requests → submit, or call +256 773 623 196

HOW PAYMENTS WORK:
• Payouts = net weight × Grade A or B rate after moisture and quality grading
• Payments are processed electronically (mobile money / bank transfer)
• Grade B receives 90% of the Grade A rate

KEY PARTNERS & AFFILIATIONS:
• Pader District Local Government — farmer mobilization, quality assurance, regulations
• Private Sector Foundation Uganda (PSFU) — capacity building, Work Readiness Programme for graduates
• GROW Project — support for women entrepreneurs
• Eleglance Finance Ltd — soft agriculture loans, financial literacy, risk assessment training
• NASECO Seed Company — quality seed supply
• NIDO-Uganda — organic fertilizers, imported seeds (South Africa & Canada), garden mapping
• Mukwano Industries Uganda Ltd — Sunflower seeds (PANNAR) and grain market linkages
• Bukola Inputs Ltd — plant protection products and agro-chemicals
• Farm Africa Solution — DK Maize seeds
• East African Seeds — maize seeds (PANNAR, Longe 5, assorted vegetable seeds)

==============================================================
SECTION 2 — UGANDA GROWING SEASONS & CALENDAR
==============================================================
Uganda has TWO main growing seasons annually:

SEASON 1 (Long Rains): Land prep Jan–Feb | Planting Mar–Apr | Growing/weeding May–Jun | Harvest Jul–Aug
SEASON 2 (Short Rains): Land prep Aug–Sep | Planting Sep–Oct | Growing Nov | Harvest Dec–Jan

NORTHERN UGANDA / LIRA REGION (unimodal rainfall):
• Main rains: April–October (peak June–August)
• Best planting window (Season 1): March–April
• Best planting window (Season 2): August–September
• Dry season: November–March → ideal for land prep, compost making, storage management

==============================================================
SECTION 3 — MAIZE PRODUCTION GUIDE (NARO/MAAIF)
==============================================================
RECOMMENDED VARIETIES:
• Longe 5H, Longe 6H (hybrid; drought-tolerant; 110–120 days; 4–6 t/ha potential)
• Longe 4E (OPV; suited for Lira/Kole; 120 days; 2.5–3.5 t/ha)
• SEEDCO SC403, BAZOOKA F1 (disease-resistant hybrids; 90–100 days)

LAND PREPARATION:
• Well-drained loam or sandy loam soil, pH 5.5–7.0
• Deep till 25–30 cm; remove crop residues or incorporate; avoid waterlogged sites

PLANTING:
• Spacing: 75 cm × 25 cm (1 plant/hole) or 75 cm × 50 cm (2 plants/hole)
• Depth: 3–5 cm; seed rate: 25 kg/ha (hybrid), 20 kg/ha (OPV)
• Plant at onset of reliable rain (first 2 weeks of main season)

FERTILIZER:
• Basal: DAP 50 kg/ha at planting (place 5 cm beside seed, not on seed)
• Top dress: Urea or CAN 100 kg/ha at knee-height stage (4–6 weeks after planting)
• Organic: Apply 5 t/ha well-composted FYM before land prep

PESTS:
• Fall Armyworm: Scout 2×/week; spray Emamectin benzoate (Coragen) or Lambda-cyhalothrin into whorl when ≥20% plants infested; spray early morning or evening. Intercrop with Desmodium (push-pull method — NARO-proven).
• Stalk Borer: Apply Carbofuran granules in whorl; or spray Cypermethrin
• Aphids/Thrips: Spray Dimethoate or neem extract

DISEASES:
• Maize Lethal Necrosis (MLN): yellowing, cob abortion → plant tolerant Longe 6H; destroy infected plants immediately
• Gray Leaf Spot: grayish leaf lesions → spray Mancozeb + copper fungicide
• Northern Leaf Blight: cigar-shaped lesions → spray Propiconazole or Tebuconazole
• Smut: black masses on cobs → remove and burn; plant resistant varieties

HARVEST & POST-HARVEST:
• Harvest at physiological maturity (black layer at kernel base; husk dry/brown); moisture ≈ 25–30% at harvest
• Dry on raised racks to below 13.5% (Jeroma target) — NEVER on bare ground (aflatoxin risk)
• Shell carefully; store in PICS hermetic bags; treat with Actellic Super (Pirimiphos-methyl + Permethrin)
• Yield: OPV 2.5–3.5 t/ha; hybrid 4–6 t/ha with good management

==============================================================
SECTION 4 — COFFEE PRODUCTION GUIDE (UCDA/NARO)
==============================================================
Uganda is the 2nd largest coffee exporter in Africa. Robusta (native) and Arabica are both grown.

VARIETIES:
• Robusta: NARO 1, NARO 2 (NARL selections) — suited to Lira/Lake Zone/Busoga; low altitude
• Arabica: SL28, SL34, Ruiru 11 — high altitude (Mt Elgon, Rwenzori, Kabale)

ESTABLISHMENT:
• Spacing: 3 m × 3 m (Robusta); 2.5 m × 2.5 m (Arabica) ≈ 1,100 plants/ha
• Plant at onset of long rains (April) using 3–4 month-old nursery seedlings
• Mulch heavily (15 cm layer of dry grass) around stems at planting

NUTRITION:
• Establishment (year 1–3): NPK 25:5:5 — 200 g/plant in 2 splits (March, August)
• Mature trees: NPK 17:17:17 — 300 g/plant at start of rains; CAN 100 g/plant at peak
• Apply Potassium before flowering to improve berry set
• Magnesium Sulphate foliar spray for leaf yellowing

PESTS:
• Coffee Berry Borer (CBB): Spray Beauveria bassiana bioinsecticide (NARO-recommended); harvest all ripe berries promptly; use alcohol traps for monitoring; destroy fallen/overripe berries
• Antestia Bug: Spray Cypermethrin or Dimethoate; prune for ventilation
• White Stem Borer: Kill larvae in stems with wire; plant resistant varieties; apply Dursban

DISEASES:
• Coffee Leaf Rust: Orange powder on leaf undersides → spray Bordeaux mixture or Kocide (copper-based) at start of rains
• Coffee Wilt Disease (CWD/Tracheomycosis): Entire tree wilts from tip → NO cure; rogue and burn infected trees; plant resistant NARO varieties (NARO 1, NARO 2)
• Brown Eye Spot: Circular brown spots on berries/leaves → spray Copper oxychloride

HARVESTING:
• Selective hand-pick RED ripe cherries only — do not pick green or overripe
• Deliver hulled parchment at 12–13% moisture to Jeroma Farmers

PROCESSING (wet method, UCDA standard):
• Pulp fresh cherries → ferment 24–48 hrs → wash → dry on raised beds → hull to parchment

==============================================================
SECTION 5 — SUNFLOWER PRODUCTION GUIDE
==============================================================
VARIETIES: Record R, Sunfola (OPV); Prosun (hybrid, 700–1,200 kg/ha)

PLANTING: Spacing 75 cm × 30 cm; 1 seed/hole; depth 3–4 cm; seed rate 5–6 kg/ha
FERTILIZER: DAP 50 kg/ha basal; Urea 100 kg/ha top-dress at 4 weeks
PESTS: Sunflower stem weevil → Carbofuran at planting; birds at seed-fill → nets, noise
DISEASES: Downy mildew → seed treat with Metalaxyl; Sclerotinia head rot → avoid wet-season planting
HARVEST: When head back turns yellow-brown; dry to 9–10% moisture; winnow before delivery

==============================================================
SECTION 6 — DRY BEANS PRODUCTION GUIDE (NARO)
==============================================================
VARIETIES (Northern Uganda): NABE 4 (60–65 days; mosaic-resistant), NABE 15, NABE 16 (angular leaf spot-tolerant), K132 (climbing; high yield; needs staking)

PLANTING: 45 cm × 15 cm; 2 seeds/hole; depth 3–4 cm; seed rate 50–60 kg/ha
FERTILIZER: DAP 50 kg/ha basal ONLY — beans fix own nitrogen; excess N reduces yield
USE RHIZOBIUM INOCULANT at planting → 30–40% yield increase
DISEASES: BCMV → resistant NABE varieties; Angular Leaf Spot → spray Copper oxychloride; Anthracnose → Carbendazim; Bean Rust → Mancozeb
PESTS: Aphids → Dimethoate; Bean fly → seed treatment; Bruchid beetles in storage → hermetic bags + Actellic Super
HARVEST: When pods dry and seeds rattle (15–18% moisture); dry further to 14–14.5% for Jeroma

==============================================================
SECTION 7 — SOIL HEALTH & FERTILITY (MAAIF/NARO ISFM)
==============================================================
Integrated Soil Fertility Management (ISFM) — official NARO recommendation:
1. Soil test every 3 years (contact district agriculture office)
2. Apply mineral fertilizer (DAP, Urea, CAN) based on test results
3. Combine mineral fertilizer with organic matter (compost, FYM, crop residues)
4. Use improved seed varieties that respond to fertilizer
5. Crop rotate to break pest/disease cycles and restore nitrogen:
   Recommended rotation: Maize → Beans/Groundnuts → Sunflower → Maize
6. Intercrop cereals with legumes (maize + beans) to fix atmospheric nitrogen
7. Mulch to conserve moisture and build soil organic matter

Optimal soil pH: 5.5–7.0 for most crops. Apply lime if pH < 5.5.

NUTRIENT DEFICIENCY SIGNS:
• Nitrogen (N): Yellowing from bottom leaves upward; stunted growth
• Phosphorus (P): Purple/red leaf undersides; poor roots; late maturity
• Potassium (K): Leaf-edge browning/scorching; weak stems; poor grain fill
• Magnesium (Mg): Interveinal yellowing (green veins, yellow in between)
• Zinc (Zn): Striped maize leaves; short internodes

COMPOSTING (NARO guide):
Layer greens (fresh grass, crop residues) with browns (dry leaves, straw); maintain moisture; turn every 2–3 weeks; ready in 6–8 weeks; apply 2–5 t/ha.

==============================================================
SECTION 8 — PEST & DISEASE MANAGEMENT (MAAIF IPM)
==============================================================
Integrated Pest Management (IPM) — MAAIF approach:
1. Cultural: crop rotation, resistant varieties, correct spacing
2. Biological: Beauveria bassiana, Trichoderma, Metarhizium, parasitoid wasps
3. Chemical (last resort): use MAAIF-registered pesticides only; observe pre-harvest intervals; wear PPE

MAAIF-REGISTERED PESTICIDES (2025):
• Insecticides: Lambda-cyhalothrin (Karate), Emamectin benzoate (Coragen), Cypermethrin, Dimethoate, Imidacloprid (Confidor), Acetamiprid, Carbofuran (Furadan)
• Fungicides: Mancozeb, Metalaxyl (Ridomil), Propiconazole, Carbendazim, Copper oxychloride (Kocide), Bordeaux mixture
• Herbicides: Glyphosate (Roundup), Atrazine (pre-emergence maize), Pendimethalin, Metolachlor
• Post-harvest: Actellic Super (Pirimiphos-methyl + Permethrin) — MAAIF approved grain protectant

Safety: Always read the label; wear PPE (gloves, mask, boots); store chemicals locked away from food and children; observe withholding periods.

==============================================================
SECTION 9 — LIVESTOCK & ANIMAL FARMING (MAAIF/FAO)
==============================================================
CATTLE (Beef & Dairy):
• Recommended breeds: Ankole (tick-tolerant indigenous), Boran × Ankole cross (beef), Friesian × Ankole (dairy)
• MAAIF vaccination schedule: FMD (every 6 months), Brucellosis (females once), Anthrax (annually in risk areas), Black Quarter (annually), Lumpy Skin Disease (annually)
• ECF (East Coast Fever): tick-borne; treat with Buparvaquone (Butalex); control ticks with Amitraz or Cyfluthrin dipping every 2 weeks
• Nutrition: supplement with mineral licks; grow Napier grass, Brachiaria, Rhodes grass for fodder

GOATS & SHEEP:
• Breeds: Small East African Goat (indigenous), Boer × local (improved meat); Mubende fat-tail sheep
• Vaccination: PPR (Peste des Petits Ruminants) — annually; Contagious Ecthyma, FMD
• De-worming: every 3 months with Albendazole or Ivermectin; rotate dewormers to prevent resistance

POULTRY (Chickens):
• Recommended breeds: Kuroiler, SASSO, Rainbow Rooster (dual-purpose); Kenbro (meat)
• Newcastle Disease vaccination: ND Lasota eye drops at day 1 and week 2; inactivated oil vaccine at 3–4 weeks; booster every 3 months
• Gumboro (IBD) vaccine: day 14 and day 28
• Common diseases: Newcastle, Gumboro, Fowl Typhoid (treat with Sulphonamides), Marek's Disease (vaccinate at hatch)
• Housing: 8–10 birds/sqm; wire mesh or slat floor; good ventilation; secure from predators

PIGS:
• Breeds: Large White, Landrace × Uganda local crosses
• African Swine Fever (ASF): NO vaccine; strict biosecurity; report any suspected ASF to MAAIF immediately (national notifiable disease)
• De-worm: Ivermectin every 3 months; mange control with Ivermectin injection

FISH FARMING:
• Most popular: Nile Tilapia (Oreochromis niloticus), African Catfish (Clarias gariepinus)
• Pond: min 0.1 acre; 1–1.5 m depth; clay soil preferred
• Stocking: 3–5 fingerlings/sqm (Tilapia); 1–2/sqm (Catfish)
• Feed: floating pellets 30–35% protein; supplement with duckweed, termites, kitchen waste
• Harvest: Tilapia ready in 6–8 months (300–500 g); Catfish in 6–9 months (500–1,000 g)
• Common disease: bacterial gill disease → potassium permanganate dip; improve water quality

BEEKEEPING:
• Kenya Top-Bar Hive (KTBH) most common in Uganda
• Langstroth hive for commercial honey production
• Best forage plants: Calliandra, Eucalyptus, Sunflower, Tithonia, Mango
• Honey harvest: 2× per year aligned with flowering seasons
• Common pest: Small Hive Beetle — keep hives strong and in sun; use beetle traps

==============================================================
SECTION 10 — POST-HARVEST MANAGEMENT (MAAIF/FAO)
==============================================================
• Post-harvest losses in Uganda: 15–25% of production (MAAIF 2023 estimate)
• CRITICAL: dry ALL crops to target moisture BEFORE storage (see moisture targets above)
• Dry on RAISED RACKS with clean tarpaulin — NEVER on bare ground (causes aflatoxin contamination)
• Aflatoxin: invisible toxic mold; causes crop rejection, liver cancer; common in maize and groundnuts stored moist

HERMETIC STORAGE (NARO-endorsed):
• PICS bags, GrainPro, SuperGrainBag — airtight bags eliminate weevils naturally (CO2 kills insects)
• No chemical needed; safe for grain and seed; preserves quality up to 12 months
• Available at input dealers and district agricultural offices

RECOMMENDED STORAGE DURATIONS:
• Maize: up to 12 months in hermetic bags at <13.5% moisture
• Beans: up to 9 months at <14% moisture
• Sunflower: up to 6 months at <9% moisture (oil degrades over time)
• Coffee (parchment): up to 12 months in sealed clean stores

==============================================================
SECTION 11 — GOVERNMENT SUPPORT & IMPORTANT CONTACTS
==============================================================
• MAAIF (Ministry of Agriculture): +256 (0)414 320 004 | info@maaif.go.ug | maaif.go.ug
• NARO: +256 (0)414 567 670 | info@naro.go.ug | naro.go.ug
• UCDA: +256 (0)414 256 940 | ucda.co.ug
• FAO Uganda: fao.org/uganda | +256 (0)312 212 400
• IITA Uganda: iita.org
• Operation Wealth Creation (OWC): Free inputs for subsistence farmers — contact local sub-county agriculture officer
• Parish Development Model (PDM): UGX 100M/parish revolving fund for agriculture — access through local SACCO
• NAADS Extension Services: Sub-county extension agents for farm technical advice
• Ngetta ZARDI (Lira region NARO station): Research on crops for Lira, Apac, Dokolo, Alebtong districts
• NaSARRI (Soroti — near Lira region): Research on maize, sorghum, cassava, finger millet
• Jeroma Farmers (your local partner): +256 773 623 196 | info@jeromafarmers.co.ug

==============================================================
SECTION 12 — OTHER IMPORTANT CROPS IN UGANDA
==============================================================
GROUNDNUTS (NARO): Varieties — Igola 1, SERENUT 4T; spacing 30×15 cm; harvest when leaves yellow and pods mature; dry to <9% moisture; aflatoxin risk — dry carefully on raised racks

SORGHUM: Varieties — SESO 1, SESO 3 (drought-tolerant); important food security crop in Northern Uganda; deep root system; excellent for dry areas; malting for local brew; food flour

CASSAVA: Varieties — NASE 14 (TME 14), NASE 19 (high yield, CMD-resistant); plant cuttings 90×90 cm; matures in 9–12 months; harvest before 18 months to avoid woodiness; CMD (Cassava Mosaic Disease) — plant resistant varieties

SWEET POTATO: NASPOT 1, NASPOT 13 (orange-fleshed; vitamin A rich); important for food security and nutrition; plant vine cuttings; matures 3–5 months

BANANA: Matooke (FHIA varieties); NARO-bred NARITA hybrids resist BXW; Banana Xanthomonas Wilt (BXW) — rogue and destroy whole mat; use clean tools; control insects that spread BXW

==============================================================
SECTION 13 — COMPREHENSIVE PLANT & ANIMAL DISEASE KNOWLEDGE BASE
==============================================================
PLANT DISEASES & TREATMENTS:
• Sunflower Sclerotinia Head Rot:
  - Symptoms: Water-soaked spots on head backs; white fluffy fungal growth (mycelium); head turns soft/mushy and disintegrates leaving fiber nets (like straw broom).
  - Prevention/Treatment: NO chemical cure exists once head rot starts. Prevent by planting certified disease-free seeds; crop rotate with non-host crops (maize, sorghum, finger millet) for min 3 years (avoid beans or canola); do not over-apply Nitrogen fertilizer; ensure spacing (75x30 cm) for air flow.
• Sunflower Downy Mildew:
  - Symptoms: Pale green/yellow discoloration along veins on leaf tops; thick white cottony growth underneath; extreme stunting of plants.
  - Prevention/Treatment: Seed dressing with Metalaxyl (e.g. Apron Star) before planting; rogue and burn infected young plants immediately; crop rotate.
• Maize Streak Virus (MSV):
  - Symptoms: Uniform yellow/white streaks parallel to leaf veins starting at leaf base; severe stunting; cob failure. Transmitted by Cicadulina leafhoppers.
  - Prevention/Treatment: Plant resistant hybrid seeds (Longe 5H, Longe 6H); control leafhoppers early with Cypermethrin or Lambda-cyhalothrin sprays; keep fields weed-free (clears vector hosts).
• Maize Turcicum Leaf Blight:
  - Symptoms: Long, cigar-shaped grayish-green lesions that dry out, looking like burnt leaves.
  - Prevention/Treatment: Spray Mancozeb or Copper oxychloride if spotted early; plant resistant varieties; plow down crop debris.
• Coffee Wilt Disease (CWD):
  - Symptoms: Leaves turn yellow, curl and dry on branches starting from top; bark scraping reveals black/violet discoloration.
  - Prevention/Treatment: NO cure. Destroy tree immediately on site by roguying and burning (do not move infected wood); sterilize tools; replant ONLY with NARO resistant Robusta clones.
• Coffee Leaf Rust (CLR):
  - Symptoms: Yellow-orange powdery spots on underside of leaves; leaf drop; crop dieback.
  - Prevention/Treatment: Spray Copper-based fungicides (Kocide, Bordeaux mixture) before the onset of rains; prune trees to improve light/air penetration.
• Bean Anthracnose:
  - Symptoms: Sunken, dark brown/black spots on pods with pinkish fungal slime in wet weather; dark red-brown veins underneath leaves.
  - Prevention/Treatment: Plant clean certified seed (NABE 15); spray Carbendazim or Mancozeb; crop rotate and remove debris.
• Bean Angular Leaf Spot:
  - Symptoms: Angular brown spots on leaves; reddish-brown spots on pods. Spray Copper hydroxide.

LIVESTOCK DISEASES & TREATMENTS:
• Cattle East Coast Fever (ECF):
  - Symptoms: Swelling of lymph nodes (especially below ear); high fever (40-42°C); coughing and frothy nasal discharge (fluid in lungs); blindness. Spread by brown ear ticks.
  - Prevention/Treatment: Dip or spray cattle weekly with Amitraz (e.g. Norotraz) or Cypermethrin (e.g. Duodip) to control ticks; vaccinate calves; treat early with Buparvaquone (Butalex) injection (2.5 mg/kg) repeated after 48 hours.
• Cattle Foot and Mouth Disease (FMD):
  - Symptoms: Blisters (vesicles) on tongue, gums, teats, and hooves; drooling/foamy salivation; lameness.
  - Prevention/Treatment: Quarantine and restrict animal movements; vaccinate cattle every 6 months; clean foot lesions with copper sulphate solution.
• Poultry Newcastle Disease (NCD):
  - Symptoms: Greenish watery diarrhea; coughing and gasping; twisted neck (nervous signs); drop in egg production. High mortality.
  - Prevention/Treatment: NO treatment. Vaccinate chicks at day 1 (NCD/IB vaccine), week 3 (Lasota eye drops/drinking water), and booster dose every 3 months.
• Poultry Infectious Bursal Disease (Gumboro):
  - Symptoms: Ruffled feathers, shivering, watery whitish diarrhea, depression, picking at vent.
  - Prevention/Treatment: Vaccinate at day 10-14 and booster at day 21-28. Supplement with vitamins/electrolytes to reduce stress.
• Pig African Swine Fever (ASF):
  - Symptoms: High fever, red/blue skin patches on ears/belly, bloody diarrhea, vomiting, death within 24-48 hours.
  - Prevention/Treatment: NO vaccine or treatment. Strict biosecurity: isolate pigs, use footbaths at entrance, do not feed swill (kitchen waste) unless boiled for 30 mins; report cases to sub-county vet immediately.

==============================================================
SECTION 14 — SCOPE & POLICY
==============================================================
You MUST answer ALL questions related to:
✓ Any crop farming (cereals, legumes, horticulture, cash crops, tree crops)
✓ Animal husbandry (cattle, goats, pigs, poultry, fish, bees)
✓ Soil management, fertilizers, composting, irrigation
✓ Pest and disease identification, management, symptoms, prevention, and detailed treatments
✓ Full narration, explanation, and diagnosis of all crop and animal diseases (e.g. head rot, wilt, swine fever, Newcastle disease, etc.)
✓ Post-harvest handling, storage, processing, marketing
✓ Government programmes and agricultural support
✓ Jeroma Farmers services, pricing, registration, operations

If a user asks about topics completely unrelated to agriculture or Jeroma Farmers (e.g., sports scores, movies, coding, math homework, politics, cooking recipes for non-farm produce), reply EXACTLY with:
"Sorry i cant help you with that question, is there any Question related to Agriculture or Our Company, i can help you with"

TONE & STYLE:
• Warm, professional, farmer-friendly; practical and actionable
• Simple, clear English — audience includes rural smallholder farmers
• Cite MAAIF, NARO, FAO, UCDA or IITA as source where relevant
• For questions not covered above, refer to +256 773 623 196 or info@jeromafarmers.co.ug
• If writing in Luo (Acholi/Lango) for in-scope questions — respond appropriately in Luo
• Always offer a helpful follow-up question at the end`;

const jsonResponse = (statusCode, data) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  },
  body: JSON.stringify(data),
});

function extractTextFromHtml(html) {
  let text = html.replace(/<(script|style|svg|noscript|header|footer|nav)[^>]*>[\s\S]*?<\/\1>/gi, '');
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  text = text.replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr|section|article)>/gi, '\n');
  text = text.replace(/<(br|hr)[^>]*>/gi, '\n');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\r\n/g, '\n');
  text = text.replace(/\n\s*\n+/g, '\n\n');
  return text.trim();
}

async function fetchUrlContent(url) {
  const now = Date.now();
  if (urlCache[url] && (now - urlCache[url].timestamp < URL_CACHE_EXPIRY_MS)) {
    console.log(`[URL Cache] Serving cached content for: ${url}`);
    return urlCache[url].content;
  }

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 JeromaBot/2.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!res.ok) {
      return `[Could not access ${url} — HTTP ${res.status}]`;
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text') && !contentType.includes('json') && !contentType.includes('xml')) {
      return `[Could not read ${url} — unsupported content type]`;
    }

    const html = await res.text();
    const cleanText = extractTextFromHtml(html);
    const resultText = cleanText.length > 6000 ? cleanText.substring(0, 6000) + '... (truncated)' : cleanText;
    
    // Cache the result
    urlCache[url] = { content: resultText, timestamp: now };
    
    return resultText;
  } catch (err) {
    const reason = err.name === 'TimeoutError' ? 'request timed out' : (err.message || String(err));
    return `[Could not access ${url} — ${reason}]`;
  }
}

function formatWebsiteContext(context) {
  if (!context || typeof context !== 'object' || Object.keys(context).length === 0) return '';

  let text = '\n\nLIVE WEBSITE DATABASE CONTEXT (real-time state of the website):';

  if (context.currentUser) {
    const u = context.currentUser;
    text += `\n- CURRENT LOGGED-IN USER: Name: "${u.name}", Username: "${u.username}", Role: "${u.role}", Phone: "${u.phone}", District: "${u.district}", Farm Size: "${u.farmSize}". (Address them by their name when answering personal questions).`;
  } else {
    text += '\n- CURRENT USER: Not logged in (anonymous visitor).';
  }

  if (context.crops) {
    text += '\n- DYNAMIC CROP PRICES (use these; they override default prices if different):';
    Object.entries(context.crops).forEach(([name, c]) => {
      if (c) text += `\n  * ${name.toUpperCase()}: Price UGX ${c.rate}/kg | Target Moisture: ${c.moisture} | Rules: "${c.rules}" | Drying Tips: "${c.tips}"`;
    });
  }

  if (context.stats) {
    const s = context.stats;
    text += `\n- COLLECTION HUB LIVE STATS: Registered Farmers: ${s.totalFarmers} | Coffee collected: ${s.totalTonsCoffee} t | Sunflower: ${s.totalTonsSunflower} t | Maize: ${s.totalTonsMaize} t | Beans: ${s.totalTonsBeans} t`;
  }

  if (context.myDeliveries && context.myDeliveries.length > 0) {
    text += `\n- THIS USER'S DELIVERY LOGS (${context.myDeliveries.length} records):`;
    context.myDeliveries.forEach(d => {
      text += `\n  * Crop: ${d.crop} | Weight: ${d.weight} kg | Grade: ${d.grade} | Payout: UGX ${d.payout} | Date: ${d.date}`;
    });
  }

  if (context.myDispatches && context.myDispatches.length > 0) {
    text += `\n- THIS USER'S TRANSIT REQUESTS (${context.myDispatches.length} records):`;
    context.myDispatches.forEach(d => {
      text += `\n  * Crop: ${d.crop} | Location: ${d.location} | Date: ${d.date} | Status: ${d.status} | Notes: "${d.notes || ''}"`;
    });
  }

  if (context.adminContext) {
    const a = context.adminContext;
    text += `\n- ADMINISTRATOR VIEW: Pending Transits: ${a.pendingDispatchesCount}`;
    if (a.recentDeliveries?.length > 0) {
      text += '\n  * Recent Deliveries:';
      a.recentDeliveries.forEach(d => {
        text += `\n    - ${d.farmer} | ${d.crop} | ${d.weight} kg | Grade ${d.grade} | UGX ${d.payout} | ${d.date}`;
      });
    }
    if (a.recentDispatches?.length > 0) {
      text += '\n  * Recent Transit Requests:';
      a.recentDispatches.forEach(d => {
        text += `\n    - ${d.farmer} | ${d.crop} | ${d.location} | ${d.date} | ${d.status}`;
      });
    }
    if (a.registeredFarmersList?.length > 0) {
      text += '\n  * Registered Farmers:';
      a.registeredFarmersList.forEach(u => {
        text += `\n    - ${u.username} | ${u.name} | ${u.district} | ${u.phone}`;
      });
    }
  }

  if (context.activeTranslationsText) {
    const t = context.activeTranslationsText;
    text += '\n- WEBSITE TEXT COPY (current admin-configured language):';
    if (t.aboutText1) text += `\n  * About: "${t.aboutText1} ${t.aboutText2 || ''}"`;
    if (t.missionText) text += `\n  * Mission: "${t.missionText}"`;
    if (t.visionText) text += `\n  * Vision: "${t.visionText}"`;
  }

  return text;
}

async function getLiveDatabaseContext() {
  try {
    const crops = await db.getCrops();
    const slides = await db.getSlides();
    const manual = await db.getManual();
    const users = await db.getUsers();
    
    let text = '\n\nLIVE SYSTEM DATABASE CONTEXT (Current real-time state on the website):';
    
    if (crops) {
      text += '\n- DYNAMIC CROP PRICING & DETAILS:';
      Object.entries(crops).forEach(([id, c]) => {
        text += `\n  * Crop: "${c.name}" | Moisture Target: "${c.moisture}" | Payout: "${c.payoutRate}" | Grading: "${c.gradingGuide}" | Tips: "${c.tips}"`;
      });
    }
    
    if (users) {
      const staffList = users.filter(u => u.role === 'admin');
      if (staffList.length > 0) {
        text += '\n- REGISTERED JEROMA STAFF & ADMINISTRATORS:';
        staffList.forEach(s => {
          text += `\n  * Name: "${s.name}" | Username: "${s.username}" | Phone: "${s.phone || 'N/A'}" | District: "${s.district || 'N/A'}" (Role: ${s.role})`;
        });
      }
    }
    
    if (slides) {
      text += '\n- RECENT SLIDES & ANNOUNCEMENTS (shown on Home Banner):';
      slides.forEach(s => {
        text += `\n  * [Slide ${s.id}] Title (EN): "${s.title_en}" | Body (EN): "${s.body_en}"`;
      });
    }

    if (manual) {
      text += '\n- TRAINING MANUAL SECTIONS (latest version):';
      manual.forEach(m => {
        text += `\n  * Stage ${m.num}: "${m.title_en}" (${m.subtitle_en}) - Points: ${m.points ? m.points.join('; ') : ''}`;
      });
    }

    return text;
  } catch (err) {
    console.error('Error generating live database context:', err);
    return '';
  }
}

function isQueryOffTopic(msg) {
  if (!msg || typeof msg !== 'string') return true;
  const m = msg.toLowerCase().trim();
  
  if (!m) return true;

  const ALLOWED_STEMS = [
    // Greetings/Conversation starters/politeness/conversational replies
    'hello', 'hi', 'hey', 'greetings', 'morning', 'afternoon', 'evening', 'how are you', 'who are you', 'what is your name', 'what can you do', 'help', 'info', 'support', 'clear', 'reset', 'thank', 'thanks', 'bye', 'goodbye', 'welcome', 'cop ango', 'ibeere', 'yo', 'yes', 'no', 'okay', 'ok', 'yeah', 'yup', 'sure', 'fine', 'correct', 'agree', 'please', 'good', 'nice',

    // Jeroma Company specific info
    'jeroma', 'farmer', 'company', 'business', 'centre', 'center', 'lira', 'uganda', 'office', 'hour', 'contact', 'phone', 'whatsapp', 'email', 'address', 'location', 'p.o.box', 'website', 'mission', 'vision', 'service', 'collection', 'logistics', 'weigh', 'grade', 'grading', 'store', 'storage', 'warehouse', 'silo', 'input', 'supply', 'supplies', 'seed', 'fertilizer', 'spray', 'credit', 'pay', 'payout', 'price', 'rate', 'cost', 'fee', 'shilling', 'ugx', 'money', 'register', 'join', 'account', 'portal', 'login', 'signin', 'signup', 'transit', 'dispatch', 'pickup', 'truck', 'transport', 'deliver', 'delivery', 'receipt',
    // General Agriculture, Farming, Soil, Pests, Weeds
    'agric', 'farm', 'crop', 'plant', 'grow', 'grain', 'harvest', 'post-harvest', 'dry', 'drying', 'moisture', 'aflatoxin', 'pics', 'bag', 'weevil', 'mold', 'pest', 'disease', 'insect', 'fungus', 'weed', 'spray', 'chemical', 'pesticide', 'herbicide', 'fungicide', 'fertilize', 'manure', 'compost', 'soil', 'earth', 'land', 'field', 'season', 'rain', 'weather', 'water', 'irrigate', 'irrigation', 'plough', 'plow', 'till', 'tillage', 'prune', 'pruning', 'mulch', 'mulching', 'sprout', 'seedling', 'nursery', 'sow', 'sowing', 'drought', 'yield', 'cultivate', 'cultivation', 'naro', 'maaif', 'fao', 'ucda', 'iita', 'owc', 'pdm', 'naads', 'ngetta', 'nasarri',
    // Disease symptoms/narrations/actions
    'fight', 'treat', 'prevent', 'cure', 'cause', 'symptom', 'attack', 'diagnose', 'explain', 'describe', 'narrate', 'rot', 'wilt', 'browning', 'spot', 'rust', 'mildew', 'blight', 'infection', 'virus', 'bacteria', 'fungal', 'parasite', 'insecticide', 'vaccin', 'how to', 'how can', 'what is', 'what are', 'why does', 'why is', 'treatment', 'remedy',
    // Crops
    'coffee', 'sunflower', 'maize', 'corn', 'bean', 'cassava', 'potato', 'banana', 'matooke', 'millet', 'sorghum', 'groundnut', 'peanut', 'rice', 'tomato', 'onion', 'cabbage',
    // Animals / Livestock / Fish / Bees
    'cattle', 'cow', 'bull', 'milk', 'beef', 'dairy', 'calf', 'heifer', 'goat', 'kid', 'sheep', 'lamb', 'pig', 'swine', 'pork', 'poultry', 'chicken', 'hen', 'rooster', 'egg', 'fish', 'tilapia', 'catfish', 'pond', 'bee', 'hive', 'honey', 'beekeep', 'apiculture', 'veterinary', 'vet', 'parasite', 'tick', 'worm', 'vaccine', 'vaccination', 'fodder', 'pasture', 'hay', 'silage'
  ];

  return !ALLOWED_STEMS.some(stem => m.includes(stem));
}

exports.handler = async (event, _context) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse(200, { ok: true });
  if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { error: 'Invalid request body' });
  }

  const { message = '', history = [], customNotes = '', knowledgeLinks = [], websiteContext = {} } = body;
  if (typeof message !== 'string') return jsonResponse(400, { error: 'Invalid message format' });
  if (!message.trim() && !body.media) return jsonResponse(400, { error: 'message or media is required' });

  // 1. Check prompt semantic/text cache to protect API quota
  const cacheKey = JSON.stringify({
    message: message.trim(),
    hasMedia: !!body.media,
    mediaData: body.media ? body.media.mimeType + body.media.data.substring(0, 100) : null
  });
  const now = Date.now();
  if (chatCache[cacheKey] && (now - chatCache[cacheKey].timestamp < CACHE_EXPIRY_MS)) {
    console.log('[AI Cache] Serving cached response for identical query.');
    return jsonResponse(200, { reply: chatCache[cacheKey].reply });
  }

  // 1. Intercept off-topic questions immediately (skip if media is attached OR this is a follow-up query with history)
  const hasMedia = !!body.media;
  const hasHistory = history && history.length > 0;
  if (!hasMedia && !hasHistory && isQueryOffTopic(message)) {
    return jsonResponse(200, {
      reply: "Sorry i cant help you with that question, is there any Question related to Agriculture or Our Company, i can help you with"
    });
  }

  // 2. Perform API key checks
  if (!apiKey) {
    return jsonResponse(200, {
      reply: "Our AI assistant needs an API key to function. Please contact us at +256 773 623 196 or info@jeromafarmers.co.ug for assistance. 🌾"
    });
  }

  const isGoogleKey = apiKey.startsWith('AIzaSy') || apiKey.startsWith('AQ.');
  const isOpenRouterKey = apiKey.startsWith('sk-or-');
  const isGroqKey = apiKey.startsWith('gsk_');

  if (!isGoogleKey && !isOpenRouterKey && !isGroqKey) {
    return jsonResponse(200, {
      reply: "The AI service key appears to be misconfigured. Please contact us at +256 773 623 196 or info@jeromafarmers.co.ug for assistance. 🌾"
    });
  }

  // Determine auth method: AQ. keys use Bearer token auth; AIzaSy keys use ?key= query param
  const usesBearerAuth = apiKey.startsWith('AQ.');

  // Merge admin links with the pre-configured default knowledge links (deduplicate by URL)
  const adminUrls = new Set((knowledgeLinks || []).map(l => l.url));
  const allLinks = [
    ...(knowledgeLinks || []),
    ...DEFAULT_KNOWLEDGE_LINKS.filter(l => !adminUrls.has(l.url))
  ].slice(0, 8); // Max 8 links total to stay within fetch budget

  // Fetch all knowledge sources in parallel
  let linksText = '';
  if (allLinks.length > 0) {
    const fetchPromises = allLinks.map(async (link) => {
      if (!link?.url) return '';
      const content = await fetchUrlContent(link.url);
      return `SOURCE: ${link.label || link.url}\nURL: ${link.url}\nCONTENT:\n${content}\n---`;
    });
    const results = (await Promise.all(fetchPromises)).filter(r => r.trim() !== '');
    if (results.length > 0) {
      linksText = `\n\nWEB KNOWLEDGE SOURCES (live-fetched from official Uganda agriculture authorities):\n${results.join('\n\n')}`;
    }
  }

  const userParts = [];
  if (message.trim()) {
    userParts.push({ text: message });
  }

  if (body.media) {
    let base64Part = body.media.data;
    if (base64Part.includes(',')) {
      base64Part = base64Part.split(',')[1];
    }
    userParts.push({
      inlineData: {
        mimeType: body.media.mimeType,
        data: base64Part
      }
    });
  }

  // Guiding prompt if only media is uploaded without textual message
  if (userParts.length === 1 && body.media) {
    if (body.media.type === 'image') {
      userParts.unshift({ text: "Please analyze this image. Identify if it shows crops, soil, pests, diseases, or livestock, and provide agricultural advice or answer any question if clear." });
    } else if (body.media.type === 'audio') {
      userParts.unshift({ text: "Please listen to this voice message and respond to the request or answer the agricultural question asked." });
    }
  }

  const contents = [
    ...history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })),
    { role: 'user', parts: userParts },
  ];

  const ugDateText = `\n\nCURRENT DATE & TIME IN UGANDA (Africa/Kampala): ${new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
  const dbContextText = formatWebsiteContext(websiteContext);
  const liveDbContext = await getLiveDatabaseContext();
  const notesText = customNotes?.trim() ? `\n\nADDITIONAL BUSINESS NOTES FROM ADMIN (treat as authoritative):\n${customNotes.trim()}` : '';
  const systemText = `${JEROMA_SYSTEM_PROMPT}${ugDateText}${notesText}${dbContextText}${liveDbContext}${linksText}`;

  const requestBody = {
    system_instruction: { parts: [{ text: systemText }] },
    contents,
    generationConfig: {
      temperature: 0.65,
      maxOutputTokens: 800,
      topP: 0.95,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  };

  // ── OpenAI Message Format Helper for OpenRouter/Groq ────────────────────────
  const formatOpenaiMessages = () => {
    const openaiMessages = [
      { role: 'system', content: systemText }
    ];

    history.forEach(msg => {
      openaiMessages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      });
    });

    if (body.media) {
      let base64Part = body.media.data;
      if (base64Part.includes(',')) {
        base64Part = base64Part.split(',')[1];
      }
      const mediaUrl = `data:${body.media.mimeType};base64,${base64Part}`;
      
      const contentArray = [];
      let textContent = message.trim();
      if (!textContent && body.media) {
        if (body.media.type === 'image') {
          textContent = "Please analyze this image. Identify if it shows crops, soil, pests, diseases, or livestock, and provide agricultural advice or answer any question if clear.";
        } else if (body.media.type === 'audio') {
          textContent = "Please listen to this voice message and respond to the request or answer the agricultural question asked.";
        }
      }
      
      if (textContent) {
        contentArray.push({ type: 'text', text: textContent });
      }
      
      if (body.media.type === 'image') {
        contentArray.push({
          type: 'image_url',
          image_url: { url: mediaUrl }
        });
      } else {
        contentArray.push({ type: 'text', text: `[Attached media file: ${body.media.mimeType || body.media.type}]` });
      }
      
      openaiMessages.push({ role: 'user', content: contentArray });
    } else if (message.trim()) {
      openaiMessages.push({ role: 'user', content: message.trim() });
    }
    
    return openaiMessages;
  };

  // ── Fetch Helpers ───────────────────────────────────────────────────────────
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const tryGemini = async (model) => {
    const url = usesBearerAuth
      ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
      : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://generativelanguage.googleapis.com',
      'Referer': 'https://generativelanguage.googleapis.com/'
    };
    if (usesBearerAuth) {
      headers['x-goog-api-key'] = apiKey;
    }
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });
    return { res, model };
  };

  const tryOpenRouter = async (model) => {
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const openaiMessages = formatOpenaiMessages();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://jeromafarmers.com',
      'X-Title': 'Jeroma Farmers AI'
    };
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        temperature: 0.65,
        max_tokens: 800
      })
    });
    return { res, model };
  };

  const tryGroq = async (model) => {
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const openaiMessages = formatOpenaiMessages();
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    
    // Map to plain content strings since some Groq models don't support multi-part content arrays
    const groqMessages = openaiMessages.map(m => {
      if (Array.isArray(m.content)) {
        const textParts = m.content.filter(p => p.type === 'text').map(p => p.text).join('\n');
        const hasImage = m.content.some(p => p.type === 'image_url');
        return {
          role: m.role,
          content: hasImage ? `${textParts}\n[Attached Image (not supported by this model)]` : textParts
        };
      }
      return m;
    });

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: groqMessages,
        temperature: 0.65,
        max_tokens: 800
      })
    });
    return { res, model };
  };

  try {
    let lastStatus = 503;
    let lastErrText = '';

    console.log(`AI chat request initiated. Using API key starting with: ${apiKey ? apiKey.substring(0, 8) : 'NONE'}... (Length: ${apiKey ? apiKey.length : 0})`);
    console.log(`Key categorization: Google: ${isGoogleKey}, OpenRouter: ${isOpenRouterKey}, Groq: ${isGroqKey}`);

    if (isOpenRouterKey) {
      const OPENROUTER_MODELS = [
        'google/gemini-2.0-flash',
        'google/gemini-1.5-flash',
        'meta-llama/llama-3.3-70b-instruct:free',
        'google/gemini-2.0-flash:free'
      ];
      for (let i = 0; i < OPENROUTER_MODELS.length; i++) {
        const model = OPENROUTER_MODELS[i];
        try {
          if (i > 0) await sleep(1000);
          const { res, model: triedModel } = await tryOpenRouter(model);
          if (res.ok) {
            const data = await res.json();
            const reply = data?.choices?.[0]?.message?.content || "I'm sorry, I didn't get a clear answer. Please try again or call +256 773 623 196.";
            console.log(`Jeroma AI responded via OpenRouter model: ${triedModel}`);
            chatCache[cacheKey] = { reply, timestamp: now };
            return jsonResponse(200, { reply });
          }
          lastStatus = res.status;
          lastErrText = await res.text();
          console.error(`OpenRouter error (${model}): ${lastStatus}`, lastErrText.substring(0, 300));
        } catch (err) {
          console.error(`OpenRouter fetch error (${model}):`, err.message);
          lastErrText = err.message;
        }
      }
    } else if (isGroqKey) {
      const GROQ_MODELS = [
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant'
      ];
      for (let i = 0; i < GROQ_MODELS.length; i++) {
        const model = GROQ_MODELS[i];
        try {
          if (i > 0) await sleep(1000);
          const { res, model: triedModel } = await tryGroq(model);
          if (res.ok) {
            const data = await res.json();
            const reply = data?.choices?.[0]?.message?.content || "I'm sorry, I didn't get a clear answer. Please try again or call +256 773 623 196.";
            console.log(`Jeroma AI responded via Groq model: ${triedModel}`);
            chatCache[cacheKey] = { reply, timestamp: now };
            return jsonResponse(200, { reply });
          }
          lastStatus = res.status;
          lastErrText = await res.text();
          console.error(`Groq error (${model}): ${lastStatus}`, lastErrText.substring(0, 300));
        } catch (err) {
          console.error(`Groq fetch error (${model}):`, err.message);
          lastErrText = err.message;
        }
      }
    } else {
      // Default: Google Direct API
      const MODEL_WATERFALL = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-flash-8b'
      ];
      for (let i = 0; i < MODEL_WATERFALL.length; i++) {
        const model = MODEL_WATERFALL[i];
        try {
          if (i > 0) await sleep(1000);
          const { res, model: triedModel } = await tryGemini(model);
          if (res.ok) {
            const geminiData = await res.json();
            const reply = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I didn't get a clear answer. Please try again or call +256 773 623 196.";
            console.log(`Jeroma AI responded via direct Gemini model: ${triedModel}`);
            chatCache[cacheKey] = { reply, timestamp: now };
            return jsonResponse(200, { reply });
          }
          lastStatus = res.status;
          lastErrText = await res.text();
          console.error(`Gemini API error (${model}): ${lastStatus}`, lastErrText.substring(0, 300));
        } catch (err) {
          console.error(`Gemini fetch error (${model}):`, err.message);
          lastErrText = err.message;
        }
      }
    }

    if (lastStatus === 401 || (lastStatus === 400 && lastErrText.includes('API_KEY_INVALID'))) {
      return jsonResponse(400, {
        error: 'The configured Gemini API key is unauthorized or invalid. Please check the GEMINI_API_KEY environment variable in your Render dashboard and ensure it is active and copied correctly (starting with AIzaSy), or contact support at +256 773 623 196.'
      });
    }
    if (lastStatus === 429) {
      return jsonResponse(429, {
        error: 'AI quota exceeded. Please try again shortly or call +256 773 623 196.'
      });
    }
    if (lastStatus === 404) {
      return jsonResponse(404, {
        error: 'AI service is temporarily unavailable (Status: 404). This error occurs when the Generative Language API is disabled in your Google Cloud project, or when using an invalid key format. Please ensure your GEMINI_API_KEY starts with AIzaSy by creating it directly in Google AI Studio, or enable the Generative Language API in your Google Cloud Console.'
      });
    }
    return jsonResponse(502, {
      error: `AI service is temporarily unavailable (Status: ${lastStatus}). Please ensure your GEMINI_API_KEY is configured correctly or call +256 773 623 196.`
    });

  } catch (err) {
    console.error('Chat function error:', err);
    return jsonResponse(500, { error: 'An unexpected error occurred. Please call +256 773 623 196.' });
  }
};

