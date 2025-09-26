import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMovies } from '../../context/MovieContext';
import { useAuth } from '../../context/AuthContext';
import StarRating from '../../components/StarRating/StarRating';
import ReviewForm from '../../components/ReviewForm/ReviewForm';
import ReviewList from '../../components/ReviewList/ReviewList';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import WatchlistButton from '../../components/WatchlistButton/WatchlistButton';
import { toast } from 'react-toastify';
import styles from './MovieDetail.module.css';

const MovieDetail = () => {
  const { id } = useParams();
  const { currentMovie, loading, error, fetchMovie } = useMovies();
  const { isAuthenticated, user } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState(null);

  useEffect(() => {
    fetchMovie(id);
  }, [id]);

  useEffect(() => {
    if (currentMovie && user) {
      const existingReview = currentMovie.recentReviews?.find(
        (review) => review.user._id === user.id
      );
      setUserReview(existingReview);
    } else {
      setUserReview(null);
    }
  }, [currentMovie, user]);

  if (loading) return <LoadingSpinner text="Loading movie details..." />;
  if (error) return <div className={styles['error-page']}>Error: {error}</div>;
  if (!currentMovie) return <div className={styles['not-found']}>Movie not found</div>;

  const { movie, recentReviews } = currentMovie;

  const handleReviewSubmit = () => {
    setShowReviewForm(false);
    toast.success('Review submitted successfully!');
    // Refetch movie data to get the latest reviews
    fetchMovie(id);
  };

  const handleEditReview = () => {
    setShowReviewForm(true);
  };

  return (
    <div className={styles['movie-detail']}>
      <div className={styles['movie-backdrop']}>
        {movie.backdropPath && (
          <img
            src={`https://image.tmdb.org/t/p/original${movie.backdropPath}`}
            alt={movie.title}
            className={styles['backdrop-image']}
          />
        )}
        <div className={styles['backdrop-overlay']}></div>
      </div>

      <div className={styles['movie-content']}>
        <div className={styles['movie-main']}>
          <div className={styles['movie-poster-section']}>
            <img
              src={movie.posterPath ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` : '/placeholder-movie.png'}
              alt={movie.title}
              className={styles['movie-poster-large']}
            />
            {isAuthenticated && <WatchlistButton movieId={movie._id} />}
          </div>

          <div className={styles['movie-info-section']}>
            <h1 className={styles['movie-title-large']}>{movie.title}</h1>
            {/* Movie meta info */}
            <div className={styles['movie-meta']}>
              <span>{new Date(movie.releaseDate).getFullYear()}</span>
              <span>• {movie.runtime} min</span>
            </div>
            {/* Rating section */}
            <div className={styles['rating-section']}>
              <StarRating rating={movie.averageRating} readonly size="large" />
              <span>{movie.averageRating?.toFixed(1)}/5 ({movie.totalReviews} reviews)</span>
            </div>
            
            <h3>Overview</h3>
            <p>{movie.overview}</p>
            
            {/* NEW: Updated review button logic */}
            {isAuthenticated && (
              <div className={styles['action-buttons']}>
                {userReview && !showReviewForm ? (
                  <div className={styles['user-review-status']}>
                    <span>✅ You've reviewed this movie.</span>
                    <button onClick={handleEditReview} className={styles.editReviewBtn}>
                      Edit Your Review
                    </button>
                  </div>
                ) : !showReviewForm ? (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className={`${styles.btn} ${styles['btn-primary']}`}
                  >
                    Write a Review
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Cast, Trailers, etc. remain the same */}

        <div className={styles['reviews-section']}>
          <h3>Reviews</h3>
          {showReviewForm && (
            <ReviewForm
              movieId={movie._id}
              onSubmit={handleReviewSubmit}
              onCancel={() => setShowReviewForm(false)}
              // NEW: Pass the existing review to the form for editing
              existingReview={userReview}
            />
          )}

          <ReviewList movieId={movie._id} initialReviews={recentReviews} />
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
