import { useState, useEffect, useCallback } from 'react';
import { creditsApi } from '../services/api/credits';

interface UseCreditsReturn {
  credits: number | null;
  unlimited: boolean;
  isLoading: boolean;
  error: string | null;
  fetchCredits: () => Promise<void>;
}

export function useCredits(): UseCreditsReturn {
  const [credits, setCredits] = useState<number | null>(null);
  const [unlimited, setUnlimited] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setCredits(null);
      setUnlimited(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await creditsApi.getCredits(token);
      
      setCredits(response.credits);
      setUnlimited(response.unlimited);
    } catch (err) {
      console.error('Failed to fetch credits:', err);
      setError('Failed to fetch credits');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Only fetch credits on initial load if user is authenticated
  // We don't want to fetch credits automatically without login
  // This will be called explicitly after login/register
  useEffect(() => {
    // We don't auto-fetch credits anymore
    // Credits will be fetched after login/register
  }, []);

  return {
    credits,
    unlimited,
    isLoading,
    error,
    fetchCredits
  };
}