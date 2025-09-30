import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/TempAuth';
import { Link } from 'react-router-dom';
import StarRating from '../../components/StarRating/StarRating';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import styles from './UserReviews.module.css';

const UserReviews = () => {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchUserReviews();
    } else if (!isAuthenticated) {
      setLoading(false);
      setError('Please log in to view your reviews');
    }
  }, [user, isAuthenticated]);

  const fetchUserReviews = async () => {
    if (!user?.id) {
      setError('User not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/users/${user.id}/reviews`);
      
      if (response.data && Array.isArray(response.data)) {
        setReviews(response.data);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      
      if (error.response?.status === 401) {
        setError('Please log in to view your reviews');
        toast.error('Session expired. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You can only view your own reviews.');
      } else if (error.response?.status === 404) {
        setError('No reviews found');
      } else {
        setError('Failed to load your reviews. Please try again.');
        toast.error('Failed to load reviews');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      await axios.delete(`/api/reviews/${reviewId}`);
      setReviews(prev => prev.filter(review => review._id !== reviewId));
      toast.success('Review deleted successfully');
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.userReviewsPage}>
        <div className={styles.reviewsContainer}>
          <div className={styles.authRequired}>
            <div className={styles.authIcon}>🔒</div>
            <h2>Authentication Required</h2>
            <p>Please log in to view your reviews.</p>
            <Link to="/login" className={styles.loginButton}>
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.userReviewsPage}>
        <div className={styles.reviewsContainer}>
          <LoadingSpinner text="Loading your reviews..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.userReviewsPage}>
        <div className={styles.reviewsContainer}>
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2>Unable to Load Reviews</h2>
            <p>{error}</p>
            <button 
              onClick={fetchUserReviews}
              className={styles.retryButton}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.userReviewsPage}>
      <div className={styles.reviewsContainer}>
        <div className={styles.reviewsHeader}>
          <h1>My Reviews</h1>
          <p>
            {reviews.length > 0 
              ? `You've written ${reviews.length} review${reviews.length !== 1 ? 's' : ''}`
              : 'Share your thoughts on movies to see your reviews here'
            }
          </p>
        </div>

        {reviews.length === 0 ? (
          <div className={styles.noReviews}>
            <div className={styles.noReviewsIcon}>✏️</div>
            <h2>You haven't written any reviews yet</h2>
            <p>Share your thoughts on movies to see your reviews here.</p>
            <Link to="/movies" className={styles.browseButton}>
              Browse Movies
            </Link>
          </div>
        ) : (
          <div className={styles.reviewsList}>
            {reviews.map((review) => (
              <div key={review._id} className={styles.reviewCard}>
                <div className={styles.movieInfo}>
                  <img
                    src={
                      review.movie?.posterUrl || 
                      (review.movie?.posterPath ? `https://image.tmdb.org/t/p/w200${review.movie.posterPath}` : '/default-movie-poster.png')
                    }
                    alt={review.movie?.title || 'Movie poster'}
                    className={styles.moviePoster}
                    onError={(e) => {
                      e.target.src = '/default-movie-poster.png';
                    }}
                  />
                  <div className={styles.movieDetails}>
                    <Link 
                      to={`/movies/${review.movie?._id || review.movie?.id}`} 
                      className={styles.movieTitle}
                    >
                      {review.movie?.title || 'Unknown Movie'}
                    </Link>
                    <p className={styles.movieYear}>
                      {review.movie?.releaseYear || 
                       (review.movie?.releaseDate ? new Date(review.movie.releaseDate).getFullYear() : 'Unknown Year')
                      }
                    </p>
                    <div className={styles.reviewContent}>
                      <div className={styles.reviewCardHeader}>
                        <StarRating rating={review.rating} readOnly={true} />
                        <div className={styles.reviewActions}>
                          <span className={styles.reviewDate}>
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </span>
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className={styles.deleteButton}
                            title="Delete review"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <h3 className={styles.reviewTitle}>{review.title}</h3>
                      <p className={styles.reviewText}>{review.content}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserReviews;