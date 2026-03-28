// Central config for extension endpoints.
// Keep extension and website in the same mode to avoid token/env mismatch.

// Auto-detect environment based on chrome.runtime.id (unpacked extensions have different IDs or we can check install type)
const isDevelopment = !('update_url' in chrome.runtime.getManifest());
const SCROLLNOTE_ENV = isDevelopment ? 'development' : 'production';

const SCROLLNOTE_CONFIG = {
	development: {
		apiUrl: 'http://localhost:5000',
		websiteUrl: 'http://localhost:3000'
	},
	production: {
		apiUrl: 'https://scrollnote-backend.onrender.com', // Ensure correct production API URL is set here
		websiteUrl: 'https://scrollnote-home.onrender.com'
	}
};

const API_URL = SCROLLNOTE_CONFIG[SCROLLNOTE_ENV].apiUrl;
const WEBSITE_URL = SCROLLNOTE_CONFIG[SCROLLNOTE_ENV].websiteUrl;