import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
  AuthResponse,
  UserResponse,
} from '@skillnest/shared';
import { apiClient } from '../lib/axios';
import { useAuthStore } from '../stores/auth.store';

export function useAuth() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading, setAuth, setUser, clearAuth } =
    useAuthStore();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginInput): Promise<AuthResponse> => {
      const res = await apiClient.post('/auth/login', credentials);
      return res.data.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      queryClient.invalidateQueries();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (input: RegisterInput): Promise<AuthResponse> => {
      const res = await apiClient.post('/auth/register', input);
      return res.data.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      queryClient.invalidateQueries();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      await apiClient.post('/auth/logout');
    },
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (input: UpdateProfileInput): Promise<UserResponse> => {
      const res = await apiClient.patch('/auth/me', input);
      return res.data.data;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
    updateProfile: updateProfileMutation.mutateAsync,
  };
}
