import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Contact {
  id: string;
  phoneNumber: string;
  name: string | null;
  tags: string[];
  createdAt: string;
}

interface ContactsResponse {
  contacts: Contact[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ContactList {
  id: string;
  name: string;
  description: string | null;
  _count: { entries: number };
  createdAt: string;
}

export function useContacts(page = 1, search?: string, tags?: string[]) {
  const queryClient = useQueryClient();

  const params = new URLSearchParams();
  params.set('page', String(page));
  if (search) params.set('search', search);
  if (tags?.length) params.set('tags', tags.join(','));

  const query = useQuery<ContactsResponse>({
    queryKey: ['contacts', page, search, tags],
    queryFn: async () => {
      const { data } = await api.get(`/contacts?${params}`);
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (contact: { phoneNumber: string; name?: string; tags?: string[] }) => {
      const { data } = await api.post('/contacts', contact);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/contacts/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] }),
  });

  const importMutation = useMutation({
    mutationFn: async ({ file, listName }: { file: File; listName?: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (listName) formData.append('listName', listName);
      const { data } = await api.post('/contacts/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contactLists'] });
    },
  });

  return {
    contacts: query.data?.contacts || [],
    pagination: query.data?.pagination,
    loading: query.isLoading,
    error: query.error?.message || null,
    createContact: createMutation.mutateAsync,
    deleteContact: deleteMutation.mutateAsync,
    importContacts: importMutation.mutateAsync,
    isImporting: importMutation.isPending,
  };
}

export function useContactLists() {
  const queryClient = useQueryClient();

  const query = useQuery<ContactList[]>({
    queryKey: ['contactLists'],
    queryFn: async () => {
      const { data } = await api.get('/contacts/lists');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (list: { name: string; description?: string }) => {
      const { data } = await api.post('/contacts/lists', list);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contactLists'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/contacts/lists/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contactLists'] }),
  });

  const addContactsToList = useMutation({
    mutationFn: async ({ listId, contactIds }: { listId: string; contactIds: string[] }) => {
      const { data } = await api.post(`/contacts/lists/${listId}/contacts`, { contactIds });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contactLists'] }),
  });

  return {
    lists: query.data || [],
    loading: query.isLoading,
    createList: createMutation.mutateAsync,
    deleteList: deleteMutation.mutateAsync,
    addContactsToList: addContactsToList.mutateAsync,
  };
}
