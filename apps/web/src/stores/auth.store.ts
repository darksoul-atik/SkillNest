import { create } from 'zustand';
import { UserResponse } from '@skillnest/shared';
import { apiClient, setAccessToken } from '../lib/axios';

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: UserResponse, token: string) => void;
  setUser: (user: UserResponse) => void;
  clearAuth: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user: UserResponse, token: string) => {
    setAccessToken(token);
    set({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setUser: (user: UserResponse) => {
    set({ user });
  },

  clearAuth: () => {
    setAccessToken(null);
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  initialize: async () => {
    try {
      // Attempt silent refresh via httpOnly cookie
      const refreshRes = await apiClient.post('/auth/refresh');
      const token = refreshRes.data?.data?.accessToken;
      if (token) {
        setAccessToken(token);
        const meRes = await apiClient.get('/auth/me');
        const user = meRes.data?.data;
        if (user) {
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }
    } catch {
      // No active session or refresh expired
    }
    setAccessToken(null);
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
