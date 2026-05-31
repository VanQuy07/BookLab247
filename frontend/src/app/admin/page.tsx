"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Layers,
  Cpu,
  Users,
  Wrench,
  LogOut,
  Banknote,
} from "lucide-react";

import { LabRoom } from "../../types/lab";
import { labService } from "../../services/lab";

export default function AdminDashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"labs" | "devices">("labs");
  const [labs, setLabs] = useState<LabRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  // State chứa đầy đủ các trường (có cả price)
  const [newLab, setNewLab] = useState<Omit<LabRoom, "id">>({
    title: "",
    capacity: "",
    priceText: "",
    price: "",
    imageUrl: "",
  });

  // KIỂM TRA ĐĂNG NHẬP
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login"); // Chưa đăng nhập thì đuổi về trang Login
    } else {
      loadLabs();
    }
  }, [router]);

  const loadLabs = async () => {
    try {
      setLoading(true);
      const data = await labService.getAllLabs();
      setLabs(data);
    } catch (error) {
      console.error(error);
      alert("Không thể kết nối đến máy chủ!");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewLab((prev) => ({ ...prev, [name]: value }));
  };

  // HÀM TẢI ẢNH TỪ MÁY TÍNH
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadingImage(true);
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/labs/upload-image",
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) throw new Error("Lỗi upload");

      const data = await response.json();
      setNewLab((prev) => ({ ...prev, imageUrl: data.imageUrl }));
    } catch (error) {
      console.error(error);
      alert("Không thể tải ảnh lên!");
    } finally {
      setUploadingImage(false);
    }
  };

  // HÀM LƯU PHÒNG LAB
  const handleAddLab = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !newLab.title ||
      !newLab.capacity ||
      !newLab.price ||
      !newLab.imageUrl
    ) {
      alert("Vui lòng điền các thông tin bắt buộc (có dấu *)");
      return;
    }
    try {
      const createdLab = await labService.createLab(newLab);
      setLabs((prev) => [...prev, createdLab]);
      setNewLab({
        title: "",
        capacity: "",
        priceText: "",
        price: "",
        imageUrl: "",
      });
      alert("Đã lưu thành công vào cơ sở dữ liệu MongoDB!");
    } catch (error) {
      console.error(error);
      alert("Thêm phòng thất bại!");
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

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10 text-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            BẢNG QUẢN TRỊ ADMIN
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm bg-red-50 text-red-600 px-4 py-2.5 rounded-xl font-bold hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>

        {/* MENU TABS */}
        <div className="flex gap-4 border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab("labs")}
            className={`flex items-center gap-2 pb-4 font-semibold border-b-2 px-2 transition-colors ${
              activeTab === "labs"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Layers className="w-5 h-5" /> Quản lý Phòng Lab
          </button>
          <button
            onClick={() => setActiveTab("devices")}
            className={`flex items-center gap-2 pb-4 font-semibold border-b-2 px-2 transition-colors ${
              activeTab === "devices"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Cpu className="w-5 h-5" /> Quản lý Thiết bị
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500 font-medium flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
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
                {/* CỘT TRÁI: FORM THÊM PHÒNG */}
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
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
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
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                        placeholder="VD: 40 Sinh viên"
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
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                        placeholder="VD: Màn chiếu, Đèn LED"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Giá tiền *
                      </label>
                      <input
                        type="text"
                        name="price"
                        value={newLab.price}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                        placeholder="VD: 400.000đ/giờ"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Hình ảnh phòng Lab *
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                      {uploadingImage && (
                        <p className="text-xs text-blue-500 mt-2 font-medium animate-pulse">
                          Đang tải ảnh lên server...
                        </p>
                      )}
                      {newLab.imageUrl && !uploadingImage && (
                        <div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden border border-gray-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={newLab.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm mt-2 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
                    >
                      Lưu Trực Tiếp Vào MongoDB
                    </button>
                  </form>
                </div>

                {/* CỘT PHẢI: DANH SÁCH PHÒNG */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold mb-6 text-gray-900">
                    Danh Sách Phòng Đang Lưu Database
                  </h2>
                  <div className="space-y-4">
                    {labs.map((lab) => (
                      <div
                        key={lab.id}
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-xl gap-4 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={lab.imageUrl}
                              alt={lab.title}
                              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-base">
                              {lab.title}
                            </h3>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500 mt-2">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" /> {lab.capacity}
                              </span>
                              {lab.priceText && (
                                <span className="flex items-center gap-1">
                                  <Wrench className="w-3.5 h-3.5" />{" "}
                                  {lab.priceText}
                                </span>
                              )}
                              {lab.price && (
                                <span className="flex items-center gap-1 font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                  <Banknote className="w-3.5 h-3.5" />{" "}
                                  {lab.price}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteLab(lab.id)}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    {labs.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                        <Layers className="w-12 h-12 mb-3 text-gray-200" />
                        <p className="text-sm font-medium">
                          Chưa có phòng nào trong cơ sở dữ liệu.
                        </p>
                      </div>
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
