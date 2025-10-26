// store.js
import { configureStore } from '@reduxjs/toolkit';
import timerReducer from './timerslicer';

const store = configureStore({
  reducer: {
    timer: timerReducer,
  },
});

export default store;
