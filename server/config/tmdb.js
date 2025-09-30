import { create } from 'axios';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

const tmdbClient = create({
  baseURL: TMDB_BASE_URL,
  params: { api_key: TMDB_API_KEY },
  timeout: 10000
});

// Response interceptor for logging errors
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
  // Helper to fetch multiple pages
  async fetchMultiplePages(endpoint, count = 100, extraParams = {}) {
    const movies = [];
    const moviesPerPage = 20;
    const totalPages = Math.ceil(count / moviesPerPage);

    for (let page = 1; page <= totalPages; page++) {
      const response = await tmdbClient.get(endpoint, {
        params: { page, ...extraParams }
      });
      movies.push(...response.data.results);
    }

    return movies.slice(0, count);
  },

  // Get trending movies
  async getTrendingMovies(count = 100, timeWindow = 'week') {
    try {
      return await this.fetchMultiplePages(`/trending/movie/${timeWindow}`, count);
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      throw new Error('Failed to fetch trending movies');
    }
  },

  // Get popular movies
  async getPopularMovies(count = 100) {
    try {
      return await this.fetchMultiplePages('/movie/popular', count);
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      throw new Error('Failed to fetch popular movies');
    }
  },

  // Search movies
  async searchMovies(query, count = 100) {
    try {
      return await this.fetchMultiplePages('/search/movie', count, { query });
    } catch (error) {
      console.error('Error searching movies:', error);
      throw new Error('Failed to search movies');
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
  }
};

export default tmdbService;
