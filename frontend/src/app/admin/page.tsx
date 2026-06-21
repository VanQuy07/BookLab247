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
  ChevronLeft,
  ChevronRight,
  Banknote,
  UserCircle,
  CheckCircle2,
  Tag,
  ClipboardList
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
import { source } from "framer-motion/client";

type MenuTab = "dashboard" | "bookings" | "approval" | "rooms" | "equipments" | "users" | "lookup" | "reports" | "system";
type TimeFilter = "yesterday" | "today" | "7days" | "month";



// ================= INTERFACES (Strict Type) =================
interface ManagerRoom {
  id?: string; _id?: string; title?: string; name?: string;
  building?: string; floor?: string; capacity?: number | string;
  imageUrl?: string; maintenanceMode?: boolean; price?: number; pricePerHour?: number;
}
interface EquipmentItem {
  id?: string; _id?: string; name: string; category?: string;
  managementType?: string; totalQuantity: number; inUseQuantity: number;
  status?: string; roomId?: string; imageUrl?: string; price?: number;
}
interface BorrowedEquipment { id: string; name: string; quantity: number; price: number; }
interface BookingItem {
  id: string; roomId: string; customerName: string; phone: string;
  status: string; startTime: string; durationMins: number; bufferMins: number;
  note: string; equipments?: BorrowedEquipment[]; date?: string;
  paymentStatus?: string;
}
interface MaintenanceLog {
  id: string; type: "room" | "equipment"; itemId: string; itemName: string; reason: string;
  startDate: string; startTime: string; endDate: string; endTime: string;
  status: "pending" | "completed";
  reportedBy: "ADMIN" | "MANAGER"; // <-- YÊU CẦU 2: Phân quyền người báo cáo
}
interface SystemLog {
  id: string; action: string; actor: string; timestamp: string; details: string;
}
interface GlobalShutdown {
  isActive: boolean; startDate: string; endDate: string; reason: string;
}
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

interface ReportLog {
  status: string;
  changedBy: string;
  message: string;
  createdAt: string;
}

interface Report {
  _id: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  roomId?: string;
  roomName?: string;
  equipmentId?: string;
  equipmentName?: string;
  bookingId?: string;
  images?: string[];
  createdBy: string;
  assignedTo?: string;
  logs: ReportLog[];
  comments: any[];
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = [
  { value: "SUBMITTED", label: "Chờ duyệt", color: "bg-blue-100 text-blue-700" },
  { value: "IN_REVIEW", label: "Đang xem xét", color: "bg-yellow-100 text-yellow-700" },
  { value: "APPROVED", label: "Đã duyệt", color: "bg-green-100 text-green-700" },
  { value: "IN_PROGRESS", label: "Đang xử lý", color: "bg-purple-100 text-purple-700" },
  { value: "RESOLVED", label: "Đã xử lý xong", color: "bg-emerald-100 text-emerald-700" },
  { value: "REJECTED", label: "Từ chối", color: "bg-red-100 text-red-700" },
];

const SEVERITY_OPTIONS = [
  { value: "LOW", label: "Thấp", color: "bg-green-100 text-green-700" },
  { value: "MEDIUM", label: "Trung bình", color: "bg-yellow-100 text-yellow-700" },
  { value: "HIGH", label: "Cao", color: "bg-orange-100 text-orange-700" },
  { value: "CRITICAL", label: "Khẩn cấp", color: "bg-red-100 text-red-700" },
];

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
  // State Lịch & Đặt nhanh (Mang từ Manager sang)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [showQuickBook, setShowQuickBook] = useState(false);
  const [quickBookData, setQuickBookData] = useState({
    roomId: "", customerName: "", phone: "", startDate: selectedDate, startTime: "08:00", endDate: selectedDate, endTime: "10:00", note: "", equipments: {} as Record<string, any>
  });

  // State Bảo trì & Tra cứu
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [maintenanceModal, setMaintenanceModal] = useState({
    isOpen: false, type: "room", itemId: "", itemName: "", reason: "", startDate: selectedDate, startTime: "08:00", endDate: selectedDate, endTime: "17:00"
  });
  const [lookupTab, setLookupTab] = useState<"customer" | "room" | "equipment">("customer");
  const [lookupSearch, setLookupSearch] = useState<string>("");
  const [customerNotes, setCustomerNotes] = useState<Record<string, { tags: string[], note: string }>>({});
  const [viewingCustomer, setViewingCustomer] = useState<any | null>(null);

