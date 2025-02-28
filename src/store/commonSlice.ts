import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Topic } from '../services/api/topics';

export interface CommonState {
  discoverTopics: Topic[];
  selectedTopicIds: number[];
  searchedTopicString: string;
}

const initialState: CommonState = {
  discoverTopics: [],
  selectedTopicIds: [],
  searchedTopicString: '',
};

export const commonSlice = createSlice({
  name: 'common-slice',
  initialState,
  reducers: {
    setDiscoverTopics: (state, action: PayloadAction<Topic[]>) => {
      state.discoverTopics = action.payload;
      // When new topics are set, automatically select all of them
      state.selectedTopicIds = action.payload.map((topic) => topic.id);
    },
    setSelectedTopicIds: (state, action: PayloadAction<number[]>) => {
      state.selectedTopicIds = action.payload;
    },
    resetCommonState: (state) => {
      state.discoverTopics = [];
      state.selectedTopicIds = [];
    },
    setSearchedTopicString: (state, action: PayloadAction<string>) => {
      state.searchedTopicString = action.payload;
    },
  },
});

export const {
  setDiscoverTopics,
  setSelectedTopicIds,
  resetCommonState,
  setSearchedTopicString,
} = commonSlice.actions;

export default commonSlice.reducer;
