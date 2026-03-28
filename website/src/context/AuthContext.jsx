import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check local storage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('scrollNote_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem('scrollNote_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (response.ok && !data.error) {
      setUser(data.user);
      localStorage.setItem('scrollNote_user', JSON.stringify(data.user));
      return { success: true };
    }
    return { success: false, message: data.message || 'Login failed' };
  };

  const register = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    // Some APIs might auto-login or just return plain success. Assuming it behaves like signin or returns data
    const data = await response.json();
    if (response.ok && !data.error) {
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('scrollNote_user', JSON.stringify(data.user));
      }
      return { success: true };
    }
    return { success: false, message: data.message || 'Registration failed' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('scrollNote_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
