import User from '../models/User.js';

// CRITICAL FIX: Changed req.user.id to req.user._id
export const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id); // FIXED: was req.user.id
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default adminOnly;