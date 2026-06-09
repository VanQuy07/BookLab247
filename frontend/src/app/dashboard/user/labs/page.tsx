"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
Search,
  SlidersHorizontal,
  LayoutGrid,
  List as ListIcon,
  X,
  MapPin,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
  Star,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Hexagon, 
  Clock,  
  Package, 
  Cpu,
  Monitor,
  Banknote,
  User,
  LogOut,
} from "lucide-react";
import Link from "next/link";

// ================= TYPES =================
interface LabItem {
  id: string;
  name: string;
  building: string;
  floor: string;
  capacity: number;
  pricePerHour: number;
  maintenanceMode: boolean;
  isBooked: boolean; // Trạng thái đã đặt
  image: string;
  rating: number;
}

// ================= COMPONENT =================
export default function UserLabsPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [labs, setLabs] = useState<LabItem[]>([]);

  useEffect(() => {
    const storedName = localStorage.getItem("user_name");
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_name");
    router.push("/");
  };
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    time: true,
    capacity: true,
  });

  // GỌI API LẤY DỮ LIỆU PHÒNG LAB TỪ ADMIN
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        setLoading(true);
        //const response = await fetch("http://localhost:8000/api/v1/labs");
         const response = await fetch("https://booklab247.onrender.com/api/v1/labs");
        
        if (!response.ok) throw new Error("Không thể kết nối với máy chủ");
        
        const data = await response.json();

        // Map dữ liệu chuẩn cho Phòng Lab
        const formattedLabs: LabItem[] = data.map((item: any) => ({
          id: item.id || item._id,
          name: item.name,
          building: item.building || "Chưa gán",
          floor: item.floor || "Chưa gán",
          capacity: item.capacity || 0,
          pricePerHour: item.pricePerHour || item.price || 0, 
          maintenanceMode: item.maintenanceMode || false, 
          isBooked: item.isBooked || false, // Lấy trạng thái Đã đặt từ Backend
          image: item.imageUrl || "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=800",
          rating: 5.0,
        }));

        setLabs(formattedLabs);
      } catch (error) {
        console.error("Lỗi khi tải danh sách phòng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLabs();
  }, []);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 selection:bg-blue-200">
      
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-black text-blue-600 tracking-tight">
            <Hexagon className="w-8 h-8 fill-blue-600" /> BookLab247
          </Link>
          <nav className="hidden md:flex gap-8 text-sm font-bold text-gray-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">Trang chủ</Link>
            <Link href="/dashboard/user/labs" className="text-blue-600">Danh sách phòng</Link>
            <Link href="/dashboard/user/device" className="hover:text-blue-600 transition-colors">Thiết bị</Link>
          </nav>
          {/* CỤC HIỂN THỊ TÊN VÀ AVATAR GÓC PHẢI */}
          <div className="flex items-center gap-4 relative z-50">
            {userName ? (
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-semibold rounded-full hover:bg-blue-100 transition-colors"
                >
                  <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  {userName}
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* MENU XỔ XUỐNG KHI CLICK VÀO TÊN */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50">
                    <div className="p-2">
                      <Link 
                        href="/dashboard/user/profile" 
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-xl transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Hồ sơ cá nhân
                      </Link>
                      
                      <div className="h-px bg-gray-100 my-1"></div>
                      
                      <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Nút dự phòng trường hợp lỡ mất đăng nhập
              <Link href="/login" className="px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md">
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
          
          {/* ================= SIDEBAR FILTER CỦA PHÒNG ================= */}
          {isMobileFilterOpen && (
            <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsMobileFilterOpen(false)} />
          )}

          <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-72 lg:bg-transparent lg:shadow-none lg:z-auto shrink-0 ${isMobileFilterOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="h-full flex flex-col lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                <h2 className="text-lg font-black text-gray-900">Bộ lọc Phòng Lab</h2>
                <div className="flex items-center gap-3">
                  <button className="text-sm font-semibold text-blue-600 hover:text-blue-800">Xóa tất cả</button>
                  <button className="lg:hidden text-gray-500" onClick={() => setIsMobileFilterOpen(false)}><X className="w-6 h-6" /></button>
                </div>
              </div>

              <div className="p-5 overflow-y-auto space-y-6">
                <div>
                  <button onClick={() => toggleSection('time')} className="flex items-center justify-between w-full font-bold text-gray-900 mb-4">
                    Thời gian sử dụng {openSections['time'] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {openSections['time'] && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg focus-within:border-blue-500">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <input type="date" className="w-full text-sm outline-none bg-transparent" />
                      </div>
                    </div>
                  )}
                </div>
                <hr className="border-gray-100" />
              </div>
            </div>
          </aside>

          {/* ================= DANH SÁCH PHÒNG LAB ================= */}
          <main className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Tìm tên phòng, tòa nhà..." className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
                  <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}><LayoutGrid className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}><ListIcon className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Đang tải danh sách phòng...</p>
              </div>
            ) : labs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Chưa có phòng Lab nào trên hệ thống.</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                {labs.map((lab) => (
                  <div key={lab.id} className={`bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 group ${viewMode === 'list' ? 'flex flex-col sm:flex-row' : 'flex flex-col'}`}>
                    
                    {/* Ảnh Phòng */}
                    <div className={`relative overflow-hidden bg-gray-100 ${viewMode === 'list' ? 'sm:w-64 h-48 sm:h-auto shrink-0' : 'h-52 w-full'}`}>
                      <img src={lab.image} alt={lab.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      
                      {/* TRẠNG THÁI PHÒNG (3 trạng thái) */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {lab.maintenanceMode ? (
                          <span className="px-3 py-1 bg-red-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-sm">
                            <Wrench className="w-3.5 h-3.5" /> Đang bảo trì
                          </span>
                        ) : lab.isBooked ? (
                          <span className="px-3 py-1 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-sm">
                            <Clock className="w-3.5 h-3.5" /> Đã đặt
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Phòng rảnh
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Thông tin Phòng */}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{lab.name}</h3>
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg text-xs font-bold text-yellow-700 border border-yellow-100">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> {lab.rating}
                        </div>
                      </div>

                      <div className="space-y-3 mt-4 text-sm text-gray-600 mb-4">
                        <p className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          <span className="font-bold text-gray-800">Tòa {lab.building} - {lab.floor}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-500" />
                          Sức chứa: <span className="font-bold text-gray-800">{lab.capacity} người</span>
                        </p>
                      </div>

                      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          {/* GIÁ TIỀN TỪ ADMIN */}
                          <span className="text-xl font-black text-blue-600">{lab.pricePerHour.toLocaleString('vi-VN')}đ</span>
                          <span className="text-xs text-gray-500 font-medium ml-1">/ giờ</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            disabled={lab.maintenanceMode || lab.isBooked} 
                            className={`px-5 py-2.5 rounded-xl font-bold transition-colors ${(lab.maintenanceMode || lab.isBooked) ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 active:scale-95"}`}
                          >
                            {lab.maintenanceMode ? "Tạm ngưng" : lab.isBooked ? "Đang sử dụng" : "Đặt phòng"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}