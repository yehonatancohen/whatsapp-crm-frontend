import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../lib/api';
import { useSocket } from '../context/SocketContext';

export interface Conversation {
  accountId: string;
  accountLabel: string;
  chatId: string;
  name: string;
  unreadCount: number;
  timestamp: number | null;
  isGroup: boolean;
  lastMessage: {
    body: string;
    timestamp: number;
    fromMe: boolean;
  } | null;
}

export interface ChatMessage {
  id: string;
  body: string;
  fromMe: boolean;
  timestamp: number;
  type: string;
  ack?: number;
  author?: string;
  authorName?: string;
  hasMedia?: boolean;
  quotedMsg?: { body: string; author?: string; fromMe: boolean };
}

export interface IncomingChatMessage {
  accountId: string;
  accountLabel: string;
  chatId: string;
  messageId: string;
  body: string;
  fromMe: boolean;
  timestamp: number;
  type: string;
  author?: string;
  chatName?: string;
  isGroup: boolean;
}

export function useConversations() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const { data: conversations = [], isLoading, error } = useQuery<Conversation[]>({
    queryKey: ['chat', 'conversations'],
    queryFn: async () => {
      const { data } = await api.get('/chat/conversations');
      return data;
    },
    refetchInterval: 30_000, // refresh every 30s
  });

  // Listen for new messages → update conversation list in place so new chats
  // appear immediately without waiting for getChats() to return them.
  useEffect(() => {
    if (!socket) return;
    const handler = (msg: IncomingChatMessage) => {
      queryClient.setQueryData<Conversation[]>(['chat', 'conversations'], (old) => {
        if (!old) {
          queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
          return old;
        }

        const idx = old.findIndex(
          (c) => c.accountId === msg.accountId && c.chatId === msg.chatId,
        );

        const updatedLastMessage = {
          body: msg.body,
          timestamp: msg.timestamp,
          fromMe: msg.fromMe,
        };

        let updated: Conversation[];
        if (idx === -1) {
          // New chat — prepend it
          const newConv: Conversation = {
            accountId: msg.accountId,
            accountLabel: msg.accountLabel,
            chatId: msg.chatId,
            name: msg.chatName || msg.chatId,
            unreadCount: msg.fromMe ? 0 : 1,
            timestamp: msg.timestamp,
            isGroup: msg.isGroup,
            lastMessage: updatedLastMessage,
          };
          updated = [newConv, ...old];
        } else {
          // Existing chat — update last message and unread count
          updated = old.map((c, i) =>
            i !== idx
              ? c
              : {
                  ...c,
                  timestamp: msg.timestamp,
                  unreadCount: msg.fromMe ? c.unreadCount : c.unreadCount + 1,
                  lastMessage: updatedLastMessage,
                },
          );
        }

        // Keep sorted by timestamp desc
        return [...updated].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      });
    };
    socket.on('chat:message', handler);
    return () => { socket.off('chat:message', handler); };
  }, [socket, queryClient]);

  return { conversations, loading: isLoading, error: error?.message };
}

export function useChatMessages(accountId: string | null, chatId: string | null, limit = 100) {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const { data: messages = [], isLoading, isError, error, refetch } = useQuery<ChatMessage[]>({
    queryKey: ['chat', 'messages', accountId, chatId, limit],
    queryFn: async () => {
      if (!accountId || !chatId) return [];
      try {
        const { data } = await api.get(`/chat/${accountId}/${encodeURIComponent(chatId)}/messages`, {
          params: { limit },
        });
        return data;
      } catch (err) {
        const serverMsg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
        if (serverMsg) throw new Error(serverMsg);
        throw err;
      }
    },
    enabled: !!accountId && !!chatId,
    staleTime: 30_000,
    retry: (failureCount, err) => {
      // Don't retry on 4xx client errors (incl. 501 unsupported chat type)
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 1;
    },
    retryDelay: 2000,
  });

  // Listen for new messages → invalidate to refetch with current limit
  useEffect(() => {
    if (!socket || !accountId || !chatId) return;
    const handler = (msg: IncomingChatMessage) => {
      if (msg.accountId === accountId && msg.chatId === chatId) {
        queryClient.invalidateQueries({ queryKey: ['chat', 'messages', accountId, chatId] });
      }
    };
    socket.on('chat:message', handler);
    return () => { socket.off('chat:message', handler); };
  }, [socket, accountId, chatId, queryClient]);

  return { messages, loading: isLoading, isError, error: error?.message, refetch };
}

export interface GroupSettings {
  messagesAdminsOnly: boolean;
  infoAdminsOnly: boolean;
  addMembersAdminsOnly: boolean;
}

export interface GroupInfo {
  name: string;
  description: string;
  participantCount: number;
  participants: Array<{ id: string; name?: string; isAdmin: boolean; isSuperAdmin: boolean }>;
  iAmAdmin: boolean;
  canAnyoneAdd: boolean;
  settings: GroupSettings;
}

export interface AddParticipantResult {
  success: boolean;
  message: string;
  inviteSent: boolean;
}

export function useGroupInfo(accountId: string | null, chatId: string | null) {
  const { data, isLoading, error, refetch } = useQuery<GroupInfo>({
    queryKey: ['chat', 'group-info', accountId, chatId],
    queryFn: async () => {
      const { data } = await api.get(`/chat/${accountId}/${encodeURIComponent(chatId!)}/group-info`);
      return data;
    },
    enabled: !!accountId && !!chatId,
  });

  return { groupInfo: data, loading: isLoading, error: error?.message, refetch };
}

