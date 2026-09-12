import React, { useState, useEffect, useMemo } from 'react';
import * as Icons from './Icons';
import { 
  getCrops, 
  saveCrops, 
  deleteCrop,
  getDeliveries, 
  saveDelivery, 
  updateDeliveryStatus, 
  getDispatches, 
  saveDispatch,
  updateDispatch,
  deleteDispatch,
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
  getLogins,
  getSettings,
  saveSettings,
  replyToInquiry,
  replyToDispatch,
  restoreServerFromLocalBackup,
  getProjects,
  saveProject,
  deleteProject,
  getStaffMembers,
  saveStaffMember,
  deleteStaffMember,
  getCooperatives,
  saveCooperative,
  deleteCooperative,
  getMachineryAssets,
  saveMachineryAsset,
  deleteMachineryAsset,
  getFinancialRecords,
  saveFinancialRecord,
  deleteFinancialRecord,
  getNurseries,
  saveNursery,
  getFormSubmissions,
  submitFormResponse,
  deleteFormSubmission,
  syncGoogleSheet,
  getSocials,
  saveSocials
} from '../utils/db';
import { idbGet } from '../utils/indexedDbHelper';
import { translations as defaultTranslations } from './translations';
import { BannerMedia, isVideoUrl } from './ActivityBanner';
import { 
  UGANDA_DISTRICTS, 
  JEROMA_DEPARTMENTS, 
  ALL_STAFF_PERMISSIONS,
  getDepartmentById, 
  getDepartmentPermissions,
  generateAutoFarmerId,
  generateAutoCoopCode,
  generateAutoEmployeeId,
  generateAutoProjectCode
} from '../utils/ugandaDistricts';

