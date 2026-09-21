import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  GroupResponse,
  CreateGroupInput,
  UpdateGroupInput,
  GroupCategory,
  GroupStatus,
  CursorPaginationMeta,
  MembershipResponse,
} from '@skillnest/shared';
import { apiClient } from '../lib/axios';

export interface GroupsQueryParams {
  category?: GroupCategory;
  status?: GroupStatus;
  search?: string;
  limit?: number;
  cursor?: string;
}

export function useGroups(params: GroupsQueryParams = {}) {
  return useQuery({
    queryKey: ['groups', params],
    queryFn: async (): Promise<{ data: GroupResponse[]; meta: CursorPaginationMeta }> => {
      const res = await apiClient.get('/groups', { params });
      return res.data;
    },
  });
}

export function useGroup(idOrSlug: string) {
  return useQuery({
    queryKey: ['group', idOrSlug],
    queryFn: async (): Promise<GroupResponse> => {
      const res = await apiClient.get(`/groups/${idOrSlug}`);
      return res.data.data;
    },
    enabled: !!idOrSlug,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGroupInput): Promise<GroupResponse> => {
      const res = await apiClient.post('/groups', input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useUpdateGroup(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateGroupInput): Promise<GroupResponse> => {
      const res = await apiClient.patch(`/groups/${id}`, input);
      return res.data.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['group', id], updated);
      queryClient.setQueryData(['group', updated.slug], updated);
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useJoinGroup(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<MembershipResponse> => {
      const res = await apiClient.post(`/groups/${groupId}/members`);
      return res.data.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['group', groupId] });
      const previousGroup = queryClient.getQueryData<GroupResponse>(['group', groupId]);
      if (previousGroup) {
        queryClient.setQueryData<GroupResponse>(['group', groupId], {
          ...previousGroup,
          memberCount: previousGroup.memberCount + 1,
          isMember: true,
        });
      }
      return { previousGroup };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousGroup) {
        queryClient.setQueryData(['group', groupId], context.previousGroup);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['members', groupId] });
    },
  });
}

export function useLeaveGroup(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      await apiClient.delete(`/groups/${groupId}/members/me`);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['group', groupId] });
      const previousGroup = queryClient.getQueryData<GroupResponse>(['group', groupId]);
      if (previousGroup) {
        queryClient.setQueryData<GroupResponse>(['group', groupId], {
          ...previousGroup,
          memberCount: Math.max(1, previousGroup.memberCount - 1),
          isMember: false,
        });
      }
      return { previousGroup };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousGroup) {
        queryClient.setQueryData(['group', groupId], context.previousGroup);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['members', groupId] });
    },
  });
}

export function useGroupMembers(groupId: string, params: { limit?: number; cursor?: string } = {}) {
  return useQuery({
    queryKey: ['members', groupId, params],
    queryFn: async (): Promise<{ data: MembershipResponse[]; meta: CursorPaginationMeta }> => {
      const res = await apiClient.get(`/groups/${groupId}/members`, { params });
      return res.data;
    },
    enabled: !!groupId,
  });
}
