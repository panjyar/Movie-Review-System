import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../context/TempAuth";
import StarRating from "../StarRating/StarRating";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import { toast } from "react-toastify";
import styles from "./ReviewList.module.css";
import { formatDistanceToNow } from "date-fns";

const ReviewList = ({ movieId, initialReviews = [] }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState(initialReviews);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState("newest");

  // FINAL FIX: The 'loading' state was removed from the dependency array of useCallback.
  // The function manages the loading state, so it shouldn't depend on it, as that
  // was causing the infinite loop.
  const loadReviews = useCallback(
    async (pageNum = 1, replace = false) => {
      // This guard clause prevents multiple requests from being sent at the same time.
      if (loading && !replace) return;

      setLoading(true);
      try {
        const response = await axios.get(`/api/movies/${movieId}/reviews`, {
          params: {
            page: pageNum,
            limit: 10,
            sort: sortBy,
          },
        });

        const { reviews: newReviews, pagination } = response.data;

        setReviews((prev) => (replace ? newReviews : [...prev, ...newReviews]));
        setPage(pageNum);
        setHasMore(pagination.currentPage < pagination.totalPages);
      } catch (error) {
        if (error.response?.status !== 429) {
          toast.error("Failed to load reviews");
        }
        console.error("Error loading reviews:", error);
      } finally {
        setLoading(false);
      }
    },
    [movieId, sortBy]
  ); // Dependency array is now stable.

  // This useEffect will now only run when the movie or the sort order changes.
  useEffect(() => {
    if (movieId) {
      loadReviews(1, true);
    }
  }, [sortBy, movieId, loadReviews]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadReviews(page + 1, false);
    }
  };

  const handleSortChange = (newSort) => {
    if (newSort !== sortBy) {
      setSortBy(newSort);
    }
  };

  return (
    <div className={styles.reviewSection}>
      <div className={styles.reviewHeader}>
        <h2>Reviews</h2>
        <div className={styles.sortControls}>
          <label htmlFor="sort">Sort by: </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className={styles.sortDropdown}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="top_rated">Top Rated</option>
            <option value="lowest_rated">Lowest Rated</option>
          </select>
        </div>
      </div>

      <div className={styles.reviewList} aria-live="polite">
        {reviews.length > 0
          ? reviews.map((review) => (
              <div key={review._id} className={styles.reviewCard}>
                <div className={styles.reviewCardHeader}>
                  <div className={styles.reviewerInfo}>
                    <img
                      src={review.user.profilePicture || "/default-avatar.png"}
                      alt={`${review.user.username}'s avatar`}
                      className={styles.reviewerAvatar}
                    />
                    <span className={styles.reviewUser}>
                      {review.user.username}
                    </span>
                  </div>
                  <span className={styles.reviewDate}>
                    {formatDistanceToNow(new Date(review.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <StarRating rating={review.rating} readOnly />
                {review.title && (
                  <h4 className={styles.reviewTitle}>{review.title}</h4>
                )}
                <p className={styles.reviewText}>{review.content}</p>
              </div>
            ))
          : !loading && (
              <p className={styles.noReviews}>
                No reviews yet.{" "}
                <span>Be the first to share your thoughts!</span>
              </p>
            )}
      </div>

      {loading && <LoadingSpinner />}

      {hasMore && !loading && (
        <button onClick={handleLoadMore} className={styles.loadMoreButton}>
          Load More
        </button>
      )}
    </div>
  );
};

export default ReviewList;
