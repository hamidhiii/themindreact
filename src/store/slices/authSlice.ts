import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, AuthErrorType } from '../../types';

function decodeJwt(token: string): Record<string, unknown> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return {};
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function jwtPayload(token: string | null): Record<string, unknown> {
  if (!token) return {};
  return decodeJwt(token);
}

export function getUserIdFromToken(token: string | null): string | null {
  const p = jwtPayload(token);
  const v = p['user_id'];
  return v != null ? String(v) : null;
}

export function getRoleFromToken(token: string | null): string | null {
  const p = jwtPayload(token);
  const v = p['role'] ?? p['user_role'] ?? p['system_role'];
  return v != null ? String(v) : null;
}

export function getUsernameFromToken(token: string | null): string | null {
  const p = jwtPayload(token);
  const v = p['username'];
  return v != null ? String(v) : null;
}

const storedAccess = localStorage.getItem('accessToken');
const storedRefresh = localStorage.getItem('refreshToken');
const storedRole = localStorage.getItem('role') ?? getRoleFromToken(storedAccess);
const storedUsername = localStorage.getItem('username') ?? getUsernameFromToken(storedAccess);

const initialState: AuthState = {
  accessToken: storedAccess,
  refreshToken: storedRefresh,
  role: storedRole,
  username: storedUsername,
  isLoggedIn: !!storedAccess,
  status: 'initial',
  errorMessage: null,
  errorType: 'unknown',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string; role: string; username?: string }>
    ) => {
      const { accessToken, refreshToken, role } = action.payload;
      const username = action.payload.username ?? getUsernameFromToken(accessToken) ?? '';
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.role = role;
      state.username = username;
      state.isLoggedIn = true;
      state.status = 'success';
      state.errorMessage = null;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('role', role);
      localStorage.setItem('username', username);
    },
    setAuthLoading: (state) => {
      state.status = 'loading';
      state.errorMessage = null;
    },
    setAuthError: (
      state,
      action: PayloadAction<{ message: string; errorType: AuthErrorType }>
    ) => {
      state.status = 'error';
      state.errorMessage = action.payload.message;
      state.errorType = action.payload.errorType;
    },
    logout: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.role = null;
      state.username = null;
      state.isLoggedIn = false;
      state.status = 'initial';
      state.errorMessage = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
    },
  },
});

export const { setCredentials, setAuthLoading, setAuthError, logout } = authSlice.actions;
export default authSlice.reducer;
