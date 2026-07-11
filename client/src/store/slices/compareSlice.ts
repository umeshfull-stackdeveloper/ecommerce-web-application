import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CompareState {
  items: any[];
}

const compareSlice = createSlice({
  name: 'compare',
  initialState: {
    items: [],
  } as CompareState,
  reducers: {
    addToCompare(state, action: PayloadAction<any>) {
      if (state.items.length >= 4) {
        return;
      }
      if (!state.items.find((item) => item.id === action.payload.id)) {
        state.items.push(action.payload);
      }
    },
    removeFromCompare(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    clearCompare(state) {
      state.items = [];
    },
  },
});

export const { addToCompare, removeFromCompare, clearCompare } = compareSlice.actions;
export default compareSlice.reducer;
