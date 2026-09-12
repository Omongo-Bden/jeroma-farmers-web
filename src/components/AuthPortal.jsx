import React, { useState, useEffect } from 'react';
import * as Icons from './Icons';
import { getUsers, registerUser, validateLogin, updateUser } from '../utils/db';
import { UGANDA_DISTRICTS, generateAutoFarmerId } from '../utils/ugandaDistricts';

export default function AuthPortal({ lang, onLoginSuccess, onCancel, translations: dynamicTranslations }) {
  // Default to login view (not register), regardless of screen size
  const [isRegistering, setIsRegistering] = useState(false);

  // Login Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form States (Simplified Farmer Enrollment)
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regGender, setRegGender] = useState('Female');
  const [regDistrict, setRegDistrict] = useState('Lira');
  const [regPassword, setRegPassword] = useState('');
  const [regAutoId, setRegAutoId] = useState(() => generateAutoFarmerId('Lira'));

  // Calculate 16-year minimum age date string for native date picker limit
  const maxDobDate = new Date();
  maxDobDate.setFullYear(maxDobDate.getFullYear() - 16);
  const maxDobString = maxDobDate.toISOString().split('T')[0];

  // Update auto-farmer ID when district changes
  const handleDistrictChange = (dName) => {
    setRegDistrict(dName);
    setRegAutoId(generateAutoFarmerId(dName));
  };

  // Forgot Password States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetMethod, setResetMethod] = useState('phone');
  const [resetEmail, setResetEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Loading state (async operations)
  const [isLoading, setIsLoading] = useState(false);

  // Feedback States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Use centralized translations from App.jsx (via dynamicTranslations prop)
  const t = (dynamicTranslations?.[lang] ?? dynamicTranslations?.en) || {};

  // Simple, safe input sanitizer: trim only. React JSX handles XSS automatically.
  const cleanInput = (val) => (typeof val === 'string' ? val.trim() : val);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const username = cleanInput(loginUsername);
    const password = loginPassword; // Do not trim passwords (spaces may be intentional)

    if (!username || !password) {
      setError(t.authEnterAllFields || 'Please fill out all fields.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await validateLogin(username, password);
      if (!user) {
        setError(t.authInvalidLogin || 'Invalid username or password.');
        return;
      }
      onLoginSuccess(user);
    } catch (err) {
      setError(t.authInvalidLogin || 'Invalid username or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const name = cleanInput(regName);
    const phone = cleanInput(regPhone);
    const email = cleanInput(regEmail).toLowerCase();
    const dob = cleanInput(regDob);
    const gender = cleanInput(regGender) || 'Female';
    const district = cleanInput(regDistrict) || 'Lira';
    const password = regPassword;

    if (!name || !phone || !email || !dob || !password) {
      setError(t.authEnterAllFields || 'Please fill out all required fields.');
      return;
    }

    // Age validation: strictly restricted to at least 16 years old
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) {
      setError(lang === 'en' ? 'Please enter a valid Date of Birth.' : 'Ket nino dwe me nywol ma tye kakare.');
      return;
    }
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    if (calculatedAge < 16) {
      setError(lang === 'en' 
        ? 'Registration restricted: You must be at least 16 years old to register as a farmer.' 
        : 'Gwoko twero: Myero ibed kede mwaki 16 onyo makato me coyo nying.'
      );
      return;
    }

    // Auto-derive primary login username from telephone digits or email prefix
    const phoneDigits = phone.replace(/\D/g, '');
    const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const username = phoneDigits.length >= 6 ? phoneDigits : (emailPrefix || `fmr_${Date.now()}`);

    // Restrict password strength
    const hasText = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (password.length < 6 || !hasText || !hasNumber) {
      setError(lang === 'en' 
        ? 'Password must be at least 6 characters and contain a mixture of text and numbers.' 
        : 'Coyo me password myero obed character 6 onyo dong kede mixture me text kede wel.'
      );
      return;
    }

    const newUserObj = {
      username,
      password,
      name,
      phone,
      email,
      dob,
      gender,
      district,
      farmSize: '',
      nin: '',
      farmerId: regAutoId,
      role: 'client',
      status: 'active'
    };

    setIsLoading(true);
    try {
      const result = await registerUser(newUserObj);
      if (!result.success) {
        setError(t.authUsernameExists || result.error);
        return;
      }

      // Auto-login after successful registration by re-using result.user
      if (result.user) {
        const { password: _password, ...userSession } = result.user;
        onLoginSuccess(userSession);
      } else {
        // Fallback: fetch users and find registered user
        const users = await getUsers();
        const registeredUser = users.find(u => u.username === username);
        if (registeredUser) {
          const { password: _password2, ...session } = registeredUser;
          onLoginSuccess(session);
        }
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateResetCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const username = cleanInput(resetUsername);
    const contactValue = resetMethod === 'phone' ? cleanInput(resetPhone) : cleanInput(resetEmail);

    if (!username || !contactValue) {
      setError(t.authEnterAllFields || 'Please fill out all fields.');
      return;
    }

    setIsLoading(true);
    try {
      const users = await getUsers();
      const normUser = username.toLowerCase();
      const normContact = contactValue.toLowerCase();
      const contactDigits = normContact.replace(/\D/g, '');

      const user = users.find(u => {
        const uName = (u.username || '').toLowerCase();
        const uEmail = (u.email || '').toLowerCase();
        const uPhoneDigits = (u.phone || '').replace(/\D/g, '');
        
        const matchName = uName === normUser || (uEmail && uEmail === normUser);
        const matchContact = resetMethod === 'phone'
          ? (contactDigits.length >= 6 && (uPhoneDigits === contactDigits || uPhoneDigits.endsWith(contactDigits) || contactDigits.endsWith(uPhoneDigits)))
          : ((uEmail && uEmail === normContact) || normContact.includes('@'));

        return matchName || matchContact;
      });

      if (!user) {
        setError('User not found or contact information does not match.');
        return;
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setEnteredCode(code); // Pre-fill for instant testing
      console.log('SIMULATED SMS/EMAIL RESET CODE:', code);
      setSuccess(`Verification code generated! Confirm the code below to reset your password.`);
      setResetStep(2);
    } catch (err) {
      setError('Failed to generate verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (enteredCode !== generatedCode) {
      setError('Invalid 6-digit verification code.');
      return;
    }

    const hasText = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (newPassword.length < 6 || !hasText || !hasNumber) {
      setError('Password must be at least 6 characters and contain a mixture of text and numbers.');
      return;
    }

    setIsLoading(true);
    try {
      await updateUser(resetUsername.toLowerCase(), { password: newPassword });
      setSuccess(t.authResetSuccess || 'Password reset successfully! You can now log in.');
      setIsForgotPassword(false);
      setLoginUsername(resetUsername);
      setLoginPassword('');
      setResetUsername('');
      setResetPhone('');
      setResetEmail('');
      setNewPassword('');
      setGeneratedCode('');
      setEnteredCode('');
      setResetStep(1);
    } catch (err) {
      setError('Password reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearState = () => { setError(''); setSuccess(''); };

  return (
    <section className="section auth-section" style={{ display: 'flex', background: 'var(--color-bg-light)' }}>
      <div className="container" style={{ maxWidth: '480px', width: '100%' }}>

        {/* Header Branding */}
        <div className="auth-branding">
          <img src="/logo.webp" alt="Jeroma Logo" className="auth-logo-img" />
          <h2 className="auth-title">{t.authPortalTitle}</h2>
          <p className="auth-subtitle">{t.authPortalSubtitle}</p>
        </div>

        {/* Portal card */}
        <div className="glass-panel auth-card" style={{ padding: '32px 28px', border: '1.5px solid rgba(233, 196, 106, 0.35)', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.45)', borderRadius: '20px', transition: 'all 0.4s ease', background: 'rgba(8, 48, 28, 0.95)' }}>

          {/* Tab Selector */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '28px', borderBottom: '1px solid rgba(233, 196, 106, 0.2)', paddingBottom: '16px' }}>
            <button
              type="button"
              id="auth-tab-login"
              onClick={() => { setIsRegistering(false); setIsForgotPassword(false); clearState(); }}
              style={{
                flex: 1, padding: '13px 16px', borderRadius: '10px',
                border: !isRegistering && !isForgotPassword ? '2px solid var(--color-secondary)' : '2px solid rgba(255,255,255,0.15)',
                background: !isRegistering && !isForgotPassword ? 'var(--color-secondary)' : 'rgba(255,255,255,0.06)',
                color: !isRegistering && !isForgotPassword ? '#0f3020' : '#ffffff',
                fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.25s ease',
                letterSpacing: '0.01em',
                boxShadow: !isRegistering && !isForgotPassword ? '0 4px 14px rgba(233,196,106,0.3)' : 'none'
              }}
            >
              {t.authTabLogin || '🔑 Log In'}
            </button>
            <button
              type="button"
              id="auth-tab-register"
              onClick={() => { setIsRegistering(true); setIsForgotPassword(false); clearState(); }}
              style={{
                flex: 1, padding: '13px 16px', borderRadius: '10px',
                border: isRegistering && !isForgotPassword ? '2px solid var(--color-secondary)' : '2px solid rgba(255,255,255,0.15)',
                background: isRegistering && !isForgotPassword ? 'var(--color-secondary)' : 'rgba(255,255,255,0.06)',
                color: isRegistering && !isForgotPassword ? '#0f3020' : '#ffffff',
                fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.25s ease',
                letterSpacing: '0.01em',
                boxShadow: isRegistering && !isForgotPassword ? '0 4px 14px rgba(233,196,106,0.3)' : 'none'
              }}
            >
              {t.authTabRegister || '✍️ Register'}
            </button>
          </div>

          {/* Success & Error alerts */}
          {error && (
            <div style={{ padding: '12px 16px', backgroundColor: 'rgba(217, 4, 41, 0.25)', borderLeft: '4px solid #d90429', borderRadius: '6px', color: '#ffc2d1', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
              <Icons.CheckCircle size={18} style={{ color: '#ff4d6d', transform: 'rotate(180deg)' }} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div style={{ padding: '12px 16px', backgroundColor: 'rgba(82, 183, 136, 0.25)', borderLeft: '4px solid var(--color-accent)', borderRadius: '6px', color: '#d8f3dc', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
              <Icons.CheckCircle size={18} style={{ color: 'var(--color-accent)' }} />
              <span>{success}</span>
            </div>
          )}

          {/* Form Header */}
          <h3 style={{ color: '#ffd166', fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 800, marginBottom: '24px', borderBottom: '1px solid rgba(233,196,106,0.2)', paddingBottom: '12px' }}>
            {isForgotPassword ? (t.authResetPasswordHeader || 'Reset Your Password') : (isRegistering ? t.authRegisterHeader : t.authLoginHeader)}
          </h3>

          {isForgotPassword ? (
            /* Forgot Password Form */
            <form onSubmit={resetStep === 1 ? handleGenerateResetCode : handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {resetStep === 1 ? (
                <>
                  <div className="form-group">
                    <label htmlFor="reset-username" style={{ color: '#ffd166', fontWeight: 700, display: 'block', marginBottom: '6px' }}>{t.authUsername}</label>
                    <input
                      type="text" id="reset-username" name="username" autoComplete="username"
                      className="form-input" value={resetUsername}
                      onChange={(e) => setResetUsername(e.target.value)} required
                      style={{ width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label style={{ color: '#ffd166', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Verify Via</label>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem', color: '#ffffff', fontWeight: 600 }}>
                        <input type="radio" name="resetMethod" value="phone" checked={resetMethod === 'phone'} onChange={() => setResetMethod('phone')} />
                        Phone Number
                      </label>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem', color: '#ffffff', fontWeight: 600 }}>
                        <input type="radio" name="resetMethod" value="email" checked={resetMethod === 'email'} onChange={() => setResetMethod('email')} />
                        Email Address
                      </label>
                    </div>
                  </div>

                  {resetMethod === 'phone' ? (
                    <div className="form-group">
                      <label htmlFor="reset-phone" style={{ color: '#ffd166', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Registered Phone Number</label>
                      <input
                        type="tel" id="reset-phone" name="phone" autoComplete="tel"
                        className="form-input" value={resetPhone}
                        onChange={(e) => setResetPhone(e.target.value)} required
                        placeholder="+256 773 623 196"
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                  ) : (
                    <div className="form-group">
                      <label htmlFor="reset-email" style={{ color: '#ffd166', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Registered Email Address</label>
                      <input
                        type="email" id="reset-email" name="email" autoComplete="email"
                        className="form-input" value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)} required
                        placeholder="farmer@example.com"
                        style={{ width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px', padding: '12px', fontWeight: 700 }} disabled={isLoading}>
                    <Icons.MessageSquare size={18} />
                    <span style={{ marginLeft: '8px' }}>{isLoading ? '...' : 'Generate Reset Code'}</span>
                  </button>
                </>
              ) : (
                <>
                  <div style={{ backgroundColor: 'rgba(8, 28, 21, 0.95)', padding: '16px', borderRadius: '10px', border: '2px solid #ffd166', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                    <div style={{ fontSize: '0.85rem', color: '#d8f3dc', fontWeight: 600, marginBottom: '6px' }}>
                      🔐 Verification Security Code:
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '6px', color: '#ffd166', padding: '4px 0', textShadow: '0 2px 8px rgba(255,209,102,0.4)' }}>
                      {generatedCode}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#86efac', marginTop: '4px' }}>
                      (Generated for {resetMethod === 'phone' ? 'SMS Phone' : 'Email'} verification · Auto-filled below for easy confirmation)
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="reset-code" style={{ color: '#ffd166', fontWeight: 700, display: 'block', marginBottom: '6px' }}>6-Digit Verification Code</label>
                    <input
                      type="text" id="reset-code" name="code" maxLength="6"
                      className="form-input" value={enteredCode}
                      onChange={(e) => setEnteredCode(e.target.value)} required
                      placeholder="Enter 6-digit code"
                      style={{ fontSize: '1.1rem', letterSpacing: '0.2em', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="reset-new-password" style={{ color: '#ffd166', fontWeight: 700, display: 'block', marginBottom: '6px' }}>{t.authNewPassword || 'New Password'}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showResetPassword ? "text" : "password"} id="reset-new-password" name="new-password" autoComplete="new-password"
                        className="form-input" value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)} required
                        style={{ width: '100%', boxSizing: 'border-box', paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        style={{
                          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px'
                        }}
                      >
                        {showResetPassword ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setResetStep(1)} style={{ flex: 1, justifyContent: 'center', padding: '12px' }}>
                      Back
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', padding: '12px', fontWeight: 700 }} disabled={isLoading}>
                      <Icons.CheckCircle size={18} />
                      <span style={{ marginLeft: '8px' }}>{isLoading ? '...' : (t.authResetBtn || 'Reset Password')}</span>
                    </button>
                  </div>
                </>
              )}

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button type="button" onClick={() => { setIsForgotPassword(false); setResetStep(1); clearState(); }} style={{ background: 'none', border: 'none', color: '#ffd166', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
                  {t.authBackToLogin || 'Back to Login'}
                </button>
              </div>
            </form>
          ) : !isRegistering ? (
            /* Login Form */
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="username" style={{ color: '#ffd166', fontWeight: 700, display: 'block', marginBottom: '6px', letterSpacing: '0.02em' }}>
                  {t.authUsername || 'Username, Phone Number, or Email'}
                </label>
                <input
                  type="text" id="username" name="username" autoComplete="username"
                  className="form-input" placeholder="e.g. +256 77... or email or username"
                  value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" style={{ color: '#ffd166', fontWeight: 700, display: 'block', marginBottom: '6px', letterSpacing: '0.02em' }}>{t.authPassword}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showLoginPassword ? "text" : "password"} id="password" name="password" autoComplete="current-password"
                    className="form-input" placeholder="••••••••"
                    value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px'
                    }}
                  >
                    {showLoginPassword ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginTop: '-8px' }}>
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(true); clearState(); }}
                  style={{ background: 'none', border: 'none', color: '#ffd166', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontWeight: 700 }}
                >
                  {t.authForgotPasswordLink || 'Forgot Password?'}
                </button>
              </div>

              <button
                type="submit" className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '12px', padding: '12px', fontWeight: 700 }}
                disabled={isLoading}
              >
                <span>{isLoading ? '...' : t.authLoginBtn}</span>
                {!isLoading && <Icons.ArrowRight size={18} />}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.88rem', color: '#ffffff', marginTop: '16px' }}>
                {t.authNoAccount}{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegistering(true); clearState(); }}
                  style={{ background: 'none', border: 'none', color: '#ffd166', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  {t.authRegisterLink}
                </button>
              </div>
            </form>
          ) : (
            /* Register Form: Clean, Yellow Headings, No Guides, Email/DOB(16+)/Gender */
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* 1. Full Name */}
              <div className="form-group">
                <label htmlFor="reg-name" style={{ color: '#ffd166', fontWeight: 700, fontSize: '0.875rem', display: 'block', marginBottom: '6px', letterSpacing: '0.02em' }}>
                  👤 Full Name
                </label>
                <input
                  type="text" id="reg-name" name="name" autoComplete="name"
                  className="form-input" placeholder="e.g. John Okello"
                  value={regName} onChange={(e) => setRegName(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>

              {/* 2. Telephone Contact */}
              <div className="form-group">
                <label htmlFor="reg-phone" style={{ color: '#ffd166', fontWeight: 700, fontSize: '0.875rem', display: 'block', marginBottom: '6px', letterSpacing: '0.02em' }}>
                  📞 Telephone Contact
                </label>
                <input
                  type="tel" id="reg-phone" name="phone" autoComplete="tel"
                  className="form-input" placeholder="e.g. +256 772 123 456"
                  value={regPhone} onChange={(e) => setRegPhone(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>

              {/* 3. Email Address */}
              <div className="form-group">
                <label htmlFor="reg-email" style={{ color: '#ffd166', fontWeight: 700, fontSize: '0.875rem', display: 'block', marginBottom: '6px', letterSpacing: '0.02em' }}>
                  ✉️ Email Address
                </label>
                <input
                  type="email" id="reg-email" name="email" autoComplete="email"
                  className="form-input" placeholder="e.g. farmer@example.com"
                  value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>

              {/* 4. Date of Birth & Gender (Age restricted to at least 16 years old) */}
              <div className="form-row-responsive">
                <div className="form-group" style={{ flex: 1.2 }}>
                  <label htmlFor="reg-dob" style={{ color: '#ffd166', fontWeight: 700, fontSize: '0.875rem', display: 'block', marginBottom: '6px', letterSpacing: '0.02em' }}>
                    🎂 Date of Birth
                  </label>
                  <input
                    type="date" id="reg-dob" name="dob" max={maxDobString}
                    className="form-input"
                    value={regDob} onChange={(e) => setRegDob(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div className="form-group" style={{ flex: 0.8 }}>
                  <label htmlFor="reg-gender" style={{ color: '#ffd166', fontWeight: 700, fontSize: '0.875rem', display: 'block', marginBottom: '6px', letterSpacing: '0.02em' }}>
                    ⚥ Gender
                  </label>
                  <select
                    id="reg-gender" name="gender" className="form-input"
                    value={regGender} onChange={(e) => setRegGender(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other / Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* 5. District in Uganda */}
              <div className="form-group">
                <label htmlFor="reg-district" style={{ color: '#ffd166', fontWeight: 700, fontSize: '0.875rem', display: 'block', marginBottom: '6px', letterSpacing: '0.02em' }}>
                  📍 District in Uganda
                </label>
                <select
                  id="reg-district" name="district" className="form-input"
                  value={regDistrict} onChange={(e) => handleDistrictChange(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  {UGANDA_DISTRICTS.map(d => (
                    <option key={d.code} value={d.name}>
                      {d.code}. {d.name} ({d.region})
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Create Secure Password */}
              <div className="form-group">
                <label htmlFor="reg-password" style={{ color: '#ffd166', fontWeight: 700, fontSize: '0.875rem', display: 'block', marginBottom: '6px', letterSpacing: '0.02em' }}>
                  🔒 Create Secure Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showRegPassword ? "text" : "password"} id="reg-password" name="password" autoComplete="new-password"
                    className="form-input" placeholder="••••••••"
                    value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', paddingRight: '40px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px'
                    }}
                  >
                    {showRegPassword ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit" className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '12px', padding: '12px', fontWeight: 700 }}
                disabled={isLoading}
              >
                <span>{isLoading ? 'Registering...' : (t.authRegisterBtn || 'Register Farmer Account')}</span>
                {!isLoading && <Icons.ArrowRight size={18} />}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.88rem', color: '#ffffff', marginTop: '16px' }}>
                {t.authHasAccount}{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegistering(false); clearState(); }}
                  style={{ background: 'none', border: 'none', color: '#ffd166', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  {t.authLoginLink}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Back Button */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            type="button" onClick={onCancel}
            style={{ background: 'none', border: 'none', color: '#ffd166', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'underline' }}
          >
            <Icons.ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} />
            {t.authBackHome}
          </button>
        </div>

      </div>
    </section>
  );
}
