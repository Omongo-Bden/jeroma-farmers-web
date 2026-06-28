import { useState, useRef, useEffect, useCallback } from 'react';

// Quick-reply suggestions — managed by admin via Chatbot Manager
const CHATBOT_CONFIG_KEY = 'jeroma_chatbot_config';
const DEFAULT_CONFIG = {
  enabled: true,
  greeting: "Hello! I'm Jeroma, your Jeroma Farmers AI assistant. I can help you with crop prices, collection services, farmer registration, and more.\n\nHow can I help you today? 🌾",
  quickReplies: [
    "What crops do you collect?",
    "What are current payout rates?",
    "How do I register as a farmer?",
    "How do I request a field pickup?",
    "What inputs are available?",
    "Where is the collection centre?",
  ],
  customNotes: "",
  knowledgeLinks: []
};

function loadConfig() {
  try { return { ...DEFAULT_CONFIG, ...JSON.parse(localStorage.getItem(CHATBOT_CONFIG_KEY)) }; }
  catch { return DEFAULT_CONFIG; }
}

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
};

const getLuoTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Ibeere kibaro! Kop ango?";
  if (hour >= 12 && hour < 17) return "Ibeere kinyero! Kop ango?";
  return "Ibeere kiwuyo! Kop ango?";
};

const getDynamicGreeting = (baseGreeting, language) => {
  if (language === 'luo') {
    const timeGreeting = getLuoTimeGreeting();
    return `${timeGreeting} An a Jeroma, lacul me Jeroma Farmers. Acwoyo pi crop prices, pi tic pa Jeroma, onyo pi ngat mo. Ipenya ngo? 🌾`;
  }
  
  const timeGreeting = getTimeGreeting();
  // If baseGreeting starts with "Hello!" or "Hi!", replace it. Otherwise, prepend.
  if (baseGreeting.startsWith("Hello!")) {
    return baseGreeting.replace(/^Hello!/, `${timeGreeting}!`);
  } else if (baseGreeting.startsWith("Hi!")) {
    return baseGreeting.replace(/^Hi!/, `${timeGreeting}!`);
  } else if (baseGreeting.startsWith("Hello")) {
    return baseGreeting.replace(/^Hello/, timeGreeting);
  } else if (baseGreeting.startsWith("Hi")) {
    return baseGreeting.replace(/^Hi/, timeGreeting);
  } else {
    return `${timeGreeting}! ${baseGreeting}`;
  }
};

const BOT_AVATAR = '🌾';
const USER_AVATAR = '👤';

