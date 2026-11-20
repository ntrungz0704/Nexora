import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StorefrontHeader } from '../storefront/StorefrontHeader';
import { StorefrontFooter } from '../storefront/StorefrontFooter';
import { storefrontService } from '../../services/storefrontService';
import { cartService } from '../../services/cartService';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';

interface JobPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  salary: string;
  type: string;
  requirements: string[];
}

const OPEN_POSITIONS: JobPosition[] = [
  {
    id: 'job-1',
    title: 'Chuyên Viên Tư Vấn Kỹ Thuật PC & Gaming Gear',
    department: 'Khối Kinh Doanh & Bán Lẻ',
    location: 'TP. Hồ Chí Minh & Hà Nội',
    salary: '10.000.000đ - 18.000.000đ + Thưởng',
    type: 'Toàn thời gian',
    requirements: [
      'Am hiểu sâu về cấu hình PC, socket CPU, GPU, linh kiện máy tính và gaming gear.',
      'Kỹ năng giao tiếp niềm nở, lắng nghe và thấu hiểu nhu cầu của khách hàng.',
      'Có kinh nghiệm bán hàng thiết bị công nghệ là một lợi thế.',
    ],
  },
  {
    id: 'job-2',
    title: 'Kỹ Thuật Viên Lắp Ráp & Xử Lý Sự Cố Phần Cứng',
    department: 'Khối Kỹ Thuật & Dịch Vụ',
    location: 'Showroom Quận 1 & Cầu Giấy',
    salary: '11.000.000đ - 19.000.000đ',
    type: 'Toàn thời gian',
    requirements: [
      'Thành thạo lắp ráp linh kiện PC, đi dây thẩm mỹ (cable management), tản nhiệt nước AIO/Custom.',
      'Kinh nghiệm cài đặt hệ điều hành, tối ưu BIOS, driver và xử lý xung đột phần cứng.',
      'Cẩn thận, tỉ mỉ và trách nhiệm cao trong công việc.',
    ],
  },
  {
    id: 'job-3',
    title: 'Chuyên Viên Chăm Sóc Khách Hàng & Tiếp Nhận Bảo Hành',
    department: 'Dịch Vụ Khách Hàng',
    location: 'TP. Hồ Chí Minh',
    salary: '9.000.000đ - 14.000.000đ',
    type: 'Toàn thời gian',
    requirements: [
      'Tiếp nhận yêu cầu tra cứu đơn hàng, tư vấn chính sách đổi trả và tiến độ bảo hành.',
      'Kỹ năng xử lý tình huống linh hoạt, giọng nói truyền cảm, chuẩn mực.',
      'Sử dụng thành thạo máy vi tính và các phần mềm quản lý đơn hàng.',
    ],
  },
  {
    id: 'job-4',
    title: 'Senior Full-Stack Engineer (TypeScript, React, Node.js)',
    department: 'Khối Công Nghệ & Phần Mềm',
    location: 'Hybrid / Văn phòng TP.HCM',
    salary: '25.000.000đ - 45.000.000đ',
    type: 'Toàn thời gian',
    requirements: [
      'Thành thạo TypeScript, React 19, Tailwind CSS, Node.js và hệ cơ sở dữ liệu MySQL.',
      'Có kinh nghiệm xây dựng hệ thống thương mại điện tử, xử lý thanh toán và tối ưu hiệu năng.',
      'Tư duy Clean Architecture, bảo mật và tinh thần trách nhiệm sản phẩm cao.',
    ],
  },
];