export const WATERFALL_PHASES = [
  { id: 'Initiation', order: 1, step: '1. Initiation', label: 'Initiation', desc: 'Concept & Stakeholder Alignment', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  { id: 'Planning', order: 2, step: '2. Planning', label: 'Planning', desc: 'Scope, Budget & Work Breakdown', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  { id: 'On Process', order: 3, step: '3. On Process', label: 'On Process', desc: 'Preparation, Design & Mobilization', color: '#7c3aed', bg: '#faf5ff', border: '#c4b5fd' },
  { id: 'Implementation', order: 4, step: '4. Implementation', label: 'Implementation', desc: 'Active Field Execution & Rollout', color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' },
  { id: 'Monitoring', order: 5, step: '5. Monitoring', label: 'Monitoring & Evaluation', desc: 'Quality, Verification & Audit', color: '#0891b2', bg: '#ecfeff', border: '#67e8f9' },
  { id: 'Completed', order: 6, step: '6. Completed', label: 'Completed', desc: 'Final Handover & Impact Report', color: '#15803d', bg: '#f0fdf4', border: '#86efac' },
  { id: 'On Hold', order: 99, step: '⏸️ On Hold', label: 'On Hold', desc: 'Temporarily Paused / Suspended', color: '#c2410c', bg: '#fff7ed', border: '#fdba74' }
];

export const getWaterfallPhaseInfo = (status) => {
  const s = (status || '').toLowerCase().trim();
  if (s.includes('initiat')) return WATERFALL_PHASES[0];
  if (s.includes('plan')) return WATERFALL_PHASES[1];
  if (s.includes('process') || s.includes('on process')) return WATERFALL_PHASES[2];
  if (s.includes('implement') || s.includes('active') || s.includes('execut')) return WATERFALL_PHASES[3];
  if (s.includes('monitor') || s.includes('evaluat') || s.includes('m&e')) return WATERFALL_PHASES[4];
  if (s.includes('complet') || s.includes('finish') || s.includes('handover')) return WATERFALL_PHASES[5];
  if (s.includes('hold') || s.includes('pause')) return WATERFALL_PHASES[6];
  return WATERFALL_PHASES[3]; // default to Implementation
};

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
  const [enableResetDb, setEnableResetDb] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  // Reply Modal States
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null); // { type: 'inquiry'|'dispatch', id, recipientName }
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  // Backup & Self-Healing states
  const [showBackupRestoreBanner, setShowBackupRestoreBanner] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);

  // Professional Navigation & Access Control States
  const [navCategory, setNavCategory] = useState('all'); // 'all' | 'operations' | 'organization' | 'outreach' | 'governance'
  const [tabSearchQuery, setTabSearchQuery] = useState('');
  const [editingUserPerms, setEditingUserPerms] = useState(null); // { username, name, role, department, permissions }

  // Sync user state
  const [currentUserState, setCurrentUserState] = useState(user);
  useEffect(() => {
    setCurrentUserState(user);
  }, [user]);

  // Role-Based Access Control (RBAC) Determination
  const isFullAdmin = (currentUserState?.username || '').toLowerCase() === 'admin' || 
                      (currentUserState?.department || '') === 'Managing Director' || 
                      (currentUserState?.role || '') === 'Managing Director' ||
                      (currentUserState?.role || '') === 'managing_director' ||
                      (currentUserState?.role || '').toLowerCase() === 'admin';

  const userAllowedPermissions = useMemo(() => {
    return currentUserState?.permissions || 
           getDepartmentPermissions(currentUserState?.department) || 
           getDepartmentPermissions(currentUserState?.role) || 
           (isFullAdmin ? ['prices', 'deliveries', 'dispatches', 'inquiries', 'manual', 'chatbot', 'projects', 'staff', 'cooperatives', 'departments', 'forms', 'users', 'logins', 'language', 'socials', 'slides'] : []);
  }, [currentUserState, isFullAdmin]);

  const canAccessTab = (tabId) => {
    if (isFullAdmin) return true;
    if (tabId === 'users' || tabId === 'logins') return false;
    return Array.isArray(userAllowedPermissions) && userAllowedPermissions.includes(tabId);
  };

  const canDisbursePayout = isFullAdmin ||
    (currentUserState?.department || '').toLowerCase() === 'finance manager' ||
    (currentUserState?.role || '').toLowerCase() === 'finance_manager';

  // Auto-switch to first permitted tab if activeTab is not allowed for user
  useEffect(() => {
    if (!isFullAdmin && Array.isArray(userAllowedPermissions) && userAllowedPermissions.length > 0) {
      if (!userAllowedPermissions.includes(activeTab)) {
        setActiveTab(userAllowedPermissions[0]);
      }
    }
  }, [userAllowedPermissions, isFullAdmin, activeTab]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert(lang === 'en' ? 'Image file size must be less than 5MB.' : 'Cwiny layim pe myero okato 5MB.');
      return;
    }
    
    try {
      const uploadRes = await uploadImage(file);
      if (uploadRes && uploadRes.success && uploadRes.url) {
        const photoUrl = uploadRes.url;
        const updateRes = await updateUser(currentUserState.username, { profilePhoto: photoUrl });
        if (updateRes) {
          const updatedUser = { ...currentUserState, profilePhoto: photoUrl };
          setCurrentUserState(updatedUser);
          if (onStateChange) onStateChange();
          alert(lang === 'en' ? 'Profile photo updated successfully!' : 'Odoco cal me profile maber!');
        } else {
          alert(lang === 'en' ? 'Failed to update user profile.' : 'Gweny okene me woko cal.');
        }
      } else {
        alert(lang === 'en' ? 'Failed to upload image.' : 'Upload okene me woko cal.');
      }
    } catch (err) {
      console.error('Error uploading profile photo:', err);
      alert(lang === 'en' ? 'An error occurred during upload.' : 'Peco olingo i tic me woko cal.');
    }
  };

  // Login History States
  const [loginHistory, setLoginHistory] = useState([]);
  const [loginSearchQuery, setLoginSearchQuery] = useState('');
  const [loginRoleFilter, setLoginRoleFilter] = useState('all');

  // Tab switch handler
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setEnableResetDb(false);
  };

  // Auto-hide Database Reset after 12 seconds
  useEffect(() => {
    let timer;
    if (enableResetDb) {
      timer = setTimeout(() => {
        setEnableResetDb(false);
      }, 12000);
    }
    return () => clearTimeout(timer);
  }, [enableResetDb]);

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
  
  // Create New Training Manual Stage States
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [newStageNum, setNewStageNum] = useState('');
  const [newStageTitleEn, setNewStageTitleEn] = useState('');
  const [newStageTitleLuo, setNewStageTitleLuo] = useState('');
  const [newStageSubtitleEn, setNewStageSubtitleEn] = useState('');
  const [newStageSubtitleLuo, setNewStageSubtitleLuo] = useState('');
  const [newStagePointsText, setNewStagePointsText] = useState('');
  const [newStageNaroAdvice, setNewStageNaroAdvice] = useState('');
  const [newStageImage, setNewStageImage] = useState('');
  const [isNewStageUploading, setIsNewStageUploading] = useState(false);
  
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
  const [mngDepartment, setMngDepartment] = useState('Farmer / Client');
  const [mngDistrict, setMngDistrict] = useState('035. Gulu');
  const [mngNin, setMngNin] = useState('');
  const [mngUsername, setMngUsername] = useState('');
  const [mngPassword, setMngPassword] = useState('');
  const [mngName, setMngName] = useState('');
  const [mngPhone, setMngPhone] = useState('');
  const [mngSuccess, setMngSuccess] = useState('');
  const [mngError, setMngError] = useState('');
  const [mngPermissions, setMngPermissions] = useState(['prices', 'deliveries', 'dispatches', 'inquiries', 'manual', 'chatbot']);

  const handleMngDepartmentSelect = (deptName) => {
    setMngDepartment(deptName);
    if (deptName === 'Farmer / Client') {
      setMngRole('client');
      setMngPermissions([]);
    } else {
      setMngRole(deptName);
      const perms = getDepartmentPermissions(deptName);
      if (perms) {
        setMngPermissions(perms);
      }
    }
  };
  
  // Price Manager States
  const [editingCrop, setEditingCrop] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editMoisture, setEditMoisture] = useState('');
  const [editPackaging, setEditPackaging] = useState('');
  const [editMarketPrice, setEditMarketPrice] = useState('');
  const [editGuide, setEditGuide] = useState('');
  const [editTips, setEditTips] = useState('');
  const [priceSearchQuery, setPriceSearchQuery] = useState('');
  const [isAddingCrop, setIsAddingCrop] = useState(false);
  const [newCropName, setNewCropName] = useState('');
  const [newCropRate, setNewCropRate] = useState('');
  const [newCropMoisture, setNewCropMoisture] = useState('12.0% - 13.0%');
  const [newCropPackaging, setNewCropPackaging] = useState('50 kg Woven Bags');
  const [newCropMarketPrice, setNewCropMarketPrice] = useState('0.65');
  const [newCropGuide, setNewCropGuide] = useState('');
  const [newCropTips, setNewCropTips] = useState('');
  const [priceSuccess, setPriceSuccess] = useState('');
  const [priceError, setPriceError] = useState('');

  // Transit Requests (Dispatches) Management States
  const [editingDispatch, setEditingDispatch] = useState(null);
  const [editDispCrop, setEditDispCrop] = useState('');
  const [editDispCropName, setEditDispCropName] = useState('');
  const [editDispWeight, setEditDispWeight] = useState('');
  const [editDispDate, setEditDispDate] = useState('');
  const [editDispLocation, setEditDispLocation] = useState('');
  const [editDispNotes, setEditDispNotes] = useState('');
  const [editDispStatus, setEditDispStatus] = useState('Pending');
  const [editDispDriver, setEditDispDriver] = useState('');
  const [editDispVehicle, setEditDispVehicle] = useState('');
  const [editDispReply, setEditDispReply] = useState('');
  const [isAddingDispatch, setIsAddingDispatch] = useState(false);
  const [newDispFarmer, setNewDispFarmer] = useState('');
  const [newDispCrop, setNewDispCrop] = useState('sunflower');
  const [newDispWeight, setNewDispWeight] = useState('');
  const [newDispDate, setNewDispDate] = useState(new Date().toISOString().slice(0, 10));
  const [newDispLocation, setNewDispLocation] = useState('');
  const [newDispNotes, setNewDispNotes] = useState('');
  const [newDispDriver, setNewDispDriver] = useState('');
  const [newDispVehicle, setNewDispVehicle] = useState('');
  const [dispSuccessMsg, setDispSuccessMsg] = useState('');
  const [dispErrorMsg, setDispErrorMsg] = useState('');
  const [dispSearchQuery, setDispSearchQuery] = useState('');
  const [dispStatusFilter, setDispStatusFilter] = useState('all');

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

  // ── Universal Projects State (Waterfall Project Management) ──────────────
  const [projectsList, setProjectsList] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [projectStatusFilter, setProjectStatusFilter] = useState('all');
  const [projectCoopFilter, setProjectCoopFilter] = useState('all');
  const [projectSearch, setProjectSearch] = useState('');
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [customCoopInput, setCustomCoopInput] = useState('');

  // ── Staff & Positions HR State ────────────────────────────────────────────
  const [staffList, setStaffList] = useState([]);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffDeptFilter, setStaffDeptFilter] = useState('all');
  const [staffDistrictFilter, setStaffDistrictFilter] = useState('all');
  const [staffSearch, setStaffSearch] = useState('');
  const [isSavingStaff, setIsSavingStaff] = useState(false);

  // ── Cooperatives & SACCOs State ───────────────────────────────────────────
  const [cooperativesList, setCooperativesList] = useState([]);
  const [editingCooperative, setEditingCooperative] = useState(null);
  const [coopDistrictFilter, setCoopDistrictFilter] = useState('all');
  const [coopSearch, setCoopSearch] = useState('');
  const [isSavingCoop, setIsSavingCoop] = useState(false);

  // ── Machinery & Technology State ──────────────────────────────────────────
  const [machineryList, setMachineryList] = useState([]);
  const [editingMachinery, setEditingMachinery] = useState(null);
  const [isSavingMachinery, setIsSavingMachinery] = useState(false);

  // ── Department Hub State ──────────────────────────────────────────────────
  const [deptActiveSubtab, setDeptActiveSubtab] = useState('overview');
  const [financialRecords, setFinancialRecords] = useState([]);
  const [editingFinanceRecord, setEditingFinanceRecord] = useState(null);
  const [financeCategoryFilter, setFinanceCategoryFilter] = useState('all');
  const [financeTypeFilter, setFinanceTypeFilter] = useState('all');
  const [isSavingFinance, setIsSavingFinance] = useState(false);

  const [nurseriesList, setNurseriesList] = useState([]);
  const [editingNursery, setEditingNursery] = useState(null);
  const [isSavingNursery, setIsSavingNursery] = useState(false);

  // ── Google Forms & Google Sheet Live Ingestion State ──────────────────────
  const [formSubmissionsList, setFormSubmissionsList] = useState([]);
  const [formSearch, setFormSearch] = useState('');
  const [formTypeFilter, setFormTypeFilter] = useState('all');
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Google Sheet Direct Sync State
  const [googleSheetUrl, setGoogleSheetUrl] = useState(() => {
    try { return localStorage.getItem('jeroma_google_sheet_url') || ''; } catch { return ''; }
  });
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [sheetSyncSuccess, setSheetSyncSuccess] = useState('');
  const [sheetSyncError, setSheetSyncError] = useState('');
  const [showPasteSheetModal, setShowPasteSheetModal] = useState(false);
  const [pastedSheetData, setPastedSheetData] = useState('');
  const [isPastingSheet, setIsPastingSheet] = useState(false);
  const [selectedSubmissionDetails, setSelectedSubmissionDetails] = useState(null);

  // ── Social Media & Digital Channels Hub State ─────────────────────────────
  const [socialsState, setSocialsState] = useState({
    whatsapp: { enabled: true, handle: '+256 773 623 196', url: 'https://wa.me/256773623196', title: 'WhatsApp Business', subtitle: 'Direct Chat & Agro Input Inquiries', greeting: 'Hello Jeroma Farmers, I would like to inquire about input subsidies, crop collection, and prices.' },
    facebook: { enabled: true, handle: '@jeromafarmers', url: 'https://www.facebook.com/jeromafarmers', title: 'Facebook Page', subtitle: 'Jeroma Farmers Collection Centre Ltd' },
    tiktok: { enabled: true, handle: '@jeromafarmers', url: 'https://www.tiktok.com/@jeromafarmers', title: 'TikTok Channel', subtitle: 'Farmer Training & Field Operations' },
    x: { enabled: true, handle: '@JeromaFarmers', url: 'https://x.com/JeromaFarmers', title: 'X (Twitter)', subtitle: 'Real-time Bulletins & Commodity Updates' },
    youtube: { enabled: true, handle: '@jeromafarmers', url: 'https://www.youtube.com/@jeromafarmers', title: 'YouTube Channel', subtitle: 'Farmer Testimonials & Machinery Demonstrations' },
    linkedin: { enabled: true, handle: 'jeromafarmers', url: 'https://www.linkedin.com/company/jeromafarmers', title: 'LinkedIn', subtitle: 'Corporate & Institutional Partnerships' },
    instagram: { enabled: true, handle: '@jeromafarmers', url: 'https://www.instagram.com/jeromafarmers', title: 'Instagram', subtitle: 'Farm Photography & Community Highlights' },
    telegram: { enabled: false, handle: '@jeromafarmers', url: 'https://t.me/jeromafarmers', title: 'Telegram Community', subtitle: 'Broadcasts & Cooperative Alerts' }
  });
  const [isSavingSocials, setIsSavingSocials] = useState(false);
  const [socialsSuccess, setSocialsSuccess] = useState('');
  const [socialsError, setSocialsError] = useState('');

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
      const [
        cropsData, deliveriesData, dispatchesData, inquiriesData, allUsers, slidesData, manualData, settingsData,
        projectsData, staffData, coopsData, machineryData, financeData, nurseriesData, formSubsData, socialsData
      ] = await Promise.all([
        getCrops(),
        getDeliveries(),
        getDispatches(),
        getInquiries(),
        getUsers(),
        getSlides(),
        getManual(),
        getSettings(),
        getProjects(),
        getStaffMembers(),
        getCooperatives(),
        getMachineryAssets(),
        getFinancialRecords(),
        getNurseries(),
        getFormSubmissions(),
        getSocials()
      ]);
      setCrops(cropsData || {});
      setDeliveries(deliveriesData || []);
      setDispatches(dispatchesData || []);
      setInquiries(inquiriesData || []);
      setAllUsersList(allUsers || []);
      setClients((allUsers || []).filter(u => u.role === 'client'));
      setSlides(slidesData || []);
      setManualStages(manualData || []);
      setProjectsList(projectsData || []);
      setStaffList(staffData || []);
      setCooperativesList(coopsData || []);
      setMachineryList(machineryData || []);
      setFinancialRecords(financeData || []);
      setNurseriesList(nurseriesData || []);
      setFormSubmissionsList(formSubsData || []);
      if (socialsData) setSocialsState(socialsData);
      if (settingsData) {
        setSettings(settingsData);
        localStorage.setItem('jeroma_settings', JSON.stringify(settingsData));
      }

      if (user.username.toLowerCase() === 'admin') {
        try {
          const alertsData = await getAlerts();
          setSystemAlerts(alertsData || []);
          const loginsData = await getLogins();
          setLoginHistory(loginsData || []);
          
          // Check if server database has restarted and lost data (self-healing backup detection)
          const localUsers = (await idbGet('users', 'all'))?.data || [];
          if (allUsers.length <= 2 && localUsers.length > allUsers.length) {
            setShowBackupRestoreBanner(true);
          }
        } catch (err) {
          console.error('Failed to load system alerts or logins:', err);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    setIsRestoringBackup(true);
    try {
      const res = await restoreServerFromLocalBackup();
      if (res && (res.success || res)) {
        alert(lang === 'en' ? 'Database backup restored successfully!' : 'Backup restored!');
        setShowBackupRestoreBanner(false);
        await loadData();
      } else {
        alert(lang === 'en' ? 'Failed to restore backup.' : 'Restore failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Error restoring backup');
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setIsReplying(true);
    try {
      let res;
      if (replyTarget.type === 'inquiry') {
        res = await replyToInquiry(replyTarget.id, replyText);
        if (res) {
          alert(lang === 'en' ? 'Reply submitted successfully!' : 'Lok me anyim omoko!');
          setInquiries(await getInquiries());
        }
      } else if (replyTarget.type === 'dispatch') {
        res = await replyToDispatch(replyTarget.id, replyText);
        if (res) {
          alert(lang === 'en' ? 'Reply submitted successfully!' : 'Lok me anyim omoko!');
          setDispatches(await getDispatches());
        }
      }
      setShowReplyModal(false);
      setReplyText('');
    } catch (err) {
      console.error(err);
      alert('Failed to submit reply.');
    } finally {
      setIsReplying(false);
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

      if (pwMethod === 'email') {
        try {
          const res = await fetch('/api/send-verification-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: pwEmail.trim(), code, username: user.username })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setPwSuccess(`Verification code sent to your email address! Please check your inbox.`);
              setPwStep(2);
              return;
            }
          }
        } catch (e) {
          console.error('Error sending verification email:', e);
        }
      }

      setPwSuccess(`Verification code generated! [DEMO MODE] Your code is: ${code}. Please enter it below to verify (configure RESEND_API_KEY on server for real email).`);
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

  const handleNewManualImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsNewStageUploading(true);
    setStageSuccess('');
    setStageError('');
    try {
      const res = await uploadImage(file);
      if (res.success && res.url) {
        setNewStageImage(res.url);
        setStageSuccess('Stage photo uploaded successfully!');
      } else {
        setStageError('Failed to upload image.');
      }
    } catch (err) {
      setStageError(err.message || 'Failed to upload image.');
    } finally {
      setIsNewStageUploading(false);
    }
  };

  const handleCreateManualStage = async (e) => {
    e.preventDefault();
    setStageSuccess('');
    setStageError('');

    const nextIndex = manualStages.length + 1;
    const computedNum = newStageNum.trim() || nextIndex.toString().padStart(2, '0');
    const stageId = `stage-${Date.now()}-${newStageTitleEn.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20)}`;

    const newStage = {
      id: stageId,
      num: computedNum,
      title_en: newStageTitleEn.trim(),
      title_luo: newStageTitleLuo.trim(),
      subtitle_en: newStageSubtitleEn.trim(),
      subtitle_luo: newStageSubtitleLuo.trim(),
      points: newStagePointsText.split('\n').map(p => p.trim()).filter(Boolean),
      naroAdvice: newStageNaroAdvice.trim(),
      image: newStageImage.trim() || '/sunflower_field.webp'
    };

    const updatedManual = [...manualStages, newStage];

    try {
      const saved = await saveManual(updatedManual);
      if (saved) {
        setManualStages(saved);
        setStageSuccess(`Phase "${newStage.title_en}" created successfully!`);
        setIsAddingStage(false);
        // Reset fields
        setNewStageNum('');
        setNewStageTitleEn('');
        setNewStageTitleLuo('');
        setNewStageSubtitleEn('');
        setNewStageSubtitleLuo('');
        setNewStagePointsText('');
        setNewStageNaroAdvice('');
        setNewStageImage('');
        onStateChange();
      } else {
        setStageError('Failed to add new manual stage.');
      }
    } catch (err) {
      setStageError('Error creating stage: ' + err.message);
    }
  };

  const handleDeleteManualStage = async (stageId, stageTitle) => {
    if (window.confirm(`Are you sure you want to delete training phase "${stageTitle}"? This will remove it from the website manual.`)) {
      const updatedManual = manualStages
        .filter(s => s.id !== stageId)
        .map((stage, idx) => ({
          ...stage,
          num: (idx + 1).toString().padStart(2, '0')
        }));

      try {
        const saved = await saveManual(updatedManual);
        if (saved) {
          setManualStages(saved);
          setStageSuccess(`Phase "${stageTitle}" deleted successfully.`);
          onStateChange();
        } else {
          setStageError('Failed to delete phase.');
        }
      } catch (err) {
        setStageError('Error deleting phase: ' + err.message);
      }
    }
  };

  const handleMoveManualStage = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= manualStages.length) return;

    const listCopy = [...manualStages];
    const temp = listCopy[index];
    listCopy[index] = listCopy[targetIdx];
    listCopy[targetIdx] = temp;

    // Renumber sequentially
    const renumbered = listCopy.map((stage, idx) => ({
      ...stage,
      num: (idx + 1).toString().padStart(2, '0')
    }));

    try {
      const saved = await saveManual(renumbered);
      if (saved) {
        setManualStages(saved);
        setStageSuccess('Stages reordered successfully!');
        setTimeout(() => setStageSuccess(''), 2500);
        onStateChange();
      }
    } catch (err) {
      setStageError('Error reordering stages: ' + err.message);
    }
  };

  // ── Slide Handlers & Media Optimization ───────────────────────────────────
  const compressImageFile = (file, maxWidth = 1600, maxHeight = 1200, quality = 0.85) => {
    return new Promise((resolve) => {
      if (!file || !file.type || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
        return resolve(file);
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob && blob.size < file.size) {
              const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
                type: 'image/webp',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          }, 'image/webp', quality);
        };
        img.onerror = () => resolve(file);
        img.src = event.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const rawFile = e.target.files[0];
    if (!rawFile) return;
    setIsUploading(true);
    setSlidesError('');
    setSlidesSuccess('');
    try {
      const file = await compressImageFile(rawFile);
      const res = await uploadImage(file);
      if (res.success && res.url) {
        setSlideImage(res.url);
        setSlidesSuccess(file.type.startsWith('video/') ? '🎬 Video uploaded & ready!' : '📷 Photo uploaded & optimized!');
      } else {
        setSlidesError('Failed to upload media.');
      }
    } catch (err) {
      setSlidesError(err.message || 'Media upload failed.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
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
    setTimeout(() => {
      document.getElementById('slide-edit-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
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
    setTimeout(() => {
      document.getElementById('slide-edit-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
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

  // ── Universal Projects Handlers ───────────────────────────────────────────
  const handleSaveProjectSubmit = async (e) => {
    e.preventDefault();
    if (!editingProject) return;
    setIsSavingProject(true);
    try {
      const saved = await saveProject(editingProject);
      if (saved) {
        setProjectsList(prev => {
          const idx = prev.findIndex(p => p.id === saved.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [saved, ...prev];
        });
        setEditingProject(null);
      }
    } catch (err) {
      console.error('Error saving project:', err);
      alert('Failed to save project: ' + err.message);
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleDeleteProjectClick = async (id) => {
    if (!window.confirm(lang === 'en' ? 'Are you sure you want to delete this project?' : 'Itye maber ni imito jwayo project man?')) return;
    try {
      await deleteProject(id);
      setProjectsList(prev => prev.filter(p => p.id !== id));
      if (editingProject?.id === id) setEditingProject(null);
    } catch (err) {
      alert('Failed to delete project: ' + err.message);
    }
  };

  const handleToggleMilestone = async (project, milestoneId) => {
    const updatedMilestones = (project.milestones || []).map(m => 
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );
    const updated = { ...project, milestones: updatedMilestones };
    try {
      const saved = await saveProject(updated);
      setProjectsList(prev => prev.map(p => p.id === saved.id ? saved : p));
      if (editingProject?.id === project.id) setEditingProject(saved);
    } catch (err) {
      console.error('Failed to update milestone:', err);
    }
  };

  // ── Staff Management Handlers ─────────────────────────────────────────────
  const handleSaveStaffSubmit = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;
    setIsSavingStaff(true);
    try {
      const saved = await saveStaffMember(editingStaff);
      if (saved) {
        setStaffList(prev => {
          const idx = prev.findIndex(s => s.id === saved.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [saved, ...prev];
        });
        setEditingStaff(null);
      }
    } catch (err) {
      alert('Failed to save staff member: ' + err.message);
    } finally {
      setIsSavingStaff(false);
    }
  };

  const handleDeleteStaffClick = async (id) => {
    if (!window.confirm(lang === 'en' ? 'Are you sure you want to delete this staff record?' : 'Itye maber ni imito kwanyo latic man?')) return;
    try {
      await deleteStaffMember(id);
      setStaffList(prev => prev.filter(s => s.id !== id));
      if (editingStaff?.id === id) setEditingStaff(null);
    } catch (err) {
      alert('Failed to delete staff: ' + err.message);
    }
  };

  // ── Cooperatives Handlers ─────────────────────────────────────────────────
  const handleSaveCoopSubmit = async (e) => {
    e.preventDefault();
    if (!editingCooperative) return;
    setIsSavingCoop(true);
    try {
      const saved = await saveCooperative(editingCooperative);
      if (saved) {
        setCooperativesList(prev => {
          const idx = prev.findIndex(c => c.id === saved.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [saved, ...prev];
        });
        setEditingCooperative(null);
      }
    } catch (err) {
      alert('Failed to save cooperative: ' + err.message);
    } finally {
      setIsSavingCoop(false);
    }
  };

  const handleDeleteCoopClick = async (id) => {
    if (!window.confirm(lang === 'en' ? 'Are you sure you want to delete this cooperative?' : 'Itye maber ni imito kwanyo cooperative man?')) return;
    try {
      await deleteCooperative(id);
      setCooperativesList(prev => prev.filter(c => c.id !== id));
      if (editingCooperative?.id === id) setEditingCooperative(null);
    } catch (err) {
      alert('Failed to delete cooperative: ' + err.message);
    }
  };

  const handleExportCoopsCsv = () => {
    const headers = ['Code', 'Name', 'District', 'Subcounty', 'Chairperson', 'Phone', 'Members Count', 'Female Members', 'Youth Members', 'Acreage', 'Crops'];
    const rows = cooperativesList.map(c => [
      c.code || '',
      `"${(c.name || '').replace(/"/g, '""')}"`,
      c.district || '',
      c.subcounty || '',
      `"${(c.contactPerson || '').replace(/"/g, '""')}"`,
      c.phone || '',
      c.membersCount || 0,
      c.femaleMembers || 0,
      c.youthMembers || 0,
      c.totalAcreage || 0,
      `"${(c.cropsSpecialization || []).join('; ')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Jeroma_Cooperatives_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Machinery Handlers ────────────────────────────────────────────────────
  const handleSaveMachinerySubmit = async (e) => {
    e.preventDefault();
    if (!editingMachinery) return;
    setIsSavingMachinery(true);
    try {
      const saved = await saveMachineryAsset(editingMachinery);
      if (saved) {
        setMachineryList(prev => {
          const idx = prev.findIndex(m => m.id === saved.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [saved, ...prev];
        });
        setEditingMachinery(null);
      }
    } catch (err) {
      alert('Failed to save machinery asset: ' + err.message);
    } finally {
      setIsSavingMachinery(false);
    }
  };

  const handleDeleteMachineryClick = async (id) => {
    if (!window.confirm(lang === 'en' ? 'Delete this machinery asset?' : 'Ikwany lela man woko?')) return;
    try {
      await deleteMachineryAsset(id);
      setMachineryList(prev => prev.filter(m => m.id !== id));
      if (editingMachinery?.id === id) setEditingMachinery(null);
    } catch (err) {
      alert('Failed to delete asset: ' + err.message);
    }
  };

  // ── Department Hub Handlers ───────────────────────────────────────────────
  const handleSaveFinanceSubmit = async (e) => {
    e.preventDefault();
    if (!editingFinanceRecord) return;
    setIsSavingFinance(true);
    try {
      const saved = await saveFinancialRecord(editingFinanceRecord);
      if (saved) {
        setFinancialRecords(prev => {
          const idx = prev.findIndex(f => f.id === saved.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [saved, ...prev];
        });
        setEditingFinanceRecord(null);
      }
    } catch (err) {
      alert('Failed to save financial entry: ' + err.message);
    } finally {
      setIsSavingFinance(false);
    }
  };

  const handleDeleteFinanceClick = async (id) => {
    if (!window.confirm('Delete this financial entry?')) return;
    try {
      await deleteFinancialRecord(id);
      setFinancialRecords(prev => prev.filter(f => f.id !== id));
      if (editingFinanceRecord?.id === id) setEditingFinanceRecord(null);
    } catch (err) {
      alert('Failed to delete financial record: ' + err.message);
    }
  };

  const handleExportFinanceCsv = () => {
    const headers = ['Ref ID', 'Date', 'Type', 'Category', 'Description', 'Amount (UGX)', 'Paid To / By', 'Project Code', 'Status'];
    const rows = financialRecords.map(f => [
      f.id || '',
      f.date || '',
      f.type || '',
      f.category || '',
      `"${(f.description || '').replace(/"/g, '""')}"`,
      f.amount || 0,
      `"${(f.recipientOrSource || '').replace(/"/g, '""')}"`,
      f.projectCode || '',
      f.status || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Jeroma_Financial_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveNurserySubmit = async (e) => {
    e.preventDefault();
    if (!editingNursery) return;
    setIsSavingNursery(true);
    try {
      const saved = await saveNursery(editingNursery);
      if (saved) {
        setNurseriesList(prev => {
          const idx = prev.findIndex(n => n.id === saved.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [saved, ...prev];
        });
        setEditingNursery(null);
      }
    } catch (err) {
      alert('Failed to save nursery data: ' + err.message);
    } finally {
      setIsSavingNursery(false);
    }
  };

  // ── Google Forms Handlers ─────────────────────────────────────────────────
  const handleDeleteSubmission = async (id) => {
    if (!window.confirm('Delete this form submission?')) return;
    try {
      await deleteFormSubmission(id);
      setFormSubmissionsList(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert('Failed to delete submission: ' + err.message);
    }
  };

  const handleSyncGoogleSheet = async () => {
    if (!googleSheetUrl.trim()) {
      setSheetSyncError('Please enter your Google Sheet link or spreadsheet ID first.');
      return;
    }
    if (googleSheetUrl.includes('/forms/')) {
      setSheetSyncError(
        'The link you entered is a Google Form responses page (docs.google.com/forms/...) which is private to your Google account. ' +
        'To display your responses:\n' +
        '1. Click the green "View in Sheets" icon inside your Google Form to open its linked Google Spreadsheet.\n' +
        '2. In that Google Spreadsheet, click Share (top-right) -> set to "Anyone with the link can view", and paste that spreadsheet link here.\n' +
        '3. OR in your Google Form, click the ⋮ (3 dots) menu next to the green icon -> "Download responses (.csv)", and click "📁 Upload Responses CSV" above!'
      );
      return;
    }
    setIsSyncingSheet(true);
    setSheetSyncError('');
    setSheetSyncSuccess('');
    try {
      localStorage.setItem('jeroma_google_sheet_url', googleSheetUrl.trim());
      const res = await syncGoogleSheet(googleSheetUrl.trim());
      if (res && res.success) {
        setSheetSyncSuccess(res.message || 'Successfully synchronized responses from Google Sheet!');
        if (res.submissions) setFormSubmissionsList(res.submissions);
        else setFormSubmissionsList(await getFormSubmissions());
      } else {
        setSheetSyncError(res?.error || 'Failed to sync responses from Google Sheet.');
      }
    } catch (err) {
      setSheetSyncError(err.message || 'Error connecting to Google Sheet.');
    } finally {
      setIsSyncingSheet(false);
    }
  };

  const handlePasteSheetSubmit = async (e) => {
    e.preventDefault();
    if (!pastedSheetData.trim()) return;
    setIsPastingSheet(true);
    try {
      const res = await syncGoogleSheet(null, pastedSheetData.trim());
      if (res && res.success) {
        alert(res.message || 'Successfully imported sheet responses!');
        if (res.submissions) setFormSubmissionsList(res.submissions);
        else setFormSubmissionsList(await getFormSubmissions());
        setShowPasteSheetModal(false);
        setPastedSheetData('');
      } else {
        alert(res?.error || 'Failed to import pasted data.');
      }
    } catch (err) {
      alert('Error importing pasted sheet rows: ' + err.message);
    } finally {
      setIsPastingSheet(false);
    }
  };

  const handleFileUploadCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result;
      if (!text || typeof text !== 'string') return;
      setIsSyncingSheet(true);
      try {
        const res = await syncGoogleSheet(null, text);
        if (res && res.success) {
          alert(res.message || 'Successfully imported responses from CSV file!');
          if (res.submissions) setFormSubmissionsList(res.submissions);
          else setFormSubmissionsList(await getFormSubmissions());
        } else {
          alert(res?.error || 'Failed to parse CSV file.');
        }
      } catch (err) {
        alert('Error parsing uploaded CSV: ' + err.message);
      } finally {
        setIsSyncingSheet(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleLiveResponses = async () => {
    const samples = [
      {
        formType: 'farmer_registration',
        formName: 'JEROMA FARMERS COLLECTION CENTER (Live Google Sheet)',
        data: {
          'Timestamp': new Date(Date.now() - 3600000 * 2).toLocaleString(),
          '1. Full Name:': 'Okot George Patrick',
          '2. Phone Number:': '+256 772 491 820',
          '3. Email Address (Optional):': 'okot.george@gmail.com',
          '4. Gender:': 'Male',
          '5. National Identification Number (NIN):': 'CM900481028391',
          '6. Age:': '38',
          '7. Farmer ID (Auto-generated or Assigned):': 'JRM-FMR-101-4821',
          '8. District:': '101. Pader',
          '9. Subcounty:': 'Lapul Sub-county',
          '10. Parish:': 'Pajule Parish',
          '11. Village:': 'Oporot Central',
          '12. Household Size:': '6',
          '13. Main Crops Grown:': 'Sunflower (LG 56.58), Soya Beans (Maksoy 3N)',
          '14. Do you have any form of disability?': 'No',
          '15. Are you a member of a Farmer Group?': 'Yes',
          '16. If yes, what is the name of your Farmer Group?': 'Lapul Oilseed Farmers Group',
          '17. Total members in your Farmer Group:': '28',
          '18. Are you a member of a Cooperative Society?': 'Yes',
          '19. If yes, what is the name of your Cooperative?': 'Pader Progressive Farmers Cooperative Society',
          fullName: 'Okot George Patrick',
          phone: '+256 772 491 820',
          district: '101. Pader',
          nin: 'CM900481028391'
        },
        status: 'Synced from Google Sheet'
      },
      {
        formType: 'farmer_registration',
        formName: 'JEROMA FARMERS COLLECTION CENTER (Live Google Sheet)',
        data: {
          'Timestamp': new Date(Date.now() - 3600000 * 5).toLocaleString(),
          '1. Full Name:': 'Acayo Harriet Sharon',
          '2. Phone Number:': '+256 788 314 902',
          '3. Email Address (Optional):': 'acayo.harriet@yahoo.com',
          '4. Gender:': 'Female',
          '5. National Identification Number (NIN):': 'CF940291039482',
          '6. Age:': '31',
          '7. Farmer ID (Auto-generated or Assigned):': 'JRM-FMR-003-9182',
          '8. District:': '003. Agago',
          '9. Subcounty:': 'Patongo Sub-county',
          '10. Parish:': 'Alerek',
          '11. Village:': 'Agago East',
          '12. Household Size:': '5',
          '13. Main Crops Grown:': 'Soybeans, Sunflower, Sesame',
          '14. Do you have any form of disability?': 'No',
          '15. Are you a member of a Farmer Group?': 'Yes',
          '16. If yes, what is the name of your Farmer Group?': 'Patongo Women In Agriculture',
          '17. Total members in your Farmer Group:': '35',
          '18. Are you a member of a Cooperative Society?': 'Yes',
          '19. If yes, what is the name of your Cooperative?': 'Agago Agro-Produce SACCO',
          fullName: 'Acayo Harriet Sharon',
          phone: '+256 788 314 902',
          district: '003. Agago',
          nin: 'CF940291039482'
        },
        status: 'Synced from Google Sheet'
      },
      {
        formType: 'farmer_registration',
        formName: 'JEROMA FARMERS COLLECTION CENTER (Live Google Sheet)',
        data: {
          'Timestamp': new Date(Date.now() - 3600000 * 12).toLocaleString(),
          '1. Full Name:': 'Komakech Denis',
          '2. Phone Number:': '+256 774 550 119',
          '3. Email Address (Optional):': '',
          '4. Gender:': 'Male',
          '5. National Identification Number (NIN):': 'CM880192837461',
          '6. Age:': '44',
          '7. Farmer ID (Auto-generated or Assigned):': 'JRM-FMR-035-6629',
          '8. District:': '035. Gulu',
          '9. Subcounty:': 'Unyama Sub-county',
          '10. Parish:': 'Pugwinyi',
          '11. Village:': 'Bobi Cell',
          '12. Household Size:': '7',
          '13. Main Crops Grown:': 'White Sorghum, Sunflower, Maize',
          '14. Do you have any form of disability?': 'No',
          '15. Are you a member of a Farmer Group?': 'Yes',
          '16. If yes, what is the name of your Farmer Group?': 'Gulu Modern Grain Growers',
          '17. Total members in your Farmer Group:': '42',
          '18. Are you a member of a Cooperative Society?': 'Yes',
          '19. If yes, what is the name of your Cooperative?': 'Northern Grains Cooperative Union',
          fullName: 'Komakech Denis',
          phone: '+256 774 550 119',
          district: '035. Gulu',
          nin: 'CM880192837461'
        },
        status: 'Synced from Google Sheet'
      }
    ];

    for (const s of samples) {
      await submitFormResponse(s);
    }
    const fresh = await getFormSubmissions();
    setFormSubmissionsList(fresh);
    alert('Sample responses loaded! You can now view all responses in the table and test 1-click account conversions.');
  };

  const handleConvertSubmissionToFarmer = async (sub) => {
    const raw = sub.data || {};
    const name = raw.fullName || raw.name || raw['Full Name'] || raw['Farmer Name'] || 'Registered Farmer';
    const phone = raw.phone || raw.phoneNumber || raw['Phone'] || raw['Phone Number'] || '';
    const district = raw.district || raw['District'] || 'Pader';
    const subcounty = raw.subcounty || raw['Subcounty'] || '';
    const village = raw.village || raw['Village'] || '';
    const crop = raw.crop || raw['Main Crop'] || raw['Crop'] || 'sunflower';

    const username = (name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(100 + Math.random() * 900));
    try {
      const res = await registerUser({
        username,
        password: 'Farmer' + Math.floor(1000 + Math.random() * 9000),
        name,
        phone,
        district,
        subcounty,
        village,
        primaryCrop: crop,
        role: 'client',
        acreage: raw.acreage || raw['Acreage'] || 1
      });
      if (res && (res.success || res.id)) {
        alert(`Successfully converted into farmer account!\nUsername: ${username}\nDefault Password generated.`);
        setClients(await getUsers().then(u => (u || []).filter(c => c.role === 'client')));
      } else {
        alert(res?.message || 'Farmer registered, refreshing list.');
      }
    } catch (err) {
      alert('Registration result: ' + err.message);
    }
  };

  const handleConvertSubmissionToCoop = async (sub) => {
    const raw = sub.data || {};
    const coopName = raw.cooperativeName || raw.groupName || raw['Cooperative Name'] || raw['Group Name'] || raw.name || 'New Cooperative';
    const district = raw.district || raw['District'] || 'Pader';
    const contact = raw.fullName || raw.chairperson || raw['Chairperson'] || raw.contactPerson || '';
    const phone = raw.phone || raw['Phone'] || '';
    const members = parseInt(raw.members || raw.membersCount || raw['Total Members'] || 30);

    const newCoop = {
      code: 'COP-' + Math.floor(100 + Math.random() * 900),
      name: coopName,
      district,
      subcounty: raw.subcounty || raw['Subcounty'] || '',
      contactPerson: contact,
      phone,
      membersCount: members,
      femaleMembers: Math.floor(members * 0.5),
      youthMembers: Math.floor(members * 0.35),
      totalAcreage: parseInt(raw.acreage || raw['Acreage'] || 50),
      cropsSpecialization: [raw.crop || raw['Main Crop'] || 'Sunflower', 'Soya Beans'],
      machineryAllocated: [],
      status: 'Active'
    };

    try {
      const saved = await saveCooperative(newCoop);
      if (saved) {
        setCooperativesList(prev => [saved, ...prev]);
        alert(`Cooperative "${coopName}" successfully added to Cooperatives & SACCOs directory!`);
      }
    } catch (err) {
      alert('Failed to convert to cooperative: ' + err.message);
    }
  };

  const handleExportFormsCsv = () => {
    if (!formSubmissionsList.length) {
      alert('No form submissions to export.');
      return;
    }
    const allKeys = Array.from(new Set(formSubmissionsList.flatMap(s => Object.keys(s.data || {}))));
    const headers = ['Submission ID', 'Form Type', 'Submitted At', ...allKeys];
    const rows = formSubmissionsList.map(s => [
      s.id,
      s.formType || 'general',
      s.createdAt || '',
      ...allKeys.map(k => `"${String(s.data?.[k] || '').replace(/"/g, '""')}"`)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Jeroma_Form_Submissions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Social Media Hub Handlers ─────────────────────────────────────────────
  const handleSocialFieldChange = (channelKey, field, value) => {
    setSocialsState(prev => ({
      ...prev,
      [channelKey]: {
        ...(prev[channelKey] || {}),
        [field]: value
      }
    }));
  };

  const handleSaveSocialsSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSavingSocials(true);
    setSocialsSuccess('');
    setSocialsError('');
    try {
      const saved = await saveSocials(socialsState);
      if (saved) {
        setSocialsState(saved);
        setSocialsSuccess(lang === 'en' ? 'Social media accounts & channels updated successfully!' : 'Socials okedo maber!');
        if (onStateChange) onStateChange();
      }
    } catch (err) {
      setSocialsError(err.message || 'Failed to update social channels.');
    } finally {
      setIsSavingSocials(false);
    }
  };

  const handleResetSocialsToDefault = async () => {
    if (!window.confirm('Reset all social links & handles back to official Jeroma defaults?')) return;
    const defaults = {
      whatsapp: { enabled: true, handle: '+256 773 623 196', url: 'https://wa.me/256773623196', title: 'WhatsApp Business', subtitle: 'Direct Chat & Agro Input Inquiries', greeting: 'Hello Jeroma Farmers, I would like to inquire about input subsidies, crop collection, and prices.' },
      facebook: { enabled: true, handle: '@jeromafarmers', url: 'https://www.facebook.com/jeromafarmers', title: 'Facebook Page', subtitle: 'Jeroma Farmers Collection Centre Ltd' },
      tiktok: { enabled: true, handle: '@jeromafarmers', url: 'https://www.tiktok.com/@jeromafarmers', title: 'TikTok Channel', subtitle: 'Farmer Training & Field Operations' },
      x: { enabled: true, handle: '@JeromaFarmers', url: 'https://x.com/JeromaFarmers', title: 'X (Twitter)', subtitle: 'Real-time Bulletins & Commodity Updates' },
      youtube: { enabled: true, handle: '@jeromafarmers', url: 'https://www.youtube.com/@jeromafarmers', title: 'YouTube Channel', subtitle: 'Farmer Testimonials & Machinery Demonstrations' },
      linkedin: { enabled: true, handle: 'jeromafarmers', url: 'https://www.linkedin.com/company/jeromafarmers', title: 'LinkedIn', subtitle: 'Corporate & Institutional Partnerships' },
      instagram: { enabled: true, handle: '@jeromafarmers', url: 'https://www.instagram.com/jeromafarmers', title: 'Instagram', subtitle: 'Farm Photography & Community Highlights' },
      telegram: { enabled: false, handle: '@jeromafarmers', url: 'https://t.me/jeromafarmers', title: 'Telegram Community', subtitle: 'Broadcasts & Cooperative Alerts' }
    };
    setSocialsState(defaults);
    await saveSocials(defaults);
    setSocialsSuccess('Reset to defaults.');
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditPrice = (crop) => {
    setEditingCrop(crop.id);
    setEditName(crop.name || '');
    setEditRate(crop.payoutRate ? crop.payoutRate.replace('UGX ', '').replace(/,/g, '') : '');
    setEditMoisture(crop.moisture || '');
    setEditPackaging(crop.packaging || '');
    setEditMarketPrice(crop.marketPrice !== undefined ? String(crop.marketPrice) : '');
    setEditGuide(crop.gradingGuide || '');
    setEditTips(crop.tips || '');
    setPriceSuccess('');
    setPriceError('');
  };

  const handleSavePrice = async (e) => {
    e.preventDefault();
    setPriceSuccess('');
    setPriceError('');

    const updatedCrops = { ...crops };
    const current = updatedCrops[editingCrop] || {};
    updatedCrops[editingCrop] = {
      ...current,
      name: editName.trim() || current.name || editingCrop,
      payoutRate: 'UGX ' + parseInt(editRate).toLocaleString(),
      moisture: editMoisture.trim() || current.moisture || '12.0% - 13.0%',
      packaging: editPackaging.trim() || current.packaging || '50 kg Woven Bags',
      marketPrice: editMarketPrice ? parseFloat(editMarketPrice) : (current.marketPrice || 0.65),
      gradingGuide: editGuide.trim() || current.gradingGuide || '',
      tips: editTips.trim() || current.tips || ''
    };
    setCrops(updatedCrops);
    await saveCrops(updatedCrops);
    setEditingCrop(null);
    setPriceSuccess('Crop price and details updated successfully!');
    setTimeout(() => setPriceSuccess(''), 3500);
    onStateChange();
  };

  const handleCreateCrop = async (e) => {
    e.preventDefault();
    setPriceSuccess('');
    setPriceError('');

    if (!newCropName.trim() || !newCropRate) {
      setPriceError('Please enter crop name and base payout rate.');
      return;
    }

    const cropId = newCropName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (crops[cropId]) {
      setPriceError(`A crop with identifier "${cropId}" already exists.`);
      return;
    }

    const newCropObj = {
      id: cropId,
      name: newCropName.trim(),
      payoutRate: 'UGX ' + parseInt(newCropRate).toLocaleString(),
      moisture: newCropMoisture.trim() || '12.0% - 13.0%',
      packaging: newCropPackaging.trim() || '50 kg Woven Bags',
      marketPrice: newCropMarketPrice ? parseFloat(newCropMarketPrice) : 0.65,
      gradingGuide: newCropGuide.trim() || 'Standard quality verification required.',
      tips: newCropTips.trim() || 'Ensure proper sorting and drying before bagging.'
    };

    const updatedCrops = { ...crops, [cropId]: newCropObj };
    setCrops(updatedCrops);
    await saveCrops(updatedCrops);
    setIsAddingCrop(false);
    // Reset form
    setNewCropName('');
    setNewCropRate('');
    setNewCropMoisture('12.0% - 13.0%');
    setNewCropPackaging('50 kg Woven Bags');
    setNewCropMarketPrice('0.65');
    setNewCropGuide('');
    setNewCropTips('');
    setPriceSuccess(`Crop "${newCropObj.name}" added to Price Manager successfully!`);
    setTimeout(() => setPriceSuccess(''), 3500);
    onStateChange();
  };

  const handleDeleteCrop = async (cropId, cropName) => {
    if (window.confirm(`Are you sure you want to remove "${cropName}" from the Price Manager? This will also remove it from live pricing boards.`)) {
      setPriceSuccess('');
      setPriceError('');
      const updatedCrops = { ...crops };
      delete updatedCrops[cropId];
      setCrops(updatedCrops);
      await deleteCrop(cropId);
      setPriceSuccess(`Crop "${cropName}" removed successfully.`);
      setTimeout(() => setPriceSuccess(''), 3500);
      onStateChange();
    }
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
    if (!canDisbursePayout) {
      alert(lang === 'en'
        ? 'Security Notice: Only the Finance Department or Managing Director can authorize mobile money cash disbursements.'
        : 'Lok me security: Finance Department keken onyo Managing Director aye twero miiyo wel cente.');
      return;
    }
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

  const openEditDispatch = (disp) => {
    setEditingDispatch(disp);
    setEditDispCrop(disp.cropId || disp.crop || 'sunflower');
    setEditDispCropName(disp.cropName || (crops[disp.cropId]?.name || ''));
    setEditDispWeight(disp.weight !== undefined ? String(disp.weight) : '');
    setEditDispDate(disp.date || '');
    setEditDispLocation(disp.location || '');
    setEditDispNotes(disp.notes || '');
    setEditDispStatus(disp.status || 'Pending');
    setEditDispDriver(disp.driverName || '');
    setEditDispVehicle(disp.vehiclePlate || '');
    setEditDispReply(disp.reply || '');
    setDispSuccessMsg('');
    setDispErrorMsg('');
  };

  const handleSaveEditDispatch = async (e) => {
    e.preventDefault();
    if (!editingDispatch) return;
    setDispSuccessMsg('');
    setDispErrorMsg('');

    const resolvedCropName = crops[editDispCrop]?.name || editDispCropName || editingDispatch.cropName;
    const updatedFields = {
      cropId: editDispCrop,
      cropName: resolvedCropName,
      weight: parseFloat(editDispWeight) || editingDispatch.weight,
      date: editDispDate,
      location: editDispLocation,
      notes: editDispNotes,
      status: editDispStatus,
      driverName: editDispDriver,
      vehiclePlate: editDispVehicle,
      reply: editDispReply
    };

    const success = await updateDispatch(editingDispatch.id, updatedFields);
    if (success) {
      setDispatches(await getDispatches());
      setEditingDispatch(null);
      setDispSuccessMsg(`Transit request ${editingDispatch.id} updated successfully!`);
      setTimeout(() => setDispSuccessMsg(''), 3500);
      if (onStateChange) onStateChange();
    } else {
      setDispErrorMsg('Failed to update transit request.');
    }
  };

  const handleDeleteDispatch = async (dispId) => {
    if (window.confirm(`Are you sure you want to delete transit request "${dispId}"? This cannot be undone.`)) {
      setDispSuccessMsg('');
      setDispErrorMsg('');
      const success = await deleteDispatch(dispId);
      if (success) {
        setDispatches(await getDispatches());
        setDispSuccessMsg(`Transit request ${dispId} deleted successfully.`);
        setTimeout(() => setDispSuccessMsg(''), 3500);
        if (onStateChange) onStateChange();
      } else {
        setDispErrorMsg('Failed to delete transit request.');
      }
    }
  };

  const handleCreateDispatch = async (e) => {
    e.preventDefault();
    setDispSuccessMsg('');
    setDispErrorMsg('');

    if (!newDispFarmer || !newDispWeight || !newDispDate || !newDispLocation) {
      setDispErrorMsg('Please fill out farmer, weight, pickup date, and location.');
      return;
    }

    const farmer = clients.find(c => c.username === newDispFarmer) || { name: newDispFarmer, username: newDispFarmer };
    const cropObj = crops[newDispCrop] || { id: newDispCrop, name: newDispCrop };

    const newRecord = {
      username: farmer.username,
      farmerName: farmer.name,
      cropId: cropObj.id,
      cropName: cropObj.name,
      weight: parseFloat(newDispWeight),
      date: newDispDate,
      location: newDispLocation,
      notes: newDispNotes,
      status: 'Pending',
      driverName: newDispDriver,
      vehiclePlate: newDispVehicle
    };

    const saved = await saveDispatch(newRecord);
    if (saved) {
      setDispatches(await getDispatches());
      setIsAddingDispatch(false);
      setNewDispFarmer('');
      setNewDispWeight('');
      setNewDispDate(new Date().toISOString().slice(0, 10));
      setNewDispLocation('');
      setNewDispNotes('');
      setNewDispDriver('');
      setNewDispVehicle('');
      setDispSuccessMsg(`Transit request ${saved.id} recorded successfully!`);
      setTimeout(() => setDispSuccessMsg(''), 3500);
      if (onStateChange) onStateChange();
    } else {
      setDispErrorMsg('Failed to record transit request.');
    }
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
    
    const isStaffOrAdmin = mngRole !== 'client';
    const newUser = {
      username: mngUsername.toLowerCase(),
      password: mngPassword,
      name: mngName,
      phone: mngPhone,
      district: mngDistrict,
      department: mngDepartment,
      role: mngRole,
      nin: mngNin,
      permissions: isStaffOrAdmin ? mngPermissions : undefined
    };
    
    const result = await (isStaffOrAdmin ? registerAdmin(newUser) : registerUser(newUser));
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

  const openUserPermsModal = (u) => {
    const existingPerms = Array.isArray(u.permissions) && u.permissions.length > 0 
      ? [...u.permissions] 
      : (getDepartmentPermissions(u.department) || getDepartmentPermissions(u.role) || ['prices', 'deliveries', 'dispatches', 'inquiries']);
    setEditingUserPerms({
      username: u.username,
      name: u.name || u.username,
      role: u.role || 'staff',
      department: u.department || 'General',
      permissions: existingPerms
    });
  };

  const handleSaveUserPerms = async () => {
    if (!editingUserPerms) return;
    await handleUpdateUserPermissions(editingUserPerms.username, editingUserPerms.permissions);
    setEditingUserPerms(null);
  };

  const handleResetDb = async () => {
    const confirmText = 'RESET';
    const userInput = window.prompt(lang === 'en' 
      ? `WARNING: This will delete all user data, deliveries, and restore defaults. To confirm, type "${confirmText}" in ALL CAPS:`
      : `WARN: Man bikwonyo jami ducu. To confirm, type "${confirmText}" in ALL CAPS:`
    );
    
    // Automatically hide reset DB button on prompt dismiss or submission
    setEnableResetDb(false);

    if (userInput === confirmText) {
      await resetToDefaults();
      await loadData();
      onStateChange();
      alert(lang === 'en' ? 'Database successfully restored to default states.' : 'Jami ducu ocogo cen piny.');
    } else if (userInput !== null) {
      alert(lang === 'en' ? 'Reset cancelled. Incorrect confirmation text.' : 'Keto cen ogik. Iketo lok ma pe rwatte.');
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
        
        {/* Backup Restore Banner */}
        {showBackupRestoreBanner && (
          <div className="alert alert-warning" style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeeba',
            padding: '12px 20px', borderRadius: '8px', marginBottom: '20px', flexWrap: 'wrap', gap: '10px'
          }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              ⚠️ {lang === 'en' 
                ? 'Notice: It looks like the cloud server restarted or redeployed and its temporary database was reset. We detected a local database backup on your device. Would you like to restore all custom users, dispatches, deliveries, and inquiries?' 
                : 'Notice: Server database has reset. Restore local backup?'}
            </span>
            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
              <button
                onClick={handleRestoreBackup}
                disabled={isRestoringBackup}
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: '#856404', borderColor: '#856404', color: '#fff', cursor: 'pointer' }}
              >
                {isRestoringBackup ? 'Restoring...' : (lang === 'en' ? 'Restore Backup' : 'Restore')}
              </button>
              <button
                onClick={() => setShowBackupRestoreBanner(false)}
                className="btn btn-outline"
                style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: '#856404', color: '#856404', cursor: 'pointer' }}
              >
                {lang === 'en' ? 'Dismiss' : 'Dismiss'}
              </button>
            </div>
          </div>
        )}
        
        {/* Top Profile Header */}
        <div className="dashboard-header-panel">
          <div className="dashboard-header-profile">
            <div style={{ position: 'relative', width: '60px', height: '60px', flexShrink: 0 }}>
              {currentUserState.profilePhoto ? (
                <img
                  src={currentUserState.profilePhoto}
                  alt={currentUserState.name}
                  style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    objectFit: 'cover', border: '2px solid var(--color-secondary)'
                  }}
                />
              ) : (
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.08)', border: '2px solid var(--color-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'
                }}>
                  <Icons.Shield size={32} style={{ color: 'var(--color-secondary)' }} />
                </div>
              )}
              {/* Upload Overlay Icon */}
              <label style={{
                position: 'absolute', bottom: '-4px', right: '-4px',
                width: '24px', height: '24px', borderRadius: '50%',
                backgroundColor: 'var(--color-secondary)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                border: '2px solid #0f3020', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} title="Upload profile photo">
                <Icons.Camera size={12} style={{ color: 'var(--color-primary-dark)' }} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px', flexWrap: 'wrap' }}>
                <span style={{ 
                  fontSize: '0.72rem', 
                  fontWeight: 700, 
                  padding: '2px 10px', 
                  borderRadius: '12px', 
                  background: (getDepartmentById(currentUserState?.department || currentUserState?.role)?.badgeColor || '#059669'), 
                  color: '#fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
                }}>
                  🏢 {currentUserState?.department || 'Executive Leadership'}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.12)', padding: '2px 8px', borderRadius: '12px' }}>
                  Role: {currentUserState?.role || 'Staff'}
                </span>
              </div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#fff' }}>
                {t.welcome} {currentUserState.name}
              </h2>
            </div>
          </div>
          <div className="dashboard-header-buttons" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {user.username.toLowerCase() === 'admin' && (
              <label style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                fontSize: '0.8rem', 
                color: 'rgba(255,255,255,0.85)',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.06)',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1.5px dashed rgba(255,255,255,0.15)',
                marginRight: '4px'
              }}>
                <input 
                  type="checkbox" 
                  checked={enableResetDb} 
                  onChange={(e) => setEnableResetDb(e.target.checked)} 
                  style={{ cursor: 'pointer' }}
                />
                ⚙️ {lang === 'en' ? 'Show Database Reset' : 'Nen reset piny'}
              </label>
            )}
            {user.username.toLowerCase() === 'admin' && enableResetDb && (
              <button 
                type="button"
                className="btn btn-outline reset-db-mobile-btn" 
                onClick={handleResetDb} 
                style={{ 
                  borderColor: 'rgba(217,4,41,0.6)', 
                  color: '#ff4d4d', 
                  padding: '10px 18px',
                  display: 'none',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  background: 'rgba(217,4,41,0.1)'
                }}
              >
                ⚠️ {t.resetDb}
              </button>
            )}
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

        {/* Executive Center Admin Bar & Quick Operational Metrics */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(13, 45, 31, 0.95) 0%, rgba(22, 67, 47, 0.95) 100%)',
          borderRadius: '16px',
          padding: '18px 22px',
          marginBottom: '20px',
          border: '1px solid rgba(82,183,136,0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.18)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px', height: '46px', borderRadius: '12px',
              background: isFullAdmin ? 'linear-gradient(135deg, #e9c46a 0%, #f4a261 100%)' : '#2d6a4f',
              color: isFullAdmin ? '#0f3020' : '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.45rem', fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              {isFullAdmin ? '👑' : '🏢'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.15rem', fontFamily: 'var(--font-heading)' }}>
                  {currentUserState?.name || 'Administrator'}
                </span>
                <span style={{
                  fontSize: '0.72rem', fontWeight: 800, padding: '2px 9px', borderRadius: '6px',
                  background: isFullAdmin ? '#e9c46a' : '#52b788',
                  color: '#081c15', textTransform: 'uppercase', letterSpacing: '0.04em'
                }}>
                  {isFullAdmin ? 'Center Administrator · Full Access' : (currentUserState?.department || currentUserState?.role || 'Staff')}
                </span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.8rem', marginTop: '3px' }}>
                {isFullAdmin 
                  ? '⚡ Complete Operational Command · Grant, delegate or restrict permissions for any staff member across all 14 units' 
                  : `Authorized Departmental Operator · ${userAllowedPermissions?.length || 0} Permitted Units`}
              </div>
            </div>
          </div>

          {/* Quick Metrics Counter Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '6px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Staff</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#e9c46a' }}>{(staffList || []).length}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '6px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Deliveries</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#52b788' }}>{(deliveries || []).length}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '6px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Transit</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#93c5fd' }}>{(dispatches || []).length}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '6px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Projects</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f4a261' }}>{(projectsList || []).length}</div>
            </div>
          </div>
        </div>

        {/* Categorized Tab Navigation Control */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Modules (16)' },
                { id: 'operations', label: '🚜 Operations (4)' },
                { id: 'organization', label: '🏢 Organization (4)' },
                { id: 'outreach', label: '📢 Outreach (5)' },
                { id: 'governance', label: '⚙️ Governance (3)' }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setNavCategory(cat.id)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: navCategory === cat.id ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: navCategory === cat.id ? '2px solid #e9c46a' : '1px solid rgba(255,255,255,0.15)',
                    background: navCategory === cat.id ? '#e9c46a' : 'rgba(255,255,255,0.05)',
                    color: navCategory === cat.id ? '#081c15' : '#ffffff'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Tab Quick Search Filter */}
            <div style={{ position: 'relative', minWidth: '220px' }}>
              <input
                type="text"
                placeholder="🔍 Search actions / tabs..."
                value={tabSearchQuery}
                onChange={(e) => setTabSearchQuery(e.target.value)}
                className="form-input"
                style={{
                  padding: '7px 12px 7px 32px',
                  fontSize: '0.8rem',
                  borderRadius: '20px',
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(82,183,136,0.3)',
                  color: '#ffffff',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', opacity: 0.6 }}>
                🔍
              </span>
            </div>
          </div>

          {/* Dash Tabs */}
          <div className="dashboard-tabs-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[
              { id: 'prices', label: t.pricesTab, icon: <Icons.Wheat size={18} />, category: 'operations', badge: crops ? Object.keys(crops).length : 0 },
              { id: 'deliveries', label: t.deliveriesTab, icon: <Icons.Warehouse size={18} />, category: 'operations', badge: (deliveries || []).length },
              { id: 'dispatches', label: t.dispatchesTab, icon: <Icons.Truck size={18} />, category: 'operations', badge: (dispatches || []).length },
              { id: 'projects', label: lang === 'en' ? '🚀 Projects Hub' : '🚀 Projects', icon: null, category: 'operations', badge: (projectsList || []).length },
              { id: 'staff', label: lang === 'en' ? '👥 Staff & Positions' : '👥 Lutic mwa', icon: null, category: 'organization', badge: (staffList || []).length },
              { id: 'cooperatives', label: lang === 'en' ? '🤝 Cooperatives & SACCOs' : '🤝 Cooperatives', icon: null, category: 'organization', badge: (cooperativesList || []).length },
              { id: 'departments', label: lang === 'en' ? '🏢 Departments Hub' : '🏢 Departments', icon: null, category: 'organization', badge: 6 },
              { id: 'forms', label: lang === 'en' ? '📋 Google Forms Sync' : '📋 Google Forms', icon: null, category: 'organization' },
              { id: 'inquiries', label: t.inquiriesTab, icon: <Icons.Mail size={18} />, category: 'outreach', badge: (inquiries || []).length },
              { id: 'users', label: t.usersTab || 'User Management', icon: <Icons.Users size={18} />, category: 'governance', badge: (allUsersList || []).length },
              { id: 'logins', label: lang === 'en' ? '🔑 Login History' : '🔑 Wel me Login', icon: <Icons.Clock size={18} />, category: 'governance' },
              { id: 'language', label: lang === 'en' ? 'Language Manager' : 'Yore me Leb', icon: <Icons.Globe size={18} />, category: 'governance' },
              { id: 'socials', label: lang === 'en' ? '📱 Social Media Hub' : '📱 Social Media', icon: null, category: 'outreach' },
              { id: 'manual', label: lang === 'en' ? '📖 Training Manual Manager' : '📖 Training Manual Manager', icon: null, category: 'outreach', badge: (manualStages || []).length },
              { id: 'chatbot', label: lang === 'en' ? '🤖 Chatbot Manager' : '🤖 Chatbot Manager', icon: null, category: 'outreach' },
              { id: 'slides', label: lang === 'en' ? '🖼️ Banner Slides Manager' : '🖼️ Banner Slides Manager', icon: null, category: 'outreach', badge: (slides || []).length }
            ].filter(tab => {
              if (tab.id === 'users') return isFullAdmin;
              if (tab.id === 'logins') return isFullAdmin;
              if (tab.id === 'manual' && settings?.hideManual && !isFullAdmin) return false;
              if (!isFullAdmin && !(userAllowedPermissions || []).includes(tab.id)) return false;
              if (navCategory !== 'all' && tab.category !== navCategory) return false;
              if (tabSearchQuery && tabSearchQuery.trim()) {
                const q = tabSearchQuery.toLowerCase();
                return (tab.label || '').toLowerCase().includes(q) || (tab.id || '').toLowerCase().includes(q);
              }
              return true;
            }).map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`btn-tab ${activeTab === tab.id ? 'active' : ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  fontWeight: activeTab === tab.id ? 800 : 600,
                  fontSize: '0.85rem'
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: activeTab === tab.id ? '#081c15' : 'rgba(255,255,255,0.15)',
                    color: activeTab === tab.id ? '#e9c46a' : '#ffffff',
                    fontWeight: 800
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          
          {user.username.toLowerCase() === 'admin' && enableResetDb && (
            <button 
              type="button" 
              onClick={handleResetDb} 
              className="btn-tab reset-db-tab-btn"
              style={{
                marginLeft: 'auto',
                border: '1.5px solid #d90429',
                background: 'rgba(217, 4, 41, 0.1)',
                color: '#d90429',
                fontWeight: 800
              }}
            >
              <Icons.Calendar size={14} />
              <span>{t.resetDb}</span>
            </button>
          )}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="dashboard-panel-card">
          {!canAccessTab(activeTab) && (
            <div style={{
              padding: '60px 24px',
              textAlign: 'center',
              backgroundColor: 'rgba(217, 4, 41, 0.04)',
              borderRadius: '16px',
              border: '1.5px dashed rgba(217, 4, 41, 0.3)',
              margin: '20px 0'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
              <h3 style={{ color: '#d90429', fontSize: '1.4rem', fontWeight: 800, marginBottom: '8px' }}>
                {lang === 'en' ? 'Access Denied: Department Authorization Required' : 'Pe itwero donyo: Myero ibed kede twero'}
              </h3>
              <p style={{ color: 'var(--color-text-dark)', maxWidth: '520px', margin: '0 auto 20px', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {lang === 'en'
                  ? `Your account (${currentUserState?.name || 'Staff'}, ${currentUserState?.department || 'Department'}) does not have permission to view or manage the "${activeTab.toUpperCase()}" module. Please contact the Managing Director for administrative clearance.`
                  : `Account meri pe tye kede twero me neno kabedo man. Lok kede Managing Director pi twero.`}
              </p>
              {userAllowedPermissions && userAllowedPermissions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab(userAllowedPermissions[0])}
                  className="btn btn-primary"
                  style={{ padding: '10px 24px' }}
                >
                  ← {lang === 'en' ? `Go to My Department Tab (${userAllowedPermissions[0]})` : 'Dok cen i tab meri'}
                </button>
              )}
            </div>
          )}

          {canAccessTab('prices') && activeTab === 'prices' && (() => {
            const cropList = Object.values(crops);
            const filteredCrops = priceSearchQuery.trim()
              ? cropList.filter(c => 
                  (c.name || '').toLowerCase().includes(priceSearchQuery.toLowerCase()) ||
                  (c.gradingGuide || '').toLowerCase().includes(priceSearchQuery.toLowerCase()) ||
                  (c.packaging || '').toLowerCase().includes(priceSearchQuery.toLowerCase())
                )
              : cropList;

            return (
              /* Price Manager Tab */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.3rem', fontFamily: 'var(--font-heading)', fontWeight: 700, margin: '0 0 6px 0' }}>
                      🌾 {t.pricesTab}
                    </h3>
                    <p style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', margin: 0 }}>
                      Set base buying rates, standard moisture thresholds, packaging, and quality grading criteria for all agricultural commodities.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setIsAddingCrop(true);
                        setEditingCrop(null);
                        setPriceSuccess('');
                        setPriceError('');
                      }}
                      style={{ padding: '9px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>➕</span> Add New Commodity Crop
                    </button>
                  </div>
                </div>

                {priceSuccess && (
                  <div style={{ padding: '12px 16px', backgroundColor: 'rgba(82, 183, 136, 0.15)', borderLeft: '4px solid var(--color-accent)', borderRadius: '6px', color: '#1b4332', fontSize: '0.88rem', marginBottom: '20px', fontWeight: 600 }}>
                    ✅ {priceSuccess}
                  </div>
                )}
                {priceError && (
                  <div style={{ padding: '12px 16px', backgroundColor: 'rgba(217, 4, 41, 0.15)', borderLeft: '4px solid #d90429', borderRadius: '6px', color: '#680000', fontSize: '0.88rem', marginBottom: '20px', fontWeight: 600 }}>
                    ⚠️ {priceError}
                  </div>
                )}

                {/* Add New Crop Form */}
                {isAddingCrop && (
                  <form onSubmit={handleCreateCrop} className="glass-panel" style={{ padding: '24px', backgroundColor: '#f0fdf4', border: '1.5px solid rgba(82,183,136,0.35)', borderRadius: '12px', marginBottom: '28px' }}>
                    <h4 style={{ color: '#065f46', fontSize: '1.05rem', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🌱</span> Add New Commodity / Crop Rate
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group">
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          Crop Name <span style={{ color: '#d90429' }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Soya Beans (Non-GMO)"
                          value={newCropName}
                          onChange={(e) => setNewCropName(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          Base Buying Rate (UGX/Kg) <span style={{ color: '#d90429' }}>*</span>
                        </label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="e.g. 2400"
                          value={newCropRate}
                          onChange={(e) => setNewCropRate(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          Target Moisture Range
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 11.5% - 12.5%"
                          value={newCropMoisture}
                          onChange={(e) => setNewCropMoisture(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          Standard Packaging
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 50 kg Woven Bags"
                          value={newCropPackaging}
                          onChange={(e) => setNewCropPackaging(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          Global Market Ref (USD/Kg)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input"
                          placeholder="e.g. 0.65"
                          value={newCropMarketPrice}
                          onChange={(e) => setNewCropMarketPrice(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                        Quality & Grading Criteria
                      </label>
                      <textarea
                        className="form-input"
                        placeholder="Detail foreign matter percentage, maximum defect allowance, and color purity..."
                        value={newCropGuide}
                        onChange={(e) => setNewCropGuide(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', minHeight: '70px' }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                        Drying & Post-Harvest Handling Tips
                      </label>
                      <textarea
                        className="form-input"
                        placeholder="Actionable post-harvest guidance for farmers to attain Grade-A certification..."
                        value={newCropTips}
                        onChange={(e) => setNewCropTips(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', minHeight: '70px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button type="submit" className="btn btn-primary" style={{ padding: '10px 22px' }}>
                        <Icons.CheckCircle size={16} />
                        Save New Crop
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => setIsAddingCrop(false)} style={{ padding: '10px 22px' }}>
                        {t.cancel}
                      </button>
                    </div>
                  </form>
                )}
                
                {/* Edit Existing Crop Form */}
                {editingCrop && (
                  <form onSubmit={handleSavePrice} className="glass-panel" style={{ padding: '24px', backgroundColor: '#faf9f6', border: '1.5px solid var(--color-primary-light, #52b788)', borderRadius: '12px', marginBottom: '28px' }}>
                    <h4 style={{ color: 'var(--color-primary-dark)', fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icons.Wheat size={18} />
                      {t.edit}: {crops[editingCrop]?.name || editingCrop}
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group">
                        <label htmlFor="edit-name" style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          {t.cropName} <span style={{ color: '#d90429' }}>*</span>
                        </label>
                        <input
                          type="text"
                          id="edit-name"
                          name="cropName"
                          className="form-input"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box', fontWeight: 700 }}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-rate" style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          {t.currentRate} <span style={{ color: '#d90429' }}>*</span>
                        </label>
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
                      
                      <div className="form-group">
                        <label htmlFor="edit-moisture" style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          {t.moistureTarget}
                        </label>
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

                      <div className="form-group">
                        <label htmlFor="edit-packaging" style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          Standard Packaging
                        </label>
                        <input
                          type="text"
                          id="edit-packaging"
                          name="packaging"
                          className="form-input"
                          value={editPackaging}
                          onChange={(e) => setEditPackaging(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="edit-market-price" style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          Global Market Ref (USD/Kg)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          id="edit-market-price"
                          name="marketPrice"
                          className="form-input"
                          value={editMarketPrice}
                          onChange={(e) => setEditMarketPrice(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label htmlFor="edit-guide" style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                        {t.gradingRules}
                      </label>
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
                      <label htmlFor="edit-tips" style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                        {t.dryingTips}
                      </label>
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
                      <button type="submit" className="btn btn-primary" style={{ padding: '10px 22px' }}>
                        <Icons.CheckCircle size={16} />
                        {t.save}
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => setEditingCrop(null)} style={{ padding: '10px 22px' }}>
                        {t.cancel}
                      </button>
                    </div>
                  </form>
                )}

                {/* Filter and Crop Pricing Grid */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                    Commodity Price Board ({filteredCrops.length} of {cropList.length} crops)
                  </div>
                  <input
                    type="text"
                    placeholder="Search commodities..."
                    value={priceSearchQuery}
                    onChange={(e) => setPriceSearchQuery(e.target.value)}
                    className="form-input"
                    style={{ maxWidth: '280px', fontSize: '0.85rem', padding: '6px 12px' }}
                  />
                </div>

                <div className="table-container-responsive">
                  <table>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                        <th style={{ padding: '14px 18px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)' }}>{t.cropName}</th>
                        <th style={{ padding: '14px 18px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)' }}>{t.currentRate}</th>
                        <th style={{ padding: '14px 18px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)' }}>{t.moistureTarget}</th>
                        <th style={{ padding: '14px 18px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)' }}>Packaging</th>
                        <th style={{ padding: '14px 18px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)' }}>{t.gradingRules}</th>
                        <th style={{ padding: '14px 18px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)', textAlign: 'center' }}>{t.action}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCrops.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-light)' }}>
                            No commodities match your search query.
                          </td>
                        </tr>
                      ) : (
                        filteredCrops.map(crop => (
                          <tr key={crop.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', verticalAlign: 'top' }}>
                            <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                              <div>{crop.name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', fontWeight: 'normal', fontFamily: 'monospace' }}>ID: {crop.id}</div>
                            </td>
                            <td style={{ padding: '14px 18px', color: 'var(--color-primary-light)', fontWeight: 800 }}>
                              {crop.payoutRate}
                              {crop.marketPrice && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', fontWeight: 'normal' }}>
                                  Ref: ${crop.marketPrice}/kg
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '14px 18px', color: 'rgba(0,0,0,0.8)' }}>{crop.moisture}</td>
                            <td style={{ padding: '14px 18px', color: 'var(--color-text-dark)', fontSize: '0.82rem' }}>{crop.packaging || '50 kg Bags'}</td>
                            <td style={{ padding: '14px 18px', color: 'var(--color-text-light)', fontSize: '0.82rem', maxWidth: '280px', lineHeight: 1.4 }}>{crop.gradingGuide}</td>
                            <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="btn btn-outline"
                                  onClick={() => handleEditPrice(crop)}
                                  style={{ display: 'inline-flex', padding: '6px 12px', fontSize: '0.78rem', gap: '5px', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                                >
                                  ✏️ {t.edit}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCrop(crop.id, crop.name)}
                                  style={{ display: 'inline-flex', padding: '6px 10px', fontSize: '0.78rem', background: 'transparent', border: '1px solid #d90429', color: '#d90429', borderRadius: '6px', cursor: 'pointer' }}
                                  title="Delete Crop"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

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
                              ) : canDisbursePayout ? (
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
                              ) : (
                                <span style={{ color: '#d97706', fontSize: '0.72rem', fontWeight: 600, padding: '2px 6px', background: 'rgba(217, 119, 6, 0.1)', borderRadius: '4px' }}>
                                  Pending Finance
                                </span>
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

          {activeTab === 'dispatches' && (() => {
            const filteredDispatches = dispatches.filter(disp => {
              const matchesStatus = dispStatusFilter === 'all' || disp.status === dispStatusFilter;
              const q = dispSearchQuery.toLowerCase().trim();
              const matchesQuery = !q ||
                (disp.farmerName || '').toLowerCase().includes(q) ||
                (disp.cropName || '').toLowerCase().includes(q) ||
                (disp.location || '').toLowerCase().includes(q) ||
                (disp.id || '').toLowerCase().includes(q) ||
                (disp.driverName || '').toLowerCase().includes(q);
              return matchesStatus && matchesQuery;
            });

            return (
              /* Transit Requests Tab */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.3rem', fontFamily: 'var(--font-heading)', fontWeight: 700, margin: '0 0 6px 0' }}>
                      🚚 {t.dispatchesTab}
                    </h3>
                    <p style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', margin: 0 }}>
                      Coordinate farm-gate produce pickups, fleet routing, truck and driver assignments, and transit schedules.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setIsAddingDispatch(true);
                        setEditingDispatch(null);
                        setDispSuccessMsg('');
                        setDispErrorMsg('');
                      }}
                      style={{ padding: '9px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>➕</span> Log New Transit Request
                    </button>
                  </div>
                </div>

                {dispSuccessMsg && (
                  <div style={{ padding: '12px 16px', backgroundColor: 'rgba(82, 183, 136, 0.15)', borderLeft: '4px solid var(--color-accent)', borderRadius: '6px', color: '#1b4332', fontSize: '0.88rem', marginBottom: '20px', fontWeight: 600 }}>
                    ✅ {dispSuccessMsg}
                  </div>
                )}
                {dispErrorMsg && (
                  <div style={{ padding: '12px 16px', backgroundColor: 'rgba(217, 4, 41, 0.15)', borderLeft: '4px solid #d90429', borderRadius: '6px', color: '#680000', fontSize: '0.88rem', marginBottom: '20px', fontWeight: 600 }}>
                    ⚠️ {dispErrorMsg}
                  </div>
                )}

                {/* Edit Transit Request Form */}
                {editingDispatch && (
                  <form onSubmit={handleSaveEditDispatch} className="glass-panel" style={{ padding: '24px', backgroundColor: '#faf9f6', border: '1.5px solid #0284c7', borderRadius: '12px', marginBottom: '28px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ color: '#0369a1', fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>✏️</span> Edit Transit Request: {editingDispatch.id} ({editingDispatch.farmerName})
                      </h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                        Client: {editingDispatch.username}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group">
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          {t.crop} <span style={{ color: '#d90429' }}>*</span>
                        </label>
                        <select
                          className="form-input"
                          value={editDispCrop}
                          onChange={(e) => setEditDispCrop(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                          required
                        >
                          {Object.values(crops).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          Estimated Weight (kg) <span style={{ color: '#d90429' }}>*</span>
                        </label>
                        <input
                          type="number"
                          className="form-input"
                          value={editDispWeight}
                          onChange={(e) => setEditDispWeight(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          Pickup / Collection Date <span style={{ color: '#d90429' }}>*</span>
                        </label>
                        <input
                          type="date"
                          className="form-input"
                          value={editDispDate}
                          onChange={(e) => setEditDispDate(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          Transit Status <span style={{ color: '#d90429' }}>*</span>
                        </label>
                        <select
                          className="form-input"
                          value={editDispStatus}
                          onChange={(e) => setEditDispStatus(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box', fontWeight: 700 }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Scheduled">Scheduled</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          Assigned Driver
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Denis Omongo"
                          value={editDispDriver}
                          onChange={(e) => setEditDispDriver(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          Assigned Vehicle / Plate
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Isuzu Forward UBA 891Z"
                          value={editDispVehicle}
                          onChange={(e) => setEditDispVehicle(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                        Pickup Location & Access Landmarks <span style={{ color: '#d90429' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={editDispLocation}
                        onChange={(e) => setEditDispLocation(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                        Transit Notes / Instructions
                      </label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={editDispNotes}
                        onChange={(e) => setEditDispNotes(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                        💬 Admin Reply / Logistics Update to Farmer
                      </label>
                      <textarea
                        className="form-input"
                        rows={2}
                        placeholder="e.g. Truck scheduled for 10:00 AM. Please ensure produce is bagged and ready."
                        value={editDispReply}
                        onChange={(e) => setEditDispReply(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button type="submit" className="btn btn-primary" style={{ padding: '10px 22px' }}>
                        <Icons.CheckCircle size={16} />
                        Save Transit Changes
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => setEditingDispatch(null)} style={{ padding: '10px 22px' }}>
                        {t.cancel}
                      </button>
                    </div>
                  </form>
                )}

                {/* Create New Transit Request Form */}
                {isAddingDispatch && (
                  <form onSubmit={handleCreateDispatch} className="glass-panel" style={{ padding: '24px', backgroundColor: '#f0fdf4', border: '1.5px solid rgba(82,183,136,0.35)', borderRadius: '12px', marginBottom: '28px' }}>
                    <h4 style={{ color: '#065f46', fontSize: '1.05rem', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🚚</span> Log New Farm Produce Transit Request
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group">
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          Select Farmer <span style={{ color: '#d90429' }}>*</span>
                        </label>
                        <select
                          className="form-input"
                          value={newDispFarmer}
                          onChange={(e) => setNewDispFarmer(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                          required
                        >
                          <option value="">-- Choose Registered Farmer --</option>
                          {clients.map(c => (
                            <option key={c.username} value={c.username}>{c.name} ({c.district || c.username})</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          Select Crop <span style={{ color: '#d90429' }}>*</span>
                        </label>
                        <select
                          className="form-input"
                          value={newDispCrop}
                          onChange={(e) => setNewDispCrop(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                          required
                        >
                          {Object.values(crops).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          Estimated Weight (kg) <span style={{ color: '#d90429' }}>*</span>
                        </label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="e.g. 1500"
                          value={newDispWeight}
                          onChange={(e) => setNewDispWeight(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          Pickup Date <span style={{ color: '#d90429' }}>*</span>
                        </label>
                        <input
                          type="date"
                          className="form-input"
                          value={newDispDate}
                          onChange={(e) => setNewDispDate(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          Assigned Driver (Optional)
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Denis Omongo"
                          value={newDispDriver}
                          onChange={(e) => setNewDispDriver(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                          Vehicle / Truck Plate (Optional)
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Isuzu Forward UBD 123X"
                          value={newDispVehicle}
                          onChange={(e) => setNewDispVehicle(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                        Pickup Location <span style={{ color: '#d90429' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Village, Parish, Sub-county, Landmark..."
                        value={newDispLocation}
                        onChange={(e) => setNewDispLocation(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem' }}>
                        Transit Notes / Special Requests
                      </label>
                      <textarea
                        className="form-input"
                        placeholder="e.g. Farmer requires weighing scales on truck; narrow access bridge..."
                        value={newDispNotes}
                        onChange={(e) => setNewDispNotes(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', minHeight: '60px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button type="submit" className="btn btn-primary" style={{ padding: '10px 22px' }}>
                        <Icons.CheckCircle size={16} />
                        Record Transit Request
                      </button>
                      <button type="button" className="btn btn-outline" onClick={() => setIsAddingDispatch(false)} style={{ padding: '10px 22px' }}>
                        {t.cancel}
                      </button>
                    </div>
                  </form>
                )}

                {/* Filter and Search Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['all', 'Pending', 'Scheduled', 'Completed', 'Cancelled'].map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setDispStatusFilter(st)}
                        className={`btn-tab ${dispStatusFilter === st ? 'active' : ''}`}
                        style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                      >
                        {st === 'all' ? 'All' : st} ({st === 'all' ? dispatches.length : dispatches.filter(d => d.status === st).length})
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Search requests, farmers, locations..."
                    value={dispSearchQuery}
                    onChange={(e) => setDispSearchQuery(e.target.value)}
                    className="form-input"
                    style={{ maxWidth: '280px', fontSize: '0.82rem', padding: '6px 12px' }}
                  />
                </div>
                
                <div className="table-container-responsive">
                  <table>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                        <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>ID</th>
                        <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{t.farmer}</th>
                        <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{t.crop}</th>
                        <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)', textAlign: 'right' }}>{t.weight}</th>
                        <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{t.location}</th>
                        <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{t.scheduledDate}</th>
                        <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>Fleet / Notes</th>
                        <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)', textAlign: 'center' }}>{t.status}</th>
                        <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)', textAlign: 'center' }}>{t.action}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDispatches.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-light)' }}>
                            No transit requests found.
                          </td>
                        </tr>
                      ) : (
                        filteredDispatches.map(disp => (
                          <tr key={disp.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', verticalAlign: 'top' }}>
                            <td style={{ padding: '14px 16px', fontSize: '0.8rem', whiteSpace: 'nowrap', fontFamily: 'monospace', fontWeight: 600 }}>{disp.id}</td>
                            <td style={{ padding: '14px 16px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{disp.farmerName}</td>
                            <td style={{ padding: '14px 16px', fontSize: '0.8rem' }}>{disp.cropName}</td>
                            <td style={{ padding: '14px 16px', fontSize: '0.8rem', textAlign: 'right', fontWeight: 700 }}>{Number(disp.weight || 0).toLocaleString()} kg</td>
                            <td style={{ padding: '14px 16px', fontSize: '0.8rem', maxWidth: '180px', lineHeight: 1.4 }}>{disp.location}</td>
                            <td style={{ padding: '14px 16px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{disp.date}</td>
                            <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--color-text-light)', maxWidth: '220px', lineHeight: 1.4 }}>
                              {(disp.driverName || disp.vehiclePlate) && (
                                <div style={{ marginBottom: '4px', color: '#0369a1', fontWeight: 600, fontSize: '0.75rem' }}>
                                  🚚 {disp.driverName || 'Driver'} {disp.vehiclePlate ? `(${disp.vehiclePlate})` : ''}
                                </div>
                              )}
                              <div>{disp.notes || '-'}</div>
                              {disp.reply && (
                                <div style={{ marginTop: '6px', color: 'var(--color-primary-dark)', fontWeight: 'bold', fontSize: '0.78rem' }}>
                                  Reply: <span style={{ fontWeight: 'normal', color: 'var(--color-text-dark)' }}>{disp.reply}</span>
                                </div>
                              )}
                            </td>
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
                              <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => openEditDispatch(disp)}
                                  className="btn btn-outline"
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: '#0284c7', color: '#0284c7' }}
                                  title="Edit Transit Details"
                                >
                                  ✏️ Edit
                                </button>
                                {disp.status === 'Pending' && (
                                  <>
                                    <button
                                      onClick={() => handleApproveDispatch(disp.id)}
                                      className="btn btn-outline"
                                      style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'var(--color-accent)', color: '#1b4332' }}
                                    >
                                      {t.approve}
                                    </button>
                                    <button
                                      onClick={() => handleCancelDispatch(disp.id)}
                                      style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'transparent', border: '1px solid #d90429', color: '#d90429', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                      {t.cancelBtn}
                                    </button>
                                  </>
                                )}
                                {disp.status === 'Scheduled' && (
                                  <button
                                    onClick={() => handleCompleteDispatch(disp.id)}
                                    className="btn btn-primary"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                  >
                                    {t.complete}
                                  </button>
                                )}
                                {disp.status !== 'Cancelled' && (
                                  <button
                                    onClick={() => {
                                      setReplyTarget({ type: 'dispatch', id: disp.id, recipientName: disp.farmerName });
                                      setReplyText(disp.reply || '');
                                      setShowReplyModal(true);
                                    }}
                                    className="btn btn-outline"
                                    style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                                  >
                                    💬 Reply
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDispatch(disp.id)}
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'transparent', border: '1px solid #d90429', color: '#d90429', borderRadius: '6px', cursor: 'pointer' }}
                                  title="Delete Transit Request"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

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
                      
                      {inq.reply && (
                        <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '6px', backgroundColor: 'rgba(82, 183, 136, 0.06)', borderLeft: '3px solid var(--color-primary)' }}>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>
                            💬 Admin Reply:
                          </p>
                          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-dark)', lineHeight: 1.4 }}>
                            {inq.reply}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleToggleInquiryStatus(inq.id, inq.status)}
                        style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '6px' }}
                      >
                        {inq.status === 'Unread' ? <Icons.CheckCircle size={14} /> : <Icons.Mail size={14} />}
                        {inq.status === 'Unread' ? t.markRead : t.markUnread}
                      </button>
                      
                      <button
                        className="btn btn-outline"
                        onClick={() => {
                          setReplyTarget({ type: 'inquiry', id: inq.id, recipientName: inq.name });
                          setReplyText(inq.reply || '');
                          setShowReplyModal(true);
                        }}
                        style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '6px', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                      >
                        💬 Reply
                      </button>
                    </div>
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
                    {/* Field 1: Department Selection */}
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label htmlFor="mng-dept" style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🏢</span> Jeroma Department
                        </label>
                        
                      </div>
                      <select 
                        id="mng-dept" 
                        name="department" 
                        className="form-input" 
                        value={mngDepartment} 
                        onChange={(e) => handleMngDepartmentSelect(e.target.value)} 
                        style={{ backgroundColor: '#081c15', color: '#ffffff', border: '1px solid rgba(82,183,136,0.5)' }}
                      >
                        <option value="Farmer / Client">🌾 Farmer / Client</option>
                        {JEROMA_DEPARTMENTS.map(d => (
                          <option key={d.id} value={d.name}>🏢 {d.name} ({d.code})</option>
                        ))}
                      </select>
                    </div>

                    {/* Field 2: Role Selection */}
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label htmlFor="mng-role" style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🛡️</span> System Access Role
                        </label>
                        
                      </div>
                      <select 
                        id="mng-role" 
                        name="role" 
                        className="form-input" 
                        value={mngRole} 
                        onChange={(e) => setMngRole(e.target.value)} 
                        style={{ backgroundColor: '#081c15', color: '#ffffff', border: '1px solid rgba(82,183,136,0.5)' }}
                      >
                        <option value="client">Farmer / Client</option>
                        <option value="admin">System Administrator</option>
                        {JEROMA_DEPARTMENTS.map(d => (
                          <option key={d.id} value={d.name}>{d.roleTitle}</option>
                        ))}
                      </select>
                    </div>

                    {/* Field 3: Full Name */}
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label htmlFor="mng-name" style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>👤</span> Your Full Name
                        </label>
                        
                      </div>
                      <input 
                        id="mng-name" 
                        name="name" 
                        autoComplete="name" 
                        className="form-input" 
                        required 
                        placeholder="e.g. Okello David"
                        value={mngName} 
                        onChange={(e) => setMngName(e.target.value)} 
                        style={{ backgroundColor: '#081c15', color: '#ffffff', border: '1px solid rgba(82,183,136,0.5)' }} 
                      />
                    </div>

                    {/* Field 4: Username */}
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label htmlFor="mng-username" style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🔑</span> Login Username
                        </label>
                        
                      </div>
                      <input 
                        id="mng-username" 
                        name="username" 
                        autoComplete="username" 
                        className="form-input" 
                        required 
                        placeholder="e.g. dokello or finance"
                        value={mngUsername} 
                        onChange={(e) => setMngUsername(e.target.value)} 
                        style={{ backgroundColor: '#081c15', color: '#ffffff', border: '1px solid rgba(82,183,136,0.5)' }} 
                      />
                    </div>

                    {/* Field 5: Password */}
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label htmlFor="mng-password" style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🔒</span> Secure Password
                        </label>
                        
                      </div>
                      <input 
                        id="mng-password" 
                        name="password" 
                        autoComplete="new-password" 
                        type="password" 
                        className="form-input" 
                        required 
                        placeholder="••••••••"
                        value={mngPassword} 
                        onChange={(e) => setMngPassword(e.target.value)} 
                        style={{ backgroundColor: '#081c15', color: '#ffffff', border: '1px solid rgba(82,183,136,0.5)' }} 
                      />
                    </div>

                    {/* Field 6: District in Uganda (All 146 Auto-numbered) */}
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label htmlFor="mng-district" style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>📍</span> District in Uganda (146 Districts)
                        </label>
                        
                      </div>
                      <select 
                        id="mng-district" 
                        name="district" 
                        className="form-input" 
                        value={mngDistrict} 
                        onChange={(e) => setMngDistrict(e.target.value)} 
                        style={{ backgroundColor: '#081c15', color: '#ffffff', border: '1px solid rgba(82,183,136,0.5)' }}
                      >
                        {UGANDA_DISTRICTS.map(d => (
                          <option key={d.code} value={d.code + '. ' + d.name}>
                            {d.code}. {d.name} ({d.region} Region)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Field 7: Telephone Contact */}
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label htmlFor="mng-phone" style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>📞</span> Telephone Contact
                        </label>
                        
                      </div>
                      <input 
                        id="mng-phone" 
                        name="phone" 
                        autoComplete="tel" 
                        className="form-input" 
                        value={mngPhone} 
                        onChange={(e) => setMngPhone(e.target.value)} 
                        placeholder="e.g. +256 773 123 456" 
                        style={{ backgroundColor: '#081c15', color: '#ffffff', border: '1px solid rgba(82,183,136,0.5)' }} 
                      />
                    </div>

                    {/* Field 8: NIN */}
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label htmlFor="mng-nin" style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🆔</span> National Identification Number (NIN)
                        </label>
                        
                      </div>
                      <input 
                        id="mng-nin" 
                        name="nin" 
                        className="form-input" 
                        value={mngNin} 
                        onChange={(e) => setMngNin(e.target.value.toUpperCase())} 
                        placeholder="e.g. CM92038104XYZ1" 
                        maxLength={14}
                        style={{ backgroundColor: '#081c15', color: '#ffffff', border: '1px solid rgba(82,183,136,0.5)' }} 
                      />
                    </div>

                    {mngRole !== 'client' && (
                      <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                          <label style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.85rem' }}>
                            🛡️ Staff Actions & Module Access Permissions ({mngPermissions.length} of {ALL_STAFF_PERMISSIONS.length} Permitted)
                          </label>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setMngPermissions(ALL_STAFF_PERMISSIONS.map(p => p.id))}
                              className="btn btn-outline"
                              style={{ padding: '3px 8px', fontSize: '0.72rem', borderColor: '#e9c46a', color: '#e9c46a' }}
                            >
                              ✨ Grant All Access
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const perms = getDepartmentPermissions(mngDepartment) || getDepartmentPermissions(mngRole) || [];
                                setMngPermissions(perms);
                              }}
                              className="btn btn-outline"
                              style={{ padding: '3px 8px', fontSize: '0.72rem', borderColor: '#52b788', color: '#52b788' }}
                            >
                              🏢 Department Defaults
                            </button>
                            <button
                              type="button"
                              onClick={() => setMngPermissions([])}
                              className="btn btn-outline"
                              style={{ padding: '3px 8px', fontSize: '0.72rem', borderColor: '#f87171', color: '#f87171' }}
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                          gap: '8px',
                          background: 'rgba(0,0,0,0.25)',
                          padding: '14px',
                          borderRadius: '10px',
                          border: '1px solid rgba(82,183,136,0.3)'
                        }}>
                          {ALL_STAFF_PERMISSIONS.map(feat => {
                            const checked = mngPermissions.includes(feat.id);
                            return (
                              <label
                                key={feat.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  background: checked ? 'rgba(82, 183, 136, 0.18)' : 'rgba(255,255,255,0.03)',
                                  border: checked ? '1px solid #52b788' : '1px solid rgba(255,255,255,0.08)',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  color: checked ? '#ffffff' : 'rgba(255,255,255,0.7)'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const newPerms = e.target.checked
                                      ? [...mngPermissions, feat.id]
                                      : mngPermissions.filter(x => x !== feat.id);
                                    setMngPermissions(newPerms);
                                  }}
                                  style={{ accentColor: '#52b788' }}
                                />
                                <span>{feat.icon}</span>
                                <span style={{ fontWeight: checked ? 700 : 500 }}>{feat.label}</span>
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
                      <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>Name & Contact</th>
                      <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>Department & Role</th>
                      <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>Allowed Actions</th>
                      <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>Status</th>
                      <th style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsersList.map(u => {
                      const userPerms = u.permissions || getDepartmentPermissions(u.department) || getDepartmentPermissions(u.role) || (u.role === 'admin' ? ALL_STAFF_PERMISSIONS.map(p => p.id) : []);
                      const isSuper = u.username.toLowerCase() === 'admin' || (u.department || '') === 'Managing Director';
                      return (
                        <tr key={u.username} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                          <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {isSuper ? '👑' : '👤'}
                              <span>{u.username}</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                            <div style={{ fontWeight: 600 }}>{u.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.phone} {u.email ? `· ${u.email}` : ''}</div>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                              backgroundColor: u.role === 'admin' ? 'rgba(217, 4, 41, 0.15)' : 'rgba(82, 183, 136, 0.15)',
                              color: u.role === 'admin' ? '#d90429' : '#1b4332'
                            }}>
                              {u.department || u.role.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '0.8rem' }}>
                            {isSuper ? (
                              <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: '#fef3c7', color: '#92400e', fontWeight: 800 }}>
                                👑 Full Authority (All Actions)
                              </span>
                            ) : (
                              <div>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '320px' }}>
                                  {userPerms.length === 0 ? (
                                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>No staff actions assigned</span>
                                  ) : (
                                    userPerms.slice(0, 5).map(pid => {
                                      const meta = ALL_STAFF_PERMISSIONS.find(p => p.id === pid);
                                      return (
                                        <span key={pid} style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                                          {meta?.icon || '✓'} {meta?.label || pid}
                                        </span>
                                      );
                                    })
                                  )}
                                  {userPerms.length > 5 && (
                                    <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: '#e2e8f0', color: '#475569', fontWeight: 700 }}>
                                      +{userPerms.length - 5} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
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
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                              {u.username.toLowerCase() !== 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => openUserPermsModal(u)}
                                  className="btn btn-outline"
                                  style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: '#059669', color: '#059669', background: '#ecfdf5', fontWeight: 700 }}
                                  title="Configure and grant permissions for actions performed by this staff member"
                                >
                                  🛡️ Access
                                </button>
                              )}
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
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Center Admin Access & Permission Delegation Modal */}
              {editingUserPerms && (
                <div style={{
                  position: 'fixed', inset: 0, zIndex: 9999,
                  backgroundColor: 'rgba(8, 28, 21, 0.85)', backdropFilter: 'blur(6px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                  <div className="glass-panel" style={{
                    background: '#ffffff', borderRadius: '16px', maxWidth: '720px', width: '100%',
                    padding: '28px', maxHeight: '90vh', overflowY: 'auto',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)', border: '2px solid var(--color-primary)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.4rem' }}>🛡️</span>
                          <h3 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.25rem', fontWeight: 800 }}>
                            Staff Operational Access & Permissions
                          </h3>
                        </div>
                        <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                          Grant, delegate or restrict actions for <strong>{editingUserPerms.name}</strong> (@{editingUserPerms.username}) · {editingUserPerms.department || editingUserPerms.role}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingUserPerms(null)}
                        style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Quick Presets for Center Admin */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px', background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                        Center Admin Access Presets:
                      </span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setEditingUserPerms({ ...editingUserPerms, permissions: ALL_STAFF_PERMISSIONS.map(p => p.id) })}
                          className="btn btn-outline"
                          style={{ padding: '5px 12px', fontSize: '0.75rem', borderColor: '#059669', color: '#059669', background: '#ecfdf5', fontWeight: 800 }}
                        >
                          ✨ Grant All 14 Actions
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const defs = getDepartmentPermissions(editingUserPerms.department) || getDepartmentPermissions(editingUserPerms.role) || ['prices', 'deliveries'];
                            setEditingUserPerms({ ...editingUserPerms, permissions: defs });
                          }}
                          className="btn btn-outline"
                          style={{ padding: '5px 12px', fontSize: '0.75rem', borderColor: '#2563eb', color: '#2563eb', background: '#eff6ff', fontWeight: 700 }}
                        >
                          🏢 Department Defaults
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingUserPerms({ ...editingUserPerms, permissions: [] })}
                          className="btn btn-outline"
                          style={{ padding: '5px 12px', fontSize: '0.75rem', borderColor: '#dc2626', color: '#dc2626', background: '#fef2f2', fontWeight: 700 }}
                        >
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Categorized Permissions Grid */}
                    {['Operations', 'Organization', 'Outreach', 'Settings'].map(cat => {
                      const catPerms = ALL_STAFF_PERMISSIONS.filter(p => p.category === cat);
                      return (
                        <div key={cat} style={{ marginBottom: '16px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.04em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{cat === 'Operations' ? '🚜' : cat === 'Organization' ? '🏢' : cat === 'Outreach' ? '📢' : '⚙️'}</span>
                            <span>{cat} Actions ({catPerms.filter(p => editingUserPerms.permissions.includes(p.id)).length}/{catPerms.length})</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
                            {catPerms.map(perm => {
                              const checked = editingUserPerms.permissions.includes(perm.id);
                              return (
                                <label
                                  key={perm.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '10px',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    background: checked ? '#f0fdf4' : '#ffffff',
                                    border: checked ? '1.5px solid #22c55e' : '1px solid #e2e8f0',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const newPerms = e.target.checked
                                        ? [...editingUserPerms.permissions, perm.id]
                                        : editingUserPerms.permissions.filter(x => x !== perm.id);
                                      setEditingUserPerms({ ...editingUserPerms, permissions: newPerms });
                                    }}
                                    style={{ marginTop: '2px', accentColor: '#16a34a' }}
                                  />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span>{perm.icon}</span>
                                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: checked ? '#14532d' : '#1e293b' }}>
                                        {perm.label}
                                      </span>
                                    </div>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#64748b', lineHeight: 1.35 }}>
                                      {perm.desc}
                                    </p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                      <button
                        type="button"
                        onClick={() => setEditingUserPerms(null)}
                        className="btn btn-outline"
                        style={{ padding: '10px 18px' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveUserPerms}
                        className="btn btn-primary"
                        style={{ padding: '10px 24px', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
                      >
                        <Icons.CheckCircle size={16} />
                        Save & Apply Access ({editingUserPerms.permissions.length} Actions)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* User Management Tab Content End */}
          {activeTab === 'logins' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 700, margin: 0 }}>
                  🔑 {lang === 'en' ? 'User Login History' : 'Wel me Login'}
                </h3>
                <button
                  onClick={async () => {
                    const loginsData = await getLogins();
                    setLoginHistory(loginsData || []);
                  }}
                  className="btn btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                >
                  🔄 {lang === 'en' ? 'Refresh History' : 'Keto me anyim'}
                </button>
              </div>

              {/* Filters Panel */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={lang === 'en' ? 'Search by name or username...' : 'Search by name or username...'}
                    value={loginSearchQuery}
                    onChange={(e) => setLoginSearchQuery(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ minWidth: '150px' }}>
                  <select
                    className="form-input"
                    value={loginRoleFilter}
                    onChange={(e) => setLoginRoleFilter(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="all">{lang === 'en' ? 'All Roles' : 'Roles Ducu'}</option>
                    <option value="admin">{lang === 'en' ? 'Administrators' : 'Admins'}</option>
                    <option value="client">{lang === 'en' ? 'Farmers / Clients' : 'Farmers'}</option>
                  </select>
                </div>
              </div>

              {/* Login Table */}
              <div className="table-responsive">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>{lang === 'en' ? 'Name' : 'Nying'}</th>
                      <th>{lang === 'en' ? 'Username' : 'Username'}</th>
                      <th>{lang === 'en' ? 'Role' : 'Role'}</th>
                      <th>{lang === 'en' ? 'Login Time' : 'Dwe me Login'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filteredLogins = loginHistory.filter(login => {
                        const matchesQuery = 
                          (login.name || '').toLowerCase().includes(loginSearchQuery.toLowerCase()) ||
                          (login.username || '').toLowerCase().includes(loginSearchQuery.toLowerCase());
                        
                        const matchesRole = 
                          loginRoleFilter === 'all' || 
                          login.role === loginRoleFilter;

                        return matchesQuery && matchesRole;
                      });

                      if (filteredLogins.length === 0) {
                        return (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-light)', fontStyle: 'italic' }}>
                              {lang === 'en' ? 'No login history matching the filters.' : 'No login history found.'}
                            </td>
                          </tr>
                        );
                      }

                      return filteredLogins.map(login => (
                        <tr key={login.id}>
                          <td style={{ fontWeight: 600, color: 'var(--color-primary-dark)' }}>
                            {login.name}
                          </td>
                          <td style={{ color: 'var(--color-text-dark)' }}>
                            @{login.username}
                          </td>
                          <td>
                            <span className={`badge ${login.role === 'admin' ? 'badge-primary' : 'badge-secondary'}`} style={{
                              backgroundColor: login.role === 'admin' ? 'var(--color-accent)' : '#6c757d',
                              color: '#fff',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}>
                              {login.role.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                            {new Date(login.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ));
                    })()}
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
                  <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.3rem', fontFamily: 'var(--font-heading)', fontWeight: 700, margin: 0 }}>
                    📖 Training Manual Manager
                  </h3>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', marginTop: '4px', marginBottom: 0 }}>
                    Manage the sequential agricultural production training stages ({manualStages.length} phases), customize NARO advisory guidelines, and upload media.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setIsAddingStage(true);
                      setEditingStage(null);
                      setNewStageNum((manualStages.length + 1).toString().padStart(2, '0'));
                      setStageSuccess('');
                      setStageError('');
                    }}
                    style={{ padding: '9px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>➕</span> Add New Training Phase
                  </button>
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
                  Hide Training Manual on Website
                </label>
              </div>

              {stageSuccess && (
                <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#065f46', fontWeight: 600, fontSize: '0.875rem' }}>
                  ✅ {stageSuccess}
                </div>
              )}
              {stageError && (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', color: '#991b1b', fontWeight: 600, fontSize: '0.875rem' }}>
                  ⚠️ {stageError}
                </div>
              )}

              {/* Add New Stage Form */}
              {isAddingStage && (
                <form onSubmit={handleCreateManualStage} style={{ background: '#f0fdf4', border: '1.5px solid rgba(82,183,136,0.4)', borderRadius: '12px', padding: '24px', marginBottom: '28px' }}>
                  <h4 style={{ color: '#065f46', fontWeight: 700, fontSize: '1.05rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🌱</span> Create New Training Manual Phase
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                    <div className="form-group">
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>
                        Phase Number <span style={{ color: '#d90429' }}>*</span>
                      </label>
                      <input 
                        className="form-input" 
                        type="text" 
                        value={newStageNum} 
                        onChange={e => setNewStageNum(e.target.value)} 
                        placeholder="e.g. 15" 
                        style={{ width: '100%', boxSizing: 'border-box' }} 
                        required 
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>
                        Title (English) <span style={{ color: '#d90429' }}>*</span>
                      </label>
                      <input 
                        className="form-input" 
                        type="text" 
                        value={newStageTitleEn} 
                        onChange={e => setNewStageTitleEn(e.target.value)} 
                        placeholder="e.g. Post-Harvest Handling & Grain Drying" 
                        style={{ width: '100%', boxSizing: 'border-box' }} 
                        required 
                      />
                    </div>
                    
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>
                        Title (Luo/Acholi)
                      </label>
                      <input 
                        className="form-input" 
                        type="text" 
                        value={newStageTitleLuo} 
                        onChange={e => setNewStageTitleLuo(e.target.value)} 
                        placeholder="e.g. Gwoko Cam I Nge Keyo" 
                        style={{ width: '100%', boxSizing: 'border-box' }} 
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>
                        Subtitle (English) <span style={{ color: '#d90429' }}>*</span>
                      </label>
                      <input 
                        className="form-input" 
                        type="text" 
                        value={newStageSubtitleEn} 
                        onChange={e => setNewStageSubtitleEn(e.target.value)} 
                        placeholder="e.g. Prevent aflatoxin contamination and optimize grain moisture" 
                        style={{ width: '100%', boxSizing: 'border-box' }} 
                        required 
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>
                        Subtitle (Luo/Acholi)
                      </label>
                      <input 
                        className="form-input" 
                        type="text" 
                        value={newStageSubtitleLuo} 
                        onChange={e => setNewStageSubtitleLuo(e.target.value)} 
                        placeholder="e.g. Juk two me cam kede gwoko pii" 
                        style={{ width: '100%', boxSizing: 'border-box' }} 
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>
                        Photo / Media URL or Upload
                      </label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                          className="form-input" 
                          type="text" 
                          value={newStageImage} 
                          onChange={e => setNewStageImage(e.target.value)} 
                          placeholder="/sunflower_field.webp" 
                          style={{ flex: 1, boxSizing: 'border-box' }} 
                        />
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '8px 14px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                            onClick={() => document.getElementById('new-manual-stage-file-input').click()}
                            disabled={isNewStageUploading}
                          >
                            📁 {isNewStageUploading ? 'Uploading...' : 'Upload Photo'}
                          </button>
                          <input
                            id="new-manual-stage-file-input"
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleNewManualImageUpload}
                            style={{ display: 'none' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>
                        Step-by-Step Training Points (One point per line) <span style={{ color: '#d90429' }}>*</span>
                      </label>
                      <textarea 
                        className="form-input" 
                        value={newStagePointsText} 
                        onChange={e => setNewStagePointsText(e.target.value)} 
                        placeholder="Sun-dry produce on raised tarpaulins or cribs&#10;Winnow to remove foreign dirt and broken chaff&#10;Check moisture with Jeroma digital meter before storage" 
                        rows={4} 
                        style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }} 
                        required 
                      />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>
                        NARO Technical Advisory / Expert Recommendation
                      </label>
                      <textarea 
                        className="form-input" 
                        value={newStageNaroAdvice} 
                        onChange={e => setNewStageNaroAdvice(e.target.value)} 
                        placeholder="NARO recommends moisture testing at 13.0% maximum to inhibit Aspergillus flavus growth..." 
                        rows={3} 
                        style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '10px 22px' }}>
                      <Icons.CheckCircle size={16} />
                      Save Training Phase
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setIsAddingStage(false)} style={{ padding: '10px 22px' }}>
                      Cancel
                    </button>
                  </div>
                </form>
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
                  {manualStages.map((stage, idx) => (
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
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-light)' }}>
                            {stage.points ? `${stage.points.length} guideline points` : ''}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-primary-dark)', lineHeight: 1.3 }}>
                          {stage.title_en} {stage.title_luo ? ` / ${stage.title_luo}` : ''}
                        </p>
                        <p style={{ margin: '3px 0 0', fontSize: '0.75rem', color: 'var(--color-text-light)', lineHeight: 1.4 }}>
                          {stage.subtitle_en}
                        </p>
                      </div>

                      {/* Actions: Reorder, Edit, Delete */}
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleMoveManualStage(idx, -1)}
                          disabled={idx === 0}
                          className="btn btn-outline"
                          style={{
                            padding: '6px 10px', fontSize: '0.75rem', opacity: idx === 0 ? 0.35 : 1, cursor: idx === 0 ? 'not-allowed' : 'pointer'
                          }}
                          title="Move Up"
                        >
                          ⬆️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveManualStage(idx, 1)}
                          disabled={idx === manualStages.length - 1}
                          className="btn btn-outline"
                          style={{
                            padding: '6px 10px', fontSize: '0.75rem', opacity: idx === manualStages.length - 1 ? 0.35 : 1, cursor: idx === manualStages.length - 1 ? 'not-allowed' : 'pointer'
                          }}
                          title="Move Down"
                        >
                          ⬇️
                        </button>
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
                        <button
                          type="button"
                          onClick={() => handleDeleteManualStage(stage.id, stage.title_en)}
                          style={{
                            padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', background: 'transparent', border: '1px solid #d90429', color: '#d90429', cursor: 'pointer'
                          }}
                          title="Delete Phase"
                        >
                          🗑️
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
                <form id="slide-edit-form" onSubmit={handleSaveSlide} style={{ background: '#f0fdf4', border: '1.5px solid rgba(82,183,136,0.3)', borderRadius: '12px', padding: '24px', marginBottom: '28px' }}>
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
                      <label style={{ color: 'var(--color-primary-dark)', fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Image / Video Path (or YouTube/Vimeo link)</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input className="form-input" type="text" value={slideImage} onChange={e => setSlideImage(e.target.value)} placeholder="/community_gathering.webp or video URL" style={{ flex: 1, boxSizing: 'border-box' }} />
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
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '4px' }}>Use paths like /community_gathering.webp, paste a YouTube/Vimeo video link, or click Upload to select a photo or video from your device.</p>
                    </div>

                    {/* Live Media Preview Box */}
                    {slideImage && (
                      <div style={{
                        gridColumn: '1 / -1',
                        margin: '6px 0 12px',
                        padding: '12px 16px',
                        background: '#081c15',
                        borderRadius: '10px',
                        border: '1.5px solid rgba(82,183,136,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{
                          width: '160px',
                          height: '100px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: '#040f0b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          border: '1px solid rgba(82,183,136,0.4)'
                        }}>
                          <BannerMedia
                            mediaUrl={slideImage}
                            title={slideTitleEn || 'Slide Preview'}
                            fit={slideFit}
                            isMobile={true}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.85rem', color: '#52b788' }}>
                            {isVideoUrl(slideImage) ? '🎬 Live Video Preview (Autoplay & Audio Supported)' : '🖼️ Live Photo Preview'}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', wordBreak: 'break-all' }}>
                            Source: <code>{slideImage.startsWith('data:') ? slideImage.substring(0, 40) + '...' : slideImage}</code>
                          </p>
                          <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#a7f3d0' }}>
                            {isVideoUrl(slideImage) ? 'Supports YouTube, Vimeo, MP4, WebM, and uploaded device videos.' : 'Automatically optimized for crisp display across mobile & desktop screens.'}
                          </p>
                        </div>
                      </div>
                    )}

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
                        width: '84px', height: '58px', borderRadius: '8px', overflow: 'hidden',
                        flexShrink: 0, border: '2px solid rgba(82,183,136,0.3)', background: '#0d2b1c',
                        position: 'relative'
                      }}>
                        <BannerMedia
                          mediaUrl={slide.video || slide.image}
                          title={slide.title_en}
                          fit={slide.fit}
                          isMobile={true}
                        />
                        {isVideoUrl(slide.video || slide.image) && (
                          <span style={{
                            position: 'absolute', bottom: '2px', right: '2px',
                            background: 'rgba(0,0,0,0.75)', color: '#52b788',
                            fontSize: '0.55rem', padding: '1px 4px', borderRadius: '3px', fontWeight: 800
                          }}>VIDEO</span>
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

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB 1: Universal Projects Management Hub */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'projects' && (
            <div>
              {/* Header & Create Project Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ color: 'var(--color-primary-dark, #0f3020)', fontSize: '1.4rem', fontFamily: 'var(--font-heading)', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
                    🚀 Universal Projects Management Hub
                  </h3>
                  <p style={{ color: '#475569', fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>
                    Waterfall Project Lifecycle: track sequential stages (<strong>Initiation ➔ Planning ➔ On Process ➔ Implementation ➔ Monitoring ➔ Completed</strong>), budgets, and participating Farmers Organisations / Cooperatives.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setCustomCoopInput('');
                    setEditingProject({
                      code: generateAutoProjectCode('PRJ'),
                      title: '',
                      partner: 'Danish Government / Danida',
                      status: 'On Process',
                      progressPercent: 35,
                      budget: 50000000,
                      spent: 0,
                      currency: 'UGX',
                      startDate: new Date().toISOString().slice(0, 10),
                      endDate: '',
                      targetBeneficiaries: 1000,
                      achievedBeneficiaries: 0,
                      targetCooperatives: 5,
                      engagedCooperatives: 2,
                      cooperatives: ['Pader Sunflower Growers Cooperative Society', 'Agago Grain Producers SACCO'],
                      objectives: 'Access to Innovation (A2I) & Smallholder Agricultural Modernization',
                      riskMitigation: 'Climate risk mitigated through drought-resistant seeds and early land preparation.',
                      milestones: [
                        { id: 'm-1', phase: 'Initiation', title: 'Community & Stakeholder Alignment', targetDate: '', completed: true },
                        { id: 'm-2', phase: 'Planning', title: 'Scope & Input Budget Approval', targetDate: '', completed: true },
                        { id: 'm-3', phase: 'On Process', title: 'Cooperative Mobilization & Farmer Profiling', targetDate: '', completed: false },
                        { id: 'm-4', phase: 'Implementation', title: 'Seed Subsidies & Grain Thresher Distribution', targetDate: '', completed: false },
                        { id: 'm-5', phase: 'Monitoring', title: 'Field M&E Quality Verification', targetDate: '', completed: false },
                        { id: 'm-6', phase: 'Completed', title: 'Handover & Impact Assessment', targetDate: '', completed: false }
                      ],
                      manager: user.name || 'Projects Manager'
                    });
                  }}
                  style={{ background: 'var(--color-primary, #1b4332)', color: '#fff', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(27,67,50,0.2)' }}
                >
                  <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>+</span> New Project
                </button>
              </div>

              {/* KPI Summary Cards (High-Contrast Text in Standard & Dark Mode) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="glass-panel" style={{ padding: '18px', background: '#ffffff', borderRadius: '12px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#475569', fontWeight: 700, letterSpacing: '0.04em' }}>Total Projects</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f3020', marginTop: '4px' }}>{projectsList.length}</div>
                  <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: '2px', fontWeight: 600 }}>
                    {projectsList.filter(p => p.status === 'Implementation' || p.status === 'On Process' || p.status === 'Active').length} Active / In Process
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '18px', background: '#ffffff', borderRadius: '12px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#475569', fontWeight: 700, letterSpacing: '0.04em' }}>Total Portfolios Budget</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f3020', marginTop: '4px' }}>
                    UGX {projectsList.reduce((acc, p) => acc + (Number(p.budget) || 0), 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: '2px', fontWeight: 600 }}>
                    Disbursed: UGX {projectsList.reduce((acc, p) => acc + (Number(p.spent) || 0), 0).toLocaleString()}
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '18px', background: '#ffffff', borderRadius: '12px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#475569', fontWeight: 700, letterSpacing: '0.04em' }}>Farmers Reached</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#166534', marginTop: '4px' }}>
                    {projectsList.reduce((acc, p) => acc + (Number(p.achievedBeneficiaries) || 0), 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: '2px', fontWeight: 600 }}>
                    Target: {projectsList.reduce((acc, p) => acc + (Number(p.targetBeneficiaries) || 0), 0).toLocaleString()} Farmers
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '18px', background: '#ffffff', borderRadius: '12px', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#475569', fontWeight: 700, letterSpacing: '0.04em' }}>Partner Cooperatives & Groups</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f3020', marginTop: '4px' }}>
                    {Array.from(new Set(projectsList.flatMap(p => p.cooperatives || []))).length || projectsList.reduce((acc, p) => acc + (Number(p.engagedCooperatives) || 0), 0)}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#059669', marginTop: '2px', fontWeight: 600 }}>
                    Participating Across Initiatives
                  </div>
                </div>
              </div>

              {/* Filters & Search: Search by Title/Donor, Waterfall Phase filter, and Cooperatives filter */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="🔍 Search projects by title, partner, code, manager, cooperative..."
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="form-input"
                  style={{ flex: 1, minWidth: '240px', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                />
                <select
                  value={projectStatusFilter}
                  onChange={(e) => setProjectStatusFilter(e.target.value)}
                  className="form-input"
                  style={{ width: 'auto', minWidth: '190px', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                >
                  <option value="all">All Waterfall Phases & Statuses</option>
                  {WATERFALL_PHASES.map(phase => (
                    <option key={phase.id} value={phase.id}>{phase.step} ({phase.label})</option>
                  ))}
                </select>
                <select
                  value={projectCoopFilter}
                  onChange={(e) => setProjectCoopFilter(e.target.value)}
                  className="form-input"
                  style={{ width: 'auto', minWidth: '220px', background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                >
                  <option value="all">All Farmers Organisations & Cooperatives</option>
                  {Array.from(new Set([
                    ...cooperativesList.map(c => c.name),
                    ...projectsList.flatMap(p => p.cooperatives || [])
                  ])).filter(Boolean).map(name => (
                    <option key={name} value={name}>🏢 {name}</option>
                  ))}
                </select>
              </div>

              {/* Editing / Creating Project Modal / Box (Waterfall Project Management Form) */}
              {editingProject && (
                <div className="glass-panel project-hub-form" style={{ padding: '24px', background: '#ffffff', borderRadius: '16px', border: '2px solid #10b981', marginBottom: '28px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '12px' }}>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--color-primary-dark, #0f3020)', fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{editingProject.id ? '✏️' : '📝'}</span>
                        {editingProject.id ? `Edit Project: ${editingProject.title}` : 'Create New Universal Project (Waterfall Model)'}
                      </h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>
                        Execute sequentially through Waterfall phases: Initiation ➔ Planning ➔ On Process ➔ Implementation ➔ Monitoring ➔ Completed.
                      </p>
                    </div>
                    <button type="button" onClick={() => setEditingProject(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
                  </div>

                  <form onSubmit={handleSaveProjectSubmit}>
                    {/* Row 1: Identification & Leadership */}
                    <div className="form-row-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark, #0f3020)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                            <span>🆔</span> Auto Project Code *
                          </label>
                          
                        </div>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={editingProject.code || ''}
                          onChange={(e) => setEditingProject({ ...editingProject, code: e.target.value })}
                          placeholder="e.g. PRJ-A2I-001"
                          style={{ background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                        />
                      </div>

                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark, #0f3020)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                            <span>🚀</span> Project Title *
                          </label>
                          
                        </div>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={editingProject.title || ''}
                          onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                          placeholder="e.g. Access to Innovation (A2I) Smallholder Mechanization"
                          style={{ background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                        />
                      </div>

                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark, #0f3020)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                            <span>🤝</span> Key Partner / Donor *
                          </label>
                          
                        </div>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={editingProject.partner || ''}
                          onChange={(e) => setEditingProject({ ...editingProject, partner: e.target.value })}
                          placeholder="e.g. Danish Government / Danida / Jeroma FCC"
                          style={{ background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                        />
                      </div>

                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark, #0f3020)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                            <span>👤</span> Project Manager / Lead *
                          </label>
                          
                        </div>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={editingProject.manager || ''}
                          onChange={(e) => setEditingProject({ ...editingProject, manager: e.target.value })}
                          placeholder="e.g. Daniel Okot (Projects Lead)"
                          style={{ background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                        />
                      </div>
                    </div>

                    {/* Row 2: Waterfall Status Lifecycle & Execution Progress */}
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', marginBottom: '16px' }}>
                      <div className="form-row-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '12px' }}>
                        <div className="form-group">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark, #0f3020)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                              <span>📊</span> Waterfall Project Phase / Status *
                            </label>
                            
                          </div>
                          <select
                            className="form-input"
                            value={editingProject.status || 'On Process'}
                            onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value })}
                            style={{ background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', fontWeight: 700 }}
                          >
                            <option value="Initiation">1. Initiation (Concept, Charter & Stakeholder Definition)</option>
                            <option value="Planning">2. Planning (Scope, Timeline & Budget Allocation)</option>
                            <option value="On Process">3. On Process (Preparation, Design & Cooperative Mobilization)</option>
                            <option value="Implementation">4. Implementation (Active Field Rollout & Seed/Machinery Distribution)</option>
                            <option value="Monitoring">5. Monitoring & Evaluation (Quality Control, Verification & Audit)</option>
                            <option value="Completed">6. Completed (Handover, Impact Reporting & Final Audit)</option>
                            <option value="On Hold">⏸️ On Hold (Temporarily Paused / Suspended)</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark, #0f3020)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                              <span>📈</span> Overall Execution Progress: {editingProject.progressPercent || 0}%
                            </label>
                            
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={editingProject.progressPercent || 0}
                              onChange={(e) => setEditingProject({ ...editingProject, progressPercent: Number(e.target.value) })}
                              style={{ flex: 1, accentColor: '#10b981' }}
                            />
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={editingProject.progressPercent || 0}
                              onChange={(e) => setEditingProject({ ...editingProject, progressPercent: Number(e.target.value) })}
                              className="form-input"
                              style={{ width: '70px', padding: '6px 8px', background: '#fff', color: '#0f172a', fontWeight: 700, textAlign: 'center' }}
                            />
                            <span style={{ fontWeight: 700, color: '#0f3020' }}>%</span>
                          </div>
                        </div>
                      </div>

                      {/* Visual Waterfall Phase Stepper */}
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>
                          Waterfall Method Sequence:
                        </div>
                        <div className="waterfall-stepper" style={{ margin: 0 }}>
                          {WATERFALL_PHASES.filter(p => p.id !== 'On Hold').map((phase, idx, arr) => {
                            const currentInfo = getWaterfallPhaseInfo(editingProject.status);
                            const isActive = currentInfo.id === phase.id;
                            const isPassed = currentInfo.order > phase.order;
                            return (
                              <React.Fragment key={phase.id}>
                                <div
                                  className={`waterfall-step ${isActive ? `active active-${phase.id.toLowerCase().replace(/\s+/g, '')}` : isPassed ? 'passed' : ''}`}
                                  style={{
                                    borderColor: isActive ? phase.color : isPassed ? '#10b981' : '#cbd5e1',
                                    color: isActive ? phase.color : isPassed ? '#047857' : '#64748b',
                                    background: isActive ? phase.bg : isPassed ? '#ecfdf5' : '#ffffff',
                                    fontWeight: isActive ? 800 : 600,
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => setEditingProject({ ...editingProject, status: phase.id })}
                                  title={`Click to set stage to ${phase.label}`}
                                >
                                  <span>{isPassed ? '✓' : isActive ? '●' : phase.order}</span>
                                  <span>{phase.label}</span>
                                </div>
                                {idx < arr.length - 1 && <span className="waterfall-arrow">➔</span>}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Schedule & Timeline */}
                    <div className="form-row-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark, #0f3020)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                            <span>📅</span> Planned Start Date *
                          </label>
                          
                        </div>
                        <input
                          type="date"
                          required
                          className="form-input"
                          value={editingProject.startDate || ''}
                          onChange={(e) => setEditingProject({ ...editingProject, startDate: e.target.value })}
                          style={{ background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                        />
                      </div>

                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark, #0f3020)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                            <span>🏁</span> Handover / End Date *
                          </label>
                          
                        </div>
                        <input
                          type="date"
                          required
                          className="form-input"
                          value={editingProject.endDate || ''}
                          onChange={(e) => setEditingProject({ ...editingProject, endDate: e.target.value })}
                          style={{ background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                        />
                      </div>

                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark, #0f3020)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                            <span>⏱️</span> Schedule Duration
                          </label>
                          
                        </div>
                        <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#0f3020' }}>
                          {editingProject.startDate && editingProject.endDate ? (
                            (() => {
                              const start = new Date(editingProject.startDate);
                              const end = new Date(editingProject.endDate);
                              const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
                              const months = (days / 30.4).toFixed(1);
                              return days > 0 ? `${months} Months (${days} Days)` : 'End date must follow start date';
                            })()
                          ) : 'Specify start & end dates'}
                        </div>
                      </div>
                    </div>

                    {/* Row 4: Financial & Budget Management */}
                    <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1.5px solid #86efac', marginBottom: '16px' }}>
                      <div className="form-row-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '12px' }}>
                        <div className="form-group">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#14532d', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                              <span>💰</span> Total Allocated Budget (UGX) *
                            </label>
                            
                          </div>
                          <input
                            type="number"
                            min="0"
                            required
                            className="form-input"
                            value={editingProject.budget || 0}
                            onChange={(e) => setEditingProject({ ...editingProject, budget: Number(e.target.value) })}
                            style={{ background: '#ffffff', color: '#0f172a', border: '1.5px solid #86efac', fontWeight: 700 }}
                          />
                        </div>

                        <div className="form-group">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#14532d', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                              <span>💳</span> Disbursed / Expenditure (UGX)
                            </label>
                            
                          </div>
                          <input
                            type="number"
                            min="0"
                            className="form-input"
                            value={editingProject.spent || 0}
                            onChange={(e) => setEditingProject({ ...editingProject, spent: Number(e.target.value) })}
                            style={{ background: '#ffffff', color: '#0f172a', border: '1.5px solid #86efac', fontWeight: 700 }}
                          />
                        </div>

                        <div className="form-group">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#14532d', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                              <span>💵</span> Remaining Budget Balance
                            </label>
                            <span style={{ fontSize: '0.72rem', color: '#047857', background: '#ffffff', border: '1px solid #86efac', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                              Burn Rate: {((editingProject.spent || 0) / (editingProject.budget || 1) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div style={{ padding: '10px 14px', background: '#ffffff', border: '1.5px solid #86efac', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 800, color: '#166534' }}>
                            UGX {Math.max(0, (editingProject.budget || 0) - (editingProject.spent || 0)).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Row 5: Beneficiaries & Target Outreach */}
                    <div className="form-row-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark, #0f3020)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                            <span>👨‍🌾</span> Target Beneficiaries (Farmers)
                          </label>
                          
                        </div>
                        <input
                          type="number"
                          min="0"
                          className="form-input"
                          value={editingProject.targetBeneficiaries || 0}
                          onChange={(e) => setEditingProject({ ...editingProject, targetBeneficiaries: Number(e.target.value) })}
                          style={{ background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                        />
                      </div>

                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark, #0f3020)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                            <span>✅</span> Achieved Beneficiaries (Farmers)
                          </label>
                          
                        </div>
                        <input
                          type="number"
                          min="0"
                          className="form-input"
                          value={editingProject.achievedBeneficiaries || 0}
                          onChange={(e) => setEditingProject({ ...editingProject, achievedBeneficiaries: Number(e.target.value) })}
                          style={{ background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                        />
                      </div>

                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark, #0f3020)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                            <span>🎯</span> Target Cooperatives / Groups
                          </label>
                          
                        </div>
                        <input
                          type="number"
                          min="0"
                          className="form-input"
                          value={editingProject.targetCooperatives || 0}
                          onChange={(e) => setEditingProject({ ...editingProject, targetCooperatives: Number(e.target.value) })}
                          style={{ background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                        />
                      </div>

                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark, #0f3020)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                            <span>🏢</span> Engaged Cooperatives Count
                          </label>
                          
                        </div>
                        <input
                          type="number"
                          min="0"
                          className="form-input"
                          value={(editingProject.cooperatives || []).length || editingProject.engagedCooperatives || 0}
                          onChange={(e) => setEditingProject({ ...editingProject, engagedCooperatives: Number(e.target.value) })}
                          style={{ background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', fontWeight: 600 }}
                        />
                      </div>
                    </div>

                    {/* Row 6: Farmers Organisations & Cooperatives Under This Project (User Requested) */}
                    <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1.5px solid #cbd5e1', marginBottom: '18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f3020', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <span>🏢</span> Farmers Organisations & Cooperatives Under This Project *
                          </label>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#475569' }}>
                            Assign active cooperatives and SACCOs partnering in this initiative. Click any registered cooperative to add/remove, or enter a custom farmer organisation.
                          </p>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#047857', background: '#d1fae5', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '6px', fontWeight: 700 }}>
                          {(editingProject.cooperatives || []).length} Organisation(s) Assigned
                        </span>
                      </div>

                      {/* Custom Cooperative Add Input */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Type new Farmer Organisation, SACCO, or Group Name (e.g. Puranga Women Maize Producers)..."
                          value={customCoopInput}
                          onChange={(e) => setCustomCoopInput(e.target.value)}
                          className="form-input"
                          style={{ flex: 1, background: '#fff', color: '#0f172a', border: '1.5px solid #cbd5e1', fontWeight: 600, fontSize: '0.85rem' }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (customCoopInput.trim()) {
                                const current = editingProject.cooperatives || [];
                                if (!current.includes(customCoopInput.trim())) {
                                  const updated = [...current, customCoopInput.trim()];
                                  setEditingProject({
                                    ...editingProject,
                                    cooperatives: updated,
                                    engagedCooperatives: updated.length
                                  });
                                }
                                setCustomCoopInput('');
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customCoopInput.trim()) {
                              const current = editingProject.cooperatives || [];
                              if (!current.includes(customCoopInput.trim())) {
                                const updated = [...current, customCoopInput.trim()];
                                setEditingProject({
                                  ...editingProject,
                                  cooperatives: updated,
                                  engagedCooperatives: updated.length
                                });
                              }
                              setCustomCoopInput('');
                            }
                          }}
                          className="btn btn-primary"
                          style={{ background: '#10b981', borderColor: '#059669', color: '#fff', padding: '9px 18px', fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' }}
                        >
                          + Add Organisation
                        </button>
                      </div>

                      {/* Quick-Pick Registered Cooperatives from System */}
                      <div style={{ marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                          Registered Cooperatives in Database (Click to Add / Remove):
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {(cooperativesList.length > 0 ? cooperativesList : [
                            { id: 'c-1', name: 'Pader Sunflower Growers Cooperative Society' },
                            { id: 'c-2', name: 'Agago Grain Producers SACCO' },
                            { id: 'c-3', name: 'Kitgum Mixed Farming Cooperative Society' },
                            { id: 'c-4', name: 'Abim Oilseed & Agroforestry Association' },
                            { id: 'c-5', name: 'Karenga Green Growers Farmer Group' },
                            { id: 'c-6', name: 'Lira Central Smallholders Cooperative' },
                            { id: 'c-7', name: 'Kole Agro-Producers Association' }
                          ]).map(coop => {
                            const coopName = coop.name;
                            const isAssigned = (editingProject.cooperatives || []).includes(coopName);
                            return (
                              <button
                                key={coop.id || coopName}
                                type="button"
                                onClick={() => {
                                  const current = editingProject.cooperatives || [];
                                  const next = isAssigned
                                    ? current.filter(n => n !== coopName)
                                    : [...current, coopName];
                                  setEditingProject({
                                    ...editingProject,
                                    cooperatives: next,
                                    engagedCooperatives: next.length
                                  });
                                }}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: '20px',
                                  fontSize: '0.78rem',
                                  fontWeight: isAssigned ? 800 : 500,
                                  border: '1.5px solid',
                                  borderColor: isAssigned ? '#10b981' : '#cbd5e1',
                                  background: isAssigned ? '#ecfdf5' : '#ffffff',
                                  color: isAssigned ? '#065f46' : '#334155',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <span>{isAssigned ? '✓' : '+'}</span>
                                <span>{coopName}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Currently Assigned Cooperatives Tags */}
                      {(editingProject.cooperatives || []).length > 0 && (
                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                            Currently Assigned Under This Project ({editingProject.cooperatives.length}):
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {editingProject.cooperatives.map(coopName => (
                              <span
                                key={coopName}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  background: '#dcfce7',
                                  color: '#14532d',
                                  border: '1px solid #86efac',
                                  fontSize: '0.8rem',
                                  fontWeight: 700
                                }}
                              >
                                <span>🏢</span>
                                <span>{coopName}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = (editingProject.cooperatives || []).filter(n => n !== coopName);
                                    setEditingProject({
                                      ...editingProject,
                                      cooperatives: next,
                                      engagedCooperatives: next.length
                                    });
                                  }}
                                  style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 800, padding: 0 }}
                                  title="Remove organisation"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Row 7: Strategic Objectives, Scope & Interventions */}
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark, #0f3020)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                          <span>🎯</span> Strategic Objectives, Scope & Interventions *
                        </label>
                        
                      </div>
                      <textarea
                        className="form-input"
                        rows="3"
                        required
                        value={editingProject.objectives || ''}
                        onChange={(e) => setEditingProject({ ...editingProject, objectives: e.target.value })}
                        placeholder="Detail the project goals, value chains (sunflower, simsim, maize, soya, tree nursery), technology deployed, and implementation methodology..."
                        style={{ background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', fontWeight: 500, fontSize: '0.85rem', lineHeight: 1.5 }}
                      />
                    </div>

                    {/* Row 8: Waterfall Deliverables & Stage Milestones */}
                    <div style={{ marginBottom: '18px', background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1.5px solid #cbd5e1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f3020', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>📋</span> Waterfall Deliverables & Stage Milestones
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Tag deliverables to sequential stages to track progress through the Waterfall methodology.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newM = {
                              id: 'm-' + Date.now(),
                              phase: editingProject.status || 'On Process',
                              title: 'New Waterfall Deliverable',
                              targetDate: '',
                              completed: false
                            };
                            setEditingProject({ ...editingProject, milestones: [...(editingProject.milestones || []), newM] });
                          }}
                          style={{ fontSize: '0.78rem', padding: '5px 12px', background: '#ecfdf5', color: '#047857', border: '1.5px solid #a7f3d0', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
                        >
                          + Add Milestone Deliverable
                        </button>
                      </div>

                      {(editingProject.milestones || []).length === 0 ? (
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>No milestones added yet. Click "+ Add Milestone Deliverable" above.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {editingProject.milestones.map((m, idx) => (
                            <div key={m.id || idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                              <input
                                type="checkbox"
                                checked={!!m.completed}
                                onChange={(e) => {
                                  const nextM = editingProject.milestones.map((item, i) => i === idx ? { ...item, completed: e.target.checked } : item);
                                  const completedCount = nextM.filter(x => x.completed).length;
                                  const autoProgress = Math.round((completedCount / nextM.length) * 100);
                                  setEditingProject({
                                    ...editingProject,
                                    milestones: nextM,
                                    progressPercent: autoProgress
                                  });
                                }}
                                style={{ width: '18px', height: '18px', accentColor: '#10b981', cursor: 'pointer' }}
                              />
                              <select
                                className="form-input"
                                value={m.phase || 'On Process'}
                                onChange={(e) => {
                                  const nextM = editingProject.milestones.map((item, i) => i === idx ? { ...item, phase: e.target.value } : item);
                                  setEditingProject({ ...editingProject, milestones: nextM });
                                }}
                                style={{ width: '130px', padding: '4px 8px', fontSize: '0.78rem', background: '#fff', color: '#0f172a', fontWeight: 700 }}
                              >
                                <option value="Initiation">1. Initiation</option>
                                <option value="Planning">2. Planning</option>
                                <option value="On Process">3. On Process</option>
                                <option value="Implementation">4. Implementation</option>
                                <option value="Monitoring">5. Monitoring</option>
                                <option value="Completed">6. Completed</option>
                              </select>
                              <input
                                type="text"
                                className="form-input"
                                value={m.title || ''}
                                onChange={(e) => {
                                  const nextM = editingProject.milestones.map((item, i) => i === idx ? { ...item, title: e.target.value } : item);
                                  setEditingProject({ ...editingProject, milestones: nextM });
                                }}
                                style={{ flex: 1, minWidth: '180px', padding: '4px 8px', fontSize: '0.825rem', background: '#fff', color: '#0f172a', fontWeight: 600 }}
                                placeholder="Milestone deliverable description"
                              />
                              <input
                                type="date"
                                className="form-input"
                                value={m.targetDate || ''}
                                onChange={(e) => {
                                  const nextM = editingProject.milestones.map((item, i) => i === idx ? { ...item, targetDate: e.target.value } : item);
                                  setEditingProject({ ...editingProject, milestones: nextM });
                                }}
                                style={{ width: '130px', padding: '4px 8px', fontSize: '0.8rem', background: '#fff', color: '#0f172a' }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const nextM = editingProject.milestones.filter((_, i) => i !== idx);
                                  setEditingProject({ ...editingProject, milestones: nextM });
                                }}
                                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 800, fontSize: '0.9rem', padding: '0 4px' }}
                                title="Remove deliverable"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Row 9: Risk Management & Field Safeguards */}
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark, #0f3020)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                          <span>🛡️</span> Risk Management, Safeguards & Field Reporting
                        </label>
                        
                      </div>
                      <textarea
                        className="form-input"
                        rows="2"
                        value={editingProject.riskMitigation || ''}
                        onChange={(e) => setEditingProject({ ...editingProject, riskMitigation: e.target.value })}
                        placeholder="Anticipated operational risks (weather volatility, input logistics, credit repayment) and proactive mitigation safeguards..."
                        style={{ background: '#ffffff', color: '#0f172a', border: '1.5px solid #cbd5e1', fontWeight: 500, fontSize: '0.85rem' }}
                      />
                    </div>

                    {/* Form Action Buttons */}
                    <div style={{ display: 'flex', gap: '12px', borderTop: '1.5px solid #e2e8f0', paddingTop: '16px' }}>
                      <button type="submit" disabled={isSavingProject} className="btn btn-primary" style={{ padding: '11px 28px', background: '#10b981', borderColor: '#059669', color: '#fff', fontWeight: 700, fontSize: '0.92rem' }}>
                        {isSavingProject ? 'Saving...' : '💾 Save Universal Project'}
                      </button>
                      <button type="button" onClick={() => setEditingProject(null)} className="btn btn-secondary" style={{ padding: '11px 20px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', fontWeight: 600, fontSize: '0.92rem' }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Projects Grid List (Waterfall Cards with High Contrast Text) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
                {projectsList
                  .filter(p => {
                    const matchSearch = !projectSearch || 
                      (p.title || '').toLowerCase().includes(projectSearch.toLowerCase()) ||
                      (p.partner || '').toLowerCase().includes(projectSearch.toLowerCase()) ||
                      (p.code || '').toLowerCase().includes(projectSearch.toLowerCase()) ||
                      (p.manager || '').toLowerCase().includes(projectSearch.toLowerCase()) ||
                      (p.cooperatives || []).some(c => c.toLowerCase().includes(projectSearch.toLowerCase()));
                    const currentPhase = getWaterfallPhaseInfo(p.status);
                    const matchStatus = projectStatusFilter === 'all' || p.status === projectStatusFilter || currentPhase.id === projectStatusFilter;
                    const matchCoop = projectCoopFilter === 'all' || (p.cooperatives || []).some(c => c.toLowerCase().includes(projectCoopFilter.toLowerCase()));
                    return matchSearch && matchStatus && matchCoop;
                  })
                  .map(project => {
                    const pctBen = project.targetBeneficiaries > 0 ? Math.min(100, Math.round(((project.achievedBeneficiaries || 0) / project.targetBeneficiaries) * 100)) : 0;
                    const pctBudget = project.budget > 0 ? Math.min(100, Math.round(((project.spent || 0) / project.budget) * 100)) : 0;
                    const phaseInfo = getWaterfallPhaseInfo(project.status);
                    const progress = project.progressPercent !== undefined ? project.progressPercent : pctBen;

                    return (
                      <div
                        key={project.id}
                        className="glass-panel project-card"
                        style={{
                          padding: '22px',
                          background: '#ffffff',
                          borderRadius: '16px',
                          border: '1.5px solid #e2e8f0',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div>
                          {/* Top Badges: Code, Phase, and Progress */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, padding: '4px 9px', borderRadius: '6px', background: '#f1f5f9', color: '#0f3020', border: '1px solid #cbd5e1' }}>
                              🆔 {project.code || 'PRJ'}
                            </span>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <span style={{
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                padding: '4px 10px',
                                borderRadius: '12px',
                                background: phaseInfo.bg,
                                color: phaseInfo.color,
                                border: `1.5px solid ${phaseInfo.border}`
                              }}>
                                {phaseInfo.step} ({phaseInfo.label})
                              </span>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '3px 8px', borderRadius: '10px', background: '#ecfdf5', color: '#047857' }}>
                                {progress}%
                              </span>
                            </div>
                          </div>

                          {/* Title & Donor */}
                          <h4 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: 'var(--color-primary-dark, #0f3020)', fontWeight: 800, lineHeight: 1.35 }}>
                            {project.title}
                          </h4>
                          <div style={{ fontSize: '0.82rem', color: '#1e293b', marginBottom: '10px', fontWeight: 600 }}>
                            <span style={{ color: '#64748b', fontWeight: 500 }}>Funder / Partner:</span> {project.partner || 'Jeroma Internal'}
                          </div>

                          {/* Waterfall Method Mini-Pipeline Stepper on Card */}
                          <div style={{ margin: '10px 0 12px 0', padding: '8px 10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                              Waterfall Stage Progression:
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                              {WATERFALL_PHASES.filter(p => p.id !== 'On Hold').map((ph, idx, arr) => {
                                const isCurrent = phaseInfo.id === ph.id;
                                const isPassed = phaseInfo.order > ph.order;
                                return (
                                  <React.Fragment key={ph.id}>
                                    <span
                                      style={{
                                        fontSize: '0.68rem',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontWeight: isCurrent ? 800 : 500,
                                        background: isCurrent ? ph.bg : isPassed ? '#ecfdf5' : '#ffffff',
                                        color: isCurrent ? ph.color : isPassed ? '#047857' : '#94a3b8',
                                        border: '1px solid',
                                        borderColor: isCurrent ? ph.border : isPassed ? '#a7f3d0' : '#e2e8f0'
                                      }}
                                    >
                                      {isPassed ? '✓ ' : ''}{ph.label}
                                    </span>
                                    {idx < arr.length - 1 && <span style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>➔</span>}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>

                          {/* Scope / Objectives */}
                          {project.objectives && (
                            <p style={{ fontSize: '0.82rem', color: '#334155', margin: '0 0 12px 0', lineHeight: 1.45, fontWeight: 500 }}>
                              {project.objectives.length > 130 ? project.objectives.slice(0, 130) + '...' : project.objectives}
                            </p>
                          )}

                          {/* Progress indicators: Beneficiaries & Budget */}
                          <div style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#334155', marginBottom: '4px', fontWeight: 600 }}>
                              <span>Individual Farmers:</span>
                              <strong style={{ color: '#0f3020' }}>{(project.achievedBeneficiaries || 0).toLocaleString()} / {(project.targetBeneficiaries || 0).toLocaleString()} ({pctBen}%)</strong>
                            </div>
                            <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${pctBen}%`, height: '100%', background: '#10b981', borderRadius: '4px' }} />
                            </div>
                          </div>

                          <div style={{ marginBottom: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#334155', marginBottom: '4px', fontWeight: 600 }}>
                              <span>Budget Burn:</span>
                              <strong style={{ color: '#0f3020' }}>
                                UGX {((project.spent || 0) / 1000000).toFixed(1)}M / {((project.budget || 0) / 1000000).toFixed(1)}M ({pctBudget}%)
                              </strong>
                            </div>
                            <div style={{ width: '100%', height: '7px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${pctBudget}%`, height: '100%', background: pctBudget > 90 ? '#ef4444' : '#1b4332', borderRadius: '4px' }} />
                            </div>
                          </div>

                          {/* Farmers Organisations & Cooperatives Under Project (User Requested) */}
                          <div style={{ marginBottom: '14px' }}>
                            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f3020', marginBottom: '6px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>🏢</span> Participating Farmers Organisations ({(project.cooperatives || []).length || project.engagedCooperatives || 0}):
                            </div>
                            {(project.cooperatives && project.cooperatives.length > 0) ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {project.cooperatives.map(coopName => (
                                  <span key={coopName} style={{ fontSize: '0.72rem', padding: '3px 8px', background: '#ecfdf5', borderRadius: '6px', color: '#065f46', border: '1px solid #a7f3d0', fontWeight: 700 }}>
                                    🏢 {coopName}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                                {project.engagedCooperatives ? `${project.engagedCooperatives} Partner Cooperatives Engaged` : 'No cooperatives linked yet'}
                              </span>
                            )}
                          </div>

                          {/* Interactive Milestones / Deliverables Preview */}
                          {project.milestones && project.milestones.length > 0 && (
                            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', marginBottom: '14px', border: '1.5px solid #e2e8f0' }}>
                              <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0f3020', marginBottom: '6px', textTransform: 'uppercase' }}>
                                Waterfall Deliverables ({project.milestones.filter(m => m.completed).length}/{project.milestones.length})
                              </div>
                              {project.milestones.slice(0, 3).map((m, idx) => (
                                <div
                                  key={m.id || idx}
                                  onClick={() => handleToggleMilestone(project, m.id)}
                                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: m.completed ? '#059669' : '#1e293b', cursor: 'pointer', marginBottom: '4px', fontWeight: 600 }}
                                  title="Click to toggle completion"
                                >
                                  <span>{m.completed ? '✅' : '⬜'}</span>
                                  <span style={{ textDecoration: m.completed ? 'line-through' : 'none' }}>{m.title}</span>
                                </div>
                              ))}
                              {project.milestones.length > 3 && (
                                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>+ {project.milestones.length - 3} more deliverables</div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions & Lead */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid #f1f5f9', paddingTop: '12px', marginTop: '8px' }}>
                          <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>Lead: {project.manager || 'Jeroma PM'}</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomCoopInput('');
                                setEditingProject({ ...project });
                              }}
                              style={{ padding: '7px 14px', fontSize: '0.8rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProjectClick(project.id)}
                              style={{ padding: '7px 10px', fontSize: '0.8rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB 2: Staff, Positions & Human Resources Hub */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'staff' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.35rem', fontFamily: 'var(--font-heading)', fontWeight: 700, margin: '0 0 6px 0' }}>
                    👥 Staff, Positions & HR Hub
                  </h3>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.875rem', margin: 0 }}>
                    Manage all personnel across Jeroma: Managing Director, General Manager, Agronomists, Extension Officers, Environment Supervisors, Finance, Factory, and Fleet.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setEditingStaff({
                    employeeId: generateAutoEmployeeId('PRJ'),
                    name: '',
                    title: 'Project Field Lead',
                    department: 'project/Program manager',
                    district: '101. Pader',
                    phone: '+256 77',
                    email: '',
                    employmentType: 'Full-Time',
                    status: 'Active',
                    responsibilities: 'Cooperative mobilization, field data tracking, seed distribution'
                  })}
                  style={{ background: 'var(--color-primary)', color: '#fff', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '8px' }}
                >
                  <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>+</span> Register Staff Member
                </button>
              </div>

              {/* KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="glass-panel" style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', fontWeight: 600 }}>Total Staff</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginTop: '4px' }}>{staffList.length}</div>
                  <div style={{ fontSize: '0.75rem', color: '#52b788', marginTop: '2px' }}>{staffList.filter(s => s.status === 'Active').length} Active Employees</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', fontWeight: 600 }}>Agronomy & Extension</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2d6a4f', marginTop: '4px' }}>
                    {staffList.filter(s => (s.department || '').toLowerCase().includes('agronomy') || (s.department || '').toLowerCase().includes('field')).length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>Field Officers on Ground</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', fontWeight: 600 }}>Operations & Fleet</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1b4332', marginTop: '4px' }}>
                    {staffList.filter(s => (s.department || '').toLowerCase().includes('factory') || (s.department || '').toLowerCase().includes('fleet') || (s.department || '').toLowerCase().includes('warehouse')).length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>Processing & Logistics</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', fontWeight: 600 }}>Executive & Admin</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#081c15', marginTop: '4px' }}>
                    {staffList.filter(s => (s.department || '').toLowerCase().includes('executive') || (s.department || '').toLowerCase().includes('finance')).length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>HQ & Management</div>
                </div>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="🔍 Search staff by name, employee ID, position, phone..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="form-input"
                  style={{ flex: 1, minWidth: '220px' }}
                />
                <select
                  value={staffDeptFilter}
                  onChange={(e) => setStaffDeptFilter(e.target.value)}
                  className="form-input"
                  style={{ width: 'auto', minWidth: '200px' }}
                >
                  <option value="all">All Official Departments (6)</option>
                  {JEROMA_DEPARTMENTS.map(d => (
                    <option key={d.id} value={d.name}>🏢 {d.name} ({d.code})</option>
                  ))}
                </select>
                <select
                  value={staffDistrictFilter}
                  onChange={(e) => setStaffDistrictFilter(e.target.value)}
                  className="form-input"
                  style={{ width: 'auto', minWidth: '180px' }}
                >
                  <option value="all">All Stations (146 Districts)</option>
                  <option value="Headquarters">HQ - Central Office</option>
                  {UGANDA_DISTRICTS.map(d => (
                    <option key={d.code} value={d.name}>{d.code}. {d.name}</option>
                  ))}
                </select>
              </div>

              {/* Edit / Create Staff Member Modal */}
              {editingStaff && (
                <div className="glass-panel" style={{ padding: '24px', background: '#faf9f6', borderRadius: '16px', border: '2px solid var(--color-primary)', marginBottom: '28px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.15rem', fontWeight: 700 }}>
                      {editingStaff.id ? `Edit Staff: ${editingStaff.name}` : '👤 Register New Staff Member'}
                    </h4>
                    <button type="button" onClick={() => setEditingStaff(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                  </div>
                  <form onSubmit={handleSaveStaffSubmit}>
                    <div className="form-row-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      {/* Field: Auto Employee ID */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-dark)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🆔</span> Auto Employee ID *
                          </label>
                          
                        </div>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={editingStaff.employeeId || ''}
                          onChange={(e) => setEditingStaff({ ...editingStaff, employeeId: e.target.value })}
                        />
                      </div>

                      {/* Field: Full Name */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-dark)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>👤</span> Your Full Name *
                          </label>
                          
                        </div>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={editingStaff.name || ''}
                          onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                          placeholder="e.g. Akello Grace"
                        />
                      </div>

                      {/* Field: Position / Title */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-dark)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>💼</span> Position / Role Title *
                          </label>
                          
                        </div>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={editingStaff.title || ''}
                          onChange={(e) => setEditingStaff({ ...editingStaff, title: e.target.value })}
                          placeholder="e.g. Finance Officer, Projects Lead"
                        />
                      </div>

                      {/* Field: Official Department (6 departments) */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-dark)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🏢</span> Jeroma Department *
                          </label>
                          
                        </div>
                        <select
                          className="form-input"
                          value={editingStaff.department || 'project/Program manager'}
                          onChange={(e) => {
                            const newDept = e.target.value;
                            const deptObj = JEROMA_DEPARTMENTS.find(d => d.name === newDept);
                            setEditingStaff({ 
                              ...editingStaff, 
                              department: newDept,
                              employeeId: editingStaff.employeeId?.startsWith('JER-STF-') 
                                ? generateAutoEmployeeId(deptObj?.code || 'GEN') 
                                : editingStaff.employeeId
                            });
                          }}
                        >
                          {JEROMA_DEPARTMENTS.map(d => (
                            <option key={d.id} value={d.name}>🏢 {d.name} ({d.code})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-row-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      {/* Field: Base District (All 146 Districts) */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-dark)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>📍</span> District / Station in Uganda *
                          </label>
                          
                        </div>
                        <select
                          className="form-input"
                          value={editingStaff.district || '101. Pader'}
                          onChange={(e) => setEditingStaff({ ...editingStaff, district: e.target.value })}
                        >
                          <option value="Headquarters">HQ - Central Office</option>
                          {UGANDA_DISTRICTS.map(d => (
                            <option key={d.code} value={d.code + '. ' + d.name}>{d.code}. {d.name} ({d.region})</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editingStaff.phone || ''}
                          onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                          placeholder="+256 7..."
                        />
                      </div>
                      <div className="form-group">
                        <label>Email Address</label>
                        <input
                          type="email"
                          className="form-input"
                          value={editingStaff.email || ''}
                          onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                          placeholder="staff@jeromafarmers.com"
                        />
                      </div>
                      <div className="form-group">
                        <label>Employment Type</label>
                        <select
                          className="form-input"
                          value={editingStaff.employmentType || 'Full-Time'}
                          onChange={(e) => setEditingStaff({ ...editingStaff, employmentType: e.target.value })}
                        >
                          <option value="Full-Time">Full-Time</option>
                          <option value="Contract">Contract</option>
                          <option value="Seasonal">Seasonal</option>
                          <option value="Intern">Intern</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Status</label>
                        <select
                          className="form-input"
                          value={editingStaff.status || 'Active'}
                          onChange={(e) => setEditingStaff({ ...editingStaff, status: e.target.value })}
                        >
                          <option value="Active">Active</option>
                          <option value="On Leave">On Leave</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label>Key Responsibilities</label>
                      <textarea
                        className="form-input"
                        rows="2"
                        value={editingStaff.responsibilities || ''}
                        onChange={(e) => setEditingStaff({ ...editingStaff, responsibilities: e.target.value })}
                        placeholder="Brief summary of duties and operational jurisdiction..."
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button type="submit" disabled={isSavingStaff} className="btn btn-primary" style={{ padding: '10px 24px' }}>
                        {isSavingStaff ? 'Saving...' : '💾 Save Staff Record'}
                      </button>
                      <button type="button" onClick={() => setEditingStaff(null)} className="btn btn-secondary" style={{ padding: '10px 18px' }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Staff Table */}
              <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '12px 16px' }}>Staff Member</th>
                      <th style={{ padding: '12px 16px' }}>Position & Department</th>
                      <th style={{ padding: '12px 16px' }}>Station</th>
                      <th style={{ padding: '12px 16px' }}>Phone / Email</th>
                      <th style={{ padding: '12px 16px' }}>Type</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList
                      .filter(s => {
                        const matchSearch = !staffSearch ||
                          (s.name || '').toLowerCase().includes(staffSearch.toLowerCase()) ||
                          (s.employeeId || '').toLowerCase().includes(staffSearch.toLowerCase()) ||
                          (s.title || '').toLowerCase().includes(staffSearch.toLowerCase()) ||
                          (s.phone || '').includes(staffSearch);
                        const matchDept = staffDeptFilter === 'all' || s.department === staffDeptFilter;
                        const matchDistrict = staffDistrictFilter === 'all' || s.district === staffDistrictFilter;
                        return matchSearch && matchDept && matchDistrict;
                      })
                      .map(staff => (
                        <tr key={staff.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>{staff.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{staff.employeeId}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 600 }}>{staff.title}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-primary)' }}>{staff.department}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#f1f5f9', fontSize: '0.75rem' }}>
                              📍 {staff.district || 'Headquarters'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div><a href={`tel:${staff.phone}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{staff.phone || '—'}</a></div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{staff.email || ''}</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '0.75rem' }}>{staff.employmentType || 'Full-Time'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '12px',
                              background: staff.status === 'Active' ? '#e8f5e9' : '#fff7ed',
                              color: staff.status === 'Active' ? '#2e7d32' : '#c2410c'
                            }}>
                              {staff.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => setEditingStaff({ ...staff })}
                              style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '6px' }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStaffClick(staff.id)}
                              style={{ padding: '4px 6px', fontSize: '0.75rem', background: 'rgba(217,4,41,0.08)', color: '#d90429', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB 3: Cooperatives, SACCOs & Machinery Hub */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'cooperatives' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.35rem', fontFamily: 'var(--font-heading)', fontWeight: 700, margin: '0 0 6px 0' }}>
                    🤝 Cooperatives & SACCOs Directory
                  </h3>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.875rem', margin: 0 }}>
                    Profile, monitor and coordinate partner farming cooperatives across the 7 northern districts with member demographics, acreage, and allocated machinery.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleExportCoopsCsv}
                    className="btn btn-secondary"
                    style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    📥 Export CSV
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setEditingCooperative({
                      code: generateAutoCoopCode('Pader'),
                      name: '',
                      district: '101. Pader',
                      subcounty: '',
                      contactPerson: '',
                      phone: '+256 77',
                      membersCount: 40,
                      femaleMembers: 20,
                      youthMembers: 15,
                      totalAcreage: 80,
                      cropsSpecialization: ['Sunflower', 'Soya Beans'],
                      machineryAllocated: [],
                      status: 'Active'
                    })}
                    style={{ background: 'var(--color-primary)', color: '#fff', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '8px' }}
                  >
                    <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>+</span> Register Cooperative
                  </button>
                </div>
              </div>

              {/* KPI Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="glass-panel" style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', fontWeight: 600 }}>Partner Cooperatives</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginTop: '4px' }}>{cooperativesList.length}</div>
                  <div style={{ fontSize: '0.75rem', color: '#52b788', marginTop: '2px' }}>Across 7 Districts</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', fontWeight: 600 }}>Total Farmer Members</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2d6a4f', marginTop: '4px' }}>
                    {cooperativesList.reduce((acc, c) => acc + (Number(c.membersCount) || 0), 0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>
                    Female: {cooperativesList.reduce((acc, c) => acc + (Number(c.femaleMembers) || 0), 0).toLocaleString()} | Youth: {cooperativesList.reduce((acc, c) => acc + (Number(c.youthMembers) || 0), 0).toLocaleString()}
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', fontWeight: 600 }}>Total Acreage Under Management</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1b4332', marginTop: '4px' }}>
                    {cooperativesList.reduce((acc, c) => acc + (Number(c.totalAcreage) || 0), 0).toLocaleString()} Acres
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>Commercial Oilseed & Grain</div>
                </div>
                <div className="glass-panel" style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', fontWeight: 600 }}>Machinery Assets</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#081c15', marginTop: '4px' }}>
                    {machineryList.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>
                    {machineryList.filter(m => m.status === 'Operational' || m.status === 'Deployed').length} Deployed in Field
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="🔍 Search cooperatives by name, code, contact person, phone..."
                  value={coopSearch}
                  onChange={(e) => setCoopSearch(e.target.value)}
                  className="form-input"
                  style={{ flex: 1, minWidth: '220px' }}
                />
                <select
                  value={coopDistrictFilter}
                  onChange={(e) => setCoopDistrictFilter(e.target.value)}
                  className="form-input"
                  style={{ width: 'auto', minWidth: '180px' }}
                >
                  <option value="all">All Operational Districts (146)</option>
                  {UGANDA_DISTRICTS.map(d => (
                    <option key={d.code} value={d.name}>{d.code}. {d.name}</option>
                  ))}
                </select>
              </div>

              {/* Cooperative Edit/Create Form */}
              {editingCooperative && (
                <div className="glass-panel" style={{ padding: '24px', background: '#faf9f6', borderRadius: '16px', border: '2px solid var(--color-primary)', marginBottom: '28px', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.15rem', fontWeight: 700 }}>
                      {editingCooperative.id ? `Edit Cooperative: ${editingCooperative.name}` : '🤝 Register New Cooperative / SACCO'}
                    </h4>
                    <button type="button" onClick={() => setEditingCooperative(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
                  </div>
                  <form onSubmit={handleSaveCoopSubmit}>
                    <div className="form-row-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      {/* Field: Auto Cooperative Code */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-dark)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🆔</span> Auto Cooperative Code *
                          </label>
                          
                        </div>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={editingCooperative.code || ''}
                          onChange={(e) => setEditingCooperative({ ...editingCooperative, code: e.target.value })}
                        />
                      </div>

                      {/* Field: Cooperative Name */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-dark)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🤝</span> Cooperative / SACCO Name *
                          </label>
                          
                        </div>
                        <input
                          type="text"
                          required
                          className="form-input"
                          value={editingCooperative.name || ''}
                          onChange={(e) => setEditingCooperative({ ...editingCooperative, name: e.target.value })}
                          placeholder="e.g. Pajule Oilseed Farmers Cooperative"
                        />
                      </div>

                      {/* Field: District in Uganda (All 146 Districts) */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-dark)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>📍</span> District in Uganda (146 Districts) *
                          </label>
                          
                        </div>
                        <select
                          className="form-input"
                          value={editingCooperative.district || '101. Pader'}
                          onChange={(e) => {
                            const newDist = e.target.value;
                            setEditingCooperative({ 
                              ...editingCooperative, 
                              district: newDist,
                              code: editingCooperative.code?.startsWith('COP-') 
                                ? generateAutoCoopCode(newDist) 
                                : editingCooperative.code
                            });
                          }}
                        >
                          {UGANDA_DISTRICTS.map(d => (
                            <option key={d.code} value={d.code + '. ' + d.name}>{d.code}. {d.name} ({d.region})</option>
                          ))}
                        </select>
                      </div>

                      {/* Field: Subcounty & Parish */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-dark)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🗺️</span> Subcounty / Parish
                          </label>
                          
                        </div>
                        <input
                          type="text"
                          className="form-input"
                          value={editingCooperative.subcounty || ''}
                          onChange={(e) => setEditingCooperative({ ...editingCooperative, subcounty: e.target.value })}
                          placeholder="e.g. Pajule Subcounty"
                        />
                      </div>
                    </div>

                    <div className="form-row-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      {/* Field: Chairperson */}
                      <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-dark)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>👤</span> Chairperson / Contact Person
                          </label>
                          
                        </div>
                        <input
                          type="text"
                          className="form-input"
                          value={editingCooperative.contactPerson || ''}
                          onChange={(e) => setEditingCooperative({ ...editingCooperative, contactPerson: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editingCooperative.phone || ''}
                          onChange={(e) => setEditingCooperative({ ...editingCooperative, phone: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Total Farmer Members</label>
                        <input
                          type="number"
                          className="form-input"
                          value={editingCooperative.membersCount || 0}
                          onChange={(e) => setEditingCooperative({ ...editingCooperative, membersCount: Number(e.target.value) })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Female Members</label>
                        <input
                          type="number"
                          className="form-input"
                          value={editingCooperative.femaleMembers || 0}
                          onChange={(e) => setEditingCooperative({ ...editingCooperative, femaleMembers: Number(e.target.value) })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Youth Members</label>
                        <input
                          type="number"
                          className="form-input"
                          value={editingCooperative.youthMembers || 0}
                          onChange={(e) => setEditingCooperative({ ...editingCooperative, youthMembers: Number(e.target.value) })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Total Acreage (Acres)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={editingCooperative.totalAcreage || 0}
                          onChange={(e) => setEditingCooperative({ ...editingCooperative, totalAcreage: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    {/* Crops specializations */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                        Crops Specialization:
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {['Sunflower', 'Soya Beans', 'Maize', 'Sorghum', 'Sesame (Simsim)', 'Agroforestry Trees'].map(c => {
                          const active = (editingCooperative.cropsSpecialization || []).includes(c);
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                const current = editingCooperative.cropsSpecialization || [];
                                const next = active ? current.filter(x => x !== c) : [...current, c];
                                setEditingCooperative({ ...editingCooperative, cropsSpecialization: next });
                              }}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '16px',
                                fontSize: '0.78rem',
                                border: '1px solid',
                                borderColor: active ? '#2d6a4f' : '#ccc',
                                background: active ? '#2d6a4f' : '#fff',
                                color: active ? '#fff' : 'inherit',
                                cursor: 'pointer'
                              }}
                            >
                              {active ? '✓ ' : '+ '} {c}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button type="submit" disabled={isSavingCoop} className="btn btn-primary" style={{ padding: '10px 24px' }}>
                        {isSavingCoop ? 'Saving...' : '💾 Save Cooperative'}
                      </button>
                      <button type="button" onClick={() => setEditingCooperative(null)} className="btn btn-secondary" style={{ padding: '10px 18px' }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Cooperatives Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                {cooperativesList
                  .filter(c => {
                    const matchSearch = !coopSearch ||
                      (c.name || '').toLowerCase().includes(coopSearch.toLowerCase()) ||
                      (c.code || '').toLowerCase().includes(coopSearch.toLowerCase()) ||
                      (c.contactPerson || '').toLowerCase().includes(coopSearch.toLowerCase()) ||
                      (c.phone || '').includes(coopSearch);
                    const matchDistrict = coopDistrictFilter === 'all' || c.district === coopDistrictFilter;
                    return matchSearch && matchDistrict;
                  })
                  .map(coop => (
                    <div
                      key={coop.id}
                      className="glass-panel"
                      style={{
                        padding: '20px',
                        background: '#fff',
                        borderRadius: '14px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: 'rgba(27,67,50,0.1)', color: 'var(--color-primary-dark)' }}>
                            {coop.code}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                            📍 <strong>{coop.district}</strong> {coop.subcounty ? `(${coop.subcounty})` : ''}
                          </span>
                        </div>

                        <h4 style={{ margin: '0 0 10px 0', fontSize: '1.15rem', color: 'var(--color-primary-dark)', fontWeight: 700 }}>
                          {coop.name}
                        </h4>

                        <div style={{ fontSize: '0.8rem', color: '#555', marginBottom: '8px' }}>
                          <strong>Chairperson:</strong> {coop.contactPerson || 'N/A'}{' '}
                          {coop.phone && (
                            <a href={`tel:${coop.phone}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', marginLeft: '6px' }}>
                              📞 {coop.phone}
                            </a>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: '#f8fafc', padding: '10px', borderRadius: '8px', margin: '12px 0', textAlign: 'center' }}>
                          <div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Members</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{coop.membersCount || 0}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Women / Youth</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669' }}>
                              {coop.femaleMembers || 0} / {coop.youthMembers || 0}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Acreage</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1b4332' }}>{coop.totalAcreage || 0} Ac</div>
                          </div>
                        </div>

                        {/* Crops Specialization */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                          {(coop.cropsSpecialization || []).map(crop => (
                            <span key={crop} style={{ fontSize: '0.7rem', padding: '2px 8px', background: '#ecfdf5', color: '#065f46', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                              🌾 {crop}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #f0f0f0', paddingTop: '12px', marginTop: '12px' }}>
                        <button
                          type="button"
                          onClick={() => setEditingCooperative({ ...coop })}
                          style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                        >
                              ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCoopClick(coop.id)}
                          style={{ padding: '6px 10px', fontSize: '0.78rem', background: 'rgba(217,4,41,0.08)', color: '#d90429', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Machinery & Technology Pool */}
              <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', color: 'var(--color-primary-dark)', fontWeight: 700 }}>
                      🚜 Agricultural Machinery & Equipment Pool
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                      Allocations of tractors, grain threshers, mobile dryers, and moisture meters across cooperatives and district hubs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingMachinery({
                      assetCode: 'MCH-' + Math.floor(100 + Math.random() * 900),
                      name: '',
                      type: 'Tractor',
                      status: 'Operational',
                      allocatedTo: '',
                      district: 'Pader',
                      operator: '',
                      condition: 'Good'
                    })}
                    style={{ padding: '8px 16px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    + Add Machinery Asset
                  </button>
                </div>

                {/* Edit Machinery Form */}
                {editingMachinery && (
                  <div className="glass-panel" style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
                    <form onSubmit={handleSaveMachinerySubmit}>
                      <div className="form-row-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                        <div className="form-group">
                          <label>Asset Code</label>
                          <input
                            type="text"
                            required
                            className="form-input"
                            value={editingMachinery.assetCode || ''}
                            onChange={(e) => setEditingMachinery({ ...editingMachinery, assetCode: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Asset Name / Model</label>
                          <input
                            type="text"
                            required
                            className="form-input"
                            value={editingMachinery.name || ''}
                            onChange={(e) => setEditingMachinery({ ...editingMachinery, name: e.target.value })}
                            placeholder="e.g. Massey Ferguson 375 Tractor"
                          />
                        </div>
                        <div className="form-group">
                          <label>Equipment Type</label>
                          <select
                            className="form-input"
                            value={editingMachinery.type || 'Tractor'}
                            onChange={(e) => setEditingMachinery({ ...editingMachinery, type: e.target.value })}
                          >
                            <option value="Tractor">Tractor</option>
                            <option value="Grain Thresher">Grain Thresher</option>
                            <option value="Multi-Crop Planter">Multi-Crop Planter</option>
                            <option value="Mobile Solar Dryer">Mobile Solar Dryer</option>
                            <option value="Moisture Meter">Moisture Meter</option>
                            <option value="Transit Truck">Transit Truck</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Deployment Status</label>
                          <select
                            className="form-input"
                            value={editingMachinery.status || 'Operational'}
                            onChange={(e) => setEditingMachinery({ ...editingMachinery, status: e.target.value })}
                          >
                            <option value="Operational">Operational</option>
                            <option value="Deployed">Deployed to Cooperative</option>
                            <option value="Maintenance">Under Maintenance</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Allocated Cooperative / Depot</label>
                          <input
                            type="text"
                            className="form-input"
                            value={editingMachinery.allocatedTo || ''}
                            onChange={(e) => setEditingMachinery({ ...editingMachinery, allocatedTo: e.target.value })}
                            placeholder="Cooperative name or Pader Central Depot"
                          />
                        </div>
                        <div className="form-group">
                          <label>Base District</label>
                          <select
                            className="form-input"
                            value={editingMachinery.district || 'Pader'}
                            onChange={(e) => setEditingMachinery({ ...editingMachinery, district: e.target.value })}
                          >
                            {['Pader', 'Agago', 'Kitgum', 'Abim', 'Karenga', 'Lira', 'Kole'].map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="submit" disabled={isSavingMachinery} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.8rem' }}>
                          💾 Save Asset
                        </button>
                        <button type="button" onClick={() => setEditingMachinery(null)} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Machinery Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                  {machineryList.map(mach => (
                    <div key={mach.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '1rem' }}>🚜</span>
                          <strong>{mach.name}</strong>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          {mach.assetCode} • {mach.type} • 📍 {mach.district}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '4px' }}>
                          Assigned: <strong>{mach.allocatedTo || 'Central Depot'}</strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: mach.status === 'Operational' || mach.status === 'Deployed' ? '#ecfdf5' : '#fff7ed',
                          color: mach.status === 'Operational' || mach.status === 'Deployed' ? '#059669' : '#c2410c'
                        }}>
                          {mach.status}
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => setEditingMachinery({ ...mach })}
                            style={{ padding: '3px 8px', fontSize: '0.72rem', background: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMachineryClick(mach.id)}
                            style={{ padding: '3px 6px', fontSize: '0.72rem', background: 'rgba(217,4,41,0.08)', color: '#d90429', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB 4: Departmental Operations Hub */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'departments' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.35rem', fontFamily: 'var(--font-heading)', fontWeight: 700, margin: '0 0 6px 0' }}>
                    🏢 Departmental Operations Hub
                  </h3>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.875rem', margin: 0 }}>
                    Integrated workflow management for Finance, Environment & Tree Propagation Nurseries, and General Management.
                  </p>
                </div>
                {/* Subtab Switcher */}
                <div style={{ display: 'flex', gap: '6px', background: '#e2e8f0', padding: '4px', borderRadius: '10px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'overview', label: '🏢 Official Departments (6) & Roles' },
                    { id: 'finance', label: '💰 Finance & Disbursements' },
                    { id: 'environment', label: '🌱 Environment & Nurseries' },
                    { id: 'general', label: '📜 Strategic Governance' }
                  ].map(sub => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setDeptActiveSubtab(sub.id)}
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.825rem',
                        fontWeight: deptActiveSubtab === sub.id ? 700 : 500,
                        background: deptActiveSubtab === sub.id ? '#fff' : 'transparent',
                        color: deptActiveSubtab === sub.id ? 'var(--color-primary-dark)' : '#475569',
                        boxShadow: deptActiveSubtab === sub.id ? '0 2px 5px rgba(0,0,0,0.08)' : 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SUBTAB 0: OFFICIAL DEPARTMENTS (6) & ROLES DIRECTORY */}
              {deptActiveSubtab === 'overview' && (
                <div>
                  <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <h4 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.2rem', fontWeight: 800 }}>
                          🏛️ Official Organization Structure & Department Roles (6 Departments)
                        </h4>
                        <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-light)', fontSize: '0.85rem' }}>
                          Each department possesses assigned operational mandates, auto-numbered employee codes, and strict role-based access permissions.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                          ✓ RBAC Access Control Active
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 6 Department Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px', marginBottom: '24px' }}>
                    {JEROMA_DEPARTMENTS.map(dept => {
                      const staffInDept = staffList.filter(s => (s.department || '').toLowerCase() === dept.name.toLowerCase() || (s.department || '').toLowerCase() === dept.id.toLowerCase());
                      return (
                        <div 
                          key={dept.id} 
                          className="glass-panel" 
                          style={{ 
                            background: '#fff', 
                            borderRadius: '14px', 
                            border: '1.5px solid #e2e8f0', 
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                              <span style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: 800, 
                                padding: '3px 10px', 
                                borderRadius: '6px', 
                                background: dept.badgeColor, 
                                color: '#fff',
                                textTransform: 'uppercase'
                              }}>
                                {dept.code}
                              </span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                                👥 {staffInDept.length} Personnel
                              </span>
                            </div>

                            <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--color-primary-dark)', fontWeight: 800 }}>
                              {dept.name}
                            </h4>
                            <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, marginBottom: '8px' }}>
                              Lead Role: {dept.roleTitle}
                            </div>
                            <p style={{ fontSize: '0.825rem', color: '#475569', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                              {dept.description}
                            </p>
                          </div>

                          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '10px' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>
                              Allowed Access Controls:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {dept.permissions.map(perm => (
                                <span key={perm} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155' }}>
                                  ✓ {perm}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUBTAB 1: FINANCE */}
              {deptActiveSubtab === 'finance' && (
                <div>
                  {/* Finance KPI Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div className="glass-panel" style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', fontWeight: 600 }}>Total Inflows / Revenue</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                        UGX {financialRecords.filter(f => f.type === 'Revenue').reduce((acc, f) => acc + (Number(f.amount) || 0), 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>Grain Sales & Donor Inflows</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', fontWeight: 600 }}>Total Expenditures</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#d90429', marginTop: '4px' }}>
                        UGX {financialRecords.filter(f => f.type === 'Expense').reduce((acc, f) => acc + (Number(f.amount) || 0), 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>Operations & Inputs</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', fontWeight: 600 }}>Seed Subsidies Disbursed</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#7c3aed', marginTop: '4px' }}>
                        UGX {financialRecords.filter(f => f.category === 'Seed Subsidy' || f.type === 'Disbursement').reduce((acc, f) => acc + (Number(f.amount) || 0), 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>Farmer Group Co-shares</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', fontWeight: 600 }}>Ledger Transactions</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginTop: '4px' }}>
                        {financialRecords.length}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#52b788', marginTop: '2px' }}>Verified Financial Logs</div>
                    </div>
                  </div>

                  {/* Actions & Filters */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <select
                        value={financeTypeFilter}
                        onChange={(e) => setFinanceTypeFilter(e.target.value)}
                        className="form-input"
                        style={{ width: 'auto', minWidth: '130px' }}
                      >
                        <option value="all">All Types</option>
                        <option value="Disbursement">Disbursement</option>
                        <option value="Expense">Expense</option>
                        <option value="Revenue">Revenue</option>
                      </select>
                      <select
                        value={financeCategoryFilter}
                        onChange={(e) => setFinanceCategoryFilter(e.target.value)}
                        className="form-input"
                        style={{ width: 'auto', minWidth: '150px' }}
                      >
                        <option value="all">All Categories</option>
                        <option value="Seed Subsidy">Seed Subsidy</option>
                        <option value="Farmer Payout">Farmer Payout</option>
                        <option value="Logistics & Fuel">Logistics & Fuel</option>
                        <option value="Tree Nurseries">Tree Nurseries</option>
                        <option value="Operations">Operations</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleExportFinanceCsv}
                        className="btn btn-secondary"
                        style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                      >
                        📥 Export Ledger (CSV)
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setEditingFinanceRecord({
                          refId: 'TXN-' + Math.floor(1000 + Math.random() * 9000),
                          date: new Date().toISOString().slice(0, 10),
                          type: 'Disbursement',
                          category: 'Seed Subsidy',
                          description: '',
                          amount: 500000,
                          recipientOrSource: '',
                          projectCode: 'PRJ-A2I-2024',
                          status: 'Completed'
                        })}
                        style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'var(--color-primary)', color: '#fff' }}
                      >
                        + Log Financial Entry
                      </button>
                    </div>
                  </div>

                  {/* Create / Edit Finance Entry */}
                  {editingFinanceRecord && (
                    <div className="glass-panel" style={{ padding: '20px', background: '#faf9f6', borderRadius: '14px', border: '2px solid var(--color-primary)', marginBottom: '20px' }}>
                      <h4 style={{ margin: '0 0 14px 0', fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>
                        {editingFinanceRecord.id ? 'Edit Transaction' : '💰 Log New Financial Transaction'}
                      </h4>
                      <form onSubmit={handleSaveFinanceSubmit}>
                        <div className="form-row-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                          <div className="form-group">
                            <label>Ref / Voucher No *</label>
                            <input
                              type="text"
                              required
                              className="form-input"
                              value={editingFinanceRecord.refId || ''}
                              onChange={(e) => setEditingFinanceRecord({ ...editingFinanceRecord, refId: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Date *</label>
                            <input
                              type="date"
                              required
                              className="form-input"
                              value={editingFinanceRecord.date || ''}
                              onChange={(e) => setEditingFinanceRecord({ ...editingFinanceRecord, date: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Type</label>
                            <select
                              className="form-input"
                              value={editingFinanceRecord.type || 'Disbursement'}
                              onChange={(e) => setEditingFinanceRecord({ ...editingFinanceRecord, type: e.target.value })}
                            >
                              <option value="Disbursement">Disbursement</option>
                              <option value="Expense">Expense</option>
                              <option value="Revenue">Revenue</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Category</label>
                            <select
                              className="form-input"
                              value={editingFinanceRecord.category || 'Seed Subsidy'}
                              onChange={(e) => setEditingFinanceRecord({ ...editingFinanceRecord, category: e.target.value })}
                            >
                              <option value="Seed Subsidy">Seed Subsidy</option>
                              <option value="Farmer Payout">Farmer Payout</option>
                              <option value="Logistics & Fuel">Logistics & Fuel</option>
                              <option value="Tree Nurseries">Tree Nurseries</option>
                              <option value="Machinery Repair">Machinery Repair</option>
                              <option value="Operations">Operations</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Amount (UGX) *</label>
                            <input
                              type="number"
                              required
                              className="form-input"
                              value={editingFinanceRecord.amount || 0}
                              onChange={(e) => setEditingFinanceRecord({ ...editingFinanceRecord, amount: Number(e.target.value) })}
                            />
                          </div>
                        </div>

                        <div className="form-row-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                          <div className="form-group">
                            <label>Recipient / Source</label>
                            <input
                              type="text"
                              className="form-input"
                              value={editingFinanceRecord.recipientOrSource || ''}
                              onChange={(e) => setEditingFinanceRecord({ ...editingFinanceRecord, recipientOrSource: e.target.value })}
                              placeholder="e.g. Pajule Farmers SACCO / Total Energies"
                            />
                          </div>
                          <div className="form-group">
                            <label>Linked Project Code</label>
                            <input
                              type="text"
                              className="form-input"
                              value={editingFinanceRecord.projectCode || ''}
                              onChange={(e) => setEditingFinanceRecord({ ...editingFinanceRecord, projectCode: e.target.value })}
                              placeholder="e.g. PRJ-A2I-2024"
                            />
                          </div>
                          <div className="form-group">
                            <label>Status</label>
                            <select
                              className="form-input"
                              value={editingFinanceRecord.status || 'Completed'}
                              onChange={(e) => setEditingFinanceRecord({ ...editingFinanceRecord, status: e.target.value })}
                            >
                              <option value="Completed">Completed</option>
                              <option value="Pending Approval">Pending Approval</option>
                              <option value="Processing">Processing</option>
                            </select>
                          </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '12px' }}>
                          <label>Description & Purpose</label>
                          <input
                            type="text"
                            className="form-input"
                            value={editingFinanceRecord.description || ''}
                            onChange={(e) => setEditingFinanceRecord({ ...editingFinanceRecord, description: e.target.value })}
                            placeholder="Brief description of the voucher or transaction..."
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="submit" disabled={isSavingFinance} className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.8rem' }}>
                            💾 Save Entry
                          </button>
                          <button type="button" onClick={() => setEditingFinanceRecord(null)} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Financial Ledger Table */}
                  <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                          <th style={{ padding: '12px 14px' }}>Voucher Ref</th>
                          <th style={{ padding: '12px 14px' }}>Date</th>
                          <th style={{ padding: '12px 14px' }}>Type & Category</th>
                          <th style={{ padding: '12px 14px' }}>Description</th>
                          <th style={{ padding: '12px 14px' }}>Recipient / Source</th>
                          <th style={{ padding: '12px 14px' }}>Amount (UGX)</th>
                          <th style={{ padding: '12px 14px' }}>Project</th>
                          <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financialRecords
                          .filter(f => {
                            const matchType = financeTypeFilter === 'all' || f.type === financeTypeFilter;
                            const matchCat = financeCategoryFilter === 'all' || f.category === financeCategoryFilter;
                            return matchType && matchCat;
                          })
                          .map(f => (
                            <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 14px', fontWeight: 600 }}>{f.refId || f.id}</td>
                              <td style={{ padding: '10px 14px', color: '#64748b' }}>{f.date}</td>
                              <td style={{ padding: '10px 14px' }}>
                                <span style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  background: f.type === 'Revenue' ? '#ecfdf5' : f.type === 'Disbursement' ? '#f5f3ff' : '#fef2f2',
                                  color: f.type === 'Revenue' ? '#059669' : f.type === 'Disbursement' ? '#7c3aed' : '#dc2626'
                                }}>
                                  {f.type}
                                </span>
                                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{f.category}</div>
                              </td>
                              <td style={{ padding: '10px 14px' }}>{f.description}</td>
                              <td style={{ padding: '10px 14px', color: '#334155' }}>{f.recipientOrSource || '—'}</td>
                              <td style={{ padding: '10px 14px', fontWeight: 700, color: f.type === 'Revenue' ? '#059669' : 'inherit' }}>
                                UGX {Number(f.amount || 0).toLocaleString()}
                              </td>
                              <td style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--color-primary)' }}>{f.projectCode || 'Internal'}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFinanceClick(f.id)}
                                  style={{ padding: '3px 6px', fontSize: '0.72rem', background: 'rgba(217,4,41,0.08)', color: '#d90429', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUBTAB 2: ENVIRONMENT & TREE NURSERIES */}
              {deptActiveSubtab === 'environment' && (
                <div>
                  {/* Environment KPIs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div className="glass-panel" style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', fontWeight: 600 }}>Active District Nurseries</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2d6a4f', marginTop: '4px' }}>{nurseriesList.length}</div>
                      <div style={{ fontSize: '0.75rem', color: '#52b788', marginTop: '2px' }}>Covering all 7 Districts</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', fontWeight: 600 }}>Total Seedlings In Stock</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginTop: '4px' }}>
                        {nurseriesList.reduce((acc, n) => acc + (Number(n.currentStock) || 0), 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>
                        Capacity: {nurseriesList.reduce((acc, n) => acc + (Number(n.capacity) || 0), 0).toLocaleString()} Seedlings
                      </div>
                    </div>
                    <div className="glass-panel" style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', fontWeight: 600 }}>Seedlings Distributed</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
                        {nurseriesList.reduce((acc, n) => acc + (Number(n.distributed) || 0), 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>Planted with Smallholders</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', fontWeight: 600 }}>Reforestation Interventions</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1b4332', marginTop: '4px' }}>
                        350+ Ha
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>Indigenous & Agroforestry Canopy</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
                      🌲 Commercial & Conservation Tree Propagation Sites
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingNursery({
                        name: '',
                        district: 'Pader',
                        location: '',
                        supervisor: '',
                        phone: '+256 7',
                        species: ['Mahogany', 'Musizi', 'Grevillea', 'Fruit Trees'],
                        capacity: 25000,
                        currentStock: 12000,
                        distributed: 8000,
                        irrigation: 'Solar-Powered Drip'
                      })}
                      style={{ padding: '8px 16px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      + Add Nursery Station
                    </button>
                  </div>

                  {/* Nursery Edit Form */}
                  {editingNursery && (
                    <div className="glass-panel" style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
                      <form onSubmit={handleSaveNurserySubmit}>
                        <div className="form-row-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                          <div className="form-group">
                            <label>Nursery Station Name *</label>
                            <input
                              type="text"
                              required
                              className="form-input"
                              value={editingNursery.name || ''}
                              onChange={(e) => setEditingNursery({ ...editingNursery, name: e.target.value })}
                              placeholder="e.g. Pader Central Commercial Tree Nursery"
                            />
                          </div>
                          <div className="form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary-dark)', textTransform: 'uppercase' }}>
                                📍 Nursery District in Uganda *
                              </label>
                              
                            </div>
                            <select
                              className="form-input"
                              value={editingNursery.district || '101. Pader'}
                              onChange={(e) => setEditingNursery({ ...editingNursery, district: e.target.value })}
                            >
                              {UGANDA_DISTRICTS.map(d => (
                                <option key={d.code} value={d.code + '. ' + d.name}>{d.code}. {d.name} ({d.region})</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Location / Subcounty</label>
                            <input
                              type="text"
                              className="form-input"
                              value={editingNursery.location || ''}
                              onChange={(e) => setEditingNursery({ ...editingNursery, location: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Supervisor Name</label>
                            <input
                              type="text"
                              className="form-input"
                              value={editingNursery.supervisor || ''}
                              onChange={(e) => setEditingNursery({ ...editingNursery, supervisor: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Supervisor Phone</label>
                            <input
                              type="text"
                              className="form-input"
                              value={editingNursery.phone || ''}
                              onChange={(e) => setEditingNursery({ ...editingNursery, phone: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="form-row-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                          <div className="form-group">
                            <label>Total Capacity (Seedlings)</label>
                            <input
                              type="number"
                              className="form-input"
                              value={editingNursery.capacity || 0}
                              onChange={(e) => setEditingNursery({ ...editingNursery, capacity: Number(e.target.value) })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Current Stock</label>
                            <input
                              type="number"
                              className="form-input"
                              value={editingNursery.currentStock || 0}
                              onChange={(e) => setEditingNursery({ ...editingNursery, currentStock: Number(e.target.value) })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Seedlings Distributed to Date</label>
                            <input
                              type="number"
                              className="form-input"
                              value={editingNursery.distributed || 0}
                              onChange={(e) => setEditingNursery({ ...editingNursery, distributed: Number(e.target.value) })}
                            />
                          </div>
                          <div className="form-group">
                            <label>Irrigation System</label>
                            <input
                              type="text"
                              className="form-input"
                              value={editingNursery.irrigation || ''}
                              onChange={(e) => setEditingNursery({ ...editingNursery, irrigation: e.target.value })}
                              placeholder="e.g. Solar Drip & Borehole"
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="submit" disabled={isSavingNursery} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.8rem' }}>
                            💾 Save Nursery
                          </button>
                          <button type="button" onClick={() => setEditingNursery(null)} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Nursery Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
                    {nurseriesList.map(nursery => (
                      <div key={nursery.id} className="glass-panel" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#ecfdf5', color: '#065f46' }}>
                            📍 {nursery.district} District
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{nursery.irrigation || 'Irrigated'}</span>
                        </div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>{nursery.name}</h4>
                        <div style={{ fontSize: '0.8rem', color: '#555', marginBottom: '10px' }}>
                          Supervisor: <strong>{nursery.supervisor || 'Officer in Charge'}</strong> {nursery.phone ? `(${nursery.phone})` : ''}
                        </div>

                        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                            <span>Stock Utilization:</span>
                            <strong>{(nursery.currentStock || 0).toLocaleString()} / {(nursery.capacity || 0).toLocaleString()} ({Math.round(((nursery.currentStock || 0) / (nursery.capacity || 1)) * 100)}%)</strong>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, Math.round(((nursery.currentStock || 0) / (nursery.capacity || 1)) * 100))}%`, height: '100%', background: '#10b981' }} />
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '6px' }}>
                            Distributed to Smallholders: <strong>{(nursery.distributed || 0).toLocaleString()} seedlings</strong>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                          {(nursery.species || []).map(sp => (
                            <span key={sp} style={{ fontSize: '0.68rem', padding: '2px 6px', background: '#f1f5f9', borderRadius: '4px', color: '#334155' }}>
                              🌱 {sp}
                            </span>
                          ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                          <button
                            type="button"
                            onClick={() => setEditingNursery({ ...nursery })}
                            style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            ✏️ Update Nursery Log
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBTAB 3: GENERAL MANAGEMENT */}
              {deptActiveSubtab === 'general' && (
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: 'var(--color-primary-dark)', fontWeight: 700 }}>
                    🏛️ General Management & Strategic Direction
                  </h4>
                  <p style={{ color: '#475569', fontSize: '0.875rem', margin: '0 0 20px 0' }}>
                    Executive governance overview, strategic partnerships, and organizational compliance benchmarks for Jeroma Enterprises.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: 'var(--color-primary-dark)' }}>🤝 Strategic Institutional Partners</h5>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.825rem', color: '#334155', lineHeight: 1.6 }}>
                        <li><strong>Danish Government / Danida:</strong> Access to Innovation (A2I) smallholder funding.</li>
                        <li><strong>NARO Uganda:</strong> Certified Foundation Seed (NARO-SUN series & Maksoy).</li>
                        <li><strong>Ministry of Agriculture (MAAIF):</strong> Agroforestry & extension compliance.</li>
                        <li><strong>Acholi & Lango Local Governments:</strong> 7 District Commercial Offices.</li>
                      </ul>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: 'var(--color-primary-dark)' }}>🌱 ESG & Environmental Commitments</h5>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.825rem', color: '#334155', lineHeight: 1.6 }}>
                        <li>1 Million Commercial & Indigenous Tree Seedlings Propagation Target.</li>
                        <li>Soil regenerative agriculture & zero-deforestation grain sourcing.</li>
                        <li>Eco-friendly biofertilizer and solar-assisted grain drying infrastructure.</li>
                      </ul>
                    </div>

                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: 'var(--color-primary-dark)' }}>📋 Governance & Operational SOPs</h5>
                      <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.825rem', color: '#334155', lineHeight: 1.6 }}>
                        <li>Strict moisture content standards: Sunflower &le; 9.0%, Soya &le; 13.0%.</li>
                        <li>Instant Mobile Money & SACCO direct disbursement policy.</li>
                        <li>Gender inclusion quota: &ge; 50% female cooperative representation.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* TAB 5: Google Forms Live Synchronization & Ingestion System */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {activeTab === 'forms' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.35rem', fontFamily: 'var(--font-heading)', fontWeight: 700, margin: '0 0 6px 0' }}>
                    📋 Google Forms Live Database Sync & Official Intake Hub
                  </h3>
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.875rem', margin: 0 }}>
                    Directly connected to Jeroma Farmers Collection Center Intake Form. Receives real-time survey submissions, maps all 19 official fields, and provides 1-click database conversions.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSc-_G1-SjAhqYAFWS0P3sYto0Mn_79UoaecxYPv-hUugVKYhA/viewform?usp=sharing&ouid=100711303354591593896"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px', background: '#1d4ed8', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: 600 }}
                  >
                    🔗 Open Live Google Form
                  </a>
                  <button
                    type="button"
                    onClick={handleExportFormsCsv}
                    className="btn btn-secondary"
                    style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    📥 Export Responses (CSV)
                  </button>
                </div>
              </div>

              {/* Official Google Form Direct Link Banner */}
              <div className="glass-panel" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1.5px solid #93c5fd', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.3rem' }}>🌐</span>
                      <strong style={{ color: '#1e40af', fontSize: '1rem' }}>Connected Official Google Form:</strong>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#1e3a8a', marginTop: '4px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      https://docs.google.com/forms/d/e/1FAIpQLSc-_G1-SjAhqYAFWS0P3sYto0Mn_79UoaecxYPv-hUugVKYhA/viewform?usp=sharing&ouid=100711303354591593896
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <a
                      href="https://docs.google.com/forms/d/e/1FAIpQLSc-_G1-SjAhqYAFWS0P3sYto0Mn_79UoaecxYPv-hUugVKYhA/viewform?usp=sharing&ouid=100711303354591593896"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: '6px 14px', background: '#1d4ed8', color: '#fff', textDecoration: 'none', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      ↗ Open Google Form
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('https://docs.google.com/forms/d/e/1FAIpQLSc-_G1-SjAhqYAFWS0P3sYto0Mn_79UoaecxYPv-hUugVKYhA/viewform?usp=sharing&ouid=100711303354591593896');
                        alert('Google Form URL copied to clipboard!');
                      }}
                      style={{ padding: '6px 14px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      📋 Copy Form Link
                    </button>
                  </div>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────── */}
              {/* PRIMARY FEATURE: Google Sheet Live Synchronization Panel  */}
              {/* ────────────────────────────────────────────────────────── */}
              <div className="glass-panel" style={{ background: '#ffffff', border: '2px solid #10b981', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 8px 24px rgba(16,185,129,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.4rem' }}>📊</span>
                      <h4 style={{ margin: 0, color: '#065f46', fontSize: '1.2rem', fontWeight: 800 }}>
                        Google Sheet Live Synchronization & Responses Connector
                      </h4>
                    </div>
                    <p style={{ margin: '6px 0 0 0', color: '#475569', fontSize: '0.85rem' }}>
                      Connect the Google Sheet attached to your Google Form to immediately see all farmer intake responses on the system.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <label style={{ margin: 0, padding: '8px 16px', background: '#ecfdf5', color: '#065f46', border: '1.5px solid #10b981', borderRadius: '8px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span>📁</span> Upload Responses CSV
                      <input 
                        type="file" 
                        accept=".csv,.tsv,.txt" 
                        onChange={handleFileUploadCsv} 
                        style={{ display: 'none' }} 
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPasteSheetModal(true)}
                      style={{ padding: '8px 16px', background: '#f0fdf4', color: '#166534', border: '1.5px solid #86efac', borderRadius: '8px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      📋 Quick Paste Sheet Rows
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadSampleLiveResponses}
                      style={{ padding: '8px 16px', background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }}
                      title="Load 3 sample live responses to test table display and account conversion"
                    >
                      🌱 Load Sample Responses
                    </button>
                  </div>
                </div>

                {/* Feedback Messages */}
                {sheetSyncSuccess && (
                  <div style={{ background: '#ecfdf5', color: '#065f46', padding: '12px 16px', borderRadius: '8px', border: '1px solid #a7f3d0', fontSize: '0.85rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✓</span> {sheetSyncSuccess}
                  </div>
                )}
                {sheetSyncError && (
                  <div style={{ background: '#fef2f2', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '0.85rem', fontWeight: 600, marginBottom: '16px' }}>
                    ⚠️ {sheetSyncError}
                  </div>
                )}

                {/* Google Sheet URL Input Row */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary-dark)', textTransform: 'uppercase' }}>
                        🔗 Google Sheet URL or Spreadsheet ID
                      </label>
                      <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                        (e.g. https://docs.google.com/spreadsheets/d/.../edit)
                      </span>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Paste your Google Sheet link here..."
                      value={googleSheetUrl}
                      onChange={(e) => setGoogleSheetUrl(e.target.value)}
                      style={{ width: '100%', borderColor: '#10b981' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncGoogleSheet}
                    disabled={isSyncingSheet}
                    className="btn btn-primary"
                    style={{ background: '#10b981', borderColor: '#059669', color: '#fff', padding: '10px 22px', fontSize: '0.9rem', fontWeight: 700, marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {isSyncingSheet ? '⏳ Fetching Sheet...' : '⚡ Sync Google Sheet Now'}
                  </button>
                </div>

                {/* Smart Notice if User Pasted Google Form Link */}
                {googleSheetUrl.includes('/forms/') && (
                  <div style={{ background: '#fefce8', border: '1.5px solid #fde047', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', fontSize: '0.85rem', color: '#713f12' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, marginBottom: '6px' }}>
                      <span>💡</span> You pasted a Google Forms link (<strong>{googleSheetUrl.slice(0, 70)}...</strong>)
                    </div>
                    <p style={{ margin: '0 0 8px 0', lineHeight: 1.5 }}>
                      Google Forms collects submissions into a linked <strong>Google Spreadsheet</strong>. To display responses here in 10 seconds:
                    </p>
                    <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.6 }}>
                      <li>In your Google Form Responses tab, click the green <strong>"Link to Sheets"</strong> / <strong>"View in Sheets"</strong> icon (top right).</li>
                      <li>In the Google Sheet that opens, click <strong>Share</strong> (top right) &rarr; set to <strong>"Anyone with the link can view"</strong> &rarr; copy that spreadsheet URL and paste it here!</li>
                      <li><em>Or:</em> Click the <strong>⋮</strong> menu next to the green icon &rarr; <strong>"Download responses (.csv)"</strong> &rarr; click <strong>"📁 Upload Responses CSV"</strong> right above to load everything instantly!</li>
                    </ol>
                  </div>
                )}

                {/* How to Connect Help Box */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', fontSize: '0.82rem', color: '#475569' }}>
                  <strong style={{ color: '#1e293b' }}>💡 How to view your Google Sheet responses on this system:</strong>
                  <ol style={{ margin: '6px 0 0 0', paddingLeft: '20px', lineHeight: 1.6 }}>
                    <li>Open your Google Form and click the green <strong>"View in Sheets"</strong> button in the <strong>Responses</strong> tab.</li>
                    <li>In the Google Sheet that opens, click <strong>Share</strong> (top right) &rarr; change General Access to <strong>"Anyone with the link can view"</strong> &rarr; Copy Link.</li>
                    <li>Paste that link in the box above and click <strong>"Sync Google Sheet Now"</strong> &mdash; all responses will instantly display below!</li>
                    <li><em>Alternatively:</em> Press <strong>Ctrl+A</strong> then <strong>Ctrl+C</strong> inside your Google Sheet, and click <strong>"Quick Paste Sheet Rows"</strong> to import in 2 seconds!</li>
                  </ol>
                </div>
              </div>

              {/* Webhook & Setup Instructions Card */}
              <div className="glass-panel" style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🔗</span>
                    <strong style={{ color: '#166534', fontSize: '0.95rem' }}>Your Live Webhook Sync Endpoint:</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/api/forms/submit`;
                      navigator.clipboard.writeText(url);
                      setCopiedWebhook(true);
                      setTimeout(() => setCopiedWebhook(false), 3000);
                    }}
                    style={{ padding: '6px 14px', background: '#166534', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {copiedWebhook ? '✓ URL Copied!' : '📋 Copy Webhook URL'}
                  </button>
                </div>

                <div style={{ background: '#fff', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#14532d', wordBreak: 'break-all', marginBottom: '16px' }}>
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/forms/submit` : 'https://jeromafarmers.com/api/forms/submit'}
                </div>

                <details style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#166534' }}>
                  <summary style={{ fontWeight: 700, marginBottom: '8px' }}>
                    ▶ Click to View Ready Google Apps Script Code (Drop into Google Forms)
                  </summary>
                  <div style={{ background: '#1e293b', color: '#f8fafc', padding: '16px', borderRadius: '8px', marginTop: '10px', position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const scriptText = `// Google Apps Script for Jeroma Forms Live Sync
function onFormSubmit(e) {
  var url = "${window.location.origin}/api/forms/submit";
  var formResponse = e.response;
  var itemResponses = formResponse.getItemResponses();
  var payload = {
    formType: "farmer_registration", // or "cooperative_profile", "seedling_request"
    data: {
      submittedAt: formResponse.getTimestamp()
    }
  };
  
  for (var i = 0; i < itemResponses.length; i++) {
    var item = itemResponses[i];
    payload.data[item.getItem().getTitle()] = item.getResponse();
  }
  
  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  UrlFetchApp.fetch(url, options);
}`;
                        navigator.clipboard.writeText(scriptText);
                        alert('Google Apps Script copied to clipboard! Paste it inside Extensions > Apps Script in your Google Form.');
                      }}
                      style={{ position: 'absolute', top: '10px', right: '10px', padding: '4px 10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      Copy Script
                    </button>
                    <pre style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.4, overflowX: 'auto' }}>
{`// 1. Open your Google Form
// 2. Click "⋮" (More) > Extensions > Apps Script
// 3. Paste this code and click Save 💾
// 4. Click Triggers (alarm clock icon) > Add Trigger:
//    - Function: onFormSubmit
//    - Event Source: From form
//    - Event Type: On form submit

function onFormSubmit(e) {
  var url = "${window.location.origin}/api/forms/submit";
  var itemResponses = e.response.getItemResponses();
  var payload = {
    formType: "farmer_registration", // or "cooperative_profile", "tree_nurseries"
    data: { submittedAt: e.response.getTimestamp() }
  };
  for (var i = 0; i < itemResponses.length; i++) {
    payload.data[itemResponses[i].getItem().getTitle()] = itemResponses[i].getResponse();
  }
  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}`}
                    </pre>
                  </div>
                </details>
              </div>

              {/* Submissions KPI & Search */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
                <div className="glass-panel" style={{ padding: '14px', background: '#fff', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Total Submissions</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginTop: '2px' }}>{formSubmissionsList.length}</div>
                </div>
                <div className="glass-panel" style={{ padding: '14px', background: '#fff', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Farmer Registrations</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: '2px' }}>
                    {formSubmissionsList.filter(s => s.formType?.includes('farmer') || s.data?.['Farmer Name'] || s.data?.fullName).length}
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '14px', background: '#fff', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Cooperative Profiles</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7c3aed', marginTop: '2px' }}>
                    {formSubmissionsList.filter(s => s.formType?.includes('coop') || s.data?.cooperativeName || s.data?.['Cooperative Name']).length}
                  </div>
                </div>
              </div>

              {/* Submissions Filter */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="🔍 Search received responses..."
                  value={formSearch}
                  onChange={(e) => setFormSearch(e.target.value)}
                  className="form-input"
                  style={{ flex: 1, minWidth: '220px' }}
                />
                <select
                  value={formTypeFilter}
                  onChange={(e) => setFormTypeFilter(e.target.value)}
                  className="form-input"
                  style={{ width: 'auto', minWidth: '150px' }}
                >
                  <option value="all">All Form Types</option>
                  <option value="farmer_registration">Farmer Registration</option>
                  <option value="cooperative_profile">Cooperative Profile</option>
                  <option value="seedling_request">Seedling Request</option>
                  <option value="general">General</option>
                </select>
              </div>

              {/* Submissions List */}
              {formSubmissionsList.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📬</div>
                  <h4 style={{ margin: '0 0 6px 0', color: 'var(--color-primary-dark)' }}>No Submissions Received Yet</h4>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                    Once you hook up your Google Form using the Webhook URL above, responses will stream in automatically in real time.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {formSubmissionsList
                    .filter(s => {
                      const matchType = formTypeFilter === 'all' || s.formType === formTypeFilter;
                      const strData = JSON.stringify(s.data || {}).toLowerCase();
                      const matchSearch = !formSearch || strData.includes(formSearch.toLowerCase());
                      return matchType && matchSearch;
                    })
                    .map(sub => (
                      <div
                        key={sub.id}
                        className="glass-panel"
                        style={{
                          background: '#fff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          padding: '16px 20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: '14px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: '260px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(27,67,50,0.1)', color: 'var(--color-primary-dark)' }}>
                              {sub.formType || 'Form Submission'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              🕒 {sub.createdAt ? new Date(sub.createdAt).toLocaleString() : 'Just now'}
                            </span>
                          </div>

                          {/* Data pills */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                            {Object.entries(sub.data || {}).slice(0, 6).map(([k, v]) => (
                              <div key={k} style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>{k}: </span>
                                <strong>{String(v)}</strong>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Quick 1-Click Conversion Actions */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedSubmissionDetails(sub)}
                            style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                            title="View all 19 answered questions in detail"
                          >
                            👁️ View Details
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConvertSubmissionToFarmer(sub)}
                            style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                            title="Register farmer account with generated credentials"
                          >
                            👨‍🌾 Convert to Farmer
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConvertSubmissionToCoop(sub)}
                            style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                            title="Register as Cooperative into Cooperatives Directory"
                          >
                            🤝 Convert to Coop
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubmission(sub.id)}
                            style={{ padding: '6px 10px', fontSize: '0.78rem', background: 'rgba(217,4,41,0.08)', color: '#d90429', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                            title="Delete Submission"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          {/* 📱 SOCIAL MEDIA & DIGITAL CHANNELS HUB TAB                                */}
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'socials' && (
            <div className="tab-pane active" style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '24px',
                borderBottom: '1px solid rgba(0,0,0,0.08)',
                paddingBottom: '16px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: 'var(--color-primary-dark, #0f3020)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    margin: 0
                  }}>
                    📱 {lang === 'en' ? 'Social Media & Digital Channels Hub' : 'Dwol me Social Media & Digital'}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
                    {lang === 'en'
                      ? 'Manage official handles, website links, WhatsApp templates, and direct channel connectivity across the public platform.'
                      : 'Yub kede loyo links me Facebook, WhatsApp, TikTok, YouTube kede channels ducu me Jeroma.'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleResetSocialsToDefault}
                    className="btn btn-outline"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    🔄 {lang === 'en' ? 'Reset Defaults' : 'Dwok cen'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSocialsSubmit}
                    disabled={isSavingSocials}
                    className="btn btn-primary"
                    style={{
                      background: 'var(--color-secondary, #e9c46a)',
                      color: 'var(--color-primary-dark, #0f3020)',
                      fontWeight: 800,
                      padding: '8px 20px',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    {isSavingSocials ? 'Saving...' : (lang === 'en' ? '💾 Save All Channels' : '💾 Gwik jami ducu')}
                  </button>
                </div>
              </div>

              {socialsSuccess && (
                <div style={{
                  padding: '12px 16px',
                  background: '#ecfdf5',
                  border: '1px solid #10b981',
                  borderRadius: '8px',
                  color: '#065f46',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  marginBottom: '20px'
                }}>
                  ✅ {socialsSuccess}
                </div>
              )}

              {socialsError && (
                <div style={{
                  padding: '12px 16px',
                  background: '#fef2f2',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  color: '#991b1b',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  marginBottom: '20px'
                }}>
                  ⚠️ {socialsError}
                </div>
              )}

              {/* Channels Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
              }}>
                {[
                  {
                    key: 'whatsapp',
                    label: 'WhatsApp Business',
                    icon: <Icons.WhatsAppOriginal size={26} />,
                    color: '#25D366',
                    handlePlaceholder: '+256 773 623 196',
                    urlPlaceholder: 'https://wa.me/256773623196',
                    hasExtra: true
                  },
                  {
                    key: 'facebook',
                    label: 'Facebook Page',
                    icon: <Icons.FacebookOriginal size={26} />,
                    color: '#1877F2',
                    handlePlaceholder: '@jeromafarmers',
                    urlPlaceholder: 'https://www.facebook.com/jeromafarmers'
                  },
                  {
                    key: 'tiktok',
                    label: 'TikTok Channel',
                    icon: <Icons.TikTokOriginal size={26} />,
                    color: '#000000',
                    handlePlaceholder: '@jeromafarmers',
                    urlPlaceholder: 'https://www.tiktok.com/@jeromafarmers'
                  },
                  {
                    key: 'x',
                    label: 'X (Twitter)',
                    icon: <Icons.XTwitterOriginal size={26} />,
                    color: '#0f1419',
                    handlePlaceholder: '@JeromaFarmers',
                    urlPlaceholder: 'https://x.com/JeromaFarmers'
                  },
                  {
                    key: 'youtube',
                    label: 'YouTube Channel',
                    icon: <Icons.YouTubeOriginal size={26} />,
                    color: '#FF0000',
                    handlePlaceholder: '@jeromafarmers',
                    urlPlaceholder: 'https://www.youtube.com/@jeromafarmers'
                  },
                  {
                    key: 'linkedin',
                    label: 'LinkedIn Page',
                    icon: <Icons.LinkedInOriginal size={26} />,
                    color: '#0A66C2',
                    handlePlaceholder: 'jeromafarmers',
                    urlPlaceholder: 'https://www.linkedin.com/company/jeromafarmers'
                  },
                  {
                    key: 'instagram',
                    label: 'Instagram',
                    icon: <Icons.InstagramOriginal size={26} />,
                    color: '#E4405F',
                    handlePlaceholder: '@jeromafarmers',
                    urlPlaceholder: 'https://www.instagram.com/jeromafarmers'
                  },
                  {
                    key: 'telegram',
                    label: 'Telegram Community',
                    icon: <Icons.TelegramOriginal size={26} />,
                    color: '#24A1DE',
                    handlePlaceholder: '@jeromafarmers',
                    urlPlaceholder: 'https://t.me/jeromafarmers'
                  }
                ].map((item) => {
                  const data = socialsState[item.key] || {};
                  return (
                    <div
                      key={item.key}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px'
                      }}
                    >
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {item.icon}
                          <div>
                            <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b', fontWeight: 700 }}>
                              {item.label}
                            </h4>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {data.handle || 'Not configured'}
                            </span>
                          </div>
                        </div>

                        {/* Toggle switch */}
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: data.enabled ? '#059669' : '#94a3b8' }}>
                          <input
                            type="checkbox"
                            checked={!!data.enabled}
                            onChange={(e) => handleSocialFieldChange(item.key, 'enabled', e.target.checked)}
                            style={{ cursor: 'pointer' }}
                          />
                          {data.enabled ? 'Active' : 'Hidden'}
                        </label>
                      </div>

                      {/* Inputs */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px', textTransform: 'uppercase' }}>
                            Handle / Display Username
                          </label>
                          <input
                            type="text"
                            value={data.handle || ''}
                            onChange={(e) => handleSocialFieldChange(item.key, 'handle', e.target.value)}
                            placeholder={item.handlePlaceholder}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.85rem',
                              color: '#0f172a',
                              background: '#f8fafc'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px', textTransform: 'uppercase' }}>
                            Target Web / Deep Link URL
                          </label>
                          <input
                            type="url"
                            value={data.url || ''}
                            onChange={(e) => handleSocialFieldChange(item.key, 'url', e.target.value)}
                            placeholder={item.urlPlaceholder}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.85rem',
                              color: '#0f172a',
                              background: '#f8fafc'
                            }}
                          />
                        </div>

                        {item.hasExtra && (
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px', textTransform: 'uppercase' }}>
                              Default Greeting / Inquiry Message
                            </label>
                            <textarea
                              rows={2}
                              value={data.greeting || ''}
                              onChange={(e) => handleSocialFieldChange(item.key, 'greeting', e.target.value)}
                              placeholder="Hello Jeroma Farmers, I would like to inquire about..."
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.82rem',
                                color: '#0f172a',
                                background: '#f8fafc',
                                resize: 'vertical'
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Action footer */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          Status: <strong style={{ color: data.enabled ? '#059669' : '#dc2626' }}>{data.enabled ? '● Live on Website' : '○ Disabled'}</strong>
                        </span>

                        <a
                          href={data.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (!data.url) {
                              e.preventDefault();
                              alert('Please enter a target URL first.');
                            }
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            background: '#f1f5f9',
                            color: '#0f172a',
                            textDecoration: 'none',
                            border: '1px solid #cbd5e1'
                          }}
                        >
                          ⚡ Test Link ↗
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Integration Summary Card */}
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(27,67,50,0.03), rgba(255,255,255,0.95))'
              }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', color: 'var(--color-primary-dark, #0f3020)', fontWeight: 800 }}>
                  🌐 Public Website Integration Information
                </h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                  All accounts enabled here immediately update the public <strong>Digital Channels</strong> section, the <strong>Footer Social Links</strong>, and the <strong>Floating WhatsApp Support Widget</strong> across both English and Luo interfaces.
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={onBackToSite}
                    className="btn btn-outline"
                    style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                  >
                    👁️ Preview On Website
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSocialsSubmit}
                    disabled={isSavingSocials}
                    className="btn btn-primary"
                    style={{ fontSize: '0.85rem', padding: '8px 18px', background: 'var(--color-primary, #1b4332)', color: '#fff' }}
                  >
                    💾 Confirm & Save All Changes
                  </button>
                </div>
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

      {/* Quick Paste Google Sheet Data Modal */}
      {showPasteSheetModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="modal-card" style={{ background: '#fff', borderRadius: '16px', maxWidth: '640px', width: '100%', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                📋 Paste Google Sheet Responses Directly
              </h3>
              <button type="button" onClick={() => setShowPasteSheetModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ margin: '0 0 14px 0', fontSize: '0.85rem', color: '#64748b' }}>
              Open your Google Sheet, select the rows you want to import (including headers), copy them (<strong>Ctrl+C</strong>), and paste them into the box below (<strong>Ctrl+V</strong>):
            </p>
            <form onSubmit={handlePasteSheetSubmit}>
              <textarea
                className="form-input"
                rows={8}
                placeholder="Paste rows from your Google Sheet here... (Tab-separated or Comma-separated)"
                value={pastedSheetData}
                onChange={(e) => setPastedSheetData(e.target.value)}
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.78rem', marginBottom: '16px' }}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowPasteSheetModal(false)} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isPastingSheet} className="btn btn-primary" style={{ background: '#10b981', color: '#fff', padding: '8px 20px', fontWeight: 700 }}>
                  {isPastingSheet ? 'Importing...' : '📥 Import Rows Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Full Submission Details Modal (All 19 Questions) */}
      {selectedSubmissionDetails && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="modal-card" style={{ background: '#fff', borderRadius: '16px', maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.25rem', fontWeight: 800 }}>
                  📋 Full Google Form Response Details
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  Submitted: {selectedSubmissionDetails.submittedAt || selectedSubmissionDetails.createdAt || 'Recent'}
                </div>
              </div>
              <button type="button" onClick={() => setSelectedSubmissionDetails(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {Object.entries(selectedSubmissionDetails.data || {}).map(([key, value]) => (
                <div key={key} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '3px' }}>
                    {key}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600 }}>
                    {String(value || '—')}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
              <button
                type="button"
                onClick={() => {
                  handleConvertSubmissionToFarmer(selectedSubmissionDetails);
                  setSelectedSubmissionDetails(null);
                }}
                className="btn btn-primary"
                style={{ background: '#059669', color: '#fff', padding: '8px 18px', fontWeight: 700 }}
              >
                👨‍🌾 Convert to Farmer Account
              </button>
              <button
                type="button"
                onClick={() => {
                  handleConvertSubmissionToCoop(selectedSubmissionDetails);
                  setSelectedSubmissionDetails(null);
                }}
                className="btn btn-primary"
                style={{ background: '#7c3aed', color: '#fff', padding: '8px 18px', fontWeight: 700 }}
              >
                🤝 Convert to Cooperative
              </button>
              <button type="button" onClick={() => setSelectedSubmissionDetails(null)} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Reply Modal */}
      {showReplyModal && replyTarget && (
        <div className="modal-backdrop" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div className="modal-card" style={{
            background: '#faf9f6', padding: '24px', borderRadius: '16px',
            width: '100%', maxWidth: '480px', boxShadow: 'var(--shadow-xl)',
            border: '2px solid rgba(82, 183, 136, 0.4)', position: 'relative'
          }}>
            <button 
              onClick={() => setShowReplyModal(false)}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'none', border: 'none', fontSize: '1.25rem',
                cursor: 'pointer', color: '#888'
              }}
            >
              ✕
            </button>
            <h3 style={{
              color: 'var(--color-primary-dark)', fontSize: '1.2rem',
              fontFamily: 'var(--font-heading)', fontWeight: 700,
              margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              💬 {lang === 'en' ? 'Send Reply' : 'Lok me anyim'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dark)', marginBottom: '12px' }}>
              <strong>To:</strong> {replyTarget.recipientName} ({replyTarget.type === 'inquiry' ? 'Inquiry ID' : 'Request ID'}: {replyTarget.id})
            </p>
            <form onSubmit={handleSendReply}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', color: '#555' }}>
                  {lang === 'en' ? 'Your Reply' : 'Lok me anyim ma meri'}
                </label>
                <textarea
                  className="form-input"
                  style={{ width: '100%', minHeight: '120px', padding: '10px', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical' }}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={lang === 'en' ? 'Write your reply message here...' : 'Ko lok me anyim ma meri kany...'}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowReplyModal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '10px' }}
                >
                  {lang === 'en' ? 'Cancel' : 'Gik'}
                </button>
                <button 
                  type="submit" 
                  disabled={isReplying}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px', backgroundColor: 'var(--color-primary)' }}
                >
                  {isReplying ? 'Sending...' : (lang === 'en' ? 'Submit Reply' : 'Mii Lok')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
