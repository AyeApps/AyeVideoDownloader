import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { useAuthStore } from './src/store/useAuthStore';
import { useUIStore } from './src/store/useUIStore';
import { AuthScreen } from './src/components/auth/AuthScreen';
import { MainScreen } from './src/components/video/MainScreen';
import { AnimatedDotBackground } from './src/components/canvas/AnimatedDotBackground';

export default function App() {
  const { user, isAuthenticated, initAuth, isInitializing } = useAuthStore();
  const { themeMode, themeColors, initTheme } = useUIStore();

  useEffect(() => {
    initAuth();
    initTheme();
  }, [initAuth, initTheme]);

  // Inject web CSS directly into document.head to guarantee 100% active animations in browser
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'ayevideo-master-animations';
      let styleTag = document.getElementById(styleId) as HTMLStyleElement;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
      }

      styleTag.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;700;800;900&display=swap');

        /* 1. Canvas Grid Motion */
        @keyframes gridMove {
          0% { background-position: 0px 0px; }
          100% { background-position: 32px 32px; }
        }

        /* 2. Telemetry Pulse */
        .telemetry-pulse {
          animation: pulseGreen 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulseGreen {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `;
    }
  }, []);

  if (isInitializing) return null;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bgBase }]}>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />
      {/* Background Animated Matrix Grid Canvas */}
      <AnimatedDotBackground />
      {isAuthenticated ? <MainScreen /> : <AuthScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
