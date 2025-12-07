import { createRoot } from "react-dom/client";
// Polyfill helper: ensure adoptedStyleSheets has array methods in browsers
// where it is a DOM list without Array prototype (prevents errors in some dev tools/browsers)
try {
  if (typeof document !== "undefined" && document.adoptedStyleSheets) {
    const proto = Object.getPrototypeOf(document.adoptedStyleSheets);
    if (proto && !proto.filter) {
      proto.filter = Array.prototype.filter;
      proto.map = Array.prototype.map;
      proto.forEach = Array.prototype.forEach;
    }
  }
} catch (e) {
  // ignore — non-critical
}

// Global fetch wrapper: automatically prepend API base to relative paths
try {
  const _fetch = window.fetch.bind(window);
  // Use environment variable, or fallback to localhost for development
  const API_BASE = (
    import.meta.env.VITE_API_BASE ||
    window.__API_BASE__ ||
    "http://localhost:5000"
  ).replace(/\/$/, "");

  console.log('API Base URL:', API_BASE);

  window.fetch = (input, init = {}) => {
    try {
      // If input is a relative path (starts with '/'), forward to backend API base
      if (typeof input === 'string' && input.startsWith('/')) {
        input = API_BASE + input;
      }

      // Pass credentials for all fetch requests to support session cookies
      init = init || {};
      init.credentials = init.credentials || 'include';
    } catch (e) {
      console.warn('fetch wrapper error', e);
    }
    return _fetch(input, init);
  };
} catch (e) {}

import App from "./App.jsx";
import { BrowserRouter, HashRouter } from "react-router-dom";
import "./index.css";

// Use HashRouter for GitHub Pages compatibility (avoids 404s on refresh)
// Check if we're on GitHub Pages or if explicitly set
const isGitHubPages = import.meta.env.GITHUB_PAGES === 'true' ||
                      window.location.hostname.includes('github.io');
const Router = isGitHubPages ? HashRouter : BrowserRouter;

createRoot(document.getElementById("root")).render(
  <Router>
    <App />
  </Router>
);