export function useAddParticipants() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, chatId, phoneNumbers }: { accountId: string; chatId: string; phoneNumbers: string[] }) => {
      const { data } = await api.post(`/chat/${accountId}/${encodeURIComponent(chatId)}/add-participants`, { phoneNumbers });
      return data.results as Record<string, AddParticipantResult>;
    },
    onSuccess: (_data, { accountId, chatId }) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'group-info', accountId, chatId] });
    },
  });
}

export function usePromoteParticipants() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, chatId, participantIds }: { accountId: string; chatId: string; participantIds: string[] }) => {
      await api.post(`/chat/${accountId}/${encodeURIComponent(chatId)}/promote`, { participantIds });
    },
    onSuccess: (_data, { accountId, chatId }) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'group-info', accountId, chatId] });
    },
  });
}

export function useDemoteParticipants() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, chatId, participantIds }: { accountId: string; chatId: string; participantIds: string[] }) => {
      await api.post(`/chat/${accountId}/${encodeURIComponent(chatId)}/demote`, { participantIds });
    },
    onSuccess: (_data, { accountId, chatId }) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'group-info', accountId, chatId] });
    },
  });
}

export function useRemoveParticipants() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, chatId, participantIds }: { accountId: string; chatId: string; participantIds: string[] }) => {
      await api.post(`/chat/${accountId}/${encodeURIComponent(chatId)}/remove-participants`, { participantIds });
    },
    onSuccess: (_data, { accountId, chatId }) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'group-info', accountId, chatId] });
    },
  });
}

export function useGroupInviteLink(accountId: string | null, chatId: string | null, enabled = false) {
  return useQuery<{ inviteLink: string }>({
    queryKey: ['chat', 'invite-link', accountId, chatId],
    queryFn: async () => {
      const { data } = await api.get(`/chat/${accountId}/${encodeURIComponent(chatId!)}/invite-link`);
      return data;
    },
    enabled: !!accountId && !!chatId && enabled,
  });
}

export function useUpdateGroupSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, chatId, ...settings }: {
      accountId: string; chatId: string;
      subject?: string; description?: string;
      messagesAdminsOnly?: boolean; infoAdminsOnly?: boolean; addMembersAdminsOnly?: boolean;
    }) => {
      const { data } = await api.patch(`/chat/${accountId}/${encodeURIComponent(chatId)}/group-settings`, settings);
      return data;
    },
    onSuccess: (_data, { accountId, chatId }) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'group-info', accountId, chatId] });
    },
  });
}

export function useJoinGroupViaLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, inviteLink }: { accountId: string; inviteLink: string }) => {
      const { data } = await api.post(`/chat/${accountId}/join-group`, { inviteLink });
      return data as { success: boolean; chatId: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, chatId, body, quotedMessageId, _limit }: { accountId: string; chatId: string; body: string; quotedMessageId?: string; _limit?: number }) => {
      const { data } = await api.post(`/chat/${accountId}/${encodeURIComponent(chatId)}/send`, { body, quotedMessageId });
      return { msg: data as ChatMessage, limit: _limit ?? 100 };
    },
    onSuccess: ({ msg, limit }, { accountId, chatId }) => {
      queryClient.setQueryData<ChatMessage[]>(
        ['chat', 'messages', accountId, chatId, limit],
        (old) => {
          if (!old) return [msg];
          if (old.some((m) => m.id === msg.id)) return old;
          return [...old, msg];
        },
      );
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
}

export function useSendVoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, chatId, data, mimeType, _limit }: { accountId: string; chatId: string; data: string; mimeType: string; _limit?: number }) => {
      const res = await api.post(`/chat/${accountId}/${encodeURIComponent(chatId)}/send-voice`, { data, mimeType });
      return { msg: res.data as ChatMessage, limit: _limit ?? 100 };
    },
    onSuccess: ({ msg, limit }, { accountId, chatId }) => {
      queryClient.setQueryData<ChatMessage[]>(
        ['chat', 'messages', accountId, chatId, limit],
        (old) => {
          if (!old) return [msg];
          if (old.some((m) => m.id === msg.id)) return old;
          return [...old, msg];
        },
      );
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
}

export function useSendImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, chatId, data, mimeType, caption, _limit }: { accountId: string; chatId: string; data: string; mimeType: string; caption?: string; _limit?: number }) => {
      const res = await api.post(`/chat/${accountId}/${encodeURIComponent(chatId)}/send-image`, { data, mimeType, caption });
      return { msg: res.data as ChatMessage, limit: _limit ?? 100 };
    },
    onSuccess: ({ msg, limit }, { accountId, chatId }) => {
      queryClient.setQueryData<ChatMessage[]>(
        ['chat', 'messages', accountId, chatId, limit],
        (old) => {
          if (!old) return [msg];
          if (old.some((m) => m.id === msg.id)) return old;
          return [...old, msg];
        },
      );
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
}

export function useMarkSeen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, chatId }: { accountId: string; chatId: string }) => {
      await api.post(`/chat/${accountId}/${encodeURIComponent(chatId)}/seen`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, chatId, messageId }: { accountId: string; chatId: string; messageId: string }) => {
      await api.delete(`/chat/${accountId}/${encodeURIComponent(chatId)}/messages/${encodeURIComponent(messageId)}`);
    },
    onSuccess: (_data, { accountId, chatId }) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', accountId, chatId] });
    },
  });
}

export function useProfilePic(accountId: string, chatId: string) {
  return useQuery<{ url: string | null }>({
    queryKey: ['chat', 'profile-pic', accountId, chatId],
    queryFn: async () => {
      const { data } = await api.get(`/chat/${accountId}/${encodeURIComponent(chatId)}/profile-pic`);
      return data;
    },
    enabled: !!accountId && !!chatId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 0,
  });
}
