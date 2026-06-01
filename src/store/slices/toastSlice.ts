import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  items: ToastItem[];
}

const toastSlice = createSlice({
  name: 'toast',
  initialState: { items: [] } as ToastState,
  reducers: {
    addToast(state, action: PayloadAction<{ message: string; type?: ToastType }>) {
      state.items.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        message: action.payload.message,
        type: action.payload.type ?? 'success',
      });
    },
    removeToast(state, action: PayloadAction<string>) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { addToast, removeToast } = toastSlice.actions;
export default toastSlice.reducer;
