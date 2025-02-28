import { API_CONFIG } from '../../config/api';

export interface Topic {
  title: string;
  topic_discovery_id: number;
  id: number;
  duration: string | null;
  audio_byte_id: string | null;
  content: string | null;
}

export interface TopicDiscoveryResponse {
  success: boolean;
  data: {
    user_query: string;
    user_id: string;
    id: number;
    topics: Topic[];
  };
}

export const topicsApi = {
  discover: async (query: string, token: string): Promise<TopicDiscoveryResponse> => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/topics/discover?user_query=${encodeURIComponent(query)}`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        
        throw new Error(errorData.detail || `Error ${response.status}: Failed to discover topics`);
      }

      return response.json();
    } catch (error) {
      console.error('Topic discovery error:', error);
      throw error;
    }
  },
};