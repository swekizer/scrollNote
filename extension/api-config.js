/**
 * scrollNote Extension API Configuration
 *
 * Loads custom API/Website URLs from chrome.storage.local if set.
 * Falls back to environment-based defaults (auto-detected).
 *
 * Usage in other scripts:
 *   await window.SCROLLNOTE_CONFIG_READY;
 *   console.log(API_URL, WEBSITE_URL);
 */

const DEFAULT_CONFIG = {
  development: {
    apiUrl: "http://localhost:5000",
    websiteUrl: "http://localhost:5173",
  },
  production: {
    apiUrl: "https://scrollnote.onrender.com",
    websiteUrl: "https://scroll-note.vercel.app",
  },
};

// Auto-detect environment: unpacked extensions lack an update_url
const isDevelopment = !("update_url" in chrome.runtime.getManifest());
const SCROLLNOTE_ENV = isDevelopment ? "development" : "production";
const SHOW_DEV_SETTINGS = false;

// Initialize with defaults synchronously so scripts don't crash if they don't await
let API_URL = DEFAULT_CONFIG[SCROLLNOTE_ENV].apiUrl;
let WEBSITE_URL = DEFAULT_CONFIG[SCROLLNOTE_ENV].websiteUrl;

// Async loader that overrides with stored custom values
globalThis.SCROLLNOTE_CONFIG_READY = (async () => {
  try {
    const stored = await chrome.storage.local.get([
      "customApiUrl",
      "customWebsiteUrl",
    ]);
    if (stored.customApiUrl) API_URL = stored.customApiUrl;
    if (stored.customWebsiteUrl) WEBSITE_URL = stored.customWebsiteUrl;
  } catch (err) {
    console.warn("scrollNote: Failed to load custom config from storage:", err);
  }
  // Update globals
  globalThis.API_URL = API_URL;
  globalThis.WEBSITE_URL = WEBSITE_URL;
  return { apiUrl: API_URL, websiteUrl: WEBSITE_URL };
})();

// Expose current env
globalThis.SCROLLNOTE_ENV = SCROLLNOTE_ENV;
globalThis.SCROLLNOTE_SHOW_SETTINGS = SHOW_DEV_SETTINGS;

// Settings management helpers for UI
globalThis.scrollNoteSettings = {
  async setApiUrl(url) {
    await chrome.storage.local.set({ customApiUrl: url || null });
    API_URL = url || DEFAULT_CONFIG[SCROLLNOTE_ENV].apiUrl;
    globalThis.API_URL = API_URL;
  },
  async setWebsiteUrl(url) {
    await chrome.storage.local.set({ customWebsiteUrl: url || null });
    WEBSITE_URL = url || DEFAULT_CONFIG[SCROLLNOTE_ENV].websiteUrl;
    globalThis.WEBSITE_URL = WEBSITE_URL;
  },
  async reset() {
    await chrome.storage.local.remove(["customApiUrl", "customWebsiteUrl"]);
    API_URL = DEFAULT_CONFIG[SCROLLNOTE_ENV].apiUrl;
    WEBSITE_URL = DEFAULT_CONFIG[SCROLLNOTE_ENV].websiteUrl;
    globalThis.API_URL = API_URL;
    globalThis.WEBSITE_URL = WEBSITE_URL;
  },
  async getCustom() {
    return await chrome.storage.local.get(["customApiUrl", "customWebsiteUrl"]);
  },
};
