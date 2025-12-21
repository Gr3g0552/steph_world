// Browser compatibility checker and feature detection

export const checkBrowserCompatibility = () => {
  const issues = [];
  const warnings = [];

  // Check for required features
  if (typeof localStorage === 'undefined') {
    issues.push('localStorage is not supported. Some features may not work.');
  }

  if (typeof fetch === 'undefined' && typeof XMLHttpRequest === 'undefined') {
    issues.push('No HTTP request method available. The app cannot function.');
  }

  if (typeof Promise === 'undefined') {
    issues.push('Promises are not supported. The app may not function correctly.');
  }

  // Check for recommended features
  if (typeof CSS === 'undefined' || !CSS.supports) {
    warnings.push('CSS.supports is not available. Some styling may not work as expected.');
  }

  if (!window.requestAnimationFrame) {
    warnings.push('requestAnimationFrame is not available. Animations may be less smooth.');
  }

  // Check for modern features that enhance experience
  if (!('IntersectionObserver' in window)) {
    warnings.push('IntersectionObserver is not available. Lazy loading may not work.');
  }

  if (!('ResizeObserver' in window)) {
    warnings.push('ResizeObserver is not available. Some responsive features may not work.');
  }

  return {
    compatible: issues.length === 0,
    issues,
    warnings,
    userAgent: navigator.userAgent,
    browser: detectBrowser()
  };
};

const detectBrowser = () => {
  const ua = navigator.userAgent;
  
  if (ua.indexOf('Firefox') > -1) {
    return 'Firefox';
  } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
    return 'Chrome';
  } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    return 'Safari';
  } else if (ua.indexOf('Edg') > -1) {
    return 'Edge';
  } else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) {
    return 'Internet Explorer';
  } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
    return 'Opera';
  }
  
  return 'Unknown';
};

// Graceful degradation for unsupported features
export const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage.getItem failed:', e);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage.setItem failed:', e);
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('localStorage.removeItem failed:', e);
    }
  }
};

// Safe JSON parse with fallback
export const safeJSONParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn('JSON.parse failed:', e);
    return fallback;
  }
};

// Safe async/await wrapper
export const safeAsync = async (asyncFn, fallback = null) => {
  try {
    return await asyncFn();
  } catch (e) {
    console.error('Async operation failed:', e);
    return fallback;
  }
};

