"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  LogOut,
  ChevronDown,
  Camera,
  Trash2,
  Mail,
  Phone,
  ShieldCheck,
  Key,
  Save,
  Building,
  GraduationCap,
  Hexagon,
  AlertTriangle,
  X
} from "lucide-react";
import Link from "next/link";

// ================= TYPES =================
interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  studentId: string;
  department: string;
  avatar: string | null;
}

type TabType = "info" | "security";

export default function UserProfilePage() {
  const router = useRouter();

  // ================= STATES HEADER =================
  const [userName, setUserName] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // ================= STATES PROFILE =================
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Dữ liệu hồ sơ gốc (Mô phỏng lấy từ DB)
  const [profile, setProfile] = useState<UserProfile>({
    fullName: "Nguyễn Văn A",
    email: "nguyenvana@gmail.com",
    phone: "0901234567",
    studentId: "SV20220101",
    department: "Công nghệ thông tin",
    avatar: null,
  });

  // Dữ liệu đang chỉnh sửa (Draft)
  const [editForm, setEditForm] = useState<UserProfile>(profile);

  // Lấy tên lên Header
  useEffect(() => {
    const storedName = localStorage.getItem("user_name");
    if (storedName) {
      setUserName(storedName);
      // Giả lập load data vào form nếu cần
      setProfile((prev) => ({ ...prev, fullName: storedName }));
      setEditForm((prev) => ({ ...prev, fullName: storedName }));
    }
  }, []);

  // ================= CÁC HÀM XỬ LÝ =================
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_name");
    router.push("/");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Nút SỬA / HỦY BỎ
  const toggleEdit = () => {
    if (isEditing) {
      // Hủy chỉnh sửa -> Khôi phục dữ liệu gốc
      setEditForm(profile);
    }
    setIsEditing(!isEditing);
  };

  // Nút LƯU (THÊM / CẬP NHẬT)
  const handleSaveProfile = async () => {
    setIsLoading(true);
    // Giả lập gọi API lưu dữ liệu mất 1s
    setTimeout(() => {
      setProfile(editForm); // Cập nhật dữ liệu gốc bằng form mới
      localStorage.setItem("user_name", editForm.fullName); // Update localStorage
      setUserName(editForm.fullName); // Update Header
      setIsEditing(false);
      setIsLoading(false);
      alert("Cập nhật thông tin thành công!");
    }, 1000);
  };

  // Nút XÓA (Xóa Avatar hoặc làm rỗng các field không bắt buộc)
  const handleDeleteAvatar = () => {
    if (window.confirm("Bạn có chắc muốn xóa ảnh đại diện?")) {
      setEditForm((prev) => ({ ...prev, avatar: null }));
      setProfile((prev) => ({ ...prev, avatar: null }));
    }
  };

  const handleDeletePhone = () => {
    setEditForm((prev) => ({ ...prev, phone: "" }));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 selection:bg-blue-200 pb-12">
      {/* ================= HEADER (NAVBAR DÙNG CHUNG) ================= */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-black text-blue-600 tracking-tight">
            <Hexagon className="w-8 h-8 fill-blue-600" />
            BookLab247
          </Link>
          <nav className="hidden md:flex gap-8 text-sm font-bold text-gray-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
            <Link href="/dashboard/user/labs" className="hover:text-blue-600 transition-colors">Danh sách phòng</Link>
            <Link href="/dashboard/user/device" className="hover:text-blue-600 transition-colors">Thiết bị</Link>
          </nav>

          <div className="flex items-center gap-4 relative z-50">
            {userName ? (
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-semibold rounded-full hover:bg-blue-100 transition-colors outline-none"
                >
                  <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  {userName}
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50">
                    <div className="p-2">
                      <Link href="/dashboard/user/profile" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl transition-colors">
                        <User className="w-4 h-4" /> Hồ sơ cá nhân
                      </Link>
                      <div className="h-px bg-gray-100 my-1"></div>
                      <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                        <LogOut className="w-4 h-4" /> Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md">Đăng nhập</Link>
            )}
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT HỒ SƠ ================= */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">Quản lý Tài khoản</h1>
          <p className="text-gray-500 mt-1">Xem, cập nhật và bảo vệ thông tin cá nhân của bạn.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* ================= CỘT TRÁI (TAB MENU) ================= */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm sticky top-28">
              <button 
                onClick={() => setActiveTab("info")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === "info" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <User className="w-5 h-5" /> Thông tin chung
              </button>
              <button 
                onClick={() => setActiveTab("security")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === "security" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <ShieldCheck className="w-5 h-5" /> Bảo mật & Mật khẩu
              </button>
            </div>
          </div>

          {/* ================= CỘT PHẢI (NỘI DUNG FORM) ================= */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            
            <AnimatePresence mode="wait">
              {activeTab === "info" && (
                <motion.div 
                  key="info"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 md:p-8"
                >
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Hồ sơ của bạn</h2>
                    <button 
                      onClick={toggleEdit}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${isEditing ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
                    >
                      {isEditing ? "Hủy chỉnh sửa" : "Sửa hồ sơ"}
                    </button>
                  </div>

                  {/* KHU VỰC AVATAR */}
                  <div className="flex items-center gap-6 mb-10">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-blue-100 border-4 border-white shadow-lg flex items-center justify-center text-3xl font-black text-blue-600 overflow-hidden">
                        {editForm.avatar ? (
                          <img src={editForm.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          editForm.fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      
                      {/* Nút upload/xóa avatar chỉ hiện khi đang chế độ edit */}
                      {isEditing && (
                        <div className="absolute -bottom-2 -right-2 flex gap-1">
                          <label className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center cursor-pointer shadow-md hover:bg-blue-700 hover:scale-105 transition-transform">
                            <Camera className="w-4 h-4" />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                              // Giả lập upload ảnh
                              if (e.target.files && e.target.files[0]) {
                                const url = URL.createObjectURL(e.target.files[0]);
                                setEditForm(prev => ({...prev, avatar: url}));
                              }
                            }}/>
                          </label>
                          {editForm.avatar && (
                            <button onClick={handleDeleteAvatar} className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shadow-md hover:bg-red-200 hover:scale-105 transition-transform">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{profile.fullName}</h3>
                      <p className="text-gray-500 font-medium">{profile.department}</p>
                    </div>
                  </div>

                  {/* FORM ĐIỀN THÔNG TIN */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Họ và tên */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Họ và tên</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="text" 
                          name="fullName"
                          value={editForm.fullName} 
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Email (Không thể sửa)</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="email" 
                          value={profile.email} 
                          disabled 
                          className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-xl outline-none text-gray-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Số điện thoại */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-gray-700">Số điện thoại</label>
                        {isEditing && editForm.phone && (
                          <button onClick={handleDeletePhone} className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
                            <X className="w-3 h-3"/> Xóa số
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="tel" 
                          name="phone"
                          value={editForm.phone} 
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Chưa cập nhật số điện thoại"
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Mã Sinh viên / Giảng viên */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Mã Sinh viên / Giảng viên</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="text" 
                          name="studentId"
                          value={editForm.studentId} 
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Khoa / Phòng ban */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-bold text-gray-700">Khoa / Đơn vị</label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="text" 
                          name="department"
                          value={editForm.department} 
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* NÚT LƯU HIỂN THỊ KHI ĐANG EDIT */}
                  {isEditing && (
                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                      <button 
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-600/30 disabled:opacity-70"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Save className="w-5 h-5" /> Cập nhật thông tin
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* VÙNG NGUY HIỂM (Xóa tài khoản) */}
                  {!isEditing && (
                    <div className="mt-12 p-6 bg-red-50 border border-red-100 rounded-2xl">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-xl shrink-0">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-red-900">Vùng nguy hiểm</h3>
                          <p className="text-sm text-red-700 mt-1 mb-4 leading-relaxed">
                            Việc xóa tài khoản sẽ xóa toàn bộ dữ liệu đặt phòng và lịch sử mượn thiết bị của bạn. Hành động này không thể hoàn tác.
                          </p>
                          <button className="px-5 py-2 bg-white text-red-600 font-bold text-sm border border-red-200 rounded-xl hover:bg-red-600 hover:text-white transition-colors">
                            Yêu cầu xóa tài khoản
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* TAB BẢO MẬT */}
              {activeTab === "security" && (
                <motion.div 
                  key="security"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 md:p-8"
                >
                  <div className="mb-8 pb-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Đổi Mật khẩu</h2>
                    <p className="text-gray-500 text-sm mt-1">Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác.</p>
                  </div>

                  <div className="max-w-md space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Mật khẩu hiện tại</label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Mật khẩu mới</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="password" placeholder="Mật khẩu mới" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Nhập lại mật khẩu mới</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="password" placeholder="Xác nhận mật khẩu" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all" />
                      </div>
                    </div>

                    <button className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-md">
                      Cập nhật Mật khẩu
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );
}