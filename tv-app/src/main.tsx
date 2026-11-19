// Starts the Jelly Pals TV when the page is opened as the TV screen (the link ending in #tv).
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './tv.css';

(() => {
  if (!window.HU?.isTV) return;
  const mount = document.getElementById('tvRoot');
  if (!mount) return;
  document.body.classList.add('is-tv');
  mount.hidden = false;
  window.addEventListener('hashchange', () => location.reload());
  createRoot(mount).render(<App />);
})();
