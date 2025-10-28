// timerSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk to fetch the remaining exam time from the server
export const fetchExamTimeThunk = createAsyncThunk('timer/fetchExamTime', async () => {
 
  const isDeployed = true;
  const API = isDeployed ? "" : "http://localhost:3002";
 
  const response = await fetch(`${API}/questionsAPI`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

   if (!response.ok) {
      console.error(`OServer error ${response.status}: ${await response.text()}`);
      return;
    }

  const data = await response.json();
  console.log("T " + data.timer);
  return data.timer;
});

const timerSlice = createSlice({
  name: 'timer',
  initialState: {
    timeLeft: -1,
    error: null,
    isLoading: false,
  },
  reducers: {
    updateTime: (state, action) => {
      state.timeLeft = action.payload;
    },
    decrementTimer: (state) => {
      if (state.timeLeft > 0) state.timeLeft -= 1;
    },
    resetTimer: (state) => {
      state.timeLeft = -1; // reset to initial value or 0
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExamTimeThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchExamTimeThunk.fulfilled, (state, action) => {
        state.timeLeft = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchExamTimeThunk.rejected, (state, action) => {
        state.error = action.error.message;
        state.isLoading = false;
      });
  },
});

export const { updateTime, decrementTimer, resetTimer } = timerSlice.actions;
export default timerSlice.reducer;
