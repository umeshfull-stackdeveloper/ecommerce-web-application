import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../services/api';
import { useAppSelector } from '../hooks/reduxHooks';
import socketService from '../socket/socketService';
import { MessageSquare, Send, Circle, Shield, User } from 'lucide-react';
import { useToast } from '../hooks/useToast';

export default function ChatSupport() {
  const [searchParams] = useSearchParams();
  const directUserId = searchParams.get('userId'); // If linking from seller chat button
  
  const { user, accessToken } = useAppSelector((state) => state.auth);
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeUserId, setActiveUserId] = useState<string | null>(directUserId);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsersStatus, setOnlineUsersStatus] = useState<Record<string, 'online' | 'offline'>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations list
  const { data: contactsData, isLoading: loadingContacts } = useQuery({
    queryKey: ['chatContacts'],
    queryFn: () => apiRequest('/chat/users'),
    enabled: !!user
  });

  const contacts = contactsData?.users || [];

  // Fetch active conversation history
  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ['chatHistory', activeUserId],
    queryFn: () => apiRequest(`/chat/history/${activeUserId}`),
    enabled: !!activeUserId,
  } as any);

  useEffect(() => {
    const data = historyData as any;
    if (data?.messages) {
      setMessages(data.messages);
    }
  }, [historyData]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Handle Socket connections
  useEffect(() => {
    if (!accessToken) return;

    // Connect socket
    socketService.connect(accessToken);

    if (activeUserId) {
      socketService.joinChat(activeUserId);
    }

    // Subscribe to incoming messages
    const unsubscribeMessage = socketService.onMessage((msg) => {
      // If message is from active contact, add to list
      if (msg.senderId === activeUserId || msg.receiverId === activeUserId) {
        setMessages((prev) => [...prev, msg]);
      } else {
        // Notify new message from other user
        toast.info(`New message received`);
        queryClient.invalidateQueries({ queryKey: ['chatContacts'] });
      }
    });

    // Subscribe to user online/offline status
    const unsubscribeStatus = socketService.onUserStatus((data) => {
      setOnlineUsersStatus((prev) => ({
        ...prev,
        [data.userId]: data.status
      }));
    });

    // Subscribe to typing indicators
    const unsubscribeTyping = socketService.onTyping((data) => {
      if (data.senderId === activeUserId) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.add(data.senderId);
          return next;
        });
      }
    });

    const unsubscribeStopTyping = socketService.onStopTyping((data) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(data.senderId);
        return next;
      });
    });

    return () => {
      unsubscribeMessage();
      unsubscribeStatus();
      unsubscribeTyping();
      unsubscribeStopTyping();
      socketService.disconnect();
    };
  }, [accessToken, activeUserId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeUserId) return;

    // Emit via sockets
    socketService.sendMessage(activeUserId, inputMessage.trim());
    socketService.emitStopTyping(activeUserId);

    // Optimistically push to message thread (will match when message_sent triggers, or updated directly)
    const optimisticMessage = {
      id: 'opt_' + Date.now(),
      senderId: user?.id,
      receiverId: activeUserId,
      message: inputMessage.trim(),
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setInputMessage('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    if (!activeUserId) return;

    if (e.target.value.trim().length > 0) {
      socketService.emitTyping(activeUserId);
    } else {
      socketService.emitStopTyping(activeUserId);
    }
  };

  const activeContact = contacts.find((c: any) => c.id === activeUserId);

  return (
    <div className="py-6 h-[80vh] flex flex-col gap-6 max-w-5xl mx-auto animate-slide-up">
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <MessageSquare className="w-8 h-8 text-indigo-400" /> Live Chat Channels
        </h1>
        <p className="text-xs text-slate-450 mt-1">Chat in real-time with marketplace sellers and system support admin staff.</p>
      </div>

      <div className="flex-1 flex border border-slate-900 bg-slate-950/40 rounded-3xl overflow-hidden glass-panel">
        
        {/* Contacts Sidebar */}
        <aside className="w-1/3 border-r border-slate-900 flex flex-col">
          <div className="p-4 border-b border-slate-900 font-bold text-sm text-white">Conversations</div>
          <div className="flex-1 overflow-y-auto flex flex-col">
            {loadingContacts ? (
              <div className="p-4 animate-pulse flex flex-col gap-2">
                <div className="h-10 w-full bg-slate-900 rounded-xl" />
                <div className="h-10 w-full bg-slate-900 rounded-xl" />
              </div>
            ) : contacts.length === 0 ? (
              <p className="text-slate-550 text-xs p-8 text-center">No active chats found. Link from products details to message sellers.</p>
            ) : (
              contacts.map((contact: any) => {
                const isOnline = onlineUsersStatus[contact.id] === 'online';
                const isActive = contact.id === activeUserId;

                return (
                  <button
                    key={contact.id}
                    onClick={() => setActiveUserId(contact.id)}
                    className={`p-4 border-b border-slate-950 text-left transition-all flex items-center gap-3 cursor-pointer ${isActive ? 'bg-indigo-600/10' : 'hover:bg-slate-900/40'}`}
                  >
                    <div className="relative">
                      <div className="rounded-full bg-slate-900 border border-slate-800 p-2 text-slate-400">
                        {contact.role === 'ADMIN' ? <Shield className="w-4 h-4 text-indigo-400" /> : <User className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <Circle className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-slate-950 fill-current ${isOnline ? 'text-emerald-450' : 'text-slate-650'}`} />
                    </div>
                    <div className="flex flex-col gap-0.5 text-xs min-w-0">
                      <span className="font-bold text-slate-200 truncate">{contact.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">{contact.role}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Chat Feed */}
        <section className="flex-1 flex flex-col min-w-0">
          {activeUserId ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-900 bg-slate-950/20 flex items-center justify-between">
                <span className="font-bold text-sm text-white">
                  {activeContact?.name || 'Chat Session'}
                </span>
                {onlineUsersStatus[activeUserId] === 'online' && (
                  <span className="text-[10px] text-emerald-450 font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" /> Online
                  </span>
                )}
              </div>

              {/* Feed messages */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">
                {loadingHistory ? (
                  <p className="text-center py-6 text-xs text-slate-500">Loading history logs...</p>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[70%] text-xs p-3 rounded-2xl ${isMe ? 'self-end bg-indigo-600/90 text-white rounded-br-none shadow-md' : 'self-start bg-slate-900 border border-slate-800 text-slate-250 rounded-bl-none'}`}
                      >
                        <p>{msg.message}</p>
                        <span className={`text-[8px] mt-1.5 self-end ${isMe ? 'text-indigo-200' : 'text-slate-500'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                {typingUsers.has(activeUserId) && (
                  <div className="self-start bg-slate-900/60 border border-slate-850 text-slate-450 p-2.5 rounded-2xl rounded-bl-none text-xs italic animate-pulse">
                    typing...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Form Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-900 bg-slate-950/30 flex gap-2">
                <input
                  type="text"
                  placeholder="Type message here..."
                  value={inputMessage}
                  onChange={handleInputChange}
                  className="flex-1 rounded-full border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30"
                />
                <button
                  type="submit"
                  className="rounded-full bg-indigo-600 hover:bg-indigo-500 p-2.5 text-white flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-indigo-500/10"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center gap-2 text-center text-slate-500">
              <MessageSquare className="w-10 h-10 text-slate-700" />
              <p className="text-xs font-semibold">Select a conversation thread to initiate chat.</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
