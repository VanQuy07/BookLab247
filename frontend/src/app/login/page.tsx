"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Hexagon, Eye, EyeOff } from "lucide-react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

// CLIENT ID CỦA BẠN (BookLab247)
const GOOGLE_CLIENT_ID =
  "947182326669-3o46fnv8uvojktjkmu54o7tngh96hnss.apps.googleusercontent.com";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  // 1. Luồng đăng nhập bằng Email/Pass thông thường
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Đăng nhập thất bại");
      }

      localStorage.setItem("access_token", data.access_token);

      if (data.role === "ADMIN") {
        router.push("/admin");
      } else if (data.role === "MANAGER") {
        router.push("/manager");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Email hoặc mật khẩu không chính xác!");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Luồng xử lý khi Đăng nhập bằng Google thành công
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/auth/google-login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: credentialResponse.credential }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Đăng nhập Google thất bại!");
      }

      localStorage.setItem("access_token", data.access_token);

      // Chuyển hướng thông minh dựa vào quyền
      if (data.role === "ADMIN") {
        router.push("/admin");
      } else if (data.role === "MANAGER") {
        router.push("/manager");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Đăng nhập bằng Google thất bại!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
        <div className="max-w-[1000px] w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
          {/* Cột trái: Form Đăng nhập */}
          <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative">
            <div className="mb-10">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-2xl font-black text-blue-600 mb-2"
              >
                <Hexagon className="w-8 h-8 fill-blue-600 text-blue-600" />
                BookLab247
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-6 tracking-tight">
                Chào mừng trở lại!
              </h1>
              <p className="text-gray-500 mt-2">
                Vui lòng đăng nhập để sử dụng hệ thống.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50/80 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                <div className="w-1.5 h-full bg-red-500 rounded-full"></div>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Email / Tên đăng nhập
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
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none"
                    placeholder="admin@booklab247.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-700">
                    Mật khẩu
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center pt-2">
                <input
                  id="remember"
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 text-sm font-medium text-gray-600 cursor-pointer"
                >
                  Ghi nhớ đăng nhập
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 px-4 mt-2 flex items-center justify-center gap-2 rounded-xl text-white font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]
                  ${isLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/30"}`}
              >
                {isLoading ? "Đang xác thực..." : "Đăng nhập hệ thống"}
                {!isLoading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>

            {/* KHU VỰC ĐĂNG NHẬP GOOGLE */}
            <div className="mt-8 flex items-center gap-4">
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-sm font-medium text-gray-400 whitespace-nowrap">
                Hoặc đăng nhập bằng
              </span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>

            <div className="mt-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() =>
                  setError("Đăng nhập bằng Google bị hủy hoặc có lỗi xảy ra.")
                }
                theme="outline"
                shape="rectangular"
                width="100%"
              />
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 font-medium">
                Bạn chưa có tài khoản?{" "}
                <Link
                  href="/register"
                  className="text-blue-600 font-bold hover:underline hover:text-blue-700 transition-colors"
                >
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>

          {/* Cột phải: Banner Hình ảnh */}
          <div className="hidden md:block w-1/2 bg-blue-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-blue-900/90 mix-blend-multiply z-10"></div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200"
              alt="Laboratory background"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 z-20 flex flex-col justify-center p-12 text-white">
              <h2 className="text-4xl font-bold leading-tight mb-6">
                Nâng cao hiệu suất <br />
                <span className="text-blue-200">Quản lý thực hành.</span>
              </h2>
              <p className="text-blue-100 text-lg leading-relaxed max-w-md">
                Hệ thống BookLab247 giúp bạn theo dõi thiết bị, sắp xếp lịch học
                và tối ưu hóa không gian phòng Lab chỉ với vài cú click chuột.
              </p>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
