import React, { useState, useEffect } from 'react';
import './LandingPage.css';
import InteractiveDots from './InteractiveDots';
import {
  trackPageView,
  trackAuthOpened,
  trackFaqOpened,
  trackPreferenceChange
} from '../services/analytics';

// Exact AyeLogo from AyeApps Atelier standards
const AyeLogo = ({ width = 42, color = '#FE9D01' }) => {
  const calculatedHeight = Math.round(width / 1.739);
  return (
    <svg
      width={width}
      height={calculatedHeight}
      viewBox="300 170 800 460"
      fill="none"
      style={{ display: 'block' }}
      aria-hidden="true"
    >
      <g fill={color}>
        <path d="M0 0 C15.18 0 30.36 0 46 0 C50.03 8.635 54.001 17.147 57.572 25.956 C58.745 28.846 59.933 31.73 61.121 34.615 C61.329 35.119 61.537 35.624 61.745 36.129 C65.781 45.938 69.913 55.707 74.04 65.477 C74.782 67.232 75.522 68.988 76.263 70.743 C77.275 73.143 78.288 75.541 79.302 77.94 C79.676 78.826 80.05 79.712 80.424 80.598 C82.884 86.428 85.41 92.226 88 98 C88 99.65 88 101.3 88 103 C87.776 103.354 87.551 103.708 87.32 104.072 C86.189 105.858 85.062 107.647 83.938 109.438 C83.832 109.606 83.726 109.775 83.616 109.949 C78.936 117.405 74.398 124.947 69.875 132.5 C69.832 132.571 69.832 132.571 69.616 132.932 C67.408 136.62 65.203 140.309 63 144 C60.314 140.887 58.739 137.477 57.159 133.709 C56.804 132.864 56.442 132.021 56.08 131.178 C55.375 129.529 54.676 127.879 53.979 126.227 C53.409 124.876 52.837 123.526 52.263 122.177 C52.18 121.983 52.098 121.79 52.013 121.59 C51.846 121.196 51.678 120.803 51.511 120.409 C49.504 115.692 47.512 110.968 45.523 106.243 C45.09 105.214 44.657 104.186 44.224 103.157 C42.046 97.988 39.875 92.816 37.712 87.641 C37.245 86.523 36.778 85.406 36.31 84.289 C31.692 73.262 27.286 62.161 23 51 C19.706 57.894 16.589 64.837 13.73 71.922 C13.661 72.094 13.591 72.266 13.52 72.444 C12.714 74.443 11.912 76.443 11.111 78.444 C9.564 82.312 8.003 86.174 6.442 90.036 C6.183 90.678 5.924 91.319 5.665 91.961 C1.754 101.645 -2.24 111.294 -6.25 120.938 C-6.424 121.357 -6.599 121.776 -6.773 122.195 C-7.122 123.036 -7.472 123.877 -7.822 124.717 C-8.622 126.642 -9.422 128.566 -10.222 130.491 C-10.492 131.141 -10.763 131.792 -11.034 132.442 C-13.881 139.29 -16.711 146.144 -19.534 153.002 C-20.192 154.6 -20.85 156.199 -21.508 157.797 C-21.834 158.589 -22.161 159.381 -22.487 160.173 C-22.703 160.698 -22.919 161.223 -23.136 161.748 C-24.403 164.826 -25.67 167.905 -26.934 170.984 C-27.725 172.91 -28.517 174.835 -29.311 176.759 C-29.769 177.871 -30.226 178.982 -30.681 180.094 C-31.102 181.122 -31.525 182.149 -31.95 183.176 C-32.101 183.543 -32.251 183.91 -32.401 184.278 C-33.763 187.621 -35.376 190.752 -37 194 C-51.85 194 -66.7 194 -82 194 C-78.561 182.537 -78.561 182.537 -76.672 178.359 C-76.448 177.851 -76.224 177.342 -76.002 176.833 C-75.516 175.726 -75.027 174.621 -74.535 173.516 C-73.25 170.629 -71.986 167.732 -70.721 164.836 C-70.401 164.105 -70.082 163.375 -69.762 162.645 C-66.685 155.615 -63.666 148.561 -60.66 141.5 C-60.543 141.225 -60.426 140.95 -60.305 140.667 C-58.847 137.241 -57.391 133.815 -55.934 130.389 C-53.672 125.066 -51.406 119.744 -49.141 114.422 C-48.766 113.539 -48.39 112.656 -48.014 111.772 C-43.38 100.883 -38.728 90.001 -34.062 79.125 C-34.019 79.024 -34.019 79.024 -33.8 78.512 C-32.28 74.969 -30.759 71.425 -29.239 67.882 C-26.104 60.577 -22.974 53.271 -19.845 45.964 C-18.869 43.685 -17.893 41.406 -16.917 39.127 C-16.848 38.966 -16.78 38.806 -16.709 38.64 C-16.084 37.181 -15.458 35.721 -14.833 34.262 C-14.418 33.292 -14.003 32.322 -13.587 31.352 C-13.519 31.193 -13.451 31.033 -13.38 30.869 C-12.286 28.314 -11.193 25.76 -10.099 23.205 C-9.001 20.641 -7.903 18.077 -6.804 15.512 C-6.204 14.11 -5.603 12.707 -5.003 11.304 C-4.448 10.009 -3.893 8.713 -3.338 7.418 C-3.136 6.947 -2.935 6.477 -2.734 6.006 C-2.46 5.365 -2.185 4.724 -1.91 4.084 C-1.832 3.9 -1.754 3.717 -1.673 3.528 C-1.156 2.325 -0.588 1.176 0 0 Z " transform="translate(457,179)" />
      </g>
    </svg>
  );
};

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
