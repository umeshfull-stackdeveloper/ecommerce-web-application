import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, X, Send, Sparkles, ShoppingBag, Eye, Trash2, ArrowRight } from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useToast } from '../../hooks/useToast';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  products?: any[];
  orders?: any[];
}

export default function AIShoppingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hi! I am NEXUS AI, your personalized shopping assistant. You can ask me to search for products, check order status, or help you with returns and shipping details. How can I help you today?",
      timestamp: new Date(),
      products: []
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Show trending products",
    "Track my order",
    "Return policy"
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsgId = Date.now().toString();
    const newUserMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await apiRequest('/assistant', {
        method: 'POST',
        body: JSON.stringify({ message: textToSend })
      });

      const newAssistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.reply || "Sorry, I encountered an issue processing your query.",
        timestamp: new Date(),
        products: res.products || [],
        orders: res.orders || []
      };

      setMessages(prev => [...prev, newAssistantMsg]);
      if (res.suggestions && res.suggestions.length > 0) {
        setSuggestions(res.suggestions);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("AI Assistant is offline. Please try again later.");
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: "I'm having trouble connecting right now. Please verify your connection or try again shortly.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: "Chat cleared! How can I assist you with your shopping experience now?",
        timestamp: new Date()
      }
    ]);
    setSuggestions(["Show trending products", "Track my order", "Return policy"]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window Panel */}
      {isOpen && (
        <div className="w-[360px] sm:w-[390px] h-[550px] bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-4 transition-all duration-300 animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-700 to-violet-850 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white/10 rounded-xl">
                <Sparkles className="w-5 h-5 text-indigo-300 fill-current animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-wide">NEXUS AI</h3>
                <span className="text-[10px] text-indigo-200 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 animate-ping"></span>
                  Active Shopping Assistant
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={clearChat}
                className="p-1.5 rounded-lg hover:bg-white/10 text-indigo-200 hover:text-white transition-colors cursor-pointer"
                title="Clear Chat History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-indigo-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {messages.map((msg) => {
              const isAi = msg.sender === 'assistant';
              return (
                <div key={msg.id} className={`flex flex-col ${isAi ? 'items-start' : 'items-end'} max-w-[85%] ${isAi ? 'self-start' : 'self-end'}`}>
                  {/* Message Bubble */}
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isAi 
                      ? 'bg-slate-900 border border-slate-850 text-slate-200 rounded-tl-none' 
                      : 'bg-indigo-650 text-white rounded-tr-none shadow-md shadow-indigo-600/5'
                  }`}>
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>

                  {/* Render products if returned */}
                  {isAi && msg.products && msg.products.length > 0 && (
                    <div className="grid grid-cols-1 gap-2.5 mt-2.5 w-full">
                      {msg.products.map((prod) => {
                        const images = JSON.parse(prod.images || '[]');
                        const displayImage = images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100';
                        return (
                          <div 
                            key={prod.id}
                            className="bg-slate-900/60 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl p-2.5 flex gap-3 items-center transition-all group"
                          >
                            <img src={displayImage} alt={prod.name} className="w-11 h-11 object-cover rounded-lg bg-slate-950" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-extrabold text-[11px] text-white truncate group-hover:text-indigo-400 transition-colors">{prod.name}</h4>
                              <p className="text-[10px] text-slate-450 mt-0.5">₹{prod.price.toLocaleString('en-IN')} • ★ {prod.ratings.toFixed(1)}</p>
                            </div>
                            <Link 
                              to={`/product/${prod.slug}`} 
                              onClick={() => setIsOpen(false)}
                              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Render orders if returned */}
                  {isAi && msg.orders && msg.orders.length > 0 && (
                    <div className="flex flex-col gap-3 mt-2.5 w-full">
                      {msg.orders.map((ord) => {
                        // Steps mapping for high-fidelity order timeline
                        const steps = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
                        const curIdx = steps.indexOf(ord.trackingStatus);
                        return (
                          <div key={ord.id} className="bg-slate-900 border border-slate-850 rounded-2xl p-3 flex flex-col gap-2.5 shadow-sm">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-indigo-400 truncate max-w-[150px]">Order: #{ord.id.slice(0, 8)}</span>
                              <span className="font-semibold text-slate-400">₹{ord.totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <p className="text-[10px] text-slate-350 line-clamp-1">Items: {ord.items}</p>
                            
                            {/* Visual Tracking Map */}
                            <div className="flex items-center justify-between mt-1 px-1">
                              {steps.map((step, idx) => {
                                const active = idx <= curIdx;
                                return (
                                  <div key={step} className="flex flex-col items-center gap-1.5 relative flex-1">
                                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-all ${
                                      active 
                                        ? 'bg-indigo-650 border-indigo-500 text-white' 
                                        : 'bg-slate-950 border-slate-800 text-slate-600'
                                    }`}>
                                      {active && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                    </div>
                                    <span className={`text-[8px] font-bold ${active ? 'text-slate-200' : 'text-slate-650'}`}>
                                      {step.charAt(0) + step.slice(1).toLowerCase()}
                                    </span>
                                    {idx < steps.length - 1 && (
                                      <div className={`absolute top-1.5 left-[calc(50%+8px)] right-[calc(-50%+8px)] h-0.5 z-0 ${
                                        idx < curIdx ? 'bg-indigo-550' : 'bg-slate-850'
                                      }`} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Timestamp */}
                  <span className="text-[8px] text-slate-550 mt-1 pl-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            
            {isLoading && (
              <div className="flex items-center gap-1.5 self-start bg-slate-900 border border-slate-850 rounded-2xl rounded-tl-none p-3.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.3s' }}></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          {suggestions.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-900/60 bg-slate-950 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {suggestions.map((sug) => (
                <button
                  key={sug}
                  onClick={() => handleSendMessage(sug)}
                  disabled={isLoading}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-indigo-950/30 border border-slate-850 hover:border-indigo-900/40 text-[10px] text-slate-400 hover:text-indigo-400 rounded-full transition-all cursor-pointer truncate max-w-full"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Form Input footer */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }}
            className="p-3 border-t border-slate-900 bg-slate-950 flex gap-2 items-center"
          >
            <input 
              type="text" 
              placeholder="Ask anything or check order status..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 rounded-xl bg-slate-900 border border-slate-850 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500/80 transition-all"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white transition-all disabled:opacity-40 disabled:hover:bg-indigo-650 cursor-pointer shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Button Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-108 hover:shadow-indigo-500/20 active:scale-95"
        title="AI Shopping Assistant"
      >
        {isOpen ? <X className="w-6 h-6 animate-fade-in" /> : <MessageSquare className="w-6 h-6 animate-fade-in" />}
      </button>
    </div>
  );
}
