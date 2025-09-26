import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import styles from './SearchFilters.module.css';

const SearchFilters = ({ filters, onFilterChange, onSearch, onClear, loading }) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
   const debouncedSearch = useCallback(
    debounce((term) => {
      onFilterChange({ search: term });
    }, 500),
    [onFilterChange]
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const genres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
    'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
    'Romance', 'Science Fiction', 'Thriller', 'War', 'Western'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'averageRating', label: 'Highest Rated' },
    { value: 'totalReviews', label: 'Most Reviewed' }
  ];

  useEffect(() => {
    setSearchTerm(filters.search || '');
  }, [filters.search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onFilterChange({ search: searchTerm });
    onSearch();
  };

  const handleFilterSelect = (filterType, value) => {
    onFilterChange({ [filterType]: value });
  };

  const hasActiveFilters = filters.search || filters.genre || filters.year;

  return (
    <div className={styles['search-filters']}>
      <form onSubmit={handleSearchSubmit} className={styles['search-form']}>
        <div className={styles['search-input-group']}>
          <input
            type="text"
            placeholder="Search movies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles['search-input']}
          />
          <button 
            type="submit" 
            className={styles['search-button']}
            disabled={loading}
          >
            {loading ? '⏳' : '🔍'}
          </button>
        </div>
      </form>

      <div className={styles['filters-row']}>
        <div className={styles['filter-group']}>
          <label>Genre</label>
          <select
            value={filters.genre || ''}
            onChange={(e) => handleFilterSelect('genre', e.target.value)}
            className={styles['filter-select']}
          >
            <option value="">All Genres</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        <div className={styles['filter-group']}>
          <label>Year</label>
          <select
            value={filters.year || ''}
            onChange={(e) => handleFilterSelect('year', e.target.value)}
            className={styles['filter-select']}
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className={styles['filter-group']}>
          <label>Sort by</label>
          <select
            value={filters.sort || 'newest'}
            onChange={(e) => handleFilterSelect('sort', e.target.value)}
            className={styles['filter-select']}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button onClick={onClear} className={styles['clear-button']}>
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchFilters;