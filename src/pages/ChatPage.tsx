import { useState, useRef, useEffect } from 'react';
import {
  useConversations,
  useChatMessages,
  useSendMessage,
  type Conversation,
  type ChatMessage,
} from '../hooks/useChat';

function formatTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: number) {
  const d = new Date(ts * 1000);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return formatTime(ts);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function ChatPage() {
  const { conversations, loading: loadingConversations } = useConversations();
  const [selectedChat, setSelectedChat] = useState<{ accountId: string; chatId: string; name: string; isGroup: boolean } | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showList, setShowList] = useState(true); // mobile toggle

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, loading: loadingMessages } = useChatMessages(
    selectedChat?.accountId ?? null,
    selectedChat?.chatId ?? null,
  );
  const sendMutation = useSendMessage();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter conversations
  const filtered = searchQuery
    ? conversations.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.accountLabel.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : conversations;

  function handleSelect(conv: Conversation) {
    setSelectedChat({ accountId: conv.accountId, chatId: conv.chatId, name: conv.name, isGroup: conv.isGroup });
    setShowList(false);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedChat || !messageText.trim() || sendMutation.isPending) return;
    const text = messageText.trim();
    setMessageText('');
    try {
      await sendMutation.mutateAsync({
        accountId: selectedChat.accountId,
        chatId: selectedChat.chatId,
        body: text,
      });
    } catch {
      setMessageText(text);
    }
    inputRef.current?.focus();
  }

  // Find active conversation metadata
  const activeConv = conversations.find(
    (c) => c.accountId === selectedChat?.accountId && c.chatId === selectedChat?.chatId,
  );

  // Sorted messages (oldest first)
  const sortedMsgs = [...messages].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="flex h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] -m-4 md:-m-8 bg-[#0b141a] overflow-hidden md:rounded-xl shadow-lg border border-[#222d34]">
      {/* Sidebar: Chat List */}
      <div className={`${showList ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 lg:w-96 border-r border-[#222d34] bg-[#111b21] flex-shrink-0`}>
        <div className="p-3 bg-[#202c33] border-b border-[#222d34]">
          <h2 className="text-gray-200 font-semibold text-lg mb-2">Inbox</h2>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-[#2a3942] text-gray-100 rounded-lg px-3 py-2 text-sm outline-none placeholder:text-gray-500 focus:ring-1 focus:ring-[#00a884]/50"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              {searchQuery ? 'No chats match your search' : 'No active chats. Connect a WhatsApp account to see conversations here.'}
            </div>
          ) : (
            <div className="flex flex-col">
              {filtered.map((chat) => {
                const isSelected = selectedChat?.accountId === chat.accountId && selectedChat?.chatId === chat.chatId;
                return (
                  <button
                    key={`${chat.accountId}-${chat.chatId}`}
                    onClick={() => handleSelect(chat)}
                    className={`flex items-start gap-3 p-3 text-left transition-colors border-b border-[#222d34] hover:bg-[#202c33] ${isSelected ? 'bg-[#2a3942]' : ''}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-600 flex-shrink-0 flex items-center justify-center text-white/70">
                      {chat.isGroup ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="text-gray-100 font-medium truncate pr-2">{chat.name}</span>
                        {chat.timestamp != null && (
                          <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(chat.timestamp)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        {chat.lastMessage && (
                          <>
                            {chat.lastMessage.fromMe && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                            )}
                            <p className="text-sm text-gray-400 truncate">{chat.lastMessage.body}</p>
                          </>
                        )}
                      </div>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-emerald-500/20">{chat.accountLabel}</span>
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

      {/* Main Area: Chat */}
      <div className={`${!showList ? 'flex' : 'hidden'} md:flex flex-col flex-1 bg-[#efeae2] relative overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-[0.06] pointer-events-none" style={{backgroundColor: '#0b141a'}} />

        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-3 bg-[#202c33] flex items-center gap-3 z-10 w-full shadow-sm">
              {/* Back button - mobile */}
              <button onClick={() => setShowList(true)} className="text-gray-400 hover:text-gray-200 md:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white/80 shrink-0">
                {selectedChat.isGroup ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-gray-100 font-medium leading-tight truncate">{selectedChat.name}</h3>
                <span className="text-xs text-gray-400 truncate block">via {activeConv?.accountLabel || selectedChat.accountId}</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 z-10">
              {loadingMessages ? (
                <div className="flex items-center justify-center flex-1">
                  <div className="w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : sortedMsgs.length === 0 ? (
                <div className="flex items-center justify-center flex-1">
                  <div className="text-center py-3 bg-white/60 rounded-lg px-4 text-sm text-gray-600 backdrop-blur-sm shadow-sm">No messages yet. Say hi!</div>
                </div>
              ) : (
                <div className="flex flex-col justify-end mt-auto gap-0.5">
                  {sortedMsgs.map((msg, index) => {
                    const prev = index > 0 ? sortedMsgs[index - 1] : null;
                    const showTail = !prev || prev.fromMe !== msg.fromMe;
                    return (
                      <div key={msg.id} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'} ${showTail ? 'mt-1' : ''}`}>
                        <div className={`relative max-w-[75%] rounded-lg px-3 py-1.5 shadow-sm text-[14.2px] leading-[19px] ${msg.fromMe ? 'bg-[#d9fdd3] text-[#111b21]' : 'bg-white text-[#111b21]'} ${showTail ? (msg.fromMe ? 'rounded-tr-none' : 'rounded-tl-none') : ''}`}>
                          {showTail && (
                            <span className={`absolute top-0 w-2 h-2 ${msg.fromMe ? '-right-2 text-[#d9fdd3]' : '-left-2 text-white'}`}>
                              <svg viewBox="0 0 8 13" fill="currentColor">
                                {msg.fromMe ? (
                                  <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
                                ) : (
                                  <path d="M2.812 1H8v11.193L1.533 3.568C.474 2.156 1.042 1 2.812 1z" />
                                )}
                              </svg>
                            </span>
                          )}
                          {msg.author && !msg.fromMe && showTail && (
                            <p className="text-xs font-medium text-emerald-600 mb-0.5">{msg.author}</p>
                          )}
                          {msg.type === 'chat' ? (
                            <div className="break-words whitespace-pre-wrap">{msg.body}</div>
                          ) : (
                            <div className="break-words whitespace-pre-wrap italic text-gray-500">
                              {msg.type === 'image' ? '📷 Image' :
                               msg.type === 'video' ? '🎥 Video' :
                               msg.type === 'audio' || msg.type === 'ptt' ? '🎵 Audio' :
                               msg.type === 'document' ? '📄 Document' :
                               msg.type === 'sticker' ? '🏷️ Sticker' :
                               msg.body || `[${msg.type}]`}
                            </div>
                          )}
                          <div className="flex items-center justify-end gap-1 mt-0.5 -mr-1">
                            <span className="text-[11px] text-gray-500 leading-none">{formatTime(msg.timestamp)}</span>
                            {msg.fromMe && msg.ack != null && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-[14px] h-[14px] leading-none ${msg.ack >= 2 ? 'text-blue-500' : 'text-gray-400'}`}>
                                {msg.ack >= 2 ? (
                                  <><polyline points="20 6 9 17 4 12" /><polyline points="20 10 16 14" /></>
                                ) : (
                                  <polyline points="20 6 9 17 4 12" />
                                )}
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-[#202c33] flex items-center gap-3 z-10 w-full">
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-[#2a3942] text-gray-100 rounded-lg px-4 py-2.5 outline-none placeholder:text-gray-400 focus:ring-1 focus:ring-[#00a884]/50 text-sm"
                placeholder="Type a message"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={sendMutation.isPending}
              />
              <button
                type="submit"
                disabled={!messageText.trim() || sendMutation.isPending}
                className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center text-white disabled:opacity-50 hover:bg-[#008f6f] transition-colors shrink-0"
              >
                {sendMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 ml-0.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center flex-col gap-4 z-10">
            <div className="w-24 h-24 rounded-full bg-emerald-900/20 flex items-center justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-accent/30"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
            </div>
            <h1 className="text-xl text-gray-700 font-medium px-6 text-center bg-white/70 backdrop-blur py-1 rounded-md shadow-sm">WhatsApp CRM Inbox</h1>
            <p className="text-gray-500 text-sm text-center max-w-sm px-4 py-2 bg-white/70 backdrop-blur rounded-md shadow-sm">Select a conversation to start messaging across all your connected accounts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
