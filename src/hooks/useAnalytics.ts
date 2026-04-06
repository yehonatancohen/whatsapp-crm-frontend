import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CampaignStats, MessageTrend, UsageData } from '../types';

export function useCampaignAnalytics() {
  return useQuery<CampaignStats>({
    queryKey: ['analytics', 'campaign-stats'],
    queryFn: () => api.get('/analytics/campaign-stats').then((r) => r.data),
  });
}

export function useMessageTrends(days = 30) {
  return useQuery<MessageTrend[]>({
    queryKey: ['analytics', 'message-trends', days],
    queryFn: () => api.get(`/analytics/message-trends?days=${days}`).then((r) => r.data),
  });
}

export function useAccountHealth() {
  return useQuery({
    queryKey: ['analytics', 'account-health'],
    queryFn: () => api.get('/analytics/account-health').then((r) => r.data),
  });
}

export function useUsage() {
  return useQuery<UsageData>({
    queryKey: ['analytics', 'usage'],
    queryFn: () => api.get('/analytics/usage').then((r) => r.data),
    refetchInterval: 60_000,
  });
}
