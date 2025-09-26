import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import Pagination from '../Pagination/Pagination'; // IMPROVEMENT: Import reusable Pagination component
import styles from './AdminComponents.module.css';

const MovieManagement = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGenre, setFilterGenre] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);

  const genres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
    'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music', 'Mystery',
    'Romance', 'Science Fiction', 'Thriller', 'War', 'Western'
  ];

  const initialFormState = {
    title: '',
    description: '',
    genre: '',
    releaseYear: '',
    director: '',
    cast: '',
    duration: '',
    posterUrl: '',
    trailerUrl: ''
  };

  const [movieForm, setMovieForm] = useState(initialFormState);

  useEffect(() => {
    fetchMovies(currentPage);
  }, [currentPage]);
  
  const fetchMovies = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page,
        limit: 10,
        search: searchTerm,
        genre: filterGenre !== 'all' ? filterGenre : ''
      });

      const response = await axios.get(`/api/movies?${params}`);
      setMovies(response.data.movies);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast.error('Failed to fetch movies');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMovies(1);
  };
  
  useEffect(() => {
    if(currentPage !== 1) {
      setCurrentPage(1)
    } else {
      fetchMovies(1)
    }
  }, [searchTerm, filterGenre]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMovieForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setMovieForm(initialFormState);
    setEditingMovie(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const movieData = {
        ...movieForm,
        cast: movieForm.cast.split(',').map(name => name.trim()),
        releaseYear: parseInt(movieForm.releaseYear),
        duration: parseInt(movieForm.duration)
      };

      if (editingMovie) {
        await axios.put(`/api/movies/${editingMovie._id}`, movieData);
        toast.success('Movie updated successfully');
      } else {
        await axios.post('/api/movies', movieData);
        toast.success('Movie added successfully');
      }

      resetForm();
      fetchMovies(currentPage);
    } catch (error) {
      console.error('Error saving movie:', error);
      toast.error('Failed to save movie');
    }
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setMovieForm({
      title: movie.title || '',
      description: movie.description || '',
      genre: movie.genre || '',
      releaseYear: movie.releaseYear?.toString() || '',
      director: movie.director || '',
      cast: movie.cast?.join(', ') || '',
      duration: movie.duration?.toString() || '',
      posterUrl: movie.posterUrl || '',
      trailerUrl: movie.trailerUrl || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (movieId) => {
    if (!window.confirm('Are you sure you want to delete this movie?')) {
      return;
    }

    try {
      await axios.delete(`/api/movies/${movieId}`);
      toast.success('Movie deleted successfully');
      fetchMovies(currentPage);
    } catch (error) {
      console.error('Error deleting movie:', error);
      toast.error('Failed to delete movie');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMovies.length === 0) {
      toast.warning('Please select movies first');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedMovies.length} movies?`)) {
      return;
    }

    try {
      await axios.delete('/api/movies/bulk', {
        data: { movieIds: selectedMovies }
      });
      toast.success(`${selectedMovies.length} movies deleted successfully`);
      setSelectedMovies([]);
      fetchMovies(currentPage);
    } catch (error) {
      console.error('Error deleting movies:', error);
      toast.error('Failed to delete movies');
    }
  };

  const handleSelectMovie = (movieId) => {
    setSelectedMovies(prev =>
      prev.includes(movieId)
        ? prev.filter(id => id !== movieId)
        : [...prev, movieId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMovies.length === movies.length) {
      setSelectedMovies([]);
    } else {
      setSelectedMovies(movies.map(movie => movie._id));
    }
  };

  if (loading && movies.length === 0) {
    return <LoadingSpinner text="Loading movies..." />;
  }

  return (
    <div className={styles.adminComponent}>
      <div className={styles.componentHeader}>
        <h2>Movie Management</h2>
        <p>Add, edit, and manage movies in the database</p>
        <button
          onClick={() => setShowAddForm(true)}
          className={styles.addButton}
        >
          Add New Movie
        </button>
      </div>

      {showAddForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{editingMovie ? 'Edit Movie' : 'Add New Movie'}</h3>
              <button onClick={resetForm} className={styles.closeButton}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.movieForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={movieForm.title}
                    onChange={handleInputChange}
                    required
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Genre *</label>
                  <select
                    name="genre"
                    value={movieForm.genre}
                    onChange={handleInputChange}
                    required
                    className={styles.formInput}
                  >
                    <option value="">Select Genre</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Release Year *</label>
                  <input
                    type="number"
                    name="releaseYear"
                    value={movieForm.releaseYear}
                    onChange={handleInputChange}
                    required
                    min="1900"
                    max={new Date().getFullYear() + 5}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Duration (minutes) *</label>
                  <input
                    type="number"
                    name="duration"
                    value={movieForm.duration}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Director *</label>
                <input
                  type="text"
                  name="director"
                  value={movieForm.director}
                  onChange={handleInputChange}
                  required
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Cast (comma-separated)</label>
                <input
                  type="text"
                  name="cast"
                  value={movieForm.cast}
                  onChange={handleInputChange}
                  placeholder="Actor 1, Actor 2, Actor 3"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description *</label>
                <textarea
                  name="description"
                  value={movieForm.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  className={styles.formTextarea}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Poster URL</label>
                  <input
                    type="url"
                    name="posterUrl"
                    value={movieForm.posterUrl}
                    onChange={handleInputChange}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Trailer URL</label>
                  <input
                    type="url"
                    name="trailerUrl"
                    value={movieForm.trailerUrl}
                    onChange={handleInputChange}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={resetForm}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton}>
                  {editingMovie ? 'Update Movie' : 'Add Movie'}
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
            placeholder="Search movies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            Search
          </button>
        </form>

        <div className={styles.filterGroup}>
          <label>Filter by Genre:</label>
          <select
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Genres</option>
            {genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedMovies.length > 0 && (
        <div className={styles.bulkActions}>
          <span>{selectedMovies.length} movie(s) selected</span>
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
                  checked={movies.length > 0 && selectedMovies.length === movies.length}
                  onChange={handleSelectAll}
                  className={styles.checkbox}
                />
              </th>
              <th>Movie</th>
              <th>Genre</th>
              <th>Year</th>
              <th>Director</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {movies.map(movie => (
              <tr key={movie._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedMovies.includes(movie._id)}
                    onChange={() => handleSelectMovie(movie._id)}
                    className={styles.checkbox}
                  />
                </td>
                <td>
                  <div className={styles.movieInfo}>
                    <img
                      src={movie.posterUrl || '/default-movie-poster.png'}
                      alt={movie.title}
                      className={styles.moviePoster}
                    />
                    <div>
                      <div className={styles.movieTitle}>{movie.title}</div>
                      <div className={styles.movieDescription}>
                        {movie.description.substring(0, 100)}...
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={styles.genreTag}>{movie.genre}</span>
                </td>
                <td>{movie.releaseYear}</td>
                <td>{movie.director}</td>
                <td>
                  <div className={styles.ratingInfo}>
                    <span className={styles.ratingNumber}>
                      {movie.averageRating?.toFixed(1) || 'N/A'}
                    </span>
                    <span className={styles.ratingCount}>
                      ({movie.totalReviews} reviews)
                    </span>
                  </div>
                </td>
                <td>
                  <div className={styles.actionButtons}>
                    <button
                      onClick={() => handleEdit(movie)}
                      className={styles.editButton}
                      title="Edit Movie"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(movie._id)}
                      className={styles.deleteButton}
                      title="Delete Movie"
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

      {loading && movies.length > 0 && (
        <div className={styles.loadingOverlay}>
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

export default MovieManagement;