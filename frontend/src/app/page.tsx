"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Hexagon,
  LogIn,
  UserPlus,
  Users,
  Wrench,
  Banknote,
} from "lucide-react";
import { LabRoom } from "../types/lab";
import { labService } from "../services/lab";

export default function HomePage() {
  const [labs, setLabs] = useState<LabRoom[]>([]);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy danh sách phòng từ Backend
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const data = await labService.getAllLabs();
        setLabs(data);
      } catch (error) {
        console.error("Lỗi tải dữ liệu phòng:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLabs();
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* 1. HEADER */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-black text-blue-600"
        >
          <Hexagon className="w-7 h-7 fill-blue-600" />
          BookLab247
        </Link>
        <nav className="hidden md:flex gap-8 text-sm font-bold text-gray-600">
          <Link href="/" className="text-gray-900">
            Trang chủ
          </Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">
            Danh sách phòng
          </Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">
            Thiết bị
          </Link>
        </nav>
        <div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-gray-50 hover:bg-gray-100 rounded-full transition-colors border border-gray-200">
            🇻🇳 Đà Nẵng
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16">
        {/* 2. HERO SECTION (Banner giới thiệu) */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-24">
          <div className="md:w-1/2 pr-8">
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-[1.1] mb-6 tracking-tight">
              Đừng lo thiếu chỗ, <br />
              <span className="text-blue-600">hãy đặt trước.</span>
            </h1>
            <p className="text-gray-500 text-lg mb-10 max-w-md leading-relaxed">
              Tối ưu hóa không gian nghiên cứu của bạn. Đặt phòng lab ngay hôm
              nay, mượn thiết bị nhanh chóng và nâng cao hiệu suất làm việc nhóm
              trong mỗi kỳ học của bạn.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/login"
                className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
              >
                <LogIn className="w-5 h-5" /> Đăng nhập
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-2 px-6 py-3.5 bg-white text-blue-600 font-bold rounded-xl border border-blue-200 hover:bg-blue-50 transition-all active:scale-95"
              >
                <UserPlus className="w-5 h-5" /> Đăng ký ngay
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 mt-12 md:mt-0 relative">
            <div className="absolute top-0 right-10 w-20 h-20 border-4 border-green-300 rounded-full opacity-50"></div>
            <div className="absolute bottom-10 left-0 w-12 h-12 bg-yellow-400 rounded-sm rotate-45 opacity-80 z-10"></div>
            <div className="absolute top-1/2 right-0 w-6 h-6 bg-blue-400 rounded-full opacity-80 z-10"></div>

            <div className="rounded-[2.5rem] overflow-hidden shadow-2xl relative z-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200"
                alt="Hero"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>

        {/* 3. DANH SÁCH PHÒNG LAB TỪ MONGODB */}
        <div>
          <h2 className="text-3xl font-black text-gray-900 mb-10 tracking-tight">
            Các hạng phòng Lab hiện có
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="font-medium">Đang tải danh sách phòng...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {labs.map((lab) => (
                <div
                  key={lab.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
                >
                  {/* Ảnh phòng */}
                  <div className="relative h-48 overflow-hidden bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={lab.imageUrl}
                      alt={lab.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>

                  {/* Thông tin phòng */}
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {lab.title}
                    </h3>

                    {/* Sức chứa */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 font-medium">
                      <Users className="w-4 h-4" />
                      <span>{lab.capacity}</span>
                    </div>

                    {/* Tags Thiết bị & Giá tiền (Căn xuống đáy thẻ) */}
                    <div className="flex flex-wrap gap-2 mt-auto pt-2">
                      {lab.priceText && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700">
                          {lab.priceText}
                        </span>
                      )}

                      {/* ĐÂY CHÍNH LÀ CHỖ HIỂN THỊ GIÁ TIỀN BẠN CẦN */}
                      {lab.price && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-100 shadow-sm">
                          <Banknote className="w-3.5 h-3.5 mr-1.5" />{" "}
                          {lab.price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {labs.length === 0 && (
                <div className="col-span-full text-center py-16 text-gray-400 font-medium bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  Chưa có phòng Lab nào trong hệ thống.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="border-t border-gray-100 mt-20 py-8 px-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 font-medium">
        <p>
          BookLab247 là nền tảng quản lý phòng thực hành và thiết bị hiện đại.
        </p>
        <p>© 2026 BookLab247.</p>
      </footer>
    </div>
  );
}
