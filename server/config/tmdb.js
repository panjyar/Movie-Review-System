import { create } from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

const tmdbClient = create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY
  },
  timeout: 10000
});

// Add response interceptor for error handling
tmdbClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('TMDB API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

const tmdbService = {
  // Get trending movies
  async getTrendingMovies(timeWindow = 'week') {
    try {
      const response = await tmdbClient.get(`/trending/movie/${timeWindow}`);
      return response.data.results;
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      throw new Error('Failed to fetch trending movies');
    }
  },

  // Get movie details
  async getMovieDetails(movieId) {
    try {
      const [details, credits, videos] = await Promise.all([
        tmdbClient.get(`/movie/${movieId}`),
        tmdbClient.get(`/movie/${movieId}/credits`),
        tmdbClient.get(`/movie/${movieId}/videos`)
      ]);

      return {
        ...details.data,
        credits: credits.data,
        videos: videos.data.results
      };
    } catch (error) {
      console.error('Error fetching movie details:', error);
      throw new Error('Failed to fetch movie details');
    }
  },

  // Search movies
  async searchMovies(query, page = 1) {
    try {
      const response = await tmdbClient.get('/search/movie', {
        params: { query, page }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching movies:', error);
      throw new Error('Failed to search movies');
    }
  },

  // Get popular movies
  async getPopularMovies(page = 1) {
    try {
      const response = await tmdbClient.get('/movie/popular', {
        params: { page }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      throw new Error('Failed to fetch popular movies');
    }
  }
};

export default tmdbService;