"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List as ListIcon,
  X,
  Package,
  Cpu,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
  CheckCircle2,
  AlertCircle,
  Wrench
} from "lucide-react";
import Link from "next/link";

// ================= TYPES (Đảm bảo Type Safety, không dùng any) =================
interface DeviceItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  status: "available" | "maintenance" | "out_of_stock";
  image: string;
  specs: string[];
  rating: number;
}

type ViewMode = "grid" | "list";

// ================= COMPONENT =================
export default function UserDevicesPage() {
  // States quản lý dữ liệu từ Admin (Backend)
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // States quản lý UI
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    time: true,
    category: true,
    status: true,
  });

  // Gọi API lấy dữ liệu thiết bị từ Backend
  useEffect(() => {
    const fetchDevicesFromAdmin = async () => {
      try {
        setLoading(true);
        // TODO: Thay thế đoạn này bằng hàm gọi API thực tế của bạn (vd: deviceService.getAll())
        // Giả lập độ trễ mạng 1 giây để test UI Loading
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Dữ liệu mẫu giả lập trả về từ Server
        const serverData: DeviceItem[] = [
          {
            id: "d1",
            name: "Oscilloscope Tektronix TBS1052B",
            category: "Đo lường điện tử",
            quantity: 15,
            price: 50000,
            status: "available",
            image: "https://images.unsplash.com/photo-1581092335397-9583eb92d232?auto=format&fit=crop&q=80&w=800",
            specs: ["Băng thông 50MHz", "2 Kênh", "Lấy mẫu 1GS/s"],
            rating: 4.9,
          },
          {
            id: "d2",
            name: "Kính hiển vi sinh học Olympus CX23",
            category: "Thiết bị Y sinh",
            quantity: 0,
            price: 120000,
            status: "out_of_stock",
            image: "https://images.unsplash.com/photo-1532187863486-abf9db0c2846?auto=format&fit=crop&q=80&w=800",
            specs: ["Độ phóng đại 1000x", "Đèn LED", "Thấu kính phẳng"],
            rating: 4.7,
          },
          {
            id: "d3",
            name: "Kit phát triển Raspberry Pi 4",
            category: "Công nghệ thông tin",
            quantity: 5,
            price: 30000,
            status: "maintenance",
            image: "https://images.unsplash.com/photo-1601814933824-fd0b574dd592?auto=format&fit=crop&q=80&w=800",
            specs: ["RAM 8GB", "Broadcom BCM2711", "WiFi 5GHz"],
            rating: 4.8,
          },
        ];
        setDevices(serverData);
      } catch (error) {
        console.error("Lỗi khi tải danh sách thiết bị:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevicesFromAdmin();
  }, []);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8 font-sans">
      {/* QUICK BADGES (Phân loại nhanh) */}
      <div className="max-w-7xl mx-auto mb-6 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <span className="text-sm font-bold text-gray-500 whitespace-nowrap">Danh mục nhanh:</span>
        {["Điện - Điện tử", "Công nghệ thông tin", "Hóa - Sinh", "Vật tư tiêu hao"].map((badge) => (
          <button
            key={badge}
            className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors whitespace-nowrap"
          >
            {badge}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* ================= SIDEBAR FILTER ================= */}
        {isMobileFilterOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileFilterOpen(false)}
          />
        )}

        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-72 lg:bg-transparent lg:shadow-none lg:z-auto shrink-0
            ${isMobileFilterOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="h-full flex flex-col lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white z-10">
              <h2 className="text-lg font-black text-gray-900">Bộ lọc Thiết bị</h2>
              <div className="flex items-center gap-3">
                <button className="text-sm font-semibold text-blue-600 hover:text-blue-800">Xóa tất cả</button>
                <button className="lg:hidden text-gray-500" onClick={() => setIsMobileFilterOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-6">
              
              {/* 1. Lọc Thời gian mượn */}
              <div>
                <button onClick={() => toggleSection('time')} className="flex items-center justify-between w-full font-bold text-gray-900 mb-4">
                  Thời gian cần mượn
                  {openSections['time'] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openSections['time'] && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg focus-within:border-blue-500">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <input type="date" className="w-full text-sm outline-none bg-transparent" />
                    </div>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                      <span className="text-sm font-medium text-gray-700">Chỉ hiện đồ có sẵn trong kho</span>
                    </label>
                  </div>
                )}
              </div>

              <hr className="border-gray-100" />

              {/* 2. Loại thiết bị */}
              <div>
                <button onClick={() => toggleSection('category')} className="flex items-center justify-between w-full font-bold text-gray-900 mb-3">
                  Nhóm thiết bị
                  {openSections['category'] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openSections['category'] && (
                  <div className="space-y-2">
                    {[
                      { label: "Dụng cụ đo lường", count: 45 },
                      { label: "Kit vi điều khiển", count: 120 },
                      { label: "Dụng cụ thí nghiệm", count: 80 },
                      { label: "Vật tư tiêu hao", count: 500 }
                    ].map((item, idx) => (
                      <label key={idx} className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                          <span className="text-sm text-gray-600 group-hover:text-gray-900">{item.label}</span>
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{item.count}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <hr className="border-gray-100" />

              {/* 3. Tình trạng */}
              <div>
                <button onClick={() => toggleSection('status')} className="flex items-center justify-between w-full font-bold text-gray-900 mb-3">
                  Tình trạng
                  {openSections['status'] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {openSections['status'] && (
                  <div className="space-y-2">
                    {["Hoạt động tốt", "Mới 100%", "Cần bảo trì"].map((item, idx) => (
                      <label key={idx} className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                        <span className="text-sm text-gray-600 group-hover:text-gray-900">{item}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="flex-1 min-w-0">
          
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Tìm mã hoặc tên thiết bị..." 
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
              <button 
                className="lg:hidden flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium"
                onClick={() => setIsMobileFilterOpen(true)}
              >
                <SlidersHorizontal className="w-4 h-4" /> Bộ lọc
              </button>

              <select className="px-3 py-2 bg-transparent border border-gray-200 rounded-lg text-sm font-medium outline-none cursor-pointer">
                <option>Mới nhập về</option>
                <option>Số lượng nhiều nhất</option>
                <option>Phí mượn thấp nhất</option>
              </select>

              <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* List Cards & Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Đang đồng bộ dữ liệu thiết bị từ máy chủ...</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Không tìm thấy thiết bị nào phù hợp với bộ lọc.</p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
                : "flex flex-col gap-4"
            }>
              {devices.map((device, index) => (
                <div 
                  key={device.id} 
                  className={`bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 group ${viewMode === 'list' ? 'flex flex-col sm:flex-row' : 'flex flex-col'}`}
                >
                  {/* Ảnh */}
                  <div className={`relative overflow-hidden bg-gray-100 ${viewMode === 'list' ? 'sm:w-64 h-48 sm:h-auto shrink-0' : 'h-52 w-full'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={device.image} alt={device.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    
                    {/* Tag Trạng thái Thiết bị */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {device.status === 'available' && (
                        <span className="px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng
                        </span>
                      )}
                      {device.status === 'maintenance' && (
                        <span className="px-3 py-1 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-sm">
                          <Wrench className="w-3.5 h-3.5" /> Đang bảo trì
                        </span>
                      )}
                      {device.status === 'out_of_stock' && (
                        <span className="px-3 py-1 bg-red-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-sm">
                          <AlertCircle className="w-3.5 h-3.5" /> Hết hàng
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{device.name}</h3>
                        <p className="text-sm text-gray-500 mt-1 font-medium bg-gray-100 inline-block px-2 py-0.5 rounded">
                          {device.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg text-xs font-bold text-yellow-700 border border-yellow-100">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> {device.rating}
                      </div>
                    </div>

                    {/* Thông số kỹ thuật & Tồn kho */}
                    <div className="flex items-center gap-3 text-sm text-gray-600 mb-4 mt-3">
                      <span className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-md border ${device.quantity > 0 ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
                        <Package className="w-4 h-4" /> Kho: {device.quantity}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                        <Cpu className="w-4 h-4 text-gray-400" /> {device.specs.length} T.số
                      </span>
                    </div>

                    {/* Cấu hình nổi bật (rút gọn) */}
                    <div className="text-xs text-gray-500 line-clamp-1 mb-4">
                      {device.specs.join(" • ")}
                    </div>

                    {/* Spacer đẩy giá & button xuống đáy */}
                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <span className="text-xl font-black text-blue-600">{device.price.toLocaleString('vi-VN')}đ</span>
                        <span className="text-xs text-gray-500 font-medium ml-1">/ ngày</span>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/dashboard/user/device/${device.id}`} className="px-3 py-2 text-sm font-bold text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          Chi tiết
                        </Link>
                        <button 
                          disabled={device.status !== 'available' || device.quantity === 0}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg shadow-md transition-all active:scale-95"
                        >
                          Mượn ngay
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
  );
}