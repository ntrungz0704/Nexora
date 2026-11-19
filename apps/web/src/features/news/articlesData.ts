export interface ArticleItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  views: number;
  image: string;
  readTime: string;
}

export const ARTICLES_SEED: ArticleItem[] = [
  {
    id: '1',
    slug: 'nvidia-rtx-50-series-blackwell-review',
    title: 'Đánh giá chi tiết NVIDIA RTX 50 Series: Bước nhảy vọt kiến trúc Blackwell và DLSS 4',
    excerpt: 'Tìm hiểu sức mạnh thực tế của dòng card đồ họa RTX 5090 và RTX 5080 với bộ nhớ GDDR7 băng thông siêu khủng, tối ưu cho đồ họa AI và gaming 4K path tracing.',
    category: 'Đánh giá',
    author: 'Hoàng Long',
    date: '18/11/2026',
    views: 4520,
    image: '/assets/images/posts/tin-tuc-1.jpg',
    readTime: '6 phút đọc',
  },
  {
    id: '2',
    slug: 'intel-core-ultra-9-vs-amd-ryzen-9',
    title: 'So sánh Intel Core Ultra 9 vs AMD Ryzen 9 9950X: Đâu là ông vua đa nhân năm 2026?',
    excerpt: 'Kiểm nghiệm hiệu năng render đồ họa Cinebench 2026, Blender và hiệu suất chơi game thực tế giữa hai con chip đầu bảng mạnh nhất hiện nay.',
    category: 'Tin công nghệ',
    author: 'Minh Tuấn',
    date: '17/11/2026',
    views: 3100,
    image: '/assets/images/posts/cpu_i9_vs_ryzen7.jpg',
    readTime: '5 phút đọc',
  },
  {
    id: '3',
    slug: 'top-ban-phim-co-gaming-khong-day-2026',
    title: 'Top 5 bàn phím cơ không dây độ trễ siêu thấp đáng mua nhất cho game thủ eSports',
    excerpt: 'Tổng hợp các bàn phím Switch cơ học bấm mượt mà, kết nối 2.4GHz không giật lag và thời lượng pin vượt mốc 100 giờ sử dụng liên tục.',
    category: 'Thủ thuật & Tư vấn',
    author: 'Thành Trung',
    date: '15/11/2026',
    views: 2890,
    image: '/assets/images/posts/windows11_gaming_opt.jpg',
    readTime: '4 phút đọc',
  },
  {
    id: '4',
    slug: 'huong-dan-toi-uu-man-hinh-oled-gaming',
    title: 'Hướng dẫn cân chỉnh màu và chống hiện tượng burn-in trên màn hình Gaming OLED cao cấp',
    excerpt: 'Bí quyết giúp người dùng khai thác tối đa dải màu DCI-P3 99%, chuẩn HDR1000 và bảo vệ màn hình OLED luôn bền bỉ theo năm tháng.',
    category: 'Thủ thuật & Tư vấn',
    author: 'Ngọc Sơn',
    date: '12/11/2026',
    views: 1950,
    image: '/assets/images/posts/laptop_copilot_ai_2026.jpg',
    readTime: '7 phút đọc',
  },
  {
    id: '5',
    slug: 'pc-workstation-deepseek-ai-local',
    title: 'Tự build PC Workstation chạy mô hình AI DeepSeek R1 và LLM cục bộ tối ưu chi phí 2026',
    excerpt: 'Lựa chọn dung lượng VRAM GPU, băng thông RAM DDR5 và cấu hình tản nhiệt nước duy trì hiệu suất train và inference AI 24/7.',
    category: 'Thủ thuật & Tư vấn',
    author: 'Quốc Bảo',
    date: '10/11/2026',
    views: 5210,
    image: '/assets/images/posts/pc_workstation_ai_deepseek.jpg',
    readTime: '8 phút đọc',
  },
  {
    id: '6',
    slug: 'top-laptop-sinh-vien-hoc-tap-2026',
    title: 'Top 7 laptop sinh viên mỏng nhẹ, pin trâu và tích hợp NPU AI tốt nhất năm học 2026',
    excerpt: 'Đánh giá các mẫu máy phân khúc 15-20 triệu đáp ứng trọn vẹn nhu cầu học tập, làm việc đồ họa nhẹ và giải trí.',
    category: 'Đánh giá',
    author: 'Hà My',
    date: '08/11/2026',
    views: 4120,
    image: '/assets/images/posts/laptop_sinh_vien_2026.jpg',
    readTime: '5 phút đọc',
  },
];
