"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Hexagon,
  LogIn,
  UserPlus,
  Zap,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Star,
  MapPin,
  Phone,
  Mail,
  ArrowRight
} from "lucide-react";

// Định nghĩa Type an toàn cho dữ liệu tĩnh
interface ServiceItem {
  icon: React.ElementType;
  title: string;
  desc: string;
}

interface ReviewItem {
  name: string;
  role: string;
  content: string;
}

export default function LandingPage() {
  const services: ServiceItem[] = [
    { icon: Zap, title: "Đặt phòng siêu tốc", desc: "Chỉ với 3 cú click chuột, không gian nghiên cứu lý tưởng đã sẵn sàng cho bạn." },
    { icon: Clock, title: "Quản lý Real-time", desc: "Kiểm tra tình trạng phòng và thiết bị theo thời gian thực, không lo trùng lịch." },
    { icon: ShieldCheck, title: "Mượn trả minh bạch", desc: "Quy trình số hóa 100%, theo dõi tình trạng thiết bị rõ ràng, an toàn tuyệt đối." },
  ];

  const reviews: ReviewItem[] = [
    { name: "Nguyễn Hoàng Anh", role: "Sinh viên năm 4 - CNTT", content: "Từ ngày có BookLab247, nhóm mình không còn cảnh phải lên sớm xí chỗ. Mọi thứ được số hóa cực kỳ chuyên nghiệp và tiện lợi!" },
    { name: "Trần Minh Tuấn", role: "Giảng viên khoa Điện tử", content: "Hệ thống giúp tôi quản lý thiết bị mượn trả của sinh viên dễ dàng hơn bao giờ hết. Rất đáng để sử dụng dài lâu." },
    { name: "Lê Ngọc Mai", role: "Sinh viên năm 2", content: "Giao diện thân thiện, dễ dùng. Đặc biệt tính năng xem trước cấu hình máy tính trong phòng lab rất hữu ích cho các môn thực hành nặng." },
  ];

  // Animation variants
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 selection:bg-blue-200">
      {/* 1. HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-black text-blue-600 tracking-tight">
            <Hexagon className="w-8 h-8 fill-blue-600" />
            BookLab247
          </Link>
          <nav className="hidden md:flex gap-8 text-sm font-bold text-gray-600">
            <Link href="/" className="text-blue-600">Trang chủ</Link>
            {/* Chuyển hướng sang trang danh sách phòng */}
            <Link href="/labs" className="hover:text-blue-600 transition-colors">Danh sách phòng</Link>
            <Link href="/devices" className="hover:text-blue-600 transition-colors">Thiết bị</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden md:flex items-center font-bold text-sm text-gray-600 hover:text-blue-600 transition-colors">
              Đăng nhập
            </Link>
            <Link href="/register" className="px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md hover:shadow-lg">
              Bắt đầu ngay
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* 2. HERO SECTION */}
        <section className="relative overflow-hidden pt-20 pb-28">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm mb-6 border border-blue-100">
                <Zap className="w-4 h-4" /> Nền tảng Quản lý Phòng Thực Hành Thế Hệ Mới
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.1] mb-8 tracking-tight">
                Chuyển Đổi Số Không Gian <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                  Nghiên Cứu Của Bạn
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-500 mb-10 leading-relaxed max-w-2xl mx-auto">
                Tối ưu hóa thời gian, loại bỏ thủ tục giấy tờ. BookLab247 mang đến giải pháp đặt phòng và mượn thiết bị thông minh, minh bạch và hoàn toàn tự động.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/labs" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all group">
                  Xem danh sách phòng <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="#features" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                  Tìm hiểu thêm
                </Link>
              </div>
            </motion.div>
          </div>
          
          {/* Background Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50 rounded-full blur-3xl -z-10 opacity-50"></div>
        </section>

        {/* 3. DỊCH VỤ NỔI BẬT */}
        <section id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div {...fadeIn} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Mọi thứ bạn cần cho một kỳ học hiệu quả</h2>
              <p className="text-gray-500 text-lg">Hệ sinh thái công cụ hỗ trợ tối đa việc học tập và giảng dạy.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {services.map((srv, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-shadow duration-300 group"
                >
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
                    <srv.icon className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{srv.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{srv.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. BEFORE / AFTER (Sự Khác Biệt) */}
        <section className="py-24 bg-slate-900 text-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div {...fadeIn} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black mb-4">Sự Khác Biệt Mang Tên BookLab247</h2>
              <p className="text-slate-400 text-lg">Thay đổi cách bạn tương tác với phòng thực hành.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Cũ */}
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl bg-red-900/20 border border-red-500/20"
              >
                <h3 className="text-2xl font-bold text-red-400 mb-6 flex items-center gap-2">
                  <XCircle className="w-6 h-6" /> Cách truyền thống
                </h3>
                <ul className="space-y-4">
                  {["Phải đến tận nơi đăng ký bằng giấy", "Không biết trước phòng còn máy trống hay không", "Mất thời gian tìm kiếm thiết bị cần thiết", "Quy trình kiểm kê thủ công, dễ thất thoát"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300">
                      <div className="mt-1 w-2 h-2 rounded-full bg-red-500/50 flex-shrink-0"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Mới */}
              <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl bg-blue-600 border border-blue-500 shadow-2xl shadow-blue-900/50 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                  <CheckCircle2 className="w-6 h-6" /> Cùng BookLab247
                </h3>
                <ul className="space-y-4 relative z-10">
                  {["Đặt phòng online 24/7 mọi lúc mọi nơi", "Sơ đồ phòng realtime, biết chính xác thiết bị khả dụng", "Nâng cao chất lượng tri thức","Dữ liệu được lưu trữ đám mây, an toàn tuyệt đối"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-blue-50 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-blue-300 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 5. REVIEW TỪ NGƯỜI DÙNG */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div {...fadeIn} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Được tin dùng bởi hàng ngàn Sinh viên & Giảng viên</h2>
              <p className="text-gray-500 text-lg">Trải nghiệm thực tế từ cộng đồng người dùng BookLab247.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((rev, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
                >
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic mb-6 leading-relaxed">&quot;{rev.content}&quot;</p>
                  <div>
                    <h4 className="font-bold text-gray-900">{rev.name}</h4>
                    <p className="text-sm text-gray-500 font-medium">{rev.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* 6. FOOTER CHI TIẾT */}
      <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 text-2xl font-black text-blue-600 tracking-tight mb-6">
                <Hexagon className="w-8 h-8 fill-blue-600" />
                BookLab247
              </Link>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Nền tảng quản lý không gian thực hành và thiết bị thông minh, mang lại sự tiện lợi tối đa cho các trường đại học và cơ sở giáo dục.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-6">Liên kết nhanh</h4>
              <ul className="space-y-4 text-sm text-gray-500 font-medium">
                <li><Link href="/" className="hover:text-blue-600 transition-colors">Về chúng tôi</Link></li>
                <li><Link href="/labs" className="hover:text-blue-600 transition-colors">Danh sách phòng Lab</Link></li>
                <li><Link href="/devices" className="hover:text-blue-600 transition-colors">Tra cứu thiết bị</Link></li>
                <li><Link href="/guide" className="hover:text-blue-600 transition-colors">Hướng dẫn sử dụng</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-6">Chính sách</h4>
              <ul className="space-y-4 text-sm text-gray-500 font-medium">
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Điều khoản dịch vụ</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Bảo mật thông tin</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Quy định mượn trả</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-6">Liên hệ hỗ trợ</h4>
              <ul className="space-y-4 text-sm text-gray-500 font-medium">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span>1 Điện Biên Phủ, Thanh Khê, Đà Nẵng, Việt Nam</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span>+84 336 098 053</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span>quynv167@gmail.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-medium text-gray-400">
            <p>© {new Date().getFullYear()} BookLab247. Đã đăng ký bản quyền.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-gray-600 transition-colors">Facebook</Link>
              <Link href="#" className="hover:text-gray-600 transition-colors">Zalo</Link>
              <Link href="#" className="hover:text-gray-600 transition-colors">LinkedIn</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}