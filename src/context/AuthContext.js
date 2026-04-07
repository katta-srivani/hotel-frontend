import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      api.defaults.headers['Authorization'] = `Bearer ${savedToken}`;
    }
    setLoading(false);
  }, []);

  const register = async (firstName, email, password, phone = '', lastName = '') => {
    try {
      const response = await api.post('/users/register', {
        firstName,
        lastName,
        email,
        password,
        passwordConfirm: password,
        phone,
      });

      const { token, user } = response.data.data || response.data;

      setToken(token);
      setUser(user);
      setIsAuthenticated(true);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers['Authorization'] = `Bearer ${token}`;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/users/login', { email, password });

      const { token, user } = response.data.data || response.data;

      setToken(token);
      setUser(user);
      setIsAuthenticated(true);

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers['Authorization'] = `Bearer ${token}`;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers['Authorization'];
  };

  const updateProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        register,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
