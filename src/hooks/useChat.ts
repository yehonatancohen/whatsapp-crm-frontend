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

  // Listen for new messages → refresh conversations list
  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    };
    socket.on('chat:message', handler);
    return () => { socket.off('chat:message', handler); };
  }, [socket, queryClient]);

  return { conversations, loading: isLoading, error: error?.message };
}

export function useChatMessages(accountId: string | null, chatId: string | null) {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const { data: messages = [], isLoading, error } = useQuery<ChatMessage[]>({
    queryKey: ['chat', 'messages', accountId, chatId],
    queryFn: async () => {
      if (!accountId || !chatId) return [];
      const { data } = await api.get(`/chat/${accountId}/${encodeURIComponent(chatId)}/messages`, {
        params: { limit: 100 },
      });
      return data;
    },
    enabled: !!accountId && !!chatId,
  });

  // Listen for new messages for this specific chat → append optimistically
  useEffect(() => {
    if (!socket || !accountId || !chatId) return;
    const handler = (msg: IncomingChatMessage) => {
      if (msg.accountId === accountId && msg.chatId === chatId) {
        queryClient.setQueryData<ChatMessage[]>(
          ['chat', 'messages', accountId, chatId],
          (old) => {
            if (!old) return old;
            // Avoid duplicates
            if (old.some((m) => m.id === msg.messageId)) return old;
            return [...old, {
              id: msg.messageId,
              body: msg.body,
              fromMe: msg.fromMe,
              timestamp: msg.timestamp,
              type: msg.type,
              author: msg.author,
            }];
          },
        );
      }
    };
    socket.on('chat:message', handler);
    return () => { socket.off('chat:message', handler); };
  }, [socket, accountId, chatId, queryClient]);

  return { messages, loading: isLoading, error: error?.message };
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, chatId, body }: { accountId: string; chatId: string; body: string }) => {
      const { data } = await api.post(`/chat/${accountId}/${encodeURIComponent(chatId)}/send`, { body });
      return data as ChatMessage;
    },
    onSuccess: (msg, { accountId, chatId }) => {
      // Append the sent message
      queryClient.setQueryData<ChatMessage[]>(
        ['chat', 'messages', accountId, chatId],
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
