"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Hexagon,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react"; // Đã thêm Eye, EyeOff

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // States quản lý ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getApiBaseUrl = () =>
    typeof window !== "undefined" && window.location.hostname === "localhost"
      ? "http://localhost:8000/api/v1"
      : "https://booklab247.onrender.com/api/v1";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp!");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        full_name: fullName,
        email: email,
        password: password,
      };

      const response = await fetch(
        "https://booklab247.onrender.com/api/v1/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Đăng ký thất bại!");
      }

      setSuccessMsg("Đăng ký thành công! Đang chuyển hướng...");
      localStorage.setItem("api_base_url", getApiBaseUrl());

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Có lỗi kết nối đến máy chủ!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="max-w-[1000px] w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row-reverse">
        {/* Cột phải: Form Đăng ký */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-2xl font-black text-blue-600 mb-2"
            >
              <Hexagon className="w-8 h-8 fill-blue-600 text-blue-600" />
              BookLab247
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-4 tracking-tight">
              Tạo tài khoản mới
            </h1>
            <p className="text-gray-500 mt-2">
              Bắt đầu hành trình quản lý và đặt phòng Lab hiệu quả.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2">
              <div className="w-1.5 h-full bg-red-500 rounded-full"></div>
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 text-sm rounded-xl border border-green-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Họ và tên
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none"
                  placeholder="Ví dụ: Lê Trung Kiên"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none"
                  placeholder="sinhvien@duytan.edu.vn"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Xác nhận MK
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start pt-2">
              <input
                id="terms"
                type="checkbox"
                required
                className="w-4 h-4 mt-1 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label
                htmlFor="terms"
                className="ml-2 text-sm font-medium text-gray-600"
              >
                Tôi đồng ý với{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Điều khoản dịch vụ
                </a>{" "}
                và{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Chính sách bảo mật
                </a>
                .
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || successMsg !== ""}
              className={`w-full py-3.5 px-4 mt-4 flex items-center justify-center gap-2 rounded-xl text-white font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]
                ${isLoading || successMsg !== "" ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/30"}`}
            >
              {isLoading ? "Đang tạo tài khoản..." : "Đăng ký tài khoản"}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 font-medium">
              Bạn đã có tài khoản?{" "}
              <Link
                href="/login"
                className="text-blue-600 font-bold hover:underline hover:text-blue-700 transition-colors"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>

        {/* Banner: Đã đổi ảnh thành phòng họp hiện đại */}
        <div className="hidden md:block w-1/2 bg-blue-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/95 to-blue-700/80 mix-blend-multiply z-10"></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200"
            alt="Modern meeting room"
            className="absolute inset-0 w-full h-full object-cover grayscale-[20%]"
          />
          <div className="absolute inset-0 z-20 flex flex-col justify-center p-12 text-white">
            <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-semibold border border-white/20 mb-6 w-fit">
              Hệ thống quản lý thông minh
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-4">
              Kết nối sinh viên & <br />
              Thiết bị thực hành.
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed max-w-md">
              Mọi công cụ, mọi phòng Lab đều được số hóa. Tham gia ngay để trải
              nghiệm quy trình mượn trả thiết bị hoàn toàn tự động.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
