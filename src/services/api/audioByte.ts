import { API_CONFIG } from '../../config/api';
import { Topic } from './topics';

export interface AudioByteResponse {
  success: boolean;
  data: {
    id: number;
    user_id: string;
    status: string;
    approximate_duration: number;
    style: string;
    topic_discovery_id: number;
    selected_topics: Topic[];
    audio_file: string | null;
  };
}

export interface AudioFileResponse {
  success: boolean;
  url: string;
}

export const audioByteApi = {
  generate: async (
    topicDiscoveryId: number,
    selectedTopicIds: number[],
    token: string,
    duration: number = 180,
    style: string = 'narrative'
  ): Promise<AudioByteResponse> => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GENERATE_AUDIO_BYTE}`,
        {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            duration,
            selected_topic_ids: selectedTopicIds,
            style,
            topic_discovery_id: topicDiscoveryId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        
        throw new Error(errorData.detail || `Error ${response.status}: Failed to generate audio byte`);
      }

      return response.json();
    } catch (error) {
      console.error('Audio byte generation error:', error);
      throw error;
    }
  },
  
  getAudioFile: async (audioByteId: number, token: string): Promise<AudioFileResponse> => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/audio-bytes/${audioByteId}/file`,
        {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        
        throw new Error(errorData.detail || `Error ${response.status}: Failed to get audio file URL`);
      }

      return response.json();
    } catch (error) {
      console.error('Audio file fetch error:', error);
      throw error;
    }
  }
};