export const CareersPage: React.FC = () => {
  const [currentUser] = React.useState(() => authService.getCurrentUser());

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => storefrontService.getCategories(),
  });

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartService.getCart(),
  });

  const { data: wishlistCount = 0 } = useQuery({
    queryKey: ['wishlist-count'],
    queryFn: () => wishlistService.getWishlistCount(),
    enabled: !!currentUser,
  });

  // Application Form State
  const [selectedJob, setSelectedJob] = useState<string>(OPEN_POSITIONS[0]?.id || 'job-1');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [candidateCvUrl, setCandidateCvUrl] = useState('');
  const [candidateCover, setCandidateCover] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!candidateName.trim() || !candidateEmail.trim() || !candidatePhone.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ họ tên, email và số điện thoại liên hệ.');
      return;
    }

    if (!candidateEmail.includes('@')) {
      setErrorMessage('Định dạng email không hợp lệ.');
      return;
    }

    // Persist application locally for demo/audit
    try {
      const stored = JSON.parse(localStorage.getItem('nexora_careers_applications') || '[]');
      stored.push({
        id: `APP-${Date.now()}`,
        jobId: selectedJob,
        name: candidateName,
        email: candidateEmail,
        phone: candidatePhone,
        cvUrl: candidateCvUrl,
        cover: candidateCover,
        submittedAt: new Date().toISOString(),
      });
      localStorage.setItem('nexora_careers_applications', JSON.stringify(stored));
    } catch {
      // Ignore local storage error
    }

    setIsSubmitted(true);
  };

  return (
    <div className="page-wrapper min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100">
      <StorefrontHeader
        categories={categories}
        cartCount={cart?.totalItems || 0}
        wishlistCount={wishlistCount}
        currentUser={currentUser}
        onLogout={() => {
          authService.logout();
          window.location.reload();
        }}
      />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
          <i className="fa-solid fa-chevron-right text-[10px]"></i>
          <span className="text-slate-800 dark:text-slate-200 font-semibold">Tuyển dụng nhân viên</span>
        </nav>

        {/* Hero Banner */}
        <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-3xl p-8 md:p-12 mb-10 shadow-xl">
          <div className="max-w-2xl">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-cyan-300 border border-cyan-400/30 mb-4">
              Cơ Hội Nghề Nghiệp Tại Nexora
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4">
              Cùng Nexora Chinh Phục <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Đỉnh Cao Công Nghệ
              </span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Môi trường làm việc trẻ trung, minh bạch và trao quyền. Nơi bạn được thỏa sức đam mê phần cứng, đóng góp vào trải nghiệm bán lẻ công nghệ hàng đầu và phát triển sự nghiệp bền vững.
            </p>
          </div>
        </section>

        {/* Open Positions & Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Job List (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <i className="fa-solid fa-briefcase text-blue-600"></i> Vị Trí Đang Mở Tuyển Dụng
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Chọn vị trí bạn quan tâm để ứng tuyển vào đội ngũ Nexora
            </p>

            {OPEN_POSITIONS.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job.id)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer ${
                  selectedJob === job.id
                    ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{job.title}</h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    {job.salary}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <span><i className="fa-solid fa-building text-slate-400 mr-1"></i>{job.department}</span>
                  <span><i className="fa-solid fa-location-dot text-slate-400 mr-1"></i>{job.location}</span>
                  <span><i className="fa-solid fa-clock text-slate-400 mr-1"></i>{job.type}</span>
                </div>

                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 list-disc pl-4">
                  {job.requirements.map((req, rIdx) => (
                    <li key={rIdx}>{req}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Application Form (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Nộp Hồ Sơ Ứng Tuyển
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Điền thông tin của bạn để phòng Nhân sự Nexora liên hệ phỏng vấn
              </p>

              {isSubmitted ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                    <i className="fa-solid fa-check"></i>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    Nộp Hồ Sơ Thành Công!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Cảm ơn bạn đã quan tâm đến cơ hội nghề nghiệp tại Nexora. Bộ phận nhân sự sẽ kiểm tra hồ sơ và liên hệ với bạn trong vòng 3 - 5 ngày làm việc.
                  </p>
                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setCandidateName('');
                      setCandidateEmail('');
                      setCandidatePhone('');
                      setCandidateCvUrl('');
                      setCandidateCover('');
                    }}
                    className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Ứng tuyển vị trí khác
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2">
                      <i className="fa-solid fa-circle-exclamation shrink-0"></i>
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Vị trí ứng tuyển
                    </label>
                    <select
                      value={selectedJob}
                      onChange={(e) => setSelectedJob(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      {OPEN_POSITIONS.map((pos) => (
                        <option key={pos.id} value={pos.id}>{pos.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        placeholder="email@example.com"
                        value={candidateEmail}
                        onChange={(e) => setCandidateEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Số điện thoại *
                      </label>
                      <input
                        type="tel"
                        placeholder="0912 345 678"
                        value={candidatePhone}
                        onChange={(e) => setCandidatePhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Đường dẫn CV / Portfolio
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/... hoặc linkedin.com/in/..."
                      value={candidateCvUrl}
                      onChange={(e) => setCandidateCvUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Giới thiệu bản thân & kinh nghiệm
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Chia sẻ ngắn về kinh nghiệm và niềm đam mê công nghệ của bạn..."
                      value={candidateCover}
                      onChange={(e) => setCandidateCover(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-paper-plane"></i>
                    <span>Gửi Hồ Sơ Ứng Tuyển</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
};
