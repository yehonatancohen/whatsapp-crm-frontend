import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AutoReply, AutoReplyMatchType } from '../types';

export function useAutoReplies() {
  return useQuery<AutoReply[]>({
    queryKey: ['auto-replies'],
    queryFn: () => api.get('/auto-replies').then((r) => r.data),
  });
}

export function useCreateAutoReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      matchType?: AutoReplyMatchType;
      matchValue: string;
      replyMessage: string;
      accountIds?: string[];
      onlyPrivate?: boolean;
      cooldownSec?: number;
    }) => api.post('/auto-replies', data).then((r) => r.data as AutoReply),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auto-replies'] }),
  });
}

export function useUpdateAutoReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<AutoReply>) =>
      api.patch(`/auto-replies/${id}`, data).then((r) => r.data as AutoReply),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auto-replies'] }),
  });
}

export function useToggleAutoReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/auto-replies/${id}/toggle`).then((r) => r.data as AutoReply),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auto-replies'] }),
  });
}

export function useDeleteAutoReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/auto-replies/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auto-replies'] }),
  });
}
