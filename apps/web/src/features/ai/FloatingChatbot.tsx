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
      text: 'Xin chào! Tôi là Nexora AI, trợ lý ảo chuyên tư vấn cấu hình PC, laptop và linh kiện máy tính. Bạn đang cần tìm sản phẩm hay cần tư vấn mức ngân sách nào?',
      quickReplies: [
        'Tư vấn laptop gaming',
        'Xây dựng cấu hình PC',
        'Chính sách bảo hành',
        'Phí giao hàng',
      ],
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
      {/* Floating Trigger Button: Exact TechPilot 60x60 Circular Mascot */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="tp-chatbot-launcher"
          id="tpChatbotLauncher"
          aria-label="Mở chat Nexora AI"
          title="Tư vấn AI thông minh"
        >
          <img
            src="/assets/images/chatbot-avatar.png"
            alt="AI Avatar"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <span className="tp-chatbot-launcher-pulse"></span>
        </button>
      )}

      {/* Floating Chat Modal Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-32px)] h-[580px] max-h-[calc(100vh-100px)] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0A5BFF 0%, #0040C1 100%)',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(10, 91, 255, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <img
                  src="/assets/images/chatbot-avatar.png"
                  alt="AI Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </span>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Nexora AI</h4>
                <span
                  style={{
                    fontSize: '11px',
                    opacity: 0.85,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    marginTop: '2px',
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      background: '#10B981',
                      borderRadius: '50%',
                      display: 'inline-block',
                    }}
                  ></span>
                  Trợ lý ảo online
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.85)',
                fontSize: '18px',
                cursor: 'pointer',
              }}
              aria-label="Đóng chat"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', maxWidth: '85%' }}
                >
                  {m.sender === 'ai' && (
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        flexShrink: 0,
                        marginTop: '2px',
                        background: '#0A5BFF',
                        display: 'inline-block',
                      }}
                    >
                      <img
                        src="/assets/images/chatbot-avatar.png"
                        alt="Bot"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </span>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                      m.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none ml-auto'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>
                  </div>
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
