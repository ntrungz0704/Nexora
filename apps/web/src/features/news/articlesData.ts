export interface ArticleItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  categoryKey?: string;
  author: string;
  date: string;
  views: number;
  image: string;
  readTime: string;
}

export const ARTICLES_SEED: ArticleItem[] = [
  {
    id: '1',
    slug: 'top-5-laptop-ban-chay-nhat-2026',
    title: 'Top 5 laptop bán chạy nhất Nexora trong năm 2026',
    excerpt:
      'Tổng hợp 5 mẫu laptop bán chạy nhất với thiết kế mỏng nhẹ, hiệu năng AI vượt trội và thời lượng pin ấn tượng đáp ứng mọi nhu cầu học tập, làm việc và gaming.',
    category: 'Tư vấn chọn mua',
    author: 'Nexora Team',
    date: '19/11/2026',
    views: 8920,
    image: '/assets/images/posts/laptop_sinh_vien_2026.jpg',
    readTime: '5 phút đọc',
  },
  {
    id: '2',
    slug: 'nvidia-rtx-50-series-blackwell-review',
    title: 'Đánh giá chi tiết NVIDIA RTX 50 Series: Bước nhảy vọt kiến trúc Blackwell và DLSS 4',
    excerpt:
      'Tìm hiểu sức mạnh thực tế của dòng card đồ họa RTX 5090 và RTX 5080 với bộ nhớ GDDR7 băng thông siêu khủng, tối ưu cho đồ họa AI và gaming 4K path tracing.',
    category: 'Đánh giá',
    author: 'Hoàng Long',
    date: '18/11/2026',
    views: 6520,
    image: '/assets/images/posts/tin-tuc-1.jpg',
    readTime: '6 phút đọc',
  },
  {
    id: '3',
    slug: 'intel-i9-14900k-vs-amd-ryzen-7-7800x3d',
    title: 'So sánh Intel Core i9-14900K vs AMD Ryzen 7 7800X3D: Đâu là Vua Gaming 2026?',
    excerpt:
      'Kiểm nghiệm hiệu năng chơi game thực tế, công suất tiêu thụ và tỷ lệ P/P giữa hai con chip hàng đầu thị trường công nghệ hiện nay.',
    category: 'So sánh sản phẩm',
    author: 'Minh Tuấn',
    date: '17/11/2026',
    views: 5410,
    image: '/assets/images/posts/cpu_i9_vs_ryzen7.jpg',
    readTime: '7 phút đọc',
  },
  {
    id: '4',
    slug: 'top-ban-phim-co-gaming-khong-day-2026',
    title: 'Top 5 bàn phím cơ không dây độ trễ siêu thấp đáng mua nhất cho game thủ eSports',
    excerpt:
      'Tổng hợp các bàn phím Switch cơ học bấm mượt mà, kết nối 2.4GHz không giật lag và thời lượng pin vượt mốc 100 giờ sử dụng liên tục.',
    category: 'Tư vấn chọn mua',
    author: 'Thành Trung',
    date: '15/11/2026',
    views: 4890,
    image: '/assets/images/posts/windows11_gaming_opt.jpg',
    readTime: '4 phút đọc',
  },
  {
    id: '5',
    slug: '10-meo-toi-uu-windows-11-gaming-2026',
    title: '10 mẹo tối ưu Windows 11 giúp tăng tốc máy tính và chơi game mượt hơn 2026',
    excerpt:
      'Bí quyết tinh chỉnh Game Mode, giải phóng RAM, tắt telemetry ngầm và tối ưu driver GPU để đạt FPS tối đa trên mọi tựa game AAA.',
    category: 'Mẹo hay & Thủ thuật',
    author: 'Ngọc Sơn',
    date: '13/11/2026',
    views: 3950,
    image: '/assets/images/posts/tin-tuc-2.jpg',
    readTime: '5 phút đọc',
  },
  {
    id: '6',
    slug: 'pc-workstation-deepseek-ai-local',
    title: 'Tự build PC Workstation chạy mô hình AI DeepSeek R1 và LLM cục bộ tối ưu chi phí 2026',
    excerpt:
      'Lựa chọn dung lượng VRAM GPU, băng thông RAM DDR5 và cấu hình tản nhiệt nước duy trì hiệu suất train và inference AI 24/7.',
    category: '✨ AI & Copilot+',
    author: 'Quốc Bảo',
    date: '10/11/2026',
    views: 7210,
    image: '/assets/images/posts/pc_workstation_ai_deepseek.jpg',
    readTime: '8 phút đọc',
  },
  {
    id: '7',
    slug: 'huong-dan-nang-cap-ssd-nvme-pcie-4',
    title: 'Hướng dẫn nâng cấp SSD NVMe PCIe 4.0 chuẩn xác và hiệu quả nhất 2026',
    excerpt:
      'Các bước chọn mua đúng chuẩn kích thước M.2 2280, lắp tản nhiệt nhôm chống throttling và sao lưu dữ liệu hệ điều hành nguyên vẹn.',
    category: 'Mẹo hay & Thủ thuật',
    author: 'Hà My',
    date: '08/11/2026',
    views: 3120,
    image: '/assets/images/posts/tin-tuc-3.jpg',
    readTime: '6 phút đọc',
  },
];
