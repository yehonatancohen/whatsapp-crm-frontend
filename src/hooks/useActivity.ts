import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ActivityLogEntry, DashboardStats } from '../types';

export function useActivity(limit = 50) {
  return useQuery<ActivityLogEntry[]>({
    queryKey: ['activity', limit],
    queryFn: () => api.get(`/activity?limit=${limit}`).then((r) => r.data),
  });
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/activity/stats').then((r) => r.data),
    refetchInterval: 30_000,
  });
}