// Simple local fallback when the API endpoint is not available (dev mode)
const LOCAL_FALLBACK_RESPONSES = {
  crops: "We collect Coffee Beans (UGX 12,500/kg), Sunflower Seeds (UGX 2,200/kg), Maize (UGX 1,300/kg), and Dry Beans (UGX 3,100/kg). All payouts are based on Grade-A quality standards. 🌾",
  payout: "Current payout rates:\n• Coffee Beans — UGX 12,500/kg\n• Sunflower Seeds — UGX 2,200/kg\n• Maize — UGX 1,300/kg\n• Dry Beans — UGX 3,100/kg\n\nGrade-B payouts are 90% of these rates. Prices may vary — check the app or call +256 773 623 196.",
  register: "You can register as a Jeroma Farmer right here on the website! Click 'Join Us' or 'Portal Login' in the navigation bar, then choose the Register tab. You'll need your full name, phone number, district, and farm size. It's free and takes under 2 minutes! ✅",
  pickup: "To request a field pickup, log in to your Farmer Dashboard and go to the Transit Requests tab. You can also call our dispatch hotline at +256 773 623 196. We run daily routes across 15+ collection points.",
  inputs: "Registered farmers can access: SeedCo LG certified seeds, Biofertilizer Africa NPK blends, and crop protective sprays — all at subsidized cooperative prices. We offer buy-now, pay-at-harvest credit terms. Visit our Lira office or call +256 773 623 196.",
  location: "Our main office is located in Lira, Uganda (P.O.Box 330095). Collection hours: Mon–Fri 8:00 AM–5:00 PM, Sat 8:00 AM–1:00 PM. Phone: +256 773 623 196 | Email: info@jeromafarmers.co.ug",
  harvest: "Post-Harvest Handling & Storage Guide:\n• Drying: Dry all grains on raised racks or clean tarpaulins, never on bare soil. This prevents soil-borne diseases and Aflatoxin contamination.\n• Moisture Limits: Dry Maize to <13.5%, Coffee (parchment) to 12-13%, Sunflower to <10%, and Beans to <14.5% before storage.\n• Storage: Store in hermetic PICS or GrainPro bags to control weevils naturally without chemical pesticides. Store bags on wooden pallets in a cool, dry, pest-free warehouse.\n• Aflatoxin Control: Aflatoxin is a highly toxic mold caused by storing grain wet. Proper drying is the key to preventing it and ensuring Grade-A premium payout rates! 🌾",
  soil: "Soil Health & Planting Guide (NARO/MAAIF):\n• Soil Sampling & Testing: Take 10-20 cores from a fields mixture, mix in a bucket, dry, and bring to the district agriculture office for testing before planting.\n• Soil Health: Ideal soil pH is 5.5–7.0. Combine mineral fertilizers (DAP/Urea) with organic manure (FYM) at 2–5 t/ha to build organic matter.\n• Spacing: Maize: 75×25 cm (1 plant/hole); Sunflower: 75×30 cm; Beans: 45×15 cm.\n• Crop Rotation: Maize -> Beans/Groundnuts -> Sunflower -> Maize. Legumes fix nitrogen and break pest cycles.\n• For guidance, visit our Lira office or call +256 773 623 196. 🌾",
  default: "🌾 Our AI service is currently offline. For crop prices, collection services, or any help — call us directly at **+256 773 623 196** or WhatsApp us. We're available Mon–Fri 8 AM–5 PM and Sat 8 AM–1 PM.",
  rejection: "Sorry i cant help you with that question, is there any Question related to Agriculture or Our Company, i can help you with"
};

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

function getLocalFallback(msg) {
  if (isQueryOffTopic(msg)) {
    return LOCAL_FALLBACK_RESPONSES.rejection;
  }
  const m = msg.toLowerCase();
  if (m.includes('crop') || m.includes('collect') || m.includes('coffee') || m.includes('maize') || m.includes('bean') || m.includes('sunflower')) return LOCAL_FALLBACK_RESPONSES.crops;
  if (m.includes('payout') || m.includes('price') || m.includes('rate') || m.includes('pay') || m.includes('ugx') || m.includes('money')) return LOCAL_FALLBACK_RESPONSES.payout;
  if (m.includes('register') || m.includes('join') || m.includes('sign up') || m.includes('account')) return LOCAL_FALLBACK_RESPONSES.register;
  if (m.includes('pickup') || m.includes('transport') || m.includes('dispatch') || m.includes('transit') || m.includes('truck')) return LOCAL_FALLBACK_RESPONSES.pickup;
  if (m.includes('input') || m.includes('seed') || m.includes('fertilizer') || m.includes('supply')) return LOCAL_FALLBACK_RESPONSES.inputs;
  if (m.includes('location') || m.includes('where') || m.includes('address') || m.includes('office') || m.includes('lira')) return LOCAL_FALLBACK_RESPONSES.location;
  if (m.includes('harvest') || m.includes('storage') || m.includes('dry') || m.includes('drying') || m.includes('aflatoxin') || m.includes('pics') || m.includes('grainpro') || m.includes('pest')) return LOCAL_FALLBACK_RESPONSES.harvest;
  if (m.includes('soil') || m.includes('planting') || m.includes('spacing') || m.includes('sampling') || m.includes('fertilize') || m.includes('compost') || m.includes('manure')) return LOCAL_FALLBACK_RESPONSES.soil;
  return LOCAL_FALLBACK_RESPONSES.default;
}

