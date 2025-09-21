import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Review from '../models/Review.js';
import Movie from '../models/Movie.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Get all reviews with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const reviews = await Review.find()
      .populate('user', 'username profilePicture')
      .populate('movie', 'title posterPath averageRating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments();

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

// Get single review
router.get('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'username profilePicture')
      .populate('movie', 'title posterPath averageRating');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update review
router.put('/:id', protect, [
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').optional().notEmpty().withMessage('Review title is required'),
  body('content').optional().isLength({ min: 10, max: 2000 }).withMessage('Review content must be between 10 and 2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { rating, title, content } = req.body;
    const updateData = {};

    if (rating) updateData.rating = rating;
    if (title) updateData.title = title;
    if (content) updateData.content = content;

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'username profilePicture')
     .populate('movie', 'title posterPath averageRating');

    const movie = await Movie.findById(review.movie);
    if (movie) {
      await movie.updateAverageRating();
    }

    res.json(updatedReview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete review
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const user = await User.findById(req.user.userId);
    if (review.user.toString() !== req.user.userId && user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const movieId = review.movie;
    await Review.findByIdAndDelete(req.params.id);

    const movie = await Movie.findById(movieId);
    if (movie) {
      await movie.updateAverageRating();
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk delete reviews (Admin only)
router.delete('/bulk', protect, async (req, res) => {
  try {
    const { reviewIds } = req.body;

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({ message: 'Review IDs array is required' });
    }

    // Check if user is admin
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }

    const result = await Review.deleteMany({ _id: { $in: reviewIds } });

    // Update average ratings for affected movies
    const reviews = await Review.find({ _id: { $in: reviewIds } }).select('movie');
    const movieIds = [...new Set(reviews.map(review => review.movie.toString()))];
    
    for (const movieId of movieIds) {
      const movie = await Movie.findById(movieId);
      if (movie) {
        await movie.updateAverageRating();
      }
    }

    res.json({ 
      message: `${result.deletedCount} reviews deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike review
router.post('/:id/like', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const userId = req.user.userId;
    const hasLiked = review.likes.includes(userId);
    const hasDisliked = review.dislikes.includes(userId);

    if (hasLiked) {
      review.likes = review.likes.filter(id => id.toString() !== userId);
    } else {
      review.likes.push(userId);
      if (hasDisliked) {
        review.dislikes = review.dislikes.filter(id => id.toString() !== userId);
      }
    }

    await review.save();

    res.json({
      message: hasLiked ? 'Like removed' : 'Review liked',
      likesCount: review.likes.length,
      dislikesCount: review.dislikes.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Dislike/Remove dislike review
router.post('/:id/dislike', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const userId = req.user.userId;
    const hasLiked = review.likes.includes(userId);
    const hasDisliked = review.dislikes.includes(userId);

    if (hasDisliked) {
      review.dislikes = review.dislikes.filter(id => id.toString() !== userId);
    } else {
      review.dislikes.push(userId);
      if (hasLiked) {
        review.likes = review.likes.filter(id => id.toString() !== userId);
      }
    }

    await review.save();

    res.json({
      message: hasDisliked ? 'Dislike removed' : 'Review disliked',
      likesCount: review.likes.length,
      dislikesCount: review.dislikes.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;