import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMovies } from '../../context/MovieContext';
import MovieCard from '../../components/MovieCard/MovieCard';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import styles from './Home.module.css';

const Home = () => {
  const { trendingMovies, loading, error, fetchTrendingMovies } = useMovies();

  useEffect(() => {
    fetchTrendingMovies();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <div className={styles['hero-content']}>
          <h1 className={styles['hero-title']}>
            Discover & Review Movies
          </h1>
          <p className={styles['hero-description']}>
            Join our community of movie enthusiasts. Share your thoughts, 
            discover new films, and find your next favorite movie.
          </p>
          <div className={styles['hero-buttons']}>
            <Link to="/movies" className={`${styles.btn} ${styles['btn-primary']}`}>
              Browse Movies
            </Link>
            <Link to="/register" className={`${styles.btn} ${styles['btn-secondary']}`}>
              Join Community
            </Link>
          </div>
        </div>
        <div className={styles['hero-image']}>
          <div className={styles['floating-cards']}>
            {trendingMovies.slice(0, 3).map((movie, index) => (
              <div key={movie._id} className={`${styles['floating-card']} ${styles[`card-${index + 1}`]}`}>
                <img 
                  src={`https://image.tmdb.org/t/p/w300${movie.posterPath}`}
                  alt={movie.title}
                  onError={(e) => {
                    e.target.src = '/placeholder-movie.png';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles['trending-section']}>
        <div className={styles['section-header']}>
          <h2>Trending Movies</h2>
          <Link to="/movies" className={styles['view-all-btn']}>
            View All Movies →
          </Link>
        </div>

        {error ? (
          <div className={styles['error-message']}>
            <p>{error}</p>
            <button onClick={fetchTrendingMovies} className={styles['retry-btn']}>
              Retry
            </button>
          </div>
        ) : (
          <div className={styles['trending-grid']}>
            {trendingMovies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        )}
      </section>

      <section className={styles['features-section']}>
        <h2>Why Choose MovieReviews?</h2>
        <div className={styles['features-grid']}>
          <div className={styles['feature-card']}>
            <div className={styles['feature-icon']}>🎯</div>
            <h3>Discover New Movies</h3>
            <p>Find your next favorite film with our curated recommendations and trending lists.</p>
          </div>
          <div className={styles['feature-card']}>
            <div className={styles['feature-icon']}>✏️</div>
            <h3>Write Reviews</h3>
            <p>Share your thoughts and help others discover great movies with detailed reviews.</p>
          </div>
          <div className={styles['feature-card']}>
            <div className={styles['feature-icon']}>👥</div>
            <h3>Join Community</h3>
            <p>Connect with fellow movie enthusiasts and build your watchlist together.</p>
          </div>
          <div className={styles['feature-card']}>
            <div className={styles['feature-icon']}>⭐</div>
            <h3>Rate & Track</h3>
            <p>Rate movies and keep track of what you've watched with personal lists.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;