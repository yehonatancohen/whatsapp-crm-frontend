import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AccountResponse, WhatsAppGroup } from '../types';

export function useAccounts() {
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading: loading, error: queryError } = useQuery<AccountResponse[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data } = await api.get('/accounts');
      return data;
    },
    refetchInterval: 30_000, // Fallback polling every 30s (Socket.IO handles real-time)
  });

  const addMutation = useMutation({
    mutationFn: async ({ label, proxy }: { label: string; proxy?: string }) => {
      const { data } = await api.post('/accounts', { label, proxy });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, label }: { id: string; label: string }) => {
      const { data } = await api.patch(`/accounts/${id}`, { label });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const addAccount = async (label: string, proxy?: string) => {
    await addMutation.mutateAsync({ label, proxy });
  };

  const removeAccount = async (id: string) => {
    await removeMutation.mutateAsync(id);
  };

  const renameAccount = async (id: string, label: string) => {
    await renameMutation.mutateAsync({ id, label });
  };

  return {
    accounts,
    loading,
    error: queryError?.message || null,
    addAccount,
    removeAccount,
    renameAccount,
  };
}

export function useAccountGroups(accountId: string | null) {
  return useQuery<WhatsAppGroup[]>({
    queryKey: ['account-groups', accountId],
    queryFn: () => api.get(`/accounts/${accountId}/groups`).then((r) => r.data),
    enabled: !!accountId,
  });
}
