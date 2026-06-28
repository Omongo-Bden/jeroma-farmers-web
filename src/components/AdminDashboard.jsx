import React, { useState, useEffect } from 'react';
import * as Icons from './Icons';
import { 
  getCrops, 
  saveCrops, 
  getDeliveries, 
  saveDelivery, 
  updateDeliveryStatus, 
  getDispatches, 
  updateDispatchStatus, 
  getInquiries, 
  updateInquiryStatus, 
  getUsers, 
  registerUser,
  registerAdmin,
  deleteUser,
  updateUser,
  resetToDefaults,
  updateTranslation,
  resetTranslations,
  initTranslations,
  getSlides,
  saveSlides,
  uploadImage,
  getManual,
  saveManual,
  getAlerts,
  getSettings,
  saveSettings
} from '../utils/db';
import { translations as defaultTranslations } from './translations';

export default function AdminDashboard({ lang, user, onLogout, onBackToSite, onStateChange }) {
  const [activeTab, setActiveTab] = useState('prices'); // 'prices' | 'deliveries' | 'dispatches' | 'inquiries'
  
  // Data States
  const [crops, setCrops] = useState({});
  const [deliveries, setDeliveries] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [clients, setClients] = useState([]);
  const [allUsersList, setAllUsersList] = useState([]);
  const [slides, setSlides] = useState([]);
  const [manualStages, setManualStages] = useState([]);
  const [settings, setSettings] = useState({ hideManual: false });
  const [isLoading, setIsLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  // Change Password States
  const [showChangePwModal, setShowChangePwModal] = useState(false);
  const [pwStep, setPwStep] = useState(1);
  const [pwMethod, setPwMethod] = useState('phone');
  const [pwPhone, setPwPhone] = useState(user.phone || '');
  const [pwEmail, setPwEmail] = useState('');
  const [pwGeneratedCode, setPwGeneratedCode] = useState('');
  const [pwEnteredCode, setPwEnteredCode] = useState('');
  const [pwNewPassword, setPwNewPassword] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwIsLoading, setPwIsLoading] = useState(false);

  // Manual Management States
  const [editingStage, setEditingStage] = useState(null); // null | stageId
  const [stageTitleEn, setStageTitleEn] = useState('');
  const [stageTitleLuo, setStageTitleLuo] = useState('');
  const [stageSubtitleEn, setStageSubtitleEn] = useState('');
  const [stageSubtitleLuo, setStageSubtitleLuo] = useState('');
  const [stagePointsText, setStagePointsText] = useState('');
  const [stageNaroAdvice, setStageNaroAdvice] = useState('');
  const [stageImage, setStageImage] = useState('');
  const [stageSuccess, setStageSuccess] = useState('');
  const [stageError, setStageError] = useState('');
  const [isManualUploading, setIsManualUploading] = useState(false);
  
  // Slides Management States
  const [editingSlide, setEditingSlide] = useState(null); // null | id | 'new'
  const [slideIcon, setSlideIcon] = useState('');
  const [slideTagEn, setSlideTagEn] = useState('');
  const [slideTagAch, setSlideTagAch] = useState('');
  const [slideTitleEn, setSlideTitleEn] = useState('');
  const [slideTitleAch, setSlideTitleAch] = useState('');
  const [slideBodyEn, setSlideBodyEn] = useState('');
  const [slideBodyAch, setSlideBodyAch] = useState('');
  const [slideImage, setSlideImage] = useState('');
  const [slideFit, setSlideFit] = useState('cover');
  const [slidesSuccess, setSlidesSuccess] = useState('');
  const [slidesError, setSlidesError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // User Management States
  const [mngUserForm, setMngUserForm] = useState(false);
  const [mngRole, setMngRole] = useState('client');
  const [mngUsername, setMngUsername] = useState('');
  const [mngPassword, setMngPassword] = useState('');
  const [mngName, setMngName] = useState('');
  const [mngPhone, setMngPhone] = useState('');
  const [mngSuccess, setMngSuccess] = useState('');
  const [mngError, setMngError] = useState('');
  const [mngPermissions, setMngPermissions] = useState(['prices', 'deliveries', 'dispatches', 'inquiries', 'manual', 'chatbot']);
  
  // Edit Price States
  const [editingCrop, setEditingCrop] = useState(null);
  const [editRate, setEditRate] = useState('');
  const [editMoisture, setEditMoisture] = useState('');
  const [editGuide, setEditGuide] = useState('');
  const [editTips, setEditTips] = useState('');

  // Log Delivery States
  const [logClient, setLogClient] = useState('');
  const [logCrop, setLogCrop] = useState('sunflower');
  const [logWeight, setLogWeight] = useState('');
  const [logGrade, setLogGrade] = useState('A');
  const [logSuccess, setLogSuccess] = useState('');
  const [logError, setLogError] = useState('');

  // Language Manager States
  const [langMgrLang, setLangMgrLang] = useState('en');
  const [langMgrEdits, setLangMgrEdits] = useState({});
  const [langMgrSaved, setLangMgrSaved] = useState(false);
  const [langMgrSearch, setLangMgrSearch] = useState('');

  // Breaking News Marquee States & Handlers
  const [tickerEn, setTickerEn] = useState('');
  const [tickerLuo, setTickerLuo] = useState('');
  const [isSavingTicker, setIsSavingTicker] = useState(false);
  const [tickerSavedMsg, setTickerSavedMsg] = useState(false);

  useEffect(() => {
    if (activeTab === 'language') {
      const current = getLangMgrTranslations();
      setTickerEn(current.en?.newsTickerText || '');
      setTickerLuo(current.luo?.newsTickerText || '');
      setTickerSavedMsg(false);
    }
  }, [activeTab]);

  const handleSaveTicker = async () => {
    setIsSavingTicker(true);
    setTickerSavedMsg(false);
    try {
      await updateTranslation('en', 'newsTickerText', tickerEn);
      await updateTranslation('luo', 'newsTickerText', tickerLuo);
      if (onStateChange) await onStateChange();
      setTickerSavedMsg(true);
      setTimeout(() => setTickerSavedMsg(false), 4000);
    } catch (err) {
      console.error('Error saving breaking news marquee:', err);
      alert('Error updating Breaking News Marquee. Please try again.');
    } finally {
      setIsSavingTicker(false);
    }
  };

  // Chatbot Manager States
  const CHATBOT_CONFIG_KEY = 'jeroma_chatbot_config';
  const defaultChatbotConfig = {
    enabled: true,
    greeting: "Hello! I'm Jeroma, your Jeroma Farmers AI assistant. I can help you with crop prices, collection services, farmer registration, and more.\n\nHow can I help you today? 🌾",
    quickReplies: [
      "What crops do you collect?",
      "What are current payout rates?",
      "How do I register as a farmer?",
      "How do I request a field pickup?",
      "What inputs are available?",
      "Where is the collection centre?"
    ],
    customNotes: "",
    knowledgeLinks: []
  };
  const loadChatbotConfig = () => {
    try { return JSON.parse(localStorage.getItem(CHATBOT_CONFIG_KEY)) || defaultChatbotConfig; }
    catch { return defaultChatbotConfig; }
  };
  const [cbConfig, setCbConfig] = useState(loadChatbotConfig);
  const [cbNewChip, setCbNewChip] = useState('');
  const [cbSaved, setCbSaved] = useState(false);
  const [cbNewLinkUrl, setCbNewLinkUrl] = useState('');
  const [cbNewLinkLabel, setCbNewLinkLabel] = useState('');
  const [cbLinkError, setCbLinkError] = useState('');
  const [systemAlerts, setSystemAlerts] = useState([]);

  // Translations
  const translations = {
    en: {
      adminTitle: "Center Operations Dashboard",
      welcome: "Welcome,",
      roleAdmin: "System Administrator",
      backSite: "Back to Home",
      logout: "Log Out",
      pricesTab: "Price Manager",
      deliveriesTab: "Weighbridge Logs",
      dispatchesTab: "Transit Requests",
      inquiriesTab: "Inquiry Inbox",
      resetDb: "Reset Database to Defaults",
      resetWarning: "Are you sure you want to reset all crop prices, accounts, and delivery histories back to original mock data? This cannot be undone.",
      cropName: "Crop Name",
      currentRate: "Base Price (UGX/Kg)",
      moistureTarget: "Moisture Target",
      gradingRules: "Grading Criteria",
      dryingTips: "Drying Tips",
      action: "Actions",
      edit: "Edit Price",
      save: "Save Changes",
      cancel: "Cancel",
      logDelivery: "Log New Weighing Receipt",
      selectFarmer: "Select Farmer",
      selectCrop: "Select Crop Type",
      weightKg: "Net Crop Weight (Kg)",
      qualityGrade: "Quality Grade",
      gradeA: "Grade A (100% Payout)",
      gradeB: "Grade B (90% Payout)",
      submitReceipt: "Issue Weighing Receipt",
      payoutAmount: "Calculated Payout",
      status: "Status",
      date: "Date",
      farmer: "Farmer Name",
      crop: "Crop",
      weight: "Weight",
      grade: "Grade",
      payout: "Payout (UGX)",
      approve: "Approve",
      complete: "Complete",
      cancelBtn: "Cancel Transit",
      location: "Location",
      scheduledDate: "Collection Date",
      notes: "Notes",
      sender: "Sender",
      subject: "Subject",
      message: "Message",
      markRead: "Mark as Read",
      markUnread: "Mark as Unread"
    },
    luo: {
      adminTitle: "Dashboard me Operations",
      welcome: "Keny,",
      roleAdmin: "Lutic me Operations",
      backSite: "Dok cen i website",
      logout: "Log Out",
      pricesTab: "Ronge me Wel",
      deliveriesTab: "Recit me Keyo",
      dispatchesTab: "Oro lela",
      inquiriesTab: "Inbox me Nying",
      resetDb: "Reset jami ducu cen piny",
      resetWarning: "Itye maber ni imito reset wel me cado kede nying ducu cen piny? Ginnipiny pe twero dok cen anyim.",
      cropName: "Nying me cam",
      currentRate: "Wel cam (UGX/Kg)",
      moistureTarget: "Dit me pii i icam",
      gradingRules: "Grade me cam",
      dryingTips: "Pwonj me toyo",
      action: "Tic",
      edit: "Lok Wel",
      save: "Kopi",
      cancel: "Kwer",
      logDelivery: "Coye recit manyen",
      selectFarmer: "Yier Apur",
      selectCrop: "Yier kit me cam",
      weightKg: "Dit me jami (Kg)",
      qualityGrade: "Grade me cam",
      gradeA: "Grade A (100% Wel)",
      gradeB: "Grade B (90% Wel)",
      submitReceipt: "Issue Recit manyen",
      payoutAmount: "Wel to pay",
      status: "Status",
      date: "Dwe",
      farmer: "Nying Apur",
      crop: "Cam",
      weight: "Dit me cam",
      grade: "Grade",
      payout: "Wel (UGX)",
      approve: "Yiee",
      complete: "Ocigo maber",
      cancelBtn: "Kwer transit",
      location: "Lobo",
      scheduledDate: "Dwe me keyo",
      notes: "Lok okelle",
      sender: "Nying lane",
      subject: "Lok anena",
      message: "Kop",
      markRead: "Kwan woko",
      markUnread: "Pe okwan"
    },
    lug: {
      adminTitle: "Dashboard y'Ebyobulimi",
      welcome: "Nsanyuse okukubona,",
      roleAdmin: "Omulabirizi w'Ebyobulimi",
      backSite: "Ddayo ku Website",
      logout: "Yingira Wano",
      pricesTab: "Omuwendo gw'Ebirime",
      deliveriesTab: "Ebiwandiiko by'Makungula",
      dispatchesTab: "Entambula y'Ebirime",
      inquiriesTab: "Obubaka Obutuuse",
      resetDb: "Zzaako Ebiwandiiko byonna emabega",
      resetWarning: "Oli mukakafu nti oyagala okubazaako emiwendo n'ebiwandiiko byonna emabega? Kino tekikyusika.",
      cropName: "Ekirime",
      currentRate: "Bbeeyi ku Kilo (UGX)",
      moistureTarget: "Amazzi mu Kirime",
      gradingRules: "Emitindo gy'Ebirime",
      dryingTips: "Okwanika Ebirime",
      action: "Ebyokukola",
      edit: "Kyusa Bbeeyi",
      save: "Kuuma",
      cancel: "Kazaako",
      logDelivery: "Wandiika Ekiwandiiko Ekipya",
      selectFarmer: "Londa Omulimi",
      selectCrop: "Londa Ekirime",
      weightKg: "Obuzito bw'Ekirime (Kg)",
      qualityGrade: "Omutindo",
      gradeA: "Grade A (100% Payout)",
      gradeB: "Grade B (90% Payout)",
      submitReceipt: "Gaba Ekiwandiiko Ky'akungula",
      payoutAmount: "Omugatte gw'okuba",
      status: "Mbeera",
      date: "Olunaku",
      farmer: "Omulimi",
      crop: "Ekirime",
      weight: "Obuzito",
      grade: "Omutindo",
      payout: "Okusasulwa (UGX)",
      approve: "Kkiriza",
      complete: "Kumaliriziddwa",
      cancelBtn: "Ggalawo",
      location: "Kifo",
      scheduledDate: "Olunaku lw'Okukungula",
      notes: "Ebinyonyola",
      sender: "Abakuwandiikira",
      subject: "Omutwe gw'Obubaka",
      message: "Obubaka",
      markRead: "Soma Obubaka",
      markUnread: "Te-bisomeddwa"
    }
  };

  const t = translations[lang] || translations.en;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cropsData, deliveriesData, dispatchesData, inquiriesData, allUsers, slidesData, manualData, settingsData] = await Promise.all([
        getCrops(),
        getDeliveries(),
        getDispatches(),
        getInquiries(),
        getUsers(),
        getSlides(),
        getManual(),
        getSettings()
      ]);
      setCrops(cropsData || {});
      setDeliveries(deliveriesData || []);
      setDispatches(dispatchesData || []);
      setInquiries(inquiriesData || []);
      setAllUsersList(allUsers || []);
      setClients((allUsers || []).filter(u => u.role === 'client'));
      setSlides(slidesData || []);
      setManualStages(manualData || []);
      if (settingsData) {
        setSettings(settingsData);
        localStorage.setItem('jeroma_settings', JSON.stringify(settingsData));
      }

      if (user.username.toLowerCase() === 'admin') {
        try {
          const alertsData = await getAlerts();
          setSystemAlerts(alertsData || []);
        } catch (err) {
          console.error('Failed to load system alerts:', err);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePwCode = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    const contactVal = pwMethod === 'phone' ? pwPhone.trim() : pwEmail.trim();
    if (!contactVal) {
      setPwError('Please fill out all fields.');
      return;
    }

    setPwIsLoading(true);
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setPwGeneratedCode(code);
      console.log('SIMULATED SMS/EMAIL CODE:', code);
      setPwSuccess(`Verification code sent to your registered ${pwMethod === 'phone' ? 'phone number via SMS' : 'email address'}! Please check your messages.`);
      setPwStep(2);
    } catch (err) {
      setPwError('Failed to generate verification code.');
    } finally {
      setPwIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (pwEnteredCode !== pwGeneratedCode) {
      setPwError('Invalid verification code.');
      return;
    }

    const hasText = /[a-zA-Z]/.test(pwNewPassword);
    const hasNumber = /[0-9]/.test(pwNewPassword);
    if (pwNewPassword.length < 6 || !hasText || !hasNumber) {
      setPwError('Password must be at least 6 characters and contain a mixture of text and numbers.');
      return;
    }

    setPwIsLoading(true);
    try {
      const res = await updateUser(user.username, { password: pwNewPassword });
      if (res.success || res) {
        setPwSuccess('Password updated successfully!');
        setTimeout(() => {
          setShowChangePwModal(false);
          setPwStep(1);
          setPwNewPassword('');
          setPwGeneratedCode('');
          setPwEnteredCode('');
          setPwSuccess('');
          setPwError('');
        }, 2000);
      }
    } catch (err) {
      setPwError('Failed to update password.');
    } finally {
      setPwIsLoading(false);
    }
  };

  // ── Training Manual Handlers ──────────────────────────────────────────────
  const openEditManualStage = (stage) => {
    setEditingStage(stage.id);
    setStageTitleEn(stage.title_en || stage.title || '');
    setStageTitleLuo(stage.title_luo || stage.title_ach || '');
    setStageSubtitleEn(stage.subtitle_en || stage.subtitle || '');
    setStageSubtitleLuo(stage.subtitle_luo || '');
    setStagePointsText((stage.points || []).join('\n'));
    setStageNaroAdvice(stage.naroAdvice || '');
    setStageImage(stage.image || '');
    setStageSuccess('');
    setStageError('');
  };

  const cancelEditManualStage = () => {
    setEditingStage(null);
    setStageTitleEn('');
    setStageTitleLuo('');
    setStageSubtitleEn('');
    setStageSubtitleLuo('');
    setStagePointsText('');
    setStageNaroAdvice('');
    setStageImage('');
    setStageSuccess('');
    setStageError('');
  };

  const handleManualImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsManualUploading(true);
    setStageSuccess('');
    setStageError('');
    try {
      const res = await uploadImage(file);
      if (res.success && res.url) {
        setStageImage(res.url);
        setStageSuccess('Stage photo uploaded successfully!');
      } else {
        setStageError('Failed to upload image.');
      }
    } catch (err) {
      setStageError(err.message || 'Failed to upload image.');
    } finally {
      setIsManualUploading(false);
    }
  };

  const handleSaveManualStage = async (e) => {
    e.preventDefault();
    setStageSuccess('');
    setStageError('');

    const updatedManual = manualStages.map(stage => {
      if (stage.id === editingStage) {
        return {
          ...stage,
          title_en: stageTitleEn,
          title_luo: stageTitleLuo,
          subtitle_en: stageSubtitleEn,
          subtitle_luo: stageSubtitleLuo,
          points: stagePointsText.split('\n').map(p => p.trim()).filter(Boolean),
          naroAdvice: stageNaroAdvice,
          image: stageImage
        };
      }
      return stage;
    });

    try {
      const saved = await saveManual(updatedManual);
      if (saved) {
        setManualStages(saved);
        setStageSuccess('Manual stage saved successfully!');
        setEditingStage(null);
        onStateChange();
      } else {
        setStageError('Failed to save manual stage to database.');
      }
    } catch (err) {
      setStageError('Error saving: ' + err.message);
    }
  };

  // ── Slide Handlers ────────────────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setSlidesError('');
    setSlidesSuccess('');
    try {
      const res = await uploadImage(file);
      if (res.success && res.url) {
        setSlideImage(res.url);
        setSlidesSuccess('Image uploaded successfully! Path updated.');
      } else {
        setSlidesError('Failed to upload image.');
      }
    } catch (err) {
      setSlidesError(err.message || 'Image upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const openNewSlide = () => {
    setEditingSlide('new');
    setSlideIcon('📢');
    setSlideTagEn('News');
    setSlideTagAch('Kop Manyen');
    setSlideTitleEn('');
    setSlideTitleAch('');
    setSlideBodyEn('');
    setSlideBodyAch('');
    setSlideImage('/community_gathering.webp');
    setSlideFit('cover');
    setSlidesSuccess('');
    setSlidesError('');
  };

  const openEditSlide = (slide) => {
    setEditingSlide(slide.id);
    setSlideIcon(slide.icon || '📢');
    setSlideTagEn(slide.tag_en || '');
    setSlideTagAch(slide.tag_ach || '');
    setSlideTitleEn(slide.title_en || '');
    setSlideTitleAch(slide.title_ach || '');
    setSlideBodyEn(slide.body_en || '');
    setSlideBodyAch(slide.body_ach || '');
    setSlideImage(slide.image || '');
    setSlideFit(slide.fit || 'cover');
    setSlidesSuccess('');
    setSlidesError('');
  };

  const cancelEditSlide = () => {
    setEditingSlide(null);
    setSlidesSuccess('');
    setSlidesError('');
  };

  const handleSaveSlide = async (e) => {
    e.preventDefault();
    setSlidesSuccess('');
    setSlidesError('');
    if (!slideTitleEn.trim()) { setSlidesError('English title is required.'); return; }
    if (!slideBodyEn.trim()) { setSlidesError('English body text is required.'); return; }
    if (!slideImage.trim()) { setSlidesError('Image path is required.'); return; }

    const updatedSlide = {
      id: editingSlide === 'new' ? 'slide-' + Date.now() : editingSlide,
      icon: slideIcon || '📢',
      tag_en: slideTagEn,
      tag_ach: slideTagAch,
      title_en: slideTitleEn,
      title_ach: slideTitleAch,
      body_en: slideBodyEn,
      body_ach: slideBodyAch,
      image: slideImage,
      color: '#081c15',
      accent: '#52b788',
      fit: slideFit
    };

    let updatedSlides;
    if (editingSlide === 'new') {
      updatedSlides = [...slides, updatedSlide];
    } else {
      updatedSlides = slides.map(s => s.id === editingSlide ? updatedSlide : s);
    }

    try {
      const saved = await saveSlides(updatedSlides);
      setSlides(saved && saved.length > 0 ? saved : updatedSlides);
      setSlidesSuccess(editingSlide === 'new' ? 'New slide added successfully!' : 'Slide updated successfully!');
      setEditingSlide(null);
    } catch (err) {
      setSlidesError('Failed to save slides. Please try again.');
    }
  };

  const handleDeleteSlide = async (id) => {
    if (!window.confirm('Are you sure you want to delete this slide?')) return;
    const updatedSlides = slides.filter(s => s.id !== id);
    try {
      const saved = await saveSlides(updatedSlides);
      setSlides(saved && saved.length > 0 ? saved : updatedSlides);
      setSlidesSuccess('Slide deleted successfully.');
    } catch (err) {
      setSlidesError('Failed to delete slide.');
    }
  };

  const handleMoveSlide = async (id, direction) => {
    const idx = slides.findIndex(s => s.id === id);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= slides.length) return;
    const reordered = [...slides];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    try {
      const saved = await saveSlides(reordered);
      setSlides(saved && saved.length > 0 ? saved : reordered);
    } catch (err) {
      setSlidesError('Failed to reorder slides.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditPrice = (crop) => {
    setEditingCrop(crop.id);
    setEditRate(crop.payoutRate.replace('UGX ', '').replace(',', ''));
    setEditMoisture(crop.moisture);
    setEditGuide(crop.gradingGuide);
    setEditTips(crop.tips);
  };

  const handleSavePrice = async (e) => {
    e.preventDefault();
    const updatedCrops = { ...crops };
    updatedCrops[editingCrop] = {
      ...updatedCrops[editingCrop],
      payoutRate: 'UGX ' + parseInt(editRate).toLocaleString(),
      moisture: editMoisture,
      gradingGuide: editGuide,
      tips: editTips
    };
    setCrops(updatedCrops);
    await saveCrops(updatedCrops);
    setEditingCrop(null);
    onStateChange(); // Notify parent of pricing updates (so calculator & news ticker refresh)
  };

  const handleLogDelivery = async (e) => {
    e.preventDefault();
    setLogSuccess('');
    setLogError('');
    
    if (!logClient || !logWeight) {
      setLogError(lang === 'en' ? 'Please select a farmer and enter weight.' : 'Balaalise okujjuza bulungi.');
      return;
    }
    
    const farmer = clients.find(c => c.username === logClient);
    const crop = crops[logCrop];
    const baseRate = parseInt(crop.payoutRate.replace('UGX ', '').replace(/,/g, ''));
    const actualRate = logGrade === 'A' ? baseRate : Math.floor(baseRate * 0.9); // 10% discount for Grade B
    
    const weightVal = parseFloat(logWeight);
    const payoutVal = Math.floor(weightVal * actualRate);
    
    const newDel = await saveDelivery({
      username: logClient,
      farmerName: farmer.name,
      cropId: logCrop,
      cropName: crop.name,
      weight: weightVal,
      grade: logGrade,
      rate: actualRate,
      payout: payoutVal,
      status: 'Completed'
    });
    
    setLogSuccess(lang === 'en' ? `Receipt ${newDel.id} created. Payout: UGX ${newDel.payout.toLocaleString()}` : `Ekiwandiiko ${newDel.id} kyekoze.`);
    setLogWeight('');
    setDeliveries(await getDeliveries());
    onStateChange();
  };

  const handleMobileMoneyPayout = async (del) => {
    if (!window.confirm(`Disburse payout of UGX ${del.payout.toLocaleString()} to farmer ${del.farmerName} via Mobile Money?`)) return;
    setPayingId(del.id);
    try {
      const farmer = allUsersList.find(u => u.username === del.username) || clients.find(c => c.username === del.username);
      const phone = farmer ? farmer.phone : '+256 773 623 196';
      
      const token = localStorage.getItem('jeroma_jwt_token');
      const res = await window.fetch('/api/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          deliveryId: del.id,
          phone: phone,
          amount: del.payout,
          provider: phone.startsWith('+256 77') || phone.startsWith('+256 78') ? 'MTN' : 'Airtel'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Payout Successful!\nTransaction ID: ${data.transactionId}\n${data.message}`);
        await updateDeliveryStatus(del.id, 'Completed');
        setDeliveries(await getDeliveries());
        onStateChange();
      } else {
        alert(`Payout Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Payout execution failed: ${err.message}`);
    } finally {
      setPayingId(null);
    }
  };

  const handleApproveDispatch = async (id) => {
    await updateDispatchStatus(id, 'Scheduled');
    setDispatches(await getDispatches());
    onStateChange();
  };

  const handleCompleteDispatch = async (id) => {
    await updateDispatchStatus(id, 'Completed');
    setDispatches(await getDispatches());
    onStateChange();
  };

  const handleCancelDispatch = async (id) => {
    await updateDispatchStatus(id, 'Cancelled');
    setDispatches(await getDispatches());
    onStateChange();
  };

  const handleToggleInquiryStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Unread' ? 'Read' : 'Unread';
    await updateInquiryStatus(id, nextStatus);
    setInquiries(await getInquiries());
    onStateChange();
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMngError('');
    setMngSuccess('');
    
    if (!mngUsername || !mngPassword || !mngName) {
      setMngError('Please fill out required fields');
      return;
    }

    // Restrict password strength
    const hasText = /[a-zA-Z]/.test(mngPassword);
    const hasNumber = /[0-9]/.test(mngPassword);
    if (mngPassword.length < 6 || !hasText || !hasNumber) {
      setMngError('Password must be at least 6 characters and contain a mixture of text and numbers.');
      return;
    }
    
    const newUser = {
      username: mngUsername.toLowerCase(),
      password: mngPassword,
      name: mngName,
      phone: mngPhone,
      district: 'Lira',
      permissions: mngRole === 'admin' ? mngPermissions : undefined
    };
    
    const result = await (mngRole === 'admin' ? registerAdmin(newUser) : registerUser(newUser));
    if (result.success) {
      setMngSuccess(`Account created for ${newUser.username}`);
      setMngUsername('');
      setMngPassword('');
      setMngName('');
      setMngPhone('');
      setMngUserForm(false);
      await loadData();
    } else {
      setMngError(result.error || 'Username already exists');
    }
  };

  const handleDeleteUser = async (username) => {
    if (window.confirm(`Are you sure you want to delete user ${username}?`)) {
      await deleteUser(username);
      await loadData();
    }
  };

  const handleToggleUserRole = async (username, currentRole) => {
    const newRole = currentRole === 'admin' ? 'client' : 'admin';
    if (window.confirm(`Are you sure you want to change the role of ${username} to ${newRole.toUpperCase()}?`)) {
      await updateUser(username, { role: newRole });
      await loadData();
    }
  };

  const handleToggleUserStatus = async (username, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const action = newStatus === 'suspended' ? 'suspend' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} user ${username}?`)) {
      await updateUser(username, { status: newStatus });
      await loadData();
    }
  };

  const handleUpdateUserPermissions = async (username, permissions) => {
    await updateUser(username, { permissions });
    await loadData();
  };

  const handleResetDb = async () => {
    if (window.confirm(t.resetWarning)) {
      await resetToDefaults();
      await loadData();
      onStateChange();
      alert(lang === 'en' ? 'Database successfully restored to default states.' : 'Jami ducu ocogo cen piny.');
    }
  };

  // Language Manager helpers — use local storage fallback since getTranslations is async
  const getLangMgrTranslations = () =>
    JSON.parse(localStorage.getItem('jeroma_translations')) || defaultTranslations;

  const handleLangMgrChange = (key, value) => {
    setLangMgrEdits(prev => ({ ...prev, [key]: value }));
  };

  const handleLangMgrSave = async () => {
    await Promise.all(
      Object.entries(langMgrEdits).map(([key, value]) =>
        updateTranslation(langMgrLang, key, value)
      )
    );
    setLangMgrEdits({});
    setLangMgrSaved(true);
    onStateChange(); // Trigger App.jsx to reload translations
    setTimeout(() => setLangMgrSaved(false), 3000);
  };

  const handleLangMgrReset = async () => {
    if (window.confirm('Reset ALL translations back to the original default texts? This cannot be undone.')) {
      await resetTranslations();
      await initTranslations(defaultTranslations);
      setLangMgrEdits({});
      onStateChange();
      alert('Translations have been reset to defaults.');
    }
  };

  const handleCbSave = () => {
    localStorage.setItem(CHATBOT_CONFIG_KEY, JSON.stringify(cbConfig));
    setCbSaved(true);
    setTimeout(() => setCbSaved(false), 2500);
  };

  const handleCbReset = () => {
    if (window.confirm('Reset chatbot settings to defaults?')) {
      localStorage.removeItem(CHATBOT_CONFIG_KEY);
      setCbConfig(defaultChatbotConfig);
    }
  };

  const addCbChip = () => {
    const chip = cbNewChip.trim();
    if (!chip || cbConfig.quickReplies.includes(chip)) return;
    setCbConfig(prev => ({ ...prev, quickReplies: [...prev.quickReplies, chip] }));
    setCbNewChip('');
  };

  const removeCbChip = (i) => {
    setCbConfig(prev => ({ ...prev, quickReplies: prev.quickReplies.filter((_, idx) => idx !== i) }));
  };

  const addCbLink = () => {
    setCbLinkError('');
    const url = cbNewLinkUrl.trim();
    const label = cbNewLinkLabel.trim() || url;
    if (!url) { setCbLinkError('Please enter a URL.'); return; }
    try { new URL(url); } catch { setCbLinkError('Please enter a valid URL (e.g. https://example.com).'); return; }
    const existing = (cbConfig.knowledgeLinks || []);
    if (existing.find(l => l.url === url)) { setCbLinkError('This URL is already added.'); return; }
    if (existing.length >= 5) { setCbLinkError('Maximum 5 knowledge links allowed.'); return; }
    setCbConfig(prev => ({ ...prev, knowledgeLinks: [...(prev.knowledgeLinks || []), { url, label }] }));
    setCbNewLinkUrl('');
    setCbNewLinkLabel('');
  };

  const removeCbLink = (i) => {
    setCbConfig(prev => ({ ...prev, knowledgeLinks: (prev.knowledgeLinks || []).filter((_, idx) => idx !== i) }));
  };


  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#faf9f6' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>Loading operations centre...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#faf9f6', minHeight: '100vh', padding: 'clamp(16px, 4vw, 40px) 0' }}>
      <div className="container">
        
        {/* Top Profile Header */}
        <div className="dashboard-header-panel">
          <div className="dashboard-header-profile">
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.08)', border: '2px solid var(--color-secondary)',
              display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Icons.Shield size={32} style={{ color: 'var(--color-secondary)' }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t.roleAdmin}
              </p>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#fff' }}>
                {t.welcome} {user.name}
              </h2>
            </div>
          </div>
          <div className="dashboard-header-buttons" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-outline" onClick={() => setShowChangePwModal(true)} style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🔑 Change Password
            </button>
            <button className="btn btn-outline" onClick={onBackToSite} style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff', padding: '10px 18px' }}>
              <Icons.ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} />
              {t.backSite}
            </button>
            <button className="btn btn-primary" onClick={onLogout} style={{ background: '#d90429', border: 'none', padding: '10px 18px' }}>
              <Icons.Clock size={16} style={{ transform: 'rotate(45deg)' }} />
              {t.logout}
            </button>
          </div>
        </div>

        {/* Dash Tabs */}
        <div className="dashboard-tabs-container">
          {[
            { id: 'prices', label: t.pricesTab, icon: <Icons.Wheat size={18} /> },
            { id: 'deliveries', label: t.deliveriesTab, icon: <Icons.Warehouse size={18} /> },
            { id: 'dispatches', label: t.dispatchesTab, icon: <Icons.Truck size={18} /> },
            { id: 'inquiries', label: t.inquiriesTab, icon: <Icons.Mail size={18} /> },
            { id: 'users', label: t.usersTab || 'User Management', icon: <Icons.Users size={18} /> },
            { id: 'language', label: lang === 'en' ? 'Language Manager' : 'Yore me Leb', icon: <Icons.Globe size={18} /> },
            { id: 'manual', label: lang === 'en' ? '📖 Training Manual Manager' : '📖 Training Manual Manager', icon: null },
            { id: 'chatbot', label: lang === 'en' ? '🤖 Chatbot Manager' : '🤖 Chatbot Manager', icon: null },
            { id: 'slides', label: lang === 'en' ? '🖼️ Banner Slides Manager' : '🖼️ Banner Slides Manager', icon: null }
          ].filter(tab => {
            if (tab.id === 'users') return user.username.toLowerCase() === 'admin';
            if (tab.id === 'manual' && settings.hideManual && user.username.toLowerCase() !== 'admin') return false;
            if (user.username.toLowerCase() === 'admin') return true;
            const allowed = user.permissions || ['prices', 'deliveries', 'dispatches', 'inquiries', 'manual', 'chatbot'];
            return allowed.includes(tab.id);
          }).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
          
          {user.username.toLowerCase() === 'admin' && (
            <button 
              type="button" 
              onClick={handleResetDb} 
              className="btn-tab"
              style={{
                marginLeft: 'auto',
                border: '1px solid rgba(217, 4, 41, 0.2)',
                background: 'transparent',
                color: '#d90429'
              }}
            >
              <Icons.Calendar size={14} />
              <span>{t.resetDb}</span>
            </button>
          )}
        </div>

        {/* Tab Contents */}
        <div className="dashboard-panel-card">
          
          {activeTab === 'prices' && (
            /* Price Manager Tab */
            <div>
              <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '20px' }}>
                {t.pricesTab}
              </h3>
              
              {editingCrop ? (
                /* Edit Price Form */
                <form onSubmit={handleSavePrice} className="glass-panel" style={{ padding: '24px', backgroundColor: '#faf9f6', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <h4 style={{ color: 'var(--color-primary-dark)', fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icons.Wheat size={18} />
                    {t.edit}: {crops[editingCrop]?.name}
                  </h4>
                  
                  <div className="form-row-responsive" style={{ marginBottom: '16px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="edit-rate" style={{ color: 'var(--color-primary-dark)' }}>{t.currentRate}</label>
                      <input
                        type="number"
                        id="edit-rate"
                        name="rate"
                        className="form-input"
                        value={editRate}
                        onChange={(e) => setEditRate(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                        required
                      />
                    </div>
                    
                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="edit-moisture" style={{ color: 'var(--color-primary-dark)' }}>{t.moistureTarget}</label>
                      <input
                        type="text"
                        id="edit-moisture"
                        name="moisture"
                        className="form-input"
                        value={editMoisture}
                        onChange={(e) => setEditMoisture(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="edit-guide" style={{ color: 'var(--color-primary-dark)' }}>{t.gradingRules}</label>
                    <textarea
                      id="edit-guide"
                      name="guide"
                      className="form-input"
                      value={editGuide}
                      onChange={(e) => setEditGuide(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', minHeight: '80px' }}
                      required
                    ></textarea>
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label htmlFor="edit-tips" style={{ color: 'var(--color-primary-dark)' }}>{t.dryingTips}</label>
                    <textarea
                      id="edit-tips"
                      name="tips"
                      className="form-input"
                      value={editTips}
                      onChange={(e) => setEditTips(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', minHeight: '80px' }}
                      required
                    ></textarea>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px' }}>
                      <Icons.CheckCircle size={16} />
                      {t.save}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setEditingCrop(null)} style={{ padding: '10px 20px' }}>
                      {t.cancel}
                    </button>
                  </div>
                </form>
              ) : (
                /* Crop Pricing Grid */
                <div className="table-container-responsive">
                  <table>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                        <th style={{ padding: '16px 20px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)' }}>{t.cropName}</th>
                        <th style={{ padding: '16px 20px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)' }}>{t.currentRate}</th>
                        <th style={{ padding: '16px 20px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)' }}>{t.moistureTarget}</th>
                        <th style={{ padding: '16px 20px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)' }}>{t.gradingRules}</th>
                        <th style={{ padding: '16px 20px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)', textAlign: 'center' }}>{t.action}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(crops).map(crop => (
                        <tr key={crop.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', verticalAlign: 'top' }}>
                          <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{crop.name}</td>
                          <td style={{ padding: '16px 20px', color: 'var(--color-primary-light)', fontWeight: 800 }}>{crop.payoutRate}</td>
                          <td style={{ padding: '16px 20px', color: 'rgba(0,0,0,0.8)' }}>{crop.moisture}</td>
                          <td style={{ padding: '16px 20px', color: 'var(--color-text-light)', fontSize: '0.85rem', maxWidth: '300px', lineHeight: 1.4 }}>{crop.gradingGuide}</td>
                          <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                            <button
                              className="btn btn-outline"
                              onClick={() => handleEditPrice(crop)}
                              style={{ display: 'inline-flex', padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
                            >
                              <Icons.Coffee size={14} />
                              {t.edit}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'deliveries' && (
            /* Deliveries Management Tab */
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
                
                {/* Log Delivery Form */}
                <div className="glass-panel" style={{ padding: '24px', backgroundColor: '#faf9f6', border: '1px solid rgba(0,0,0,0.05)', height: 'fit-content' }}>
                  <h4 style={{ color: 'var(--color-primary-dark)', fontSize: '1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icons.Warehouse size={18} />
                    {t.logDelivery}
                  </h4>
                  
                  {logSuccess && (
                    <div style={{ padding: '10px 14px', backgroundColor: 'rgba(82, 183, 136, 0.15)', borderLeft: '4px solid var(--color-accent)', borderRadius: '6px', color: '#1b4332', fontSize: '0.85rem', marginBottom: '16px' }}>
                      {logSuccess}
                    </div>
                  )}
                  {logError && (
                    <div style={{ padding: '10px 14px', backgroundColor: 'rgba(217, 4, 41, 0.15)', borderLeft: '4px solid #d90429', borderRadius: '6px', color: '#680000', fontSize: '0.85rem', marginBottom: '16px' }}>
                      {logError}
                    </div>
                  )}

                  <form onSubmit={handleLogDelivery} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group">
                      <label htmlFor="log-farmer">{t.selectFarmer}</label>
                      <select
                        id="log-farmer"
                        name="farmer"
                        className="form-input"
                        value={logClient}
                        onChange={(e) => setLogClient(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                        required
                      >
                        <option value="">-- {t.selectFarmer} --</option>
                        {clients.map(c => (
                          <option key={c.username} value={c.username}>{c.name} ({c.district})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="log-crop">{t.selectCrop}</label>
                      <select
                        id="log-crop"
                        name="crop"
                        className="form-input"
                        value={logCrop}
                        onChange={(e) => setLogCrop(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      >
                        {Object.values(crops).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-row-responsive">
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="log-weight">{t.weightKg}</label>
                        <input
                          type="number"
                          id="log-weight"
                          name="weight"
                          className="form-input"
                          placeholder="e.g. 500"
                          value={logWeight}
                          onChange={(e) => setLogWeight(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                          required
                        />
                      </div>
                      
                      <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="log-grade">{t.qualityGrade}</label>
                        <select
                          id="log-grade"
                          name="grade"
                          className="form-input"
                          value={logGrade}
                          onChange={(e) => setLogGrade(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                        >
                          <option value="A">{t.gradeA}</option>
                          <option value="B">{t.gradeB}</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                      <Icons.CheckCircle size={16} />
                      {t.submitReceipt}
                    </button>
                  </form>
                </div>

                {/* Deliveries Logs List */}
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: 'var(--color-primary-dark)', fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>
                    {t.deliveriesTab} ({deliveries.length})
                  </h4>
                  <div className="table-container-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    <table>
                      <thead>
                        <tr style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                          <th style={{ padding: '12px 14px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{t.date}</th>
                          <th style={{ padding: '12px 14px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{t.farmer}</th>
                          <th style={{ padding: '12px 14px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{t.crop}</th>
                          <th style={{ padding: '12px 14px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-dark)', textAlign: 'right' }}>{t.weight}</th>
                          <th style={{ padding: '12px 14px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-dark)', textAlign: 'center' }}>{t.grade}</th>
                          <th style={{ padding: '12px 14px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-dark)', textAlign: 'right' }}>{t.payout}</th>
                          <th style={{ padding: '12px 14px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-dark)', textAlign: 'center' }}>{t.status}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveries.map(del => (
                          <tr key={del.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <td style={{ padding: '12px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{del.date}</td>
                            <td style={{ padding: '12px 14px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{del.farmerName}</td>
                            <td style={{ padding: '12px 14px', fontSize: '0.8rem' }}>{del.cropName}</td>
                            <td style={{ padding: '12px 14px', fontSize: '0.8rem', textAlign: 'right', fontWeight: 700 }}>{del.weight.toLocaleString()} kg</td>
                            <td style={{ padding: '12px 14px', fontSize: '0.8rem', textAlign: 'center' }}>
                              <span style={{
                                padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                                backgroundColor: del.grade === 'A' ? 'rgba(82, 183, 136, 0.15)' : 'rgba(233, 196, 106, 0.15)',
                                color: del.grade === 'A' ? '#1b4332' : '#b07d03'
                              }}>
                                {del.grade}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', fontSize: '0.8rem', textAlign: 'right', fontWeight: 800, color: 'var(--color-primary-light)' }}>
                              {del.payout.toLocaleString()}
                            </td>
                            <td style={{ padding: '12px 14px', fontSize: '0.8rem', textAlign: 'center' }}>
                              {del.status === 'Completed' ? (
                                <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>Paid</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleMobileMoneyPayout(del)}
                                  disabled={payingId === del.id}
                                  style={{
                                    padding: '4px 8px', background: 'var(--color-secondary)', color: 'var(--color-primary-dark)',
                                    border: 'none', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, cursor: payingId === del.id ? 'not-allowed' : 'pointer',
                                    opacity: payingId === del.id ? 0.6 : 1
                                  }}
                                >
                                  {payingId === del.id ? 'Disbursing...' : 'Pay Mobile Money'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'dispatches' && (
            /* Transit Requests Tab */
            <div>
              <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '20px' }}>
                {t.dispatchesTab}
              </h3>
              
              <div className="table-container-responsive">
                <table>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                      <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{t.date}</th>
                      <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{t.farmer}</th>
                      <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{t.crop}</th>
                      <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)', textAlign: 'right' }}>{t.weight}</th>
                      <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{t.location}</th>
                      <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{t.scheduledDate}</th>
                      <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{t.notes}</th>
                      <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)', textAlign: 'center' }}>{t.status}</th>
                      <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)', textAlign: 'center' }}>{t.action}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispatches.map(disp => (
                      <tr key={disp.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', verticalAlign: 'top' }}>
                        <td style={{ padding: '14px 16px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{disp.id}</td>
                        <td style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{disp.farmerName}</td>
                        <td style={{ padding: '14px 16px', fontSize: '0.8rem' }}>{disp.cropName}</td>
                        <td style={{ padding: '14px 16px', fontSize: '0.8rem', textAlign: 'right', fontWeight: 700 }}>{disp.weight.toLocaleString()} kg</td>
                        <td style={{ padding: '14px 16px', fontSize: '0.8rem', maxWidth: '180px', lineHeight: 1.4 }}>{disp.location}</td>
                        <td style={{ padding: '14px 16px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{disp.date}</td>
                        <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--color-text-light)', maxWidth: '200px', lineHeight: 1.4 }}>{disp.notes || '-'}</td>
                        <td style={{ padding: '14px 16px', fontSize: '0.8rem', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                            backgroundColor: disp.status === 'Completed' ? 'rgba(82, 183, 136, 0.15)' : (disp.status === 'Scheduled' ? 'rgba(233, 196, 106, 0.15)' : (disp.status === 'Cancelled' ? 'rgba(217, 4, 41, 0.15)' : 'rgba(0,0,0,0.05)')),
                            color: disp.status === 'Completed' ? '#1b4332' : (disp.status === 'Scheduled' ? '#b07d03' : (disp.status === 'Cancelled' ? '#d90429' : '#000'))
                          }}>
                            {disp.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {disp.status === 'Pending' && (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleApproveDispatch(disp.id)}
                                className="btn btn-outline"
                                style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'var(--color-accent)', color: '#1b4332' }}
                              >
                                {t.approve}
                              </button>
                              <button
                                onClick={() => handleCancelDispatch(disp.id)}
                                style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'transparent', border: '1px solid #d90429', color: '#d90429', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                              >
                                {t.cancelBtn}
                              </button>
                            </div>
                          )}
                          {disp.status === 'Scheduled' && (
                            <button
                              onClick={() => handleCompleteDispatch(disp.id)}
                              className="btn btn-primary"
                              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                            >
                              {t.complete}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'inquiries' && (
            /* Inquiry Inbox Tab */
            <div>
              <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '20px' }}>
                {t.inquiriesTab} ({inquiries.length})
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {inquiries.map(inq => (
                  <div
                    key={inq.id}
                    className="glass-panel"
                    style={{
                      padding: '20px 24px',
                      backgroundColor: inq.status === 'Unread' ? 'rgba(233,196,106,0.04)' : '#faf9f6',
                      borderLeft: inq.status === 'Unread' ? '4px solid var(--color-secondary)' : '1px solid rgba(0,0,0,0.06)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '16px'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{inq.name}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>({inq.date})</span>
                        <span style={{
                          padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold',
                          backgroundColor: inq.status === 'Unread' ? 'rgba(233, 196, 106, 0.15)' : 'rgba(0,0,0,0.05)',
                          color: inq.status === 'Unread' ? '#b07d03' : 'rgba(0,0,0,0.6)'
                        }}>
                          {inq.status}
                        </span>
                      </div>
                      
                      <p style={{ margin: '0 0 10px', fontSize: '0.8rem', color: 'var(--color-primary-light)' }}>
                        <strong>Email:</strong> {inq.email} | <strong>Phone:</strong> {inq.phone}
                      </p>
                      
                      <p style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                        Subject: {inq.subject}
                      </p>
                      
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-dark)', lineHeight: 1.4 }}>
                        {inq.message}
                      </p>
                    </div>
                    
                    <button
                      className="btn btn-outline"
                      onClick={() => handleToggleInquiryStatus(inq.id, inq.status)}
                      style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '6px' }}
                    >
                      {inq.status === 'Unread' ? <Icons.CheckCircle size={14} /> : <Icons.Mail size={14} />}
                      {inq.status === 'Unread' ? t.markRead : t.markUnread}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            /* User Management Tab */
            <div>
              {/* Center Admin Activity Alerts Panel */}
              {user.username.toLowerCase() === 'admin' && (
                <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', background: '#ffffff', border: '1.5px solid rgba(82, 183, 136, 0.3)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#d90429', display: 'inline-block', animation: 'wa-pulse 1.5s infinite' }}></span>
                      <h4 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Center Admin Activity Alerts
                      </h4>
                    </div>
                    <button 
                      onClick={async () => {
                        const alertsData = await getAlerts();
                        setSystemAlerts(alertsData || []);
                      }}
                      className="btn btn-outline"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      🔄 Refresh
                    </button>
                  </div>
                  
                  {systemAlerts.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-light)', fontStyle: 'italic' }}>
                      No signups or login activities recorded yet.
                    </p>
                  ) : (
                    <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {systemAlerts.map(alert => (
                        <div key={alert.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 12px', background: '#f8f9fa', borderRadius: '8px', borderLeft: alert.type.startsWith('signup') ? '4px solid #52b788' : '4px solid #f4a261' }}>
                          <span style={{ fontSize: '1.1rem' }}>
                            {alert.type.startsWith('signup') ? '👤' : '🔑'}
                          </span>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: '#1b4332', fontWeight: 600 }}>
                              {alert.message}
                            </p>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-light)' }}>
                              {new Date(alert.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 700, margin: 0 }}>
                  {t.usersTab || 'User Management'} ({allUsersList.length})
                </h3>
                <button
                  onClick={() => { setMngUserForm(!mngUserForm); setMngSuccess(''); setMngError(''); }}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  <Icons.Users size={16} />
                  {mngUserForm ? (t.cancel || 'Cancel') : 'Create New User'}
                </button>
              </div>

              {mngUserForm && (
                <div className="glass-panel" style={{ padding: '24px', backgroundColor: '#0f3020', border: '2px solid rgba(82,183,136,0.3)', borderRadius: '12px', marginBottom: '24px', color: '#ffffff' }}>
                  <h4 style={{ color: '#ffffff', fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Create New Account</h4>
                  
                  {mngSuccess && <div style={{ padding: '10px', backgroundColor: 'rgba(82, 183, 136, 0.25)', color: '#ffffff', marginBottom: '16px', borderRadius: '6px', fontWeight: 'bold' }}>{mngSuccess}</div>}
                  {mngError && <div style={{ padding: '10px', backgroundColor: 'rgba(217, 4, 41, 0.25)', color: '#ffffff', marginBottom: '16px', borderRadius: '6px', fontWeight: 'bold' }}>{mngError}</div>}

                  <form onSubmit={handleCreateUser} className="form-grid-responsive-2col">
                    <div className="form-group">
                      <label htmlFor="mng-role" style={{ color: '#ffffff', fontWeight: 600 }}>Role</label>
                      <select id="mng-role" name="role" className="form-input" value={mngRole} onChange={(e) => setMngRole(e.target.value)} style={{ backgroundColor: '#081c15', color: '#ffffff', border: '1px solid rgba(82,183,136,0.3)' }}>
                        <option value="client">Farmer / Client</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="mng-name" style={{ color: '#ffffff', fontWeight: 600 }}>Full Name</label>
                      <input id="mng-name" name="name" autocomplete="name" className="form-input" required value={mngName} onChange={(e) => setMngName(e.target.value)} style={{ backgroundColor: '#081c15', color: '#ffffff', border: '1px solid rgba(82,183,136,0.3)' }} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="mng-username" style={{ color: '#ffffff', fontWeight: 600 }}>Username</label>
                      <input id="mng-username" name="username" autocomplete="username" className="form-input" required value={mngUsername} onChange={(e) => setMngUsername(e.target.value)} style={{ backgroundColor: '#081c15', color: '#ffffff', border: '1px solid rgba(82,183,136,0.3)' }} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="mng-password" style={{ color: '#ffffff', fontWeight: 600 }}>Password</label>
                      <input id="mng-password" name="password" autocomplete="new-password" type="password" className="form-input" required value={mngPassword} onChange={(e) => setMngPassword(e.target.value)} style={{ backgroundColor: '#081c15', color: '#ffffff', border: '1px solid rgba(82,183,136,0.3)' }} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label htmlFor="mng-phone" style={{ color: '#ffffff', fontWeight: 600 }}>Phone / District (Optional)</label>
                      <input id="mng-phone" name="phone" autocomplete="tel" className="form-input" value={mngPhone} onChange={(e) => setMngPhone(e.target.value)} placeholder="+256... Lira" style={{ backgroundColor: '#081c15', color: '#ffffff', border: '1px solid rgba(82,183,136,0.3)' }} />
                    </div>

                    {mngRole === 'admin' && (
                      <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '6px' }}>
                        <label style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.85rem' }}>Allowed Editors (Permissions)</label>
                        <div style={{ display: 'flex', gap: '10px 14px', flexWrap: 'wrap', marginTop: '6px', background: 'rgba(0,0,0,0.2)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(82,183,136,0.2)' }}>
                          {[
                            { id: 'prices', label: 'Prices' },
                            { id: 'deliveries', label: 'Deliveries' },
                            { id: 'dispatches', label: 'Dispatches' },
                            { id: 'inquiries', label: 'FAQs & AI' },
                            { id: 'manual', label: 'Manual' },
                            { id: 'chatbot', label: 'Chatbot' },
                            { id: 'slides', label: 'Slides' },
                            { id: 'language', label: 'Language' }
                          ].map(feat => {
                            const checked = mngPermissions.includes(feat.id);
                            return (
                              <label key={feat.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', color: '#ffffff' }}>
                                <input 
                                  type="checkbox" 
                                  checked={checked} 
                                  onChange={(e) => {
                                    const newPerms = e.target.checked 
                                      ? [...mngPermissions, feat.id] 
                                      : mngPermissions.filter(x => x !== feat.id);
                                    setMngPermissions(newPerms);
                                  }}
                                />
                                {feat.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                      <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
                        <Icons.CheckCircle size={16} />
                        Save User
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="table-container-responsive">
                <table>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                      <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>Username</th>
                      <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>Name</th>
                      <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>Role</th>
                      <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>Status</th>
                      <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>Details</th>
                      <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsersList.map(u => (
                      <tr key={u.username} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700 }}>{u.username}</td>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>{u.name}</td>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                            backgroundColor: u.role === 'admin' ? 'rgba(217, 4, 41, 0.15)' : 'rgba(82, 183, 136, 0.15)',
                            color: u.role === 'admin' ? '#d90429' : '#1b4332'
                          }}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                            backgroundColor: u.status === 'suspended' ? 'rgba(217, 4, 41, 0.15)' : 'rgba(82, 183, 136, 0.15)',
                            color: u.status === 'suspended' ? '#d90429' : '#1b4332'
                          }}>
                            {u.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                          <div>{u.phone} {u.district ? `· ${u.district}` : ''}</div>
                          {u.role === 'admin' && u.username.toLowerCase() !== 'admin' && (
                            <div style={{ marginTop: '8px', borderTop: '1px dotted rgba(0,0,0,0.1)', paddingTop: '6px' }}>
                              <p style={{ margin: '0 0 4px', fontWeight: 'bold', fontSize: '0.72rem', color: 'var(--color-primary-dark)' }}>Allowed Editors:</p>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {[
                                  { id: 'prices', label: 'Prices' },
                                  { id: 'deliveries', label: 'Deliveries' },
                                  { id: 'dispatches', label: 'Dispatches' },
                                  { id: 'inquiries', label: 'FAQs & AI' },
                                  { id: 'manual', label: 'Manual' },
                                  { id: 'chatbot', label: 'Chatbot' },
                                  { id: 'slides', label: 'Slides' },
                                  { id: 'language', label: 'Language' }
                                ].map(feat => {
                                  const allowed = u.permissions || ['prices', 'deliveries', 'dispatches', 'inquiries', 'manual', 'chatbot'];
                                  const checked = allowed.includes(feat.id);
                                  return (
                                    <label key={feat.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', cursor: 'pointer', color: '#000' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={checked} 
                                        onChange={(e) => {
                                          const newPerms = e.target.checked 
                                            ? [...allowed, feat.id] 
                                            : allowed.filter(x => x !== feat.id);
                                          handleUpdateUserPermissions(u.username, newPerms);
                                        }}
                                      />
                                      {feat.label}
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleToggleUserRole(u.username, u.role)}
                              className="btn btn-outline"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                              disabled={u.username === user.username}
                            >
                              {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(u.username, u.status)}
                              className="btn btn-outline"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: u.status === 'suspended' ? '#1b4332' : '#f77f00', color: u.status === 'suspended' ? '#1b4332' : '#f77f00' }}
                              disabled={u.username === user.username}
                            >
                              {u.status === 'suspended' ? 'Activate' : 'Suspend'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.username)}
                              className="btn btn-outline"
                              style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: '#d90429', color: '#d90429' }}
                              disabled={u.username === user.username}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Language Manager Tab */}
          {activeTab === 'language' && (() => {
            const currentTranslations = getLangMgrTranslations();
            const langKeys = Object.keys(currentTranslations.en || {});
            const filteredKeys = langMgrSearch
              ? langKeys.filter(k => 
                  k.toLowerCase().includes(langMgrSearch.toLowerCase()) ||
                  (currentTranslations.en?.[k] || '').toLowerCase().includes(langMgrSearch.toLowerCase())
                )
              : langKeys;

            return (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 700, margin: 0 }}>
                      {lang === 'en' ? '🌐 Language Manager' : '🌐 Yore me Leb'}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginTop: '4px' }}>
                      {lang === 'en'
                        ? 'Edit any text shown on the website. Changes apply live across the entire site immediately.'
                        : 'Lok lok me website ducu. Lok me weko tye cutcut i website ducu.'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleLangMgrReset}
                      className="btn btn-outline"
                      style={{ padding: '8px 14px', fontSize: '0.8rem', borderColor: '#d90429', color: '#d90429' }}
                    >
                      <Icons.Calendar size={14} />
                      Reset to Defaults
                    </button>
                    <button
                      type="button"
                      onClick={handleLangMgrSave}
                      className="btn btn-primary"
                      style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                      disabled={Object.keys(langMgrEdits).length === 0}
                    >
                      <Icons.CheckCircle size={16} />
                      {Object.keys(langMgrEdits).length > 0
                        ? `Save ${Object.keys(langMgrEdits).length} Change(s)`
                        : 'No Changes Yet'}
                    </button>
                  </div>
                </div>

                {langMgrSaved && (
                  <div style={{
                    backgroundColor: 'rgba(82, 183, 136, 0.15)',
                    border: '1px solid rgba(82,183,136,0.4)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#1b4332',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}>
                    <Icons.CheckCircle size={18} />
                    {lang === 'en' ? '✅ Translations saved! The website text has been updated.' : '✅ Lok ocopo maber! Lok me website ocopo.'}
                  </div>
                )}

                {/* Breaking News Marquee Manager */}
                <div className="card" style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(82, 183, 136, 0.35)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                }}>
                  <h4 style={{ color: 'var(--color-primary-dark)', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📢</span> {lang === 'en' ? 'Breaking News Marquee Manager' : '📢 Nyen me Marquee Manager'}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                    {lang === 'en'
                      ? 'Edit the scrolling announcement bar shown below the navbar. Use placeholders {sunflowerPrice}, {coffeePrice}, {maizePrice}, and {beansPrice} to insert live database prices dynamically.'
                      : 'Lok lok me breaking news marquee. Icopo tic kede placeholders macalo {sunflowerPrice}, {coffeePrice} pi wel dynamic.'}
                  </p>
                  
                  {tickerSavedMsg && (
                    <div style={{
                      backgroundColor: 'rgba(82, 183, 136, 0.15)',
                      border: '1px solid rgba(82,183,136,0.3)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      marginBottom: '16px',
                      fontSize: '0.82rem',
                      color: '#1b4332',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Icons.CheckCircle size={16} />
                      {lang === 'en' ? '✅ Breaking News Marquee updated successfully!' : '✅ Marquee okere maber!'}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                        🇬🇧 English Ticker Text
                      </label>
                      <textarea
                        rows={2}
                        className="form-input"
                        placeholder="Enter English news text..."
                        value={tickerEn}
                        onChange={e => setTickerEn(e.target.value)}
                        style={{ fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                        🇺🇬 Luo (Acholi/Lango) Ticker Text
                      </label>
                      <textarea
                        rows={2}
                        className="form-input"
                        placeholder="Enter Luo news text..."
                        value={tickerLuo}
                        onChange={e => setTickerLuo(e.target.value)}
                        style={{ fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSaveTicker}
                        disabled={isSavingTicker}
                        style={{ padding: '8px 18px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Icons.CheckCircle size={14} />
                        {isSavingTicker ? 'Saving...' : 'Update Marquee Text'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Controls: language selector + search */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['en', 'luo'].map(l => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => { setLangMgrLang(l); setLangMgrEdits({}); }}
                        className={`btn-tab ${langMgrLang === l ? 'active' : ''}`}
                        style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                      >
                        {l === 'en' ? '🇬🇧 English' : '🇺🇬 Luo'}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder={lang === 'en' ? 'Search keys or values...' : 'Nongo lok...'}
                    value={langMgrSearch}
                    onChange={e => setLangMgrSearch(e.target.value)}
                    className="form-input"
                    style={{ maxWidth: '260px', fontSize: '0.85rem', padding: '8px 12px' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                    Showing {filteredKeys.length} of {langKeys.length} strings
                  </span>
                </div>

                {/* Translation rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
                  {filteredKeys.map(key => {
                    const originalValue = currentTranslations[langMgrLang]?.[key] || '';
                    const editedValue = langMgrEdits[key] !== undefined ? langMgrEdits[key] : originalValue;
                    const isDirty = langMgrEdits[key] !== undefined && langMgrEdits[key] !== originalValue;

                    // Section color coding based on key prefix
                    const sectionColor = key.startsWith('nav') ? '#3a86ff'
                      : key.startsWith('hero') || key.startsWith('stat') || key.startsWith('float') ? '#8338ec'
                      : key.startsWith('about') || key.startsWith('mission') || key.startsWith('vision') || key.startsWith('pillar') ? '#fb5607'
                      : key.startsWith('service') ? '#ff006e'
                      : key.startsWith('calc') ? '#06d6a0'
                      : key.startsWith('contact') || key.startsWith('office') || key.startsWith('form') || key.startsWith('faq') ? '#ffbe0b'
                      : '#adb5bd';

                    return (
                      <div
                        key={key}
                        style={{
                          backgroundColor: isDirty ? 'rgba(233,196,106,0.08)' : '#fff',
                          border: isDirty ? '1px solid rgba(233,196,106,0.5)' : '1px solid rgba(0,0,0,0.06)',
                          borderRadius: '8px',
                          padding: '12px 14px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            backgroundColor: sectionColor + '20',
                            color: sectionColor,
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>{key}</span>
                          {isDirty && (
                            <span style={{ fontSize: '0.7rem', color: '#f4a261', fontWeight: 600 }}>● Modified</span>
                          )}
                          {isDirty && (
                            <button
                              type="button"
                              onClick={() => {
                                setLangMgrEdits(prev => {
                                  const next = { ...prev };
                                  delete next[key];
                                  return next;
                                });
                              }}
                              style={{ fontSize: '0.7rem', color: '#d90429', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}
                            >
                              ✕ Undo
                            </button>
                          )}
                        </div>
                        <textarea
                          value={editedValue}
                          onChange={e => handleLangMgrChange(key, e.target.value)}
                          rows={editedValue.length > 80 ? 3 : 1}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            fontSize: '0.85rem',
                            borderRadius: '6px',
                            border: isDirty ? '1.5px solid var(--color-secondary)' : '1px solid rgba(0,0,0,0.12)',
                            resize: 'vertical',
                            backgroundColor: isDirty ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.01)',
                            fontFamily: 'inherit',
                            color: 'var(--color-primary-dark)',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Sticky save footer */}
                {Object.keys(langMgrEdits).length > 0 && (
                  <div style={{
                    position: 'sticky',
                    bottom: 0,
                    backgroundColor: '#fff',
                    borderTop: '1px solid rgba(0,0,0,0.1)',
                    padding: '14px 0',
                    marginTop: '16px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center'
                  }}>
                    <button
                      type="button"
                      onClick={handleLangMgrSave}
                      className="btn btn-primary"
                    >
                      <Icons.CheckCircle size={16} />
                      Save {Object.keys(langMgrEdits).length} Change(s) to Website
                    </button>
                    <button
                      type="button"
                      onClick={() => setLangMgrEdits({})}
                      className="btn btn-outline"
                    >
                      Discard All Changes
                    </button>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginLeft: 'auto' }}>
                      {lang === 'en' ? 'Changes are saved immediately to localStorage and will appear live on the site.' : 'Lok ocopo cutcut i localStorage kede neno bino i website cutcut.'}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

        </div>

          {/* ── Training Manual Manager Tab ───────────────────────────────── */}
          {activeTab === 'manual' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 700, margin: 0 }}>
                    📖 Training Manual Manager
                  </h3>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', marginTop: '4px', marginBottom: 0 }}>
                    Customize the 14 crop production training stages, write NARO advice, and upload custom photos.
                  </p>
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(82, 183, 136, 0.08)', border: '1px solid rgba(82, 183, 136, 0.2)', padding: '16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary-dark)', fontSize: '0.9rem', display: 'block' }}>Hiding/Visibility Settings</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-light)' }}>Toggle whether the training manual section is visible to website visitors.</span>
                </div>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--color-primary-dark)' }}>
                  <input 
                    type="checkbox" 
                    checked={settings.hideManual} 
                    onChange={async (e) => {
                      const updatedVal = e.target.checked;
                      const res = await saveSettings({ hideManual: updatedVal });
                      if (res) {
                        setSettings(res);
                        localStorage.setItem('jeroma_settings', JSON.stringify(res));
                        window.dispatchEvent(new CustomEvent('settings-updated'));
                      }
                    }}
                  />
                  Hide Training Manual
                </label>
              </div>

              {stageSuccess && (
                <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', color: '#065f46', fontWeight: 600, fontSize: '0.875rem' }}>
                  ✅ {stageSuccess}
                </div>
              )}
              {stageError && (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', color: '#991b1b', fontWeight: 600, fontSize: '0.875rem' }}>
                  ⚠️ {stageError}
                </div>
              )}

              {/* Edit Stage Form */}
              {editingStage ? (() => {
                const currentStage = manualStages.find(s => s.id === editingStage);
                return (
                  <form onSubmit={handleSaveManualStage} style={{ background: '#f0fdf4', border: '1.5px solid rgba(82,183,136,0.3)', borderRadius: '12px', padding: '24px', marginBottom: '28px' }}>
                    <h4 style={{ color: '#065f46', fontWeight: 700, fontSize: '1rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      ✏️ Edit Phase {currentStage?.num}: {stageTitleEn}
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                      {/* Title EN */}
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Title (English) <span style={{ color: '#d90429' }}>*</span></label>
                        <input className="form-input" type="text" value={stageTitleEn} onChange={e => setStageTitleEn(e.target.value)} placeholder="Phase title in English" style={{ width: '100%', boxSizing: 'border-box' }} required />
                      </div>
                      
                      {/* Title Luo */}
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Title (Luo/Acholi)</label>
                        <input className="form-input" type="text" value={stageTitleLuo} onChange={e => setStageTitleLuo(e.target.value)} placeholder="Phase title in Luo" style={{ width: '100%', boxSizing: 'border-box' }} />
                      </div>

                      {/* Subtitle EN */}
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Subtitle (English) <span style={{ color: '#d90429' }}>*</span></label>
                        <input className="form-input" type="text" value={stageSubtitleEn} onChange={e => setStageSubtitleEn(e.target.value)} placeholder="Subtitle in English" style={{ width: '100%', boxSizing: 'border-box' }} required />
                      </div>

                      {/* Subtitle Luo */}
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Subtitle (Luo/Acholi)</label>
                        <input className="form-input" type="text" value={stageSubtitleLuo} onChange={e => setStageSubtitleLuo(e.target.value)} placeholder="Subtitle in Luo" style={{ width: '100%', boxSizing: 'border-box' }} />
                      </div>

                      {/* Image Path and Device Upload */}
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Photo / Video URL or Path</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input className="form-input" type="text" value={stageImage} onChange={e => setStageImage(e.target.value)} placeholder="/sunflower_field.webp" style={{ flex: 1, boxSizing: 'border-box' }} />
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{ padding: '8px 14px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                              onClick={() => document.getElementById('manual-stage-file-input').click()}
                              disabled={isManualUploading}
                            >
                              📁 {isManualUploading ? 'Uploading...' : 'Upload Photo/Video'}
                            </button>
                            <input
                              id="manual-stage-file-input"
                              type="file"
                              accept="image/*,video/*"
                              onChange={handleManualImageUpload}
                              style={{ display: 'none' }}
                            />
                          </div>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '4px' }}>Upload a photo or video directly from your device, or input a public path.</p>
                      </div>

                      {/* Points List */}
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Description Points (One point per line)</label>
                        <textarea className="form-input" value={stagePointsText} onChange={e => setStagePointsText(e.target.value)} placeholder="Point 1&#10;Point 2&#10;Point 3..." rows={5} style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }} required />
                      </div>

                      {/* NARO Advice Callout */}
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>NARO Technical Advice / Advisory callout (Optional)</label>
                        <textarea className="form-input" value={stageNaroAdvice} onChange={e => setStageNaroAdvice(e.target.value)} placeholder="NARO recommendations for this stage..." rows={3} style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button type="submit" className="btn btn-primary" style={{ padding: '10px 22px' }}>
                        <Icons.CheckCircle size={16} />
                        Save Changes
                      </button>
                      <button type="button" className="btn btn-outline" onClick={cancelEditManualStage} style={{ padding: '10px 22px' }}>Cancel</button>
                    </div>
                  </form>
                );
              })() : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {manualStages.map((stage) => (
                    <div key={stage.id} style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      background: '#ffffff', borderRadius: '12px',
                      padding: '14px 18px', border: '1.5px solid rgba(82,183,136,0.2)',
                      flexWrap: 'wrap'
                    }}>
                      {/* Thumbnail */}
                      <div style={{
                        width: '72px', height: '52px', borderRadius: '8px', overflow: 'hidden',
                        flexShrink: 0, border: '2px solid rgba(82,183,136,0.3)', background: '#f4faf6'
                      }}>
                        <img src={stage.image} alt={stage.title_en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{
                            background: 'rgba(82,183,136,0.2)', color: '#1b4332',
                            fontSize: '0.7rem', fontWeight: 800,
                            padding: '2px 8px', borderRadius: '20px'
                          }}>Phase {stage.num}</span>
                        </div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-primary-dark)', lineHeight: 1.3 }}>
                          {stage.title_en} {stage.title_luo ? ` / ${stage.title_luo}` : ''}
                        </p>
                        <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--color-text-light)', lineHeight: 1.4 }}>
                          {stage.subtitle_en}
                        </p>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => openEditManualStage(stage)}
                          className="btn btn-primary"
                          style={{
                            padding: '6px 14px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700
                          }}
                        >
                          ✏️ Edit Phase
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Chatbot Manager Tab ─────────────────────────────────────── */}
          {activeTab === 'chatbot' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 700, margin: 0 }}>
                    🤖 Chatbot Manager
                  </h3>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', marginTop: '4px', marginBottom: 0 }}>
                    Control everything Jeromy AI says and does on your website.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={handleCbReset} className="btn btn-outline" style={{ fontSize: '0.8rem' }}>Reset Defaults</button>
                  <button type="button" onClick={handleCbSave} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
                    <Icons.CheckCircle size={15} />
                    {cbSaved ? '✅ Saved!' : 'Save All Changes'}
                  </button>
                </div>
              </div>

              {/* Enable / Disable Toggle */}
              <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-primary-dark)', fontSize: '0.95rem' }}>Chatbot Visibility</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '3px' }}>
                    {cbConfig.enabled ? '🟢 Chatbot is currently VISIBLE to all visitors.' : '🔴 Chatbot is HIDDEN from the website.'}
                  </p>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: cbConfig.enabled ? 'var(--color-accent)' : '#999' }}>
                    {cbConfig.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <div
                    onClick={() => setCbConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                    style={{
                      width: '52px', height: '28px', borderRadius: '14px', cursor: 'pointer', position: 'relative',
                      background: cbConfig.enabled ? 'var(--color-accent)' : '#ccc',
                      transition: 'background 0.3s'
                    }}
                  >
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: '3px', transition: 'left 0.3s',
                      left: cbConfig.enabled ? '27px' : '3px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                    }} />
                  </div>
                </label>
              </div>

              {/* Greeting Message */}
              <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '8px', fontSize: '0.95rem' }}>
                  💬 Greeting Message
                </label>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: '10px', marginTop: 0 }}>
                  This is what Jeromy says when a visitor first opens the chat.
                </p>
                <textarea
                  rows={4}
                  value={cbConfig.greeting}
                  onChange={e => setCbConfig(prev => ({ ...prev, greeting: e.target.value }))}
                  style={{
                    width: '100%', borderRadius: '10px', border: '1.5px solid rgba(27,67,50,0.15)',
                    padding: '10px 14px', fontSize: '0.875rem', fontFamily: 'var(--font-body)',
                    color: 'var(--color-text-dark)', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                    lineHeight: 1.5, background: '#fafaf9'
                  }}
                />
              </div>

              {/* Quick Reply Chips */}
              <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '8px', fontSize: '0.95rem' }}>
                  ⚡ Quick Reply Buttons
                </label>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: '14px', marginTop: 0 }}>
                  These buttons appear on first open to help visitors ask common questions quickly.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                  {cbConfig.quickReplies.map((chip, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'var(--color-primary-ultra-light)', border: '1.5px solid rgba(27,67,50,0.15)',
                      borderRadius: '50px', padding: '5px 12px 5px 14px', fontSize: '0.8rem',
                      color: 'var(--color-primary)', fontWeight: 600
                    }}>
                      <span>{chip}</span>
                      <button
                        type="button"
                        onClick={() => removeCbChip(i)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d90429', fontSize: '1rem', lineHeight: 1, padding: '0 2px' }}
                        title="Remove"
                      >×</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={cbNewChip}
                    onChange={e => setCbNewChip(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCbChip())}
                    placeholder="Type a new quick reply and press Add..."
                    style={{
                      flex: 1, borderRadius: '10px', border: '1.5px solid rgba(27,67,50,0.15)',
                      padding: '9px 14px', fontSize: '0.875rem', fontFamily: 'var(--font-body)',
                      outline: 'none', background: '#fafaf9', color: 'var(--color-text-dark)'
                    }}
                  />
                  <button type="button" onClick={addCbChip} className="btn btn-primary" style={{ flexShrink: 0, fontSize: '0.85rem' }}>
                    + Add
                  </button>
                </div>
              </div>

              {/* Custom AI Knowledge Notes */}
              <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '8px', fontSize: '0.95rem' }}>
                  🧠 Custom AI Knowledge Notes
                </label>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: '10px', marginTop: 0 }}>
                  Add extra info the AI should know — new services, announcements, price promotions, seasonal closures, etc. This is sent to the AI as additional context.
                </p>
                <textarea
                  rows={6}
                  value={cbConfig.customNotes}
                  onChange={e => setCbConfig(prev => ({ ...prev, customNotes: e.target.value }))}
                  placeholder={'Example:\n• New sesame collection service started July 2025\n• Office closed on public holidays\n• Free soil testing available every Saturday 9AM–12PM\n• New hub opened in Oyam district'}
                  style={{
                    width: '100%', borderRadius: '10px', border: '1.5px solid rgba(27,67,50,0.15)',
                    padding: '10px 14px', fontSize: '0.875rem', fontFamily: 'var(--font-body)',
                    color: 'var(--color-text-dark)', resize: 'vertical', outline: 'none',
                    lineHeight: 1.6, background: '#fafaf9', boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Knowledge Sources (Links) */}
              <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: '4px', fontSize: '0.95rem' }}>
                  🔗 AI Knowledge Sources (Links)
                </label>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: '14px', marginTop: 0, lineHeight: 1.6 }}>
                  Add website URLs (e.g. your company page, a price list, a news article). The AI will read them and use their content to answer visitor questions. Max 5 links.
                </p>

                {/* Existing Links */}
                {(cbConfig.knowledgeLinks || []).length > 0 && (
                  <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(cbConfig.knowledgeLinks || []).map((link, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        background: '#f0faf4', border: '1.5px solid rgba(27,67,50,0.12)',
                        borderRadius: '10px', padding: '10px 14px'
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-primary-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {link.label}
                          </p>
                          <a href={link.url} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: '0.75rem', color: 'var(--color-accent)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                            {link.url}
                          </a>
                        </div>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700, background: 'rgba(82,183,136,0.15)',
                          color: 'var(--color-accent)', padding: '2px 8px', borderRadius: '50px', flexShrink: 0
                        }}>Active</span>
                        <button
                          type="button"
                          onClick={() => removeCbLink(i)}
                          style={{ background: 'rgba(217,4,41,0.08)', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#d90429', padding: '4px 8px', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}
                          title="Remove link"
                        >✕ Remove</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Link Form */}
                {(cbConfig.knowledgeLinks || []).length < 5 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        type="url"
                        value={cbNewLinkUrl}
                        onChange={e => { setCbNewLinkUrl(e.target.value); setCbLinkError(''); }}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCbLink())}
                        placeholder="https://example.com/page"
                        style={{
                          flex: 2, minWidth: '200px', borderRadius: '10px', border: '1.5px solid rgba(27,67,50,0.15)',
                          padding: '9px 14px', fontSize: '0.875rem', fontFamily: 'var(--font-body)',
                          outline: 'none', background: '#fafaf9', color: 'var(--color-text-dark)'
                        }}
                      />
                      <input
                        type="text"
                        value={cbNewLinkLabel}
                        onChange={e => setCbNewLinkLabel(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCbLink())}
                        placeholder="Label (optional)"
                        style={{
                          flex: 1, minWidth: '130px', borderRadius: '10px', border: '1.5px solid rgba(27,67,50,0.15)',
                          padding: '9px 14px', fontSize: '0.875rem', fontFamily: 'var(--font-body)',
                          outline: 'none', background: '#fafaf9', color: 'var(--color-text-dark)'
                        }}
                      />
                      <button type="button" onClick={addCbLink} className="btn btn-primary" style={{ flexShrink: 0, fontSize: '0.85rem' }}>
                        + Add Link
                      </button>
                    </div>
                    {cbLinkError && (
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#d90429', fontWeight: 600 }}>⚠ {cbLinkError}</p>
                    )}
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                      💡 <strong>Tip:</strong> Use publicly accessible URLs — the AI reads them in real-time when someone chats. Avoid pages that require login. <strong>{5 - (cbConfig.knowledgeLinks || []).length}</strong> slot(s) remaining.
                    </p>
                  </div>
                )}
                {(cbConfig.knowledgeLinks || []).length >= 5 && (
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#d90429', fontWeight: 600 }}>Maximum of 5 knowledge links reached. Remove one to add another.</p>
                )}
              </div>

              {/* Save Banner */}
              <div style={{ textAlign: 'right', paddingBottom: '8px' }}>
                <button type="button" onClick={handleCbSave} className="btn btn-primary">
                  <Icons.CheckCircle size={16} />
                  {cbSaved ? '✅ All changes saved to website!' : 'Save All Chatbot Settings'}
                </button>
                {cbSaved && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-accent)', marginTop: '6px', marginBottom: 0 }}>
                    Changes are live immediately — refresh the website to see them.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Slides Manager Tab ─────────────────────────────────────────── */}
          {activeTab === 'slides' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 700, margin: 0 }}>
                  🖼️ {lang === 'en' ? 'Banner Slides Manager' : 'Slides Manager'}
                </h3>
                {!editingSlide && (
                  <button className="btn btn-primary" style={{ fontSize: '0.875rem' }} onClick={openNewSlide}>
                    + {lang === 'en' ? 'Add New Slide' : 'Yabo Slide Manyen'}
                  </button>
                )}
              </div>

              {slidesSuccess && (
                <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', color: '#065f46', fontWeight: 600, fontSize: '0.875rem' }}>
                  ✅ {slidesSuccess}
                </div>
              )}
              {slidesError && (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', color: '#991b1b', fontWeight: 600, fontSize: '0.875rem' }}>
                  ⚠️ {slidesError}
                </div>
              )}

              {/* ── Slide Edit / Add Form ── */}
              {editingSlide && (
                <form onSubmit={handleSaveSlide} style={{ background: '#f0fdf4', border: '1.5px solid rgba(82,183,136,0.3)', borderRadius: '12px', padding: '24px', marginBottom: '28px' }}>
                  <h4 style={{ color: '#065f46', fontWeight: 700, fontSize: '1rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {editingSlide === 'new' ? '➕ Add New Slide' : '✏️ Edit Slide'}
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                    {/* Icon */}
                    <div className="form-group">
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Icon (emoji)</label>
                      <input className="form-input" type="text" value={slideIcon} onChange={e => setSlideIcon(e.target.value)} placeholder="📢" style={{ width: '100%', boxSizing: 'border-box' }} />
                    </div>
                    {/* Image / Video Path */}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Image / Video Path</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input className="form-input" type="text" value={slideImage} onChange={e => setSlideImage(e.target.value)} placeholder="/community_gathering.webp" style={{ flex: 1, boxSizing: 'border-box' }} />
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '8px 14px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                            onClick={() => document.getElementById('slide-file-input').click()}
                            disabled={isUploading}
                          >
                            📁 {isUploading ? 'Uploading...' : 'Upload Photo/Video'}
                          </button>
                          <input
                            id="slide-file-input"
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                          />
                        </div>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '4px' }}>Use paths like /community_gathering.webp or click the button to upload a photo or video from your device.</p>
                    </div>
                    {/* Image Fit */}
                    <div className="form-group">
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Image Fit</label>
                      <select className="form-input" value={slideFit} onChange={e => setSlideFit(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }}>
                        <option value="cover">Cover (fill frame)</option>
                        <option value="contain">Contain (show full image)</option>
                      </select>
                    </div>
                    {/* Tag EN */}
                    <div className="form-group">
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Tag (English)</label>
                      <input className="form-input" type="text" value={slideTagEn} onChange={e => setSlideTagEn(e.target.value)} placeholder="News / Activity / Team" style={{ width: '100%', boxSizing: 'border-box' }} />
                    </div>
                    {/* Tag Acholi */}
                    <div className="form-group">
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Tag (Acholi)</label>
                      <input className="form-input" type="text" value={slideTagAch} onChange={e => setSlideTagAch(e.target.value)} placeholder="Kop Manyen / Ginnipiny" style={{ width: '100%', boxSizing: 'border-box' }} />
                    </div>
                    {/* Title EN */}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Title (English) <span style={{ color: '#d90429' }}>*</span></label>
                      <input className="form-input" type="text" value={slideTitleEn} onChange={e => setSlideTitleEn(e.target.value)} placeholder="Slide headline in English" style={{ width: '100%', boxSizing: 'border-box' }} required />
                    </div>
                    {/* Title Acholi */}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Title (Acholi/Luo)</label>
                      <input className="form-input" type="text" value={slideTitleAch} onChange={e => setSlideTitleAch(e.target.value)} placeholder="Slide headline in Acholi" style={{ width: '100%', boxSizing: 'border-box' }} />
                    </div>
                    {/* Body EN */}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Body Text (English) <span style={{ color: '#d90429' }}>*</span></label>
                      <textarea className="form-input" value={slideBodyEn} onChange={e => setSlideBodyEn(e.target.value)} placeholder="Slide description in English..." rows={3} style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }} required />
                    </div>
                    {/* Body Acholi */}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Body Text (Acholi/Luo)</label>
                      <textarea className="form-input" value={slideBodyAch} onChange={e => setSlideBodyAch(e.target.value)} placeholder="Slide description in Acholi..." rows={3} style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }} />
                    </div>
                  </div>

                  {/* Color notice */}
                  <div style={{ background: '#081c15', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#52b788', flexShrink: 0, display: 'inline-block' }}></span>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#a7f3d0', fontWeight: 600 }}>All slides use Emerald Green (#081c15 background / #52b788 accent) — colors are applied automatically.</p>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '10px 22px' }}>
                      <Icons.CheckCircle size={16} />
                      {editingSlide === 'new' ? 'Add Slide' : 'Save Changes'}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={cancelEditSlide} style={{ padding: '10px 22px' }}>Cancel</button>
                  </div>
                </form>
              )}

              {/* ── Slides List ── */}
              {slides.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-light)' }}>
                  <p style={{ fontSize: '1rem' }}>No slides found. Click "Add New Slide" to create the first one.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {slides.map((slide, idx) => (
                    <div key={slide.id} style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      background: '#081c15', borderRadius: '12px',
                      padding: '14px 18px', border: '1.5px solid rgba(82,183,136,0.2)',
                      flexWrap: 'wrap'
                    }}>
                      {/* Thumbnail */}
                      <div style={{
                        width: '72px', height: '52px', borderRadius: '8px', overflow: 'hidden',
                        flexShrink: 0, border: '2px solid rgba(82,183,136,0.3)', background: '#0d2b1c'
                      }}>
                        {slide.image && (slide.image.endsWith('.mp4') || slide.image.endsWith('.webm') || slide.image.endsWith('.ogg')) ? (
                          <video src={slide.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                        ) : (
                          <img src={slide.image} alt={slide.title_en} style={{ width: '100%', height: '100%', objectFit: slide.fit || 'cover' }} />
                        )}
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '1.1rem' }}>{slide.icon}</span>
                          <span style={{
                            background: 'rgba(82,183,136,0.2)', color: '#52b788',
                            fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em',
                            textTransform: 'uppercase', padding: '2px 8px', borderRadius: '20px'
                          }}>{slide.tag_en}</span>
                          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem' }}>Slide {idx + 1} of {slides.length}</span>
                        </div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: '#ffffff', lineHeight: 1.3 }}>{slide.title_en}</p>
                        <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.4,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {slide.body_en}
                        </p>
                      </div>
                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
                        <button
                          type="button" title="Move Up"
                          onClick={() => handleMoveSlide(slide.id, 'up')}
                          disabled={idx === 0}
                          style={{
                            width: '30px', height: '30px', borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)',
                            color: '#fff', cursor: idx === 0 ? 'not-allowed' : 'pointer',
                            opacity: idx === 0 ? 0.35 : 1, fontSize: '0.8rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>▲</button>
                        <button
                          type="button" title="Move Down"
                          onClick={() => handleMoveSlide(slide.id, 'down')}
                          disabled={idx === slides.length - 1}
                          style={{
                            width: '30px', height: '30px', borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)',
                            color: '#fff', cursor: idx === slides.length - 1 ? 'not-allowed' : 'pointer',
                            opacity: idx === slides.length - 1 ? 0.35 : 1, fontSize: '0.8rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>▼</button>
                        <button
                          type="button"
                          onClick={() => openEditSlide(slide)}
                          style={{
                            padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700,
                            border: '1px solid #52b788', background: 'rgba(82,183,136,0.15)',
                            color: '#52b788', cursor: 'pointer'
                          }}>✏️ Edit</button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSlide(slide.id)}
                          style={{
                            padding: '5px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 700,
                            border: '1px solid rgba(217,4,41,0.4)', background: 'rgba(217,4,41,0.08)',
                            color: '#d90429', cursor: 'pointer'
                          }}>🗑 Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Available images hint */}
              <div style={{ marginTop: '24px', background: '#f0fdf4', border: '1.5px solid rgba(82,183,136,0.2)', borderRadius: '10px', padding: '14px 18px' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-primary-dark)' }}>📁 Available Images (use exact path):</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    '/jeroma_banner_7_districts.jpg', '/farmers_training_1.jpg', '/farmers_training_2.jpg',
                    '/sunflower_field.webp', '/sunflower_close.webp', '/four_men_sunflowers.webp',
                    '/community_gathering.webp', '/women_coop_gathering.webp', '/jeroma_staffs.jpg',
                    '/farmer_woman.webp', '/farmer_man_seedco.webp', '/integrated_farming.jpg',
                    '/jeroma_motorcycle_transit.webp', '/jeroma_processing_factory.webp',
                    '/watering_crops.webp', '/maize_cob.jpg', '/biofertilizer_bag.webp',
                    '/etoil_karamoja_fm.jpg', '/jeroma_maize_flour_bag.webp'
                  ].map(img => (
                    <code key={img} style={{
                      fontSize: '0.7rem', background: 'rgba(27,67,50,0.08)',
                      color: 'var(--color-primary-dark)', padding: '2px 8px',
                      borderRadius: '4px', fontFamily: 'monospace', cursor: 'pointer',
                      border: '1px solid rgba(27,67,50,0.1)'
                    }}
                      onClick={() => { if (editingSlide) setSlideImage(img); }}
                      title="Click to use this image (while editing a slide)"
                    >{img}</code>
                  ))}
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '0.72rem', color: 'var(--color-text-light)' }}>💡 Click any image path while editing a slide to auto-fill the Image Path field.</p>
              </div>
            </div>
          )}

    </div>

      {/* Change Password Modal */}
      {showChangePwModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(8, 28, 21, 0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
          padding: '16px', boxSizing: 'border-box'
        }}>
          <div className="glass-panel" style={{
            backgroundColor: '#ffffff', color: '#081c15', width: '100%', maxWidth: '440px',
            borderRadius: '16px', padding: '24px', position: 'relative', border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)', animation: 'fadeInScale 0.25s ease'
          }}>
            <button 
              onClick={() => { setShowChangePwModal(false); setPwStep(1); setPwError(''); setPwSuccess(''); }}
              style={{
                position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none',
                fontSize: '1.25rem', cursor: 'pointer', color: '#555'
              }}
            >
              ✕
            </button>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
              🔒 Change Password
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.825rem', color: '#555' }}>
              Confirm your identity by generating a 6-digit verification code.
            </p>

            {pwError && (
              <div style={{ background: '#fde8e8', border: '1px solid #f8b4b4', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#9b1c1c', fontSize: '0.85rem', fontWeight: 600 }}>
                ⚠️ {pwError}
              </div>
            )}

            {pwSuccess && (
              <div style={{ background: '#def7ec', border: '1px solid #84e1bc', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', color: '#03543f', fontSize: '0.85rem', fontWeight: 600 }}>
                ✅ {pwSuccess}
              </div>
            )}

            {pwStep === 1 ? (
              <form onSubmit={handleGeneratePwCode}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', color: '#555' }}>
                    Verification Method
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="adminPwMethod"
                        checked={pwMethod === 'phone'} 
                        onChange={() => setPwMethod('phone')} 
                      />
                      Phone Number
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="adminPwMethod"
                        checked={pwMethod === 'email'} 
                        onChange={() => setPwMethod('email')} 
                      />
                      Email Address
                    </label>
                  </div>
                </div>

                {pwMethod === 'phone' ? (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', color: '#555' }}>
                      Phone Number
                    </label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={pwPhone} 
                      onChange={(e) => setPwPhone(e.target.value)} 
                      placeholder="e.g. +256773123456"
                      required
                    />
                  </div>
                ) : (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', color: '#555' }}>
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      className="input-field" 
                      value={pwEmail} 
                      onChange={(e) => setPwEmail(e.target.value)} 
                      placeholder="e.g. email@example.com"
                      required
                    />
                  </div>
                )}

                <button type="submit" disabled={pwIsLoading} className="btn btn-primary" style={{ width: '100%' }}>
                  {pwIsLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleUpdatePassword}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', color: '#555' }}>
                    Enter 6-Digit Code
                  </label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={pwEnteredCode} 
                    onChange={(e) => setPwEnteredCode(e.target.value)} 
                    placeholder="Enter code"
                    maxLength={6}
                    required
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', color: '#555' }}>
                    New Password
                  </label>
                  <input 
                    type="password" 
                    className="input-field" 
                    value={pwNewPassword} 
                    onChange={(e) => setPwNewPassword(e.target.value)} 
                    placeholder="At least 6 characters (letters & numbers)"
                    required
                  />
                </div>

                <button type="submit" disabled={pwIsLoading} className="btn btn-primary" style={{ width: '100%', background: 'var(--color-primary)' }}>
                  {pwIsLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
