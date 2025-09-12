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
   * @returns {Promise<Array>} - Array of snaps
   */
  async getSnaps(userEmail, token) {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/snaps?user_email=eq.${encodeURIComponent(userEmail)}&order=created_at.desc`, 
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.json();
  },
  
  /**
   * Create a new snap
   * @param {Object} snapData - Snap data
   * @param {string} token - User authentication token
   * @returns {Promise<Object>} - Created snap
   */
  async createSnap(snapData, token) {
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
    
    return response.json();
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
    const path = `screenshots/${userEmail}/${fileName}`;
    
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