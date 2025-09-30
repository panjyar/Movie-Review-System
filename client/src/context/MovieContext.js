import React, { createContext, useContext, useReducer } from 'react';
import axios from 'axios';

const MovieContext = createContext();

const initialState = {
  movies: [],
  currentMovie: null,
  trendingMovies: [],
  filters: {
    search: '',
    genre: '',
    year: '',
    sort: 'newest'
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalMovies: 0
  },
  loading: false,
  error: null
};

const movieReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_MOVIES':
      return {
        ...state,
        movies: action.payload.movies,
        pagination: action.payload.pagination,
        loading: false,
        error: null
      };
    case 'SET_TRENDING_MOVIES':
      return {
        ...state,
        trendingMovies: action.payload,
        loading: false
      };
    case 'SET_CURRENT_MOVIE':
      return {
        ...state,
        currentMovie: action.payload,
        loading: false
      };
    case 'UPDATE_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      };
    case 'ADD_REVIEW':
      if (state.currentMovie) {
        return {
          ...state,
          currentMovie: {
            ...state.currentMovie,
            recentReviews: [action.payload, ...state.currentMovie.recentReviews.slice(0, 4)]
          }
        };
      }
      return state;
    default:
      return state;
  }
};

export const MovieProvider = ({ children }) => {
  const [state, dispatch] = useReducer(movieReducer, initialState);

  // Fetch movies with filters
  const fetchMovies = async (page = 1, filters = {}) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // FIX: Clean the parameters to remove empty values before sending to the API.
      const allParams = { page, ...filters };
      const cleanedParams = {};
      Object.keys(allParams).forEach(key => {
        if (allParams[key] !== '' && allParams[key] !== null) {
          cleanedParams[key] = allParams[key];
        }
      });

      const res = await axios.get('/api/movies', { params: cleanedParams }); // Use the cleaned parameters
      dispatch({ type: 'SET_MOVIES', payload: res.data });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.response?.data?.message || 'Error fetching movies' });
    }
  };

  // Fetch trending movies
 // Corrected function in MovieProvider

const fetchTrendingMovies = async () => {
  dispatch({ type: 'SET_LOADING', payload: true });
  try {
    const res = await axios.get('/api/movies/trending');
    // FIX: Access the nested .data property to get the array of movies
    dispatch({ type: 'SET_TRENDING_MOVIES', payload: res.data.data }); 
  } catch (err) {
    dispatch({ type: 'SET_ERROR', payload: err.response?.data?.message || 'Error fetching trending movies' });
  }
};

  // Fetch single movie
  const fetchMovie = async (id) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await axios.get(`/api/movies/${id}`);
      dispatch({ type: 'SET_CURRENT_MOVIE', payload: res.data });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.response?.data?.message || 'Error fetching movie' });
    }
  };

  // Submit review
  const submitReview = async (movieId, reviewData) => {
    try {
      const res = await axios.post(`/api/movies/${movieId}/reviews`, reviewData);
      dispatch({ type: 'ADD_REVIEW', payload: res.data });
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.message || 'Error submitting review';
      dispatch({ type: 'SET_ERROR', payload: error });
      return { success: false, error };
    }
  };

  // Update filters
  const updateFilters = (newFilters) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: newFilters });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <MovieContext.Provider
      value={{
        ...state,
        fetchMovies,
        fetchTrendingMovies,
        fetchMovie,
        submitReview,
        updateFilters,
        clearError
      }}
    >
      {children}
    </MovieContext.Provider>
  );
};

export const useMovies = () => {
  const context = useContext(MovieContext);
  if (!context) {
    throw new Error('useMovies must be used within a MovieProvider');
  }
  return context;
};