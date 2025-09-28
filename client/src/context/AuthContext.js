import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'USER_LOADED':
      // Ensure consistent ID field - normalize to 'id'
      const normalizedUser = {
        ...action.payload,
        id: action.payload._id || action.payload.id
      };
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: normalizedUser,
        error: null
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      // Normalize user ID here too
      const normalizedRegUser = action.payload.user ? {
        ...action.payload.user,
        id: action.payload.user._id || action.payload.user.id
      } : null;
      return {
        ...state,
        token: action.payload.token,
        user: normalizedRegUser,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case 'LOGIN_FAIL':
    case 'REGISTER_FAIL':
    case 'AUTH_ERROR':
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: action.payload
      };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        error: null
      };
    case 'PROFILE_UPDATED':
      const updatedUser = {
        ...state.user,
        ...action.payload,
        id: action.payload._id || action.payload.id || state.user.id
      };
      return {
        ...state,
        user: updatedUser
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const loadUser = async () => {
    if (localStorage.token) {
      setAuthToken(localStorage.token);
    }

    try {
      const res = await axios.get('/api/auth/me');
      dispatch({
        type: 'USER_LOADED',
        payload: res.data
      });
    } catch (err) {
      console.error('Auth error:', err.response?.status, err.response?.data);
      dispatch({ type: 'AUTH_ERROR' });
    }
  };

  const register = async (userData) => {
    try {
      const res = await axios.post('/api/auth/register', userData);
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: res.data
      });
      setAuthToken(res.data.token);
      await loadUser(); // Load full user data after registration
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.message || 'Registration failed';
      dispatch({
        type: 'REGISTER_FAIL',
        payload: error
      });
      return { success: false, error };
    }
  };

  const login = async (formData) => {
    try {
      const res = await axios.post('/api/auth/login', formData);
      
      // Check if login was actually successful
      if (!res.data.token || !res.data.user) {
        throw new Error('Invalid login response');
      }
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data
      });
      setAuthToken(res.data.token);
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.message || 'Login failed';
      dispatch({
        type: 'LOGIN_FAIL',
        payload: error
      });
      return { success: false, error };
    }
  };

  const updateProfile = async (formData) => {
    try {
      const res = await axios.put('/api/users/profile', formData);
      dispatch({
        type: 'PROFILE_UPDATED',
        payload: res.data,
      });
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.message || 'Profile update failed';
      return { success: false, error };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await axios.put('/api/users/password', passwordData);
      return { success: true };
    } catch (err) {
      const error = err.response?.data?.message || 'Password change failed';
      return { success: false, error };
    }
  };

  const logout = () => {
    setAuthToken(null);
    dispatch({ type: 'LOGOUT' });
  };

  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' });
  };

  useEffect(() => {
    if (state.token) {
      setAuthToken(state.token);
    }
    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        register,
        login,
        logout,
        clearErrors,
        loadUser,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};