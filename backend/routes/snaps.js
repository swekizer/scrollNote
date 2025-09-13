import express from 'express';
import { snapsService } from '../services/supabase.js';

const router = express.Router();

/**
 * @route GET /api/snaps
 * @desc Root route for snaps API
 * @access Public
 */
router.get('/', (req, res) => {
  // Check if this is an informational request without authentication
  if (!req.headers.authorization) {
    return res.status(200).json({
      message: 'Snaps API',
      usage: 'Send a GET request with authentication to retrieve user snaps',
      required_headers: ['Authorization'],
      required_query: ['email']
    });
  }
  
  // If authentication is provided, the existing handler will process the request
}); 

/**
 * @route GET /api/snaps
 * @desc Get all snaps for a user
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const userEmail = req.query.email;
    
    if (!token || !userEmail) {
      return res.status(401).json({ 
        error: true, 
        message: 'Authentication required' 
      });
    }
    
    const snaps = await snapsService.getSnaps(userEmail, token);
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
router.post('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const snapData = req.body;
    
    if (!token) {
      return res.status(401).json({ 
        error: true, 
        message: 'Authentication required' 
      });
    }
    
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