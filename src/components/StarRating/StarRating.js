import React from 'react';
import styles from './StarRating.module.css';

const StarRating = ({ rating, onRatingChange, readonly = false, size = 'medium' }) => {
  const stars = [1, 2, 3, 4, 5];

  const handleStarClick = (starValue) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  const getStarClass = (starValue) => {
    const baseClass = `${styles.star} ${styles[size]}`;
    if (rating >= starValue) {
      return `${baseClass} ${styles.filled}`;
    } else if (rating >= starValue - 0.5) {
      return `${baseClass} ${styles['half-filled']}`;
    }
    return baseClass;
  };

  return (
    <div className={`${styles['star-rating']} ${readonly ? styles.readonly : styles.interactive}`}>
      {stars.map((starValue) => (
        <span
          key={starValue}
          className={getStarClass(starValue)}
          onClick={() => handleStarClick(starValue)}
          onMouseEnter={() => !readonly && onRatingChange && handleStarClick(starValue)}
        >
          ⭐
        </span>
      ))}
    </div>
  );
};

export default StarRating;