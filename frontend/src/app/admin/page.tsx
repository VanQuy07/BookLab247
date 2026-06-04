"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  DoorOpen,
  Cpu,
  Users,
  LogOut,
  Plus,
  X,
  AlertTriangle,
  Clock,
  MapPin,
  Settings2,
  Trash2,
  Image as ImageIcon,
  Package,
  Wrench,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Activity,
  MonitorPlay,
  Search,
  Info,
  ShieldAlert,
  Lock,
  Unlock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { authService } from "../../services/auth";

type MenuTab = "dashboard" | "bookings" | "rooms" | "equipments" | "users";
type TimeFilter = "yesterday" | "today" | "7days" | "month";

// ================= INTERFACES (Strict Type) =================
interface PeakHourData {
  time: string;
  bookings: number;
}
interface PopularData {
  name: string;
  value: number;
}
interface MetricCard {
  title: string;
  value: string;
  subValue: string;
  icon: React.ElementType;
  trend: "up" | "down" | "neutral";
  colorClass: string;
  bgClass: string;
}

// ================= DỮ LIỆU MẪU ĐẶT PHÒNG (TIMELINE) =================
const MOCK_BOOKINGS = [
  {
    id: "b1",
    roomId: "r1", // Phải khớp với ID phòng trong CSDL
    customerName: "Nguyễn Văn A",
    phone: "0901234567",
    status: "checked-in", // xanh lá
    startTime: "07:30",
    durationMins: 120, // 2 tiếng
    bufferMins: 15, // 15 phút dọn dẹp
    note: "Mượn thêm 1 máy chiếu",
  },
  {
    id: "b2",
    roomId: "r1",
    customerName: "Lê Thị B",
    phone: "0987654321",
    status: "confirmed", // xanh dương
    startTime: "10:00",
    durationMins: 90,
    bufferMins: 15,
    note: "Học nhóm môn React",
  },
  {
    id: "b3",
    roomId: "r2",
    customerName: "Trần C",
    phone: "0911222333",
    status: "pending", // vàng
    startTime: "13:30",
    durationMins: 180,
    bufferMins: 30,
    note: "Thực hành Đồ án",
  },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

export default function AdvancedAdminDashboard() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<MenuTab>("dashboard");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // ================= STATE BỘ LỌC THỜI GIAN =================
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");

  // ================= STATES DỮ LIỆU CÁC TAB KHÁC =================
  const [rooms, setRooms] = useState<any[]>([
    // Mock 1 vài phòng để test Timeline ngay lập tức
    {
      id: "r1",
      name: "Lab Máy tính 01",
      building: "Tòa A",
      floor: "Tầng 3",
      capacity: 40,
    },
    {
      id: "r2",
      name: "Lab Hóa - Sinh 02",
      building: "Tòa B",
      floor: "Tầng 1",
      capacity: 20,
    },
    {
      id: "r3",
      name: "Phòng Hội thảo VIP",
      building: "Tòa C",
      floor: "Tầng 5",
      capacity: 100,
    },
  ]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [userStatusFilter, setStatusFilter] = useState("ALL");
  // ================= STATES FORM =================
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [showEqForm, setShowEqForm] = useState(false);

  const [newRoom, setNewRoom] = useState({
    name: "",
    building: "",
    floor: "",
    type: "Phòng Thực hành",
    capacity: 40,
    pricePerHour: 100000,
    bufferTimeMinutes: 15,
    maintenanceMode: false,
    defaultAmenities: "",
    imageUrl: "",
  });

  const [newEq, setNewEq] = useState({
    name: "",
    category: "Vật tư tiêu hao",
    managementType: "pool",
    serialNumber: "",
    totalQuantity: 1,
    inUseQuantity: 0,
    status: "available",
    maintenanceAlertHours: 0,
    imageUrl: "",
  });

  // ================= FETCH DATA =================
  //const API_URL = "http://localhost:8000/api/v1";
  const API_URL = "https://booklab247.onrender.com/api/v1";
  useEffect(() => {
    fetchData();
  }, [activeMenu]);

  const fetchData = async () => {
    if (activeMenu === "dashboard" || activeMenu === "bookings") return;
    setLoading(true);
    try {
      if (activeMenu === "rooms") {
        const res = await fetch(`${API_URL}/labs`);
        setRooms(await res.json());
      } else if (activeMenu === "equipments") {
        const res = await fetch(`${API_URL}/equipments`);
        setEquipments(await res.json());
      } else if (activeMenu === "users") {
        const res = await fetch(`${API_URL}/auth/users`);
        setUsersList(await res.json());
      }
    } catch (err) {
      console.error("Lỗi fetch data:", err);
    }
    setLoading(false);
  };

  // ================= CÁC HÀM XỬ LÝ FORM =================
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isRoom: boolean,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploadingImage(true);
    try {
      const res = await fetch(`${API_URL}/labs/upload-image`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (isRoom) setNewRoom((p) => ({ ...p, imageUrl: data.imageUrl }));
      else setNewEq((p) => ({ ...p, imageUrl: data.imageUrl }));
    } catch (err) {
      alert("Lỗi upload ảnh");
    }
    setUploadingImage(false);
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/labs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRoom),
      });
      const data = await res.json();
      setRooms([...rooms, data]);
      setShowRoomForm(false);
      alert("Thêm phòng thành công!");
    } catch (err) {
      alert("Lỗi thêm phòng");
    }
  };

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/equipments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEq),
      });
      const data = await res.json();
      setEquipments([...equipments, data]);
      setShowEqForm(false);
      alert("Thêm thiết bị thành công!");
    } catch (err) {
      alert("Lỗi thêm thiết bị");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  // ================= RENDER TABS =================
  const renderSidebar = () => (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 shrink-0 shadow-2xl z-20">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Settings2 className="w-7 h-7 text-blue-500" /> BookLab
          <span className="text-blue-500">Admin</span>
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {[
          { id: "dashboard", icon: LayoutDashboard, label: "Tổng quan" },
          { id: "bookings", icon: CalendarDays, label: "Lịch Đặt phòng" },
          { id: "rooms", icon: DoorOpen, label: "Phòng Thực hành" },
          { id: "equipments", icon: Cpu, label: "Tài sản & Kho" },
          { id: "users", icon: Users, label: "Người dùng" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveMenu(item.id as MenuTab)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeMenu === item.id ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "hover:bg-slate-800"}`}
          >
            <item.icon className="w-5 h-5" /> {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold bg-slate-800 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" /> Đăng xuất
        </button>
      </div>
    </aside>
  );

  // ================= 1. GIAO DIỆN LỊCH ĐẶT PHÒNG (TIMELINE VIEW) =================
  const renderBookings = () => {
    // Cấu hình Timeline: Từ 07:00 đến 21:00 (14 tiếng = 840 phút)
    const startHour = 7;
    const endHour = 21;
    const totalMins = (endHour - startHour) * 60;

    // Tạo mảng khung giờ
    const timeHeaders = [];
    for (let i = startHour; i <= endHour; i++) {
      timeHeaders.push(`${i.toString().padStart(2, "0")}:00`);
    }

    const getStatusColor = (status: string) => {
      if (status === "checked-in")
        return "bg-green-500 border-green-600 text-white";
      if (status === "confirmed")
        return "bg-blue-500 border-blue-600 text-white";
      if (status === "pending")
        return "bg-amber-400 border-amber-500 text-amber-950";
      return "bg-gray-400 border-gray-500 text-white";
    };

    // LỌC CHỈ LẤY NHỮNG PHÒNG ĐÃ CÓ LỊCH ĐẶT
    const roomsWithBookings = rooms.filter((room) =>
      MOCK_BOOKINGS.some((booking) => booking.roomId === room.id),
    );

    return (
      <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)]">
        {/* Lọc nhanh phía trên */}
        <div className="flex justify-between items-end shrink-0">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              Lịch Trình Booking
            </h2>
            <p className="text-gray-500 mt-1 flex gap-4 text-sm font-medium">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-500"></span> Đang
                sử dụng
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span> Đã
                duyệt
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-amber-400"></span> Chờ
                duyệt
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm tên phòng / Tòa nhà..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 bg-white"
              />
            </div>
            <input
              type="date"
              defaultValue={new Date().toISOString().split("T")[0]}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white"
            />
          </div>
        </div>

        {/* CONTAINER TIMELINE */}
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-auto relative shadow-sm">
          <div className="min-w-[1200px] h-full flex flex-col">
            {/* Header Khung giờ (Sticky Top) */}
            <div className="flex sticky top-0 z-20 bg-slate-50 border-b border-gray-200 shadow-sm">
              <div className="w-64 shrink-0 sticky left-0 z-30 bg-slate-50 border-r border-gray-200 p-4 font-black text-gray-700 flex items-center justify-between">
                Danh sách Phòng
              </div>
              <div className="flex-1 relative flex">
                {timeHeaders.map((time, idx) => (
                  <div
                    key={idx}
                    className="flex-1 border-r border-gray-100 p-3 text-xs font-bold text-gray-400 text-center relative"
                  >
                    <span className="absolute -left-3 top-3 bg-slate-50 px-1">
                      {time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* KIỂM TRA NẾU KHÔNG CÓ PHÒNG NÀO ĐƯỢC ĐẶT */}
            {roomsWithBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-20 text-gray-400">
                <CalendarDays className="w-12 h-12 mb-3 text-gray-300" />
                <p className="font-medium">
                  Chưa có lịch đặt phòng nào cho ngày hôm nay.
                </p>
              </div>
            ) : (
              /* CHỈ RENDER CÁC PHÒNG CÓ LỊCH */
              roomsWithBookings.map((room) => {
                const roomBookings = MOCK_BOOKINGS.filter(
                  (b) => b.roomId === room.id,
                );

                return (
                  <div
                    key={room.id}
                    className="flex border-b border-gray-100 group hover:bg-slate-50/50 transition-colors h-24"
                  >
                    {/* Cột trái: Tên phòng (Sticky Left) */}
                    <div className="w-64 shrink-0 sticky left-0 z-10 bg-white group-hover:bg-slate-50 border-r border-gray-200 p-4 flex flex-col justify-center">
                      <h3 className="font-bold text-gray-900 leading-tight">
                        {room.name}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {room.building} -{" "}
                        {room.floor}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        <Users className="w-3 h-3 inline" /> {room.capacity}{" "}
                        người
                      </p>
                    </div>

                    {/* Vùng Lưới Khung Giờ */}
                    <div
                      className="flex-1 relative bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABZJREFUeNpi2rVq1X8GBgYQwgcsAAgwAA9GA9/5o7wLAAAAAElFTkSuQmCC')] cursor-pointer"
                      onClick={() =>
                        alert(`Bật Form Đặt lịch nhanh cho phòng: ${room.name}`)
                      }
                    >
                      {/* Render Booking Blocks */}
                      {roomBookings.map((booking) => {
                        const [h, m] = booking.startTime.split(":").map(Number);
                        const startMins = (h - startHour) * 60 + m;

                        const leftPct = (startMins / totalMins) * 100;
                        const widthPct =
                          (booking.durationMins / totalMins) * 100;
                        const bufferWidthPct =
                          (booking.bufferMins / totalMins) * 100;

                        return (
                          <React.Fragment key={booking.id}>
                            {/* Khối Booking Chính */}
                            <div
                              className={`absolute top-2 bottom-2 ${getStatusColor(booking.status)} border rounded-l-lg rounded-r-sm p-2 shadow-sm cursor-move overflow-hidden z-10 flex flex-col justify-center group/block`}
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                alert(
                                  `Mở popup chỉnh sửa ca của ${booking.customerName}`,
                                );
                              }}
                            >
                              <p className="text-xs font-bold truncate leading-tight">
                                {booking.customerName}
                              </p>
                              <p className="text-[10px] opacity-90 truncate font-medium">
                                {booking.startTime} ({booking.durationMins}p)
                              </p>

                              <div
                                className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize hover:bg-black/20"
                                title="Kéo để gia hạn giờ"
                              ></div>

                              {/* Hover Tooltip (Popup Chi Tiết) */}
                              <div
                                className="hidden group-hover/block:block absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-slate-900 text-white p-4 rounded-xl shadow-2xl scale-100 animate-in fade-in zoom-in-95 duration-200 cursor-default"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <h4 className="font-bold text-sm border-b border-slate-700 pb-2 mb-2">
                                  {booking.customerName}
                                </h4>
                                <div className="space-y-1 text-xs text-slate-300">
                                  <p>
                                    <span className="text-slate-400">
                                      Điện thoại:
                                    </span>{" "}
                                    {booking.phone}
                                  </p>
                                  <p>
                                    <span className="text-slate-400">
                                      Bắt đầu:
                                    </span>{" "}
                                    {booking.startTime}
                                  </p>
                                  <p>
                                    <span className="text-slate-400">
                                      Thời lượng:
                                    </span>{" "}
                                    {booking.durationMins} phút
                                  </p>
                                  <p>
                                    <span className="text-slate-400">
                                      Ghi chú:
                                    </span>{" "}
                                    {booking.note}
                                  </p>
                                </div>
                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-900"></div>
                              </div>
                            </div>

                            {/* Khối Thời gian đệm (Buffer Time) */}
                            {booking.bufferMins > 0 && (
                              <div
                                className="absolute top-2 bottom-2 z-0 bg-gray-200 border-y border-r border-gray-300 rounded-r-lg opacity-70 flex items-center justify-center overflow-hidden cursor-not-allowed"
                                style={{
                                  left: `${leftPct + widthPct}%`,
                                  width: `${bufferWidthPct}%`,
                                  backgroundImage:
                                    "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px)",
                                }}
                                title={`Thời gian dọn dẹp ${booking.bufferMins} phút`}
                              >
                                <Wrench className="w-3 h-3 text-gray-400" />
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  // ================= DASHBOARD CÓ BỘ LỌC THỜI GIAN =================
  const renderDashboard = () => {
    // 1. Kho dữ liệu ảo (Mock Data) thay đổi theo timeFilter
    const dashboardData = {
      yesterday: {
        metrics: [
          {
            title: "Trạng thái phòng",
            value: "60%",
            subValue: "12/20 phòng sử dụng",
            icon: Activity,
            trend: "down" as const,
            colorClass: "text-blue-600",
            bgClass: "bg-blue-50",
          },
          {
            title: "Đơn đặt lịch",
            value: "85",
            subValue: "Hoàn tất 85 đơn",
            icon: CalendarDays,
            trend: "down" as const,
            colorClass: "text-emerald-600",
            bgClass: "bg-emerald-50",
          },
          {
            title: "Thiết bị cho mượn",
            value: "24",
            subValue: "Đã trả 5 thiết bị",
            icon: MonitorPlay,
            trend: "down" as const,
            colorClass: "text-amber-600",
            bgClass: "bg-amber-50",
          },
          {
            title: "Doanh thu (Ngày)",
            value: "2.1M",
            subValue: "-5% so với hôm kia",
            icon: CreditCard,
            trend: "down" as const,
            colorClass: "text-purple-600",
            bgClass: "bg-purple-50",
          },
        ],
        peakHours: [
          { time: "07:00", bookings: 5 },
          { time: "09:00", bookings: 25 },
          { time: "11:00", bookings: 20 },
          { time: "13:00", bookings: 35 },
          { time: "15:00", bookings: 30 },
          { time: "17:00", bookings: 10 },
        ],
        popularRooms: [
          { name: "Lab Máy tính", value: 30 },
          { name: "Lab Hóa - Sinh", value: 40 },
          { name: "Phòng Hội thảo", value: 10 },
          { name: "Không gian chung", value: 20 },
        ],
      },
      today: {
        metrics: [
          {
            title: "Trạng thái phòng",
            value: "75%",
            subValue: "15/20 phòng đang dùng",
            icon: Activity,
            trend: "up" as const,
            colorClass: "text-blue-600",
            bgClass: "bg-blue-50",
          },
          {
            title: "Đơn đặt lịch",
            value: "124",
            subValue: "12 đơn chờ duyệt",
            icon: CalendarDays,
            trend: "up" as const,
            colorClass: "text-emerald-600",
            bgClass: "bg-emerald-50",
          },
          {
            title: "Thiết bị cho mượn",
            value: "45",
            subValue: "Trong tổng số 320 TB",
            icon: MonitorPlay,
            trend: "neutral" as const,
            colorClass: "text-amber-600",
            bgClass: "bg-amber-50",
          },
          {
            title: "Doanh thu (Ngày)",
            value: "3.2M",
            subValue: "+12.5% so với hôm qua",
            icon: CreditCard,
            trend: "up" as const,
            colorClass: "text-purple-600",
            bgClass: "bg-purple-50",
          },
        ],
        peakHours: [
          { time: "07:00", bookings: 12 },
          { time: "09:00", bookings: 45 },
          { time: "11:00", bookings: 30 },
          { time: "13:00", bookings: 55 },
          { time: "15:00", bookings: 60 },
          { time: "17:00", bookings: 25 },
        ],
        popularRooms: [
          { name: "Lab Máy tính", value: 45 },
          { name: "Lab Hóa - Sinh", value: 25 },
          { name: "Phòng Hội thảo", value: 20 },
          { name: "Không gian chung", value: 10 },
        ],
      },
      "7days": {
        metrics: [
          {
            title: "Trạng thái phòng",
            value: "82%",
            subValue: "Trung bình 7 ngày",
            icon: Activity,
            trend: "up" as const,
            colorClass: "text-blue-600",
            bgClass: "bg-blue-50",
          },
          {
            title: "Đơn đặt lịch",
            value: "856",
            subValue: "Tăng mạnh đầu tuần",
            icon: CalendarDays,
            trend: "up" as const,
            colorClass: "text-emerald-600",
            bgClass: "bg-emerald-50",
          },
          {
            title: "Thiết bị cho mượn",
            value: "120",
            subValue: "Chưa thu hồi 15 TB",
            icon: MonitorPlay,
            trend: "neutral" as const,
            colorClass: "text-amber-600",
            bgClass: "bg-amber-50",
          },
          {
            title: "Doanh thu (Tuần)",
            value: "22.5M",
            subValue: "+8% so với tuần trước",
            icon: CreditCard,
            trend: "up" as const,
            colorClass: "text-purple-600",
            bgClass: "bg-purple-50",
          },
        ],
        peakHours: [
          { time: "T2", bookings: 120 },
          { time: "T3", bookings: 150 },
          { time: "T4", bookings: 140 },
          { time: "T5", bookings: 180 },
          { time: "T6", bookings: 160 },
          { time: "T7", bookings: 80 },
          { time: "CN", bookings: 26 },
        ],
        popularRooms: [
          { name: "Lab Máy tính", value: 300 },
          { name: "Lab Hóa - Sinh", value: 150 },
          { name: "Phòng Hội thảo", value: 250 },
          { name: "Không gian chung", value: 156 },
        ],
      },
      month: {
        metrics: [
          {
            title: "Trạng thái phòng",
            value: "68%",
            subValue: "Trung bình tháng",
            icon: Activity,
            trend: "down" as const,
            colorClass: "text-blue-600",
            bgClass: "bg-blue-50",
          },
          {
            title: "Đơn đặt lịch",
            value: "3,240",
            subValue: "Hoàn tất 98%",
            icon: CalendarDays,
            trend: "up" as const,
            colorClass: "text-emerald-600",
            bgClass: "bg-emerald-50",
          },
          {
            title: "Thiết bị cho mượn",
            value: "840",
            subValue: "Mất/Hỏng 2 TB",
            icon: MonitorPlay,
            trend: "down" as const,
            colorClass: "text-amber-600",
            bgClass: "bg-amber-50",
          },
          {
            title: "Doanh thu (Tháng)",
            value: "86.4M",
            subValue: "-2% so với tháng trước",
            icon: CreditCard,
            trend: "down" as const,
            colorClass: "text-purple-600",
            bgClass: "bg-purple-50",
          },
        ],
        peakHours: [
          { time: "Tuần 1", bookings: 800 },
          { time: "Tuần 2", bookings: 950 },
          { time: "Tuần 3", bookings: 820 },
          { time: "Tuần 4", bookings: 670 },
        ],
        popularRooms: [
          { name: "Lab Máy tính", value: 1200 },
          { name: "Lab Hóa - Sinh", value: 800 },
          { name: "Phòng Hội thảo", value: 600 },
          { name: "Không gian chung", value: 640 },
        ],
      },
    };

    const currentData = dashboardData[timeFilter];

    return (
      <div className="space-y-8 pb-10">
        {/* ================= BỘ LỌC THỜI GIAN NHANH ================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900">
              Tổng quan Hệ thống
            </h2>
            <p className="text-gray-500 mt-1">
              Nắm bắt nhanh tình hình hoạt động của BookLab247.
            </p>
          </div>

          <div className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200">
            {[
              { id: "yesterday", label: "Hôm qua" },
              { id: "today", label: "Hôm nay" },
              { id: "7days", label: "7 ngày qua" },
              { id: "month", label: "Tháng này" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setTimeFilter(filter.id as TimeFilter)}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                  timeFilter === filter.id
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* ================= HÀNG THỐNG KÊ (Thay đổi theo filter) ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {currentData.metrics.map((metric, idx) => (
            <motion.div
              key={`${timeFilter}-metric-${idx}`} // Ép React re-render chạy animation khi đổi tab
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow"
            >
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${metric.bgClass}`}
              >
                <metric.icon className={`w-7 h-7 ${metric.colorClass}`} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500 mb-1">
                  {metric.title}
                </p>
                <h3 className="text-2xl font-black text-gray-900 leading-none mb-2">
                  {metric.value}
                </h3>
                <p className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                  {metric.trend === "up" && (
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                  )}
                  {metric.trend === "down" && (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  {metric.subValue}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ================= BIỂU ĐỒ (Thay đổi theo filter) ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            key={`${timeFilter}-chart1`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2"
          >
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                Tần suất đặt phòng
              </h3>
              <p className="text-sm text-gray-500">
                Giúp bố trí nhân sự kỹ thuật & lao công hợp lý.
              </p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={currentData.peakHours}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="bookings"
                    name="Số ca đặt"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                  >
                    {currentData.peakHours.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          index ===
                          currentData.peakHours.reduce(
                            (maxIdx, current, idx, arr) =>
                              current.bookings > arr[maxIdx].bookings
                                ? idx
                                : maxIdx,
                            0,
                          )
                            ? "#2563eb"
                            : "#93c5fd"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            key={`${timeFilter}-chart2`}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
          >
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                Mức độ ưa chuộng
              </h3>
              <p className="text-sm text-gray-500">
                Phân bổ tỷ lệ loại phòng được đặt.
              </p>
            </div>
            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentData.popularRooms}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {currentData.popularRooms.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#475569",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    );
  };

  // ================= CÁC HÀM RENDER KHÁC (GIỮ NGUYÊN NHƯ CŨ) =================
  const renderRooms = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-gray-900">
            Quản lý Không gian
          </h2>
          <p className="text-gray-500 mt-1">
            Thêm, sửa, xóa và kiểm soát trạng thái phòng Lab.
          </p>
        </div>
        <button
          onClick={() => setShowRoomForm(!showRoomForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md"
        >
          {showRoomForm ? (
            <X className="w-5 h-5" />
          ) : (
            <Plus className="w-5 h-5" />
          )}{" "}
          Thêm Phòng
        </button>
      </div>

      {showRoomForm && (
        <form
          onSubmit={handleAddRoom}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
        >
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Tên phòng..."
                className="w-full p-2 border rounded-lg"
                onChange={(e) =>
                  setNewRoom({ ...newRoom, name: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Tòa nhà (VD: Tòa A)"
                className="w-full p-2 border rounded-lg"
                onChange={(e) =>
                  setNewRoom({ ...newRoom, building: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Tầng (VD: Tầng 3)"
                className="w-full p-2 border rounded-lg"
                onChange={(e) =>
                  setNewRoom({ ...newRoom, floor: e.target.value })
                }
              />
            </div>
            <div className="space-y-4">
              <input
                type="number"
                placeholder="Sức chứa"
                className="w-full p-2 border rounded-lg"
                onChange={(e) =>
                  setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) })
                }
              />
              <input
                type="number"
                placeholder="Giá/Giờ"
                className="w-full p-2 border rounded-lg"
                onChange={(e) =>
                  setNewRoom({
                    ...newRoom,
                    pricePerHour: parseInt(e.target.value),
                  })
                }
              />
              <label className="flex items-center gap-2 text-red-600 font-bold p-2 border border-red-200 bg-red-50 rounded-lg">
                <input
                  type="checkbox"
                  onChange={(e) =>
                    setNewRoom({
                      ...newRoom,
                      maintenanceMode: e.target.checked,
                    })
                  }
                />{" "}
                Bật Bảo trì
              </label>
            </div>
            <div>
              <input
                type="file"
                onChange={(e) => handleImageUpload(e, true)}
                className="mb-2 w-full text-sm"
              />
              {newRoom.imageUrl && (
                <img
                  src={newRoom.imageUrl}
                  className="h-32 rounded-lg object-cover w-full"
                  alt="preview"
                />
              )}
            </div>
          </div>
          <button className="mt-4 px-6 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors">
            Lưu Phòng
          </button>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Phòng</th>
              <th className="p-4">Vị trí</th>
              <th className="p-4">Giá</th>
              <th className="p-4">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((r, index) => (
              <tr key={r.id || r._id || index} className="border-b">
                <td className="p-4 font-bold">{r.name}</td>
                <td className="p-4">
                  {r.building} - {r.floor}
                </td>
                <td className="p-4">
                  {r.pricePerHour
                    ? r.pricePerHour.toLocaleString()
                    : r.price || 0}
                  đ/h
                </td>
                <td className="p-4">
                  {r.maintenanceMode ? (
                    <span className="text-red-600 bg-red-50 px-2 py-1 rounded">
                      Bảo trì
                    </span>
                  ) : (
                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded">
                      Hoạt động
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEquipments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Quản lý Tài sản</h2>
          <p className="text-gray-500 mt-1">
            Phân bổ Pool/Serial cho thiết bị mượn trả.
          </p>
        </div>
        <button
          onClick={() => setShowEqForm(!showEqForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-colors"
        >
          <Plus className="w-5 h-5" /> Thêm Thiết bị
        </button>
      </div>

      {showEqForm && (
        <form
          onSubmit={handleAddEquipment}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
        >
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Tên thiết bị..."
                className="w-full p-2 border rounded-lg"
                onChange={(e) => setNewEq({ ...newEq, name: e.target.value })}
              />
              <select
                className="w-full p-2 border rounded-lg"
                onChange={(e) =>
                  setNewEq({ ...newEq, managementType: e.target.value })
                }
              >
                <option value="pool">Quản lý số lượng (Pool)</option>
                <option value="serial">Quản lý Serial (Đơn chiếc)</option>
              </select>
              {newEq.managementType === "serial" && (
                <input
                  type="text"
                  placeholder="Số Serial"
                  className="w-full p-2 border rounded-lg"
                  onChange={(e) =>
                    setNewEq({ ...newEq, serialNumber: e.target.value })
                  }
                />
              )}
            </div>
            <div className="space-y-4">
              <input
                type="number"
                placeholder="Tổng số lượng"
                className="w-full p-2 border rounded-lg"
                onChange={(e) =>
                  setNewEq({
                    ...newEq,
                    totalQuantity: parseInt(e.target.value),
                  })
                }
              />
              <input
                type="number"
                placeholder="Báo động bảo trì (Giờ)"
                className="w-full p-2 border rounded-lg"
                onChange={(e) =>
                  setNewEq({
                    ...newEq,
                    maintenanceAlertHours: parseInt(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <input
                type="file"
                onChange={(e) => handleImageUpload(e, false)}
                className="mb-2 w-full text-sm"
              />
              {newEq.imageUrl && (
                <img
                  src={newEq.imageUrl}
                  className="h-32 rounded-lg object-cover w-full"
                  alt="preview"
                />
              )}
            </div>
          </div>
          <button className="mt-4 px-6 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors">
            Lưu Thiết bị
          </button>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Thiết bị</th>
              <th className="p-4">Phân loại</th>
              <th className="p-4">Kho (Còn / Tổng)</th>
            </tr>
          </thead>
          <tbody>
            {equipments.map((eq, index) => (
              <tr key={eq.id || eq._id || index} className="border-b">
                <td className="p-4 font-bold">
                  {eq.name} <br />
                  <span className="text-xs text-gray-400">
                    {eq.serialNumber}
                  </span>
                </td>
                <td className="p-4">
                  {eq.managementType === "pool" ? "Số lượng" : "Serial"}
                </td>
                <td className="p-4 font-bold text-blue-600">
                  {eq.totalQuantity - eq.inUseQuantity} / {eq.totalQuantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  //   const renderUsers = () => (
  //     //Logic lọc người dùng tự động
  //     <div className="space-y-6">
  //       <div>
  //         <h2 className="text-2xl font-black text-gray-900">Người dùng Hệ thống</h2>
  //         <p className="text-gray-500 mt-1">Quản lý phân quyền và trạng thái hoạt động.</p>
  //       </div>
  //       <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
  //         <table className="w-full text-left text-sm">
  //           <thead className="bg-gray-50 border-b">
  //             <tr><th className="p-4">Tên</th><th className="p-4">Email</th><th className="p-4">Quyền</th><th className="p-4">Trạng thái</th></tr>
  //           </thead>
  //           <tbody>
  //             {usersList.map((u, index) => (
  //               <tr key={u.id || u._id || index} className="border-b">
  //                 <td className="p-4 font-bold">{u.full_name}</td>
  //                 <td className="p-4">{u.email}</td>
  //                 <td className="p-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold text-xs">{u.role}</span></td>
  //                 <td className="p-4">
  //                   {u.is_active ? <span className="text-green-600 font-semibold flex items-center gap-1"><ShieldCheck className="w-4 h-4"/> Hoạt động</span> : "Khóa"}
  //                 </td>
  //               </tr>
  //             ))}
  //           </tbody>
  //         </table>
  //       </div>
  //     </div>
  //   );
  // Hàm xử lý Khóa / Mở khóa tài khoản
  const handleToggleLockUser = async (
    userId: string,
    currentStatus: boolean,
  ) => {
    const actionText = currentStatus ? "khóa" : "mở khóa";
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản này?`))
      return;

    // Cập nhật giao diện ngay lập tức để người dùng thấy thay đổi
    setUsersList((prev) =>
      prev.map((u) =>
        (u.id || u._id) === userId ? { ...u, is_active: !currentStatus } : u,
      ),
    );
    try {
      const response = await fetch(`${API_URL}/auth/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) {
        alert("Lỗi từ server: Không thể cập nhật trạng thái!");
      }
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
    }  

  };

  // Hàm xử lý Xóa vĩnh viễn
  const handleDeleteUser = async (userId: string) => {
    if (
      !window.confirm(
        "Hành động này sẽ XÓA VĨNH VIỄN tài khoản. Bạn có chắc chắn?",
      )
    )
      return;

    // 1. Ẩn tài khoản khỏi bảng ngay lập tức
    setUsersList((prev) => prev.filter((u) => (u.id || u._id) !== userId));

    try {
      const response = await fetch(`${API_URL}/auth/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Lỗi từ server: Không thể xóa tài khoản!");
      }
    } catch (error) {
      console.error("Lỗi xóa tài khoản:", error);
    }
  };;

  const renderUsers = () => {
    // 1. Logic lọc người dùng tự động
    const filteredUsers = usersList.filter((user) => {
      const matchNameEmail =
        user.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearchTerm.toLowerCase());
      const matchRole =
        userRoleFilter === "ALL" || user.role === userRoleFilter;
      const matchStatus =
        userStatusFilter === "ALL" ||
        (userStatusFilter === "ACTIVE" && user.is_active) ||
        (userStatusFilter === "BANNED" && !user.is_active);
      return matchNameEmail && matchRole && matchStatus;
    });

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">
            Người dùng Hệ thống
          </h2>
          <p className="text-gray-500 mt-1">
            Quản lý phân quyền và trạng thái hoạt động.
          </p>
        </div>

        {/* 2. THANH TÌM KIẾM VÀ BỘ LỌC */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc email..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:border-blue-500 outline-none bg-gray-50"
            />
          </div>
          <select
            value={userRoleFilter}
            onChange={(e) => setUserRoleFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-blue-500 bg-gray-50 font-medium text-gray-700"
          >
            <option value="ALL">Tất cả Quyền</option>
          </select>
          <select
            value={userStatusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-blue-500 bg-gray-50 font-medium text-gray-700"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="BANNED">Bị khóa</option>
          </select>
        </div>

        {/* 3. BẢNG DỮ LIỆU ĐÃ ĐƯỢC LỌC */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-bold text-gray-700">Tên</th>
                <th className="p-4 font-bold text-gray-700">Email</th>
                <th className="p-4 font-bold text-gray-700">Quyền</th>
                <th className="p-4 font-bold text-gray-700">Trạng thái</th>
                <th className="p-4 font-bold text-gray-700 text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, index) => (
                <tr
                  key={u.id || u._id || index}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="p-4 font-bold text-gray-900">{u.full_name}</td>
                  <td className="p-4 text-gray-600">{u.email}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs ${u.role === "ADMIN" ? "bg-purple-100 text-purple-700" : u.role === "MANAGER" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.is_active ? (
                      <span className="text-green-600 font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" /> Hoạt động
                      </span>
                    ) : (
                      <span className="text-red-600 font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> Bị khóa
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-3">
                    {/* NÚT KHÓA / MỞ KHÓA */}
                    <button
                      onClick={() =>
                        handleToggleLockUser(u.id || u._id, u.is_active)
                      }
                      className={`${u.is_active ? "text-amber-600" : "text-green-600"} font-bold text-xs hover:underline`}
                    >
                      {u.is_active ? "Khóa" : "Mở khóa"}
                    </button>

                    {/* NÚT XÓA */}
                    <button
                      onClick={() => handleDeleteUser(u.id || u._id)}
                      className="text-red-600 font-bold text-xs hover:underline"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center p-8 text-gray-500 font-medium"
                  >
                    Không tìm thấy người dùng nào khớp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {renderSidebar()}
      <main className="flex-1 overflow-y-auto p-8 lg:p-10">
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeMenu === "dashboard" && renderDashboard()}
              {activeMenu === "rooms" && renderRooms()}
              {activeMenu === "equipments" && renderEquipments()}
              {activeMenu === "users" && renderUsers()}
              {activeMenu === "bookings" && renderBookings()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
