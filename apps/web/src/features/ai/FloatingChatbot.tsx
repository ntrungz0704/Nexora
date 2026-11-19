import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { ProductDto } from '@nexora/shared';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  suggestedProducts?: ProductDto[];
  quickReplies?: string[];
  timestamp: string;
}

export const FloatingChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Xin chào! Tôi là Nexora AI, trợ lý ảo chuyên tư vấn phần cứng và chính sách bán hàng. Bạn đang cần tìm sản phẩm gì hay cần giải đáp thắc mắc nào hôm nay?',
      quickReplies: ['Tư vấn laptop gaming', 'Chính sách bảo hành', 'Xây dựng cấu hình PC', 'Phí giao hàng'],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgIdCounter = useRef(1);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsgId = `u-${msgIdCounter.current++}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
      const res = await fetch(`${apiUrl}/ai/chatbot/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-4).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const data = json.data;
        const aiMsg: ChatMessage = {
          id: `ai-${msgIdCounter.current++}`,
          sender: 'ai',
          text: data.answer,
          suggestedProducts: data.suggestedProducts,
          quickReplies: data.quickReplies,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('API request failed');
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${msgIdCounter.current++}`,
        sender: 'ai',
        text: 'Xin lỗi, tôi đang bận xử lý dữ liệu. Bạn có thể gọi hotline 1800 2097 để được nhân viên hỗ trợ trực tiếp ngay nhé!',
        quickReplies: ['Chính sách bảo hành', 'Địa chỉ cửa hàng'],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 group border-2 border-white/20"
            aria-label="Mở chat AI Tư vấn"
          >
            <div className="relative">
              <i className="fas fa-robot text-xl animate-bounce"></i>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div className="text-left">
              <div className="text-xs uppercase tracking-wider text-blue-200 font-bold">Nexora AI</div>
              <div className="text-sm font-semibold">Tư vấn phần cứng</div>
            </div>
          </button>
        )}
      </div>

      {/* Floating Chat Modal Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-32px)] h-[580px] max-h-[calc(100vh-100px)] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl shadow-inner">
                <i className="fas fa-robot text-white"></i>
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Nexora AI Assistant</h3>
                <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  Trực tuyến 24/7
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                title="Đóng cửa sổ chat"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                </div>

                {/* Suggested Product Cards inside chat */}
                {m.suggestedProducts && m.suggestedProducts.length > 0 && (
                  <div className="mt-2 space-y-2 w-full max-w-[90%]">
                    {m.suggestedProducts.map((p) => (
                      <Link
                        key={p.id}
                        to={`/product/${p.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-2 bg-white hover:bg-blue-50 border border-gray-200 rounded-xl transition-all shadow-sm hover:border-blue-400 block text-left"
                      >
                        <img
                          src={p.thumbnailUrl || '/assets/images/default-product.png'}
                          alt={p.name}
                          className="w-12 h-12 object-contain bg-white rounded-lg p-1 border border-gray-100"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-gray-900 truncate">{p.name}</h4>
                          <div className="text-xs font-bold text-red-600 mt-0.5">
                            {Number(p.salePrice || p.price).toLocaleString('vi-VN')}đ
                          </div>
                        </div>
                        <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Quick Replies chips */}
                {m.quickReplies && m.quickReplies.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                    {m.quickReplies.map((reply, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(reply)}
                        className="text-xs bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400 px-3 py-1 rounded-full transition-all shadow-xs"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[10px] text-gray-400 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-gray-500 text-xs italic bg-white px-3 py-2 rounded-xl w-fit shadow-xs border border-gray-100">
                <i className="fas fa-spinner fa-spin text-blue-600"></i>
                Nexora AI đang soạn câu trả lời...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Hỏi cấu hình, bảo hành, linh kiện..."
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputMessage.trim() || isLoading}
              className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white flex items-center justify-center transition-all shadow-md shrink-0"
              aria-label="Gửi tin nhắn"
            >
              <i className="fas fa-paper-plane text-sm"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
