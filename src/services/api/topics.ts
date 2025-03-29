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

// Function to clean and normalize the query
function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .trim(); // Trim leading and trailing spaces
}

export const topicsApi = {
  discover: async (query: string, token: string): Promise<TopicDiscoveryResponse> => {
    try {
      // Normalize the query
      const fixedQuery = normalizeQuery(query);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/topics/discover?user_query=${encodeURIComponent(fixedQuery)}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('🚫 Authentication required. Please check your token.');
        }
        if (response.status === 400) {
          throw new Error('⚠️ Bad request. Check your query syntax.');
        }

        throw new Error(errorData.detail || `Error ${response.status}: Failed to discover topics`);
      }

      const data: TopicDiscoveryResponse = await response.json();


      // Check for incorrect or missing topics
      if (!data.data || !Array.isArray(data.data.topics)) {
        throw new Error('❌ Invalid API response format.');
      }

      return data;
    } catch (error) {
      console.error('❌ Topic discovery error:', error);
      throw error;
    }
  },
};
