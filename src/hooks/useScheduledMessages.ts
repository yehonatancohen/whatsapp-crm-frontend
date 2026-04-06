import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ScheduledMessage } from '../types';

export function useScheduledMessages(accountId?: string) {
  const params = new URLSearchParams();
  if (accountId) params.set('accountId', accountId);

  return useQuery<ScheduledMessage[]>({
    queryKey: ['scheduled-messages', accountId],
    queryFn: () => api.get(`/scheduled-messages${params.toString() ? `?${params}` : ''}`).then((r) => r.data),
  });
}

export function useCreateScheduledMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      chatId: string;
      chatName?: string;
      body: string;
      scheduledAt: string;
      accountId: string;
    }) => api.post('/scheduled-messages', data).then((r) => r.data as ScheduledMessage),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduled-messages'] }),
  });
}

export function useCancelScheduledMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/scheduled-messages/${id}/cancel`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduled-messages'] }),
  });
}

export function useDeleteScheduledMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/scheduled-messages/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scheduled-messages'] }),
  });
}
