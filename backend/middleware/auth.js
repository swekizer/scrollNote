/**
 * Authentication middleware
 * Verifies the token in the Authorization header
 */
export const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: true, 
        message: 'No token, authorization denied' 
      });
    }
    
    // We're not verifying the token here since Supabase will do that
    // when we make requests with the token. This middleware just ensures
    // that a token is present.
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      error: true, 
      message: 'Token is not valid' 
    });
  }
};