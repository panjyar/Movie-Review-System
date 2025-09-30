// routes/user.js
import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Movie from '../models/Movie.js';
import Review from '../models/Review.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// --- NO CHANGES TO THE ROUTES BELOW ---

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('watchlist.movie', 'title posterPath averageRating releaseDate genres')
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const reviewCount = await Review.countDocuments({ user: user._id });

    const recentReviews = await Review.find({ user: user._id })
      .populate('movie', 'title posterPath')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      user,
      stats: {
        reviewCount,
        watchlistCount: user.watchlist.length,
        followersCount: user.followers.length,
        followingCount: user.following.length
      },
      recentReviews
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// --- CHANGES START HERE ---

// ** CORRECTED AND CONSOLIDATED: Update user profile **
router.put('/:id', protect, [
  // Add validation for all fields from your frontend form
  body('username').optional().trim().isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters'),
  body('email').optional().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  body('profilePicture').optional().isURL().withMessage('Profile picture must be a valid URL'),
  body('favoriteGenres').optional().isArray().withMessage('Favorite genres must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Send back the first error message for better frontend display
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    // Since the middleware now attaches the full user object, req.user._id is available
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only update your own profile.' });
    }

    const { username, email, bio, profilePicture, favoriteGenres } = req.body;
    const updateData = {};

    // Build the update object with only the fields that were provided
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (bio !== undefined) updateData.bio = bio;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (favoriteGenres !== undefined) updateData.favoriteGenres = favoriteGenres;

    // Check if the new username or email is already taken by ANOTHER user
    if (username || email) {
      const existingUser = await User.findOne({
        $or: [{ username }, { email }],
        _id: { $ne: req.params.id } // Exclude the current user from the search
      });
      
      if (existingUser) {
        if (existingUser.username === username) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }
        if (existingUser.email === email) {
            return res.status(400).json({ success: false, message: 'Email already in use' });
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData }, // Use $set for safer updates
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });

  } catch (error) {
    console.error('Profile update error:', error);
    // Forward Mongoose validation errors to the global error handler
    if (error.name === 'ValidationError') {
      return next(error);
    }
    res.status(500).json({ success: false, message: 'Server error occurred during profile update' });
  }
});

// --- CHANGES END HERE ---


// --- NO CHANGES TO THE ROUTES BELOW ---

// Get user's watchlist
router.get('/:id/watchlist', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate({
        path: 'watchlist.movie',
        select: 'title posterPath averageRating totalReviews releaseDate genres runtime'
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sortedWatchlist = user.watchlist.sort((a, b) =>
      new Date(b.dateAdded) - new Date(a.dateAdded)
    );

    res.json(sortedWatchlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add movie to watchlist
router.post('/:id/watchlist', protect, [
  body('movieId').isMongoId().withMessage('Valid movie ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { movieId } = req.body;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isInWatchlist = user.watchlist.some(
      item => item.movie.toString() === movieId
    );

    if (isInWatchlist) {
      return res.status(400).json({ message: 'Movie already in watchlist' });
    }

    user.watchlist.push({
      movie: movieId,
      dateAdded: new Date()
    });

    await user.save();
    await user.populate('watchlist.movie', 'title posterPath averageRating');

    res.status(201).json({
      message: 'Movie added to watchlist',
      watchlistItem: user.watchlist[user.watchlist.length - 1]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove movie from watchlist
router.delete('/:id/watchlist/:movieId', protect, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.watchlist = user.watchlist.filter(
      item => item.movie.toString() !== req.params.movieId
    );

    await user.save();

    res.json({ message: 'Movie removed from watchlist' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Follow user
router.post('/:id/follow', protect, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    if (currentUser.following.includes(req.params.id)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    currentUser.following.push(req.params.id);
    userToFollow.followers.push(req.user._id);

    await Promise.all([currentUser.save(), userToFollow.save()]);

    res.json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unfollow user
router.delete('/:id/follow', protect, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    currentUser.following = currentUser.following.filter(
      id => id.toString() !== req.params.id
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== req.user._id.toString()
    );

    await Promise.all([currentUser.save(), userToUnfollow.save()]);

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ user: req.params.id })
      .populate('movie', 'title posterPath averageRating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ user: req.params.id });

    res.json({
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalReviews: total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// ** WE HAVE REMOVED THE REDUNDANT /profile and /password routes from the end of this file **
// They should be handled by a more specific auth route if needed, 
// and the main profile update is now correctly handled by PUT /:id

export default router;