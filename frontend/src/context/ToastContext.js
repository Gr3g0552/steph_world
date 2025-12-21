import React, { createContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';

export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ message: null, type: 'info' });

  const showToast = useCallback((message, type = 'info', duration = 1000) => {
    setToast({ message, type, duration });
  }, []);

  const hideToast = useCallback(() => {
    setToast({ message: null, type: 'info' });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
        duration={toast.duration}
      />
    </ToastContext.Provider>
  );
};

