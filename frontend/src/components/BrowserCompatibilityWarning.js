import React, { useEffect, useState } from 'react';
import { checkBrowserCompatibility } from '../utils/browserCompatibility';
import './BrowserCompatibilityWarning.css';

const BrowserCompatibilityWarning = () => {
  const [compatibility, setCompatibility] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = checkBrowserCompatibility();
    setCompatibility(check);
    
    // Check if user has dismissed the warning
    const dismissedWarning = localStorage.getItem('browser-warning-dismissed');
    if (dismissedWarning === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('browser-warning-dismissed', 'true');
    } catch (e) {
      // Ignore localStorage errors
    }
  };

  if (!compatibility || dismissed) {
    return null;
  }

  // Only show warnings, not critical issues (critical issues would prevent the app from working)
  if (compatibility.warnings.length === 0 && compatibility.compatible) {
    return null;
  }

  return (
    <div className="browser-compatibility-warning">
      <div className="warning-content">
        <h3>Browser Compatibility Notice</h3>
        {!compatibility.compatible && compatibility.issues.length > 0 && (
          <div className="critical-issues">
            <p><strong>Critical Issues:</strong></p>
            <ul>
              {compatibility.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
        {compatibility.warnings.length > 0 && (
          <div className="warnings">
            <p><strong>Warnings:</strong></p>
            <ul>
              {compatibility.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="browser-info">
          Detected browser: <strong>{compatibility.browser}</strong>
        </p>
        <button onClick={handleDismiss} className="dismiss-button">
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default BrowserCompatibilityWarning;

