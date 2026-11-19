import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { CartDrawer } from '../storefront/CartDrawer';
import { AuthModal } from '../storefront/AuthModal';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { getProductImage } from '../../lib/productImage';
import type { AuthUser, ProductDto } from '@nexora/shared';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  recommendedProducts?: ProductDto[];
  timestamp: string;
}

export const AiAssistantPage: React.FC = () => {
  const queryClient = useQueryClient();
  const msgCounterRef = React.useRef(2);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => storefrontService.getCategories(),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => storefrontService.getProducts({ limit: 20 }),
  });
  const allProducts = productsData?.products || [];

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Chào bạn! Mình là AI Trợ lý Tư vấn Phần cứng của Nexora / TechPilot. Bạn đang tìm cấu hình PC chơi game, laptop làm việc hay nâng cấp linh kiện nào? Hãy cho mình biết mức ngân sách hoặc nhu cầu cụ thể nhé!',
      timestamp: 'Vừa xong',
    },
  ]);

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim()) return;

    msgCounterRef.current += 1;
    const userMsgId = `user-${msgCounterRef.current}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: 'Bây giờ',
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsThinking(true);

    // AI logic response simulation with matching products
    setTimeout(() => {
      let reply = 'Dựa trên nhu cầu của bạn, đây là những phương án phần cứng tối ưu hiệu năng trên giá thành (P/P) tốt nhất đang sẵn hàng tại kho Nexora:';
      const lowercase = text.toLowerCase();
      let picked: ProductDto[];

      if (lowercase.includes('laptop') || lowercase.includes('hoc') || lowercase.includes('sinh vien')) {
        reply = 'Đối với nhu cầu học tập, đồ họa và tính cơ động, các mẫu Laptop trang bị vi xử lý Core i7/Ryzen 7 và màn hình OLED là lựa chọn hàng đầu:';
        picked = allProducts.filter((p) => p.name.toLowerCase().includes('laptop') || p.name.toLowerCase().includes('zephyrus')).slice(0, 2);
      } else if (lowercase.includes('game') || lowercase.includes('vga') || lowercase.includes('card')) {
        reply = 'Để chiến mượt mà các tựa game AAA ở độ phân giải 2K/4K max settings, hệ sinh thái RTX 4070/4090 và màn hình 240Hz là combo hoàn hảo:';
        picked = allProducts.filter((p) => p.name.toLowerCase().includes('rtx') || p.name.toLowerCase().includes('màn hình')).slice(0, 2);
      } else {
        picked = allProducts.slice(0, 2);
      }

      msgCounterRef.current += 1;
      const aiReply: ChatMessage = {
        id: `ai-${msgCounterRef.current}`,
        sender: 'assistant',
        text: reply,
        recommendedProducts: picked,
        timestamp: 'Vừa xong',
      };
      setMessages((prev) => [...prev, aiReply]);
      setIsThinking(false);
    }, 800);
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main, #F8FAFC)', minHeight: '100vh' }}>
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#0A5BFF',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(10, 91, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 700,
            fontSize: '13px',
          }}
        >
          <i className="fa-solid fa-circle-check" style={{ color: '#00C8FF', fontSize: '16px' }}></i>
          <span>{toastMessage}</span>
        </div>
      )}

      <StorefrontHeader
        categories={categories}
        cartCount={cart?.totalItems || 0}
        wishlistCount={1}
        currentUser={currentUser}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => {
          authService.logout();
          setCurrentUser(null);
          showToast('Đã đăng xuất.');
        }}
      />

      <main className="container" style={{ margin: '30px auto 60px auto', maxWidth: '1000px', padding: '0 16px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Trang chủ</Link>
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
          <span style={{ color: '#8B5CF6', fontWeight: 600 }}>AI Hardware Assistant</span>
        </div>

        {/* AI Hero Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
            borderRadius: '24px',
            padding: '36px',
            color: '#FFFFFF',
            marginBottom: '28px',
            boxShadow: '0 12px 30px rgba(67, 56, 202, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ maxWidth: '650px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255,255,255,0.15)',
                padding: '6px 14px',
                borderRadius: '30px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '1px',
                marginBottom: '12px',
              }}
            >
              <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#FACC15' }}></i> GEMINI AI POWERED
            </span>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 10px 0' }}>
              Trợ Lý AI Tư Vấn Phần Cứng
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '14px', lineHeight: '1.6' }}>
              Hỏi đáp mọi thắc mắc về máy tính, khả năng nâng cấp, tương thích phần cứng và tìm sản phẩm đúng ngân sách với trí tuệ nhân tạo.
            </p>
          </div>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              color: '#FACC15',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <i className="fa-solid fa-robot"></i>
          </div>
        </div>

        {/* Quick Prompts Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
          {[
            'Tư vấn build PC Gaming 20 triệu',
            'Chọn Laptop mỏng nhẹ cho sinh viên CNTT',
            'So sánh card đồ họa RTX 4070 vs 4090',
            'Màn hình đồ họa chuẩn màu tốt nhất',
          ].map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickPrompt(prompt)}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '20px',
                padding: '8px 16px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: '#4338CA',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              }}
            >
              ✨ {prompt}
            </button>
          ))}
        </div>

        {/* Chat Window */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '560px',
          }}
        >
          {/* Messages list */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}
              >
                {msg.sender === 'assistant' && (
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#EEF2FF',
                      color: '#4338CA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '15px',
                      flexShrink: 0,
                    }}
                  >
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                  </div>
                )}
                <div>
                  <div
                    style={{
                      backgroundColor: msg.sender === 'user' ? '#0A5BFF' : '#F8FAFC',
                      color: msg.sender === 'user' ? '#FFFFFF' : '#0F172A',
                      padding: '14px 18px',
                      borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      border: msg.sender === 'user' ? 'none' : '1px solid #E2E8F0',
                      fontSize: '14px',
                      lineHeight: '1.6',
                    }}
                  >
                    {msg.text}

                    {/* Hardware Cards embedded in AI response */}
                    {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                        {msg.recommendedProducts.map((p) => {
                          const pr = p.salePrice ? Number(p.salePrice) : Number(p.price);
                          return (
                            <div
                              key={p.id}
                              style={{
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                borderRadius: '12px',
                                padding: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                              }}
                            >
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <img
                                  src={getProductImage(p)}
                                  alt={p.name}
                                  style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                                />
                                <div>
                                  <Link
                                    to={`/product/detail/${p.slug}`}
                                    style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', textDecoration: 'none' }}
                                  >
                                    {p.name}
                                  </Link>
                                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#EF4444' }}>
                                    {pr.toLocaleString('vi-VN')}đ
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  cartService.addItem(p.id, 1).then(() => {
                                    queryClient.invalidateQueries({ queryKey: ['cart'] });
                                    showToast(`Đã thêm "${p.name}" vào giỏ hàng!`);
                                  });
                                }}
                                style={{
                                  marginTop: '10px',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  backgroundColor: '#0A5BFF',
                                  color: '#FFFFFF',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                <i className="fa-solid fa-cart-shopping"></i> Thêm vào giỏ
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isThinking && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#EEF2FF',
                    color: '#4338CA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <i className="fa-solid fa-ellipsis fa-fade"></i>
                </div>
                <span style={{ fontSize: '13px', color: '#64748B', fontStyle: 'italic' }}>
                  AI đang phân tích phần cứng và chuẩn bị câu trả lời...
                </span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '16px 20px',
              borderTop: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              placeholder="Nhập câu hỏi cho AI (ví dụ: tư vấn build máy đồ họa 3D giá dưới 25 triệu)..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: '12px',
                border: '1px solid #CBD5E1',
                fontSize: '13.5px',
                outline: 'none',
                backgroundColor: '#FFFFFF',
              }}
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isThinking}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: inputPrompt.trim() ? '#4338CA' : '#94A3B8',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: inputPrompt.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: inputPrompt.trim() ? '0 4px 14px rgba(67, 56, 202, 0.3)' : 'none',
              }}
            >
              <span>Gửi</span>
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      </main>

      <StorefrontFooter />

      <CartDrawer
        isOpen={isCartOpen}
        cart={cart || null}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={(id, qty) => cartService.updateItem(id, qty)}
        onRemoveItem={(id) => cartService.removeItem(id)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Chào mừng, ${user.fullName}!`);
        }}
      />
    </div>
  );
};
