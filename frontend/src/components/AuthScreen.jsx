import React, { useState, useEffect, useRef } from 'react';
import './AuthScreen.css';
import InteractiveDots from './InteractiveDots';
import AyeLogo from './AyeLogo';
import { trackLoginSuccess } from '../services/analytics';

// Cloudflare Turnstile Key
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAEn3YN77Mt7jKxas';

const GOOGLE_CLIENT_ID = "627799707976-gt9uudejrtd5d4b7pubkso0ev35j2rhr.apps.googleusercontent.com";
const APPLE_CLIENT_ID = "com.ayeapps.auth";

const defaultAuthUrl =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname === '[::1]')
    ? 'http://localhost:8000'
    : 'https://api-auth.ayeapps.com';

export default function AuthScreen({
  authApiUrl = defaultAuthUrl,
  currentLang = 'es',
  onLangChange,
  onLoginSuccess,
  onBack
}) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [lang, setLang] = useState(() => currentLang || localStorage.getItem('aye_lang') || localStorage.getItem('preferred_lang') || 'es');
  const [isDark, setIsDark] = useState(true);
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    if (currentLang && currentLang !== lang) {
      setLang(currentLang);
    }
  }, [currentLang, lang]);

  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAccountNotFound, setIsAccountNotFound] = useState(false);

  // Cloudflare Turnstile state & ref
  const turnstileContainerRef = useRef(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileWidgetId, setTurnstileWidgetId] = useState(null);

  // Initialize and re-render Cloudflare Turnstile
  useEffect(() => {
    let mounted = true;
    let widgetId = null;

    const renderWidget = () => {
      if (!mounted || !turnstileContainerRef.current || !window.turnstile) return;
      turnstileContainerRef.current.innerHTML = '';
      try {
        widgetId = window.turnstile.render(turnstileContainerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: isDark ? 'dark' : 'light',
          size: 'normal',
          callback: (token) => {
            if (mounted) {
              setTurnstileToken(token);
              setAuthError('');
            }
          },
          'expired-callback': () => {
            if (mounted) setTurnstileToken('');
          },
          'error-callback': () => {
            if (mounted) setTurnstileToken('');
          }
        });
        if (mounted) setTurnstileWidgetId(widgetId);
      } catch {
        // Handled if widget cannot mount
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          renderWidget();
        }
      }, 250);
      const timeout = setTimeout(() => clearInterval(interval), 7000);
      return () => {
        mounted = false;
        clearInterval(interval);
        clearTimeout(timeout);
        if (widgetId && window.turnstile) {
          try { window.turnstile.remove(widgetId); } catch {}
        }
      };
    }

    return () => {
      mounted = false;
      if (widgetId && window.turnstile) {
        try { window.turnstile.remove(widgetId); } catch {}
      }
    };
  }, [isDark, authMode]);

  // Check server health on Central Auth API
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      setServerStatus('checking');
      try {
        const res = await fetch(`${authApiUrl}/health`);
        if (res.ok && mounted) setServerStatus('online');
        else if (mounted) setServerStatus('offline');
      } catch {
        if (mounted) setServerStatus('offline');
      }
    };
    check();
    return () => { mounted = false; };
  }, [authApiUrl]);

  // Load remembered preferences
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('aye_remembered_email');
      if (savedEmail) setAuthEmail(savedEmail);
      const savedLang = localStorage.getItem('preferred_lang') || localStorage.getItem('aye_lang');
      if (savedLang) setLang(savedLang);
      const savedTheme = localStorage.getItem('theme') || localStorage.getItem('aye_theme');
      if (savedTheme) setIsDark(savedTheme === 'dark');
    } catch {}
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === 'es' ? 'en' : 'es';
    setLang(nextLang);
    if (onLangChange) onLangChange(nextLang);
    try { 
      localStorage.setItem('preferred_lang', nextLang);
      localStorage.setItem('aye_lang', nextLang);
    } catch {}
  };

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    try { 
      localStorage.setItem('theme', nextDark ? 'dark' : 'light');
      localStorage.setItem('aye_theme', nextDark ? 'dark' : 'light');
    } catch {}
  };

  const handleAuth = async (e) => {
    if (e) e.preventDefault();
    const trimmedEmail = authEmail.trim();
    const trimmedPassword = authPassword.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setIsAccountNotFound(false);
      setAuthError(lang === 'es' ? 'POR FAVOR INGRESA CORREO Y CONTRASEÑA' : 'PLEASE ENTER EMAIL AND PASSWORD');
      return;
    }

    if (authMode === 'register' && trimmedPassword.length < 8) {
      setIsAccountNotFound(false);
      setAuthError(lang === 'es' ? 'LA CONTRASEÑA DEBE TENER AL MENOS 8 CARACTERES' : 'PASSWORD MUST BE AT LEAST 8 CHARACTERS');
      return;
    }

    setIsAccountNotFound(false);
    setAuthError('');
    setIsLoading(true);

    try {
      const endpoint = authMode === 'register' ? '/api/v1/auth/register' : '/api/v1/auth/login';
      const payload = authMode === 'register'
        ? { name: authName.trim() || 'USUARIO AYE', email: trimmedEmail, password: trimmedPassword, app_client: 'video_downloader', turnstile_token: turnstileToken || undefined }
        : { email: trimmedEmail, password: trimmedPassword, app_client: 'video_downloader', turnstile_token: turnstileToken || undefined };

      const res = await fetch(`${authApiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        const errorDetail = data.detail || data.error || (lang === 'es' ? 'CREDENCIALES INCORRECTAS' : 'INVALID CREDENTIALS');
        if (authMode === 'login' && (res.status === 404 || errorDetail === 'ACCOUNT_NOT_FOUND' || errorDetail.toLowerCase().includes('not found') || errorDetail.toLowerCase().includes('no existe'))) {
          setIsAccountNotFound(true);
        }
        throw new Error(errorDetail === 'ACCOUNT_NOT_FOUND' ? (lang === 'es' ? 'LA CUENTA NO EXISTE' : 'ACCOUNT NOT FOUND') : errorDetail);
      }

      localStorage.setItem('aye_remembered_email', trimmedEmail);
      trackLoginSuccess('email');

      if (onLoginSuccess) {
        onLoginSuccess(data, trimmedEmail);
      }
    } catch (err) {
      setAuthError(err.message.toUpperCase());
      if (turnstileWidgetId && window.turnstile) {
        try { window.turnstile.reset(turnstileWidgetId); } catch {}
      }
      setTurnstileToken('');
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth Login Trigger via Popup Window (No ambient One Tap notification)
  const handleGoogleLogin = () => {
    if (window.google?.accounts?.oauth2) {
      setAuthError('');
      setIsLoading(true);
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setIsLoading(false);
              if (tokenResponse.error !== 'popup_closed_by_user') {
                setAuthError((tokenResponse.error_description || tokenResponse.error).toUpperCase());
              }
              return;
            }
            if (tokenResponse.access_token) {
              try {
                const res = await fetch(`${authApiUrl}/api/v1/auth/oauth/google`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ access_token: tokenResponse.access_token, app_client: 'video_downloader' }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'Error autenticando con Google');
                trackLoginSuccess('google');
                if (onLoginSuccess) {
                  onLoginSuccess(data, data.user?.email || 'google_user@ayeapps.com');
                }
              } catch (err) {
                setAuthError(err.message.toUpperCase());
              } finally {
                setIsLoading(false);
              }
            }
          },
        });
        client.requestAccessToken({ prompt: 'select_account' });
      } catch (err) {
        setIsLoading(false);
        setAuthError(err.message.toUpperCase());
      }
    } else {
      setAuthError(lang === 'es' ? 'SDK DE GOOGLE CARGANDO... REINTENTA EN 2 SEGUNDOS' : 'GOOGLE SDK LOADING... RETRY IN 2 SECONDS');
    }
  };

  // Apple OAuth Login
  const handleAppleLogin = async () => {
    if (window.AppleID?.auth) {
      try {
        setIsLoading(true);
        setAuthError('');
        const origin = window.location.origin;
        window.AppleID.auth.init({
          clientId: APPLE_CLIENT_ID,
          scope: 'name email',
          redirectURI: origin,
          usePopup: true,
        });
        const response = await window.AppleID.auth.signIn();
        if (response?.authorization?.id_token) {
          const res = await fetch(`${authApiUrl}/api/v1/auth/oauth/apple`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identity_token: response.authorization.id_token,
              email: response.user?.email,
              name: response.user?.name ? `${response.user.name.firstName || ''} ${response.user.name.lastName || ''}`.trim() : undefined,
              app_client: 'video_downloader',
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || 'Error autenticando con Apple');
          trackLoginSuccess('apple');
          if (onLoginSuccess) {
            onLoginSuccess(data, data.user?.email || 'apple_user@ayeapps.com');
          }
        }
      } catch (err) {
        if (err.error !== 'popup_closed_by_user') {
          setAuthError((err.message || err.error || 'Error autenticando con Apple').toUpperCase());
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setAuthError(lang === 'es' ? 'SDK DE APPLE CARGANDO... REINTENTA EN 2 SEGUNDOS' : 'APPLE SDK LOADING... RETRY IN 2 SECONDS');
    }
  };

  const t = {
    es: {
      title: 'AYE-VIDEO',
      serverOnline: 'SERVIDOR: EN LÍNEA',
      serverOffline: 'SERVIDOR: DESCONECTADO',
      serverChecking: 'VERIFICANDO SERVIDOR...',
      login: 'INICIAR SESIÓN',
      register: 'REGISTRO',
      name: 'NOMBRE',
      email: 'CORREO ELECTRÓNICO',
      password: 'CONTRASEÑA',
      initSession: 'INICIAR SESIÓN',
      createAccount: 'CREAR CUENTA',
      processing: 'PROCESANDO...',
      accountNotFoundTitle: 'LA CUENTA NO EXISTE',
      accountNotFoundDesc: 'No existe ninguna cuenta registrada con este correo en el ecosistema.',
      suggestRegisterBtn: 'CREAR CUENTA CON ESTE CORREO ➔',
      continueWithGoogle: 'CONTINUAR CON GOOGLE',
      continueWithApple: 'CONTINUAR CON APPLE',
      orContinueWithEmail: '── O CON CORREO ──',
    },
    en: {
      title: 'AYE-VIDEO',
      serverOnline: 'SERVER: ONLINE',
      serverOffline: 'SERVER: OFFLINE',
      serverChecking: 'CHECKING SERVER...',
      login: 'SIGN IN',
      register: 'REGISTER',
      name: 'NAME',
      email: 'EMAIL ADDRESS',
      password: 'PASSWORD',
      initSession: 'INITIALIZE SESSION',
      createAccount: 'CREATE ACCOUNT',
      processing: 'PROCESSING...',
      accountNotFoundTitle: 'ACCOUNT NOT FOUND',
      accountNotFoundDesc: 'No account registered with this email address in the ecosystem.',
      suggestRegisterBtn: 'CREATE ACCOUNT WITH THIS EMAIL ➔',
      continueWithGoogle: 'CONTINUE WITH GOOGLE',
      continueWithApple: 'CONTINUE WITH APPLE',
      orContinueWithEmail: '── OR WITH EMAIL ──',
    }
  }[lang];

  return (
    <div className={`ayetasks-auth-root ${isDark ? 'dark' : 'light'}`}>
      {/* Reactive Interactive Dot Matrix Background (From AyeAppsWeb) */}
      <InteractiveDots />

      {/* Top Left Controls: Back to Landing on Web */}
      {onBack && (
        <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 100 }}>
          <button
            onClick={onBack}
            className="ayetasks-control-btn"
            style={{
              padding: '0 14px',
              cursor: 'pointer',
              fontWeight: '700',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              letterSpacing: '0.8px',
            }}
          >
            ← {lang === 'es' ? 'INICIO' : 'HOME'}
          </button>
        </div>
      )}

      {/* Top Right Controls (Exact clone of AyeTasks) */}
      <div className="ayetasks-top-controls">
        <button
          onClick={toggleLanguage}
          className="ayetasks-control-btn ayetasks-lang-btn"
          title="Toggle Language"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FE9D01" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span className="ayetasks-lang-text font-mono">
            {lang.toUpperCase()}
          </span>
        </button>

        <button
          onClick={toggleTheme}
          className="ayetasks-control-btn ayetasks-theme-btn"
          title="Toggle Theme"
        >
          {isDark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FE9D01" strokeWidth="2.5">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* Centered Frame with Animated Dot Grid */}
      <div className="ayetasks-centered-view">
        <div className="ayetasks-tech-frame">
          {/* Tech Badge / Live Server Status (Exact pinned position) */}
          <div className={`ayetasks-tech-badge ${serverStatus}`}>
            <div className={`ayetasks-status-dot ${serverStatus}`} />
            <span className="ayetasks-tech-badge-text font-mono">
              {serverStatus === 'online'
                ? t.serverOnline
                : serverStatus === 'checking'
                ? t.serverChecking
                : t.serverOffline}
            </span>
          </div>

          <div className="ayetasks-tech-frame-content">
            {/* Title Section */}
            <div className="ayetasks-title-section">
              <div className="ayetasks-auth-logo-box">
                <AyeLogo width={56} color="#FE9D01" />
              </div>
              <h1 className="ayetasks-hero-title">
                {t.title}
              </h1>
            </div>

            {/* Segmented Mode Selector */}
            <div className="ayetasks-segmented-selector">
              <button
                type="button"
                className={`ayetasks-tab-button ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => { setAuthMode('login'); setIsAccountNotFound(false); setAuthError(''); }}
              >
                <span className="ayetasks-tab-button-text">{t.login}</span>
              </button>

              <button
                type="button"
                className={`ayetasks-tab-button ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => { setAuthMode('register'); setIsAccountNotFound(false); setAuthError(''); }}
              >
                <span className="ayetasks-tab-button-text">{t.register}</span>
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleAuth} className="ayetasks-form-container">
              {authMode === 'register' && (
                <input
                  type="text"
                  placeholder={t.name}
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="ayetasks-geometric-input font-mono"
                  autoComplete="name"
                  required
                />
              )}

              <input
                type="email"
                placeholder={t.email}
                value={authEmail}
                onChange={(e) => {
                  setAuthEmail(e.target.value);
                  if (isAccountNotFound) setIsAccountNotFound(false);
                }}
                className="ayetasks-geometric-input font-mono"
                autoCapitalize="none"
                autoComplete="email"
                required
              />

              <input
                type="password"
                placeholder={t.password}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="ayetasks-geometric-input font-mono"
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                required
              />

              {/* Suggest Register Box if Account Not Found */}
              {isAccountNotFound ? (
                <div className="ayetasks-suggest-register-box">
                  <div className="ayetasks-suggest-header-row font-mono">
                    <span className="ayetasks-suggest-title">{t.accountNotFoundTitle}</span>
                  </div>
                  <p className="ayetasks-suggest-desc font-mono">{t.accountNotFoundDesc}</p>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setIsAccountNotFound(false); setAuthError(''); }}
                    className="ayetasks-suggest-btn font-mono"
                  >
                    {t.suggestRegisterBtn}
                  </button>
                </div>
              ) : authError ? (
                <div className="ayetasks-error-alert-box font-mono">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{authError}</span>
                </div>
              ) : null}

              {/* Turnstile Bot Verification */}
              <div className="ayetasks-turnstile-container">
                <div ref={turnstileContainerRef} id="turnstile-widget" />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="ayetasks-hero-btn"
              >
                {isLoading ? (
                  <span>{t.processing}</span>
                ) : (
                  <span>{authMode === 'login' ? t.initSession : t.createAccount}</span>
                )}
              </button>

              {/* Divider */}
              <div className="ayetasks-divider-row">
                <div className="ayetasks-divider-line" />
                <span className="ayetasks-divider-text font-mono">{t.orContinueWithEmail}</span>
                <div className="ayetasks-divider-line" />
              </div>

              {/* Social Login Buttons */}
              <div className="ayetasks-social-container">
                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="ayetasks-social-btn google-btn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{t.continueWithGoogle}</span>
                </button>

                {/* Apple Sign In */}
                <button
                  type="button"
                  onClick={handleAppleLogin}
                  disabled={isLoading}
                  className="ayetasks-social-btn apple-btn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.66-.99 1.72-.85 2.76 1.01.08 2.03-.51 2.56-1.26z" />
                  </svg>
                  <span>{t.continueWithApple}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
