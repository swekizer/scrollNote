import express from 'express';
import { authService } from '../services/supabase.js';

const router = express.Router();

/**
 * @route GET /api/auth
 * @desc Root route for auth API
 * @access Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Auth API',
    endpoints: [
      '/signin - User authentication',
      '/signup - User registration'
    ]
  });
});

/**
 * @route GET /api/auth/signin
 * @desc Provide information about the signin endpoint
 * @access Public
 */
router.get('/signin', (req, res) => {
  res.status(200).json({
    message: 'Authentication endpoint',
    usage: 'Send a POST request to this endpoint with email and password in the request body',
    required_fields: ['email', 'password']
  });
});

/**
 * @route POST /api/auth/signin
 * @desc Sign in a user
 * @access Public
 */
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: true, 
        message: 'Email and password are required' 
      });
    }
    
    const data = await authService.signIn(email, password);
    
    if (data.error) {
      return res.status(401).json({ 
        error: true, 
        message: data.error_description || 'Authentication failed' 
      });
    }
    
    res.json({
      user: {
        email,
        token: data.access_token
      }
    });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({ 
      error: true, 
      message: 'An error occurred during sign in' 
    });
  }
});

/**
 * @route GET /api/auth/signup
 * @desc Provide information about the signup endpoint
 * @access Public
 */
router.get('/signup', (req, res) => {
  res.status(200).json({
    message: 'Registration endpoint',
    usage: 'Send a POST request to this endpoint with email and password in the request body',
    required_fields: ['email', 'password']
  });
});

/**
 * @route POST /api/auth/signup
 * @desc Register a new user
 * @access Public
 */
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: true, 
        message: 'Email and password are required' 
      });
    }
    
    const data = await authService.signUp(email, password);
    
    if (data.error) {
      return res.status(400).json({ 
        error: true, 
        message: data.msg || 'Registration failed' 
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for confirmation.'
    });
  } catch (error) {
    console.error('Sign up error:', error);
    res.status(500).json({ 
      error: true, 
      message: 'An error occurred during registration' 
    });
  }
});

export default router;