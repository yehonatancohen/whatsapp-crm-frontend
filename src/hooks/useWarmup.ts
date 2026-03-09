import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { WarmupOverview, WarmupStatus, WarmupLogEntry } from '../types';

export function useWarmupOverview() {
  const query = useQuery<WarmupOverview>({
    queryKey: ['warmup', 'overview'],
    queryFn: async () => {
      const { data } = await api.get('/warmup/overview');
      return data;
    },
    refetchInterval: 30_000,
  });

  return {
    overview: query.data,
    accounts: query.data?.accounts || [],
    totalEnabled: query.data?.totalEnabled ?? 0,
    totalMessages24h: query.data?.totalMessages24h ?? 0,
    loading: query.isLoading,
    error: query.error?.message || null,
  };
}

export function useWarmupStatus(accountId: string | null) {
  const query = useQuery<WarmupStatus>({
    queryKey: ['warmup', accountId],
    queryFn: async () => {
      const { data } = await api.get(`/warmup/${accountId}`);
      return data;
    },
    enabled: !!accountId,
  });

  return {
    status: query.data,
    loading: query.isLoading,
    error: query.error?.message || null,
  };
}

export function useWarmupHistory(accountId: string | null) {
  const query = useQuery<WarmupLogEntry[]>({
    queryKey: ['warmup', accountId, 'history'],
    queryFn: async () => {
      const { data } = await api.get(`/warmup/${accountId}/history`);
      return data;
    },
    enabled: !!accountId,
  });

  return {
    history: query.data || [],
    loading: query.isLoading,
    error: query.error?.message || null,
  };
}

export function useToggleWarmup() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ accountId, enabled }: { accountId: string; enabled: boolean }) => {
      const { data } = await api.post(`/warmup/${accountId}/toggle`, { enabled });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warmup'] });
    },
  });

  return {
    toggleWarmup: mutation.mutateAsync,
    isToggling: mutation.isPending,
  };
}
