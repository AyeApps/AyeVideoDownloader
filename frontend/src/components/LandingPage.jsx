import React, { useState, useEffect } from 'react';
import './LandingPage.css';
import InteractiveDots from './InteractiveDots';
import AyeLogo from './AyeLogo';
import {
  trackPageView,
  trackAuthOpened,
  trackFaqOpened,
  trackPreferenceChange
} from '../services/analytics';

export default function LandingPage({
  currentLang = 'es',
  onLangChange,
  theme = 'dark',
  onToggleTheme,
  onStartAuth
}) {
  const [activeFaq, setActiveFaq] = useState(null);
  const [demoUrl, setDemoUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [demoSelectedFormat, setDemoSelectedFormat] = useState('4k');

  const isEs = currentLang === 'es';

  useEffect(() => {
    trackPageView('/', isEs ? 'AyeApps Video Downloader | Inicio' : 'AyeApps Video Downloader | Home');
  }, [isEs]);

  const t = {
    title: isEs 
      ? 'Descarga videos en 4K y extrae audio de alta fidelidad sin límites ni pérdidas.'
      : 'Download 4K videos and extract high-fidelity audio with zero loss or limits.',
    subtitle: isEs
      ? 'Descarga tus videos y audios favoritos de internet en la más alta calidad posible, al instante, directo a tu dispositivo y sin publicidad molesta.'
      : 'Download your favorite videos and audio from the internet in the highest possible quality, instantly, straight to your device and with zero annoying ads.',
    ctaPrimary: isEs ? 'PROBAR DESCARGADOR' : 'TRY DOWNLOADER',
    ctaSecondary: isEs ? 'VER FORMATOS' : 'VIEW FORMATS',
    navFeatures: isEs ? 'Ventajas' : 'Features',
    navSpecs: isEs ? 'Formatos' : 'Formats',
    navPlatforms: isEs ? 'Plataformas' : 'Platforms',
    navFaq: isEs ? 'Preguntas Frecuentes' : 'FAQ',
    loginBtn: isEs ? 'INICIAR SESIÓN' : 'SIGN IN',
    engineStatus: isEs ? 'Listo para descargar' : 'Ready to download',
    demoInputPlaceholder: isEs ? 'Pega el enlace de video o audio aquí...' : 'Paste video or audio link here...',
    demoInspectBtn: isEs ? 'BUSCAR VIDEO' : 'SEARCH VIDEO',
    detectedStreams: isEs ? 'Formatos listos para descargar' : 'Formats ready to download',
    resultsMeta: isEs ? 'Máxima calidad disponible' : 'Highest quality available',
    videoStreams: isEs ? 'Video' : 'Video',
    audioStreams: isEs ? 'Audio' : 'Audio',
    demoActionPrompt: isEs ? 'Inicia sesión para descargar sin límites' : 'Sign in to download without limits',
    demoActionBtn: isEs ? 'DESCARGAR AHORA' : 'DOWNLOAD NOW',
    platformsHeading: isEs ? 'COMPATIBILIDAD TOTAL' : 'FULL COMPATIBILITY',
    platformsSub: isEs ? 'Descarga con un solo clic desde tus redes y plataformas favoritas.' : 'Download with one click from your favorite networks and platforms.',
    featuresHeading: isEs ? 'VENTAJAS PRINCIPALES' : 'KEY ADVANTAGES',
    featuresTitle: isEs ? 'Rápido, limpio y sin complicaciones' : 'Fast, clean and effortless',
    f1Title: isEs ? 'Máxima Calidad de Imagen' : 'Maximum Visual Quality',
    f1Desc: isEs 
      ? 'Descarga tus videos en 4K, 1080p y 60 cuadros por segundo exactamente como fueron subidos, con colores vivos y nitidez total.'
      : 'Download your videos in 4K, 1080p, and 60fps exactly as uploaded, with vibrant colors and pristine sharpness.',
    f2Title: isEs ? 'Música y Audio Impecable' : 'Pristine Music & Audio',
    f2Desc: isEs
      ? 'Convierte cualquier video a MP3 en la más alta fidelidad (320 kbps) o WAV para disfrutar de tus canciones, podcasts y conferencias favoritas.'
      : 'Convert any video to MP3 in the highest fidelity (320 kbps) or WAV to enjoy your favorite music, podcasts, and speeches.',
    f3Title: isEs ? 'Descargas Ultrarrápidas' : 'Ultra-Fast Downloads',
    f3Desc: isEs
      ? 'Nuestro sistema procesa el video en la nube en segundos y te entrega el archivo listo para guardar a la velocidad máxima de tu conexión.'
      : 'Our system prepares the video in the cloud in seconds and delivers your file ready to save at full internet speed.',
    f4Title: isEs ? '100% Seguro y Libre de Anuncios' : '100% Safe & Ad-Free',
    f4Desc: isEs
      ? 'Olvídate de botones falsos de descarga, publicidad molesta y virus. Una experiencia limpia, privada y directa respaldada por AyeApps.'
      : 'Forget fake download buttons, scam ads, and popups. A clean, private, and direct experience powered by AyeApps.',
    specsHeading: isEs ? 'TABLA DE FORMATOS Y CALIDADES' : 'FORMATS & QUALITY MATRIX',
    stepsHeading: isEs ? '¿CÓMO FUNCIONA?' : 'HOW IT WORKS',
    step1Title: isEs ? '1. Copia y Pega' : '1. Copy & Paste',
    step1Desc: isEs ? 'Pega el enlace de YouTube, TikTok, Instagram o cualquier otra plataforma.' : 'Paste the link from YouTube, TikTok, Instagram, or any other platform.',
    step2Title: isEs ? '2. Elige la Calidad' : '2. Choose Quality',
    step2Desc: isEs ? 'Selecciona entre video en 4K/HD o audio en MP3 de alta fidelidad.' : 'Select between 4K/HD video or high-fidelity MP3 audio.',
    step3Title: isEs ? '3. Guarda tu Archivo' : '3. Save Your File',
    step3Desc: isEs ? 'El archivo se descarga directo a tu computadora, teléfono o tablet.' : 'The file downloads straight to your computer, phone, or tablet.',
    faqHeading: isEs ? 'PREGUNTAS FRECUENTES' : 'FREQUENTLY ASKED QUESTIONS',
    ctaBannerTitle: isEs ? 'Empieza a descargar tus videos ahora' : 'Start downloading your videos now',
    ctaBannerSub: isEs ? 'Crea tu cuenta gratuita en segundos y disfruta de descargas ilimitadas.' : 'Create your free account in seconds and enjoy unlimited downloads.',
    ctaBannerBtn: isEs ? 'COMENZAR GRATIS' : 'START FOR FREE'
  };

  const platforms = [
    { name: 'YouTube', detail: '4K / 8K / Shorts / 60fps / HDR', badge: 'ULTRA HD' },
    { name: 'TikTok', detail: 'Sin marcas de agua / HD / Audio', badge: 'NO WATERMARK' },
    { name: 'Instagram', detail: 'Reels / Historias / Carruseles / Audio', badge: 'REELS & POSTS' },
    { name: 'X (Twitter)', detail: 'Máxima tasa de bits / Clips / GIFs', badge: 'HIGH BITRATE' },
    { name: 'Facebook', detail: 'Videos HD / Reels / Transmisiones', badge: 'FULL HD' },
    { name: 'Twitch & Vimeo', detail: 'Clips / VODs / Cine digital', badge: 'MASTER QUALITY' },
    { name: 'Soundcloud', detail: 'Pistas originales / Sets / Podcasts', badge: 'HQ AUDIO' },
    { name: 'Bandcamp & Reddit', detail: 'Música independiente / Clips comunitarios', badge: 'DIRECT' }
  ];

  const specs = [
    { format: 'MP4 2160p (4K)', resolution: '3840 x 2160', codec: 'AV1 / VP9', bitrate: 'Hasta 45 Mbps', hdr: isEs ? 'Soporte HDR10 60fps' : 'HDR10 60fps Support' },
    { format: 'MP4 1440p (2K)', resolution: '2560 x 1440', codec: 'VP9 / H.264', bitrate: 'Hasta 24 Mbps', hdr: isEs ? 'Alto Rango Dinámico' : 'High Dynamic Range' },
    { format: 'MP4 1080p (FHD)', resolution: '1920 x 1080', codec: 'H.264 / AVC', bitrate: 'Hasta 12 Mbps', hdr: isEs ? 'Estándar 60fps' : 'Standard 60fps' },
    { format: 'MP3 Master Audio', resolution: isEs ? 'Audio Estéreo' : 'Stereo Audio', codec: 'LAME MP3 (CBR)', bitrate: '320 kbps', hdr: isEs ? 'Pistas Remasterizadas' : 'Remastered Tracks' },
    { format: 'WAV Lossless Audio', resolution: isEs ? 'Sin compresión' : 'Uncompressed', codec: 'PCM 24-bit', bitrate: '1411 kbps', hdr: isEs ? 'Fidelidad Estudio' : 'Studio Fidelity' },
    { format: 'M4A / AAC Audio', resolution: isEs ? 'Audio Nativo' : 'Native Audio', codec: 'AAC-LC', bitrate: '256 kbps', hdr: isEs ? 'Optimizado Apple' : 'Apple Optimized' }
  ];

  const faqs = [
    {
      q: isEs ? '¿Por qué AyeVideoDownloader requiere inicio de sesión?' : 'Why does AyeVideoDownloader require a sign-in?',
      a: isEs 
        ? 'A diferencia de los sitios web llenos de publicidad basura y estafas, AyeVideoDownloader es un servicio de alta precisión de la suite AyeApps. El inicio de sesión nos permite proteger el ancho de banda del servidor contra abusos de bots, ofrecerte un historial personal de descargas y garantizar descargas a velocidad máxima.'
        : 'Unlike scam-filled download websites with junk advertising, AyeVideoDownloader is a precision service of the AyeApps suite. Signing in allows us to protect server bandwidth against bot abuse, keep your personal download history synced, and guarantee maximum download speeds.'
    },
    {
      q: isEs ? '¿Puedo descargar videos en 4K y 60 cuadros por segundo?' : 'Can I download videos in 4K and 60 frames per second?',
      a: isEs
        ? 'Sí, totalmente. El motor analiza las pistas de video más altas disponibles en el servidor original y une automáticamente la pista de video de máxima resolución con la pista de audio de mejor calidad.'
        : 'Yes, absolutely. The engine parses the highest available video streams on the source server and automatically multiplexes the maximum resolution video track with the best quality audio track.'
    },
    {
      q: isEs ? '¿Cómo descargo solo el audio en MP3 o WAV?' : 'How do I download only the audio in MP3 or WAV?',
      a: isEs
        ? 'Una vez que ingresas la URL en la aplicación, puedes alternar la pestaña de "Video" a "Audio". Puedes seleccionar MP3 a 320 kbps para máxima compatibilidad con reproductores de música, o WAV sin pérdida de compresión para producción musical y edición.'
        : 'Once you paste your URL in the application, toggle between the "Video" and "Audio" views. You can select 320 kbps MP3 for universal device compatibility, or lossless WAV for music production and video editing.'
    },
    {
      q: isEs ? '¿Tiene algún costo o suscripción?' : 'Is there any cost or subscription?',
      a: isEs
        ? 'Por el momento, por lanzamiento es 100% gratis. No necesitas pagar nada ni ingresar tarjetas de crédito; lo único que debes hacer por ahora es registrarte con tu cuenta para acceder a descargas ilimitadas.'
        : 'Currently, for our official launch, it is 100% free. No payment or credit card required; all you need to do right now is register your account to access unlimited downloads.'
    },
    {
      q: isEs ? '¿Funciona en celulares y cualquier dispositivo?' : 'Does it work on phones and all devices?',
      a: isEs
        ? 'Sí, funciona en cualquier dispositivo: iPhone, Android, tablets, Mac o PC con Windows. Solo entras desde tu navegador habitual y descargas directamente sin tener que instalar aplicaciones raras ni programas extras.'
        : 'Yes, it works on any device: iPhone, Android, tablets, Mac, or Windows PC. Simply open it in your regular browser and download directly without installing any suspicious apps or extra software.'
    }
  ];

  return (
    <div className={`aye-landing-container ${theme === 'dark' ? 'dark' : 'light'}`}>
      {/* Background Interactive Dot Matrix */}
      <InteractiveDots />

      {/* Navigation Header */}
      <header className="aye-landing-nav">
        <div className="nav-content">
          <div className="nav-brand">
            <AyeLogo width={40} color="#FE9D01" />
            <div className="brand-text">
              <span className="brand-title">AyeApps</span>
              <span className="brand-sub">Video Downloader</span>
            </div>
          </div>

          <nav className="nav-links" aria-label="Navegación principal">
            <a href="#ventajas">{t.navFeatures}</a>
            <a href="#formatos">{t.navSpecs}</a>
            <a href="#plataformas">{t.navPlatforms}</a>
            <a href="#faq">{t.navFaq}</a>
          </nav>

          <div className="nav-actions">
            {onToggleTheme && (
              <button
                className="theme-toggle-btn"
                onClick={() => {
                  trackPreferenceChange('theme', theme === 'dark' ? 'light' : 'dark');
                  onToggleTheme();
                }}
                aria-label="Toggle theme"
                title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            )}

            {onLangChange && (
              <button
                className="lang-toggle-btn"
                onClick={() => {
                  const nextLang = isEs ? 'en' : 'es';
                  trackPreferenceChange('language', nextLang);
                  onLangChange(nextLang);
                }}
                title="Cambiar idioma"
              >
                {isEs ? 'EN' : 'ES'}
              </button>
            )}

            <button className="nav-auth-btn bracket-corners" onClick={() => { trackAuthOpened('nav_btn'); onStartAuth(); }}>
              {t.loginBtn}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="aye-landing-main">
        {/* HERO SECTION */}
        <section className="hero-section">
          <h1 className="hero-title">
            {t.title}
          </h1>

          <p className="hero-subtitle">
            {t.subtitle}
          </p>

          <div className="hero-cta-group">
            <button className="primary-cta-btn bracket-corners" onClick={() => { trackAuthOpened('hero_cta'); onStartAuth(); }}>
              <span>{t.ctaPrimary}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="square"/>
              </svg>
            </button>

            <a href="#formatos" className="secondary-cta-btn">
              {t.ctaSecondary}
            </a>
          </div>

          {/* CONSOLE PREVIEW (Clean & Friendly) */}
          <div className="hero-console bracket-corners">
            <div className="console-header">
              <div className="console-dots">
                <span className="dot dot-red"></span>
                <span className="dot dot-amber"></span>
                <span className="dot dot-green"></span>
              </div>
              <div className="console-telemetry">
                <span className="telemetry-live-pulse"></span>
                <span className="telemetry-text">{t.engineStatus}</span>
              </div>
            </div>

            <div className="console-body">
              <div className="console-input-bar">
                <div className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="square"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="square"/>
                  </svg>
                </div>
                <input
                  type="text"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder={t.demoInputPlaceholder}
                  className="console-input"
                  readOnly
                />
                <button className="console-inspect-btn" onClick={onStartAuth}>
                  {t.demoInspectBtn}
                </button>
              </div>

              {/* STREAM SELECTION CHIPS */}
              <div className="console-stream-results">
                <div className="stream-results-header">
                  <span className="results-label">{t.detectedStreams}</span>
                  <span className="results-meta">{t.resultsMeta}</span>
                </div>

                <div className="stream-chips-row">
                  <button
                    className={`stream-chip ${demoSelectedFormat === '4k' ? 'active' : ''}`}
                    onClick={() => setDemoSelectedFormat('4k')}
                  >
                    <span className="chip-quality">4K 2160p</span>
                    <span className="chip-spec">60 FPS · Ultra HD</span>
                  </button>

                  <button
                    className={`stream-chip ${demoSelectedFormat === '1080p' ? 'active' : ''}`}
                    onClick={() => setDemoSelectedFormat('1080p')}
                  >
                    <span className="chip-quality">1080p FHD</span>
                    <span className="chip-spec">60 FPS · Full HD</span>
                  </button>

                  <button
                    className={`stream-chip ${demoSelectedFormat === 'mp3' ? 'active' : ''}`}
                    onClick={() => setDemoSelectedFormat('mp3')}
                  >
                    <span className="chip-quality">MP3 AUDIO</span>
                    <span className="chip-spec">320 kbps · Alta Calidad</span>
                  </button>

                  <button
                    className={`stream-chip ${demoSelectedFormat === 'wav' ? 'active' : ''}`}
                    onClick={() => setDemoSelectedFormat('wav')}
                  >
                    <span className="chip-quality">WAV MASTER</span>
                    <span className="chip-spec">Audio Sin Pérdida</span>
                  </button>
                </div>

                <div className="console-cta-footer">
                  <span className="footer-prompt">{t.demoActionPrompt}</span>
                  <button className="footer-auth-action bracket-corners" onClick={() => { trackAuthOpened('console_cta'); onStartAuth(); }}>
                    {t.demoActionBtn} →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SUPPORTED PLATFORMS */}
        <section id="plataformas" className="platforms-section">
          <div className="section-header">
            <div className="geo-badge">{t.platformsHeading}</div>
            <h2 className="section-title">
              {isEs ? 'Compatible con todo el video moderno' : 'Compatible across the modern video web'}
            </h2>
            <p className="section-sub">{t.platformsSub}</p>
          </div>

          <div className="platforms-grid">
            {platforms.map((p, idx) => (
              <div key={idx} className="platform-card bracket-corners">
                <div className="platform-top">
                  <span className="platform-name">{p.name}</span>
                  <span className="platform-badge">{p.badge}</span>
                </div>
                <p className="platform-detail">{p.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CORE FEATURES (Human & Friendly) */}
        <section id="ventajas" className="features-section">
          <div className="section-header">
            <div className="geo-badge">{t.featuresHeading}</div>
            <h2 className="section-title">
              {t.featuresTitle}
            </h2>
          </div>

          <div className="features-grid">
            <div className="feature-card feature-primary bracket-corners">
              <div className="feature-number">01</div>
              <h3 className="feature-title">{t.f1Title}</h3>
              <p className="feature-desc">{t.f1Desc}</p>
              <div className="feature-spec-tags">
                <span>4K Ultra HD</span>
                <span>1080p FHD</span>
                <span>60 FPS</span>
                <span>Colores Vivos</span>
              </div>
            </div>

            <div className="feature-card bracket-corners">
              <div className="feature-number">02</div>
              <h3 className="feature-title">{t.f2Title}</h3>
              <p className="feature-desc">{t.f2Desc}</p>
              <div className="feature-spec-tags">
                <span>MP3 320 kbps</span>
                <span>WAV Master</span>
                <span>Audio Estéreo</span>
                <span>Sonido Limpio</span>
              </div>
            </div>

            <div className="feature-card bracket-corners">
              <div className="feature-number">03</div>
              <h3 className="feature-title">{t.f3Title}</h3>
              <p className="feature-desc">{t.f3Desc}</p>
              <div className="feature-spec-tags">
                <span>Sin Esperas</span>
                <span>Procesamiento Rápido</span>
                <span>Descarga Directa</span>
              </div>
            </div>

            <div className="feature-card bracket-corners">
              <div className="feature-number">04</div>
              <h3 className="feature-title">{t.f4Title}</h3>
              <p className="feature-desc">{t.f4Desc}</p>
              <div className="feature-spec-tags">
                <span>100% Seguro</span>
                <span>Cero Anuncios</span>
                <span>Sin Popups</span>
                <span>Cuenta AyeApps</span>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW (HOW IT WORKS) */}
        <section className="workflow-section">
          <div className="section-header">
            <div className="geo-badge">{t.stepsHeading}</div>
            <h2 className="section-title">
              {isEs ? 'Descarga en tres pasos sencillos' : 'Download in three easy steps'}
            </h2>
          </div>

          <div className="steps-row">
            <div className="step-block bracket-corners">
              <span className="step-index">01</span>
              <h3 className="step-heading">{t.step1Title}</h3>
              <p className="step-text">{t.step1Desc}</p>
            </div>

            <div className="step-divider" aria-hidden="true">→</div>

            <div className="step-block bracket-corners">
              <span className="step-index">02</span>
              <h3 className="step-heading">{t.step2Title}</h3>
              <p className="step-text">{t.step2Desc}</p>
            </div>

            <div className="step-divider" aria-hidden="true">→</div>

            <div className="step-block bracket-corners">
              <span className="step-index">03</span>
              <h3 className="step-heading">{t.step3Title}</h3>
              <p className="step-text">{t.step3Desc}</p>
            </div>
          </div>
        </section>

        {/* FORMATS & SPECS TABLE */}
        <section id="formatos" className="specs-section">
          <div className="section-header">
            <div className="geo-badge">{t.specsHeading}</div>
            <h2 className="section-title">
              {isEs ? 'Resoluciones y formatos soportados' : 'Supported resolutions and formats'}
            </h2>
          </div>

          <div className="specs-table-wrapper bracket-corners">
            <table className="specs-table">
              <thead>
                <tr>
                  <th>{isEs ? 'FORMATO' : 'FORMAT'}</th>
                  <th>{isEs ? 'RESOLUCIÓN' : 'RESOLUTION'}</th>
                  <th>{isEs ? 'TIPO' : 'TYPE'}</th>
                  <th>{isEs ? 'CALIDAD' : 'QUALITY'}</th>
                  <th>{isEs ? 'ATRIBUTO' : 'ATTRIBUTE'}</th>
                </tr>
              </thead>
              <tbody>
                {specs.map((row, idx) => (
                  <tr key={idx}>
                    <td className="font-mono font-bold text-amber">{row.format}</td>
                    <td className="font-mono">{row.resolution}</td>
                    <td>{row.codec}</td>
                    <td className="font-mono">{row.bitrate}</td>
                    <td><span className="spec-pill">{row.hdr}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQS SECTION (Rich SEO Accordion) */}
        <section id="faq" className="faq-section">
          <div className="section-header">
            <div className="geo-badge">{t.faqHeading}</div>
            <h2 className="section-title">
              {isEs ? 'Todo lo que necesitas saber' : 'Everything you need to know'}
            </h2>
          </div>

          <div className="faq-list">
            {faqs.map((item, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className={`faq-item bracket-corners ${isOpen ? 'open' : ''}`}
                  onClick={() => {
                    const next = isOpen ? null : idx;
                    setActiveFaq(next);
                    if (!isOpen) trackFaqOpened(item.q);
                  }}
                >
                  <div className="faq-question">
                    <h3>{item.q}</h3>
                    <span className="faq-toggle-icon">{isOpen ? '−' : '+'}</span>
                  </div>
                  {isOpen && (
                    <div className="faq-answer">
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION BANNER */}
        <section className="bottom-cta-section">
          <div className="bottom-cta-card bracket-corners">
            <div className="bottom-cta-content">
              <h2 className="bottom-cta-title">{t.ctaBannerTitle}</h2>
              <p className="bottom-cta-sub">{t.ctaBannerSub}</p>
              <button className="bottom-cta-btn bracket-corners" onClick={() => { trackAuthOpened('bottom_cta'); onStartAuth(); }}>
                {t.ctaBannerBtn}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="aye-landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <AyeLogo width={36} color="#FE9D01" />
            <div className="footer-brand-info">
              <span className="footer-title">AyeApps</span>
              <span className="footer-sub">Video Downloader</span>
            </div>
          </div>

          <div className="footer-links">
            <a href="https://ayeapps.com" target="_blank" rel="noopener noreferrer">AyeApps Suite</a>
            <a href="https://tasks.ayeapps.com" target="_blank" rel="noopener noreferrer">AyeTasks</a>
            <a href="https://accounts.ayeapps.com" target="_blank" rel="noopener noreferrer">AyeAuth</a>
            <a href="/llms.txt" target="_blank" rel="noopener noreferrer">llms.txt</a>
          </div>

          <div className="footer-copyright">
            <span>© {new Date().getFullYear()} AyeApps. Suite de aplicaciones y herramientas de alta velocidad.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
