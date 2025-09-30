import { Router } from 'express';
import axios from 'axios';
import { body, validationResult, query } from 'express-validator';
import Movie from '../models/Movie.js';
import Review from '../models/Review.js';
import { protect } from '../middleware/auth.js';
import admin from '../middleware/admin.js';

const router = Router();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('genre').optional().isString(),
  query('year').optional().isInt({ min: 1900, max: 2030 }),
  query('search').optional().isString(),
  query('sort').optional().isIn(['title', 'releaseDate', 'averageRating', 'totalReviews', 'newest', 'oldest'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    let filter = {};
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.genre) {
      filter['genres.name'] = { $regex: req.query.genre, $options: 'i' };
    }
    if (req.query.year) {
      const year = parseInt(req.query.year);
      filter.releaseDate = {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      };
    }

    let sort = {};
    switch (req.query.sort) {
      case 'title': sort.title = 1; break;
      case 'releaseDate': sort.releaseDate = -1; break;
      case 'averageRating': sort.averageRating = -1; break;
      case 'totalReviews': sort.totalReviews = -1; break;
      case 'newest': sort.createdAt = -1; break;
      case 'oldest': sort.createdAt = 1; break;
      default: sort.createdAt = -1;
    }

    const movies = await Movie.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('title overview releaseDate genres posterPath averageRating totalReviews runtime');

    const total = await Movie.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      movies,
      pagination: {
        currentPage: page,
        totalPages,
        totalMovies: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/bulk', protect, admin, async (req, res) => {
  try {
    const { movieIds } = req.body;

    if (!Array.isArray(movieIds) || movieIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Movie IDs array is required' 
      });
    }

    const result = await Movie.deleteMany({ _id: { $in: movieIds } });
    await Review.deleteMany({ movie: { $in: movieIds } });

    res.json({ 
      success: true,
      message: `${result.deletedCount} movies deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

router.get('/trending', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const response = await axios.get(`${TMDB_BASE_URL}/trending/movie/week`, {
      params: { api_key: TMDB_API_KEY, page },
      timeout: 10000
    });

    const trendingMovies = response.data.results;

    const moviePromises = trendingMovies.map(async (tmdbMovie) => {
      let movie = await Movie.findOne({ tmdbId: tmdbMovie.id });
      if (!movie) {
        const detailsResponse = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbMovie.id}`, {
          params: { api_key: TMDB_API_KEY },
          timeout: 5000
        });

        movie = new Movie({
          tmdbId: tmdbMovie.id,
          title: tmdbMovie.title,
          overview: tmdbMovie.overview,
          releaseDate: new Date(tmdbMovie.release_date),
          posterPath: tmdbMovie.poster_path,
          backdropPath: tmdbMovie.backdrop_path,
          voteAverage: tmdbMovie.vote_average,
          voteCount: tmdbMovie.vote_count,
          genres: detailsResponse.data.genres || [],
          runtime: detailsResponse.data.runtime || 0
        });

        await movie.save();
      }
      return movie;
    });

    const movies = (await Promise.all(moviePromises)).filter(Boolean);

    res.json({
      success: true,
      data: movies,
      pagination: {
        currentPage: page,
        hasNext: page < response.data.total_pages
      }
    });
  } catch (error) {
    console.error('Trending movies error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending movies'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const reviews = await Review.find({ movie: movie._id })
      .populate('user', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ movie, recentReviews: reviews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', [protect, admin], [
  body('title').notEmpty().withMessage('Title is required'),
  body('overview').notEmpty().withMessage('Overview is required'),
  body('releaseDate').isISO8601().withMessage('Valid release date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const movie = new Movie(req.body);
    await movie.save();

    res.status(201).json(movie);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Movie with this title already exists' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', [protect, admin], [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('overview').optional().notEmpty().withMessage('Overview cannot be empty'),
  body('releaseDate').optional().isISO8601().withMessage('Valid release date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.json(movie);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', [protect, admin], async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    await Review.deleteMany({ movie: req.params.id });

    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/reviews', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('sort').optional().isIn(['newest', 'oldest', 'highest', 'lowest'])
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let sort = {};
    switch (req.query.sort) {
      case 'oldest': sort.createdAt = 1; break;
      case 'highest': sort.rating = -1; break;
      case 'lowest': sort.rating = 1; break;
      default: sort.createdAt = -1;
    }

    const reviews = await Review.find({ movie: req.params.id })
      .populate('user', 'username profilePicture')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ movie: req.params.id });

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

// CRITICAL FIX: Changed req.user.userId to req.user._id
router.post('/:id/reviews', protect, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('title').notEmpty().withMessage('Review title is required'),
  body('content').isLength({ min: 10, max: 2000 }).withMessage('Review content must be between 10 and 2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rating, title, content } = req.body;
    const movieId = req.params.id;
    const userId = req.user._id; // FIXED: was req.user.userId

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const existingReview = await Review.findOne({ user: userId, movie: movieId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this movie' });
    }

    const review = new Review({
      user: userId,
      movie: movieId,
      rating,
      title,
      content
    });

    await review.save();
    await review.populate('user', 'username profilePicture');
    await movie.updateAverageRating();

    res.status(201).json(review);
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;