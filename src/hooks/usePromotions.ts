import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  GroupPromotion,
  GroupPromotionLog,
  GroupPromotionMessage,
  CreatePromotionData,
} from '../types';

export function usePromotions() {
  return useQuery<GroupPromotion[]>({
    queryKey: ['promotions'],
    queryFn: async () => {
      const { data } = await api.get('/promotions');
      return data;
    },
  });
}

export function usePromotion(id: string | null) {
  return useQuery<GroupPromotion>({
    queryKey: ['promotions', id],
    queryFn: async () => {
      const { data } = await api.get(`/promotions/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (promotion: CreatePromotionData) => {
      const { data } = await api.post('/promotions', promotion);
      return data as GroupPromotion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });
}

export function useUpdatePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Pick<GroupPromotion, 'name' | 'sendTimes' | 'daysOfWeek' | 'timezone' | 'accountIds' | 'dailyLimitPerAccount' | 'messagesPerMinute'>>) => {
      const { data } = await api.patch(`/promotions/${id}`, updates);
      return data as GroupPromotion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });
}

export function useDeletePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/promotions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });
}

export function useTogglePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/promotions/${id}/toggle`);
      return data as GroupPromotion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });
}

// ─── Message Pool ──────────────────────────────────────────────────

export function useAddPromotionMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ promotionId, content, mediaUrl }: { promotionId: string; content: string; mediaUrl?: string }) => {
      const { data } = await api.post(`/promotions/${promotionId}/messages`, { content, mediaUrl });
      return data as GroupPromotionMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });
}

export function useUpdatePromotionMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ promotionId, messageId, ...updates }: { promotionId: string; messageId: string; content?: string; mediaUrl?: string | null; isActive?: boolean }) => {
      const { data } = await api.patch(`/promotions/${promotionId}/messages/${messageId}`, updates);
      return data as GroupPromotionMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });
}

export function useDeletePromotionMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ promotionId, messageId }: { promotionId: string; messageId: string }) => {
      await api.delete(`/promotions/${promotionId}/messages/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });
}

// ─── Groups ────────────────────────────────────────────────────────

export function useUpdatePromotionGroups() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ promotionId, groups }: { promotionId: string; groups: Array<{ jid: string; name?: string }> }) => {
      const { data } = await api.put(`/promotions/${promotionId}/groups`, { groups });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
  });
}

// ─── Logs ──────────────────────────────────────────────────────────

export function usePromotionLogs(promotionId: string | null, limit = 50, offset = 0) {
  return useQuery<{ logs: GroupPromotionLog[]; total: number }>({
    queryKey: ['promotions', promotionId, 'logs', limit, offset],
    queryFn: async () => {
      const { data } = await api.get(`/promotions/${promotionId}/logs`, { params: { limit, offset } });
      return data;
    },
    enabled: !!promotionId,
  });
}
