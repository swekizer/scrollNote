import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

/**
 * Authentication service for Supabase
 */
export const authService = {
  /**
   * Sign in a user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Authentication response
   */
  async signIn(email, password) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ email, password })
    });
    
    return response.json();
  },
  
  /**
   * Sign up a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Sign up response
   */
  async signUp(email, password) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ email, password })
    });
    
    return response.json();
  }
};

/**
 * Snaps service for Supabase
 */
export const snapsService = {
  /**
   * Get all snaps for a user
   * @param {string} userEmail - User email
   * @param {string} token - User authentication token
   * @param {number} [page=1] - Page number (1-indexed)
   * @param {number} [limit=20] - Number of items per page
   * @returns {Promise<Array>} - Array of snaps
   */
  async getSnaps(userEmail, token, page = 1, limit = 20) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20)); // Max 100 items per request
    const offset = (pageNum - 1) * limitNum;
    const end = offset + limitNum - 1;

    const url = `${SUPABASE_URL}/rest/v1/snaps?user_email=eq.${encodeURIComponent(userEmail)}&order=created_at.desc&limit=${limitNum}&offset=${offset}`;
    console.log('Supabase query URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Range': `${offset}-${end}` // Supabase expects a Range header for pagination
      }
    });
    
    console.log('Supabase response status:', response.status);
    const data = await response.json();
    console.log('Supabase response data:', data);
    
    return data;
  },
  
  /**
   * Create a new snap
   * @param {Object} snapData - Snap data
   * @param {string} token - User authentication token
   * @returns {Promise<Object>} - Created snap
   */
  async createSnap(snapData, token) {
    console.log('Creating snap with data:', snapData);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/snaps`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(snapData)
    });
    
    console.log('Snap creation response status:', response.status);
    const data = await response.json();
    console.log('Snap creation response data:', data);
    
    return data;
  }
};

/**
 * Storage service for Supabase
 */
export const storageService = {
  /**
   * Upload a file to Supabase storage
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - File name
   * @param {string} userEmail - User email
   * @param {string} token - User authentication token
   * @returns {Promise<string>} - File URL
   */
  async uploadFile(fileBuffer, fileName, userEmail, token) {
    // Sanitize inputs to prevent path traversal
    const safeEmail = String(userEmail).replace(/[^a-zA-Z0-9@._-]/g, '');
    const safeFileName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '');
    
    if (!safeEmail || !safeFileName) {
      throw new Error('Invalid user email or file name');
    }

    const path = `screenshots/${safeEmail}/${safeFileName}`;
    
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${path}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream'
      },
      body: fileBuffer
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload file: ${errorText}`);
    }
    
    return `${SUPABASE_URL}/storage/v1/object/public/${path}`;
  }
};