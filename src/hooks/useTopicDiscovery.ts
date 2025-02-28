import { useState } from 'react';
import { useAuth } from './useAuth';
import { topicsApi, Topic } from '../services/api/topics';

interface UseTopicDiscoveryReturn {
  discover: (query: string) => Promise<void>;
  topics: Topic[];
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useTopicDiscovery(): UseTopicDiscoveryReturn {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const clearError = () => setError(null);

  const discover = async (query: string) => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setIsLoading(true);
      clearError();
      const response = await topicsApi.discover(query, token);
      setTopics(response.data.topics);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to discover topics';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    discover,
    topics,
    isLoading,
    error,
    clearError,
  };
}