import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/TempAuth';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles['nav-container']}>
        <Link to="/" className={styles['nav-logo']}>
          🎬 MovieReviews
        </Link>
        
        <div className={`${styles['nav-menu']} ${isMenuOpen ? styles.active : ''}`}>
          <Link to="/" className={styles['nav-link']} onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>
          <Link to="/movies" className={styles['nav-link']} onClick={() => setIsMenuOpen(false)}>
            Movies
          </Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/profile" className={styles['nav-link']} onClick={() => setIsMenuOpen(false)}>
                Profile
              </Link>
              {user?.isAdmin && (
                <Link to="/admin" className={styles['nav-link']} onClick={() => setIsMenuOpen(false)}>
                  Admin
                </Link>
              )}
              <button onClick={handleLogout} className={`${styles['nav-link']} ${styles['logout-btn']}`}>
                Logout
              </button>
              <div className={styles['user-info']}>
                <img 
                  src={user?.profilePicture || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face&auto=format'} 
                  alt={user?.username}
                  className={styles['user-avatar']}
                />
                <span className={styles.username}>{user?.username}</span>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className={styles['nav-link']} onClick={() => setIsMenuOpen(false)}>
                Login
              </Link>
              <Link to="/register" className={`${styles['nav-link']} ${styles['register-btn']}`} onClick={() => setIsMenuOpen(false)}>
                Register
              </Link>
            </>
          )}
        </div>

        <div 
          className={`${styles['nav-toggle']} ${isMenuOpen ? styles.active : ''}`} 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;