import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { topicsApi, Topic } from '../services/api/topics';

interface TopicsState {
  topics: Topic[];
  loading: boolean;
  error: string | null;
  cachedQueries: Record<string, Topic[]>;
  lastQuery: string | null;
}

const initialState: TopicsState = {
  topics: [],
  loading: false,
  error: null,
  cachedQueries: {},
  lastQuery: null,
};

export const discoverTopics = createAsyncThunk(
  'topics/discover',
  async ({ query, token }: { query: string; token: string | null }, { getState, rejectWithValue }) => {
    const state = getState() as { topics: TopicsState };

    // If the query is cached and it's the same as last query, return cached results
    if (state.topics.cachedQueries[query] && state.topics.lastQuery === query) {
      return { topics: state.topics.cachedQueries[query], fromCache: true };
    }

    try {
      if (!token) {
        return rejectWithValue('Authentication required');
      }
      
      const response = await topicsApi.discover(query, token);
      return { topics: response.data.topics, fromCache: false };
    } catch (err: any) {
      // Handle specific API errors
      if (err.message === 'Failed to fetch' || err.message.includes('NetworkError')) {
        return rejectWithValue('Network error. Please check your connection.');
      }
      
      // Handle authentication errors
      if (err.message.includes('401') || err.message.includes('Unauthorized') || err.message.includes('Authentication required')) {
        return rejectWithValue('Authentication required');
      }
      
      return rejectWithValue(
        err instanceof Error ? err.message : 'Failed to discover topics'
      );
    }
  }
);

const topicsSlice = createSlice({
  name: 'topics',
  initialState,
  reducers: {
    clearTopics: (state) => {
      state.topics = [];
      state.error = null;
      state.lastQuery = null;
    },
    resetTopicDiscovery: (state) => {
      state.topics = [];
      state.error = null;
      state.lastQuery = null;
      state.cachedQueries = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(discoverTopics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(discoverTopics.fulfilled, (state, action) => {
        const { topics, fromCache } = action.payload;
        state.topics = topics;
        state.loading = false;
        state.error = null;

        if (!fromCache) {
          // Only cache if it's a new query
          state.cachedQueries[action.meta.arg.query] = topics;
        }
        state.lastQuery = action.meta.arg.query;
      })
      .addCase(discoverTopics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearTopics, resetTopicDiscovery } = topicsSlice.actions;
export default topicsSlice.reducer;