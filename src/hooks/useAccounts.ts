import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { extractApiError } from '../lib/errorUtils';
import type { AccountResponse, AccountProfile, WhatsAppGroup } from '../types';

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
    error: queryError ? extractApiError(queryError).message : null,
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

export function useAccountProfile(accountId: string | null) {
  return useQuery<AccountProfile>({
    queryKey: ['account-profile', accountId],
    queryFn: () => api.get(`/accounts/${accountId}/profile`).then((r) => r.data),
    enabled: !!accountId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, displayName, status }: { id: string; displayName?: string; status?: string }) => {
      const { data } = await api.post(`/accounts/${id}/profile`, { displayName, status });
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['account-profile', vars.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useUpdateProfilePicture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post(`/accounts/${id}/profile-picture`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['account-profile', vars.id] });
    },
  });
}

export function useDeleteProfilePicture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/accounts/${id}/profile-picture`);
      return data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['account-profile', id] });
    },
  });
}
