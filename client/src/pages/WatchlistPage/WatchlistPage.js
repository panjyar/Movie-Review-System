import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/TempAuth';
import MovieCard from '../../components/MovieCard/MovieCard';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import styles from './Watchlist.module.css';

const Watchlist = () => {
  const { user, isAuthenticated } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchWatchlist();
    } else if (!isAuthenticated) {
      setLoading(false);
      setError('Please log in to view your watchlist');
    }
  }, [user, isAuthenticated]);

  const fetchWatchlist = async () => {
    if (!user?.id) {
      setError('User not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/users/${user.id}/watchlist`);
      
      if (response.data && Array.isArray(response.data)) {
        // Handle different API response formats
        const movies = response.data.map(item => {
          if (item.movie) {
            return item.movie; // If the response has movie objects nested
          }
          return item; // If the response is directly movie objects
        }).filter(movie => movie); // Filter out any null/undefined items
        
        setWatchlist(movies);
      } else {
        setWatchlist([]);
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      
      if (error.response?.status === 401) {
        setError('Please log in to view your watchlist');
        toast.error('Session expired. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You can only view your own watchlist.');
      } else if (error.response?.status === 404) {
        setError('Watchlist not found');
      } else {
        setError('Failed to load your watchlist. Please try again.');
        toast.error('Failed to load watchlist');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMovieRemoved = (movieId) => {
    // Update local state when a movie is removed from watchlist
    setWatchlist(prev => prev.filter(movie => movie._id !== movieId && movie.id !== movieId));
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.watchlistPage}>
        <div className={styles.watchlistContainer}>
          <div className={styles.authRequired}>
            <div className={styles.authIcon}>🔒</div>
            <h2>Authentication Required</h2>
            <p>Please log in to view your watchlist.</p>
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
      <div className={styles.watchlistPage}>
        <div className={styles.watchlistContainer}>
          <LoadingSpinner text="Loading your watchlist..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.watchlistPage}>
        <div className={styles.watchlistContainer}>
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2>Unable to Load Watchlist</h2>
            <p>{error}</p>
            <button 
              onClick={fetchWatchlist}
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
    <div className={styles.watchlistPage}>
      <div className={styles.watchlistContainer}>
        <div className={styles.watchlistHeader}>
          <h1>My Watchlist</h1>
          <p>
            {watchlist.length > 0 
              ? `${watchlist.length} movie${watchlist.length !== 1 ? 's' : ''} saved for later`
              : 'Movies you save will appear here'
            }
          </p>
        </div>

        {watchlist.length === 0 ? (
          <div className={styles.emptyWatchlist}>
            <div className={styles.emptyIcon}>🎬</div>
            <h2>Your watchlist is empty</h2>
            <p>Browse movies and add your favorites to see them here.</p>
            <Link to="/movies" className={styles.browseButton}>
              Browse Movies
            </Link>
          </div>
        ) : (
          <div className={styles.moviesGrid}>
            {watchlist.map((movie) => (
              <MovieCard 
                key={movie._id || movie.id} 
                movie={movie}
                onWatchlistChange={() => handleMovieRemoved(movie._id || movie.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;