function getWebsiteContext(lang) {
  const context = {
    activeLanguage: lang,
    currentUser: null,
    crops: null,
    stats: {
      totalFarmers: 0,
      totalTonsMaize: 0,
      totalTonsCoffee: 0,
      totalTonsSunflower: 0,
      totalTonsBeans: 0,
    },
    myDeliveries: [],
    myDispatches: [],
    adminContext: null,
    activeTranslationsText: null
  };

  try {
    const cropsStr = localStorage.getItem('jeroma_crops');
    if (cropsStr) context.crops = JSON.parse(cropsStr);

    const userStr = localStorage.getItem('jeroma_logged_user');
    let currentUser = null;
    if (userStr) {
      currentUser = JSON.parse(userStr);
      context.currentUser = {
        username: currentUser.username,
        name: currentUser.name,
        role: currentUser.role,
        phone: currentUser.phone,
        district: currentUser.district,
        farmSize: currentUser.farmSize
      };
    }

    const deliveriesStr = localStorage.getItem('jeroma_deliveries');
    const usersStr = localStorage.getItem('jeroma_users');
    const dispatchesStr = localStorage.getItem('jeroma_dispatches');

    const allDeliveries = deliveriesStr ? JSON.parse(deliveriesStr) : [];
    const allUsers = usersStr ? JSON.parse(usersStr) : [];
    const allDispatches = dispatchesStr ? JSON.parse(dispatchesStr) : [];

    context.stats.totalFarmers = allUsers.filter(u => u.role === 'client').length;
    
    allDeliveries.forEach(d => {
      const w = parseFloat(d.weight) || 0;
      const crop = String(d.crop).toLowerCase();
      if (crop.includes('maize')) context.stats.totalTonsMaize += w / 1000;
      else if (crop.includes('coffee')) context.stats.totalTonsCoffee += w / 1000;
      else if (crop.includes('sunflower')) context.stats.totalTonsSunflower += w / 1000;
      else if (crop.includes('bean')) context.stats.totalTonsBeans += w / 1000;
    });

    context.stats.totalTonsMaize = Math.round(context.stats.totalTonsMaize * 100) / 100;
    context.stats.totalTonsCoffee = Math.round(context.stats.totalTonsCoffee * 100) / 100;
    context.stats.totalTonsSunflower = Math.round(context.stats.totalTonsSunflower * 100) / 100;
    context.stats.totalTonsBeans = Math.round(context.stats.totalTonsBeans * 100) / 100;

    if (currentUser) {
      if (currentUser.role === 'admin') {
        context.adminContext = {
          pendingDispatchesCount: allDispatches.filter(d => d.status === 'pending').length,
          recentDeliveries: allDeliveries.slice(-5).map(d => ({
            farmer: d.farmer, crop: d.crop, weight: d.weight, grade: d.grade, date: d.date, payout: d.payout
          })),
          recentDispatches: allDispatches.slice(-5).map(d => ({
            farmer: d.farmer, crop: d.crop, location: d.location, date: d.date, status: d.status
          })),
          registeredFarmersList: allUsers.filter(u => u.role === 'client').map(u => ({
            username: u.username, name: u.name, district: u.district, phone: u.phone
          }))
        };
      } else {
        context.myDeliveries = allDeliveries
          .filter(d => String(d.farmer).toLowerCase() === currentUser.name.toLowerCase() || String(d.farmer).toLowerCase() === currentUser.username.toLowerCase())
          .map(d => ({ crop: d.crop, weight: d.weight, grade: d.grade, payout: d.payout, date: d.date }));
        
        context.myDispatches = allDispatches
          .filter(d => String(d.farmer).toLowerCase() === currentUser.name.toLowerCase() || String(d.farmer).toLowerCase() === currentUser.username.toLowerCase())
          .map(d => ({ crop: d.crop, location: d.location, date: d.date, status: d.status, notes: d.notes }));
      }
    }

    const translationsStr = localStorage.getItem('jeroma_translations');
    if (translationsStr) {
      const transObj = JSON.parse(translationsStr);
      const activeTrans = transObj[lang] || {};
      context.activeTranslationsText = {
        aboutText1: activeTrans.aboutText1,
        aboutText2: activeTrans.aboutText2,
        missionText: activeTrans.missionText,
        visionText: activeTrans.visionText,
        serviceLogisticsDesc: activeTrans.serviceLogisticsDesc,
        serviceGradingDesc: activeTrans.serviceGradingDesc,
        serviceStorageDesc: activeTrans.serviceStorageDesc,
        serviceInputsDesc: activeTrans.serviceInputsDesc,
      };
    }
  } catch (err) {
    console.error('Error gathering website context:', err);
  }

  return context;
}

