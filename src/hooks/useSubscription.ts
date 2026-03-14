import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface SubscriptionInfo {
  id: string;
  planTier: 'STARTER' | 'PRO' | 'ENTERPRISE';
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface PlanInfo {
  tier: string;
  name: string;
  priceMonthly: number;
  priceId: string;
  features: string[];
}

export function useSubscription() {
  return useQuery<SubscriptionInfo>({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/current');
      return data;
    },
  });
}

export function usePlans() {
  return useQuery<PlanInfo[]>({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions/plans');
      return data;
    },
    staleTime: 60_000,
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (priceId: string) => {
      const { data } = await api.post('/subscriptions/checkout', { priceId });
      return data.url as string;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
  });
}

export function useBillingPortal() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/subscriptions/portal');
      return data.url as string;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
  });
}
