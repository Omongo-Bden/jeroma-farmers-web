import React, { useState, useEffect } from 'react';
import * as Icons from './Icons';
import { getDeliveries, getDispatches, saveDispatch, getCrops, updateUser, uploadImage } from '../utils/db';

export default function ClientDashboard({ lang, user, onLogout, onBackToSite }) {
  const [activeTab, setActiveTab] = useState('deliveries'); // 'deliveries' | 'dispatch' | 'inputs'
  const [currentUserState, setCurrentUserState] = useState(user);
  
  useEffect(() => {
    setCurrentUserState(user);
  }, [user]);

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
  
  // Data States
  const [deliveries, setDeliveries] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [crops, setCrops] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
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
  
  // Dispatch Request Form States
  const [dispCrop, setDispCrop] = useState('sunflower');
  const [dispWeight, setDispWeight] = useState('');
  const [dispDate, setDispDate] = useState('');
  const [dispLocation, setDispLocation] = useState(user.district + ' District');
  const [dispNotes, setDispNotes] = useState('');
  const [dispSuccess, setDispSuccess] = useState('');
  const [dispError, setDispError] = useState('');

  // Translations
  const translations = {
    en: {
      clientTitle: "Farmer Dashboard",
      welcome: "Welcome back,",
      roleClient: "Registered Jeroma Smallholder Farmer",
      backSite: "Back to Home",
      logout: "Log Out",
      deliveriesTab: "My Weighing Receipts",
      dispatchTab: "Request Field Transit",
      inputsTab: "Agro-Inputs Ledger",
      currentPrices: "Today's Collection Rates",
      cropName: "Crop Name",
      rateKg: "Rate per Kg",
      moistureTarget: "Moisture Target",
      dispatchHeader: "Request Bulk Transit Assistance",
      dispatchDesc: "Need help transporting your harvest? Request a truck dispatch. Jeroma collection vehicles assist registered farmers with yields above 1,000 Kg (1 Ton).",
      selectCrop: "Select Crop Type",
      estWeight: "Estimated Weight (Kg)",
      pickupDate: "Preferred Collection Date",
      pickupLocation: "Detailed Farm Location / Access Road Directions",
      transitNotes: "Additional Notes (e.g. sack bags needed)",
      submitRequest: "Submit Transit Request",
      id: "Receipt ID",
      date: "Date",
      crop: "Crop Type",
      weight: "Net Weight",
      grade: "Grade",
      payout: "Total Payout",
      status: "Payment Status",
      inputsHeader: "Subsidized Agro-Input Supplies & Credit Account",
      inputsDesc: "Check outstanding credit balances for seeds and fertilizers purchased under the buy-now, pay-at-harvest scheme. Debits are automatically reconciled upon crop drop-off.",
      itemName: "Item Name",
      quantity: "Quantity",
      unitPrice: "Unit Cost",
      totalCost: "Total Cost",
      debtStatus: "Status",
      noDeliveries: "No delivery weighing receipts recorded yet. Deliver your harvest to any Jeroma center to log your first receipt!",
      noDispatches: "No pickup requests scheduled. Submit the form to request a truck dispatch."
    },
    luo: {
      clientTitle: "Dwol me Apur",
      welcome: "Keny dok cen,",
      roleClient: "Apur me Jeroma a coye",
      backSite: "Dok cen i website",
      logout: "Log Out",
      deliveriesTab: "Weighing Receipts na",
      dispatchTab: "Oro transit",
      inputsTab: "Akaut me Pur",
      currentPrices: "Wel me tin",
      cropName: "Nying me cam",
      rateKg: "Wel Kg",
      moistureTarget: "Moisture Target",
      dispatchHeader: "Request lela transit",
      dispatchDesc: "Mito kony me turo keyo? Oro transit. Jeroma truck konyo apur ma tye kede cam ma dit loyo 1,000 Kg (1 Ton).",
      selectCrop: "Yier kit me cam",
      estWeight: "Dit me jami (Kg)",
      pickupDate: "Dwe me keyo",
      pickupLocation: "Lobo pur kede namba me simu",
      transitNotes: "Lok okelle (e.g. mako pe)",
      submitRequest: "Issue request manyen",
      id: "Recit ID",
      date: "Dwe",
      crop: "Kit me cam",
      weight: "Dit me jami",
      grade: "Grade",
      payout: "Wel to pay",
      status: "Payment Status",
      inputsHeader: "Akaut me Pur kede Agro-Inputs",
      inputsDesc: "Check credit balance kede fertilizer kede kodi SeedCo ma inongo i credit scheme. Wel bi cogo ka idwoko keyo.",
      itemName: "Nying me jami",
      quantity: "Dit",
      unitPrice: "Wel acel",
      totalCost: "Wel ducu",
      debtStatus: "Status",
      noDeliveries: "Pe recit mo a coye cen piny. Dwok keyo Lira center me caye.",
      noDispatches: "Pe oro transit a scheduled. Wendiice piny."
    },
    lug: {
      clientTitle: "Dashboard y'Omulimi",
      welcome: "Nsanyuse okukubona,",
      roleClient: "Omulimi wa Jeroma Omuwandiise",
      backSite: "Ddayo ku Website",
      logout: "Yingira Wano",
      deliveriesTab: "Ebiwandiiko Byange",
      dispatchTab: "Saba Entambula y'Akungula",
      inputsTab: "Ebijimiro n'Ensigo za Credit",
      currentPrices: "Emiwendo gy'Ebirime leero",
      cropName: "Ekirime",
      rateKg: "Bbeeyi ku Kilo",
      moistureTarget: "Amazzi mu Kirime",
      dispatchHeader: "Saba Motoka Ekutwalire Ebirime",
      dispatchDesc: "Wetaaga obuyambi okutwala ebirime byo? Saba emmotoka. Jeroma eyamba abalimi n'ebirime ebisukka Kilo 1,000 (Ton 1).",
      selectCrop: "Londa Ekirime",
      estWeight: "Obuzito obutebererezebwa (Kg)",
      pickupDate: "Olunaku lw'okukungula",
      pickupLocation: "Esubi lya Farm yo n'Oluguudo",
      transitNotes: "Ebinyonyola ebirala",
      submitRequest: "Saba Motoka",
      id: "ID y'Ekiwandiiko",
      date: "Olunaku",
      crop: "Ekirime",
      weight: "Obuzito obwetongola",
      grade: "Omutindo",
      payout: "Okusasulwa kwonna",
      status: "Mbeera y'okusasulwa",
      inputsHeader: "Ensigo n'Ebijimiro eby'Obusuubuzi ku Credit",
      inputsDesc: "Kebera bbeeyi z'ensigo n'ebijimiro by'otutte ku credit mu buyambi bw'omulimi. Eza credit zisalibwa ku bbeeyi y'ebirime by'oleese.",
      itemName: "Ekirime",
      quantity: "Obungi",
      unitPrice: "Bbeeyi ya buli kimu",
      totalCost: "Bbeeyi yonna",
      debtStatus: "Mbeera",
      noDeliveries: "Ekiwandiiko kyonna tekinnawandiikibwa. Leeta akungula ku Jeroma center wano okukola ekiwandiiko ky'asooka!",
      noDispatches: "Tewali kusaba kwa motoka kutegekeddwa. Jjula foomu okusaba."
    }
  };

  const t = translations[lang] || translations.en;

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [allDels, allDisps, cropsData] = await Promise.all([
        getDeliveries(),
        getDispatches(),
        getCrops()
      ]);
      setDeliveries((allDels || []).filter(d => d.username === user.username));
      setDispatches((allDisps || []).filter(d => d.username === user.username));
      setCrops(cropsData || {});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.username]);

  const handleRequestDispatch = async (e) => {
    e.preventDefault();
    setDispSuccess('');
    setDispError('');

    if (!dispWeight || !dispDate || !dispLocation.trim()) {
      setDispError(lang === 'en' ? 'Please fill out all fields.' : 'Tim be ico lok ducu piny.');
      return;
    }

    const cropObj = crops[dispCrop];
    const newDisp = await saveDispatch({
      username: user.username,
      farmerName: user.name,
      cropId: dispCrop,
      cropName: cropObj?.name || (dispCrop.charAt(0).toUpperCase() + dispCrop.slice(1)),
      weight: parseFloat(dispWeight),
      date: dispDate,
      location: dispLocation,
      notes: dispNotes
    });

    setDispSuccess(lang === 'en' ? `Transit request ${newDisp.id} submitted successfully.` : `Request ${newDisp.id} ocopo maber woko.`);
    setDispWeight('');
    setDispDate('');
    setDispNotes('');
    await loadData();
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

  // Mock static list of client input debts
  const mockInputs = [
    { name: 'SeedCo LG 50745 Sunflower Seeds (2 Kg pack)', qty: 3, unit: 22000, status: 'Deducted from Harvest' },
    { name: 'Biofertilizer Africa Ltd – 25 Kg organic NPK', qty: 2, unit: 75000, status: 'Outstanding Credit' }
  ];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#faf9f6' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem' }}>Loading your dashboard...</p>
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
                  <Icons.Users size={32} style={{ color: 'var(--color-secondary)' }} />
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
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {t.roleClient}
              </p>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#fff' }}>
                {t.welcome} {currentUserState.name}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                📍 {user.district} District · 🚜 {user.farmSize}
              </p>
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

        {/* Info Grid: Dynamic prices cards */}
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px', backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.BarChart size={18} />
            {t.currentPrices}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {Object.values(crops).map(c => (
              <div key={c.id} style={{ padding: '16px', background: '#faf9f6', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', fontWeight: 600 }}>{c.name}</span>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary-light)', margin: '4px 0' }}>{c.payoutRate}</p>
                <span style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.5)' }}>Moisture: {c.moisture}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dash Tabs */}
        <div className="dashboard-tabs-container">
          {[
            { id: 'deliveries', label: t.deliveriesTab, icon: <Icons.Warehouse size={18} /> },
            { id: 'dispatch', label: t.dispatchTab, icon: <Icons.Truck size={18} /> },
            { id: 'inputs', label: t.inputsTab, icon: <Icons.Seed size={18} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="dashboard-panel-card">
          
          {activeTab === 'deliveries' && (
            /* My Deliveries Tab */
            <div>
              <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '20px' }}>
                {t.deliveriesTab} ({deliveries.length})
              </h3>
              
              {deliveries.length === 0 ? (
                <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', textAlign: 'center', padding: '40px 0' }}>
                  {t.noDeliveries}
                </p>
              ) : (
                <div className="table-container-responsive">
                  <table>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                        <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)' }}>{t.id}</th>
                        <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)' }}>{t.date}</th>
                        <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)' }}>{t.crop}</th>
                        <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)', textAlign: 'right' }}>{t.weight}</th>
                        <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)', textAlign: 'center' }}>{t.grade}</th>
                        <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)', textAlign: 'right' }}>{t.payout}</th>
                        <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)', textAlign: 'center' }}>{t.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.map(del => (
                        <tr key={del.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                          <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 'bold' }}>{del.id}</td>
                          <td style={{ padding: '14px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{del.date}</td>
                          <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{del.cropName}</td>
                          <td style={{ padding: '14px 16px', fontSize: '0.85rem', textAlign: 'right', fontWeight: 700 }}>{del.weight.toLocaleString()} kg</td>
                          <td style={{ padding: '14px 16px', fontSize: '0.85rem', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                              backgroundColor: del.grade === 'A' ? 'rgba(82, 183, 136, 0.15)' : 'rgba(233, 196, 106, 0.15)',
                              color: del.grade === 'A' ? '#1b4332' : '#b07d03'
                            }}>
                              {del.grade}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '0.85rem', textAlign: 'right', fontWeight: 800, color: 'var(--color-primary-light)' }}>
                            UGX {del.payout.toLocaleString()}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: '0.85rem', textAlign: 'center' }}>
                            <span style={{
                              fontWeight: 700,
                              color: del.status === 'Completed' ? 'var(--color-accent)' : '#b07d03'
                            }}>
                              {del.status === 'Completed' ? 'Paid' : 'Processing'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'dispatch' && (
            /* Request Dispatch Tab */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
              
              {/* Request Form */}
              <div className="glass-panel" style={{ padding: '24px', backgroundColor: '#faf9f6', border: '1px solid rgba(0,0,0,0.05)', height: 'fit-content' }}>
                <h4 style={{ color: 'var(--color-primary-dark)', fontSize: '1rem', fontWeight: 700, marginBottom: '10px' }}>
                  {t.dispatchHeader}
                </h4>
                <p style={{ color: 'var(--color-text-light)', fontSize: '0.82rem', lineHeight: 1.4, marginBottom: '20px' }}>
                  {t.dispatchDesc}
                </p>
                
                {dispSuccess && (
                  <div style={{ padding: '10px 14px', backgroundColor: 'rgba(82, 183, 136, 0.15)', borderLeft: '4px solid var(--color-accent)', borderRadius: '6px', color: '#1b4332', fontSize: '0.85rem', marginBottom: '16px' }}>
                    {dispSuccess}
                  </div>
                )}
                {dispError && (
                  <div style={{ padding: '10px 14px', backgroundColor: 'rgba(217, 4, 41, 0.15)', borderLeft: '4px solid #d90429', borderRadius: '6px', color: '#680000', fontSize: '0.85rem', marginBottom: '16px' }}>
                    {dispError}
                  </div>
                )}

                <form onSubmit={handleRequestDispatch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label htmlFor="disp-crop">{t.selectCrop}</label>
                    <select
                      id="disp-crop"
                      name="crop"
                      className="form-input"
                      value={dispCrop}
                      onChange={(e) => setDispCrop(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    >
                      {Object.values(crops).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row-responsive">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="disp-weight">{t.estWeight}</label>
                      <input
                        type="number"
                        id="disp-weight"
                        name="weight"
                        className="form-input"
                        placeholder="e.g. 1500"
                        value={dispWeight}
                        onChange={(e) => setDispWeight(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                        required
                      />
                    </div>
                    
                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="disp-date">{t.pickupDate}</label>
                      <input
                        type="date"
                        id="disp-date"
                        name="date"
                        className="form-input"
                        value={dispDate}
                        onChange={(e) => setDispDate(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="disp-location">{t.pickupLocation}</label>
                    <input
                      type="text"
                      id="disp-location"
                      name="location"
                      className="form-input"
                      placeholder="Village Name, Road landmarks"
                      value={dispLocation}
                      onChange={(e) => setDispLocation(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="disp-notes">{t.transitNotes}</label>
                    <textarea
                      id="disp-notes"
                      name="notes"
                      className="form-input"
                      placeholder="e.g. access road is narrow, need weighing scale"
                      value={dispNotes}
                      onChange={(e) => setDispNotes(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', minHeight: '60px' }}
                    ></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                    <Icons.Truck size={16} />
                    {t.submitRequest}
                  </button>
                </form>
              </div>

              {/* Transit Requests History */}
              <div style={{ flex: 1 }}>
                <h4 style={{ color: 'var(--color-primary-dark)', fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>
                  {t.dispatchTab} ({dispatches.length})
                </h4>
                
                {dispatches.length === 0 ? (
                  <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', textAlign: 'center', padding: '40px 0' }}>
                    {t.noDispatches}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {dispatches.map(disp => (
                      <div key={disp.id} className="glass-panel" style={{ padding: '20px', backgroundColor: '#faf9f6', border: '1px solid rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{disp.id}</span>
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                            backgroundColor: disp.status === 'Completed' ? 'rgba(82, 183, 136, 0.15)' : (disp.status === 'Scheduled' ? 'rgba(233, 196, 106, 0.15)' : (disp.status === 'Cancelled' ? 'rgba(217, 4, 41, 0.15)' : 'rgba(0,0,0,0.05)')),
                            color: disp.status === 'Completed' ? '#1b4332' : (disp.status === 'Scheduled' ? '#b07d03' : (disp.status === 'Cancelled' ? '#d90429' : '#000'))
                          }}>
                            {disp.status}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                          {disp.cropName} · {disp.weight.toLocaleString()} kg
                        </p>
                        <p style={{ margin: '0 0 6px', fontSize: '0.8rem', color: 'var(--color-text-dark)' }}>
                          <strong>Date:</strong> {disp.date} | <strong>Location:</strong> {disp.location}
                        </p>
                        {disp.notes && (
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-light)', fontStyle: 'italic' }}>
                            Notes: {disp.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === 'inputs' && (
            /* Agro Inputs Ledger Tab */
            <div>
              <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '10px' }}>
                {t.inputsHeader}
              </h3>
              <p style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', lineHeight: 1.4, marginBottom: '24px' }}>
                {t.inputsDesc}
              </p>

              <div className="table-container-responsive">
                <table>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                      <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)' }}>{t.itemName}</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)', textAlign: 'center' }}>{t.quantity}</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)', textAlign: 'right' }}>{t.unitPrice}</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)', textAlign: 'right' }}>{t.totalCost}</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary-dark)', textAlign: 'center' }}>{t.debtStatus}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockInputs.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>{item.name}</td>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', textAlign: 'center' }}>{item.qty}</td>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', textAlign: 'right' }}>UGX {item.unit.toLocaleString()}</td>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-primary-light)' }}>
                          UGX {(item.qty * item.unit).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: '0.85rem', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                            backgroundColor: item.status === 'Deducted from Harvest' ? 'rgba(82, 183, 136, 0.15)' : 'rgba(233, 196, 106, 0.15)',
                            color: item.status === 'Deducted from Harvest' ? '#1b4332' : '#b07d03'
                          }}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: 'rgba(0,0,0,0.02)', fontWeight: 'bold' }}>
                      <td colSpan="3" style={{ padding: '16px', fontSize: '0.85rem', textAlign: 'right' }}>Total Credit Balance:</td>
                      <td style={{ padding: '16px', fontSize: '0.85rem', textAlign: 'right', color: '#b07d03' }}>
                        UGX {mockInputs.filter(i => i.status === 'Outstanding Credit').reduce((acc, i) => acc + (i.qty * i.unit), 0).toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

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
                        name="clientPwMethod"
                        checked={pwMethod === 'phone'} 
                        onChange={() => setPwMethod('phone')} 
                      />
                      Phone Number
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="clientPwMethod"
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
