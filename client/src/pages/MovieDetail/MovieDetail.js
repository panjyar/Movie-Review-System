import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMovies } from "../../context/MovieContext";
import { useAuth } from "../../context/TempAuth";
import StarRating from "../../components/StarRating/StarRating";
import ReviewForm from "../../components/ReviewForm/ReviewForm";
import ReviewList from "../../components/ReviewList/ReviewList";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import WatchlistButton from "../../components/WatchlistButton/WatchlistButton";
import { toast } from "react-toastify";
import styles from "./MovieDetail.module.css";
import { FaPen } from "react-icons/fa"; // Example icon

const MovieDetail = () => {
  const { id } = useParams();
  const { currentMovie, loading, error, fetchMovie } = useMovies();
  const { isAuthenticated, user } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState(null);

  useEffect(() => {
    fetchMovie(id);
    // Scroll to top on component mount
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (currentMovie && user) {
      const existingReview = currentMovie.recentReviews?.find((review) => {
        const reviewUserId =
          review.user?._id?.toString() || review.user?.id?.toString();
        const currentUserId = user?._id?.toString() || user?.id?.toString();
        return reviewUserId === currentUserId;
      });
      setUserReview(existingReview);
    } else {
      setUserReview(null);
    }
  }, [currentMovie, user]);

  if (loading) return <LoadingSpinner text="Loading movie details..." />;
  if (error) return <div className={styles["error-page"]}>Error: {error}</div>;
  if (!currentMovie) return <div className={styles["not-found"]}>Movie not found</div>;

  const { movie, recentReviews } = currentMovie;

  const handleReviewSubmit = () => {
    setShowReviewForm(false);
    toast.success("Review submitted successfully!");
    fetchMovie(id);
  };

  const handleEditReview = () => {
    setShowReviewForm(true);
  };

  // Cleaner logic for rendering action buttons
  const renderReviewAction = () => {
    if (!isAuthenticated) return null;

    // Don't show any buttons if the form is already open
    if (showReviewForm) return null;

    if (userReview) {
      return (
        <div className={styles["user-review-status"]}>
          <span>You've reviewed this movie.</span>
          <button onClick={handleEditReview} className={styles.editReviewBtn}>
            <FaPen /> Edit
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => setShowReviewForm(true)}
        className={`${styles.btn} ${styles["btn-primary"]}`}
      >
        Write a Review
      </button>
    );
  };

  return (
    <div className={styles["movie-detail-wrapper"]}>
      <div className={styles["grain-overlay"]}></div>
      <div className={styles["movie-backdrop"]}>
        {movie.backdropPath && (
          <img
            src={`https://image.tmdb.org/t/p/original${movie.backdropPath}`}
            alt=""
            className={styles["backdrop-image"]}
          />
        )}
        <div className={styles["backdrop-overlay"]}></div>
      </div>

      <div className={styles["movie-content"]}>
        <div className={styles["movie-main"]}>
          <div className={styles["movie-poster-section"]}>
            <img
              src={
                movie.posterPath
                  ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
                  : "/placeholder-image.png" // Use a local placeholder
              }
              alt={movie.title}
              className={styles["movie-poster-large"]}
            />
            {isAuthenticated && <WatchlistButton movieId={movie._id} />}
          </div>

          <div className={styles["movie-info-section"]}>
            <h1 className={styles["movie-title-large"]}>{movie.title}</h1>

            <div className={styles["movie-meta"]}>
              <span>{new Date(movie.releaseDate).getFullYear()}</span>
              <span className={styles.separator}>•</span>
              <span>{movie.runtime} min</span>
              {/* Optional: Add Genres here if available */}
            </div>

            <div className={styles["rating-section"]}>
              <StarRating rating={movie.averageRating} readonly size="large" />
              <span className={styles.ratingText}>
                {movie.averageRating?.toFixed(1)}
                <span className={styles.ratingTotal}>/5</span>
                <span className={styles.reviewCount}>({movie.totalReviews} reviews)</span>
              </span>
            </div>

            <h3>Overview</h3>
            <p className={styles["movie-overview"]}>{movie.overview}</p>

            <div className={styles["action-buttons"]}>
              {renderReviewAction()}
            </div>
          </div>
        </div>

        {/* You can add Cast and Trailers sections here if you have them */}

        <div className={styles["reviews-section"]}>
          <div className={styles["reviews-header"]}>
            <h3>Reviews</h3>
          </div>
          {showReviewForm && (
            <ReviewForm
              movieId={movie._id}
              onSubmit={handleReviewSubmit}
              onCancel={() => setShowReviewForm(false)}
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