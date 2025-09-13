import express from 'express';
import { storageService } from '../services/supabase.js';

const router = express.Router();

/**
 * @route GET /api/storage
 * @desc Root route for storage API
 * @access Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Storage API',
    endpoints: [
      '/upload - Upload files to storage'
    ],
    note: 'Authentication required for all endpoints'
  });
});

/**
 * @route POST /api/storage/upload
 * @desc Upload a file to Supabase storage
 * @access Private
 */
router.post('/upload', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { fileData, fileName, userEmail } = req.body;
    
    if (!token || !userEmail) {
      return res.status(401).json({ 
        error: true, 
        message: 'Authentication required' 
      });
    }
    
    if (!fileData || !fileName) {
      return res.status(400).json({ 
        error: true, 
        message: 'File data and file name are required' 
      });
    }
    
    // Convert base64 to buffer
    const base64Data = fileData.split(',')[1];
    const fileBuffer = Buffer.from(base64Data, 'base64');
    
    const fileUrl = await storageService.uploadFile(
      fileBuffer, 
      fileName, 
      userEmail, 
      token
    );
    
    res.json({ fileUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ 
      error: true, 
      message: 'Failed to upload file' 
    });
  }
});

export default router;