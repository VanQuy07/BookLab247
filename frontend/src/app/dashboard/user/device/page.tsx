"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List as ListIcon,
  X,
  Package,
  Cpu,
  Calendar,
  ChevronDown,
  ChevronUp,
  Star,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Hexagon,
  User,
  LogOut,
  FilterX,
} from "lucide-react";
import Link from "next/link";

// ================= TYPES =================
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
  // Bổ sung các biến quan trọng từ nhánh của bạn
  totalQuantity: number;
  managementType: string;
  roomName: string;
}

// Định nghĩa kiểu dữ liệu trả về từ API Backend
interface ApiEquipment {
  id: string;
  _id?: string;
  name: string;
  category: string;
  managementType: string;
  serialNumber?: string;
  totalQuantity: number;
  inUseQuantity: number;
  status: string;
  imageUrl: string;
  price?: number;
  pricePerHour?: number;
  location?: string; // Cấu trúc giá chuẩn
}

type ViewMode = "grid" | "list";

// ================= COMPONENT =================
export default function UserDevicesPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeBadge, setActiveBadge] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [managementFilter, setManagementFilter] = useState<string[]>([]);
  const [priceFilter, setPriceFilter] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    time: true,
    category: true,
    status: true,
    management: true,
    price: true,
  });

  // Gọi API lấy dữ liệu thiết bị THỰC TẾ từ MongoDB (Backend)
  useEffect(() => {
    const fetchDevicesFromAdmin = async () => {
      try {
        const response = await fetch(
          "https://booklab247.onrender.com/api/v1/equipments",
        );

        if (!response.ok) {
          throw new Error("Không thể kết nối với máy chủ");
        }

        const data: ApiEquipment[] = await response.json();
        // Ánh xạ (Map) dữ liệu từ Backend sang Frontend UI
        const formattedDevices: DeviceItem[] = data.map((item) => {
          // Tính toán số lượng tồn kho thực tế
          const availableQuantity =
            (item.totalQuantity || 0) - (item.inUseQuantity || 0);

          // Xác định trạng thái thiết bị
          let deviceStatus: "available" | "maintenance" | "out_of_stock" =
            "available";
          if (item.status === "maintenance") deviceStatus = "maintenance";
          else if (
            item.status === "liquidated" ||
            (item.managementType === "pool" && availableQuantity <= 0)
          )
            deviceStatus = "out_of_stock";

          return {
            roomName: item.location || "Trong kho",
            id: item.id || item._id || "",
            name: item.name,
            category: item.category || "Chưa phân loại",
            quantity: availableQuantity,
            totalQuantity: item.totalQuantity || 0,
            managementType: item.managementType || "pool",
            // SỬA LỖI: Ưu tiên lấy giá pricePerHour theo đúng thiết kế
            price: item.pricePerHour || item.price || 0,
            status: deviceStatus,
            image:
              item.imageUrl ||
              "https://images.unsplash.com/photo-1581092335397-9583eb92d232?auto=format&fit=crop&q=80&w=800",
            specs:
                ["Quản lý theo số lượng"],
            rating: 5.0, // Mặc định 5 sao
          };
        });

        setDevices(formattedDevices);
      } catch (error) {
        console.error("Lỗi khi tải danh sách thiết bị:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevicesFromAdmin();
  }, []);

  //Lọc
  const filteredDevices = devices.filter((device) => {
    if (
      searchQuery &&
      !device.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;

    if (activeBadge) {
      if (
        activeBadge === "🔌 Vật tư tiêu hao" &&
        !device.category.toLowerCase().includes("tiêu hao")
      )
        return false;
      if (
        activeBadge === "🧩 Kit Vi điều khiển" &&
        !device.category.toLowerCase().includes("kit")
      )
        return false;
      if (
        activeBadge === "⚡ Dụng cụ đo lường" &&
        !device.category.toLowerCase().includes("đo lường")
      )
        return false;
      if (
        activeBadge === "💡 Điện - Điện tử" &&
        !device.category.toLowerCase().includes("điện")
      )
        return false;
    }

    if (statusFilter.length > 0 && !statusFilter.includes(device.status))
      return false;
    if (
      managementFilter.length > 0 &&
      !managementFilter.includes(device.managementType)
    )
      return false;

    if (priceFilter.length > 0) {
      const isFree = device.price === 0;
      if (priceFilter.includes("free") && !isFree) return false;
      if (priceFilter.includes("paid") && isFree) return false;
    }

    if (onlyAvailable) {
      if (device.status !== "available" || device.quantity <= 0) return false;
    }

    return true;
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };
  const toggleFilter = (
    setState: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
  ) => {
    setState((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setActiveBadge(null);
    setSelectedDate("");
    setOnlyAvailable(false);
    setStatusFilter([]);
    setManagementFilter([]);
    setPriceFilter([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-900 selection:bg-blue-200">
      {/* ================= HEADER (NAVBAR) ================= */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-black text-blue-600 tracking-tight"
          >
            <Hexagon className="w-8 h-8 fill-blue-600" />
            BookLab247
          </Link>
          <nav className="hidden md:flex gap-8 text-sm font-bold text-gray-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Trang chủ
            </Link>
            <Link
              href="/dashboard/user/labs"
              className="hover:text-blue-600 transition-colors"
            >
              Danh sách phòng
            </Link>
            <Link href="/dashboard/user/device" className="text-blue-600">
              Thiết bị
            </Link>
            <Link
              href="/dashboard/user/history"
              className="hover:text-blue-600 transition-colors"
            >
              Lịch sử đặt phòng
            </Link>
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
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

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
              <Link
                href="/login"
                className="px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <div className="p-4 md:p-6 lg:p-8">
        {/* QUICK BADGES TỪ MASTER */}
        <div className="max-w-7xl mx-auto mb-6 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-sm font-bold text-gray-500 whitespace-nowrap">
            Danh mục nhanh:
          </span>
          {[
            "🔥 Mượn nhiều nhất",
            "🔌 Vật tư tiêu hao",
            "🧩 Kit Vi điều khiển",
            "⚡ Dụng cụ đo lường",
            "🎓 Đồ án chuyên ngành",
            "💡 Điện - Điện tử",
          ].map((badge) => (
            <button
              key={badge}
              onClick={() =>
                setActiveBadge(activeBadge === badge ? null : badge)
              }
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors whitespace-nowrap ${activeBadge === badge ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white border-gray-200 text-gray-700 hover:bg-blue-50 hover:text-blue-700"}`}
            >
              {badge}
            </button>
          ))}
        </div>

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
          {/* ================= SIDEBAR FILTER TỪ MASTER ================= */}
          {isMobileFilterOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsMobileFilterOpen(false)}
            />
          )}

          <aside
            className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-72 lg:bg-transparent lg:shadow-none lg:z-auto shrink-0 ${isMobileFilterOpen ? "translate-x-0" : "-translate-x-full"}`}
          >
            <div className="h-full flex flex-col lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                <h2 className="text-lg font-black text-gray-900">
                  Bộ lọc Thiết bị
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={clearAllFilters}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Xóa tất cả
                  </button>
                  <button
                    className="lg:hidden text-gray-500"
                    onClick={() => setIsMobileFilterOpen(false)}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-y-auto space-y-6">
                {/*1. Lọc thời gian*/}
                <div>
                  <button
                    onClick={() => toggleSection("time")}
                    className="flex items-center justify-between w-full font-bold text-gray-900 mb-4 outline-none"
                  >
                    Thời gian cần mượn{" "}
                    {openSections["time"] ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {openSections["time"] && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg focus-within:border-blue-500 bg-white">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full text-sm outline-none bg-transparent text-gray-700"
                        />
                      </div>
                      <label className="flex items-center gap-2 mt-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={onlyAvailable}
                          onChange={(e) => setOnlyAvailable(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">
                          Chỉ hiện đồ có sẵn
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                <hr className="border-gray-100" />

                {/* 2. Trạng thái kho */}
                <div>
                  <button
                    onClick={() => toggleSection("status")}
                    className="flex items-center justify-between w-full font-bold text-gray-900 mb-4 outline-none"
                  >
                    Trạng thái trong kho{" "}
                    {openSections["status"] ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {openSections["status"] && (
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={statusFilter.includes("available")}
                          onChange={() =>
                            toggleFilter(setStatusFilter, "available")
                          }
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">
                          Sẵn sàng cho mượn
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={statusFilter.includes("out_of_stock")}
                          onChange={() =>
                            toggleFilter(setStatusFilter, "out_of_stock")
                          }
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">
                          Tạm hết / Đang sử dụng
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={statusFilter.includes("maintenance")}
                          onChange={() =>
                            toggleFilter(setStatusFilter, "maintenance")
                          }
                          className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">
                          Đang bảo trì
                        </span>
                      </label>
                    </div>
                  )}
                </div>
                <hr className="border-gray-100" />

                {/* 3. Loại hình quản lý */}
                <div>
                  <button
                    onClick={() => toggleSection("management")}
                    className="flex items-center justify-between w-full font-bold text-gray-900 mb-3 outline-none"
                  >
                    Loại hình quản lý{" "}
                    {openSections["management"] ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {openSections["management"] && (
                    <div className="space-y-3 mt-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={managementFilter.includes("pool")}
                          onChange={() =>
                            toggleFilter(setManagementFilter, "pool")
                          }
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">
                          Theo số lượng (Pool)
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={managementFilter.includes("serial")}
                          onChange={() =>
                            toggleFilter(setManagementFilter, "serial")
                          }
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">
                          Mượn đơn chiếc (Serial)
                        </span>
                      </label>
                    </div>
                  )}
                </div>
                <hr className="border-gray-100" />

                {/* 4. Chi phí */}
                <div>
                  <button
                    onClick={() => toggleSection("price")}
                    className="flex items-center justify-between w-full font-bold text-gray-900 mb-3 outline-none"
                  >
                    Chi phí sử dụng{" "}
                    {openSections["price"] ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {openSections["price"] && (
                    <div className="space-y-3 mt-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={priceFilter.includes("free")}
                          onChange={() => toggleFilter(setPriceFilter, "free")}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">
                          Miễn phí (Trường cấp)
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={priceFilter.includes("paid")}
                          onChange={() => toggleFilter(setPriceFilter, "paid")}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900">
                          Có tính phí
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* ================= THÔNG TIN CHÍNH ================= */}
          <main className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên thiết bị hoặc mô tả..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>
              <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                <button
                  className="lg:hidden flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium"
                  onClick={() => setIsMobileFilterOpen(true)}
                >
                  <SlidersHorizontal className="w-4 h-4" /> Bộ lọc
                </button>
                <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white shadow-sm text-blue-600" : "text-gray-500"}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-gray-500"}`}
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">
                  Đang tải thiết bị từ máy chủ...
                </p>
              </div>
            ) : filteredDevices.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-300 flex flex-col items-center">
                <FilterX className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Không tìm thấy thiết bị nào
                </h3>
                <p className="text-gray-500 mb-6">
                  Thử thay đổi từ khóa hoặc bỏ bớt các bộ lọc hiện tại.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                    : "flex flex-col gap-4"
                }
              >
                {filteredDevices.map((device) => (
                  <div
                    key={device.id}
                    className={`bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-200 transition-all duration-300 group ${viewMode === "list" ? "flex flex-col sm:flex-row" : "flex flex-col"}`}
                  >
                    <div
                      className={`relative overflow-hidden bg-gray-100 ${viewMode === "list" ? "sm:w-64 h-48 sm:h-auto shrink-0" : "h-52 w-full"}`}
                    >
                      <img
                        src={device.image}
                        alt={device.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        {device.status === "available" && (
                          <span className="px-3 py-1 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng
                          </span>
                        )}
                        {device.status === "maintenance" && (
                          <span className="px-3 py-1 bg-amber-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1">
                            <Wrench className="w-3.5 h-3.5" /> Đang bảo trì
                          </span>
                        )}
                        {device.status === "out_of_stock" && (
                          <span className="px-3 py-1 bg-red-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Tạm hết
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {device.name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1 font-medium bg-gray-100 inline-block px-2 py-0.5 rounded">
                            {device.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg text-xs font-bold text-yellow-700 border border-yellow-100">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          {device.rating}
                        </div>
                      </div>

                      {/* KHÔI PHỤC LOGIC HIỂN THỊ CÒN LẠI / ĐƠN CHIẾC TỪ HEAD */}
                      <div className="flex items-center gap-3 text-sm text-gray-600 mb-4 mt-3">
                        <span className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-md border ${device.quantity > 0 ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-red-50 border-red-100 text-red-600"}`}>
                          <Package className="w-4 h-4" /> Còn lại: {device.quantity} / {device.totalQuantity} cái
                        </span>
                      </div>

                      <div className="text-xs text-gray-500 line-clamp-1 mb-4">
                        {device.specs.join(" • ")}
  
                        {/* Thẻ hiển thị vị trí phòng - Đã xóa mb-4 dư thừa */}
                        <div className="mt-2 text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100 flex items-center gap-1 w-fit">
                          <span className="text-gray-400">Vị trí:</span>
                          <span className="text-gray-800 font-semibold">{device.roomName}</span>
                        </div>
                      </div>
                      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          {/* SỬA CHỮ / NGÀY THÀNH / GIỜ CHO KHỚP VỚI HỆ THỐNG */}
                          <span className="text-xl font-black text-blue-600">
                            {device.price.toLocaleString("vi-VN")}đ
                          </span>
                          <span className="text-xs text-gray-500 font-medium ml-1">
                            / giờ
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            disabled={
                              device.status !== "available" ||
                              (device.managementType === "pool" &&
                                device.quantity <= 0)
                            }
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-bold rounded-lg shadow-md transition-all active:scale-95"
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
    </div>
  );
}
