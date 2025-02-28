import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG } from '../config/api';
import { creditsApi } from '../services/api/credits';

interface AuthUser {
  id: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  full_name?: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  detail?: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const cachedUser = localStorage.getItem('auth_user');
    return cachedUser ? JSON.parse(cachedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Fetch user data on initial mount if we have a token but no cached user
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) return;

      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: 'application/json',
          },
        });

        if (!response.ok) {
          // If token is invalid, clear it
          if (response.status === 401) {
            logout();
            return;
          }
          throw new Error('Failed to get user info');
        }

        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
      } catch (err) {
        console.error('Auth check failed:', err);
        logout();
      }
    };

    if (token && !user) {
      fetchUserData();
    }
  }, [token, user]); // Run when token or user changes

  // Listen for storage events to handle logout in other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        // If token was removed in another tab
        if (!e.newValue) {
          setToken(null);
          setUser(null);
        } 
        // If token was added in another tab
        else if (e.newValue !== token) {
          setToken(e.newValue);
          // We'll let the other useEffect fetch the user data
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [token]);

  const fetchCredits = async (authToken: string) => {
    try {
      // Use the creditsApi to fetch credits
      await creditsApi.getCredits(authToken);
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      clearError();

      const formData = new URLSearchParams();
      formData.append('grant_type', 'password');
      formData.append('username', email);
      formData.append('password', password);
      formData.append('scope', '');
      formData.append('client_id', 'string');
      formData.append('client_secret', 'string');

      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/jwt/login`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || 'Login failed');
      }

      // Get user data after successful login
      const userResponse = await fetch(`${API_CONFIG.BASE_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          accept: 'application/json',
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user data');
      }

      const userData = await userResponse.json();

      // Save both token and user data
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      setToken(data.access_token);
      setUser(userData);
      
      // Fetch credits after successful login
      await fetchCredits(data.access_token);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      clearError();

      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: name, // Include full_name in the registration
          is_active: true,
          is_superuser: false,
          is_verified: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      // Automatically login after successful registration
      await login(email, password);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  }, []);

  return {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };
}