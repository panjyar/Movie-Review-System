import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Movie from '../models/Movie.js';
import Review from '../models/Review.js';
import { protect } from '../middleware/auth.js';

const router = Router();

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

// Update user profile
router.put('/:id', protect, [
  body('username').optional().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  body('profilePicture').optional().isURL().withMessage('Profile picture must be a valid URL')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.userId !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { username, bio, profilePicture } = req.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

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

    if (req.user.userId !== req.params.id) {
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
    if (req.user.userId !== req.params.id) {
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
    const currentUser = await User.findById(req.user.userId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    if (currentUser.following.includes(req.params.id)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    currentUser.following.push(req.params.id);
    userToFollow.followers.push(req.user.userId);

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
    const currentUser = await User.findById(req.user.userId);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    currentUser.following = currentUser.following.filter(
      id => id.toString() !== req.params.id
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== req.user.userId
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

export default router;