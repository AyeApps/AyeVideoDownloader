/**
 * AyeApps Analytics Service (Google Analytics 4 / Telemetry)
 * 
 * Provides centralized event tracking and pageview monitoring.
 * Reads VITE_GA_MEASUREMENT_ID from environment variables.
 * Gracefully falls back if GA ID is missing or in offline environments.
 */

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
let isInitialized = false;

/**
 * Initialize Google Analytics 4 dynamically
 */
export const initGA = () => {
  if (typeof window === 'undefined') return;
  if (isInitialized) return;

  if (!GA_MEASUREMENT_ID) {
    if (import.meta.env.DEV) {
      console.log('[Analytics] No VITE_GA_MEASUREMENT_ID provided. Running in local debug mode.');
    }
    isInitialized = true;
    return;
  }

  try {
    // Inject gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize dataLayer and gtag function
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false, // Managed manually for SPA
      cookie_flags: 'SameSite=None;Secure'
    });

    isInitialized = true;
    if (import.meta.env.DEV) {
      console.log(`[Analytics] GA4 initialized with ID: ${GA_MEASUREMENT_ID}`);
    }
  } catch (err) {
    console.error('[Analytics] Failed to initialize GA4:', err);
  }
};

/**
 * Track a Page View in SPA mode
 * @param {string} path - URL path or virtual route (e.g. '/', '/login', '/app')
 * @param {string} title - Page title
 */
export const trackPageView = (path = window.location.pathname, title = document.title) => {
  if (typeof window === 'undefined') return;
  if (!isInitialized) initGA();

  if (window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
      page_location: window.location.href
    });
  }

  if (import.meta.env.DEV) {
    console.log(`[Analytics] PageView: ${path} — "${title}"`);
  }
};

/**
 * Track a Custom GA4 Event
 * @param {string} eventName - Name of the event
 * @param {Object} params - Additional event parameters
 */
export const trackEvent = (eventName, params = {}) => {
  if (typeof window === 'undefined') return;
  if (!isInitialized) initGA();

  if (window.gtag && GA_MEASUREMENT_ID) {
    window.gtag('event', eventName, params);
  }

  if (import.meta.env.DEV) {
    console.log(`[Analytics] Event: "${eventName}"`, params);
  }
};

/**
 * Specific Business Logic Telemetry Helpers
 */

export const trackAuthOpened = (source = 'nav_button') => {
  trackEvent('auth_opened', { source });
};

export const trackLoginSuccess = (method = 'email') => {
  trackEvent('login', { method });
};

export const trackVideoInspect = (url = '', platform = 'unknown') => {
  // Never log sensitive private parameters, just domain/platform
  trackEvent('video_inspect', {
    platform,
    has_url: Boolean(url)
  });
};

export const trackDownloadStart = ({ platform = 'unknown', formatType = 'video', quality = 'best' } = {}) => {
  trackEvent('download_start', {
    platform,
    format_type: formatType,
    quality
  });
};

export const trackDownloadSuccess = ({ platform = 'unknown', formatType = 'video', quality = 'best', durationSec = 0 } = {}) => {
  trackEvent('download_complete', {
    platform,
    format_type: formatType,
    quality,
    duration_seconds: Math.round(durationSec)
  });
};

export const trackDownloadError = ({ platform = 'unknown', error = 'Unknown error' } = {}) => {
  trackEvent('download_error', {
    platform,
    error_message: String(error).slice(0, 100)
  });
};

export const trackFaqOpened = (question = '') => {
  trackEvent('faq_interaction', {
    question_title: question.slice(0, 80)
  });
};

export const trackPreferenceChange = (type, value) => {
  trackEvent('preference_change', {
    preference_type: type,
    preference_value: value
  });
};

export default {
  initGA,
  trackPageView,
  trackEvent,
  trackAuthOpened,
  trackLoginSuccess,
  trackVideoInspect,
  trackDownloadStart,
  trackDownloadSuccess,
  trackDownloadError,
  trackFaqOpened,
  trackPreferenceChange
};
