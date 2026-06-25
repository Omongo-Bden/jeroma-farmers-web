import React, { useState } from 'react';
import * as Icons from './Icons';
import { getUsers, registerUser, validateLogin, updateUser } from '../utils/db';

export default function AuthPortal({ lang, onLoginSuccess, onCancel, translations: dynamicTranslations }) {
  // Default to login view (not register), regardless of screen size
  const [isRegistering, setIsRegistering] = useState(false);

  // Login Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form States
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDistrict, setRegDistrict] = useState('Lira');
  const [regFarmSize, setRegFarmSize] = useState('');

  // Forgot Password States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
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

    const username = cleanInput(regUsername).toLowerCase();
    const password = regPassword;
    const name = cleanInput(regName);
    const phone = cleanInput(regPhone);
    const district = cleanInput(regDistrict);
    const farmSize = cleanInput(regFarmSize);

    if (!username || !password || !name || !phone || !farmSize) {
      setError(t.authEnterAllFields || 'Please fill out all fields.');
      return;
    }

    const newUserObj = {
      username,
      password,
      name,
      phone,
      district,
      farmSize: farmSize + ' acres'
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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const username = cleanInput(resetUsername);
    const phone = cleanInput(resetPhone);
    const newPw = newPassword;

    if (!username || !phone || !newPw) {
      setError(t.authEnterAllFields || 'Please fill out all fields.');
      return;
    }

    const users = await getUsers();
    const user = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.phone === phone
    );

    if (!user) {
      setError(t.authUserNotFound || 'User not found or phone number does not match.');
      return;
    }

    setIsLoading(true);
    try {
      await updateUser(user.username, { password: newPw });
      setSuccess(t.authResetSuccess || 'Password reset successfully! You can now log in.');
      setIsForgotPassword(false);
      setLoginUsername(user.username);
      setLoginPassword('');
      setResetUsername('');
      setResetPhone('');
      setNewPassword('');
    } catch (err) {
      setError('Password reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const ugandanDistricts = ['Lira', 'Kole', 'Dokolo', 'Oyam', 'Apac', 'Otuke', 'Alebtong', 'Amolatar', 'Gulu', 'Kampala'];

  const clearState = () => { setError(''); setSuccess(''); };

  return (
    <section className="section auth-section" style={{ display: 'flex', background: '#ffffff' }}>
      <div className="container" style={{ maxWidth: '480px', width: '100%' }}>

        {/* Header Branding */}
        <div className="auth-branding">
          <img src="/logo.webp" alt="Jeroma Logo" className="auth-logo-img" />
          <h2 className="auth-title">{t.authPortalTitle}</h2>
          <p className="auth-subtitle">{t.authPortalSubtitle}</p>
        </div>

        {/* Portal card */}
        <div className="glass-panel" style={{ padding: '32px 28px', border: '1px solid rgba(27,67,50,0.12)', boxShadow: '0 20px 60px rgba(15,48,32,0.06)', borderRadius: '20px', transition: 'all 0.4s ease' }}>

          {/* Tab Selector */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '28px', borderBottom: '1px solid rgba(27,67,50,0.08)', paddingBottom: '16px' }}>
            <button
              type="button"
              id="auth-tab-login"
              onClick={() => { setIsRegistering(false); setIsForgotPassword(false); clearState(); }}
              style={{
                flex: 1, padding: '13px 16px', borderRadius: '10px',
                border: !isRegistering && !isForgotPassword ? '2px solid var(--color-secondary)' : '2px solid rgba(27,67,50,0.08)',
                background: !isRegistering && !isForgotPassword ? 'var(--color-secondary)' : 'rgba(27,67,50,0.04)',
                color: !isRegistering && !isForgotPassword ? 'var(--color-primary-dark)' : 'var(--color-text-light)',
                fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.25s ease',
                letterSpacing: '0.01em',
                boxShadow: !isRegistering && !isForgotPassword ? '0 4px 14px rgba(233,196,106,0.25)' : 'none'
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
                border: isRegistering && !isForgotPassword ? '2px solid var(--color-secondary)' : '2px solid rgba(27,67,50,0.08)',
                background: isRegistering && !isForgotPassword ? 'var(--color-secondary)' : 'rgba(27,67,50,0.04)',
                color: isRegistering && !isForgotPassword ? 'var(--color-primary-dark)' : 'var(--color-text-light)',
                fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.25s ease',
                letterSpacing: '0.01em',
                boxShadow: isRegistering && !isForgotPassword ? '0 4px 14px rgba(233,196,106,0.25)' : 'none'
              }}
            >
              {t.authTabRegister || '✍️ Register'}
            </button>
          </div>

          {/* Success & Error alerts */}
          {error && (
            <div style={{ padding: '12px 16px', backgroundColor: 'rgba(217, 4, 41, 0.15)', borderLeft: '4px solid #d90429', borderRadius: '6px', color: '#ffb3c1', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Icons.CheckCircle size={18} style={{ color: '#d90429', transform: 'rotate(180deg)' }} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div style={{ padding: '12px 16px', backgroundColor: 'rgba(82, 183, 136, 0.15)', borderLeft: '4px solid var(--color-accent)', borderRadius: '6px', color: '#c4f0db', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Icons.CheckCircle size={18} style={{ color: 'var(--color-accent)' }} />
              <span>{success}</span>
            </div>
          )}

          {/* Form Header */}
          <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 700, marginBottom: '24px', borderBottom: '1px solid rgba(27,67,50,0.08)', paddingBottom: '12px' }}>
            {isForgotPassword ? (t.authResetPasswordHeader || 'Reset Your Password') : (isRegistering ? t.authRegisterHeader : t.authLoginHeader)}
          </h3>

          {isForgotPassword ? (
            /* Forgot Password Form */
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="reset-username" style={{ color: 'var(--color-primary-dark)' }}>{t.authUsername}</label>
                <input
                  type="text" id="reset-username" name="username" autoComplete="username"
                  className="form-input" value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)} required
                />
              </div>
              <div className="form-group">
                <label htmlFor="reset-phone" style={{ color: 'var(--color-primary-dark)' }}>{t.authResetPhone || 'Registered Phone Number'}</label>
                <input
                  type="tel" id="reset-phone" name="phone" autoComplete="tel"
                  className="form-input" value={resetPhone}
                  onChange={(e) => setResetPhone(e.target.value)} required
                />
              </div>
              <div className="form-group">
                <label htmlFor="reset-new-password" style={{ color: 'var(--color-primary-dark)' }}>{t.authNewPassword || 'New Password'}</label>
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
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px'
                    }}
                  >
                    {showResetPassword ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px', padding: '12px' }} disabled={isLoading}>
                <Icons.CheckCircle size={18} />
                <span style={{ marginLeft: '8px' }}>{isLoading ? '...' : (t.authResetBtn || 'Reset Password')}</span>
              </button>
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button type="button" onClick={() => { setIsForgotPassword(false); clearState(); }} style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>
                  {t.authBackToLogin || 'Back to Login'}
                </button>
              </div>
            </form>
          ) : !isRegistering ? (
            /* Login Form */
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="username" style={{ color: 'var(--color-primary-dark)' }}>{t.authUsername}</label>
                <input
                  type="text" id="username" name="username" autoComplete="username"
                  className="form-input" placeholder="e.g. okello"
                  value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" style={{ color: 'var(--color-primary-dark)' }}>{t.authPassword}</label>
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
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)',
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
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  {t.authForgotPasswordLink || 'Forgot Password?'}
                </button>
              </div>

              <button
                type="submit" className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '12px', padding: '12px' }}
                disabled={isLoading}
              >
                <span>{isLoading ? '...' : t.authLoginBtn}</span>
                {!isLoading && <Icons.ArrowRight size={18} />}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-light)', marginTop: '16px' }}>
                {t.authNoAccount}{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegistering(true); clearState(); }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  {t.authRegisterLink}
                </button>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="reg-name" style={{ color: 'var(--color-primary-dark)' }}>{t.authFullName}</label>
                <input
                  type="text" id="reg-name" name="name" autoComplete="name"
                  className="form-input" placeholder="John Okello"
                  value={regName} onChange={(e) => setRegName(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-phone" style={{ color: 'var(--color-primary-dark)' }}>{t.authPhone}</label>
                <input
                  type="tel" id="reg-phone" name="phone" autoComplete="tel"
                  className="form-input" placeholder="+256 772 123 456"
                  value={regPhone} onChange={(e) => setRegPhone(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className="form-row-responsive">
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="reg-district" style={{ color: 'var(--color-primary-dark)' }}>{t.authDistrict}</label>
                  <select
                    id="reg-district" name="district" className="form-input"
                    value={regDistrict} onChange={(e) => setRegDistrict(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--color-bg-white)', color: 'var(--color-text-dark)', border: '1px solid rgba(27,67,50,0.2)' }}
                  >
                    {ugandanDistricts.map(d => (
                      <option key={d} value={d} style={{ background: '#ffffff', color: 'var(--color-text-dark)' }}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="reg-farm" style={{ color: 'var(--color-primary-dark)' }}>{t.authFarmSize}</label>
                  <input
                    type="number" id="reg-farm" name="farmSize"
                    className="form-input" placeholder="e.g. 5"
                    value={regFarmSize} onChange={(e) => setRegFarmSize(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-username" style={{ color: 'var(--color-primary-dark)' }}>{t.authUsername}</label>
                <input
                  type="text" id="reg-username" name="username" autoComplete="username"
                  className="form-input" placeholder="e.g. johnokello"
                  value={regUsername} onChange={(e) => setRegUsername(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-password" style={{ color: 'var(--color-primary-dark)' }}>{t.authPassword}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showRegPassword ? "text" : "password"} id="reg-password" name="password" autoComplete="new-password"
                    className="form-input" placeholder="••••••••"
                    value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', paddingRight: '40px' }}
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
                style={{ width: '100%', justifyContent: 'center', marginTop: '12px', padding: '12px' }}
                disabled={isLoading}
              >
                <span>{isLoading ? '...' : t.authRegisterBtn}</span>
                {!isLoading && <Icons.ArrowRight size={18} />}
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-light)', marginTop: '16px' }}>
                {t.authHasAccount}{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegistering(false); clearState(); }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary-light)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
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
            style={{ background: 'none', border: 'none', color: 'var(--color-text-light)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'underline' }}
          >
            <Icons.ChevronDown size={16} style={{ transform: 'rotate(90deg)' }} />
            {t.authBackHome}
          </button>
        </div>

      </div>
    </section>
  );
}