// ── Multimodal Helpers ──────────────────────────────────────────────────────────

/** Convert a File or Blob to a base64 data URL string */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Get human-readable file size */
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Max file size: 4 MB (Gemini inline limit is ~20MB but we keep it practical for mobile) */
const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav'];

// ── Sub-Components ──────────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="chat-message bot" style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '12px' }}>
      <div className="chat-avatar bot-avatar">{BOT_AVATAR}</div>
      <div className="chat-bubble bot-bubble typing-bubble">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

function ChatMessage({ msg }) {
  const isBot = msg.role === 'assistant';
  return (
    <div className={`chat-message ${isBot ? 'bot' : 'user'}`}
      style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '12px',
        flexDirection: isBot ? 'row' : 'row-reverse' }}>
      <div className={`chat-avatar ${isBot ? 'bot-avatar' : 'user-avatar'}`}>
        {isBot ? BOT_AVATAR : USER_AVATAR}
      </div>
      <div className={`chat-bubble ${isBot ? 'bot-bubble' : 'user-bubble'}`}
        style={{ whiteSpace: 'pre-wrap' }}>
        {/* Show attached media thumbnail if present */}
        {msg.attachment && (
          <div style={{ marginBottom: '8px' }}>
            {msg.attachment.type === 'image' && (
              <img
                src={msg.attachment.preview}
                alt="Attached"
                style={{
                  maxWidth: '100%', maxHeight: '160px', borderRadius: '8px',
                  objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)'
                }}
              />
            )}
            {msg.attachment.type === 'audio' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(82,183,136,0.12)', borderRadius: '8px',
                padding: '8px 12px', fontSize: '0.78rem'
              }}>
                <span style={{ fontSize: '1.1rem' }}>🎙️</span>
                <span>Voice message ({msg.attachment.duration || 'audio'})</span>
              </div>
            )}
          </div>
        )}
        {msg.content}
        <span className="chat-timestamp">
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

