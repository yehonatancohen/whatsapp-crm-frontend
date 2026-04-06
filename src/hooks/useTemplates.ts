import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { MessageTemplate } from '../types';

export function useTemplates(category?: string) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);

  return useQuery<MessageTemplate[]>({
    queryKey: ['templates', category],
    queryFn: () => api.get(`/templates${params.toString() ? `?${params}` : ''}`).then((r) => r.data),
  });
}

export function useTemplateCategories() {
  return useQuery<string[]>({
    queryKey: ['template-categories'],
    queryFn: () => api.get('/templates/categories').then((r) => r.data),
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; content: string; category?: string }) =>
      api.post('/templates', data).then((r) => r.data as MessageTemplate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      qc.invalidateQueries({ queryKey: ['template-categories'] });
    },
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; content?: string; category?: string | null }) =>
      api.patch(`/templates/${id}`, data).then((r) => r.data as MessageTemplate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      qc.invalidateQueries({ queryKey: ['template-categories'] });
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/templates/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
    },
  });
}
