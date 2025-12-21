import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { safeLocalStorage, safeJSONParse } from '../utils/browserCompatibility';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = safeLocalStorage.getItem('token');
    const savedUser = safeLocalStorage.getItem('user');
    
    if (token && savedUser) {
      const parsedUser = safeJSONParse(savedUser);
      if (parsedUser) {
        setUser(parsedUser);
      }
      // Verify token is still valid
      api.get('/auth/me')
        .then(response => {
          if (response && response.data) {
            setUser(response.data);
            safeLocalStorage.setItem('user', JSON.stringify(response.data));
          }
        })
        .catch(() => {
          safeLocalStorage.removeItem('token');
          safeLocalStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => {
          if (setLoading) {
            setLoading(false);
          }
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response && response.data) {
        const { token, user } = response.data;
        if (token) {
          safeLocalStorage.setItem('token', token);
        }
        if (user) {
          safeLocalStorage.setItem('user', JSON.stringify(user));
          setUser(user);
          return user;
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, username, password) => {
    await api.post('/auth/register', { email, username, password });
  };

  const logout = () => {
    safeLocalStorage.removeItem('token');
    safeLocalStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    if (updatedUser) {
      setUser(updatedUser);
      safeLocalStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

