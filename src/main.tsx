import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Automatically unregister any stale dev service workers and caches from previous sessions
if (import.meta.env.DEV && typeof window !== 'undefined') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        if (registrations.length > 0) {
          Promise.all(registrations.map((reg) => reg.unregister())).then(() => {
            if ('caches' in window) {
              caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
            }
          });
        }
      })
      .catch(() => {});
  }
  if ('caches' in window) {
    caches
      .keys()
      .then((keys) => {
        keys.forEach((key) => {
          caches.delete(key).catch(() => {});
        });
      })
      .catch(() => {});
  }
}

createRoot(document.getElementById('root')!).render(<App />);

