import { createSlice } from '@reduxjs/toolkit';

export interface CommonState {
  discoverTopics: [];
}

const initialState: CommonState = {
  discoverTopics: [],
};

export const commonSlice = createSlice({
  name: 'common-slice',
  initialState,
  reducers: {
    setDiscoverTopics: (state, action) => {
      state.discoverTopics = action.payload;
    },
  },
});

export const { setDiscoverTopics } = commonSlice.actions;

export default commonSlice.reducer;
