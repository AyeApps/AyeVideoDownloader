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

  const [token, setToken] = useState(localStorage.getItem('aye_token') || '');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('aye_email') || '');
  const [userName, setUserName] = useState(localStorage.getItem('aye_name') || '');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('queue');

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const payload = authMode === 'register' ? { name: authName, email: authEmail, password: authPassword } : { email: authEmail, password: authPassword };
      const res = await fetch(`http://localhost:3000/api/auth/${authMode}`, {
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
      const res = await fetch('http://localhost:3000/api/formats', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url })
      });
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

  const pollDownloadStatus = async (id, jobId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/download/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.status === 'DONE') {
        setDownloads(prev => prev.map(d => d.id === id ? { ...d, status: "COMPLETED", progress: 100 } : d));
        
        // Trigger the browser to save the file
        // Note: Using window.location.assign is more reliable for cross-origin attachment downloads
        const downloadUrl = `http://localhost:3000/api/download/${jobId}/file?token=${encodeURIComponent(token)}`;
        window.location.assign(downloadUrl);
        
      } else if (data.status === 'FAILED' || data.status === 'CANCELLED' || data.status === 'EXPIRED') {
        setDownloads(prev => prev.map(d => d.id === id ? { ...d, status: "ERROR" } : d));
      } else {
        setDownloads(prev => prev.map(d => d.id === id ? { 
          ...d, 
          progress: data.progress || 0, 
          status: data.progress_text ? data.progress_text.toUpperCase() : "DOWNLOADING" 
        } : d));
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
        const res = await fetch('http://localhost:3000/api/download', {
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

  const handleLogout = () => {
    setToken('');
    setUserEmail('');
    setUserName('');
    localStorage.removeItem('aye_token');
    localStorage.removeItem('aye_email');
    localStorage.removeItem('aye_name');
    setIsProfileOpen(false);
  };

  if (!token) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '32px', letterSpacing: '0.1em' }}>AYE VIDEO</h1>
        
        <div style={{ display: 'flex', width: '300px', marginBottom: '24px', border: 'var(--border-thick) solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <button 
            style={{ flex: 1, padding: '12px', border: 'none', backgroundColor: authMode === 'login' ? 'var(--text-primary)' : 'transparent', color: authMode === 'login' ? 'var(--bg-primary)' : 'var(--text-primary)', fontWeight: 800, letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s ease' }}
            onClick={() => { setAuthMode('login'); setAuthError(''); }}
          >LOGIN</button>
          <button 
            style={{ flex: 1, padding: '12px', border: 'none', backgroundColor: authMode === 'register' ? 'var(--text-primary)' : 'transparent', color: authMode === 'register' ? 'var(--bg-primary)' : 'var(--text-primary)', fontWeight: 800, letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.2s ease' }}
            onClick={() => { setAuthMode('register'); setAuthError(''); }}
          >REGISTER</button>
        </div>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
          {authMode === 'register' && (
            <input 
              className="geometric-input" 
              type="text" 
              placeholder="Name" 
              value={authName} 
              onChange={e => setAuthName(e.target.value)} 
              autoComplete="name"
              required 
            />
          )}
          <input 
            className="geometric-input" 
            type="email" 
            placeholder="Email" 
            value={authEmail} 
            onChange={e => setAuthEmail(e.target.value)} 
            autoComplete="username"
            required 
          />
          <input 
            className="geometric-input" 
            type="password" 
            placeholder="Password" 
            value={authPassword} 
            onChange={e => setAuthPassword(e.target.value)} 
            autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
            required 
          />
          {authError && <div style={{ color: 'var(--error-color, red)', fontSize: '13px', fontWeight: 600 }}>{authError}</div>}
          <button className="geometric-btn primary" type="submit">
            {authMode === 'login' ? 'CONTINUE' : 'CREATE ACCOUNT'}
          </button>
        </form>
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

              <div className="flex items-center" style={{ gap: '16px', padding: '16px 24px', backgroundColor: 'var(--bg-primary)', border: 'var(--border-thick) solid var(--border-color)' }}>
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
                    <th>Target</th>
                    <th>Quality</th>
                    <th>Status</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>X</th>
                  </tr>
                </thead>
                <tbody>
                  {downloads.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 700, maxWidth: '400px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '16px' }}>
                          {d.name}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 500, opacity: 0.7, marginTop: '4px' }}>{d.url}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                      <td>
                        <span className="status-indicator">
                          {d.status === "WAITING" || d.status === "DOWNLOADING" ? <span className="status-dot pulsing"></span> : null}
                          <span style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}>{d.status}</span>
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
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
              <div className="flex items-center" style={{ gap: '16px', fontSize: '14px', fontWeight: 700 }}>
                <Icons.Folder />
                <span>/DOWNLOADS/AYE</span>
              </div>
              <div className="flex items-center" style={{ gap: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, marginRight: '16px' }}>{downloads.length} IN QUEUE</span>
                <button className="geometric-btn">Formats</button>
                <button className="geometric-btn primary" onClick={handleDownloadAll} disabled={downloads.filter(d => d.status === "READY").length === 0}>Download All</button>
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
