import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Campaign, CampaignProgress, CampaignStatus, CreateCampaignData } from '../types';

export function useCampaigns(status?: CampaignStatus) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);

  return useQuery<Campaign[]>({
    queryKey: ['campaigns', status],
    queryFn: async () => {
      const { data } = await api.get(`/campaigns${params.toString() ? `?${params}` : ''}`);
      return data;
    },
    refetchInterval: (query) => {
      const campaigns = query.state.data;
      if (campaigns?.some((c) => c.status === 'RUNNING')) return 10_000;
      return false;
    },
  });
}

export function useCampaign(id: string | null) {
  return useQuery<Campaign>({
    queryKey: ['campaigns', id],
    queryFn: async () => {
      const { data } = await api.get(`/campaigns/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCampaignProgress(id: string | null, status?: CampaignStatus) {
  return useQuery<CampaignProgress>({
    queryKey: ['campaigns', id, 'progress'],
    queryFn: async () => {
      const { data } = await api.get(`/campaigns/${id}/progress`);
      return data;
    },
    enabled: !!id,
    refetchInterval: status === 'RUNNING' ? 5_000 : false,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (campaign: CreateCampaignData) => {
      const { data } = await api.post('/campaigns', campaign);
      return data as Campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CreateCampaignData> & { id: string }) => {
      const { data } = await api.patch(`/campaigns/${id}`, updates);
      return data as Campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useStartCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/campaigns/${id}/start`);
      return data as Campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function usePauseCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/campaigns/${id}/pause`);
      return data as Campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useResumeCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/campaigns/${id}/resume`);
      return data as Campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useCancelCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/campaigns/${id}/cancel`);
      return data as Campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}
