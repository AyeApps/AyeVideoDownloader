import React, { useState, useEffect } from 'react';
import './index.css';
import AuthScreen from './components/AuthScreen';
import './components/AuthScreen.css';

// SVG Icons
const Icons = {
  Menu: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="square"/>
    </svg>
  ),
  Close: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="square"/>
    </svg>
  ),
  Trash: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M19 6v14H5V6m3 0V4h8v2M10 11v6M14 11v6" strokeLinecap="square"/>
    </svg>
  ),
  Paste: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" strokeLinecap="square"/>
      <rect x="8" y="2" width="8" height="4" rx="1" strokeLinecap="square"/>
    </svg>
  ),
  Download: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="square"/>
    </svg>
  ),
  History: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="12" r="10" strokeLinecap="square"/>
      <polyline points="12 6 12 12 16 14" strokeLinecap="square"/>
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="square"/>
    </svg>
  ),
  Queue: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <rect x="2" y="4" width="20" height="5" strokeLinecap="square"/>
      <rect x="2" y="12" width="20" height="8" strokeLinecap="square"/>
    </svg>
  )
};

// Aye Vector Logo Icon
const AyeBrandLogo = () => (
  <svg width="22" height="22" viewBox="0 0 1024 1024" fill="none">
    <rect width="1024" height="1024" rx="190" fill="#000000"/>
    <rect x="56" y="56" width="912" height="912" rx="140" stroke="#FFFFFF" strokeWidth="32"/>
    <path d="M 464 260 L 560 260 L 560 480 L 680 360 L 736 416 L 512 640 L 288 416 L 344 360 L 464 480 Z" fill="#FFFFFF" />
    <polygon points="512,504 562,554 512,604 462,554" fill="#FE9D01" stroke="#000000" strokeWidth="14" strokeLinejoin="miter" />
    <path d="M 288 710 L 736 710 L 736 764 L 288 764 Z" fill="#FFFFFF" />
  </svg>
);

const MarqueeTitle = ({ text }) => {
  return (
    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={text}>
      {text}
    </div>
  );
};

