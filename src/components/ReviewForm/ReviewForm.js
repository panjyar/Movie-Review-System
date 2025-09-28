import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMovies } from '../../context/MovieContext';
import StarRating from '../StarRating/StarRating';
import styles from './ReviewForm.module.css';

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const ReviewForm = ({ movieId, onSubmit, onCancel, existingReview = null }) => {
  const { user } = useAuth();
  const { submitReview } = useMovies();
  
  const [formData, setFormData] = useState({
    rating: existingReview?.rating || 0,
    title: existingReview?.title || '',
    content: existingReview?.content || ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitAttempts, setSubmitAttempts] = useState(0);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.rating === 0) {
      newErrors.rating = 'Please select a rating';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Review content is required';
    } else if (formData.content.length < 10) {
      newErrors.content = 'Review must be at least 10 characters long';
    } else if (formData.content.length > 2000) {
      newErrors.content = 'Review must be less than 2000 characters';
    }

    return newErrors;
  };

  // Retry logic for rate limiting
  const submitWithRetry = async (data, retryCount = 0) => {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    try {
      const result = await submitReview(movieId, data);
      return result;
    } catch (error) {
      if (error.response?.status === 429 && retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return submitWithRetry(data, retryCount + 1);
      }
      throw error;
    }
  };

  // Debounced submit function to prevent rapid submissions
  const debouncedSubmit = useCallback(
    debounce(async (data) => {
      try {
        const result = await submitWithRetry(data);
        if (result.success) {
          onSubmit();
        } else {
          setErrors({ general: result.error || 'Failed to submit review' });
        }
      } catch (error) {
        console.error('Review submission error:', error);
        
        if (error.response?.status === 429) {
          setErrors({ 
            general: 'Too many requests. Please wait a moment before trying again.' 
          });
        } else if (error.response?.status === 401) {
          setErrors({ 
            general: 'Please login to submit a review.' 
          });
        } else if (error.response?.status === 400) {
          setErrors({ 
            general: error.response?.data?.message || 'Invalid review data' 
          });
        } else {
          setErrors({ 
            general: 'Failed to submit review. Please try again.' 
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    }, 1000), 
    [movieId, onSubmit]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple rapid submissions
    if (isSubmitting) {
      return;
    }

    // Rate limiting check
    if (submitAttempts >= 3) {
      setErrors({ 
        general: 'Too many submission attempts. Please wait before trying again.' 
      });
      return;
    }

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitAttempts(prev => prev + 1);
    setErrors({});

    const reviewData = {
      rating: formData.rating,
      title: formData.title.trim(),
      content: formData.content.trim()
    };

    // Use debounced submit
    debouncedSubmit(reviewData);
  };

  return (
    <div className={styles['review-form-container']}>
      <div className={styles['review-form']}>
        <div className={styles['review-form-header']}>
          <h3>{existingReview ? 'Edit Review' : 'Write a Review'}</h3>
          <div className={styles['reviewer-info']}>
            <img
              src={user?.profilePicture || '/default-avatar.png'}
              alt={user?.username}
              className={styles['reviewer-avatar']}
              onError={(e) => {
                e.target.src = '/default-avatar.png';
              }}
            />
            <span className={styles['reviewer-name']}>{user?.username}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles['rating-section']}>
            <label>Your Rating *</label>
            <div className={`${styles['rating-input']} ${errors.rating ? styles.error : ''}`}>
              <StarRating
                rating={formData.rating}
                onRatingChange={(rating) => handleInputChange('rating', rating)}
                size="large"
              />
              <span className={styles['rating-text']}>
                {formData.rating > 0 ? `${formData.rating}/5` : 'Select rating'}
              </span>
            </div>
            {errors.rating && <span className={styles['error-message']}>{errors.rating}</span>}
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="title">Review Title *</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Give your review a title..."
              className={errors.title ? styles.error : ''}
              maxLength={100}
              disabled={isSubmitting}
            />
            {errors.title && <span className={styles['error-message']}>{errors.title}</span>}
            <div className={styles['character-count']}>
              <small>{formData.title.length}/100</small>
            </div>
          </div>

          <div className={styles['form-group']}>
            <label htmlFor="content">Your Review *</label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Share your thoughts about this movie..."
              rows={6}
              className={errors.content ? styles.error : ''}
              maxLength={2000}
              disabled={isSubmitting}
            />
            {errors.content && <span className={styles['error-message']}>{errors.content}</span>}
            <div className={styles['character-count']}>
              <small>{formData.content.length}/2000</small>
            </div>
          </div>

          {errors.general && (
            <div className={styles['error-message']} style={{ marginBottom: '1rem' }}>
              {errors.general}
            </div>
          )}

          {submitAttempts >= 3 && (
            <div className={styles['warning-message']} style={{ marginBottom: '1rem' }}>
              Please wait before submitting again to avoid rate limiting.
            </div>
          )}

          <div className={styles['form-actions']}>
            <button
              type="button"
              onClick={onCancel}
              className={`${styles.btn} ${styles['btn-secondary']}`}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`${styles.btn} ${styles['btn-primary']}`}
              disabled={isSubmitting || submitAttempts >= 3}
            >
              {isSubmitting ? (
                <>
                  <span className={styles['loading-spinner']}></span>
                  Submitting...
                </>
              ) : (
                existingReview ? 'Update Review' : 'Submit Review'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;