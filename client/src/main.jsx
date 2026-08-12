import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: { fontSize: '14px' },
        success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }}
    />
  </React.StrictMode>
);
