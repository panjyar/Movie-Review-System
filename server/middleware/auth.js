import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'No token, authorization denied' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // FIX: Standardize user ID fields for consistency
    req.user = {
      id: decoded.userId,        // For frontend compatibility
      userId: decoded.userId,    // For backend compatibility
      _id: decoded.userId        // For MongoDB compatibility
    };
    
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: 'Token is not valid' 
    });
  }
};