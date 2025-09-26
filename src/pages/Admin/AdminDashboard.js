import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import MovieCard from '../../components/MovieCard/MovieCard';
import UserManagement from '../../components/Admin/UserManagement';
import MovieManagement from '../../components/Admin/MovieManagement';
import ReviewManagement from '../../components/Admin/ReviewManagement';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentMovies, setRecentMovies] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, moviesRes, usersRes, reviewsRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/movies?limit=6&sort=newest'),
        axios.get('/api/admin/users?limit=5'),
        axios.get('/api/reviews?limit=5')
      ]);

      setStats(statsRes.data);
      setRecentMovies(moviesRes.data.movies);
      setRecentUsers(usersRes.data.users);
      setRecentReviews(reviewsRes.data.reviews);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading admin dashboard..." />;
  }

  return (
    <div className={styles['admin-dashboard']}>
      <div className={styles['dashboard-header']}>
        <h1>Admin Dashboard</h1>
        <p>Manage movies, users, and reviews</p>
      </div>

      <div className={styles['dashboard-nav']}>
        <button
          className={`${styles['nav-tab']} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`${styles['nav-tab']} ${activeTab === 'movies' ? styles.active : ''}`}
          onClick={() => setActiveTab('movies')}
        >
          🎬 Movies
        </button>
        <button
          className={`${styles['nav-tab']} ${activeTab === 'users' ? styles.active : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button
          className={`${styles['nav-tab']} ${activeTab === 'reviews' ? styles.active : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          ✏️ Reviews
        </button>
      </div>

      <div className={styles['dashboard-content']}>
        {activeTab === 'overview' && (
          <div className={styles['overview-tab']}>
            {stats && (
              <div className={styles['stats-grid']}>
                <div className={styles['stat-card']}>
                  <div className={styles['stat-icon']}>🎬</div>
                  <div className={styles['stat-info']}>
                    <h3>{stats.totalMovies}</h3>
                    <p>Total Movies</p>
                  </div>
                </div>
                <div className={styles['stat-card']}>
                  <div className={styles['stat-icon']}>👥</div>
                  <div className={styles['stat-info']}>
                    <h3>{stats.totalUsers}</h3>
                    <p>Total Users</p>
                  </div>
                </div>
                <div className={styles['stat-card']}>
                  <div className={styles['stat-icon']}>✏️</div>
                  <div className={styles['stat-info']}>
                    <h3>{stats.totalReviews}</h3>
                    <p>Total Reviews</p>
                  </div>
                </div>
                <div className={styles['stat-card']}>
                  <div className={styles['stat-icon']}>⭐</div>
                  <div className={styles['stat-info']}>
                    <h3>{stats.averageRating?.toFixed(1) || 'N/A'}</h3>
                    <p>Average Rating</p>
                  </div>
                </div>
              </div>
            )}

            <div className={styles['recent-sections']}>
              <div className={styles['recent-section']}>
                <h3>Recent Movies</h3>
                <div className={styles['recent-movies-grid']}>
                  {recentMovies.map(movie => (
                    <MovieCard key={movie._id} movie={movie} />
                  ))}
                </div>
              </div>

              <div className={styles['recent-section']}>
                <h3>Recent Users</h3>
                <div className={styles['users-list']}>
                  {recentUsers.map(user => (
                    <div key={user._id} className={styles['user-item']}>
                      <img
                        src={user.profilePicture || 'https://t4.ftcdn.net/jpg/15/49/57/45/360_F_1549574558_m53lb8iAngOfrmYK8lnDYe8sGByNBY2F.jpg'}
                        alt={user.username}
                        className={styles['user-avatar']}
                      />
                      <div className={styles['user-info']}>
                        <h4>{user.username}</h4>
                        <p>{user.email}</p>
                        <small>Joined {new Date(user.createdAt).toLocaleDateString()}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles['recent-section']}>
                <h3>Recent Reviews</h3>
                <div className={styles['reviews-list']}>
                  {recentReviews.map(review => (
                    <div key={review._id} className={styles['review-item']}>
                      <div className={styles['review-header']}>
                        <img
                          src={review.user.profilePicture || 'https://cdni.iconscout.com/illustration/premium/thumb/female-user-image-illustration-svg-download-png-6515859.png'}
                          alt={review.user.username}
                          className={styles['reviewer-avatar']}
                        />
                        <div>
                          <h4>{review.user.username}</h4>
                          <p>⭐ {review.rating}/5</p>
                        </div>
                      </div>
                      <h5>{review.title}</h5>
                      <p className={styles['review-content']}>{review.content.substring(0, 100)}...</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'movies' && <MovieManagement />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'reviews' && <ReviewManagement />}
      </div>
    </div>
  );
};

export default AdminDashboard;