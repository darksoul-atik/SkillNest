import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CommentResponse,
  ReplyResponse,
  CreateCommentInput,
  UpdateCommentInput,
  CreateReplyInput,
  UpdateReplyInput,
  CursorPaginationMeta,
} from '@skillnest/shared';
import { apiClient } from '../lib/axios';

export function useComments(
  groupId: string,
  params: { limit?: number; cursor?: string } = {},
) {
  return useQuery({
    queryKey: ['comments', groupId, params],
    queryFn: async (): Promise<{ data: CommentResponse[]; meta: CursorPaginationMeta }> => {
      const res = await apiClient.get(`/groups/${groupId}/comments`, { params });
      return res.data;
    },
    enabled: !!groupId,
  });
}

export function useCreateComment(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCommentInput): Promise<CommentResponse> => {
      const res = await apiClient.post(`/groups/${groupId}/comments`, input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', groupId] });
    },
  });
}

export function useUpdateComment(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateCommentInput }): Promise<CommentResponse> => {
      const res = await apiClient.patch(`/comments/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', groupId] });
    },
  });
}

export function useDeleteComment(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/comments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', groupId] });
    },
  });
}

export function useReplies(commentId: string) {
  return useQuery({
    queryKey: ['replies', commentId],
    queryFn: async (): Promise<ReplyResponse[]> => {
      const res = await apiClient.get(`/comments/${commentId}/replies`);
      return res.data.data;
    },
    enabled: !!commentId,
  });
}

export function useCreateReply(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, input }: { commentId: string; input: CreateReplyInput }): Promise<ReplyResponse> => {
      const res = await apiClient.post(`/comments/${commentId}/replies`, input);
      return res.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['replies', variables.commentId] });
      queryClient.invalidateQueries({ queryKey: ['comments', groupId] });
    },
  });
}

export function useDeleteReply(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ replyId, commentId }: { replyId: string; commentId: string }): Promise<void> => {
      await apiClient.delete(`/replies/${replyId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['replies', variables.commentId] });
      queryClient.invalidateQueries({ queryKey: ['comments', groupId] });
    },
  });
}
