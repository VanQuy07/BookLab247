"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Layers, Cpu, Users, Wrench } from "lucide-react";

// Sửa đường dẫn thành tương đối như bình thường
import { LabRoom } from "../../../types/lab";
import { labService } from "../../../services/lab";

export default function AdminDashboard() {
  // ==========================================
  // 1. STATE CHO PHẦN ĐĂNG NHẬP
  // ==========================================
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // ==========================================
  // 2. STATE CHO PHẦN DASHBOARD
  // ==========================================
  const [activeTab, setActiveTab] = useState<"labs" | "devices">("labs");
  const [labs, setLabs] = useState<LabRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [newLab, setNewLab] = useState<Omit<LabRoom, "id">>({
    title: "",
    capacity: "",
    priceText: "",
    imageUrl: "",
  });

  // ==========================================
  // 3. KIỂM TRA ĐĂNG NHẬP KHI VÀO TRANG
  // ==========================================
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsAuthenticated(false); // Chưa có token -> Hiện form Login
    } else {
      setIsAuthenticated(true); // Có token -> Hiện Dashboard
      loadLabs(); // Lấy dữ liệu ngay
    }
  }, []);

  // ==========================================
  // 4. HÀM XỬ LÝ LOGIC
  // ==========================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoginLoading(true);

    try {
      // TODO: Ở Sprint sau, chỗ này sẽ là gọi API thật (axios.post)
      // Tạm thời giả lập delay 1 giây và tự động cho qua
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (email && password) {
        localStorage.setItem("access_token", "fake_token_123"); // Lưu token giả
        setIsAuthenticated(true); // Tráo đổi giao diện sang Dashboard
        loadLabs(); // Bắt đầu tải dữ liệu phòng
      }
    } catch (err) {
      setLoginError("Lỗi đăng nhập!");
    } finally {
      setIsLoginLoading(false);
    }
  };

  const loadLabs = async () => {
    try {
      setLoading(true);
      const data = await labService.getAllLabs();
      setLabs(data);
    } catch (error) {
      console.error(error);
      alert("Không thể kết nối đến máy chủ hoặc cơ sở dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewLab((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddLab = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newLab.title || !newLab.capacity || !newLab.imageUrl) {
      alert("Vui lòng điền thông tin bắt buộc!");
      return;
    }
    try {
      const createdLab = await labService.createLab(newLab);
      setLabs((prev) => [...prev, createdLab]);
      setNewLab({ title: "", capacity: "", priceText: "", imageUrl: "" });
      alert("Đã lưu thành công vào cơ sở dữ liệu MongoDB!");
    } catch (error) {
      console.error(error);
      alert("Thêm phòng thất bại, vui lòng kiểm tra lại cấu hình kết nối DB!");
    }
  };

  const handleDeleteLab = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phòng này khỏi hệ thống?")) return;
    try {
      await labService.deleteLab(id);
      setLabs((prev) => prev.filter((lab) => lab.id !== id));
    } catch (error) {
      console.error(error);
      alert("Không thể xóa dữ liệu!");
    }
  };

  // ==========================================
  // 5. RENDER GIAO DIỆN CÓ ĐIỀU KIỆN
  // ==========================================

  // Trạng thái chờ load ban đầu (tránh màn hình giật chớp)
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        Đang kiểm tra bảo mật...
      </div>
    );
  }

  // NẾU CHƯA ĐĂNG NHẬP: HIỆN FORM LOGIN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Quản Trị Viên
            </h2>
            <p className="text-gray-500">Đăng nhập để vào hệ thống Admin</p>
          </div>
          {loginError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {loginError}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="admin@booklab247.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isLoginLoading}
              className={`w-full py-3 px-4 flex justify-center rounded-lg text-white text-sm font-semibold shadow-md transition-all 
                ${isLoginLoading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {isLoginLoading ? "Đang xác thực..." : "Đăng Nhập"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // NẾU ĐÃ ĐĂNG NHẬP: HIỆN GIAO DIỆN ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 text-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            BẢNG QUẢN TRỊ ADMIN
          </h1>
          <button
            onClick={() => {
              localStorage.removeItem("access_token");
              setIsAuthenticated(false);
            }}
            className="text-sm bg-red-100 text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 transition-colors"
          >
            Đăng xuất
          </button>
        </div>

        <div className="flex gap-4 border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab("labs")}
            className={`flex items-center gap-2 pb-4 font-semibold border-b-2 px-2 ${
              activeTab === "labs"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500"
            }`}
          >
            <Layers className="w-5 h-5" /> Quản lý Phòng Lab
          </button>
          <button
            onClick={() => setActiveTab("devices")}
            className="flex items-center gap-2 pb-4 font-semibold text-gray-500 px-2"
          >
            <Cpu className="w-5 h-5" /> Quản lý Thiết bị
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500 font-medium">
            Đang tải dữ liệu từ MongoDB...
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "labs" && (
              <motion.div
                key="labs-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Form Thêm */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-900">
                    <Plus className="w-5 h-5 text-blue-600" /> Thêm Phòng Mới
                  </h2>
                  <form onSubmit={handleAddLab} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Tên phòng Lab *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={newLab.title}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Sức chứa *
                      </label>
                      <input
                        type="text"
                        name="capacity"
                        value={newLab.capacity}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Cấu hình / Thiết bị
                      </label>
                      <input
                        type="text"
                        name="priceText"
                        value={newLab.priceText}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Đường dẫn ảnh (URL) *
                      </label>
                      <input
                        type="text"
                        name="imageUrl"
                        value={newLab.imageUrl}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-sm mt-2"
                    >
                      Lưu Trực Tiếp Vào MongoDB
                    </button>
                  </form>
                </div>

                {/* Danh Sách */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold mb-6 text-gray-900">
                    Danh Sách Phòng Đang Lưu Database
                  </h2>
                  <div className="space-y-4">
                    {labs.map((lab) => (
                      <div
                        key={lab.id}
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-xl gap-4 hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={lab.imageUrl}
                              alt={lab.title}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-base">
                              {lab.title}
                            </h3>
                            <div className="flex gap-x-4 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" /> {lab.capacity}
                              </span>
                              <span className="flex items-center gap-1">
                                <Wrench className="w-3.5 h-3.5" />{" "}
                                {lab.priceText}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteLab(lab.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    {labs.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-10">
                        Chưa có phòng nào trong CSDL.
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
