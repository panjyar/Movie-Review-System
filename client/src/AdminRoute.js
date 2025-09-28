import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';

const AdminRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingSpinner text="Checking permissions..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user || user.role !== 'admin') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#e53e3e', marginBottom: '1rem' }}>Access Denied</h2>
        <p style={{ color: '#718096', fontSize: '1.1rem' }}>
          You don't have permission to access the admin dashboard.
        </p>
        <button
          onClick={() => window.history.back()}
          style={{
            marginTop: '1.5rem',
            padding: '12px 24px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return children;
};

export default AdminRoute;