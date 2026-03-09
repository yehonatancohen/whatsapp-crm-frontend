import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AdminUser } from '../types';

export function useUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: string; isActive?: boolean } }) =>
      api.patch(`/users/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
