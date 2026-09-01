import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { THEME } from '../../constants/theme';
import { LogOut, Trash2, Download, Plus } from 'lucide-react-native';
import { authStorage } from '../../services/authStorage';

const API_BASE_URL = 'https://back-ayvddw.ayeapps.com';

export const MainScreen = () => {
  const { user, logout } = useAuthStore();
  const { themeColors } = useUIStore();
  const { language } = useLanguageStore();
  const colors = themeColors;

  const [linkInput, setLinkInput] = useState('');
  const [downloads, setDownloads] = useState<any[]>([]);
  
  const handleAddLink = async () => {
    let rawUrl = linkInput.trim();
    if (!rawUrl) return;
    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      rawUrl = 'https://' + rawUrl;
    }
    
    setLinkInput('');
    const id = Date.now();
    const newDownload = {
      id,
      url: rawUrl,
      type: 'video',
      name: language === 'es' ? "DETECTANDO INFORMACIÓN..." : "DETECTING VIDEO...",
      status: "FETCHING",
      quality: "best",
    };
    
    setDownloads(prev => [...prev, newDownload]);
    
    try {
      const token = await authStorage.getAccessToken();
      const res = await fetch(`${API_BASE_URL}/api/formats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: rawUrl })
      });
      
      if (!res.ok) throw new Error("Error detecting formats");
      
      const data = await res.json();
      
      setDownloads(prev => prev.map(d => 
        d.id === id ? { 
          ...d, 
          name: data.title || "Unknown Video", 
          options: data.formats || [], 
          status: "READY"
        } : d
      ));
    } catch (err) {
      setDownloads(prev => prev.map(d => 
        d.id === id ? { 
          ...d, 
          name: language === 'es' ? "ERROR AL DETECTAR VIDEO" : "ERROR DETECTING VIDEO", 
          status: "ERROR" 
        } : d
      ));
    }
  };

  const handleDownload = async (d: any) => {
    setDownloads(prev => prev.map(item => item.id === d.id ? { ...item, status: "DOWNLOADING" } : item));
    try {
      const token = await authStorage.getAccessToken();
      const res = await fetch(`${API_BASE_URL}/api/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          url: d.url,
          format: 'videoMP4',
          quality: d.quality,
          selected_format_id: d.quality
        })
      });
      
      const data = await res.json();
      if (data && data.job_id) {
        pollDownloadStatus(d.id, data.job_id);
      } else {
        throw new Error("No job id");
      }
    } catch {
      setDownloads(prev => prev.map(item => item.id === d.id ? { ...item, status: "ERROR" } : item));
    }
  };

  const pollDownloadStatus = async (id: number, jobId: string) => {
    try {
      const token = await authStorage.getAccessToken();
      const res = await fetch(`${API_BASE_URL}/api/download/${jobId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'done' || data.status === 'DONE') {
        setDownloads(prev => prev.map(d => d.id === id ? { ...d, status: "COMPLETED", jobId } : d));
        const downloadUrl = `${API_BASE_URL}/api/download/${jobId}/file?token=${encodeURIComponent(token || '')}`;
        Linking.openURL(downloadUrl);
      } else if (data.status === 'error' || data.status === 'FAILED') {
        setDownloads(prev => prev.map(d => d.id === id ? { ...d, status: "ERROR" } : d));
      } else {
        setTimeout(() => pollDownloadStatus(id, jobId), 1500);
      }
    } catch {
      setTimeout(() => pollDownloadStatus(id, jobId), 3000);
    }
  };

  const removeDownload = (id: number) => {
    setDownloads(prev => prev.filter(d => d.id !== id));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgBase }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderMuted }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>AYE VIDEO</Text>
        <TouchableOpacity onPress={logout} style={[styles.iconButton, { borderColor: colors.borderMuted }]}>
          <LogOut size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.inputContainer, { borderColor: colors.borderMuted, backgroundColor: colors.bgSecondary }]}>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder={language === 'es' ? "Pega el enlace del video aquí..." : "Paste video link here..."}
            placeholderTextColor={colors.textMuted}
            value={linkInput}
            onChangeText={setLinkInput}
            onSubmitEditing={handleAddLink}
          />
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.accent }]}
            onPress={handleAddLink}
          >
            <Plus size={20} color={colors.bgInvert} />
          </TouchableOpacity>
        </View>

        {downloads.map(d => (
          <View key={d.id} style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderMuted }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>{d.name}</Text>
              <TouchableOpacity onPress={() => removeDownload(d.id)}>
                <Trash2 size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.cardActions}>
              <Text style={[styles.status, { color: colors.accent }]}>{d.status}</Text>
              
              {d.status === 'READY' && (
                <TouchableOpacity 
                  style={[styles.downloadBtn, { backgroundColor: colors.accent }]}
                  onPress={() => handleDownload(d)}
                >
                  <Download size={16} color={colors.bgInvert} />
                  <Text style={[styles.btnText, { color: colors.bgInvert }]}>
                    {language === 'es' ? "Descargar" : "Download"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    borderBottomWidth: THEME.borders.thin,
  },
  title: {
    fontFamily: THEME.fonts.bold,
    fontSize: 20,
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 36, height: 36,
    borderWidth: THEME.borders.thin,
    borderRadius: THEME.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  scrollContent: { padding: THEME.spacing.lg, gap: THEME.spacing.md },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: THEME.borders.thick,
    borderRadius: THEME.radius.sm,
    padding: THEME.spacing.xs,
  },
  input: {
    flex: 1,
    paddingHorizontal: THEME.spacing.sm,
    fontFamily: THEME.fonts.mono,
    fontSize: 14,
  },
  addButton: {
    width: 44, height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: THEME.radius.xs,
  },
  card: {
    borderWidth: THEME.borders.thin,
    borderRadius: THEME.radius.sm,
    padding: THEME.spacing.md,
    gap: THEME.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: THEME.fonts.bold,
    fontSize: 16,
    flex: 1,
    marginRight: THEME.spacing.sm,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    fontFamily: THEME.fonts.mono,
    fontSize: 12,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.radius.xs,
    gap: THEME.spacing.xs,
  },
  btnText: {
    fontFamily: THEME.fonts.bold,
    fontSize: 14,
  }
});
