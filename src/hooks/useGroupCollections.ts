import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { GroupCollection, GroupCollectionWithEntries } from '../types';

export function useGroupCollections() {
  const queryClient = useQueryClient();

  const { data: collections = [], isLoading: loading } = useQuery<GroupCollection[]>({
    queryKey: ['groupCollections'],
    queryFn: () => api.get('/group-collections').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const { data: res } = await api.post('/group-collections', data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupCollections'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/group-collections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupCollections'] });
    },
  });

  return {
    collections,
    loading,
    createCollection: createMutation.mutateAsync,
    deleteCollection: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

export function useGroupCollectionDetail(collectionId: string | null) {
  const queryClient = useQueryClient();

  const { data: collection, isLoading: loading } = useQuery<GroupCollectionWithEntries>({
    queryKey: ['groupCollections', collectionId, 'detail'],
    queryFn: () => api.get(`/group-collections/${collectionId}`).then((r) => r.data),
    enabled: !!collectionId,
  });

  const replaceGroupsMutation = useMutation({
    mutationFn: async ({ id, groups }: { id: string; groups: Array<{ jid: string; name?: string }> }) => {
      const { data } = await api.put(`/group-collections/${id}/groups`, { groups });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupCollections'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string }) => {
      const { data: res } = await api.patch(`/group-collections/${id}`, data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupCollections'] });
    },
  });

  return {
    collection,
    loading,
    replaceGroups: replaceGroupsMutation.mutateAsync,
    updateCollection: updateMutation.mutateAsync,
    isSaving: replaceGroupsMutation.isPending || updateMutation.isPending,
  };
}
