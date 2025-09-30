import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/TempAuth';
import { toast } from 'react-toastify';
import styles from './WatchlistButton.module.css';

const WatchlistButton = ({ movieId, size = 'medium' }) => {
  const { user, isAuthenticated } = useAuth();
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && movieId) {
      checkWatchlistStatus();
    }
  }, [movieId, user, isAuthenticated]);

  const checkWatchlistStatus = async () => {
    if (!user || !user.id) {
      console.error('No user ID available');
      return;
    }

    try {
      const response = await axios.get(`/api/users/${user.id}/watchlist`);
      const watchlist = response.data || [];
      
      // Check if movie is in watchlist (handle both formats)
      const isMovieInWatchlist = watchlist.some(item => {
        const movieIdToCheck = item.movie?._id || item.movie?.id || item.movieId;
        return movieIdToCheck === movieId;
      });
      
      setIsInWatchlist(isMovieInWatchlist);
    } catch (error) {
      console.error('Error checking watchlist status:', error);
      // Don't show error toast for checking status, just log it
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.warn('Watchlist check failed:', error.response?.data?.message);
      }
    }
  };

  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to add movies to your watchlist');
      return;
    }

    if (!user || !user.id) {
      toast.error('User not found. Please try logging in again.');
      return;
    }

    if (!movieId) {
      toast.error('Movie not found');
      return;
    }

    setLoading(true);
    try {
      if (isInWatchlist) {
        // Remove from watchlist
        await axios.delete(`/api/users/${user.id}/watchlist/${movieId}`);
        setIsInWatchlist(false);
        toast.success('Removed from watchlist');
      } else {
        // Add to watchlist
        await axios.post(`/api/users/${user.id}/watchlist`, { movieId });
        setIsInWatchlist(true);
        toast.success('Added to watchlist');
      }
    } catch (error) {
      console.error('Watchlist operation error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        toast.error('Please login to manage your watchlist');
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Please check your permissions.');
      } else if (error.response?.status === 409) {
        toast.info('Movie is already in your watchlist');
        setIsInWatchlist(true); // Update state to reflect reality
      } else if (error.response?.status === 404) {
        toast.error('Movie or user not found');
      } else {
        const message = error.response?.data?.message || 'Something went wrong';
        toast.error(message);
      }
      
      // Refresh watchlist status to ensure UI is in sync
      setTimeout(() => {
        checkWatchlistStatus();
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const buttonClasses = [
    styles['watchlist-button'],
    styles[size],
    isInWatchlist ? styles['in-watchlist'] : styles['not-in-watchlist'],
    loading ? styles.loading : ''
  ].filter(Boolean).join(' ');

  return (
    <button
      onClick={handleWatchlistToggle}
      disabled={loading}
      className={buttonClasses}
      title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
      aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      {loading ? (
        <span className={styles['loading-spinner-small']}>⏳</span>
      ) : (
        <>
          <span className={styles['watchlist-icon']}>
            {isInWatchlist ? '❤️' : '🤍'}
          </span>
          <span className={styles['watchlist-text']}>
            {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
          </span>
        </>
      )}
    </button>
  );
};

export default WatchlistButton;