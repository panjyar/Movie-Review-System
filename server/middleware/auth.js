// server/middleware/auth.js

import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  // Get token from the Authorization header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if no token is found
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Use jwt.verify to decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Attach the user payload to the request object
    req.user = decoded;
    
    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    // Handle invalid tokens (expired, malformed, etc.)
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default protect;