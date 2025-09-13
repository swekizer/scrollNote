import express from 'express';
import { snapsService } from '../services/supabase.js';

const router = express.Router();

/**
 * @route GET /api/snaps
 * @desc Get all snaps for a user
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const userEmail = req.query.email;
    
    console.log('GET /api/snaps - Token:', token ? 'Present' : 'Missing');
    console.log('GET /api/snaps - User Email:', userEmail);
    
    if (!token || !userEmail) {
      return res.status(401).json({ 
        error: true, 
        message: 'Authentication required' 
      });
    }
    
    const snaps = await snapsService.getSnaps(userEmail, token);
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