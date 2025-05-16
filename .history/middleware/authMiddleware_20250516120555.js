// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Special handling for our base64 encoded mock tokens
    if (token.split('.').length === 3) {
      try {
        // Extract the payload part (second segment)
        const parts = token.split('.');
        
        try {
          // Try to decode base64 payload
          let payload;
          try {
            // For browser generated tokens (using btoa)
            payload = JSON.parse(atob(parts[1]));
          } catch (e) {
            // For NodeJS generated tokens (using Buffer)
            payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          }
          
          // Check if token is expired
          if (payload.exp && payload.exp < Date.now()) {
            console.log('Token expired');
            return res.status(401).json({ message: 'Token expired' });
          }
          
          // Set user info from token
          req.user = {
            userId: payload.userId || payload.sub || payload.id || 'unknown',
            role: payload.role || 'Recipient',
            email: payload.email
          };
          
          console.log('Using decoded token data for user:', req.user.userId);
          return next();
        } catch (e) {
          console.error('Error decoding token payload:', e);
        }
        
        // If decoding fails, try standard JWT verification
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-key');
          req.user = decoded;
          console.log('Using JWT verified token for user:', req.user.userId);
          return next();
        } catch (jwtError) {
          console.log('JWT verification failed, using fallback');
        }
      } catch (e) {
        console.error('Token parsing error:', e);
      }
    }
      // For development/testing, accept any token as valid
    if (process.env.NODE_ENV !== 'production') {
      console.log('Using development token bypass');
      // Create a valid MongoDB ObjectId for dev user
      const validObjectId = new mongoose.Types.ObjectId();
      req.user = { 
        userId: validObjectId.toString(), // Convert ObjectId to string but in valid ObjectId format
        role: 'Recipient'
      };
      return next();
    }
    
    return res.status(401).json({ message: 'Invalid token format' });
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin only' });
  }
};
