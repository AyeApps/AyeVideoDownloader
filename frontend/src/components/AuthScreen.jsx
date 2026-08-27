import React, { useState, useEffect } from 'react';

// AyeApps Unified Icons
const Icons = {
  Google: () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  ),
  Apple: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.66-.99 1.72-.85 2.76 1.01.08 2.03-.51 2.56-1.26z" />
    </svg>
  ),
  Sun: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Moon: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  Globe: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Alert: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
};

// Aye Bauhaus Atelier Logo
const AyeLogo = ({ size = 36 }) => (
  <div style={{ width: size, height: size, position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="4" y="4" width="40" height="40" rx="4" stroke="currentColor" strokeWidth="3" />
      <path d="M14 34L24 14L34 34" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M18 27H30" stroke="var(--accent-amber, #FE9D01)" strokeWidth="3" />
      <circle cx="24" cy="20" r="2" fill="var(--accent-amber, #FE9D01)" />
    </svg>
  </div>
);

export default function AuthScreen({
  apiBaseUrl = '',
  onLoginSuccess,
  appName = 'AYE VIDEO DOWNLOADER'
}) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [lang, setLang] = useState('es'); // 'es' | 'en'
  const [isDark, setIsDark] = useState(true);
  const [serverStatus, setServerStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAccountNotFound, setIsAccountNotFound] = useState(false);

  // Load remembered preferences
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('aye_remembered_email');
      if (savedEmail) setEmail(savedEmail);
      const savedLang = localStorage.getItem('preferred_lang');
      if (savedLang) setLang(savedLang);
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        setIsDark(savedTheme === 'dark');
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      }
    } catch {}
  }, []);

  // Live Server Health Check
  useEffect(() => {
    let isMounted = true;
    const checkServer = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/health`);
        if (res.ok && isMounted) {
          setServerStatus('online');
        } else if (isMounted) {
          setServerStatus('offline');
        }
      } catch {
        if (isMounted) setServerStatus('offline');
      }
    };
    checkServer();
    return () => { isMounted = false; };
  }, [apiBaseUrl]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    try {
      localStorage.setItem('theme', nextDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', nextDark);
    } catch {}
  };

  const toggleLang = () => {
    const nextLang = lang === 'es' ? 'en' : 'es';
    setLang(nextLang);
    try {
      localStorage.setItem('preferred_lang', nextLang);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsAccountNotFound(false);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setAuthError(lang === 'es' ? 'Ingresa tu correo y contraseña.' : 'Please enter email and password.');
      return;
    }

    if (authMode === 'register' && trimmedPassword.length < 8) {
      setAuthError(lang === 'es' ? 'La contraseña debe tener al menos 8 caracteres.' : 'Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload = authMode === 'register'
        ? { name: name.trim() || 'User', email: trimmedEmail, password: trimmedPassword }
        : { email: trimmedEmail, password: trimmedPassword };

      const res = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        const errorDetail = data.detail || data.error || (lang === 'es' ? 'Error al autenticar' : 'Authentication failed');
        if (authMode === 'login' && (res.status === 404 || errorDetail.toLowerCase().includes('not found') || errorDetail.toLowerCase().includes('no existe'))) {
          setIsAccountNotFound(true);
        }
        throw new Error(errorDetail);
      }

      if (rememberEmail) {
        localStorage.setItem('aye_remembered_email', trimmedEmail);
      } else {
        localStorage.removeItem('aye_remembered_email');
      }

      if (authMode === 'register') {
        setAuthMode('login');
        setAuthError(lang === 'es' ? '¡Cuenta creada con éxito! Inicia sesión.' : 'Account created successfully! Please sign in.');
      } else {
        if (onLoginSuccess) {
          onLoginSuccess(data, trimmedEmail);
        }
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const t = {
    es: {
      accountBadge: 'AYEAPPS ID // ACCESO UNIFICADO',
      subtitle: 'Una sola cuenta para todo el ecosistema de aplicaciones de AyeApps.',
      loginTab: 'INICIAR SESIÓN',
      registerTab: 'CREAR CUENTA',
      appleBtn: 'Continuar con Apple',
      googleBtn: 'Continuar con Google',
      divider: 'O CONTINÚA CON TU CORREO',
      namePlaceholder: 'Nombre completo',
      emailPlaceholder: 'correo@ejemplo.com',
      passwordPlaceholder: 'Contraseña (mínimo 8 caracteres)',
      rememberMe: 'Recordar mi correo',
      showPass: 'Mostrar',
      hidePass: 'Ocultar',
      submitLogin: 'INICIAR SESIÓN',
      submitRegister: 'CREAR CUENTA AYEAPPS',
      accountNotFound: '¿No tienes cuenta aún? Haz clic aquí para registrarte.',
      footerTerms: 'Al ingresar aceptas los Términos y la Política de Privacidad de AyeApps.',
      atelierCredit: 'AyeApps Atelier · Ecosistema de Software Unificado'
    },
    en: {
      accountBadge: 'AYEAPPS ID // UNIFIED ACCESS',
      subtitle: 'One single account for the entire AyeApps software ecosystem.',
      loginTab: 'SIGN IN',
      registerTab: 'CREATE ACCOUNT',
      appleBtn: 'Continue with Apple',
      googleBtn: 'Continue with Google',
      divider: 'OR CONTINUE WITH EMAIL',
      namePlaceholder: 'Full name',
      emailPlaceholder: 'email@example.com',
      passwordPlaceholder: 'Password (min. 8 characters)',
      rememberMe: 'Remember my email',
      showPass: 'Show',
      hidePass: 'Hide',
      submitLogin: 'SIGN IN',
      submitRegister: 'CREATE AYEAPPS ACCOUNT',
      accountNotFound: 'No account found. Click here to register.',
      footerTerms: 'By signing in you accept AyeApps Terms & Privacy Policy.',
      atelierCredit: 'AyeApps Atelier · Unified Software Ecosystem'
    }
  }[lang];

  return (
    <div className={`aye-auth-root ${isDark ? 'dark' : 'light'}`}>
      {/* Background Dot Matrix */}
      <div className="aye-auth-dots" />

      {/* Top Header Bar */}
      <header className="aye-auth-header">
        {/* Server Telemetry Badge */}
        <div className="aye-telemetry-badge">
          <span className={`aye-telemetry-dot ${serverStatus === 'online' ? 'online' : serverStatus === 'checking' ? 'checking' : 'offline'}`} />
          <span className="aye-telemetry-text font-mono">
            {serverStatus === 'online' ? (lang === 'es' ? 'SISTEMA EN LÍNEA' : 'SYSTEM ONLINE') : serverStatus === 'checking' ? (lang === 'es' ? 'CONECTANDO...' : 'CONNECTING...') : (lang === 'es' ? 'MODO OFFLINE' : 'OFFLINE MODE')}
          </span>
        </div>

        {/* Controls */}
        <div className="aye-auth-controls">
          <button onClick={toggleLang} className="aye-control-btn font-mono" title="Cambiar idioma">
            <Icons.Globe />
            <span>{lang.toUpperCase()}</span>
          </button>
          <button onClick={toggleTheme} className="aye-control-btn" title="Cambiar tema">
            {isDark ? <Icons.Sun /> : <Icons.Moon />}
          </button>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="aye-auth-card-wrapper">
        <div className="aye-auth-card">
          {/* Logo & Ecosystem Branding */}
          <div className="aye-auth-branding">
            <div className="aye-logo-container">
              <AyeLogo size={42} />
            </div>
            
            <div className="aye-system-badge font-mono">
              {t.accountBadge}
            </div>

            <h1 className="aye-auth-title font-mono">
              AYEAPPS ID
            </h1>
            
            <p className="aye-auth-subtitle">
              {t.subtitle}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="aye-mode-tabs">
            <button
              type="button"
              className={`aye-mode-tab font-mono ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => { setAuthMode('login'); setAuthError(''); setIsAccountNotFound(false); }}
            >
              {t.loginTab}
            </button>
            <button
              type="button"
              className={`aye-mode-tab font-mono ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => { setAuthMode('register'); setAuthError(''); setIsAccountNotFound(false); }}
            >
              {t.registerTab}
            </button>
          </div>

          {/* Social OAuth Buttons */}
          <div className="aye-social-grid">
            <button
              type="button"
              onClick={() => setAuthError(lang === 'es' ? 'Iniciando autenticación con Apple...' : 'Starting Apple authentication...')}
              className="aye-social-btn apple-btn"
            >
              <Icons.Apple />
              <span>{t.appleBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => setAuthError(lang === 'es' ? 'Iniciando autenticación con Google...' : 'Starting Google authentication...')}
              className="aye-social-btn google-btn"
            >
              <Icons.Google />
              <span>{t.googleBtn}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="aye-auth-divider">
            <span className="aye-divider-line" />
            <span className="aye-divider-text font-mono">{t.divider}</span>
            <span className="aye-divider-line" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="aye-auth-form">
            {authMode === 'register' && (
              <div className="aye-input-group">
                <label className="aye-input-label font-mono">NOMBRE COMPLETO</label>
                <input
                  type="text"
                  placeholder={t.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="aye-input"
                  required
                />
              </div>
            )}

            <div className="aye-input-group">
              <label className="aye-input-label font-mono">CORREO ELECTRÓNICO</label>
              <input
                type="email"
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="aye-input"
                autoComplete="email"
                required
              />
            </div>

            <div className="aye-input-group">
              <div className="aye-input-header">
                <label className="aye-input-label font-mono">CONTRASEÑA</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="aye-input-toggle font-mono"
                >
                  {showPassword ? t.hidePass : t.showPass}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="aye-input"
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </div>

            {/* Remember Me */}
            <div className="aye-form-extras">
              <label className="aye-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(e) => setRememberEmail(e.target.checked)}
                  className="aye-checkbox"
                />
                <span className="aye-checkbox-text">{t.rememberMe}</span>
              </label>
            </div>

            {/* Error / Not Found Alert */}
            {authError && (
              <div className="aye-alert-box">
                <Icons.Alert />
                <span>{authError}</span>
              </div>
            )}

            {isAccountNotFound && (
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setAuthError(''); setIsAccountNotFound(false); }}
                className="aye-register-hint font-mono"
              >
                {t.accountNotFound}
              </button>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="aye-submit-btn font-mono"
            >
              {isLoading ? (
                <div className="aye-spinner" />
              ) : (
                <span>{authMode === 'login' ? t.submitLogin : t.submitRegister}</span>
              )}
            </button>
          </form>

          {/* Card Colophon */}
          <footer className="aye-card-footer">
            <p className="aye-terms-text">{t.footerTerms}</p>
            <p className="aye-credit-text font-mono">{t.atelierCredit}</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
