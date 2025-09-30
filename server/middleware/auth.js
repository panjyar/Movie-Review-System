// middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // You need to import the User model

export const protect = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token, authorization denied'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user from the DB using the ID from the token
    // Exclude the password field from the result
    req.user = await User.findById(decoded.userId).select('-password');

    if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found, authorization denied' });
    }
    
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};