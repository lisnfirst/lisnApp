import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { TopicResponse } from '../types';
import { API_CONFIG } from '../config/api';

interface TopicsState {
  topics: TopicResponse['data'] | null;
  loading: boolean;
  error: string | null;
}

const initialState: TopicsState = {
  topics: null,
  loading: false,
  error: null,
};

export const fetchTopics = createAsyncThunk(
  'topics/fetchTopics',
  async (query: string) => {
    const url = `${API_CONFIG.BASE_URL}${
      API_CONFIG.ENDPOINTS.TOPICS_DISCOVER
    }?user_query=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${API_CONFIG.AUTH_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch topics');
    }

    const data: TopicResponse = await response.json();
    return data?.data;
  }
);

const topicsSlice = createSlice({
  name: 'topics',
  initialState,
  reducers: {
    clearTopics: (state) => {
      state.topics = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTopics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchTopics.fulfilled,
        (state, action: PayloadAction<TopicResponse['data']>) => {
          state.topics = action.payload;
          state.loading = false;
          state.error = null;
        }
      )
      .addCase(fetchTopics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch topics';
      });
  },
});

export const { clearTopics } = topicsSlice.actions;
export default topicsSlice.reducer;