/** Inline SVG icons for the media toolbar */
const MediaIcons = {
  Mic: ({ size = 18, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="9" y="1" width="6" height="11" rx="3" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  MicOff: ({ size = 18, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="9" y="1" width="6" height="11" rx="3" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  Camera: ({ size = 18, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  Paperclip: ({ size = 18, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  ),
  X: ({ size = 14, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Stop: ({ size = 16, ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  ),
};

// ── Main ChatBot Component ──────────────────────────────────────────────────────

export default function ChatBot({ lang }) {
  const [config, setConfig] = useState(loadConfig);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [unread, setUnread] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  // ── Multimodal State ──
  const [attachment, setAttachment] = useState(null); // { type: 'image'|'audio', file, preview, name, size }
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showCameraModal, setShowCameraModal] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const fileInputRef = useRef(null);

  // Re-read config from localStorage whenever chat is opened (picks up admin changes)
  useEffect(() => {
    if (isOpen) setConfig(loadConfig());
  }, [isOpen]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen, isMinimized]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, isMinimized]);

  // Show greeting on first open — uses real-time time-of-day greeting based on admin config
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);
      setTimeout(() => {
        setMessages([{
          role: 'assistant',
          content: getDynamicGreeting(config.greeting, lang),
          ts: Date.now(),
        }]);
      }, 400);
    }
  }, [isOpen, hasGreeted, lang, config.greeting]);

  // Clean up camera stream on unmount / close
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
        cameraStreamRef.current = null;
      }
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const toggleOpen = () => {
    const loggedUser = localStorage.getItem('jeroma_logged_user');
    if (!loggedUser) {
      alert(lang === 'en' ? 'Login to access this feature' : 'Keto login me open tic man');
      window.open('#portal', '_blank');
      return;
    }
    setIsOpen(prev => !prev);
    setIsMinimized(false);
    setUnread(0);
  };

  // ── Voice Recording ─────────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size > 0 && blob.size <= MAX_FILE_SIZE) {
          const file = new File([blob], `voice_${Date.now()}.webm`, { type: mimeType });
          setAttachment({
            type: 'audio',
            file,
            preview: null,
            name: file.name,
            size: file.size,
            duration: `${recordingDuration}s`
          });
        }
        setIsRecording(false);
        setRecordingDuration(0);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Timer to track duration and auto-stop at 60s
      let seconds = 0;
      recordingTimerRef.current = setInterval(() => {
        seconds++;
        setRecordingDuration(seconds);
        if (seconds >= 60) {
          stopRecording();
        }
      }, 1000);

    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone access is required for voice messages. Please allow microphone access in your browser settings.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
  };

  // ── Camera Capture ──────────────────────────────────────────────────────────

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } }
      });
      cameraStreamRef.current = stream;
      setShowCameraModal(true);

      // Attach stream to video element after render
      setTimeout(() => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Camera access is required. Please allow camera access in your browser settings.');
    }
  };

  const capturePhoto = () => {
    const video = videoPreviewRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setAttachment({
          type: 'image',
          file,
          preview: URL.createObjectURL(blob),
          name: file.name,
          size: file.size
        });
      }
      closeCamera();
    }, 'image/jpeg', 0.85);
  };

  const closeCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
    setShowCameraModal(false);
  };

  // ── File Picker ─────────────────────────────────────────────────────────────

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected
    e.target.value = '';

    if (file.size > MAX_FILE_SIZE) {
      alert(`File is too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`);
      return;
    }

    if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
      const preview = URL.createObjectURL(file);
      setAttachment({ type: 'image', file, preview, name: file.name, size: file.size });
    } else if (ALLOWED_AUDIO_TYPES.includes(file.type)) {
      setAttachment({ type: 'audio', file, preview: null, name: file.name, size: file.size });
    } else {
      alert('Unsupported file type. Please attach an image (JPEG, PNG, WebP) or audio file.');
    }
  };

  const clearAttachment = () => {
    if (attachment?.preview) URL.revokeObjectURL(attachment.preview);
    setAttachment(null);
  };

  // ── Send Message (with optional multimodal attachment) ──────────────────────

  const sendMessage = useCallback(async (text) => {
    const userMsg = text.trim();
    const currentAttachment = attachment;

    // Need either text or an attachment
    if ((!userMsg && !currentAttachment) || isLoading) return;

    setInput('');
    setAttachment(null);

    // Build the user message object with optional attachment metadata
    const newUserMsg = {
      role: 'user',
      content: userMsg || (currentAttachment?.type === 'image' ? '📷 [Photo attached]' : '🎙️ [Voice message]'),
      ts: Date.now(),
      attachment: currentAttachment ? {
        type: currentAttachment.type,
        preview: currentAttachment.preview,
        name: currentAttachment.name,
        duration: currentAttachment.duration
      } : undefined
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    // Text-only off-topic check (skip if we have a media attachment OR if there is active history)
    const hasHistory = messages.length > 0;
    if (!currentAttachment && userMsg && !hasHistory && isQueryOffTopic(userMsg)) {
      setTimeout(() => {
        const botMsg = {
          role: 'assistant',
          content: "Sorry i cant help you with that question, is there any Question related to Agriculture or Our Company, i can help you with",
          ts: Date.now(),
        };
        setMessages(prev => [...prev, botMsg]);
        setIsLoading(false);
        if (!isOpen) setUnread(prev => prev + 1);
      }, 400);
      return;
    }

    // Build history (last 10 messages for context)
    const historyToSend = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));

    try {
      // Prepare multimodal body — include base64 media if present
      const requestBody = {
        message: userMsg || '',
        history: historyToSend,
        customNotes: config.customNotes || '',
        knowledgeLinks: config.knowledgeLinks || [],
        websiteContext: getWebsiteContext(lang)
      };

      if (currentAttachment) {
        const base64Data = await fileToBase64(currentAttachment.file);
        requestBody.media = {
          type: currentAttachment.type,
          mimeType: currentAttachment.file.type,
          data: base64Data,
          name: currentAttachment.name
        };
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000), // Extended timeout for multimodal
      });

      let reply;
      try {
        const data = await res.json();
        if (data && data.reply) {
          reply = data.reply;
        } else if (data && data.error) {
          reply = data.error;
        } else {
          reply = getLocalFallback(userMsg);
        }
      } catch {
        reply = getLocalFallback(userMsg);
      }

      const botMsg = { role: 'assistant', content: reply, ts: Date.now() };
      setMessages(prev => [...prev, botMsg]);
      if (!isOpen) setUnread(prev => prev + 1);

    } catch {
      const botMsg = {
        role: 'assistant',
        content: currentAttachment
          ? "I couldn't process your media right now. Please try again or describe your question in text."
          : getLocalFallback(userMsg),
        ts: Date.now(),
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, isOpen, config, lang, attachment]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setHasGreeted(false);
    clearAttachment();
    setTimeout(() => {
      setMessages([{
        role: 'assistant',
        content: "Chat cleared! How can I help you today? 🌾",
        ts: Date.now(),
      }]);
    }, 100);
  };

  return (
    <>
      {/* Only render if admin has enabled the chatbot */}
      {config.enabled && (
        <>
          <div className="chatbot-panel-inline" style={{
          position: 'relative',
          bottom: 'auto',
          right: 'auto',
          width: '100%',
          height: '600px',
          maxHeight: '85vh',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(15,48,32,0.25)',
          border: '2px solid rgba(82, 183, 136, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: '#0a2617',
          margin: '0 auto',
          animation: 'fadeIn 0.3s ease'
        }} role="dialog" aria-label="Jeroma Assistant" aria-modal="true">

          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-header-avatar">🌾</div>
              <div>
                <p className="chatbot-header-name">Ask Jeroma</p>
                <p className="chatbot-header-status">
                  <span className="status-dot" /> Jeroma Farmers Assistant
                </p>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button onClick={clearChat} title="Clear chat" className="chat-icon-btn" aria-label="Clear chat">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                </svg>
              </button>
            </div>
          </div>

        {/* Body (hidden when minimized) */}
        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="chatbot-messages" id="chatbot-messages" style={{ backgroundColor: '#0f3020', backgroundImage: 'linear-gradient(135deg, #0a2617 0%, #0f3020 50%, #112d1e 100%)' }}>
              {messages.length === 0 && (
                <div className="chatbot-empty" style={{ color: '#a8e6c8' }}>
                  <div className="chatbot-empty-icon">🌾</div>
                  <p style={{ color: '#c4f0db' }}>Hi! I'm <strong style={{ color: '#52b788' }}>Jeroma</strong>, your Jeroma Farmers AI assistant.</p>
                  <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '4px', color: '#a8e6c8' }}>Ask me anything about our crops, services, or registration.</p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '8px', color: '#a8e6c8' }}>📷 Send a photo · 🎙️ Record voice · 📎 Attach a file</p>
                </div>
              )}
              {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
              {isLoading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

              {/* Quick Replies (only when 1 message = greeting) */}
              {messages.length === 1 && !isLoading && (
                <div className="chatbot-quick-replies">
                  {config.quickReplies.map((qr, i) => (
                    <button key={i} className="quick-reply-chip" onClick={() => sendMessage(qr)}>
                      {qr}
                    </button>
                  ))}
                </div>
              )}

            {/* ── Attachment Preview Bar ── */}
            {attachment && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 14px', margin: '0 12px',
                background: 'rgba(82,183,136,0.08)',
                border: '1px solid rgba(82,183,136,0.2)',
                borderRadius: '10px', fontSize: '0.78rem'
              }}>
                {attachment.type === 'image' && attachment.preview && (
                  <img src={attachment.preview} alt="Preview" style={{
                    width: '40px', height: '40px', borderRadius: '6px',
                    objectFit: 'cover', border: '1px solid rgba(82,183,136,0.3)'
                  }} />
                )}
                {attachment.type === 'audio' && (
                  <span style={{ fontSize: '1.2rem' }}>🎙️</span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-primary-dark)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {attachment.name}
                  </p>
                  <p style={{ margin: 0, opacity: 0.6, fontSize: '0.7rem' }}>
                    {formatFileSize(attachment.size)}{attachment.duration ? ` · ${attachment.duration}` : ''}
                  </p>
                </div>
                <button onClick={clearAttachment} style={{
                  background: 'rgba(217,4,41,0.08)', border: 'none', borderRadius: '50%',
                  width: '24px', height: '24px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer', color: '#d90429', flexShrink: 0
                }} title="Remove attachment" aria-label="Remove attachment">
                  <MediaIcons.X size={12} />
                </button>
              </div>
            )}

            {/* ── Voice Recording Bar ── */}
            {isRecording && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 14px', margin: '4px 12px',
                background: 'rgba(217,4,41,0.06)',
                border: '1px solid rgba(217,4,41,0.15)',
                borderRadius: '10px'
              }}>
                <span style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: '#d90429', animation: 'pulse 1s infinite'
                }} />
                <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, color: '#d90429' }}>
                  Recording... {recordingDuration}s
                </span>
                <button onClick={cancelRecording} style={{
                  background: 'transparent', border: '1px solid rgba(217,4,41,0.3)',
                  borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem',
                  cursor: 'pointer', color: '#d90429', fontWeight: 600
                }}>Cancel</button>
                <button onClick={stopRecording} style={{
                  background: '#d90429', border: 'none', borderRadius: '6px',
                  padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer',
                  color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <MediaIcons.Stop size={12} /> Stop
                </button>
              </div>
            )}

            {/* ── Input Area with Media Toolbar ── */}
            <div className="chatbot-input-area" style={{ display: 'flex', flexDirection: 'column', gap: '0', backgroundColor: '#081c15', borderTop: '1px solid rgba(82,183,136,0.2)' }}>
              {/* Media action buttons row */}
              <div style={{
                display: 'flex', gap: '2px', padding: '4px 4px 0',
                borderBottom: 'none'
              }}>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading}
                  title={isRecording ? 'Stop recording' : 'Record voice message'}
                  aria-label={isRecording ? 'Stop recording' : 'Record voice'}
                  className="chat-media-btn"
                  style={{
                    background: isRecording ? 'rgba(217,4,41,0.1)' : 'transparent',
                    border: 'none', borderRadius: '8px', padding: '6px 8px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    color: isRecording ? '#d90429' : '#a8e6c8',
                    opacity: isLoading ? 0.4 : 1, transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: '2px'
                  }}
                >
                  {isRecording ? <MediaIcons.MicOff size={16} /> : <MediaIcons.Mic size={16} />}
                </button>

                <button
                  onClick={openCamera}
                  disabled={isLoading || isRecording}
                  title="Take a photo"
                  aria-label="Open camera"
                  className="chat-media-btn"
                  style={{
                    background: 'transparent', border: 'none', borderRadius: '8px',
                    padding: '6px 8px', cursor: (isLoading || isRecording) ? 'not-allowed' : 'pointer',
                    color: '#a8e6c8',
                    opacity: (isLoading || isRecording) ? 0.4 : 1, transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: '2px'
                  }}
                >
                  <MediaIcons.Camera size={16} />
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isRecording}
                  title="Attach image or audio"
                  aria-label="Attach file"
                  className="chat-media-btn"
                  style={{
                    background: 'transparent', border: 'none', borderRadius: '8px',
                    padding: '6px 8px', cursor: (isLoading || isRecording) ? 'not-allowed' : 'pointer',
                    color: '#a8e6c8',
                    opacity: (isLoading || isRecording) ? 0.4 : 1, transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: '2px'
                  }}
                >
                  <MediaIcons.Paperclip size={16} />
                </button>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,audio/webm,audio/ogg,audio/mp4,audio/mpeg,audio/wav"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Text input + send button row */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0' }}>
                <textarea
                  ref={inputRef}
                  id="chatbot-input"
                  className="chatbot-input"
                  rows={1}
                  placeholder={attachment ? "Add a message (optional)..." : "Type your question..."}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading || isRecording}
                  aria-label="Type your message"
                />
                <button
                  className="chatbot-send-btn"
                  onClick={() => sendMessage(input)}
                  disabled={isLoading || isRecording || (!input.trim() && !attachment)}
                  aria-label="Send message"
                  id="chatbot-send"
                >
                  {isLoading ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <p className="chatbot-footer-note" style={{ color: 'rgba(168,230,200,0.5)', backgroundColor: '#081c15' }}>
              powered by Jeroma
            </p>
          </>
        )}
          </div>

          {/* ── Camera Capture Modal ── */}
          {showCameraModal && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 10010,
              background: 'rgba(0,0,0,0.85)', display: 'flex',
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '20px'
            }}>
              <div style={{
                background: '#081c15', borderRadius: '20px', overflow: 'hidden',
                maxWidth: '460px', width: '100%', border: '2px solid rgba(82,183,136,0.3)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
              }}>
                {/* Camera Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', borderBottom: '1px solid rgba(82,183,136,0.15)'
                }}>
                  <span style={{ color: '#a7f3d0', fontSize: '0.85rem', fontWeight: 700 }}>
                    📷 Take a Photo
                  </span>
                  <button onClick={closeCamera} style={{
                    background: 'rgba(217,4,41,0.15)', border: 'none', borderRadius: '50%',
                    width: '28px', height: '28px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', color: '#fca5a5'
                  }}>
                    <MediaIcons.X size={14} />
                  </button>
                </div>

                {/* Video Preview */}
                <div style={{ position: 'relative', background: '#000' }}>
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', maxHeight: '340px', objectFit: 'cover', display: 'block' }}
                  />
                </div>

                {/* Capture Button */}
                <div style={{
                  display: 'flex', justifyContent: 'center', padding: '16px',
                  gap: '16px', alignItems: 'center'
                }}>
                  <button onClick={capturePhoto} style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #52b788, #40916c)',
                    border: '3px solid #a7f3d0', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(82,183,136,0.3)',
                    transition: 'transform 0.15s'
                  }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%', background: '#fff'
                    }} />
                  </button>
                </div>

                <p style={{
                  textAlign: 'center', fontSize: '0.72rem', color: 'rgba(167,243,208,0.6)',
                  padding: '0 18px 14px', margin: 0
                }}>
                  Point your camera at crops, soil, pests, or any farming concern. Jeroma will analyze the photo and provide advice.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