  // State Lõi Hệ Thống (Yêu cầu 3 & 4)
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [globalShutdown, setGlobalShutdown] = useState<GlobalShutdown>({
    isActive: false, startDate: "", endDate: "", reason: ""
  });
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<MenuTab>("dashboard");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);



  // ================= STATES BỔ SUNG CHO TIMELINE & QUICK BOOK =================
  const [currentTime, setCurrentTime] = useState(new Date());
  const [buildingFilter, setBuildingFilter] = useState<string>("all");
  const [roomSearchQuery, setRoomSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  // ================= STATE BỘ LỌC THỜI GIAN =================
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");

  // ================= STATE DỮ LIỆU TỔNG QUAN THẬT =================
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalLabs: 0,
    totalEquipments: 0,
    inUseEquipments: 0,
    userRolesData: [] as any[],
    equipmentStatusData: [] as any[],
    popular_labs_data: [] as any[],
  });

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
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingEqId, setEditingEqId] = useState<string | null>(null);
  const [viewingRoom, setViewingRoom] = useState<any | null>(null);
  const [viewingEq, setViewingEq] = useState<any | null>(null);

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
  const [bookings, setBookings] = useState<any[]>([]);
  const [fixedBookings, setFixedBookings] = useState<any[]>([]);
  // Xác định Role để phân quyền UI (Lấy từ LocalStorage)
  const [userRole, setUserRole] = useState<string>("ADMIN");

  useEffect(() => {
    // Sửa lại "role" thành key lưu role trong hệ thống của bạn nếu khác
    const savedRole = localStorage.getItem("role") || localStorage.getItem("user_role") || "ADMIN"; 
    setUserRole(savedRole.toUpperCase());
  }, []);

  // STATES BÁO CÁO SỰ CỐ
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [assignName, setAssignName] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [pendingAssignId, setPendingAssignId] = useState<string | null>(null);

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
    roomId: "",
    pricePerHour: 0
  });

  // ================= FETCH DATA =================
  //const API_URL = "http://localhost:8000/api/v1";
  //const API_URL = "https://booklab247.onrender.com/api/v1";
  //const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1`;
  const API_URL = "https://booklab247.onrender.com/api/v1";
  useEffect(() => {
    fetchData();
    // Chạy đồng hồ hệ thống mỗi 60 giây để vạch kẻ đỏ Timeline nhảy theo giờ thực
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // const fetchData = async () => {
  //   setLoading(true);
  //   try {
  //     if (activeMenu === "dashboard") {
  //       // [SỬA LỖI]: Bắt buộc phải kéo dữ liệu cho Dashboard thay vì return
  //       const [usersRes, labsRes, eqRes] = await Promise.all([
  //         fetch(`${API_URL}/auth/users`),
  //         fetch(`${API_URL}/labs`),
  //         fetch(`${API_URL}/equipments`),
  //       ]);

  //       const users = await usersRes.json();
  //       const labs = await labsRes.json();
  //       const eqs = await eqRes.json();

  //       // Tính toán số liệu thống kê thật để gán vào Dashboard
  //       setDashboardStats({
  //         totalUsers: users.length || 0,
  //         totalLabs: labs.length || 0,
  //         totalEquipments: eqs.reduce(
  //           (sum: number, eq: any) => sum + eq.totalQuantity,
  //           0,
  //         ),
  //         inUseEquipments: eqs.reduce(
  //           (sum: number, eq: any) => sum + eq.inUseQuantity,
  //           0,
  //         ),
  //         userRolesData: [
  //           {
  //             name: "STUDENT",
  //             value: users.filter((u: any) => u.role === "STUDENT").length,
  //           },
  //           {
  //             name: "MANAGER",
  //             value: users.filter((u: any) => u.role === "MANAGER").length,
  //           },
  //           {
  //             name: "ADMIN",
  //             value: users.filter((u: any) => u.role === "ADMIN").length,
  //           },
  //         ],
  //         equipmentStatusData: [], // Giữ nguyên mảng rỗng tạm thời
  //       });
  //     } else if (activeMenu === "rooms") {

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const token = localStorage.getItem("access_token") || "";
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

      const [usersRes, labsRes, eqRes, bkRes, mtRes, fbRes, rpRes] = await Promise.all([
        fetch(`${API_URL}/auth/users`, { headers }),
        fetch(`${API_URL}/labs`, { headers }),
        fetch(`${API_URL}/equipments`, { headers }),
        fetch(`${API_URL}/bookings`, { headers }),
        fetch(`${API_URL}/bookings/maintenance`, { headers }).catch(() => null),
        fetch(`${API_URL}/bookings/fixed`, { headers }).catch(() => null),
        fetch(`${API_URL}/reports/`, { headers }).catch(() => null)
      ]);

      if (usersRes.ok) setUsersList(await usersRes.json());

      // CHUẨN HÓA ID PHÒNG VÀ THIẾT BỊ
      if (labsRes.ok) {
        const data = await labsRes.json();
        setRooms(data.map((r: any) => ({ ...r, id: r.id || r._id })));
      }

      if (eqRes.ok) {
        const data = await eqRes.json();
        setEquipments(data.map((e: any) => ({ ...e, id: e.id || e._id })));
      }

      // 1. CHUẨN HÓA DỮ LIỆU ĐẶT PHÒNG (BOOKINGS)
      if (bkRes.ok) {
        const bkData = await bkRes.json();
        const raw = Array.isArray(bkData) ? bkData : bkData.data || [];
        setBookings(raw.map((b: any) => ({
          id: b.id || b._id,
          roomId: b.room_id || b.roomId,
          customerName: b.customer_name || b.customerName,
          phone: b.phone,
          status: b.status,
          date: b.date,
          startTime: b.start_time || b.startTime,
          durationMins: b.duration_mins || b.durationMins || 0,
          bufferMins: b.buffer_mins || b.bufferMins || 15,
          note: b.note || "",
          equipments: b.equipments || [],
          paymentStatus: b.payment_status || b.paymentStatus,
          source: b.source || b.role || b.created_by_role,
        })));
      }

      // 2. CHUẨN HÓA DỮ LIỆU BẢO TRÌ (MAINTENANCE)
      if (mtRes && mtRes.ok) {
        const mtData = await mtRes.json();
        const rawMt = Array.isArray(mtData) ? mtData : mtData.data || [];
        setMaintenanceLogs(rawMt.map((m: any) => ({
          id: m.id || m._id,
          type: m.type,
          itemId: m.item_id || m.itemId,
          itemName: m.item_name || m.itemName,
          reason: m.reason,
          startDate: m.start_date || m.startDate,
          startTime: m.start_time || m.startTime,
          endDate: m.end_date || m.endDate,
          endTime: m.end_time || m.endTime,
          status: m.status,
          reportedBy: m.reportedBy || m.reported_by || "MANAGER"
        })));
      }

      // 3. CHUẨN HÓA DỮ LIỆU LỊCH CỐ ĐỊNH (FIXED BOOKINGS)
      if (fbRes && fbRes.ok) {
        const fbData = await fbRes.json();
        const rawFb = Array.isArray(fbData) ? fbData : fbData.data || [];
        setFixedBookings(rawFb.map((fb: any) => ({
          id: fb.id || fb._id,
          roomId: fb.room_id || fb.roomId,
          title: fb.title,
          status: fb.status,
          startDate: fb.start_date || fb.startDate,
          endDate: fb.end_date || fb.endDate,
          startTime: fb.start_time || fb.startTime,
          endTime: fb.end_time || fb.endTime,
          daysOfWeek: fb.days_of_week || fb.daysOfWeek || [],
          exceptionDates: fb.exception_dates || fb.exceptionDates || []
        })));
      }
      // 4. CHUẨN HÓA DỮ LIỆU BÁO CÁO
      if (rpRes && rpRes.ok) {
        const rpData = await rpRes.json();
        setReports(Array.isArray(rpData) ? rpData : []);
      }
    } catch (err) {
      console.error("Lỗi fetch data:", err);
    }
    if (!isSilent) setLoading(false);
  };

  // ================= UTILS THỜI GIAN =================
  const timeToMins = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const minsToTime = (mins: number) => {
    const h = Math.floor(mins / 60) % 24;
    const m = Math.floor(mins % 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split("T")[0]);
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

  // const handleAddRoom = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   try {
  //     const res = await fetch(`${API_URL}/labs`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(newRoom),
  //     });
  //     const data = await res.json();
  //     setRooms([...rooms, data]);
  //     setShowRoomForm(false);
  //     alert("Thêm phòng thành công!");
  //   } catch (err) {
  //     alert("Lỗi thêm phòng");
  //   }
  // };

  // const handleAddEquipment = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   try {
  //     const res = await fetch(`${API_URL}/equipments`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(newEq),
  //     });
  //     const data = await res.json();
  //     setEquipments([...equipments, data]);
  //     setShowEqForm(false);
  //     alert("Thêm thiết bị thành công!");
  //   } catch (err) {
  //     alert("Lỗi thêm thiết bị");
  //   }
  // };


  const handleSubmitRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingRoomId;
    const url = isEdit ? `${API_URL}/labs/${editingRoomId}` : `${API_URL}/labs`;
    const method = isEdit ? "PUT" : "POST";
    const payload = { ...newRoom, imageUrl: newRoom.imageUrl || "" };

    try {
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert(isEdit ? "Cập nhật phòng thành công!" : "Thêm phòng thành công!");
        setShowRoomForm(false);
        setEditingRoomId(null);
        fetchData(true);
      } else {
        const errData = await res.json();
        alert("⚠️ Lỗi từ Backend: " + JSON.stringify(errData));
      }
    } catch (err) { alert("Lỗi mạng! Vui lòng kiểm tra lại kết nối Backend."); }
  };

  const handleEditRoom = (room: any) => {
    const exactId = room.id || (room._id && room._id.$oid) || room._id;
    setEditingRoomId(exactId);
    setNewRoom({
      name: room.name || "", building: room.building || "", floor: room.floor || "", type: room.type || "Phòng Thực hành",
      capacity: room.capacity || 0, pricePerHour: room.pricePerHour || room.price || 0, bufferTimeMinutes: room.bufferTimeMinutes || 15,
      maintenanceMode: room.maintenanceMode || false, defaultAmenities: room.defaultAmenities || "", imageUrl: room.imageUrl || ""
    });
    setShowRoomForm(true);
  };

  const handleDeleteRoom = async (id: string) => {
    if (!id) { alert("Lỗi: Không tìm thấy ID phòng!"); return; }
    if (!confirm("Bạn có chắc chắn muốn xóa phòng này?")) return;
    try {
      const res = await fetch(`${API_URL}/labs/${id}`, { method: "DELETE" });
      if (res.ok) fetchData(true);
      else alert("⚠️ Không thể xóa. Vui lòng kiểm tra lại Backend.");
    } catch (err) { alert("Lỗi mạng khi xóa phòng!"); }
  };

  const handleSubmitEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!editingEqId;
    const url = isEdit ? `${API_URL}/equipments/${editingEqId}` : `${API_URL}/equipments`;
    const method = isEdit ? "PUT" : "POST";
    const payload = { ...newEq, imageUrl: newEq.imageUrl || "" };

    try {
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert(isEdit ? "Cập nhật thiết bị thành công!" : "Thêm thiết bị thành công!");
        setShowEqForm(false);
        setEditingEqId(null);
        fetchData(true);
      } else {
        const errData = await res.json();
        alert("⚠️ Lỗi từ Backend: " + JSON.stringify(errData));
      }
    } catch (err) { alert("Lỗi mạng! Vui lòng kiểm tra lại kết nối Backend."); }
  };

  const handleEditEquipment = (eq: any) => {
    const exactId = eq.id || (eq._id && eq._id.$oid) || eq._id;
    setEditingEqId(exactId);
    setNewEq({
      name: eq.name || "", category: eq.category || "Chung", managementType: eq.managementType || "pool",
      serialNumber: eq.serialNumber || "", totalQuantity: eq.totalQuantity || 0, inUseQuantity: eq.inUseQuantity || 0,
      status: eq.status || "available", maintenanceAlertHours: eq.maintenanceAlertHours || 0, imageUrl: eq.imageUrl || "",
      roomId: eq.roomId || "", pricePerHour: eq.pricePerHour || eq.price || 0
    });
    setShowEqForm(true);
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!id) { alert("Lỗi: Không tìm thấy ID thiết bị!"); return; }
    if (!confirm("Bạn có chắc chắn muốn xóa thiết bị này?")) return;
    try {
      const res = await fetch(`${API_URL}/equipments/${id}`, { method: "DELETE" });
      if (res.ok) fetchData(true);
      else alert("⚠️ Không thể xóa. Vui lòng kiểm tra lại Backend.");
    } catch (err) { alert("Lỗi mạng khi xóa thiết bị!"); }
  };

  // ================= UTILS CHO QUẢN LÝ THIẾT BỊ ĐẶT NHANH =================
  const calculateTotalCost = () => {
    const startObj = new Date(`${quickBookData.startDate}T${quickBookData.startTime}`);
    const endObj = new Date(`${quickBookData.endDate}T${quickBookData.endTime}`);
    const diffMins = Math.max(0, (endObj.getTime() - startObj.getTime()) / 60000);
    const selectedRoom = rooms.find((r) => (r.id || r._id) === quickBookData.roomId);
    const roomPrice = Number(selectedRoom?.pricePerHour || selectedRoom?.price || 0);
    const roomTotal = (diffMins / 60) * roomPrice;
    const eqTotal = Object.values(quickBookData.equipments).reduce((sum, eq) => sum + eq.price * eq.quantity, 0);
    return roomTotal + eqTotal;
  };

  const toggleEquipment = (eqId: string, eqName: string, available: number, price: number) => {
    const currentEqs = { ...quickBookData.equipments };
    if (currentEqs[eqId]) delete currentEqs[eqId];
    else currentEqs[eqId] = { name: eqName, quantity: 1, max: available, price };
    setQuickBookData({ ...quickBookData, equipments: currentEqs });
  };

  const updateEqQuantity = (eqId: string, delta: number) => {
    const currentEqs = { ...quickBookData.equipments };
    if (currentEqs[eqId]) {
      const nextQty = currentEqs[eqId].quantity + delta;
      if (nextQty >= 1 && nextQty <= currentEqs[eqId].max) {
        currentEqs[eqId].quantity = nextQty;
        setQuickBookData({ ...quickBookData, equipments: currentEqs });
      }
    }
  };

  // ================= XỬ LÝ ĐỒNG BỘ SỐ LƯỢNG THIẾT BỊ TỒN KHO =================
  const syncEquipmentStock = async (equipmentsToSync: BorrowedEquipment[], action: "borrow" | "return") => {
    const token = localStorage.getItem("access_token");
    if (!equipmentsToSync || equipmentsToSync.length === 0) return;

    for (const borrowed of equipmentsToSync) {
      const eqId = borrowed.id;
      // Tìm thiết bị trong state hiện tại
      const currentEq = equipments.find(e => (e.id || e._id) === eqId);

      if (currentEq) {
        // action === "borrow": Khách mượn -> Tăng số lượng đang dùng (Trừ kho)
        // action === "return": Khách trả -> Giảm số lượng đang dùng (Cộng lại kho)
        const qtyChange = action === "borrow" ? Number(borrowed.quantity) : -Number(borrowed.quantity);
        const newInUse = Math.max(0, (currentEq.inUseQuantity || 0) + qtyChange); // Đảm bảo không bị âm

        try {
          await fetch(`${API_URL}/equipments/${eqId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...currentEq, inUseQuantity: newInUse })
          });
        } catch (e) {
          console.error("Lỗi đồng bộ kho cho thiết bị:", eqId, e);
        }
      }
    }
  };

  // ================= XỬ LÝ FORM ĐẶT NHANH =================
  const handleQuickBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const startDateTime = new Date(
      `${quickBookData.startDate}T${quickBookData.startTime}`,
    );
    const endDateTime = new Date(
      `${quickBookData.endDate}T${quickBookData.endTime}`,
    );

    const durationMins =
      (endDateTime.getTime() - startDateTime.getTime()) / 60000;

    if (durationMins <= 30)
      return alert(
        "⛔ LỖI:\nThời gian đặt phòng tối thiểu phải từ 30 phút trở lên!",
      );

    const now = new Date();
    if (startDateTime < now) {
      return alert("⛔ LỖI THỜI GIAN:\nKhông thể đặt lịch ở quá khứ.");
    }

    const targetId = quickBookData.roomId;
    if (!targetId) return alert("Vui lòng chọn phòng!");

    const newStartMs = startDateTime.getTime();
    const newEndMsWithBuffer = endDateTime.getTime() + 15 * 60000;

    const roomBookings = bookings.filter((b) => b.roomId === targetId);
    for (const exist of roomBookings) {
      const existDate = exist.date || quickBookData.startDate;
      const existStartMs = new Date(
        `${existDate}T${exist.startTime}`,
      ).getTime();
      const existEndMsWithBuffer =
        existStartMs + (exist.durationMins + exist.bufferMins) * 60000;

      if (
        newStartMs < existEndMsWithBuffer &&
        newEndMsWithBuffer > existStartMs
      ) {
        return alert(
          `⛔ LỖI TRÙNG LỊCH!\nPhòng đã có khách [${exist.customerName}] đặt vào khoảng thời gian này.`,
        );
      }
    }

    const borrowedEquipments: BorrowedEquipment[] = Object.entries(
      quickBookData.equipments,
    ).map(([id, data]) => ({
      id,
      name: data.name,
      quantity: data.quantity,
      price: data.price,
    }));

    // LỖI 1A: KIỂM TRA TRÙNG VỚI LỊCH CỐ ĐỊNH Ở FRONTEND
    const targetDayOfWeek = startDateTime.getDay();
    const isConflictFixed = fixedBookings.some(fb => {
      if (fb.roomId !== targetId || fb.status !== "active") return false;
      if (fb.exceptionDates?.includes(quickBookData.startDate)) return false;
      if (!fb.daysOfWeek.includes(targetDayOfWeek)) return false;
      if (quickBookData.startDate < fb.startDate || quickBookData.startDate > fb.endDate) return false;
      const fStartMs = new Date(`${quickBookData.startDate}T${fb.startTime}`).getTime();
      const fEndMs = new Date(`${quickBookData.startDate}T${fb.endTime}`).getTime();
      return newStartMs < fEndMs && newEndMsWithBuffer > fStartMs;
    });

    if (isConflictFixed) return alert("⛔ LỖI TRÙNG LỊCH!\nPhòng đang có Lịch cố định hoạt động vào khung giờ này.");

    // LỖI 3C: KIỂM TRA TRÙNG VỚI LỊCH BẢO TRÌ CỦA PHÒNG
    const isConflictMaintenance = maintenanceLogs.some(mt => {
      if (mt.type === "room" && mt.itemId === targetId && mt.status !== "completed") {
        if (quickBookData.startDate >= mt.startDate && quickBookData.startDate <= mt.endDate) {
          const mtStartMs = new Date(`${quickBookData.startDate}T${mt.startTime}`).getTime();
          const mtEndMs = new Date(`${quickBookData.startDate}T${mt.endTime}`).getTime();
          return newStartMs < mtEndMs && newEndMsWithBuffer > mtStartMs;
        }
      }
      return false;
    });
    if (isConflictMaintenance) return alert("⛔ LỖI BẢO TRÌ!\nPhòng đang được Lên lịch Sửa chữa trong khung giờ này. Vui lòng chọn giờ khác!");

    // LỖI 3D: KIỂM TRA TRÙNG BẢO TRÌ THIẾT BỊ MƯỢN KÈM
    const eqConflict = maintenanceLogs.find(mt => {
      if (mt.type === "equipment" && mt.status !== "completed" && quickBookData.equipments[mt.itemId]) {
        if (quickBookData.startDate >= mt.startDate && quickBookData.startDate <= mt.endDate) {
          const mtStartMs = new Date(`${quickBookData.startDate}T${mt.startTime}`).getTime();
          const mtEndMs = new Date(`${quickBookData.startDate}T${mt.endTime}`).getTime();
          return newStartMs < mtEndMs && newEndMsWithBuffer > mtStartMs;
        }
      }
      return false;
    });
    if (eqConflict) return alert(`⛔ LỖI BẢO TRÌ THIẾT BỊ!\nThiết bị [${eqConflict.itemName}] đang được lên lịch sửa chữa trong khung giờ này. Vui lòng bỏ chọn thiết bị này!`);

    const payload = {
      room_id: targetId,
      customer_name: quickBookData.customerName,
      phone: quickBookData.phone,
      date: quickBookData.startDate,
      start_time: quickBookData.startTime,
      duration_mins: durationMins,
      buffer_mins: 15,
      note: quickBookData.note,
      equipments: borrowedEquipments,
      status: "confirmed",
      payment_status: "CHƯA THANH TOÁN",
      source: "ADMIN"
    };

    try {
      const submitBtn = document.getElementById("btn-submit-quickbook") as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Đang lưu...";
      }

      const token = localStorage.getItem("access_token");

      // 1. Tạo đơn mới
      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Lỗi lưu Database");

      const responseData = await response.json();
      const createdId = responseData.data?.id || responseData.id || responseData._id;

      // 2. ÉP CHỐT DUYỆT TRỰC TIẾP
      if (createdId) {
        await fetch(`${API_URL}/bookings/${createdId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: "confirmed" })
        }).catch(() => { });
      }

      // ==============================================================
      // THÊM MỚI TẠI ĐÂY: GỌI HÀM TRỪ KHO THIẾT BỊ NGAY SAU KHI TẠO ĐƠN
      // ==============================================================
      await syncEquipmentStock(borrowedEquipments, "borrow");

      // 3. Tải lại dữ liệu sạch từ Backend và Đóng Modal
      fetchData(true);
      setShowQuickBook(false);
      setQuickBookData({
        ...quickBookData,
        customerName: "",
        phone: "",
        equipments: {},
      });
      alert("✅ Đã lưu ca đặt phòng thành công và TỰ ĐỘNG DUYỆT!");

    } catch (err: any) {
      alert(`⛔ LỖI SERVER:\n${err.message}`);
    } finally {
      const submitBtn = document.getElementById("btn-submit-quickbook") as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = "Xác nhận Check-in & Thanh toán";
      }
    }
  };

  // ================= XỬ LÝ LƯU BẢO TRÌ BẰNG CỜ LÊ =================
  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceModal.reason.trim()) return alert("Vui lòng nhập lý do!");

    const payload = {
      type: maintenanceModal.type, item_id: maintenanceModal.itemId, item_name: maintenanceModal.itemName,
      reason: maintenanceModal.reason, start_date: maintenanceModal.startDate, start_time: maintenanceModal.startTime,
      end_date: maintenanceModal.endDate, end_time: maintenanceModal.endTime, status: "pending", reportedBy: "ADMIN"
    };

    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${API_URL}/bookings/maintenance`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload)
      });
      fetchData(true);
      alert(`✅ Đã lên lịch bảo trì cho: ${maintenanceModal.itemName}`);
      setMaintenanceModal({ ...maintenanceModal, isOpen: false, reason: "" });
    } catch (err) { alert("Lỗi khi lưu lịch bảo trì!"); }
  };

  // ================= XỬ LÝ HỦY 1 NGÀY TRONG LỊCH CỐ ĐỊNH =================
  const handleCancelFixedDate = async (ruleId: string, dateToCancel: string) => {
    if (confirm(`Bạn có chắc muốn HỦY lịch cố định của ngày ${dateToCancel} không?`)) {
      const rule = fixedBookings.find(r => r.id === ruleId);
      if (rule) {
        const currentExceptions = rule.exceptionDates || [];
        if (!currentExceptions.includes(dateToCancel)) {
          const newExceptions = [...currentExceptions, dateToCancel];
          try {
            await fetch(`${API_URL}/bookings/fixed/${ruleId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
              body: JSON.stringify({ ...rule, exception_dates: newExceptions })
            });
            fetchData(true);
            alert(`Đã hủy thành công ca cố định ngày ${dateToCancel}`);
          } catch (e) { alert("Lỗi khi hủy lịch cố định!"); }
        }
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  // ================= 9. BÁO CÁO SỰ CỐ =================
  const updateReportStatus = async (reportId: string, status: string, message: string = "") => {
    try {
      const res = await fetch(`${API_URL}/reports/${reportId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token") || "admin"}` },
        body: JSON.stringify({ status, changedBy: localStorage.getItem("user_name") || "ADMIN", message: message || `Đổi trạng thái thành ${status}` }),
      });
      if (!res.ok) throw new Error("Lỗi cập nhật trạng thái");
      
      fetchData(true);
      if (selectedReport?._id === reportId) {
        const updated = reports.find(r => r._id === reportId);
        if (updated) setSelectedReport({ ...updated, status });
      }
    } catch (error) {
      alert("Lỗi cập nhật trạng thái");
    }
  };

  const handleAssignReport = async () => {
    if (!pendingAssignId || !assignName.trim()) return alert("Vui lòng nhập tên người xử lý");
    try {
      const res = await fetch(`${API_URL}/reports/${pendingAssignId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token") || "admin"}` },
        body: JSON.stringify({ assignedTo: assignName, changedBy: localStorage.getItem("user_name") || "ADMIN" }),
      });
      if (!res.ok) throw new Error("Lỗi giao việc");
      
      alert("Giao việc thành công");
      setShowAssignModal(false);
      setAssignName("");
      setPendingAssignId(null);
      fetchData(true);
    } catch (error) {
      alert("Có lỗi xảy ra khi giao việc");
    }
  };

  const handleDeleteReportAdmin = async (reportId: string) => {
    if (userRole !== "ADMIN") return;
    if (confirm("ĐẶC QUYỀN ADMIN: Bạn có chắc chắn muốn xóa vĩnh viễn báo cáo này khỏi hệ thống?")) {
      try {
        const res = await fetch(`${API_URL}/reports/${reportId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
        });
        if (!res.ok) throw new Error("Lỗi xóa");
        
        // Cập nhật UI
        setReports(prev => prev.filter(r => r._id !== reportId));
        setSelectedReport(null);
        alert("✅ Đã xóa báo cáo rác thành công!");
      } catch (e) {
        alert("⛔ Lỗi khi xóa báo cáo!");
      }
    }
  };
  
  const renderReports = () => {
    const getStatusInfo = (status: string) => STATUS_OPTIONS.find(s => s.value === status) || { label: status, color: "bg-gray-100 text-gray-700" };
    const getSeverityInfo = (severity: string) => SEVERITY_OPTIONS.find(s => s.value === severity) || { label: severity, color: "bg-gray-100 text-gray-700" };

    const filteredReports = reports.filter(r => {
      if (filterStatus !== "ALL" && r.status !== filterStatus) return false;
      if (filterSeverity !== "ALL" && r.severity !== filterSeverity) return false;
      return true;
    });

    const stats = {
      total: reports.length,
      pending: reports.filter(r => r.status === "SUBMITTED").length,
      inProgress: reports.filter(r => ["IN_REVIEW", "APPROVED", "IN_PROGRESS"].includes(r.status)).length,
      resolved: reports.filter(r => ["RESOLVED", "REJECTED"].includes(r.status)).length,
      critical: reports.filter(r => r.severity === "CRITICAL" && r.status !== "RESOLVED" && r.status !== "REJECTED").length,
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Quản lý báo cáo sự cố</h2>
          <p className="text-gray-500 mt-1">Duyệt và xử lý báo cáo từ người dùng.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5 text-gray-400" /><span className="text-sm text-gray-500 font-bold">Tổng số</span></div>
            <p className="text-2xl font-black text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2"><Clock className="w-5 h-5 text-blue-500" /><span className="text-sm text-blue-600 font-bold">Chờ duyệt</span></div>
            <p className="text-2xl font-black text-blue-700">{stats.pending}</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2"><UserCircle className="w-5 h-5 text-purple-500" /><span className="text-sm text-purple-600 font-bold">Đang xử lý</span></div>
            <p className="text-2xl font-black text-purple-700">{stats.inProgress}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 border border-red-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5 text-red-500" /><span className="text-sm text-red-600 font-bold">Khẩn cấp</span></div>
            <p className="text-2xl font-black text-red-700">{stats.critical}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-5 h-5 text-green-500" /><span className="text-sm text-green-600 font-bold">Đã xử lý</span></div>
            <p className="text-2xl font-black text-green-700">{stats.resolved}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 flex flex-wrap items-center gap-4 shadow-sm">
          <span className="text-sm font-bold text-gray-500">Bộ lọc:</span>
          <select className="border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm font-bold outline-none" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="ALL">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <select className="border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm font-bold outline-none" value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
            <option value="ALL">Tất cả mức độ</option>
            {SEVERITY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <div className="ml-auto text-sm text-gray-500 font-medium">Hiển thị {filteredReports.length} / {reports.length} báo cáo</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {filteredReports.length === 0 ? (
                <div className="p-12 text-center text-gray-500">Không có báo cáo nào</div>
              ) : (
                filteredReports.map(report => {
                  const statusInfo = getStatusInfo(report.status);
                  const severityInfo = getSeverityInfo(report.severity);
                  const isSelected = selectedReport?._id === report._id;

                  return (
                    <div key={report._id} className={`p-4 cursor-pointer transition-colors ${isSelected ? "bg-blue-50 border-l-4 border-blue-500" : "hover:bg-gray-50 border-l-4 border-transparent"}`} onClick={() => setSelectedReport(report)}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{report.title}</h3>
                          <p className="text-sm text-gray-500 font-medium mt-1">{report.type === "ROOM" ? "📍" : "🔧"} {report.roomName || report.equipmentName || "-"}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${severityInfo.color}`}>{severityInfo.label}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs font-medium text-gray-400 mt-2">
                        <span>👤 Người báo: <span className="font-bold text-gray-600">{report.createdBy}</span></span>
                        <span>📅 {new Date(report.createdAt).toLocaleDateString("vi-VN")}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            {selectedReport ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sticky top-6">
                <h2 className="font-black text-lg text-gray-900 mb-4">Chi tiết báo cáo</h2>
                <div className="flex gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider ${getSeverityInfo(selectedReport.severity).color}`}>{getSeverityInfo(selectedReport.severity).label}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusInfo(selectedReport.status).color}`}>{getStatusInfo(selectedReport.status).label}</span>
                </div>
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tiêu đề</p>
                    <p className="font-black text-gray-900 mt-1">{selectedReport.title}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mô tả</p>
                    <p className="text-sm font-medium text-gray-700 mt-1">{selectedReport.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Loại</p>
                      <p className="text-sm font-bold text-gray-800 mt-1">{selectedReport.type === "ROOM" ? "📍 Phòng" : "🔧 Thiết bị"}</p>
                      <p className="text-xs text-gray-500 font-medium">{selectedReport.roomName || selectedReport.equipmentName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Người xử lý</p>
                      <p className="text-sm font-bold text-blue-600 mt-1">{selectedReport.assignedTo || "Chưa phân công"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <p className="text-sm font-black text-gray-700 uppercase tracking-wider">Thao tác xử lý</p>
                  
                  <button onClick={() => { setPendingAssignId(selectedReport._id); setAssignName(""); setShowAssignModal(true); }} className="w-full px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-colors">
                    Phân công kỹ thuật
                  </button>
                  
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mt-2">
                    <p className="text-xs font-bold text-gray-500 mb-2">Đổi trạng thái:</p>
                    <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-bold outline-none" value={selectedReport.status} onChange={(e) => updateReportStatus(selectedReport._id, e.target.value)}>
                      {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>

                  {/* ĐẶC QUYỀN CỦA ADMIN */}
                  <div className="mt-6 p-4 bg-slate-900 rounded-xl border border-slate-700 shadow-inner">
                      <p className="text-xs font-black text-emerald-400 uppercase flex items-center gap-2 mb-3">
                          <ShieldCheck className="w-4 h-4" /> Đặc quyền Admin
                      </p>
                      <div className="flex gap-3">
                          <button 
                              onClick={() => handleDeleteReportAdmin(selectedReport._id)}
                              className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1"
                          >
                              <Trash2 className="w-4 h-4" /> Xóa hẳn
                          </button>
                          <button 
                              onClick={() => updateReportStatus(selectedReport._id, "RESOLVED", "Admin đã can thiệp đóng Case.")}
                              className="flex-1 px-3 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1"
                          >
                              <CheckCircle2 className="w-4 h-4" /> Force Đóng
                          </button>
                      </div>
                  </div>
                </div>

                {selectedReport.logs && selectedReport.logs.length > 0 && (
                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <p className="text-sm font-black text-gray-700 mb-3">Lịch sử xử lý</p>
                    <div className="space-y-3 max-h-40 overflow-y-auto">
                      {selectedReport.logs.map((log, idx) => (
                        <div key={idx} className="flex gap-3 relative">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0 relative z-10"></div>
                          {idx !== selectedReport.logs.length - 1 && <div className="absolute left-1 top-3 bottom-[-15px] w-px bg-gray-200"></div>}
                          <div className="flex-1 pb-2">
                            <p className="text-sm font-bold text-gray-800">{log.message || log.status}</p>
                            <p className="text-[10px] font-medium text-gray-400 mt-0.5">👤 <span className="font-bold">{log.changedBy}</span> - {new Date(log.createdAt).toLocaleString("vi-VN")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center min-h-[300px] flex items-center justify-center">
                <p className="text-gray-500 font-medium">Chọn một báo cáo bên trái để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
          { id: "bookings", icon: CalendarDays, label: "Lịch Điều phối" },
          { id: "approval", icon: CheckCircle2, label: "Duyệt đơn " },
          { id: "rooms", icon: DoorOpen, label: "Phòng Thực hành" },
          { id: "equipments", icon: Cpu, label: "Thiết bị" },
          { id: "users", icon: Users, label: "Người dùng" },
          { id: "lookup", icon: Search, label: "Tra cứu Thông tin" },
          { id: "reports", icon: ClipboardList, label: "Báo cáo sự cố" },
          { id: "system", icon: ShieldAlert, label: "System & Audit Logs" },
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
    const startHour = 0;
    const endHour = 24;
    const totalMins = 24 * 60; // Khung nhìn 1440 phút (Đủ 24 tiếng)

    // Tạo Timestamp cho ngày đang chọn để bắt khoảng thời gian xem (View Port)
    const viewStartMs = new Date(`${selectedDate}T00:00:00`).getTime();
    const viewEndMs = viewStartMs + 24 * 60 * 60 * 1000;

    const uniqueBuildings = Array.from(
      new Set(rooms.map((r) => r.building || "Khác")),
    ).filter(Boolean);

    // CHỈ hiển thị những phòng có lịch đặt lẻ HOẶC lịch cố định trong ngày đang chọn
    // const filteredRooms = rooms.filter((room) => {
    //   const roomIdStr = room.id || room._id || "";

    //   // 1. Kiểm tra Lịch đặt lẻ
    //   const hasNormalBooking = bookings.some((b) => {
    //     if (b.roomId !== roomIdStr || b.status === "cancelled") return false;
    //     const existDate = b.date || selectedDate;
    //     const bStartMs = new Date(`${existDate}T${b.startTime}`).getTime();
    //     const bEndMsWithBuffer = bStartMs + (b.durationMins + b.bufferMins) * 60000;
    //     return bStartMs < viewEndMs && bEndMsWithBuffer > viewStartMs;
    //   });

    //   // 2. Kiểm tra Lịch cố định (SỬA LỖI 1)
    //   const hasFixedBooking = fixedBookings.some((fb) => {
    //     if (fb.roomId !== roomIdStr || fb.status !== "active") return false;
    //     const currentDayNum = new Date(selectedDate + "T00:00:00").getDay();
    //     const isException = fb.exceptionDates?.includes(selectedDate); // Bỏ qua nếu ngày này đã bị xóa
    //     return !isException &&
    //            fb.daysOfWeek.includes(currentDayNum) && 
    //            selectedDate >= fb.startDate && 
    //            selectedDate <= fb.endDate;
    //   });

    //   // Nếu phòng không có đơn lẻ VÀ cũng không có lịch cố định -> Ẩn đi
    //   if (!hasNormalBooking && !hasFixedBooking) return false;

    //   if (buildingFilter !== "all" && (room.building || "Khác") !== buildingFilter) return false;
    //   return true;
    // });
    // ADMIN CẦM QUYỀN CAO NHẤT: HIỂN THỊ TOÀN BỘ PHÒNG BẤT CHẤP CÓ LỊCH HAY KHÔNG
    // CHỈ HIỂN THỊ NHỮNG PHÒNG CÓ LỊCH ĐẶT LẺ HOẶC LỊCH CỐ ĐỊNH TRONG NGÀY ĐANG CHỌN
    const filteredRooms = rooms.filter((room) => {
      const roomIdStr = room.id || room._id || "";

      // 1. Kiểm tra Lịch đặt lẻ
      const hasNormalBooking = bookings.some((b) => {
        if (b.roomId !== roomIdStr || b.status === "cancelled" || b.status === "rejected") return false;
        const existDate = b.date || selectedDate;
        const bStartMs = new Date(`${existDate}T${b.startTime}`).getTime();
        const bEndMsWithBuffer = bStartMs + (b.durationMins + (b.bufferMins || 0)) * 60000;
        return bStartMs < viewEndMs && bEndMsWithBuffer > viewStartMs;
      });

      // 2. Kiểm tra Lịch cố định
      const hasFixedBooking = fixedBookings.some((fb) => {
        if (fb.roomId !== roomIdStr || fb.status !== "active") return false;
        const currentDayNum = new Date(selectedDate + "T00:00:00").getDay();
        const isException = fb.exceptionDates?.includes(selectedDate); // Bỏ qua nếu ngày này đã bị hủy/xóa
        return !isException &&
          fb.daysOfWeek.includes(currentDayNum) &&
          selectedDate >= fb.startDate &&
          selectedDate <= fb.endDate;
      });

      // Nếu phòng không có đơn lẻ VÀ cũng không có lịch cố định -> Ẩn đi khỏi lưới Timeline
      if (!hasNormalBooking && !hasFixedBooking) return false;

      // Áp dụng thêm bộ lọc tòa nhà nếu có
      if (buildingFilter !== "all" && (room.building || "Khác") !== buildingFilter) return false;
      return true;
    });

    const getStatusColor = (status: string) => {
      if (status === "checked-in")
        return "bg-emerald-500 border-emerald-600 text-white shadow-sm";
      if (status === "confirmed")
        return "bg-blue-500 border-blue-600 text-white shadow-sm";
      if (status === "pending")
        return "bg-amber-400 border-amber-500 text-amber-950 shadow-sm";
      return "bg-gray-400 text-white";
    };

    const currentHour = currentTime.getHours();
    const currentMin = currentTime.getMinutes();
    let currentLinePct: number | null = null;

    // Chỉ vẽ thanh đỏ Real-time nếu ngày đang xem là Hôm Nay
    if (selectedDate === new Date().toISOString().split("T")[0]) {
      currentLinePct = ((currentHour * 60 + currentMin) / totalMins) * 100;
    }

    return (
      <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)] relative animate-in fade-in duration-300">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              Lịch Điều Phối Vận Hành
            </h2>
            <p className="text-gray-500 mt-1 flex gap-4 text-sm font-medium">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>{" "}
                Đang dùng
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span> Đã
                duyệt
              </span>
              <span className="text-xs text-gray-400 font-semibold self-center bg-gray-100 px-2.5 py-0.5 rounded-md">
                Đang tự động bóc tách xuyên ngày
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold bg-white outline-none focus:border-emerald-500"
            >
              <option value="all">Tất cả khu vực tòa nhà</option>
              {uniqueBuildings.map((b, i) => (
                <option key={i} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <button
              onClick={() =>
                setSelectedDate(new Date().toISOString().split("T")[0])
              }
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200"
            >
              Hôm nay
            </button>
            <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => changeDate(-1)}
                className="p-2 hover:bg-gray-100 text-gray-500"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-1 text-sm font-bold outline-none cursor-pointer"
              />
              <button
                onClick={() => changeDate(1)}
                className="p-2 hover:bg-gray-100 text-gray-500"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => setShowQuickBook(true)}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4" /> Đặt lịch nhanh
            </button>
          </div>
        </div>

        {/* LƯỚI TIMELINE */}
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-auto relative shadow-sm">
          {/* Mở rộng chiều ngang min-w để 24 tiếng không bị ép dính vào nhau */}
          <div className="min-w-[1600px] h-full flex flex-col relative">
            {currentLinePct !== null && (
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-40 pointer-events-none"
                style={{
                  left: `calc(16rem + ${currentLinePct} * (100% - 16rem) / 100)`,
                }}
              >
                <div className="absolute -top-1 -left-[5px] w-3 h-3 bg-red-500 rotate-45 rounded-sm shadow-sm"></div>
              </div>
            )}

            <div className="flex sticky top-0 z-30 bg-slate-50 border-b border-gray-200 shadow-sm">
              <div className="w-64 shrink-0 sticky left-0 z-40 bg-slate-50 border-r border-gray-200 p-4 font-black text-gray-700">
                Không gian phòng Lab
              </div>
              <div className="flex-1 relative flex">
                {/* Vẽ 24 mốc giờ */}
                {Array.from({ length: 24 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex-1 border-r border-gray-100 p-3 text-xs font-bold text-gray-400 relative box-border"
                  >
                    <span className="absolute -left-3 top-3 bg-slate-50 px-1">
                      {idx.toString().padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
                {/* Mốc 24:00 ở viền cuối cùng */}
                <span className="absolute right-0 top-3 bg-slate-50 px-1 text-xs font-bold text-gray-400 translate-x-1/2">
                  24:00
                </span>
              </div>
            </div>

            {filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-20 text-gray-400">
                <CalendarDays className="w-12 h-12 mb-3 text-gray-200" />
                <p className="font-medium text-sm">
                  Hiện tại không có phòng nào có lịch đặt trùng khớp.
                </p>
              </div>
            ) : (
              filteredRooms.map((room) => {
                const roomIdStr = room.id || room._id || "";

                const roomBookings = bookings.filter((b) => {
                  if (b.roomId !== roomIdStr) return false;
                  if (b.status === "cancelled") return false;
                  const existDate = b.date || selectedDate;
                  const bStartMs = new Date(
                    `${existDate}T${b.startTime}`,
                  ).getTime();
                  const bEndMsWithBuffer =
                    bStartMs + (b.durationMins + b.bufferMins) * 60000;
                  return bStartMs < viewEndMs && bEndMsWithBuffer > viewStartMs;
                });

                return (
                  <div
                    key={roomIdStr}
                    className="flex border-b border-gray-100 group hover:bg-slate-50/50 transition-colors h-24 relative"
                  >
                    <div className="w-64 shrink-0 sticky left-0 z-20 bg-white group-hover:bg-slate-50 border-r border-gray-200 p-4 flex flex-col justify-center">
                      <h3 className="font-bold text-gray-900 leading-tight truncate">
                        {room.title || room.name || "Chưa đặt tên"}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        <MapPin className="w-3 h-3 inline mr-1" />{" "}
                        {room.building || "Tòa khác"} - {room.floor || ""}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        <Users className="w-3 h-3 inline mr-1" /> Sức chứa:{" "}
                        {room.capacity} chỗ
                      </p>
                    </div>

                    <div className="flex-1 relative bg-white">
                      <div className="absolute inset-0 flex pointer-events-none">
                        {Array.from({ length: 24 }).map((_, idx) => (
                          <div
                            key={idx}
                            className="flex-1 border-r border-gray-100/60 border-dashed"
                          ></div>
                        ))}
                      </div>


                      {/* HIỂN THỊ LỊCH CỐ ĐỊNH NẾU KHỚP VỚI NGÀY ĐANG XEM */}
                      {fixedBookings.filter(fb => {
                        if (fb.roomId !== roomIdStr || fb.status !== "active") return false;
                        if (fb.exceptionDates?.includes(selectedDate)) return false; // BỎ QUA NẾU NGÀY NÀY ĐÃ BỊ HỦY
                        const currentDayNum = new Date(selectedDate + "T00:00:00").getDay();
                        return fb.daysOfWeek.includes(currentDayNum) &&
                          selectedDate >= fb.startDate &&
                          selectedDate <= fb.endDate;
                      }).map(fb => {
                        const fStartMins = timeToMins(fb.startTime);
                        const fDuration = timeToMins(fb.endTime) - fStartMins;
                        const fLeftPct = (fStartMins / totalMins) * 100;
                        const fWidthPct = (fDuration / totalMins) * 100;

                        return (
                          <div
                            key={fb.id}
                            onClick={() => handleCancelFixedDate(fb.id, selectedDate)}
                            title="Click để HỦY lớp cố định trong ngày này"
                            className="absolute top-2 bottom-2 bg-purple-600 border border-purple-700 text-white rounded-xl px-3 py-1 overflow-hidden z-10 flex flex-col justify-center shadow-sm cursor-pointer hover:brightness-110 hover:border-red-400"
                            style={{ left: `${fLeftPct}%`, width: `${fWidthPct}%` }}
                          >
                            <p className="text-xs font-black truncate leading-tight flex items-center gap-1">
                              <Lock className="w-3 h-3" /> {fb.title}
                            </p>
                            <p className="text-[10px] opacity-90 truncate font-semibold mt-0.5">
                              {fb.startTime} - {fb.endTime}
                            </p>
                          </div>
                        );
                      })}


                      {roomBookings.map((booking) => {
                        const existDate = booking.date || selectedDate;
                        const bStartMs = new Date(
                          `${existDate}T${booking.startTime}`,
                        ).getTime();
                        const bEndMs = bStartMs + booking.durationMins * 60000;
                        const bBufferEndMs =
                          bEndMs + booking.bufferMins * 60000;

                        const visibleStartMs = Math.max(bStartMs, viewStartMs);
                        const visibleEndMs = Math.min(bEndMs, viewEndMs);

                        let leftPct = 0,
                          widthPct = 0,
                          bufferLeftPct = 0,
                          bufferWidthPct = 0;

                        if (visibleStartMs < visibleEndMs) {
                          leftPct =
                            ((visibleStartMs - viewStartMs) /
                              60000 /
                              totalMins) *
                            100;
                          widthPct =
                            ((visibleEndMs - visibleStartMs) /
                              60000 /
                              totalMins) *
                            100;
                        }

                        const visibleBufferStartMs = Math.max(
                          bEndMs,
                          viewStartMs,
                        );
                        const visibleBufferEndMs = Math.min(
                          bBufferEndMs,
                          viewEndMs,
                        );
                        if (visibleBufferStartMs < visibleBufferEndMs) {
                          bufferLeftPct =
                            ((visibleBufferStartMs - viewStartMs) /
                              60000 /
                              totalMins) *
                            100;
                          bufferWidthPct =
                            ((visibleBufferEndMs - visibleBufferStartMs) /
                              60000 /
                              totalMins) *
                            100;
                        }

                        const trueEndTimeObj = new Date(bEndMs);
                        const endTimeStr = minsToTime(
                          trueEndTimeObj.getHours() * 60 +
                          trueEndTimeObj.getMinutes(),
                        );

                        return (
                          <React.Fragment key={booking.id}>
                            {widthPct > 0 && (
                              <div
                                className={`absolute top-2 bottom-2 ${getStatusColor(
                                  booking.status,
                                )} border rounded-xl px-3 py-1 overflow-hidden z-10 flex flex-col justify-center cursor-pointer hover:brightness-110 transition-all shadow-sm`}
                                style={{
                                  left: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                }}
                                onClick={() => setSelectedBooking(booking)}
                              >
                                <p className="text-xs font-black truncate leading-tight">
                                  {booking.customerName}
                                </p>
                                <p className="text-[10px] opacity-90 truncate font-semibold mt-0.5">
                                  {booking.startTime} - {endTimeStr}
                                </p>
                              </div>
                            )}

                            {bufferWidthPct > 0 && (
                              <div
                                className="absolute top-2 bottom-2 z-0 bg-slate-50 border-y border-r border-slate-200 rounded-r-lg opacity-60 flex items-center justify-center overflow-hidden"
                                style={{
                                  left: `${bufferLeftPct}%`,
                                  width: `${bufferWidthPct}%`,
                                  backgroundImage:
                                    "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.03) 5px, rgba(0,0,0,0.03) 10px)",
                                }}
                              />
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
    // ================= 1. TÍNH TOÁN SỐ LIỆU TỔNG QUAN =================
    const totalUsers = usersList.length;
    const studentCount = usersList.filter((u) => u.role === "STUDENT").length;

    const totalLabs = rooms.length;
    const activeLabs = rooms.filter((r) => !r.maintenanceMode).length;

    const totalEqs = equipments.reduce((sum, eq) => sum + (eq.totalQuantity || 0), 0);
    const inUseEqs = equipments.reduce((sum, eq) => sum + (eq.inUseQuantity || 0), 0);
    const maintenanceEqs = equipments.filter(eq => eq.status === 'maintenance').reduce((sum, eq) => sum + (eq.totalQuantity || 0), 0);
    const availableEqs = totalEqs - inUseEqs - maintenanceEqs;

    // ================= 2. CHUẨN BỊ DỮ LIỆU BIỂU ĐỒ (ĐÃ NÂNG CẤP) =================

    // NÂNG CẤP BIỂU ĐỒ 1: Biểu đồ Cột Chồng (Stacked Bar) theo Danh mục thiết bị
    const eqCategoryMap: Record<string, { name: string, available: number, inUse: number, maintenance: number }> = {};

    equipments.forEach(eq => {
      // Rút gọn tên danh mục cho biểu đồ đỡ bị tràn chữ
      let cat = eq.category || "Khác";
      if (cat.includes("Công nghệ thông tin")) cat = "CNTT";
      if (cat.includes("Điện - Điện tử")) cat = "Điện tử";
      if (cat.includes("Vật tư tiêu hao")) cat = "Tiêu hao";

      if (!eqCategoryMap[cat]) {
        eqCategoryMap[cat] = { name: cat, available: 0, inUse: 0, maintenance: 0 };
      }

      const total = eq.totalQuantity || 0;
      const inUse = eq.inUseQuantity || 0;

      if (eq.status === 'maintenance') {
        eqCategoryMap[cat].maintenance += total;
      } else {
        eqCategoryMap[cat].inUse += inUse;
        eqCategoryMap[cat].available += (total - inUse);
      }
    });
    const equipmentChartData = Object.values(eqCategoryMap);

    // SỬA LỖI BIỂU ĐỒ 2: Xử lý triệt để "Phòng khác"
    const roomBookingCounts: Record<string, number> = {};
    bookings.forEach(b => {
      if (b.status === 'cancelled' || b.status === 'rejected') return;
      const roomId = b.room_id || b.roomId;
      if (roomId) roomBookingCounts[roomId] = (roomBookingCounts[roomId] || 0) + 1;
    });

    const popularLabsData = Object.entries(roomBookingCounts).map(([roomId, count]) => {
      const room = rooms.find(r => (r.id || r._id) === roomId);
      return {
        // Nếu phòng đã bị xóa, hiển thị ID viết tắt để Admin dễ nhận biết thay vì "Phòng khác"
        name: room ? (room.name || room.title) : `Phòng đã xóa (${roomId.substring(0, 4)}...)`,
        value: count
      };
    }).sort((a, b) => b.value - a.value).slice(0, 5); // Lấy Top 5 phòng

    return (
      <div className="space-y-8 pb-10 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-900">Tổng quan Hệ thống</h2>
            <p className="text-gray-500 mt-1">Phân tích dữ liệu vận hành thực tế của BookLab247.</p>
          </div>
        </div>

        {/* THẺ METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 bg-blue-50">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 mb-1">Tổng người dùng</p>
              <h3 className="text-2xl font-black text-gray-900 leading-none mb-2">{totalUsers}</h3>
              <p className="text-xs font-semibold text-gray-400 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /> Bao gồm {studentCount} Sinh viên</p>
            </div>
          </motion.div>

          <motion.div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 bg-emerald-50">
              <DoorOpen className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 mb-1">Tổng phòng Lab</p>
              <h3 className="text-2xl font-black text-gray-900 leading-none mb-2">{totalLabs}</h3>
              <p className="text-xs font-semibold text-gray-400 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /> {activeLabs} phòng đang hoạt động</p>
            </div>
          </motion.div>

          <motion.div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 bg-amber-50">
              <Package className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 mb-1">Tổng thiết bị kho</p>
              <h3 className="text-2xl font-black text-gray-900 leading-none mb-2">{totalEqs}</h3>
              <p className="text-xs font-semibold text-gray-400 flex items-center gap-1">Sẵn sàng {availableEqs} món rảnh</p>
            </div>
          </motion.div>

          <motion.div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 bg-purple-50">
              <Activity className="w-7 h-7 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 mb-1">Thiết bị đang mượn</p>
              <h3 className="text-2xl font-black text-gray-900 leading-none mb-2">{inUseEqs}</h3>
              <p className="text-xs font-semibold text-gray-400 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /> Đang xuất kho {inUseEqs} món</p>
            </div>
          </motion.div>
        </div>

        {/* BIỂU ĐỒ PHÂN TÍCH */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">Phân bố Thiết bị theo Danh mục</h3>
              <p className="text-sm text-gray-500">Thống kê số lượng, tỷ lệ rảnh/bận và rủi ro bảo trì theo từng loại.</p>
            </div>
            <div className="h-72 w-full">
              {equipmentChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">Chưa có thiết bị nào trong kho.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={equipmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                    <RechartsTooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px", fontWeight: 600, color: "#475569" }} />

                    {/* CÁC CỘT XẾP CHỒNG LÊN NHAU (STACKED BAR) */}
                    <Bar dataKey="available" name="Sẵn sàng" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} barSize={45} />
                    <Bar dataKey="inUse" name="Đang mượn" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="maintenance" name="Bảo trì" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          <motion.div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900">Mức độ ưa chuộng</h3>
              <p className="text-sm text-gray-500">Top 5 phòng Lab được đặt nhiều nhất.</p>
            </div>
            <div className="h-72 w-full flex items-center justify-center">
              {popularLabsData.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Chưa có dữ liệu đặt phòng.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={popularLabsData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" labelLine={false}>
                      {popularLabsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px", fontWeight: 600, color: "#475569" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
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
          <h2 className="text-2xl font-black text-gray-900">Quản lý Phòng Lab</h2>
          <p className="text-gray-500 mt-1">Thêm, sửa, xóa và kiểm soát trạng thái phòng Lab.</p>
        </div>
        <button onClick={() => setShowRoomForm(!showRoomForm)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md">
          {showRoomForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />} Thêm Phòng
        </button>
      </div>

      {showRoomForm && (
        <form onSubmit={handleSubmitRoom} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-4">
              <input value={newRoom.name || ""} type="text" placeholder="Tên phòng..." className="w-full p-2 border rounded-lg" onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} />
              <input value={newRoom.building || ""} type="text" placeholder="Tòa nhà (VD: Tòa A)" className="w-full p-2 border rounded-lg" onChange={e => setNewRoom({ ...newRoom, building: e.target.value })} />
              <input value={newRoom.floor || ""} type="text" placeholder="Tầng (VD: Tầng 3)" className="w-full p-2 border rounded-lg" onChange={e => setNewRoom({ ...newRoom, floor: e.target.value })} />
            </div>
            <div className="space-y-4">
              <input value={newRoom.capacity || ""} type="number" placeholder="Sức chứa" className="w-full p-2 border rounded-lg" onChange={e => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) || 0 })} />
              <input value={newRoom.pricePerHour || ""} type="number" placeholder="Giá/Giờ" className="w-full p-2 border rounded-lg" onChange={e => setNewRoom({ ...newRoom, pricePerHour: parseInt(e.target.value) || 0 })} />
              <label className="flex items-center gap-2 text-red-600 font-bold p-2 border border-red-200 bg-red-50 rounded-lg">
                <input checked={newRoom.maintenanceMode} type="checkbox" onChange={e => setNewRoom({ ...newRoom, maintenanceMode: e.target.checked })} /> Bật Bảo trì
              </label>
            </div>
            <div>
              <input type="file" onChange={e => handleImageUpload(e, true)} className="mb-2 w-full text-sm" />
              {newRoom.imageUrl && <img src={newRoom.imageUrl} className="h-32 rounded-lg object-cover w-full" alt="preview" />}
            </div>
          </div>
          <button type="submit" className="mt-4 px-6 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors">
            {editingRoomId ? "Cập nhật Phòng" : "Lưu Phòng"}
          </button>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Thông tin Phòng</th>
              <th className="p-4">Vị trí Phòng</th>
              <th className="p-4">Giá / Giờ</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((r, index) => {
              const roomId = r.id || (r._id && r._id.$oid) || r._id;
              return (
                <tr key={roomId || index} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4 flex items-center gap-4 cursor-pointer hover:bg-blue-50/50 rounded-xl transition-colors" onClick={() => setViewingRoom(r)} title="Nhấn để xem chi tiết phòng">
                    {r.imageUrl ? (
                      <img src={r.imageUrl} alt={r.name} className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200 shadow-sm shrink-0"><ImageIcon className="w-6 h-6 text-gray-400" /></div>
                    )}
                    <div>
                      <div className="font-bold text-gray-900 text-base">{r.name}</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1 font-medium"><Users className="w-3.5 h-3.5" /> Sức chứa: {r.capacity || 0} người</div>
                    </div>
                  </td>
                  <td className="p-4 font-medium text-gray-600">{r.building} - {r.floor}</td>
                  <td className="p-4 font-bold text-blue-600">{(r.pricePerHour || r.price || 0).toLocaleString('vi-VN')}đ</td>
                  <td className="p-4">
                    {r.maintenanceMode ? <span className="text-red-600 bg-red-50 px-2.5 py-1 rounded-md font-bold text-xs border border-red-100">Bảo trì</span> : <span className="text-green-600 bg-green-50 px-2.5 py-1 rounded-md font-bold text-xs border border-green-100">Hoạt động</span>}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => handleEditRoom(r)} className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors" title="Sửa phòng"><Wrench className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteRoom(roomId)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors" title="Xóa phòng"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {viewingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setViewingRoom(null)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            <h3 className="text-2xl font-black text-gray-900 mb-5 border-b border-gray-100 pb-4">Chi tiết Phòng Lab</h3>
            <div className="space-y-5">
              {viewingRoom.imageUrl ? <img src={viewingRoom.imageUrl} alt={viewingRoom.name} className="w-full h-56 object-cover rounded-2xl border border-gray-100 shadow-sm" /> : <div className="w-full h-56 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm"><ImageIcon className="w-12 h-12 text-gray-300" /></div>}
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Tên phòng</p><p className="font-black text-lg text-gray-900 mt-1">{viewingRoom.name}</p></div>
                <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Trạng thái</p><div className="mt-1">{viewingRoom.maintenanceMode ? <span className="text-red-600 bg-red-100 px-2.5 py-1 rounded-md font-bold text-xs">Bảo trì</span> : <span className="text-green-600 bg-green-100 px-2.5 py-1 rounded-md font-bold text-xs">Hoạt động</span>}</div></div>
                <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Vị trí</p><p className="font-bold text-gray-700 mt-1">{viewingRoom.building} - {viewingRoom.floor}</p></div>
                <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Sức chứa</p><p className="font-bold text-gray-700 mt-1">{viewingRoom.capacity || 0} người</p></div>
                <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Giá thuê / Giờ</p><p className="font-black text-blue-600 mt-1">{(viewingRoom.pricePerHour || viewingRoom.price || 0).toLocaleString('vi-VN')}đ</p></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );


  const renderEquipments = () => (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
          <h2 className="text-lg font-bold text-blue-800 flex items-center gap-2 mb-6">
            <Cpu className="w-5 h-5" /> {editingEqId ? "Cập Nhật Thiết Bị" : "Thêm Thiết Bị Mới"}
          </h2>
          <form onSubmit={handleSubmitEquipment} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tên thiết bị *</label>
              <input required value={newEq.name || ""} onChange={e => setNewEq({ ...newEq, name: e.target.value })} type="text" placeholder="VD: Máy chiếu Sony B" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Danh mục</label>
              <select value={newEq.category || "Vật tư tiêu hao"} onChange={e => setNewEq({ ...newEq, category: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all">
                <option value="Điện - Điện tử">Điện - Điện tử</option>
                <option value="Công nghệ thông tin">Công nghệ thông tin</option>
                <option value="Hóa - Sinh">Hóa - Sinh</option>
                <option value="Vật tư tiêu hao">Vật tư tiêu hao</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Trạng thái hoạt động</label>
              <select value={newEq.status || "available"} onChange={e => setNewEq({ ...newEq, status: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all">
                <option value="available">Sẵn sàng sử dụng</option>
                <option value="maintenance">Đang bảo trì</option>
                <option value="liquidated">Đã thanh lý</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Thuộc Phòng Lab</label>
              <select value={newEq.roomId || ""} onChange={e => setNewEq({ ...newEq, roomId: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all">
                <option value="">Để trong kho (Chưa gán phòng)</option>
                {rooms.map(r => <option key={r.id || r._id} value={r.id || r._id}>{r.name} {r.building ? `(${r.building})` : ""}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Giá thuê / Giờ (VNĐ)</label>
              <input type="number" min="0" value={newEq.pricePerHour || ""} onChange={e => setNewEq({ ...newEq, pricePerHour: parseInt(e.target.value) || 0 })} placeholder="VD: 50000" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Số lượng thiết bị *</label>
              <input required type="number" min="1" value={newEq.totalQuantity || ""} onChange={e => setNewEq({ ...newEq, totalQuantity: parseInt(e.target.value) || 1 })} placeholder="VD: 10" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Hình ảnh thiết bị</label>
              <input type="file" onChange={e => handleImageUpload(e, false)} className="mb-3 w-full text-sm border border-gray-200 p-2 rounded-xl bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all" />
              {newEq.imageUrl && <img src={newEq.imageUrl} className="h-40 rounded-xl object-cover w-full border border-gray-200 shadow-sm" alt="preview" />}
            </div>
            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl uppercase tracking-wider transition-colors shadow-md shadow-blue-600/20 mt-4">
              {editingEqId ? "LƯU CẬP NHẬT" : "LƯU THIẾT BỊ"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-black text-gray-900 mb-4 border-b border-gray-100 pb-3">Danh Sách Thiết Bị Toàn Hệ Thống</h2>
          <div className="space-y-3">
            {equipments.map((eq, index) => {
              const eqId = eq.id || (eq._id && eq._id.$oid) || eq._id;
              const matchedRoom = rooms.find(r => (r.id || r._id) === eq.roomId);
              const roomNameDisplay = matchedRoom ? matchedRoom.name : "Để trong kho";
              return (
                <div key={eqId || index} className="p-4 border border-gray-100 rounded-xl flex justify-between items-center hover:shadow-md transition-shadow bg-gray-50/50">
                  <div className="flex items-center gap-4 cursor-pointer hover:bg-blue-50/50 p-2 -ml-2 rounded-xl transition-colors flex-1" onClick={() => setViewingEq(eq)} title="Nhấn để xem chi tiết thiết bị">
                    {eq.imageUrl ? <img src={eq.imageUrl} alt={eq.name} className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm shrink-0" /> : <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200 shadow-sm shrink-0"><ImageIcon className="w-6 h-6 text-gray-400" /></div>}
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{eq.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {eq.status === 'available' ? <span className="bg-green-500 text-white px-2 py-0.5 rounded text-[11px] uppercase font-bold shadow-sm">Available</span> : <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-[11px] uppercase font-bold shadow-sm">Maintenance</span>}
                        <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">Phòng: <span className="font-bold">{roomNameDisplay}</span></span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold border border-blue-200">Số lượng: {eq.totalQuantity || 0}</span>
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold border border-emerald-200">{(eq.pricePerHour || 0).toLocaleString('vi-VN')}đ/h</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditEquipment(eq)} className="p-2.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="Sửa"><Wrench className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteEquipment(eqId)} className="p-2.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              )
            })}
            {equipments.length === 0 && (
              <div className="text-center text-gray-400 py-10 flex flex-col items-center justify-center"><Cpu className="w-10 h-10 mb-3 text-gray-200" /><p className="text-sm font-medium">Chưa có thiết bị nào trong hệ thống.</p></div>
            )}
          </div>
        </div>
      </div>

      {viewingEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setViewingEq(null)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            <h3 className="text-2xl font-black text-gray-900 mb-5 border-b border-gray-100 pb-4 flex items-center gap-2"><Cpu className="w-6 h-6 text-blue-600" /> Chi tiết Thiết bị</h3>
            <div className="space-y-5">
              {viewingEq.imageUrl ? <img src={viewingEq.imageUrl} alt={viewingEq.name} className="w-full h-56 object-cover rounded-2xl border border-gray-100 shadow-sm" /> : <div className="w-full h-56 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm"><ImageIcon className="w-12 h-12 text-gray-300" /></div>}
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="col-span-2 md:col-span-1"><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Tên thiết bị</p><p className="font-black text-lg text-gray-900 mt-1 leading-tight">{viewingEq.name}</p></div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Trạng thái</p>
                  <div className="mt-1">
                    {viewingEq.status === 'available' ? <span className="bg-green-500 text-white px-2.5 py-1 rounded-md font-bold text-xs uppercase shadow-sm">Sẵn sàng</span> : viewingEq.status === 'maintenance' ? <span className="bg-amber-500 text-white px-2.5 py-1 rounded-md font-bold text-xs uppercase shadow-sm">Bảo trì</span> : <span className="bg-gray-500 text-white px-2.5 py-1 rounded-md font-bold text-xs uppercase shadow-sm">Thanh lý</span>}
                  </div>
                </div>
                <div className="col-span-2"><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Vị trí hiện tại</p><p className="font-bold text-blue-600 mt-1 text-base">{rooms.find(r => (r.id || r._id) === viewingEq.roomId)?.name || "Đang cất trong kho (Chưa gán phòng)"}</p></div>
                <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Hình thức quản lý</p><p className="font-bold text-gray-700 mt-1">{viewingEq.managementType === 'pool' ? 'Số lượng (Pool)' : 'Serial (Đơn chiếc)'}</p></div>
                {viewingEq.managementType === 'serial' ? (
                  <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Số Serial</p><p className="font-black text-gray-900 mt-1">{viewingEq.serialNumber || "N/A"}</p></div>
                ) : (
                  <div><p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Kho (Còn / Tổng)</p><p className="font-bold text-gray-700 mt-1"><span className="text-blue-600 font-black text-lg">{(viewingEq.totalQuantity || 0) - (viewingEq.inUseQuantity || 0)}</span> / {viewingEq.totalQuantity || 0} cái</p></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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
  };

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

  const renderLookup = () => {
    // TÍCH HỢP LOGIC CRM CHUẨN ADMIN
    const generateCustomerProfiles = () => {
      const profileMap: Record<string, any> = {};
      bookings.forEach((b) => {
        const phone = b.phone || "Không có SĐT";
        if (!profileMap[phone]) {
          profileMap[phone] = {
            phone,
            fullName: b.customerName,
            totalBookings: 0,
            completed: 0,
            cancelled: 0,
            revenue: 0,
            history: [],
          };
        }

        // 1. Cập nhật chỉ số
        profileMap[phone].totalBookings += 1;
        profileMap[phone].fullName = b.customerName;

        if (["checked-in", "confirmed", "HOÀN THÀNH"].includes(b.status)) {
          profileMap[phone].completed += 1;
        }
        if (["cancelled", "rejected"].includes(b.status)) {
          profileMap[phone].cancelled += 1;
        }

        // 2. Tính toán doanh thu
        const matchedRoom = rooms.find((r) => (r.id || r._id) === b.roomId);
        const price = matchedRoom
          ? matchedRoom.pricePerHour || matchedRoom.price || 0
          : 0;
        profileMap[phone].revenue += (b.durationMins / 60) * price;

        // 3. Đưa vào lịch sử
        profileMap[phone].history.push(b);
      });

      // BỘ LỌC VẠN NĂNG: Lọc theo Tên, SĐT hoặc MÃ ĐƠN
      return Object.values(profileMap)
        .filter(
          (c) =>
            !lookupSearch ||
            c.phone.includes(lookupSearch) ||
            c.fullName.toLowerCase().includes(lookupSearch.toLowerCase()) ||
            c.history.some((h: any) => h.id && h.id.includes(lookupSearch)),
        )
        .sort((a, b) => b.totalBookings - a.totalBookings);
    };

    const profiles = generateCustomerProfiles();

    // HÀM XỬ LÝ GHI CHÚ VÀ GẮN THẺ (VIP / BLACKLIST)
    const handleNoteChange = (phone: string, text: string) => {
      setCustomerNotes((prev) => ({
        ...prev,
        [phone]: { ...prev[phone], note: text, tags: prev[phone]?.tags || [] },
      }));
    };

    const toggleTag = (phone: string, tag: string) => {
      setCustomerNotes((prev) => {
        const currentTags = prev[phone]?.tags || [];
        const newTags = currentTags.includes(tag)
          ? currentTags.filter((t) => t !== tag)
          : [...currentTags, tag];
        return {
          ...prev,
          [phone]: {
            ...prev[phone],
            tags: newTags,
            note: prev[phone]?.note || "",
          },
        };
      });
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-black text-gray-900">
            Hệ Thống Tra Cứu (CRM)
          </h2>
          <p className="text-gray-500 mt-1">
            Quản lý hồ sơ khách hàng, tra cứu mã đơn, theo dõi lịch sử và gắn
            thẻ.
          </p>
        </div>

        {/* THANH TÌM KIẾM */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
          <div className="relative">
            <Search className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tra cứu vạn năng: Nhập Tên, Số điện thoại hoặc Mã đơn đặt phòng..."
              value={lookupSearch}
              onChange={(e) => setLookupSearch(e.target.value)}
              className="w-full pl-14 pr-4 py-4 border-2 border-gray-100 rounded-xl font-bold bg-gray-50 outline-none focus:border-blue-500 focus:bg-white transition-colors text-lg"
            />
          </div>
        </div>

        {/* ================= GIAO DIỆN HIỂN THỊ DẠNG THẺ (CARDS) ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {profiles.map((c) => {
            const cData = customerNotes[c.phone] || { tags: [], note: "" };
            const isBlacklist = cData.tags.includes("Blacklist");
            const isVIP = cData.tags.includes("VIP");

            return (
              <div
                key={c.phone}
                onClick={() => setViewingCustomer(c)} // Click để mở Modal
                className={`bg-white rounded-2xl border-2 shadow-sm p-5 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-200 flex items-center gap-4 ${isBlacklist
                    ? "border-red-300 shadow-red-100 hover:border-red-400"
                    : isVIP
                      ? "border-amber-300 shadow-amber-100 hover:border-amber-400"
                      : "border-gray-100 hover:border-blue-300"
                  }`}
              >
                <div
                  className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center font-black text-xl text-white shadow-md ${isBlacklist
                      ? "bg-red-500"
                      : isVIP
                        ? "bg-gradient-to-tr from-amber-400 to-yellow-500"
                        : "bg-blue-600"
                    }`}
                >
                  {c.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-lg text-gray-900 truncate">
                    {c.fullName}
                  </h3>
                  <p className="text-gray-500 font-bold text-sm tracking-wide">
                    {c.phone}
                  </p>

                  {/* Hiển thị nhanh số lượng đơn và Tag */}
                  <div className="flex gap-2 mt-2">
                    {isVIP && (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md border border-amber-300 uppercase font-black truncate">
                        VIP
                      </span>
                    )}
                    {isBlacklist && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-md border border-red-300 uppercase font-black truncate">
                        Đen
                      </span>
                    )}
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-bold">
                      {c.totalBookings} đơn
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* TRẠNG THÁI TRỐNG */}
          {profiles.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 py-16 flex flex-col items-center justify-center text-gray-400 bg-white rounded-3xl border border-gray-200 border-dashed">
              <Search className="w-12 h-12 mb-4 text-gray-200" />
              <p className="font-black text-lg text-gray-500">
                Không tìm thấy dữ liệu!
              </p>
              <p className="text-sm font-medium mt-1">
                Hãy thử tìm kiếm với thông tin khác.
              </p>
            </div>
          )}
        </div>

        {/* ================= MODAL HIỂN THỊ CHI TIẾT (KHI CLICK VÀO CARD) ================= */}
        <AnimatePresence>
          {viewingCustomer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                {/* Header Modal */}
                <div className="p-6 border-b border-gray-100 relative bg-slate-50 flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center font-black text-3xl text-white shadow-md bg-blue-600">
                      {viewingCustomer.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-2xl text-gray-900">
                        {viewingCustomer.fullName}
                      </h3>
                      <p className="text-gray-500 font-bold tracking-wide text-lg">
                        {viewingCustomer.phone}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewingCustomer(null)}
                    className="p-2 text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 rounded-full transition-colors border shadow-sm"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Body Modal (Có thanh cuộn) */}
                <div className="overflow-y-auto p-6 flex-1 space-y-6 custom-scrollbar">
                  {/* Chỉ Số Thống Kê */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-center">
                      <p className="text-2xl font-black text-blue-600">
                        {viewingCustomer.totalBookings}
                      </p>
                      <p className="text-[10px] font-bold text-blue-800/60 uppercase tracking-wider mt-1">
                        Tổng Đơn
                      </p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-center">
                      <p className="text-2xl font-black text-emerald-600">
                        {viewingCustomer.completed}
                      </p>
                      <p className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-wider mt-1">
                        Thành công
                      </p>
                    </div>
                    <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-center">
                      <p className="text-2xl font-black text-red-500">
                        {viewingCustomer.cancelled}
                      </p>
                      <p className="text-[10px] font-bold text-red-800/60 uppercase tracking-wider mt-1">
                        Hủy/Từ chối
                      </p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-center flex flex-col justify-center items-center">
                      <p className="text-base font-black text-amber-600 truncate w-full">
                        {viewingCustomer.revenue.toLocaleString("vi-VN")}đ
                      </p>
                      <p className="text-[10px] font-bold text-amber-800/60 uppercase tracking-wider mt-1">
                        Chi tiêu
                      </p>
                    </div>
                  </div>

                  {/* Admin Area: Phân loại & Ghi chú */}
                  <div className="bg-gray-50 border border-gray-200 p-5 rounded-2xl space-y-4">
                    <p className="text-xs font-black text-gray-800 uppercase flex items-center gap-2">
                      <UserCircle className="w-4 h-4 text-blue-600" /> Phân loại
                      & Ghi chú nội bộ
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleTag(viewingCustomer.phone, "VIP")}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border shadow-sm ${customerNotes[viewingCustomer.phone]?.tags?.includes(
                          "VIP",
                        )
                            ? "bg-amber-100 text-amber-700 border-amber-300"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                      >
                        <Tag className="w-4 h-4 inline mr-1" /> Đánh dấu VIP
                      </button>
                      <button
                        onClick={() =>
                          toggleTag(viewingCustomer.phone, "Blacklist")
                        }
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border shadow-sm ${customerNotes[viewingCustomer.phone]?.tags?.includes(
                          "Blacklist",
                        )
                            ? "bg-red-100 text-red-700 border-red-300"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                      >
                        <AlertTriangle className="w-4 h-4 inline mr-1" /> Danh
                        sách đen
                      </button>
                    </div>
                    <textarea
                      placeholder="Thêm ghi chú nội bộ cho khách hàng này (Chỉ Admin/Manager thấy)..."
                      value={customerNotes[viewingCustomer.phone]?.note || ""}
                      onChange={(e) =>
                        handleNoteChange(viewingCustomer.phone, e.target.value)
                      }
                      className="w-full text-sm p-4 border border-yellow-200 rounded-xl bg-yellow-50 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 resize-none h-24 placeholder:text-yellow-600/40 text-yellow-900 shadow-inner"
                    />
                  </div>

                  {/* Lịch sử đặt phòng */}
                  <div>
                    <p className="text-xs font-black text-gray-800 uppercase flex items-center gap-2 mb-3">
                      <CalendarDays className="w-4 h-4 text-emerald-600" /> Lịch sử
                      giao dịch ({viewingCustomer.history.length})
                    </p>
                    <div className="space-y-3">
                      {viewingCustomer.history
                        .sort(
                          (a: any, b: any) =>
                            new Date(b.date || "").getTime() -
                            new Date(a.date || "").getTime(),
                        )
                        .map((h: any) => (
                          <div
                            key={h.id}
                            className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center gap-3 hover:border-blue-300 transition-colors shadow-sm"
                          >
                            <div>
                              <p className="font-bold text-gray-900 text-sm">
                                {h.date?.split("-").reverse().join("/")}{" "}
                                <span className="text-gray-400 font-medium ml-1">
                                  | {h.startTime}
                                </span>
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Mã:{" "}
                                <span className="font-mono font-bold text-blue-600">
                                  {h.id.substring(0, 8)}
                                </span>{" "}
                                - Phòng:{" "}
                                <span className="font-bold text-gray-700">
                                  {rooms.find(
                                    (r) => (r.id || r._id) === h.roomId,
                                  )?.name || "Phòng đã xóa"}
                                </span>
                              </p>
                            </div>
                            <div>
                              {h.status === "confirmed" ||
                                h.status === "checked-in" ? (
                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 uppercase">
                                  Thành công
                                </span>
                              ) : h.status === "cancelled" ||
                                h.status === "rejected" ? (
                                <span className="text-[10px] font-bold bg-red-100 text-red-700 px-3 py-1.5 rounded-lg border border-red-200 uppercase">
                                  Đã hủy
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-200 uppercase">
                                  Chờ duyệt
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };



  // ================= 3. GIAO DIỆN DUYỆT ĐƠN & GIÁM SÁT CỦA ADMIN =================
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    const targetBooking = bookings.find((b) => b.id === bookingId);

    // Cập nhật UI ngay lập tức
    setBookings((prevBookings) =>
      prevBookings.map((b) => b.id === bookingId ? { ...b, status: newStatus } : b)
    );

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Lỗi khi cập nhật trạng thái");

      // 🚀 CHUẨN XÁC: NẾU KẾT THÚC HOẶC HỦY ĐƠN -> HOÀN TRẢ SỐ LƯỢNG THIẾT BỊ VỀ KHO
      if (['completed', 'cancelled', 'rejected'].includes(newStatus) && targetBooking?.equipments) {
        await syncEquipmentStock(targetBooking.equipments, "return");
        fetchData(true); // Lấy lại số lượng mới nhất từ kho DB để hiển thị
      }
    } catch (err) {
      alert("Lỗi kết nối khi cập nhật đơn! Hệ thống sẽ tải lại dữ liệu.");
      fetchData(true);
    }
  };
  // ================= XÁC NHẬN THANH TOÁN & HOÀN THÀNH CA MƯỢN =================
  const handleConfirmPayment = async (bookingId: string) => {
    // 1. Khóa nút và bật hiệu ứng "Đang xử lý..."
    const btn = document.getElementById(`btn-confirm-payment-${bookingId}`) as HTMLButtonElement;
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<div class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Đang xử lý...`;
    }

    const targetBooking = bookings.find((b) => b.id === bookingId);

    try {
      const token = localStorage.getItem("access_token");

      // 2. Gửi lệnh cập nhật xuống Backend
      const response = await fetch(`${API_URL}/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: "completed", payment_status: "HOÀN THÀNH" })
      });

      if (!response.ok) throw new Error("Lỗi khi cập nhật thanh toán");

      // 3. Hoàn kho thiết bị (nếu có)
      if (targetBooking && targetBooking.equipments && targetBooking.equipments.length > 0) {
        await syncEquipmentStock(targetBooking.equipments, "return");
      }

      // 4. NẢY SỐ NGAY LẬP TỨC TRÊN GIAO DIỆN MÀ KHÔNG CẦN LOAD
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "completed", paymentStatus: "HOÀN THÀNH" } : b));

      // Kéo dữ liệu ngầm từ Server để đồng bộ kho
      fetchData(true);

    } catch (e: any) {
      alert(`⛔ LỖI KẾT NỐI:\nKhông thể thanh toán. Hệ thống sẽ tải lại.`);
      fetchData(true);
    } finally {
      // Trả lại hình dáng nút ban đầu nếu có lỗi
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-banknote"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg> Nhận tiền & Kết thúc`;
      }
    }
  };

  const renderApproval = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    // LỌC ĐƠN CHỜ DUYỆT: Lọc bỏ toàn bộ đơn do nội bộ (Manager/Admin) đặt
    const pendingBookings = bookings.filter(b => {
      const isPending = b.status === "pending" || b.status === "CHO_DUYET";

      // Kiểm tra an toàn: Lấy chuỗi source hoặc role, chuyển thành in hoa để so sánh
      const sourceStr = String(b.source || b.role || "").toUpperCase();
      const isFromStaff = sourceStr.includes("MANAGER") || sourceStr.includes("ADMIN");

      // Chỉ giữ lại đơn Pending VÀ KHÔNG PHẢI từ Staff
      return isPending && !isFromStaff;
    });

    const activeBookings = bookings.filter(b => (b.date === todayStr || !b.date) && ['confirmed', 'checked-in', 'DANG_MUON'].includes(b.status)).sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Duyệt Đơn & Giám Sát</h2>
          <p className="text-gray-500 mt-1">Admin có quyền duyệt nhanh các yêu cầu và theo dõi các ca đang diễn ra.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CỘT 1: CHỜ DUYỆT */}
          <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden flex flex-col h-[700px]">
            <div className="p-4 border-b border-amber-200 bg-amber-50">
              <h3 className="font-black text-amber-800 flex items-center gap-2"><Clock className="w-5 h-5" /> Yêu cầu chờ duyệt ({pendingBookings.length})</h3>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4 bg-gray-50/50">
              {pendingBookings.length === 0 ? (
                <p className="text-center text-gray-400 py-10">Không có đơn nào đang chờ duyệt.</p>
              ) : pendingBookings.map(b => (
                <div key={b.id} className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-gray-900">{b.customerName}</h4>
                      <p className="text-xs text-gray-500 font-medium">{b.phone}</p>
                    </div>
                    <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded">Chờ duyệt</span>
                  </div>
                  <div className="text-sm text-gray-700 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p><span className="font-bold">Phòng:</span> <span className="text-blue-600">{rooms.find(r => r.id === b.roomId)?.name || "Chưa rõ"}</span></p>
                    <p><span className="font-bold">Thời gian:</span> {b.date?.split('-').reverse().join('/')} | {b.startTime} ({b.durationMins} phút)</p>
                    {b.note && <p className="mt-1"><span className="font-bold">Ghi chú:</span> {b.note}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')} className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-lg text-sm hover:bg-emerald-700 transition-colors shadow-sm">Phê duyệt</button>
                    <button onClick={() => { if (confirm('Từ chối đơn này?')) handleUpdateBookingStatus(b.id, 'rejected') }} className="flex-1 py-2.5 bg-red-100 text-red-700 font-bold rounded-lg text-sm hover:bg-red-200 transition-colors">Từ chối</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CỘT 2: CA ĐANG HOẠT ĐỘNG */}
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 overflow-hidden flex flex-col h-[700px]">
            <div className="p-4 border-b border-emerald-200 bg-emerald-50">
              <h3 className="font-black text-emerald-800 flex items-center gap-2"><Activity className="w-5 h-5" /> Các ca đang diễn ra hôm nay ({activeBookings.length})</h3>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4 bg-gray-50/50">
              {activeBookings.length === 0 ? (
                <p className="text-center text-gray-400 py-10">Không có ca nào đang hoạt động hôm nay.</p>
              ) : activeBookings.map(b => (
                <div key={b.id} className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                  <div>
                    <h4 className="font-bold text-gray-900">{b.customerName}</h4>
                    <p className="text-xs text-gray-500 font-medium mb-1">{b.phone}</p>
                    <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200 uppercase">{rooms.find(r => r.id === b.roomId)?.name || "Phòng"}</span>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2 shrink-0">
                    <span className="font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg text-sm border border-emerald-100">{b.startTime}</span>
                    {b.paymentStatus === "HOÀN THÀNH" ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Đã thu</span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200"><AlertTriangle className="w-3 h-3" /> Chưa thu tiền</span>
                    )}

                    {/* NÚT KẾT THÚC CA VÀ HOÀN TRẢ THIẾT BỊ VỀ KHO */}
                    {b.paymentStatus !== "HOÀN THÀNH" && (
                      <button
                        id={`btn-confirm-payment-${b.id}`}
                        onClick={() => {
                          if (confirm(`Xác nhận khách [${b.customerName}] đã thanh toán, trả phòng và TRẢ ĐỦ THIẾT BỊ vào kho?`)) {
                            handleConfirmPayment(b.id);
                          }
                        }}
                        className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 w-full md:w-auto"
                      >
                        <Banknote className="w-3.5 h-3.5" /> Nhận tiền & Kết thúc
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSystemLogs = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border-2 border-red-100">
          <h3 className="text-xl font-black text-red-600 mb-2"><Lock className="w-6 h-6 inline" /> Global Shutdown</h3>
          <p className="text-sm text-gray-600 mb-6">Đóng băng toàn bộ hệ thống.</p>
          <div className="space-y-4">
            <input type="date" className="w-full border p-2 rounded-lg" value={globalShutdown.startDate} onChange={e => setGlobalShutdown({ ...globalShutdown, startDate: e.target.value })} />
            <input type="date" className="w-full border p-2 rounded-lg" value={globalShutdown.endDate} onChange={e => setGlobalShutdown({ ...globalShutdown, endDate: e.target.value })} />
            <textarea className="w-full border p-2 rounded-lg text-sm" rows={2} value={globalShutdown.reason} onChange={e => setGlobalShutdown({ ...globalShutdown, reason: e.target.value })} placeholder="Lý do bảo trì..."></textarea>
            {globalShutdown.isActive ? (
              <button onClick={() => setGlobalShutdown({ ...globalShutdown, isActive: false })} className="w-full py-3 bg-emerald-600 text-white font-black rounded-xl">Mở Khóa Hệ Thống</button>
            ) : (
              <button onClick={() => setGlobalShutdown({ ...globalShutdown, isActive: true })} className="w-full py-3 bg-red-600 text-white font-black rounded-xl">Kích hoạt Đóng Băng</button>
            )}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-[600px] p-4 overflow-y-auto">
          <h3 className="font-black text-lg mb-4">Nhật ký Hệ thống & Bảo trì</h3>
          {maintenanceLogs.map(log => (
            <div key={log.id} className="flex gap-4 border-l-2 border-amber-500 pl-4 py-2">
              <span className="text-xs font-bold text-gray-400 w-24">{log.startDate}</span>
              <div>
                <p className="text-sm">[{log.reportedBy}] lên lịch bảo trì {log.itemName}</p>
                {log.status === 'pending' && <button onClick={async () => {
                  await fetch(`${API_URL}/bookings/maintenance/${log.id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` }, body: JSON.stringify({ status: "completed" }) });
                  fetchData(true);
                }} className="mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded font-bold">Force Complete</button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {renderSidebar()}
      <main className="flex-1 overflow-y-auto p-8 lg:p-10 relative">
        {/* BANNER BẢO TRÌ TOÀN HỆ THỐNG */}
        {globalShutdown.isActive && (
          <div className="mb-6 bg-red-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between border-2 border-red-400 animate-pulse">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-yellow-300" />
              <div>
                <h3 className="font-black text-lg tracking-wide uppercase">Cảnh báo: Hệ thống đang bị Đóng Băng (Global Shutdown)</h3>
                <p className="text-sm font-medium">Lý do: {globalShutdown.reason} | Từ {globalShutdown.startDate} đến {globalShutdown.endDate}. Mọi hoạt động đặt phòng đã bị khóa.</p>
              </div>
            </div>
          </div>
        )}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading-spinner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center h-[80vh]"
            >
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </motion.div>
          ) : (
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeMenu === "dashboard" && renderDashboard()}
              {activeMenu === "rooms" && renderRooms()}
              {activeMenu === "approval" && renderApproval()}
              {activeMenu === "equipments" && renderEquipments()}
              {activeMenu === "users" && renderUsers()}
              {activeMenu === "bookings" && renderBookings()}
              {activeMenu === "lookup" && renderLookup()}
              {activeMenu === "reports" && renderReports()}
              {activeMenu === "system" && renderSystemLogs()}
            </motion.div>
          )}
        </AnimatePresence>


        {/* ================= MODAL QUICK BOOK CAO CẤP ================= */}
        <AnimatePresence>
          {showQuickBook && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]"
              >
                <div className="bg-emerald-600 p-5 flex justify-between items-center text-white shrink-0">
                  <h3 className="font-black text-xl flex items-center gap-2">
                    <Clock className="w-5 h-5" /> Đặt Phòng Nhanh (POS)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowQuickBook(false)}
                    className="hover:bg-emerald-700 p-1 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form
                  onSubmit={handleQuickBookSubmit}
                  className="p-6 overflow-y-auto space-y-6"
                >
                  {/* Tìm Kiếm và Chọn Phòng */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center justify-between">
                      Chọn Phòng Lab *
                      <div className="relative w-48">
                        <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Tìm tên phòng..."
                          value={roomSearchQuery}
                          onChange={(e) => setRoomSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </label>
                    <select
                      required
                      value={quickBookData.roomId}
                      onChange={(e) =>
                        setQuickBookData({
                          ...quickBookData,
                          roomId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl font-bold text-emerald-800 outline-none focus:border-emerald-500 shadow-sm"
                    >
                      <option value="" disabled>
                        -- Vui lòng chọn một phòng --
                      </option>
                      {rooms
                        .filter((r) =>
                          (r.title || r.name || "")
                            .toLowerCase()
                            .includes(roomSearchQuery.toLowerCase()),
                        )
                        .map((r) => (
                          <option key={r.id || r._id} value={r.id || r._id}>
                            {r.title || r.name} - Sức chứa: {r.capacity} (
                            {Number(r.price || 100000).toLocaleString("vi-VN")}
                            đ/h)
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Họ Tên Người Thuê *
                      </label>
                      <input
                        type="text"
                        required
                        value={quickBookData.customerName}
                        onChange={(e) =>
                          setQuickBookData({
                            ...quickBookData,
                            customerName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                        placeholder="VD: Nguyễn Văn A"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">
                        Số điện thoại liên hệ *
                      </label>
                      <input
                        type="text"
                        required
                        value={quickBookData.phone}
                        onChange={(e) =>
                          setQuickBookData({
                            ...quickBookData,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                        placeholder="VD: 0901234567"
                      />
                    </div>
                  </div>

                  {/* Cho phép chọn lịch xuyên ngày */}
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-blue-900 mb-1">
                        Bắt đầu từ *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          required
                          value={quickBookData.startDate}
                          onChange={(e) =>
                            setQuickBookData({
                              ...quickBookData,
                              startDate: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-500"
                        />
                        <input
                          type="time"
                          required
                          value={quickBookData.startTime}
                          onChange={(e) =>
                            setQuickBookData({
                              ...quickBookData,
                              startTime: e.target.value,
                            })
                          }
                          className="w-24 px-2 py-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-blue-900 mb-1">
                        Đến khi *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          required
                          value={quickBookData.endDate}
                          onChange={(e) =>
                            setQuickBookData({
                              ...quickBookData,
                              endDate: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-500"
                        />
                        <input
                          type="time"
                          required
                          value={quickBookData.endTime}
                          onChange={(e) =>
                            setQuickBookData({
                              ...quickBookData,
                              endTime: e.target.value,
                            })
                          }
                          className="w-24 px-2 py-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* THIẾT BỊ & GIÁ TIỀN */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Thêm thiết bị (Trừ kho tự động)
                    </label>
                    <div className="border border-gray-200 rounded-xl p-4 max-h-48 overflow-y-auto bg-gray-50 space-y-2">
                      {equipments.map((eq) => {
                        const eqId = eq.id || eq._id || "";
                        const available =
                          (eq.totalQuantity || 0) - (eq.inUseQuantity || 0);
                        const isOutOfStock = available <= 0;
                        const isSelected = !!quickBookData.equipments[eqId];
                        const selectedQty = isSelected
                          ? quickBookData.equipments[eqId].quantity
                          : 0;
                        const eqPrice = Number(eq.price || 50000);

                        return (
                          <div
                            key={eqId}
                            className={`flex items-center justify-between p-3 rounded-lg border ${isSelected ? "bg-emerald-50 border-emerald-300" : "bg-white border-transparent hover:border-gray-300"} ${isOutOfStock && !isSelected ? "opacity-40" : "shadow-sm"}`}
                          >
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  toggleEquipment(
                                    eqId,
                                    eq.name,
                                    available,
                                    eqPrice,
                                  )
                                }
                                disabled={isOutOfStock && !isSelected}
                                className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                              />
                              <div>
                                <span className="text-sm font-black text-gray-900">
                                  {eq.name}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-md font-bold ${isOutOfStock ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}
                                  >
                                    {isOutOfStock
                                      ? "Hết hàng"
                                      : `Còn: ${available}`}
                                  </span>
                                  <span className="text-xs text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <Banknote className="w-3 h-3" />{" "}
                                    {eqPrice.toLocaleString("vi-VN")}đ / lượt
                                  </span>
                                </div>
                              </div>
                            </label>

                            {isSelected && (
                              <div className="flex items-center gap-2 bg-white border border-emerald-300 rounded-lg p-1 shadow-inner">
                                <button
                                  type="button"
                                  onClick={() => updateEqQuantity(eqId, -1)}
                                  className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-black"
                                >
                                  -
                                </button>
                                <span className="text-base font-black w-6 text-center text-emerald-700">
                                  {selectedQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateEqQuantity(eqId, 1)}
                                  disabled={selectedQty >= available}
                                  className="w-7 h-7 bg-emerald-100 hover:bg-emerald-200 disabled:opacity-50 rounded text-emerald-700 font-black"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* TỔNG HÓA ĐƠN */}
                  <div className="bg-slate-900 rounded-xl p-5 flex items-center justify-between shadow-lg">
                    <div>
                      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                        Tổng tiền tạm tính
                      </p>
                      <p className="text-gray-300 text-xs">
                        (Bao gồm Phòng + Thiết bị)
                      </p>
                    </div>
                    <div className="text-3xl font-black text-emerald-400">
                      {calculateTotalCost().toLocaleString("vi-VN")}đ
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowQuickBook(false)}
                      className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      id="btn-submit-quickbook"
                      className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-xl transition-all active:scale-95 text-lg"
                    >
                      Xác nhận Check-in
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* ================= MODAL GIAO VIỆC ================= */}
        <AnimatePresence>
          {showAssignModal && (
            <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="bg-blue-600 p-5 flex justify-between items-center text-white">
                  <h2 className="text-xl font-black">Phân công kỹ thuật</h2>
                  <button onClick={() => setShowAssignModal(false)} className="hover:bg-blue-700 p-1 rounded-full"><X className="w-5 h-5"/></button>
                </div>
                <div className="p-6">
                  <p className="text-sm font-medium text-gray-500 mb-4">Nhập tên người/kỹ thuật viên phụ trách xử lý báo cáo này.</p>
                  <input
                    className="w-full border border-gray-300 rounded-xl p-3 mb-6 outline-none focus:border-blue-500 font-bold"
                    placeholder="VD: Kỹ thuật viên Nguyễn Văn A"
                    value={assignName}
                    onChange={(e) => setAssignName(e.target.value)}
                    autoFocus
                  />
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setShowAssignModal(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">Hủy</button>
                    <button onClick={handleAssignReport} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md">Giao việc</button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
