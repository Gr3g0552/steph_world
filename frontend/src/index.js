// Import polyfills first for older browser support
import './utils/polyfills';

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Use createRoot for React 18+, fallback to render for older React versions
const rootElement = document.getElementById('root');

if (rootElement && ReactDOM.createRoot) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  // Fallback for older React versions (shouldn't be needed with React 18)
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    rootElement
  );
}

