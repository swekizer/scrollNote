import express from 'express';
import { snapsService } from '../services/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * Parses JWT without verifying signature (since Supabase handles verification on its end) 
 * but extracts the payload to check the claims.
 */
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

/**
 * @route GET /api/snaps
 * @desc Get all snaps for a user
 * @access Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    let userEmail = req.query.email;
    
    console.log('GET /api/snaps - Token: Present');
    console.log('GET /api/snaps - User Email Claim:', userEmail);
    

    // Attempt to decode the JWT to extract the actual email
    const decodedToken = parseJwt(token);
    if (decodedToken && decodedToken.email) {
      // Overwrite the requested email with the one from the authenticated token
      userEmail = decodedToken.email;
    } else if (!userEmail) {
       return res.status(401).json({ 
        error: true, 
        message: 'Invalid token structure or missing email' 
      });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const snaps = await snapsService.getSnaps(userEmail, token, page, limit);
    console.log('Snaps retrieved from Supabase:', snaps);
    res.json(snaps);
  } catch (error) {
    console.error('Error fetching snaps:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Failed to fetch snaps' 
    });
  }
});

/**
 * @route POST /api/snaps
 * @desc Create a new snap
 * @access Private
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const snapData = req.body;
    
    if (!snapData.user_email || !snapData.text || !snapData.url) {
      return res.status(400).json({ 
        error: true, 
        message: 'Missing required snap data' 
      });
    }
    
    const newSnap = await snapsService.createSnap(snapData, token);
    res.status(201).json(newSnap);
  } catch (error) {
    console.error('Error creating snap:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Failed to create snap' 
    });
  }
});

export default router;