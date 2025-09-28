import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import Pagination from '../Pagination/Pagination'; // IMPROVEMENT: Import reusable Pagination component
import styles from './AdminComponents.module.css';

const ReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    rating: 5
  });

  useEffect(() => {
    fetchReviews(currentPage);
  }, [currentPage]);

  const fetchReviews = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page,
        limit: 10,
        search: searchTerm,
        rating: filterRating !== 'all' ? filterRating : ''
      });

      const response = await axios.get(`/api/reviews?${params}`);
      setReviews(response.data.reviews);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchReviews(1);
  };
  
  useEffect(() => {
    if (currentPage !== 1) {
        setCurrentPage(1);
    } else {
        fetchReviews(1);
    }
  }, [searchTerm, filterRating]);


  const handleEdit = (review) => {
    setEditingReview(review);
    setEditForm({
      title: review.title,
      content: review.content,
      rating: review.rating
    });
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`/api/reviews/${editingReview._id}`, editForm);
      toast.success('Review updated successfully');
      setShowEditForm(false);
      setEditingReview(null);
      fetchReviews(currentPage);
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error('Failed to update review');
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      await axios.delete(`/api/reviews/${reviewId}`);
      toast.success('Review deleted successfully');
      fetchReviews(currentPage);
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReviews.length === 0) {
      toast.warning('Please select reviews first');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedReviews.length} reviews?`)) {
      return;
    }

    try {
      await axios.delete('/api/reviews/bulk', {
        data: { reviewIds: selectedReviews }
      });
      toast.success(`${selectedReviews.length} reviews deleted successfully`);
      setSelectedReviews([]);
      fetchReviews(currentPage);
    } catch (error) {
      console.error('Error deleting reviews:', error);
      toast.error('Failed to delete reviews');
    }
  };

  const handleSelectReview = (reviewId) => {
    setSelectedReviews(prev =>
      prev.includes(reviewId)
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReviews.length === reviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(reviews.map(review => review._id));
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading && reviews.length === 0) {
    return <LoadingSpinner text="Loading reviews..." />;
  }

  return (
    <div className={styles.adminComponent}>
      <div className={styles.componentHeader}>
        <h2>Review Management</h2>
        <p>Moderate and manage user reviews</p>
      </div>

      {showEditForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Edit Review</h3>
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setEditingReview(null);
                }}
                className={styles.closeButton}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className={styles.reviewForm}>
              <div className={styles.formGroup}>
                <label>Review Title *</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Rating *</label>
                <select
                  value={editForm.rating}
                  onChange={(e) => setEditForm(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                  required
                  className={styles.formInput}
                >
                  <option value={1}>1 Star</option>
                  <option value={2}>2 Stars</option>
                  <option value={3}>3 Stars</option>
                  <option value={4}>4 Stars</option>
                  <option value={5}>5 Stars</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Review Content *</label>
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                  required
                  rows="6"
                  className={styles.formTextarea}
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingReview(null);
                  }}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton}>
                  Update Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.filtersSection}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            Search
          </button>
        </form>

        <div className={styles.filterGroup}>
          <label>Filter by Rating:</label>
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {selectedReviews.length > 0 && (
        <div className={styles.bulkActions}>
          <span>{selectedReviews.length} review(s) selected</span>
          <button
            onClick={handleBulkDelete}
            className={styles.bulkDeleteButton}
          >
            Delete Selected
          </button>
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={reviews.length > 0 && selectedReviews.length === reviews.length}
                  onChange={handleSelectAll}
                  className={styles.checkbox}
                />
              </th>
              <th>Review</th>
              <th>Movie</th>
              <th>User</th>
              <th>Rating</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(review => (
              <tr key={review._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedReviews.includes(review._id)}
                    onChange={() => handleSelectReview(review._id)}
                    className={styles.checkbox}
                  />
                </td>
                <td>
                  <div className={styles.reviewInfo}>
                    <div className={styles.reviewTitle}>{review.title}</div>
                    <div className={styles.reviewContent}>
                      {review.content.substring(0, 150)}...
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.movieInfo}>
                    <img
                      src={review.movie.posterUrl || '/default-movie-poster.png'}
                      alt={review.movie.title}
                      className={styles.moviePoster}
                    />
                    <div className={styles.movieTitle}>{review.movie.title}</div>
                  </div>
                </td>
                <td>
                  <div className={styles.userInfo}>
                    <img
                      src={review.user.profilePicture || '/default-avatar.png'}
                      alt={review.user.username}
                      className={styles.userAvatar}
                    />
                    <div className={styles.username}>{review.user.username}</div>
                  </div>
                </td>
                <td>
                  <div className={styles.ratingInfo}>
                    <div className={styles.stars}>{renderStars(review.rating)}</div>
                    <div className={styles.ratingNumber}>{review.rating}/5</div>
                  </div>
                </td>
                <td>{new Date(review.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className={styles.actionButtons}>
                    <button
                      onClick={() => handleEdit(review)}
                      className={styles.editButton}
                      title="Edit Review"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(review._id)}
                      className={styles.deleteButton}
                      title="Delete Review"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* IMPROVEMENT: Use the reusable Pagination component */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {loading && reviews.length > 0 && (
        <div className={styles.loadingOverlay}>
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

export default ReviewManagement;