export default function App() {
  const [linkInput, setLinkInput] = useState("");
  const [downloads, setDownloads] = useState([]);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('aye_history') || '[]');
    } catch {
      return [];
    }
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [viewState, setViewState] = useState("empty");
  const [theme, setTheme] = useState(() => localStorage.getItem('aye_theme') || 'dark');
  const [lang, setLang] = useState(() => localStorage.getItem('aye_lang') || 'es');
  
  const [globalSettings, setGlobalSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('aye_settings') || JSON.stringify({
        format: 'video',
        quality: 'best',
        codec: 'any',
        hdr: 'any',
        audioBitrate: '320'
      }));
    } catch {
      return { format: 'video', quality: 'best', codec: 'any', hdr: 'any', audioBitrate: '320' };
    }
  });

  const API_BASE_URL = import.meta.env.VITE_BFF_URL || 'https://api-ayvddw.ayeapps.com';

  const [token, setToken] = useState(localStorage.getItem('aye_token') || '');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('aye_email') || '');
  const [userName, setUserName] = useState(localStorage.getItem('aye_name') || '');
  const [activeTab, setActiveTab] = useState('queue');
  const [downloadingIds, setDownloadingIds] = useState(new Set());

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aye_theme', theme);
  }, [theme]);

  // Persist Settings
  useEffect(() => {
    localStorage.setItem('aye_settings', JSON.stringify(globalSettings));
  }, [globalSettings]);

  // Persist History
  useEffect(() => {
    localStorage.setItem('aye_history', JSON.stringify(history));
  }, [history]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleLang = () => {
    const next = lang === 'es' ? 'en' : 'es';
    setLang(next);
    localStorage.setItem('aye_lang', next);
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

  // Helper para selección inteligente de calidad
  const getPreferredFormat = (options, settings) => {
    if (!options || options.length === 0) return 'fallback';
    if (settings.format === 'audio') {
      return 'audio_only';
    }
    const videoOptions = options.filter(o => o.id !== 'audio_only');
    if (videoOptions.length === 0) return options[0].id;

    if (settings.quality === 'best' && settings.codec === 'any' && settings.hdr === 'any') {
      return videoOptions[0].id;
    }

    let filtered = videoOptions;
    if (settings.quality !== 'best') {
      const matchQuality = filtered.filter(o => {
        const height = o.raw?.height;
        if (settings.quality === '4k') return height >= 2160;
        if (settings.quality === '1080p') return height === 1080;
        if (settings.quality === '720p') return height === 720;
        return true;
      });
      if (matchQuality.length > 0) filtered = matchQuality;
    }

    if (settings.codec !== 'any') {
      const matchCodec = filtered.filter(o => {
        const vc = (o.raw?.vcodec || '').toLowerCase();
        if (settings.codec === 'h264') return vc.startsWith('avc') || vc === 'h264';
        if (settings.codec === 'h265') return vc.startsWith('hev') || vc.startsWith('hvc') || vc === 'h265';
        if (settings.codec === 'vp9') return vc.startsWith('vp09') || vc.startsWith('vp9') || vc === 'vp9';
        if (settings.codec === 'av1') return vc.startsWith('av01') || vc === 'av1';
        return true;
      });
      if (matchCodec.length > 0) filtered = matchCodec;
    }

    if (settings.hdr !== 'any') {
      const matchHDR = filtered.filter(o => {
        const isHDR = o.raw?.dynamic_range && o.raw?.dynamic_range.toUpperCase() !== 'SDR';
        return settings.hdr === 'hdr' ? isHDR : !isHDR;
      });
      if (matchHDR.length > 0) filtered = matchHDR;
    }

    return filtered[0]?.id || videoOptions[0].id;
  };

  useEffect(() => {
    setDownloads(prev => prev.map(d => {
      if (d.status !== "READY" && d.status !== "WAITING") return d;
      const newQuality = getPreferredFormat(d.options || [], globalSettings);
      return { ...d, type: globalSettings.format, quality: newQuality };
    }));
  }, [globalSettings]);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (isProfileOpen && !e.target.closest('.profile-popover') && !e.target.closest('.profile-avatar-btn')) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [isProfileOpen]);

  // Handle Paste from Clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && (text.startsWith('http://') || text.startsWith('https://') || text.includes('.'))) {
        setLinkInput(text.trim());
      }
    } catch {
      // Clipboard permissions denied
    }
  };

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
      name: lang === 'es' ? "DETECTANDO INFORMACIÓN..." : "DETECTING VIDEO...",
      status: "WAITING",
      quality: "fallback",
      options: [{ id: "fallback", label: lang === 'es' ? "DETECTANDO..." : "DETECTING..." }]
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
        body: JSON.stringify({ url: rawUrl })
      });
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      
      if (!res.ok || !data.formats || data.formats.length === 0) {
        throw new Error(data.error || "Failed to detect video");
      }
      
      const formattedOptions = data.formats.map(f => {
        if (f.id === 'audio_only' || f.vcodec === 'none') return { id: f.id, label: 'AUDIO MP3', raw: f };
        
        let codecDesc = '';
        if (f.vcodec.startsWith('avc') || f.vcodec === 'h264') codecDesc = 'H.264 - NATIVO';
        else if (f.vcodec.startsWith('hev') || f.vcodec.startsWith('hvc') || f.vcodec === 'h265') codecDesc = 'H.265';
        else if (f.vcodec.startsWith('vp9') || f.vcodec.startsWith('vp09') || f.vcodec === 'vp9') codecDesc = 'VP9';
        else if (f.vcodec.startsWith('av01') || f.vcodec === 'av1') codecDesc = 'AV1';
        else codecDesc = f.vcodec.toUpperCase();
        
        const isHDR = f.dynamic_range && f.dynamic_range.toUpperCase() !== 'SDR';
        const hdrDesc = isHDR ? ' · HDR' : '';
        const mb = f.filesize ? Math.round(f.filesize / 1024 / 1024) + 'MB' : '';
        const mbText = mb ? ` · ${mb}` : '';

        return {
          id: f.id,
          label: `${f.height}P${f.fps > 30 ? f.fps : ''} · ${codecDesc}${hdrDesc}${mbText}`,
          raw: f
        };
      });
      const preferred = getPreferredFormat(formattedOptions, globalSettings);

      setDownloads(prev => prev.map(d => 
        d.id === id ? { 
          ...d, 
          name: data.title || "Unknown Video", 
          thumbnail: data.thumbnail || '',
          options: formattedOptions, 
          quality: preferred, 
          status: "READY" 
        } : d
      ));
    } catch {
      setDownloads(prev => prev.map(d => 
        d.id === id ? { 
          ...d, 
          name: lang === 'es' ? "ERROR AL DETECTAR VIDEO" : "ERROR DETECTING VIDEO", 
          status: "ERROR", 
          quality: "error",
          options: [{ id: "error", label: "UNAVAILABLE" }]
        } : d
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

  const buildFileName = (item) => {
    const ext = item.type === 'audio' ? 'mp3' : 'mp4';
    const safeTitle = (item.name || 'video')
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);

    if (item.type === 'audio') {
      return `${safeTitle} [MP3].mp3`;
    }

    const selectedOption = (item.options || []).find(o => o.id === item.quality);
    const raw = selectedOption?.raw;

    if (!raw) return `${safeTitle}.${ext}`;

    const res = raw.height ? `${raw.height}p` : '';
    const fps = raw.fps && raw.fps > 30 ? `${Math.round(raw.fps)}` : '';
    const resFps = res + fps;

    let codec = '';
    const vc = (raw.vcodec || '').toLowerCase();
    if (vc.startsWith('avc') || vc === 'h264') codec = 'H.264';
    else if (vc.startsWith('hev') || vc.startsWith('hvc') || vc === 'h265') codec = 'H.265';
    else if (vc.startsWith('vp09') || vc.startsWith('vp9') || vc === 'vp9') codec = 'VP9';
    else if (vc.startsWith('av01') || vc === 'av1') codec = 'AV1';

    const isHDR = raw.dynamic_range && raw.dynamic_range.toUpperCase() !== 'SDR';
    const hdr = isHDR ? 'HDR' : '';

    const parts = [resFps, codec, hdr].filter(Boolean);
    const tag = parts.length > 0 ? ` [${parts.join(' · ')}]` : '';

    return `${safeTitle}${tag}.${ext}`;
  };

  const triggerFileDownload = async (jobId, fallbackName, fileType) => {
    setDownloadingIds(prev => new Set([...prev, jobId]));
    try {
      const downloadUrl = `${API_BASE_URL}/api/download/${jobId}/file?token=${encodeURIComponent(token)}`;
      const res = await fetch(downloadUrl);
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      
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
    } catch {
      alert(lang === 'es' ? 'Error al descargar el archivo. Intenta de nuevo.' : 'Failed to download file. Please retry.');
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
      
      if (data.status === 'done' || data.status === 'DONE') {
        setDownloads(prev => prev.map(d => {
          if (d.id === id) {
            const updated = { ...d, status: "COMPLETED", progress: 100 };
            // Add to history
            setHistory(h => [
              {
                id: Date.now(),
                title: d.name,
                url: d.url,
                type: d.type,
                quality: d.quality,
                jobId: d.jobId,
                date: new Date().toLocaleString(),
                fileName: buildFileName(d)
              },
              ...h.filter(item => item.url !== d.url)
            ]);
            return updated;
          }
          return d;
        }));
        
        const currentItem = downloads.find(d => d.id === id);
        if (currentItem) {
          triggerFileDownload(jobId, buildFileName(currentItem), currentItem.type);
        }
      } else if (data.status === 'error' || data.status === 'FAILED') {
        setDownloads(prev => prev.map(d => d.id === id ? { ...d, status: "ERROR" } : d));
      } else {
        setTimeout(() => pollDownloadStatus(id, jobId), 2000);
      }
    } catch {
      setTimeout(() => pollDownloadStatus(id, jobId), 3000);
    }
  };

  const handleDownloadAll = () => {
    downloads.forEach(d => {
      if (d.status === "READY") {
        setDownloads(prev => prev.map(item => item.id === d.id ? { ...item, status: "STARTING..." } : item));
        
        fetch(`${API_BASE_URL}/api/download`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            url: d.url,
            format: d.type === 'audio' ? 'audioMP3' : 'video',
            quality: d.quality,
            selected_format_id: d.type === 'audio' ? null : d.quality
          })
        })
        .then(res => {
          if (res.status === 401) { handleLogout(); return; }
          return res.json();
        })
        .then(data => {
          if (data && data.job_id) {
            setDownloads(prev => prev.map(item => item.id === d.id ? { ...item, jobId: data.job_id, status: "DOWNLOADING" } : item));
            
            // Connect to progress Stream
            try {
              const eventSource = new EventSource(`${API_BASE_URL}/api/download/${data.job_id}/stream`);
              eventSource.addEventListener('progress', (e) => {
                try {
                  const pData = JSON.parse(e.data);
                  setDownloads(prev => prev.map(item => {
                    if (item.id !== d.id) return item;
                    return {
                      ...item,
                      status: pData.progress_text || pData.status || "DOWNLOADING",
                      progress: pData.progress || 0
                    };
                  }));
                } catch {
                  //
                }
              });
              eventSource.addEventListener('done', () => {
                eventSource.close();
                pollDownloadStatus(d.id, data.job_id);
              });
              eventSource.addEventListener('error', () => {
                eventSource.close();
                pollDownloadStatus(d.id, data.job_id);
              });
            } catch {
              pollDownloadStatus(d.id, data.job_id);
            }
          } else {
            setDownloads(prev => prev.map(item => item.id === d.id ? { ...item, status: "ERROR" } : item));
          }
        })
        .catch(() => {
          setDownloads(prev => prev.map(item => item.id === d.id ? { ...item, status: "ERROR" } : item));
        });
      }
    });
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
      <AuthScreen
        apiBaseUrl={API_BASE_URL}
        appName="AYE VIDEO DOWNLOADER"
        onLoginSuccess={(data, emailUsed) => {
          setToken(data.access_token);
          setUserEmail(emailUsed);
          setUserName(data.name || emailUsed.split('@')[0]);
          localStorage.setItem('aye_token', data.access_token);
          localStorage.setItem('aye_email', emailUsed);
          localStorage.setItem('aye_name', data.name || emailUsed.split('@')[0]);
        }}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Top Bar Header */}
      <header className="top-bar">
        <div className="top-bar-left">
          <button className="header-action-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Menu" title="Menu">
            <Icons.Menu />
          </button>
          
          <div className="brand-badge" onClick={() => { setActiveTab('queue'); setViewState('empty'); }}>
            <div className="brand-logo-icon">
              <AyeBrandLogo />
            </div>
            <div className="brand-title">
              AYE<span className="brand-title-accent">-VIDEO</span>
            </div>
          </div>
        </div>

        <div className="top-bar-center">
          <div className="telemetry-badge">
            <div className="telemetry-dot" />
            <span>{lang === 'es' ? 'MOTOR: EN LÍNEA' : 'ENGINE: ONLINE'}</span>
          </div>
        </div>

        <div className="top-bar-right">
          <button className="header-action-btn" onClick={toggleLang} title="Language">
            文A {lang.toUpperCase()}
          </button>
          
          <button className="header-action-btn" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          
          <button 
            className="profile-avatar-btn" 
            onClick={(e) => {
              e.stopPropagation();
              setIsProfileOpen(!isProfileOpen);
            }}
            title={userName || userEmail}
          >
            {(userName || userEmail || 'U').charAt(0).toUpperCase()}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {/* TAB: HISTORY */}
        {activeTab === 'history' && (
          <div className="panel-view-container">
            <div className="panel-header-title">
              <Icons.History />
              <span>{lang === 'es' ? 'HISTORIAL DE DESCARGAS' : 'DOWNLOAD HISTORY'}</span>
            </div>

            <div className="panel-card">
              <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
                <div className="panel-card-title" style={{ margin: 0 }}>
                  {history.length} {lang === 'es' ? 'ARCHIVOS DESCARGADOS' : 'FILES PROCESSED'}
                </div>
                {history.length > 0 && (
                  <button 
                    className="geometric-btn amber-outline" 
                    style={{ padding: '8px 16px', fontSize: '11px' }}
                    onClick={() => setHistory([])}
                  >
                    {lang === 'es' ? 'LIMPIAR HISTORIAL' : 'CLEAR HISTORY'}
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                  {lang === 'es' ? '[ NO HAY DESCARGAS REGISTRADAS TODAVÍA ]' : '[ NO DOWNLOADS RECORDED YET ]'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {history.map((item) => (
                    <div key={item.id} className="history-item-card">
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '16px' }}>
                        <div style={{ fontWeight: 800, fontSize: '14px', textTransform: 'uppercase' }}>{item.title}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {item.date} • {item.type.toUpperCase()} • {item.fileName}
                        </div>
                      </div>
                      <button 
                        className="geometric-btn primary"
                        style={{ padding: '8px 16px', fontSize: '11px', whiteSpace: 'nowrap' }}
                        onClick={() => triggerFileDownload(item.jobId, item.fileName, item.type)}
                      >
                        <Icons.Download />
                        <span>{lang === 'es' ? 'DESCARGAR' : 'DOWNLOAD'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: PREFERENCES / SETTINGS */}
        {activeTab === 'settings' && (
          <div className="panel-view-container">
            <div className="panel-header-title">
              <Icons.Settings />
              <span>{lang === 'es' ? 'PREFERENCIAS DEL MOTOR' : 'ENGINE PREFERENCES'}</span>
            </div>

            <div className="panel-card">
              <div className="panel-card-title">
                ⚙️ {lang === 'es' ? 'PREAJUSTES GLOBALES' : 'GLOBAL PRESETS'}
              </div>
              
              <div className="settings-grid">
                <div className="settings-item">
                  <label>{lang === 'es' ? 'FORMATO POR DEFECTO' : 'DEFAULT FORMAT'}</label>
                  <select 
                    className="geometric-select" 
                    value={globalSettings.format}
                    onChange={e => setGlobalSettings({ ...globalSettings, format: e.target.value })}
                  >
                    <option value="video">VIDEO (MP4)</option>
                    <option value="audio">SOLO AUDIO (MP3)</option>
                  </select>
                </div>

                <div className="settings-item">
                  <label>{lang === 'es' ? 'CALIDAD PREDETERMINADA' : 'DEFAULT QUALITY'}</label>
                  <select 
                    className="geometric-select"
                    value={globalSettings.quality}
                    onChange={e => setGlobalSettings({ ...globalSettings, quality: e.target.value })}
                  >
                    <option value="best">{lang === 'es' ? 'MEJOR (RECOMENDADO)' : 'BEST (RECOMMENDED)'}</option>
                    <option value="4k">4K (ULTRA HD 2160P)</option>
                    <option value="1080p">1080P (FULL HD)</option>
                    <option value="720p">720P (HD)</option>
                  </select>
                </div>

                <div className="settings-item">
                  <label>{lang === 'es' ? 'CÓDEC PREFERIDO' : 'PREFERRED CODEC'}</label>
                  <select 
                    className="geometric-select"
                    value={globalSettings.codec}
                    onChange={e => setGlobalSettings({ ...globalSettings, codec: e.target.value })}
                  >
                    <option value="any">{lang === 'es' ? 'CUALQUIER CÓDEC' : 'ANY CODEC'}</option>
                    <option value="h264">H.264 (NATIVO - MÁXIMA COMPATIBILIDAD)</option>
                    <option value="h265">H.265 (POCO PESO)</option>
                    <option value="vp9">VP9 (YOUTUBE OPTIMIZADO)</option>
                    <option value="av1">AV1 (MÁXIMA CALIDAD VISUAL)</option>
                  </select>
                </div>

                <div className="settings-item">
                  <label>{lang === 'es' ? 'CALIDAD DE AUDIO MP3' : 'MP3 AUDIO BITRATE'}</label>
                  <select 
                    className="geometric-select"
                    value={globalSettings.audioBitrate}
                    onChange={e => setGlobalSettings({ ...globalSettings, audioBitrate: e.target.value })}
                  >
                    <option value="320">320 KBPS (MÁXIMA FIDELIDAD)</option>
                    <option value="256">256 KBPS (ALTA CALIDAD)</option>
                    <option value="192">192 KBPS (ESTÁNDAR)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-card-title">
                🛡️ {lang === 'es' ? 'ESTADO DEL SISTEMA // AYEAPPS' : 'SYSTEM STATUS // AYEAPPS'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>• BFF SERVICE: <span style={{ color: 'var(--accent-success)' }}>ONLINE [api-ayvddw.ayeapps.com]</span></div>
                <div>• CORE ENGINE: <span style={{ color: 'var(--accent-amber)' }}>AYE-YT-DLP 2026.8</span></div>
                <div>• DATABASE: <span style={{ color: 'var(--accent-success)' }}>MONGODB ACTIVE</span></div>
                <div>• USER SESSION: <span>{userEmail}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: QUEUE (HERO OR TABLE) */}
        {activeTab === 'queue' && (viewState === "empty" ? (
          <div className="centered-view">
            <div className="tech-frame">
              <div className="tech-frame-content">
                <div className="tech-badge">
                  ● {lang === 'es' ? 'MOTOR: ACTIVO // ALTA VELOCIDAD' : 'ENGINE: ACTIVE // ULTRA-SPEED'}
                </div>
                
                <h1 className="hero-title">
                  <span style={{ display: 'block', fontSize: '16px', letterSpacing: '0.2em', opacity: 0.5, marginBottom: '16px' }}>
                    AYE VIDEO DOWNLOADER
                  </span>
                  {lang === 'es' ? 'PEGA ENLACE.' : 'PASTE LINK.'}<br/>
                  <span className="hero-title-accent">{lang === 'es' ? 'OBTÉN VIDEO.' : 'GET VIDEO.'}</span>
                </h1>

                
                <div className="input-group-hero">
                  <input 
                    type="text" 
                    className="geometric-input hero-input"
                    placeholder="HTTPS://YOUTUBE.COM/WATCH?V=..." 
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                    autoFocus
                  />
                  <button 
                    className="paste-btn"
                    onClick={handlePasteClipboard}
                    title={lang === 'es' ? 'Pegar del portapapeles' : 'Paste from clipboard'}
                  >
                    <Icons.Paste />
                    <span>{lang === 'es' ? 'PEGAR' : 'PASTE'}</span>
                  </button>
                  <button 
                    className="geometric-btn primary hero-btn" 
                    onClick={handleContinue}
                    disabled={!linkInput.trim()}
                  >
                    {lang === 'es' ? 'PROCESAR ➔' : 'START ➔'}
                  </button>
                </div>
              </div>

              {/* Supported Platforms Marquee */}
              <div className="marquee-container">
                <div className="marquee-content">
                  <span>YOUTUBE</span><span className="marquee-accent">•</span>
                  <span>TIKTOK</span><span className="marquee-accent">•</span>
                  <span>INSTAGRAM</span><span className="marquee-accent">•</span>
                  <span>X / TWITTER</span><span className="marquee-accent">•</span>
                  <span>TWITCH</span><span className="marquee-accent">•</span>
                  <span>SOUNDCLOUD</span><span className="marquee-accent">•</span>
                  <span>FACEBOOK</span><span className="marquee-accent">•</span>
                  <span>4K / MP3</span><span className="marquee-accent">•</span>
                  <span>YOUTUBE</span><span className="marquee-accent">•</span>
                  <span>TIKTOK</span><span className="marquee-accent">•</span>
                  <span>INSTAGRAM</span><span className="marquee-accent">•</span>
                  <span>X / TWITTER</span><span className="marquee-accent">•</span>
                  <span>TWITCH</span><span className="marquee-accent">•</span>
                  <span>SOUNDCLOUD</span><span className="marquee-accent">•</span>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="table-view">
            {/* Quick Add Bar */}
            <div className="queue-header-bar">
              <input 
                type="text" 
                className="geometric-input"
                placeholder={lang === 'es' ? "AGREGAR OTRO ENLACE..." : "ADD ANOTHER LINK..."}
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMore()}
              />
              <button 
                className="paste-btn"
                style={{ height: 'auto', boxShadow: '4px 4px 0px 0px var(--shadow-color)' }}
                onClick={handlePasteClipboard}
              >
                <Icons.Paste />
              </button>
              <button 
                className="geometric-btn primary" 
                onClick={handleAddMore}
                disabled={!linkInput.trim()}
              >
                + {lang === 'es' ? 'COLA' : 'QUEUE'}
              </button>
            </div>

            {/* Global Presets */}
            <div className="global-presets-card">
              <span className="preset-label">{lang === 'es' ? 'PREAJUSTE GLOBAL:' : 'GLOBAL PRESET:'}</span>
              
              <select 
                className="geometric-select" 
                style={{ backgroundColor: 'var(--accent-amber)', color: '#000000', borderColor: 'var(--border-color)' }}
                value={globalSettings.format} 
                onChange={e => setGlobalSettings({...globalSettings, format: e.target.value})}
              >
                <option value="video">VIDEO (MP4)</option>
                <option value="audio">AUDIO (MP3)</option>
              </select>
              
              {globalSettings.format === 'video' ? (
                <>
                  <select 
                    className="geometric-select" 
                    value={globalSettings.quality} 
                    onChange={e => setGlobalSettings({...globalSettings, quality: e.target.value})}
                  >
                    <option value="best">{lang === 'es' ? 'MEJOR CALIDAD' : 'BEST QUALITY'}</option>
                    <option value="4k">4K (ULTRA HD)</option>
                    <option value="1080p">1080P (FULL HD)</option>
                    <option value="720p">720P (HD)</option>
                  </select>
                  
                  <select 
                    className="geometric-select" 
                    value={globalSettings.codec} 
                    onChange={e => setGlobalSettings({...globalSettings, codec: e.target.value})}
                  >
                    <option value="any">{lang === 'es' ? 'CUALQUIER CÓDEC' : 'ANY CODEC'}</option>
                    <option value="h264">H.264 (NATIVO)</option>
                    <option value="h265">H.265</option>
                    <option value="vp9">VP9 (YT)</option>
                    <option value="av1">AV1</option>
                  </select>
                </>
              ) : (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800, color: 'var(--accent-amber)' }}>
                  MP3 320 KBPS (ULTRA HIGH FIDELITY)
                </span>
              )}
            </div>

            {/* Processing Table */}
            <div className="media-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '45%' }}>{lang === 'es' ? 'Video / Medio' : 'Target Media'}</th>
                    <th style={{ width: '25%', textAlign: 'center' }}>{lang === 'es' ? 'Calidad / Formato' : 'Quality / Format'}</th>
                    <th style={{ width: '20%', textAlign: 'center' }}>{lang === 'es' ? 'Estado' : 'Status'}</th>
                    <th style={{ width: '10%', textAlign: 'center' }}>✕</th>
                  </tr>
                </thead>
                <tbody>
                  {downloads.map(d => (
                    <tr key={d.id}>
                      <td>
                        <div className="media-item-info">
                          <div className="media-thumbnail-box">
                            {d.thumbnail ? (
                              <img src={d.thumbnail} alt="thumb" className="media-thumbnail-img" />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000', color: 'var(--accent-amber)' }}>
                                <AyeBrandLogo />
                              </div>
                            )}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div className="media-title-text">
                              <MarqueeTitle text={d.name} />
                            </div>
                            <div className="media-url-subtext">{d.url}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                          <select 
                            className="geometric-select" 
                            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} 
                            value={d.type} 
                            onChange={(e) => updateType(d.id, e.target.value)} 
                            disabled={d.status === "ERROR"}
                          >
                            <option value="video">VIDEO</option>
                            <option value="audio">MP3</option>
                          </select>
                          
                          {d.type === 'video' ? (
                            <select 
                              className="geometric-select" 
                              style={{ maxWidth: '180px' }} 
                              value={d.quality} 
                              onChange={(e) => updateQuality(d.id, e.target.value)} 
                              disabled={d.status === "ERROR"}
                            >
                              {(d.options || []).filter(o => o.id !== 'audio_only').map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.label}</option>
                              ))}
                            </select>
                          ) : (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 800, color: 'var(--accent-amber)' }}>
                              MP3 320K
                            </span>
                          )}
                        </div>
                      </td>
                      
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: d.status === 'ERROR' ? 'var(--accent-error)' : (d.status === 'COMPLETED' ? 'var(--accent-success)' : 'inherit') }}>
                            {d.status.startsWith('[DOWNLOAD]') ? `DOWNLOADING ${Math.round((d.progress || 0) * 100)}%` : 
                             (d.status.startsWith('[MERGER]') || d.status.startsWith('[EXTRACTAUDIO]') ? 'MERGING FFMPEG...' : d.status)}
                          </span>
                          
                          {(d.status === "WAITING" || d.status === "STARTING...") && (
                            <div className="progress-bar-track">
                              <div className="progress-bar-fill indeterminate" />
                            </div>
                          )}

                          {(d.progress !== undefined && d.status !== "COMPLETED" && d.status !== "ERROR" && d.status !== "READY" && d.status !== "WAITING" && d.status !== "STARTING...") && (
                            <div className="progress-bar-track">
                              <div className="progress-bar-fill" style={{ width: `${Math.max(8, (d.progress || 0) * 100)}%` }} />
                            </div>
                          )}

                          {d.status === "COMPLETED" && (
                            <button 
                              className="geometric-btn primary"
                              style={{ marginTop: '8px', padding: '6px 12px', fontSize: '11px', width: '100%' }}
                              onClick={() => triggerFileDownload(d.jobId, buildFileName(d), d.type)}
                              disabled={downloadingIds.has(d.jobId)}
                            >
                              <Icons.Download />
                              <span>{downloadingIds.has(d.jobId) ? 'PREPARANDO...' : (lang === 'es' ? 'GUARDAR' : 'SAVE')}</span>
                            </button>
                          )}
                        </div>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <button className="header-action-btn" onClick={() => removeDownload(d.id)} style={{ width: '32px', height: '32px', padding: 0, margin: '0 auto' }}>
                          <Icons.Trash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions Sticky Bar */}
            <div className="sticky-status-bar">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 800, color: 'var(--accent-amber)' }}>
                {downloads.length} {lang === 'es' ? 'EN COLA' : 'IN QUEUE'}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="geometric-btn" 
                  onClick={handleSaveCompleted} 
                  disabled={downloads.filter(d => d.status === "COMPLETED").length === 0}
                >
                  {lang === 'es' ? 'Guardar Completados' : 'Save Completed'}
                </button>
                <button 
                  className="geometric-btn primary" 
                  onClick={handleDownloadAll} 
                  disabled={downloads.filter(d => d.status === "READY").length === 0}
                >
                  ⚡ {lang === 'es' ? 'Descargar Todos' : 'Download All'}
                </button>
              </div>
            </div>

          </div>
        ))}
      </main>

      {/* Sidebar Drawer */}
      <div className={`backdrop ${isSidebarOpen ? 'visible' : ''}`} onClick={() => setIsSidebarOpen(false)} />
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-badge">
            <div className="brand-logo-icon">
              <AyeBrandLogo />
            </div>
            <div className="brand-title" style={{ fontSize: '16px' }}>
              AYE<span className="brand-title-accent">-VIDEO</span>
            </div>
          </div>
          <button className="header-action-btn" onClick={() => setIsSidebarOpen(false)} style={{ width: '32px', height: '32px', padding: 0 }}>
            <Icons.Close />
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`sidebar-nav-item ${activeTab === 'queue' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('queue'); setIsSidebarOpen(false); }}
          >
            <Icons.Queue />
            <span>{lang === 'es' ? 'Cola de Descargas' : 'Download Queue'}</span>
          </button>
          
          <button 
            className={`sidebar-nav-item ${activeTab === 'history' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }}
          >
            <Icons.History />
            <span>{lang === 'es' ? 'Historial de Descargas' : 'Download History'}</span>
          </button>
          
          <button 
            className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`} 
            onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
          >
            <Icons.Settings />
            <span>{lang === 'es' ? 'Preferencias' : 'Preferences'}</span>
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
            AYEAPPS SUITE // 2026
          </div>
          <button 
            className="sidebar-nav-item" 
            style={{ color: 'var(--accent-error)', borderColor: 'var(--accent-error)' }} 
            onClick={handleLogout}
          >
            <span>{lang === 'es' ? 'Cerrar Sesión' : 'Log Out'}</span>
          </button>
        </div>
      </aside>

      {/* Profile Popover */}
      <div className={`profile-popover ${isProfileOpen ? 'open' : ''}`}>
        <div className="profile-popover-header">
          <div className="profile-user-name">{(userName || (userEmail || 'USER').split('@')[0]).toUpperCase()}</div>
          <div className="profile-user-email">{(userEmail || 'user@ayeapps.com').toLowerCase()}</div>
          <div className="profile-user-tier">TIER: PRO // UNLIMITED</div>
        </div>
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            className="sidebar-nav-item" 
            style={{ padding: '10px 14px', fontSize: '12px' }}
            onClick={() => { setActiveTab('settings'); setIsProfileOpen(false); }}
          >
            <Icons.Settings />
            <span>{lang === 'es' ? 'Preferencias' : 'Preferences'}</span>
          </button>
          <button 
            className="sidebar-nav-item" 
            style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--accent-error)' }} 
            onClick={handleLogout}
          >
            <span>{lang === 'es' ? 'Cerrar Sesión' : 'Log Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
