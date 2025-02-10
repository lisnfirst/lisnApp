import { configureStore } from '@reduxjs/toolkit';
import topicsReducer from './topicsSlice';
import commonSlice from './commonSlice';
('');

export const store = configureStore({
  reducer: {
    topics: topicsReducer,
    commonState: commonSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
