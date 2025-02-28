import { API_CONFIG } from '../../config/api';

export interface CreditsResponse {
  success: boolean;
  credits: number;
  unlimited: boolean;
}

export const creditsApi = {
  getCredits: async (token: string): Promise<CreditsResponse> => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/credits/`,
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
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        
        throw new Error(errorData.detail || `Error ${response.status}: Failed to fetch credits`);
      }

      return response.json();
    } catch (error) {
      console.error('Credits fetch error:', error);
      throw error;
    }
  },
};