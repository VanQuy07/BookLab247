'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, Beaker, Users, ShieldAlert } from 'lucide-react';

// Sửa đường dẫn thành tương đối sang thư mục kế bên
import { LabRoom } from '../types/lab';
import { labService } from '../services/lab';

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Danh sách phòng', href: '/labs' },
  { label: 'Thiết bị', href: '/devices' },
];

export default function HomePage() {
  const [dynamicLabs, setDynamicLabs] = useState<LabRoom[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLabsFromServer = async () => {
      try {
        setIsLoading(true);
        const data = await labService.getAllLabs();
        setDynamicLabs(data);
      } catch (error) {
        console.error("Không thể tải danh sách phòng từ MongoDB:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLabsFromServer();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/30 font-sans text-gray-900">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Beaker className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-black tracking-tight text-blue-900">BookLab247</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 font-medium text-gray-600">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="hover:text-blue-600 transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin" className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-amber-100 transition-colors">
              <ShieldAlert className="w-3.5 h-3.5" /> Quản trị Admin
            </Link>
            <span className="text-sm font-medium flex items-center gap-2 border px-3 py-1.5 rounded-full bg-gray-50">
              🇻🇳 Đà Nẵng
            </span>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* CỘT TRÁI: TEXT VÀ NÚT (Thêm relative và z-10 để luôn nổi lên trên ảnh) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl relative z-10" 
          >
            <h1 className="text-5xl md:text-6xl font-black leading-[1.1] text-gray-900 mb-6">
              Đừng lo thiếu chỗ,<br />
              <span className="text-blue-600">hãy đặt trước.</span>
            </h1>
            <p className="text-lg text-gray-600 mb-10 leading-relaxed">
              Tối ưu hóa không gian nghiên cứu của bạn. Đặt phòng lab ngay hôm nay, mượn thiết bị nhanh chóng và nâng cao hiệu suất làm việc nhóm trong mỗi kỳ học của bạn.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/login" className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-8 py-3.5 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg">
                <LogIn className="w-5 h-5" /> Đăng nhập
              </Link>
              <Link href="/register" className="flex items-center gap-2 bg-white border-2 border-blue-100 hover:border-blue-200 text-blue-700 px-8 py-3.5 rounded-lg font-semibold transition-all">
                <UserPlus className="w-5 h-5" /> Đăng ký ngay
              </Link>
            </div>
          </motion.div>

          {/* CỘT PHẢI: HÌNH ẢNH (Thêm z-0 để ảnh nằm dưới cùng) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative h-[350px] md:h-[400px] lg:h-[500px] w-full flex justify-center items-center z-0"
          >
            {/* Các icon trang trí bay lơ lửng */}
            <div className="absolute top-10 right-10 md:right-20 w-8 h-8 rounded-full border-4 border-green-300 animate-pulse z-20"></div>
            <div className="absolute bottom-10 left-5 md:bottom-20 md:left-10 w-6 h-6 rotate-45 border-4 border-yellow-400 z-20"></div>
            <div className="absolute top-1/2 right-5 md:right-10 w-4 h-4 rounded-full bg-blue-400 z-20"></div>
            
            {/* Vùng bọc ảnh bắt buộc phải có "relative w-full h-full" để ép khung ảnh */}
            <div className="relative w-full h-full sm:w-[90%] sm:h-[90%] md:w-[80%] md:h-[80%]">
              <Image 
                src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=1000" 
                alt="Phòng Lab" 
                fill 
                className="object-cover rounded-3xl shadow-2xl" 
                priority 
              />
            </div>
          </motion.div>

        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl font-bold text-gray-900 mb-10 tracking-tight">
            Các hạng phòng Lab hiện có
          </motion.h2>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dynamicLabs.map((room, index) => (
                  <motion.div key={room.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.05 }} className="group border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 bg-white">
                    <div className="relative h-48 w-full overflow-hidden bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={room.imageUrl} alt={room.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-base text-gray-900 mb-2 line-clamp-2 h-12 group-hover:text-blue-600 transition-colors">
                        {room.title}
                      </h3>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-gray-400" /> {room.capacity}
                        </p>
                        <p className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md inline-block mt-2">
                          {room.priceText || 'Cấu hình tiêu chuẩn'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {dynamicLabs.length === 0 && (
                <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl mt-6">
                  <p className="text-gray-400 text-sm">Hiện tại chưa có phòng ban nào được cập nhật hiển thị.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="border-t border-gray-100 pt-8 text-xs text-gray-500 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>BookLab247 là nền tảng quản lý phòng thực hành và thiết bị hiện đại.</p>
            <p className="font-semibold text-gray-700">© 2026 BookLab247.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}