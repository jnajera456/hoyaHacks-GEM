'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
}

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Include cookies
      });

      if (process.env.NODE_ENV !== 'production') {
        console.log('useAuth /api/auth/me status', response.status);
      }

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else if (response.status === 401) {
        setUser(null);
        setError('Not authenticated');
      } else {
        setUser(null);
        setError('Failed to fetch user');
      }
    } catch (err) {
      setUser(null);
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Immediately clear user state for instant UI feedback
      setUser(null);
      setLoading(true);
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Use replace instead of push to prevent back button issues
      // Use window.location for hard navigation to clear all state
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed:', err);
      // Still redirect even if API call fails (cookie might already be cleared)
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return {
    user,
    loading,
    error,
    refetch: fetchUser,
    logout,
  };
}
