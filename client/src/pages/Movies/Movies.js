import React, { useEffect, useState } from 'react';
import { useMovies } from '../../context/MovieContext';
import { useAuth } from '../../context/AuthContext'; // IMPROVEMENT: Import useAuth
import MovieCard from '../../components/MovieCard/MovieCard';
import SearchFilters from '../../components/SearchFilters/SearchFilters';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import Pagination from '../../components/Pagination/Pagination';
import styles from './Movies.module.css';

const Movies = () => {
  const { 
    movies, 
    loading: moviesLoading, // Renamed to avoid conflict
    error, 
    pagination, 
    filters, 
    fetchMovies, 
    updateFilters 
  } = useMovies();
  
  // IMPROVEMENT: Get auth loading status to prevent fetching data before user is checked
  const { loading: authLoading } = useAuth(); 

  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    // IMPROVEMENT: Only fetch movies once the initial auth check is complete.
    if (!authLoading) {
      fetchMovies(1, filters);
    }
  }, [filters, authLoading]); // Add authLoading as a dependency

  const handleFilterChange = (newFilters) => {
    setLocalFilters({ ...localFilters, ...newFilters });
  };

  const handleSearch = () => {
    updateFilters(localFilters);
  };

  const handlePageChange = (page) => {
    fetchMovies(page, filters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      genre: '',
      year: '',
      sort: 'newest'
    };
    setLocalFilters(clearedFilters);
    updateFilters(clearedFilters);
  };

  // Use a combined loading state
  const isLoading = moviesLoading || authLoading;

  return (
    <div className={styles['movies-page']}>
      <div className={styles['movies-container']}>
        <div className={styles['movies-header']}>
          <h1>Discover Movies</h1>
          <p>Browse through our collection of movies and find your next favorite film</p>
        </div>

        <SearchFilters
          filters={localFilters}
          onFilterChange={handleFilterChange}
          onSearch={handleSearch}
          onClear={handleClearFilters}
          loading={isLoading}
        />

        {isLoading && movies.length === 0 ? (
          <LoadingSpinner />
        ) : error ? (
          <div className={styles['error-container']}>
            <div className={styles['error-message']}>
              <h3>Oops! Something went wrong</h3>
              <p>{error}</p>
              <button 
                onClick={() => fetchMovies(1, filters)} 
                className={styles['retry-button']}
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles['movies-results']}>
              <div className={styles['results-info']}>
                <span className={styles['results-count']}>
                  {pagination.totalMovies} movies found
                </span>
                {(filters.search || filters.genre || filters.year) && (
                  <button onClick={handleClearFilters} className={styles['clear-filters-btn']}>
                    Clear all filters
                  </button>
                )}
              </div>
              
              {movies.length === 0 ? (
                <div className={styles['no-results']}>
                  <div className={styles['no-results-icon']}>🎬</div>
                  <h3>No movies found</h3>
                  <p>Try adjusting your filters or search terms</p>
                  <button onClick={handleClearFilters} className={`${styles.btn} ${styles['btn-primary']}`}>
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className={styles['movies-grid']}>
                  {movies.map((movie) => (
                    <MovieCard key={movie._id} movie={movie} />
                  ))}
                </div>
              )}
            </div>

            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}

        {moviesLoading && movies.length > 0 && (
          <div className={styles['loading-overlay']}>
            <LoadingSpinner />
          </div>
        )}
      </div>
    </div>
  );
};

export default Movies;