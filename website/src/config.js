const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Default to 5000 if frontend is 5174 but backend was on 5000 in your set up. 
// Assuming it's typically on 3000 for your old setup. Let's use standard relative if not dev, else localhost:3000
export const API_BASE_URL = isDev ? 'http://localhost:5000/api' : '/api';
