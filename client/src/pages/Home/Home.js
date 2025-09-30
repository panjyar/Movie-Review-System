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
      {/* Film grain overlay */}
      <div className={styles.filmGrain}></div>
      
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <div className={styles.grainOverlay}></div>
        </div>
        
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Discover & Review Movies
            </h1>
            <p className={styles.heroDescription}>
              Join our community of movie enthusiasts. Share your thoughts, 
              discover new films, and find your next favorite movie.
            </p>
            <div className={styles.heroButtons}>
              <Link to="/movies" className={`${styles.btn} ${styles.btnPrimary}`}>
                Browse Movies
              </Link>
              <Link to="/register" className={`${styles.btn} ${styles.btnSecondary}`}>
                Join Community
              </Link>
            </div>
          </div>
          
          <div className={styles.heroImage}>
            <div className={styles.floatingCards}>
              {trendingMovies.slice(0, 3).map((movie, index) => (
                <div key={movie._id} className={`${styles.floatingCard} ${styles[`card${index + 1}`]}`}>
                  <div className={styles.cardFilm}>
                    <img 
                      src={`https://image.tmdb.org/t/p/w300${movie.posterPath}`}
                      alt={movie.title}
                      onError={(e) => {
                        e.target.src = '/placeholder-movie.png';
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.trendingSection}>
        <div className={styles.sectionHeader}>
          <h2>Trending Movies</h2>
          <Link to="/movies" className={styles.viewAllBtn}>
            View All Movies →
          </Link>
        </div>

        {error ? (
          <div className={styles.errorMessage}>
            <p>{error}</p>
            <button onClick={fetchTrendingMovies} className={styles.retryBtn}>
              Retry
            </button>
          </div>
        ) : (
          <div className={styles.trendingGrid}>
            {trendingMovies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        )}
      </section>

      <section className={styles.featuresSection}>
        <h2>Why Choose MovieReviews?</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎯</div>
            <h3>Discover New Movies</h3>
            <p>Find your next favorite film with our curated recommendations and trending lists.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>✍️</div>
            <h3>Write Reviews</h3>
            <p>Share your thoughts and help others discover great movies with detailed reviews.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>👥</div>
            <h3>Join Community</h3>
            <p>Connect with fellow movie enthusiasts and build your watchlist together.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⭐</div>
            <h3>Rate & Track</h3>
            <p>Rate movies and keep track of what you've watched with personal lists.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;