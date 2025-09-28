import React from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../StarRating/StarRating';
import styles from './MovieCard.module.css';

const MovieCard = ({ movie }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).getFullYear();
  };

  return (
    <div className={styles['movie-card']}>
      <Link to={`/movies/${movie._id}`} className={styles['movie-link']}>
        <div className={styles['movie-poster']}>
          <img
            src={movie.posterPath 
              ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
              : '/placeholder-movie.png'
            }
            alt={movie.title}
            onError={(e) => {
              e.target.src = '/placeholder-movie.png';
            }}
          />
          <div className={styles['movie-overlay']}>
            <div className={styles['movie-rating']}>
              <StarRating rating={movie.averageRating} readonly size="small" />
              <span className={styles['rating-text']}>
                {movie.averageRating?.toFixed(1) || 'N/A'}
              </span>
            </div>
            <div className={styles['movie-reviews']}>
              {movie.totalReviews} reviews
            </div>
          </div>
        </div>
        
        <div className={styles['movie-info']}>
          <h3 className={styles['movie-title']}>{movie.title}</h3>
          <p className={styles['movie-year']}>{formatDate(movie.releaseDate)}</p>
          {movie.genres && movie.genres.length > 0 && (
            <div className={styles['movie-genres']}>
              {movie.genres.slice(0, 2).map((genre) => (
                <span key={genre.id} className={styles['genre-tag']}>
                  {genre.name}
                </span>
              ))}
            </div>
          )}
          {movie.runtime && (
            <p className={styles['movie-runtime']}>{movie.runtime} min</p>
          )}
        </div>
      </Link>
    </div>
  );
};

export default MovieCard;