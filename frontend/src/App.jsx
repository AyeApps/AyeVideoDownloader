import React, { useState, useEffect } from 'react';
import './index.css';

// Bold, thick SVGs to match the aesthetic
const Icons = {
  Menu: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="square"/>
    </svg>
  ),
  Close: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="square"/>
    </svg>
  ),
  Trash: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M19 6v14H5V6m3 0V4h8v2M10 11v6M14 11v6" strokeLinecap="square"/>
    </svg>
  ),
  Folder: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19H2V5h5l2 3h13v11z" strokeLinecap="square"/>
    </svg>
  ),
  Settings: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="square"/>
    </svg>
  )
};

const MarqueeTitle = ({ text }) => {
  const textRef = React.useRef(null);
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  React.useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        setIsOverflowing(textRef.current.scrollWidth > textRef.current.clientWidth);
      }
    };
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  return (
    <div className={`title-marquee-container ${isOverflowing ? 'is-overflowing' : ''}`} style={{ fontSize: '16px' }}>
      <div className="title-marquee-content" ref={textRef}>
        {text}
      </div>
    </div>
  );
};

export default function App() {
  const [linkInput, setLinkInput] = useState("");
  const [downloads, setDownloads] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [viewState, setViewState] = useState("empty");
  const [globalSettings, setGlobalSettings] = useState({
    format: 'video',
    quality: 'best',
    codec: 'any',
    hdr: 'any'
  });

  const API_BASE_URL = import.meta.env.VITE_BFF_URL || 'http://localhost:3000';

  const [token, setToken] = useState(localStorage.getItem('aye_token') || '');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('aye_email') || '');
  const [userName, setUserName] = useState(localStorage.getItem('aye_name') || '');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('queue');
  const [downloadingIds, setDownloadingIds] = useState(new Set()); // IDs con descarga de blob en curso

  const handleLogout = () => {
    setToken('');
    setUserEmail('');
    setUserName('');
    localStorage.removeItem('aye_token');
    localStorage.removeItem('aye_email');
    localStorage.removeItem('aye_name');
    setIsProfileOpen(false);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const payload = authMode === 'register' ? { name: authName, email: authEmail, password: authPassword } : { email: authEmail, password: authPassword };
      const res = await fetch(`${API_BASE_URL}/api/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Authentication failed');
      
      if (authMode === 'register') {
        setAuthMode('login');
        setAuthError('Registered! Please log in.');
      } else {
        setToken(data.access_token);
        setUserEmail(authEmail);
        setUserName(data.name || authEmail.split('@')[0]);
        localStorage.setItem('aye_token', data.access_token);
        localStorage.setItem('aye_email', authEmail);
        localStorage.setItem('aye_name', data.name || authEmail.split('@')[0]);
      }
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const getPreferredFormat = (options, settings) => {
    if (settings.format === 'audio') return 'audio_only';
    let candidates = options.filter(o => o.id !== 'audio_only' && o.id !== 'fallback' && o.raw);
    
    if (settings.codec !== 'any') {
      candidates = candidates.filter(o => {
        const c = o.raw.vcodec.toLowerCase();
        if (settings.codec === 'h264') return c === 'h264' || c.startsWith('avc');
        if (settings.codec === 'h265') return c === 'h265' || c.startsWith('hev') || c.startsWith('hvc');
        if (settings.codec === 'vp9') return c === 'vp9' || c.startsWith('vp09');
        if (settings.codec === 'av1') return c === 'av1' || c.startsWith('av01');
        return true;
      });
    }
    
    if (settings.hdr !== 'any') {
      candidates = candidates.filter(o => {
        const isHDR = o.raw.dynamic_range && o.raw.dynamic_range.toUpperCase() !== 'SDR';
        if (settings.hdr === 'sdr') return !isHDR;
        if (settings.hdr === 'hdr') return isHDR;
        return true;
      });
    }

    if (settings.quality !== 'best') {
      let maxH = parseInt(settings.quality);
      if (settings.quality === '4k') maxH = 2160;
      candidates = candidates.filter(o => o.raw.height <= maxH);
    }
    
    if (candidates.length === 0) {
      return options.find(o => o.id !== 'audio_only')?.id || "fallback";
    }
    
    candidates.sort((a, b) => {
      if (b.raw.height !== a.raw.height) return b.raw.height - a.raw.height;
      if (b.raw.fps !== a.raw.fps) return b.raw.fps - a.raw.fps;
      return (b.raw.filesize || 0) - (a.raw.filesize || 0);
    });
    
    return candidates[0].id;
  };

  useEffect(() => {
    setDownloads(prev => prev.map(d => {
      if (d.status !== "READY" && d.status !== "WAITING") return d;
      // Only auto-update if the user hasn't started the download
      const newQuality = getPreferredFormat(d.options || [], globalSettings);
      return { ...d, type: globalSettings.format, quality: newQuality };
    }));
  }, [globalSettings]);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (isProfileOpen && !e.target.closest('.profile-popover') && !e.target.closest('.profile-toggle')) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [isProfileOpen]);

  const handleAddLink = async (url) => {
    let rawUrl = url.trim();
    if (!rawUrl) return;
    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      rawUrl = 'https://' + rawUrl;
    }
    
    const id = Date.now();
    const newDownload = {
      id,
      url: rawUrl,
      type: globalSettings.format,
      name: "DETECTING VIDEO...",
      status: "WAITING",
      quality: "fallback",
      options: [{ id: "fallback", label: "DETECTING..." }]
    };
    
    setDownloads(prev => [...prev, newDownload]);
    setLinkInput("");
    setViewState("table");

    try {
      const res = await fetch(`${API_BASE_URL}/api/formats`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url })
      });
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      
      const formattedOptions = (data.formats || []).map(f => {
        if (f.id === 'audio_only' || f.vcodec === 'none') return { id: f.id, label: 'AUDIO MP3', raw: f };
        
        let codecDesc = '';
        if (f.vcodec.startsWith('avc') || f.vcodec === 'h264') codecDesc = 'H.264 - NATIVO UNIVERSAL';
        else if (f.vcodec.startsWith('hev') || f.vcodec.startsWith('hvc') || f.vcodec === 'h265') codecDesc = 'H.265 - POCO PESO';
        else if (f.vcodec.startsWith('vp9') || f.vcodec.startsWith('vp09') || f.vcodec === 'vp9') codecDesc = 'VP9 - RECOMENDADO YT';
        else if (f.vcodec.startsWith('av01') || f.vcodec === 'av1') codecDesc = 'AV1 - MÁXIMA CALIDAD';
        else codecDesc = f.vcodec.toUpperCase();
        
        const isHDR = f.dynamic_range && f.dynamic_range.toUpperCase() !== 'SDR';
        const hdrDesc = isHDR ? ' · HDR (VIVOS)' : '';

        const mb = f.filesize ? Math.round(f.filesize / 1024 / 1024) + 'MB' : '?MB';
        return {
          id: f.id,
          label: `${f.height}P${f.fps > 30 ? f.fps : ''} · ${codecDesc}${hdrDesc} · ${mb}`,
          raw: f
        };
      });
      const preferred = getPreferredFormat(formattedOptions, globalSettings);

      setDownloads(prev => prev.map(d => 
        d.id === id ? { ...d, name: data.title || d.name, options: formattedOptions, quality: preferred, status: "READY" } : d
      ));
    } catch (err) {
      setDownloads(prev => prev.map(d => 
        d.id === id ? { ...d, status: "ERROR" } : d
      ));
    }
  };

  const handleContinue = () => handleAddLink(linkInput);
  const handleAddMore = () => handleAddLink(linkInput);

  const removeDownload = (id) => {
    const newDownloads = downloads.filter(d => d.id !== id);
    setDownloads(newDownloads);
    if (newDownloads.length === 0) setViewState("empty");
  };

  // Construye el nombre del archivo con metadata de calidad
  // Formato: "Titulo del Video [1080p60 · AV1 · HDR].mp4"
  const buildFileName = (item) => {
    const ext = item.type === 'audio' ? 'mp3' : 'mp4';
    const safeTitle = (item.name || 'video')
      .replace(/[<>:"/\\|?*]/g, '')   // quitar chars inválidos en Windows/Mac
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);

    if (item.type === 'audio') {
      return `${safeTitle} [MP3].mp3`;
    }

    // Buscar el formato seleccionado en las opciones
    const selectedOption = (item.options || []).find(o => o.id === item.quality);
    const raw = selectedOption?.raw;

    if (!raw) return `${safeTitle}.${ext}`;

    // Resolución + FPS
    const res = raw.height ? `${raw.height}p` : '';
    const fps = raw.fps && raw.fps > 30 ? `${Math.round(raw.fps)}` : '';
    const resFps = res + fps; // e.g. "1080p60" o "2160p"

    // Códec legible
    let codec = '';
    const vc = (raw.vcodec || '').toLowerCase();
    if (vc.startsWith('avc') || vc === 'h264')                          codec = 'H.264';
    else if (vc.startsWith('hev') || vc.startsWith('hvc') || vc === 'h265') codec = 'H.265';
    else if (vc.startsWith('vp09') || vc.startsWith('vp9') || vc === 'vp9') codec = 'VP9';
    else if (vc.startsWith('av01') || vc === 'av1')                     codec = 'AV1';
    else if (vc && vc !== 'none')                                        codec = vc.toUpperCase();

    // HDR
    const isHDR = raw.dynamic_range && raw.dynamic_range.toUpperCase() !== 'SDR';
    const hdr = isHDR ? (raw.dynamic_range.toUpperCase() === 'HDR' ? 'HDR' : raw.dynamic_range.toUpperCase()) : '';

    // Armar tag de calidad
    const parts = [resFps, codec, hdr].filter(Boolean);
    const tag = parts.length > 0 ? ` [${parts.join(' · ')}]` : '';

    return `${safeTitle}${tag}.${ext}`;
  };

  // Descarga el archivo usando fetch+blob para evitar problemas de navegación
  const triggerFileDownload = async (jobId, fallbackName, fileType) => {
    setDownloadingIds(prev => new Set([...prev, jobId]));
    try {
      const downloadUrl = `${API_BASE_URL}/api/download/${jobId}/file?token=${encodeURIComponent(token)}`;
      const res = await fetch(downloadUrl);
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      
      // Usamos siempre el nombre que construimos nosotros (buildFileName).
      // El header Content-Disposition del servidor viene en RFC 5987 (UTF-8 percent-encoded)
      // y produce basura como "utf-8OMAR%20COURTZ...", así que lo ignoramos.
      const fileName = fallbackName || `video_${jobId}.${fileType === 'audio' ? 'mp3' : 'mp4'}`;
      
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      console.error('Error al descargar archivo:', err);
      alert('Error al descargar el archivo. Intenta de nuevo.');
    } finally {
      setDownloadingIds(prev => { const s = new Set(prev); s.delete(jobId); return s; });
    }
  };

  const pollDownloadStatus = async (id, jobId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/download/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      
      if (data.status === 'done') {
        setDownloads(prev => prev.map(d => d.id === id ? { ...d, status: "COMPLETED", progress: 100 } : d));
        
        // Usar fetch+blob para disparar la descarga sin navegar la página
        const item = downloads.find(d => d.id === id);
        const builtName = item ? buildFileName(item) : (data.file_name || `video_${jobId}.mp4`);
        triggerFileDownload(jobId, builtName, item?.type);
        
      } else if (data.status === 'failed' || data.status === 'cancelled' || data.status === 'expired') {
        setDownloads(prev => prev.map(d => d.id === id ? { ...d, status: "ERROR" } : d));
      } else {
        setDownloads(prev => prev.map(d => {
          if (d.id === id) {
            let currentPhase = d.currentPhase || 1;
            let progress1 = d.progress1 !== undefined ? d.progress1 : 0;
            let progress2 = d.progress2 !== undefined ? d.progress2 : 0;
            const newProgress = data.progress || 0;

            // Detectar si el progreso bajó de >80% a <20% de golpe (yt-dlp descargando el audio)
            if (currentPhase === 1 && progress1 > 0.8 && newProgress < 0.2) {
              currentPhase = 2;
              progress1 = 1.0;
            }

            if (currentPhase === 1) {
              progress1 = newProgress;
            } else {
              progress2 = newProgress;
            }

            return { 
              ...d, 
              progress: newProgress,
              progress1,
              progress2,
              currentPhase,
              status: data.progress_text ? data.progress_text.toUpperCase() : "DOWNLOADING" 
            };
          }
          return d;
        }));
        setTimeout(() => pollDownloadStatus(id, jobId), 1500);
      }
    } catch (err) {
      setTimeout(() => pollDownloadStatus(id, jobId), 2000);
    }
  };

  const handleDownloadAll = async () => {
    const readyItems = downloads.filter(d => d.status === "READY");
    for (const item of readyItems) {
      setDownloads(prev => prev.map(d => d.id === item.id ? { ...d, status: "STARTING..." } : d));
      try {
        const res = await fetch(`${API_BASE_URL}/api/download`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            url: item.url, 
            format: item.type === 'audio' ? 'audioMP3' : 'videoMP4',
            quality: 'best',
            codec: 'any',
            hdr: 'any',
            selected_format_id: item.quality !== 'fallback' && item.quality !== 'audio_only' ? String(item.quality) : null
          })
        });
        if (res.status === 401) { handleLogout(); return; }
        const data = await res.json();
        
        if (data.job_id) {
          setDownloads(prev => prev.map(d => d.id === item.id ? { ...d, status: "DOWNLOADING", progress: 0, jobId: data.job_id } : d));
          pollDownloadStatus(item.id, data.job_id);
        } else {
          setDownloads(prev => prev.map(d => d.id === item.id ? { ...d, status: "ERROR" } : d));
        }
      } catch (err) {
        setDownloads(prev => prev.map(d => d.id === item.id ? { ...d, status: "ERROR" } : d));
      }
    }
  };

  const handleSaveCompleted = () => {
    const completed = downloads.filter(d => d.status === "COMPLETED");
    completed.forEach((d, index) => {
      setTimeout(() => triggerFileDownload(d.jobId, buildFileName(d), d.type), index * 800);
    });
  };

  const updateQuality = (id, newQuality) => {
    setDownloads(prev => prev.map(d => d.id === id ? { ...d, quality: newQuality } : d));
  };

  const updateType = (id, newType) => {
    setDownloads(prev => prev.map(d => {
      if (d.id !== id) return d;
      const newQuality = newType === 'audio' 
        ? 'audio_only' 
        : (d.options || []).find(o => o.id !== 'audio_only')?.id || "fallback";
      return { ...d, type: newType, quality: newQuality };
    }));
  };

  if (!token) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="centered-view">
          <div className="tech-frame" style={{ maxWidth: '440px', width: '100%', margin: '0 auto', padding: '0' }}>
            <div className="tech-frame-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="tech-badge">STATUS: OFFLINE // AUTH REQUIRED</div>
              
              <h1 className="hero-title" style={{ fontSize: '32px', textAlign: 'left', margin: 0 }}>
                <span style={{ display: 'block', fontSize: '14px', letterSpacing: '0.2em', opacity: 0.5, marginBottom: '16px' }}>SECURE ACCESS</span>
                AYE VIDEO
              </h1>

              <div style={{ display: 'flex', border: 'var(--border-thick) solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', marginTop: '8px' }}>
                <button 
                  style={{ flex: 1, padding: '12px', border: 'none', backgroundColor: authMode === 'login' ? 'var(--text-primary)' : 'transparent', color: authMode === 'login' ? 'var(--bg-primary)' : 'var(--text-primary)', fontWeight: 800, letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                >LOGIN</button>
                <button 
                  style={{ flex: 1, padding: '12px', border: 'none', backgroundColor: authMode === 'register' ? 'var(--text-primary)' : 'transparent', color: authMode === 'register' ? 'var(--bg-primary)' : 'var(--text-primary)', fontWeight: 800, letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                >REGISTER</button>
              </div>

              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {authMode === 'register' && (
                  <input 
                    className="geometric-input" 
                    type="text" 
                    placeholder="NAME" 
                    value={authName} 
                    onChange={e => setAuthName(e.target.value)} 
                    autoComplete="name"
                    required 
                  />
                )}
                <input 
                  className="geometric-input" 
                  type="email" 
                  placeholder="EMAIL" 
                  value={authEmail} 
                  onChange={e => setAuthEmail(e.target.value)} 
                  autoComplete="username"
                  required 
                />
                <input 
                  className="geometric-input" 
                  type="password" 
                  placeholder="PASSWORD" 
                  value={authPassword} 
                  onChange={e => setAuthPassword(e.target.value)} 
                  autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                  required 
                />
                {authError && <div style={{ color: 'var(--error-color, red)', fontSize: '13px', fontWeight: 600, textAlign: 'left' }}>{authError}</div>}
                <button className="geometric-btn primary hero-btn" type="submit" style={{ width: '100%', marginTop: '8px' }}>
                  {authMode === 'login' ? 'INITIALIZE SESSION' : 'CREATE ACCOUNT'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Bar */}
      <header className="top-bar">
        <button className="icon-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Menu">
          <Icons.Menu />
        </button>
        
        <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.1em' }}>AYE</div>
        
        <button 
          className="icon-btn profile-toggle" 
          onClick={(e) => {
            e.stopPropagation();
            setIsProfileOpen(!isProfileOpen);
          }}
          style={{ borderRadius: '0', border: 'var(--border-thick) solid var(--border-color)', overflow: 'hidden', padding: 0 }}
        >
          <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName || userEmail}&backgroundColor=ffffff`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'history' && (
          <div className="centered-view">
            <h1 className="hero-title" style={{ opacity: 0.5, fontSize: '32px' }}>DOWNLOAD HISTORY</h1>
            <div style={{ fontWeight: 800, letterSpacing: '0.1em', marginTop: '24px' }}>[ COMING SOON ]</div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="centered-view">
            <h1 className="hero-title" style={{ opacity: 0.5, fontSize: '32px' }}>PREFERENCES</h1>
            <div style={{ fontWeight: 800, letterSpacing: '0.1em', marginTop: '24px' }}>[ COMING SOON ]</div>
          </div>
        )}

        {activeTab === 'queue' && (viewState === "empty" ? (
          <div className="centered-view">
            <div className="tech-frame">
              <div className="tech-frame-content">
                <div className="tech-badge">STATUS: ONLINE // READY</div>
                
                <h1 className="hero-title">
                  <span style={{ display: 'block', fontSize: '18px', letterSpacing: '0.2em', opacity: 0.5, marginBottom: '24px' }}>DOWNLOAD ENGINE</span>
                  PASTE LINK.<br/>GET VIDEO.
                </h1>
                
                <div className="input-group">
                  <input 
                    type="text" 
                    className="geometric-input hero-input"
                    placeholder="HTTPS://YOUTUBE.COM/..." 
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                  />
                  <button 
                    className="geometric-btn primary hero-btn" 
                    onClick={handleContinue}
                    disabled={!linkInput.trim()}
                  >
                    Start Pipeline
                  </button>
                </div>
              </div>

              {/* Animated Carousel for Platforms */}
              <div className="marquee-container">
                <div className="marquee-content">
                  <span>YOUTUBE</span><span>•</span><span>TIKTOK</span><span>•</span><span>INSTAGRAM</span><span>•</span><span>X</span><span>•</span><span>4K/MP3</span><span>•</span>
                  <span>YOUTUBE</span><span>•</span><span>TIKTOK</span><span>•</span><span>INSTAGRAM</span><span>•</span><span>X</span><span>•</span><span>4K/MP3</span><span>•</span>
                  <span>YOUTUBE</span><span>•</span><span>TIKTOK</span><span>•</span><span>INSTAGRAM</span><span>•</span><span>X</span><span>•</span><span>4K/MP3</span><span>•</span>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="table-view">
            <div className="table-view-content">
              <div className="flex-col" style={{ gap: '16px', marginBottom: '32px' }}>
              <div className="add-bar" style={{ marginBottom: 0 }}>
                <input 
                  type="text" 
                  className="geometric-input"
                  placeholder="ADD ANOTHER LINK..." 
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMore()}
                />
                <button 
                  className="geometric-btn" 
                  onClick={handleAddMore}
                  disabled={!linkInput.trim()}
                >
                  Queue
                </button>
              </div>

              <div className="global-settings-bar flex items-center" style={{ flexWrap: 'wrap', gap: '16px', padding: '16px 24px', backgroundColor: 'var(--bg-primary)', border: 'var(--border-thick) solid var(--border-color)' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.1em' }}>GLOBAL:</div>
                <select className="geometric-select" style={{ padding: '8px 12px', fontSize: '12px', backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }} value={globalSettings.format} onChange={e => setGlobalSettings({...globalSettings, format: e.target.value})}>
                  <option value="video">VIDEO (MP4)</option>
                  <option value="audio">SOLO AUDIO (MP3)</option>
                </select>
                
                {globalSettings.format === 'video' ? (
                  <>
                    <select className="geometric-select" style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }} value={globalSettings.quality} onChange={e => setGlobalSettings({...globalSettings, quality: e.target.value})}>
                      <option value="best">MEJOR (RECOMENDADO)</option>
                      <option value="4k">4K (ULTRA HD)</option>
                      <option value="1080p">1080P (FULL HD)</option>
                      <option value="720p">720P (HD)</option>
                    </select>
                    <select className="geometric-select" style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }} value={globalSettings.codec} onChange={e => setGlobalSettings({...globalSettings, codec: e.target.value})}>
                      <option value="any">CUALQUIER CÓDEC</option>
                      <option value="h264">H.264 (NATIVO - UNIVERSAL)</option>
                      <option value="h265">H.265 (NATIVO - POCO PESO)</option>
                      <option value="vp9">VP9 (IINA - RECOMENDADO YT)</option>
                      <option value="av1">AV1 (IINA - MÁXIMA CALIDAD)</option>
                    </select>
                    <select className="geometric-select" style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }} value={globalSettings.hdr} onChange={e => setGlobalSettings({...globalSettings, hdr: e.target.value})}>
                      <option value="any">CUALQUIER COLOR</option>
                      <option value="sdr">SDR (NORMALES)</option>
                      <option value="hdr">HDR (VIVOS)</option>
                    </select>
                  </>
                ) : (
                  <div style={{ flex: 1, fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 800, letterSpacing: '0.05em' }}>
                    SE DESCARGARÁ LA MEJOR CALIDAD DE AUDIO DISPONIBLE
                  </div>
                )}
              </div>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Target</th>
                    <th style={{ width: '30%', textAlign: 'center' }}>Quality</th>
                    <th style={{ width: '20%', textAlign: 'center' }}>Status</th>
                    <th style={{ width: '10%', minWidth: '60px', textAlign: 'center' }}>X</th>
                  </tr>
                </thead>
                <tbody>
                  {downloads.map(d => (
                    <tr key={d.id}>
                      <td data-label="Target" style={{ fontWeight: 700, maxWidth: '400px' }}>
                        <MarqueeTitle text={d.name} />
                        <div style={{ fontSize: '13px', fontWeight: 500, opacity: 0.7, marginTop: '4px' }}>{d.url}</div>
                      </td>
                      <td data-label="Quality" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                          <select className="geometric-select" style={{ padding: '8px', fontSize: '12px', backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }} value={d.type} onChange={(e) => updateType(d.id, e.target.value)}>
                            <option value="video">VIDEO</option>
                            <option value="audio">AUDIO</option>
                          </select>
                          
                          {d.type === 'video' ? (
                            <select className="geometric-select" style={{ padding: '8px', fontSize: '12px' }} value={d.quality} onChange={(e) => updateQuality(d.id, e.target.value)}>
                              {(d.options || []).filter(o => o.id !== 'audio_only').map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ fontSize: '12px', fontWeight: 800, marginLeft: '8px' }}>MP3 (MEJOR CALIDAD)</span>
                          )}
                        </div>
                      </td>
                      <td data-label="Status" style={{ minWidth: '180px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                          <span className="status-indicator" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {(d.status === "WAITING" || d.status === "DOWNLOADING" || (d.progress !== undefined && d.status !== "COMPLETED" && d.status !== "ERROR" && d.status !== "READY")) ? <span className="status-dot pulsing"></span> : null}
                          <span style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }} title={d.status}>
                            {d.status.startsWith('[DOWNLOAD]') ? `DOWNLOADING ${Math.round((d.progress || 0) * 100)}%` : 
                             (d.status.startsWith('[MERGER]') || d.status.startsWith('[EXTRACTAUDIO]') ? 'PROCESSING / MERGING...' : d.status)}
                          </span>
                        </span>
                        
                        {(d.progress !== undefined && d.status !== "COMPLETED" && d.status !== "ERROR" && d.status !== "READY" && d.status !== "WAITING") && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', width: '100%' }}>
                            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                              <div className={(d.currentPhase === 1 && d.progress >= 1) || d.status.includes('MERG') || d.status.includes('EXTRACT') ? 'progress-bar-processing' : ''} style={{ 
                                position: 'absolute', top: 0, left: 0, height: '100%', 
                                backgroundColor: 'var(--text-primary)', 
                                width: (d.currentPhase === 2) ? '100%' : `${Math.max(5, (d.progress1 || 0) * 100)}%`,
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                            
                            {d.currentPhase === 2 && (
                              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
                                <div className={d.progress >= 1 || d.status.includes('MERG') || d.status.includes('EXTRACT') ? 'progress-bar-processing' : ''} style={{ 
                                  position: 'absolute', top: 0, left: 0, height: '100%', 
                                  backgroundColor: 'var(--text-primary)', 
                                  width: `${Math.max(5, (d.progress2 || 0) * 100)}%`,
                                  transition: 'width 0.3s ease'
                                }} />
                              </div>
                            )}
                          </div>
                        )}
                        
                        {d.status === "COMPLETED" && (
                          <button 
                            className="geometric-btn primary" 
                            style={{ marginTop: '8px', padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: downloadingIds.has(d.jobId) ? 0.6 : 1, width: '100%' }}
                            onClick={() => triggerFileDownload(d.jobId, buildFileName(d), d.type)}
                            disabled={downloadingIds.has(d.jobId)}
                          >
                            {downloadingIds.has(d.jobId) ? (
                              <><span className="status-dot pulsing" style={{ width: '8px', height: '8px', flexShrink: 0 }} />PREPARANDO...</>
                            ) : (
                              <>↓ DESCARGAR ARCHIVO</>
                            )}
                          </button>
                        )}
                        </div>
                      </td>
                      <td data-label="Remove" style={{ textAlign: 'center' }}>
                        <button className="icon-btn" onClick={() => removeDownload(d.id)} style={{ width: '40px', height: '40px', margin: '0 auto' }}>
                          <Icons.Trash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="status-bar flex justify-between items-center">
              <div></div>
              <div className="flex items-center" style={{ gap: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, marginRight: '16px' }}>{downloads.length} IN QUEUE</span>
                <button className="geometric-btn" onClick={handleSaveCompleted} disabled={downloads.filter(d => d.status === "COMPLETED").length === 0}>Save Completed</button>
                <button className="geometric-btn primary" onClick={handleDownloadAll} disabled={downloads.filter(d => d.status === "READY").length === 0}>Download All</button>
              </div>
            </div>
            </div>
          </div>
        ))}
      </main>

      {/* Sidebar Overlay */}
      <div className={`backdrop ${isSidebarOpen ? 'visible' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="title">MENU</div>
          <button className="icon-btn" onClick={() => setIsSidebarOpen(false)} style={{ border: 'none' }}>
            <Icons.Close />
          </button>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }}>History</button>
          <button className={`nav-item ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => { setActiveTab('queue'); setIsSidebarOpen(false); }}>Queue</button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}>Settings</button>
        </nav>
        
        <div className="sidebar-footer">
          <button className={`nav-item flex items-center ${activeTab === 'settings' ? 'active' : ''}`} style={{ gap: '16px', padding: '16px 24px', border: 'none' }} onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}>
            <Icons.Settings />
            <span>Preferences</span>
          </button>
          <button className="nav-item flex items-center" style={{ gap: '16px', padding: '16px 24px', border: 'none', color: 'red' }} onClick={handleLogout}>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Profile Popover */}
      <div className={`profile-popover ${isProfileOpen ? 'open' : ''}`}>
        <div className="profile-header">
          <strong>{(userName || (userEmail || 'USER').split('@')[0]).toUpperCase()}</strong>
          <span>{(userEmail || 'USER').toLowerCase()}</span>
        </div>
        <div style={{ padding: '16px 0' }}>
          <button className="nav-item" style={{ border: 'none', padding: '12px 24px', width: '100%', textAlign: 'left' }} onClick={() => { setActiveTab('settings'); setIsProfileOpen(false); }}>Preferences</button>
          <button className="nav-item" style={{ border: 'none', padding: '12px 24px', color: '#ff3333', width: '100%', textAlign: 'left' }} onClick={handleLogout}>Log Out</button>
        </div>
      </div>
    </div>
  );
}
