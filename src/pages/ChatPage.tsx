import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// Types
export interface Conversation {
  accountId: string;
  accountLabel: string;
  chatId: string;
  name: string;
  unreadCount: number;
  timestamp: number;
  isGroup: boolean;
  lastMessage: {
    body: string;
    timestamp: number;
    fromMe: boolean;
  } | null;
}

export interface Message {
  id: string;
  body: string;
  fromMe: boolean;
  timestamp: number;
  type: string;
  ack: number;
  author?: string;
}

export function ChatPage() {
  const queryClient = useQueryClient();
  const [selectedChat, setSelectedChat] = useState<{accountId: string, chatId: string, name: string} | null>(null);
  const [messageText, setMessageText] = useState('');

  // Fetch conversations
  const { data: conversations, isLoading: loadingConversations } = useQuery<Conversation[]>({
    queryKey: ['chat-conversations'],
    queryFn: async () => {
      const { data } = await api.get('/chat/conversations');
      return data;
    },
    refetchInterval: 10000, // Poll every 10s
  });

  // Fetch messages for selected chat
  const { data: messages, isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ['chat-messages', selectedChat?.accountId, selectedChat?.chatId],
    queryFn: async () => {
      const { data } = await api.get(`/chat/${selectedChat?.accountId}/${selectedChat?.chatId}/messages?limit=100`);
      return data;
    },
    enabled: !!selectedChat,
    refetchInterval: 5000,
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!selectedChat) return;
      const { data } = await api.post(`/chat/${selectedChat.accountId}/${selectedChat.chatId}/send`, { body: text });
      return data;
    },
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', selectedChat?.accountId, selectedChat?.chatId] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sendMutation.isPending) return;
    sendMutation.mutate(messageText);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] -m-4 bg-[#0b141a] overflow-hidden rounded-xl shadow-lg border border-[#222d34]">
      {/* Sidebar: Chat List */}
      <div className="w-1/3 min-w-[300px] border-r border-[#222d34] flex flex-col bg-[#111b21]">
        <div className="p-4 bg-[#202c33] border-b border-[#222d34]">
          <h2 className="text-gray-200 font-semibold text-xl">Inbox</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="p-4 text-center text-gray-400">Loading chats...</div>
          ) : conversations?.length === 0 ? (
            <div className="p-4 text-center text-gray-400">No active chats</div>
          ) : (
            <div className="flex flex-col">
              {conversations?.map(chat => {
                const isSelected = selectedChat?.accountId === chat.accountId && selectedChat?.chatId === chat.chatId;
                return (
                  <button
                    key={`${chat.accountId}-${chat.chatId}`}
                    onClick={() => setSelectedChat({ accountId: chat.accountId, chatId: chat.chatId, name: chat.name })}
                    className={`flex items-start gap-3 p-3 text-left transition-colors border-b border-[#222d34] hover:bg-[#202c33] ${isSelected ? 'bg-[#2a3942]' : ''}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-600 flex-shrink-0 flex items-center justify-center text-white/70 overflow-hidden">
                      {chat.isGroup ? (
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      ) : (
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-gray-100 font-medium truncate pr-2">{chat.name}</span>
                        {chat.timestamp && (
                          <span className="text-xs text-gray-400 whitespace-nowrap">{formatTime(chat.timestamp)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {chat.lastMessage && (
                          <>
                            {chat.lastMessage.fromMe && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            )}
                            <p className="text-sm text-gray-400 truncate">{chat.lastMessage.body}</p>
                          </>
                        )}
                      </div>
                      <div className="mt-1 flex items-baseline justify-between">
                         <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{chat.accountLabel}</span>
                         {chat.unreadCount > 0 && (
                            <span className="bg-[#00a884] text-white text-xs px-2 py-0.5 rounded-full">{chat.unreadCount}</span>
                         )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Area: Chat History */}
      <div className="flex-1 flex flex-col bg-[#efeae2] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-[0.06] bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/gi_DckOUM5a.png')] pointer-events-none"></div>
        {selectedChat ? (
          <>
            <div className="p-3 bg-[#202c33] flex items-center gap-3 z-10 w-full shadow-sm">
              <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white/80 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-gray-100 font-medium leading-tight truncate">{selectedChat.name}</h3>
                <span className="text-xs text-gray-400 truncate block">Conversation details</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 z-10">
              {loadingMessages ? (
                <div className="text-center py-4 bg-white/60 mx-auto rounded-lg px-4 text-sm text-gray-600 backdrop-blur-sm shadow-sm mt-auto">Loading messages...</div>
              ) : messages?.length === 0 ? (
                <div className="text-center py-4 bg-white/60 mx-auto rounded-lg px-4 text-sm text-gray-600 backdrop-blur-sm shadow-sm mt-auto">No messages here yet. Say hi!</div>
              ) : (
                <div className="flex flex-col justify-end mt-auto gap-1">
                  {[...(messages || [])].reverse().map((msg, index, arr) => {
                    const showTail = index === arr.length - 1 || arr[index + 1].fromMe !== msg.fromMe;
                    return (
                      <div key={msg.id} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'} ${showTail ? 'mb-1' : ''}`}>
                        <div className={`relative max-w-[75%] rounded-lg px-3 py-1.5 shadow-sm text-[14.2px] leading-[19px] ${msg.fromMe ? 'bg-[#d9fdd3] text-[#111b21]' : 'bg-white text-[#111b21]'} ${showTail ? (msg.fromMe ? 'rounded-tr-none' : 'rounded-tl-none') : ''}`}>
                          {showTail && (
                            <span className={`absolute top-0 w-2 h-2 ${msg.fromMe ? '-right-2 text-[#d9fdd3]' : '-left-2 text-white'}`}>
                              {/* Tail SVG */}
                              <svg viewBox="0 0 8 13" fill="currentColor">
                                {msg.fromMe ? (
                                  <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
                                ) : (
                                  <path d="M2.812 1H8v11.193L1.533 3.568C.474 2.156 1.042 1 2.812 1z" />
                                )}
                              </svg>
                            </span>
                          )}
                          <div className="break-words whitespace-pre-wrap">{msg.body}</div>
                          <div className="flex items-center justify-end gap-1 mt-1 -mr-1">
                             <span className="text-[11px] text-gray-500 leading-none">{formatTime(msg.timestamp)}</span>
                             {msg.fromMe && (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-[14px] h-[14px] leading-none ${msg.ack >= 2 ? 'text-blue-500' : 'text-gray-400'}`}>
                                  {msg.ack >= 2 ? (
                                    <><polyline points="20 6 9 17 4 12"></polyline><polyline points="20 10 16 14"></polyline></>
                                  ) : (
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  )}
                                </svg>
                             )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-3 bg-[#202c33] flex items-center gap-3 z-10 w-full">
              <input
                type="text"
                className="flex-1 bg-[#2a3942] text-gray-100 rounded-lg px-4 py-2.5 outline-none placeholder:text-gray-400 focus:ring-1 focus:ring-[#00a884]/50 text-sm"
                placeholder="Type a message"
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                disabled={sendMutation.isPending}
              />
              <button
                type="submit"
                disabled={!messageText.trim() || sendMutation.isPending}
                className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white disabled:opacity-50 hover:bg-[#008f6f] transition-colors shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 ml-0.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-4 z-10">
            <div className="w-32 h-32 rounded-full overflow-hidden opacity-20 bg-emerald-900 flex items-center justify-center mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-emerald-400"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            </div>
            <h1 className="text-2xl text-gray-700 font-medium px-8 text-center bg-white/70 backdrop-blur pb-1 pt-1 rounded-md shadow-sm">WhatsApp CRM Inbox</h1>
            <p className="text-gray-600 text-sm mt-2 text-center max-w-sm px-4 py-2 bg-white/70 backdrop-blur rounded-md shadow-sm">Select a conversation from the left menu to start messaging across all your connected accounts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
