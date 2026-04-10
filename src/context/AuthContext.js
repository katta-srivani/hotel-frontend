import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

const getAuthPayload = (responseData) => {
  const payload = responseData?.data || responseData || {};
  const token = payload?.token;
  const user = payload?.user;

  if (!token || typeof token !== 'string' || !user) {
    return null;
  }

  return { token, user };
};

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete api.defaults.headers['Authorization'];
};

const persistSession = (token, user, setToken, setUser, setIsAuthenticated) => {
  setToken(token);
  setUser(user);
  setIsAuthenticated(true);
  api.defaults.headers['Authorization'] = `Bearer ${token}`;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (!savedToken || !savedUser) {
          delete api.defaults.headers['Authorization'];
          return;
        }

        const parsedUser = JSON.parse(savedUser);
        api.defaults.headers['Authorization'] = `Bearer ${savedToken}`;

        // Validate token once on app load to avoid stale-token flicker loops.
        const profileRes = await api.get('/users/profile');
        const profileUser = profileRes?.data?.data || parsedUser;
        persistSession(savedToken, profileUser, setToken, setUser, setIsAuthenticated);
      } catch (err) {
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const register = async (firstName, email, password, phone = '', lastName = '') => {
    try {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const response = await api.post('/users/register', { firstName, lastName, email: normalizedEmail, password, passwordConfirm: password, phone });
      const auth = getAuthPayload(response.data);

      if (!auth) {
        return { success: false, message: 'Invalid registration response from server' };
      }

      const { token, user } = auth;
      persistSession(token, user, setToken, setUser, setIsAuthenticated);

      return { success: true };
    } catch (error) {
      const message =
        error.code === 'ECONNABORTED'
          ? 'Server took too long to respond. Please try again.'
          : error.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  };

  const login = async (email, password) => {
    try {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const response = await api.post('/users/login', { email: normalizedEmail, password });
      const auth = getAuthPayload(response.data);

      if (!auth) {
        return { success: false, message: 'Invalid login response from server' };
      }

      const { token, user } = auth;
      persistSession(token, user, setToken, setUser, setIsAuthenticated);

      return { success: true };
    } catch (error) {
      const message =
        error.code === 'ECONNABORTED'
          ? 'Server took too long to respond. Please try again.'
          : error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    clearSession();
  };

  const updateProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, register, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}