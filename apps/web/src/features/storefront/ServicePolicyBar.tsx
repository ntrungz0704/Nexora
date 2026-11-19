import React from 'react';

export const ServicePolicyBar: React.FC = () => {
  const policies = [
    {
      icon: '/assets/images/feature-shipping.jpg',
      title: 'Miễn phí giao hàng',
      subtitle: 'Đơn hàng từ 300k',
    },
    {
      icon: '/assets/images/feature-warranty.jpg',
      title: 'Bảo hành chính hãng',
      subtitle: 'Cam kết 100% linh kiện',
    },
    {
      icon: '/assets/images/feature-return.jpg',
      title: 'Đổi trả dễ dàng',
      subtitle: 'Trong 7 ngày đầu tiên',
    },
    {
      icon: '/assets/images/feature-cod.jpg',
      title: 'Thanh toán COD',
      subtitle: 'Kiểm hàng trước thanh toán',
    },
    {
      icon: '/assets/images/feature-support.jpg',
      title: 'Hỗ trợ kỹ thuật 24/7',
      subtitle: 'Hotline: 1800 2097',
    },
  ];

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {policies.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/60 transition"
          >
            <img
              src={item.icon}
              alt={item.title}
              className="w-10 h-10 object-contain rounded-lg flex-shrink-0"
              onError={(e) => {
                // Fallback to FontAwesome icon if image not available
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white">{item.title}</span>
              <span className="text-[11px] text-slate-400">{item.subtitle}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
