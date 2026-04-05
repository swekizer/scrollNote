import express from 'express';
import { storageService } from '../services/supabase.js';
import { authMiddleware } from '../middleware/auth.js';

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
router.post('/upload', authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const { fileData, fileName } = req.body;
    const userEmail = req.user?.email;
    
    if (!userEmail) {
      return res.status(401).json({
        error: true,
        message: 'Authenticated user email not found',
      });
    }
    
    if (!fileData || !fileName) {
      return res.status(400).json({ 
        error: true, 
        message: 'File data and file name are required' 
      });
    }
    
    // Safely parse the base64 string
    const parts = fileData.split(',');
    
    // Check if it was malformed or missing the explicit data-URI prefix
    const base64Data = parts.length > 1 ? parts[1] : parts[0];

    if (!base64Data) {
       return res.status(400).json({ 
        error: true, 
        message: 'Invalid base64 payload provided' 
      });
    }

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
      message: 'Failed to upload file',
      details:
        process.env.NODE_ENV === 'production'
          ? undefined
          : error.message,
    });
  }
});

export default router;
