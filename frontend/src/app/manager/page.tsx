"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  LogOut,
  X,
  Clock,
  MapPin,
  ShieldCheck,
  Search,
  FileText,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
  TrendingUp,
  QrCode,
  CheckCircle2,
  Wrench,
  DoorOpen,
  Banknote,
  CalendarRange,
  Lock,
  SkipForward,
  Edit,
  UserCircle,
  Tag,
  History,
  Info,
  Sparkles
} from "lucide-react";

import { labService } from "../../services/lab";

// ================= INTERFACES (Merged Strict Types) =================
interface ManagerRoom {
  id?: string;
  _id?: string;
  title?: string;
  name?: string;
  building?: string;
  floor?: string;
  capacity?: number | string;
  imageUrl?: string;
  maintenanceMode?: boolean;
  isBooked?: boolean;
  price?: number;
  pricePerHour?: number;
}

interface EquipmentItem {
  id?: string;
  _id?: string;
  name: string;
  category?: string;
  managementType?: string;
  totalQuantity: number;
  inUseQuantity: number;
  status?: string;
  roomId?: string;
  imageUrl?: string;
  price?: number;
}

interface BorrowedEquipment {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface BookingItem {
  id: string;
  roomId: string;
  customerName: string;
  phone: string;
  status: string;
  startTime: string;
  durationMins: number;
  bufferMins: number;
  note: string;
  equipments?: BorrowedEquipment[];
  date?: string;
 
  is_urgent?: boolean;
  is_conflict?: boolean;
  conflict_with?: string;
  cancel_reason?: string;

  paymentStatus?: "CHƯA THANH TOÁN" | "ĐANG CHỜ DUYỆT" | "HOÀN THÀNH";
}

interface FixedBookingRule {
  id: string;
  roomId: string;
  title: string; 
  startDate: string; 
  endDate: string;   
  daysOfWeek: number[]; 
  startTime: string; 
  endTime: string;   
  status: "active" | "suspended" | "expired";
  note?: string;
  equipments?: BorrowedEquipment[];
  exceptionDates?: string[];
}

// --- YÊU CẦU: STRICT TYPE CHO TRA CỨU ---
interface CustomerProfile {
  phone: string;
  fullName: string;
  totalBookings: number;
  completed: number;
  cancelled: number;
  tags: ("VIP" | "Warning" | "Regular")[];
  internalNote: string;
  bookingHistory: BookingItem[];
}

interface EquipmentTrackingInfo {
  equipmentId: string;
  name: string;
  inStock: number;
  total: number;
  currentlyBorrowedBy: {
    bookingId: string;
    roomName: string;
    customerName: string;
    quantity: number;
    expectedReturnTime: string;
    isOverdue: boolean;
    originalBooking: BookingItem;
  }[];
}

type MenuTab =
  | "dashboard"
  | "master-schedule"
  | "labs"
  | "equipments"
  | "timeline"
  | "reports"
  | "lookup";
type TimeFilter = "today" | "yesterday" | "7days" | "month" | "custom";

const COLORS = ["#3b82f6", "#ef4444", "#f59e0b"];

// ================= DỮ LIỆU MẪU ĐẶT PHÒNG =================
const INITIAL_BOOKINGS: BookingItem[] = [
  {
    id: "b1",
    roomId: "r1",
    customerName: "Nguyễn Văn Quý",
    phone: "0901234567",
    status: "checked-in",
    startTime: "08:00",
    durationMins: 120,
    bufferMins: 15,
    note: "Khách ca sáng",
    equipments: [{ id: "eq1", name: "máy chiếu", quantity: 2, price: 50000 }],
  },
  {
    id: "b2",
    roomId: "r2",
    customerName: "Lê Thị B",
    phone: "0987654321",
    status: "confirmed",
    startTime: "13:00",
    durationMins: 180,
    bufferMins: 15,
    note: "Học nhóm hội thảo",
    equipments: [],
  },
];

const SectionHeader = ({ title, description, action }: { title: string, description: string, action?: React.ReactNode }) => (
  <div className="flex justify-between items-end mb-6">
    <div>
      <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
      <p className="text-gray-500 font-medium text-sm mt-1">{description}</p>
    </div>
    {action && <div>{action}</div>}
  </div>
);

export default function ManagerDashboardPage() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState<MenuTab>("dashboard");
  const [loading, setLoading] = useState<boolean>(true);

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [customDate, setCustomDate] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(new Date());

  const [rooms, setRooms] = useState<ManagerRoom[]>([]);
  //const [bookings, setBookings] = useState<BookingItem[]>(INITIAL_BOOKINGS);
  const [bookings, setBookings] = useState<BookingItem[]>([]);

  const prevPendingCountRef = useRef(0);
  const pendingCount = bookings.filter((b) => b.status === "pending" || b.status === "CHO_DUYET").length;

  // useEffect(() => {
  //   if (pendingCount > prevPendingCountRef.current) {
  //     const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
      
  //     audio.play().catch(e => console.log("Trình duyệt chặn tự động phát âm thanh, cần user click vào trang trước."));
  //   }
  //   prevPendingCountRef.current = pendingCount;
  // }, [pendingCount]);

  useEffect(() => {
    if (pendingCount > prevPendingCountRef.current) {
      
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.play().catch(e => console.log("Trình duyệt chặn tự động phát âm thanh, cần user click vào trang trước."));
    }
    prevPendingCountRef.current = pendingCount;
  }, [pendingCount]);

  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [buildingFilter, setBuildingFilter] = useState<string>("all");
  const [roomSearchQuery, setRoomSearchQuery] = useState("");
  // ================= STATES CHO THÔNG BÁO GIAO DIỆN (TOAST & MODAL) =================
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({
    show: false,
    message: "",
    type: "success",
  });
  const [confirmCancel, setConfirmCancel] = useState<{
    isOpen: boolean;
    bookingId: string;
  }>({
    isOpen: false,
    bookingId: "",
  });

  // Hàm gọi thông báo nổi (tự tắt sau 3 giây)
  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  // ================= STATES QUICK BOOK & VIEW BOOKING =================
  const [showQuickBook, setShowQuickBook] = useState(false);
  const [quickBookData, setQuickBookData] = useState({
    roomId: "",
    customerName: "",
    phone: "",
    capacity: 1,
    startDate: selectedDate,
    startTime: "08:00",
    endDate: selectedDate,
    endTime: "10:00",
    note: "",
    equipments: {} as Record<
      string,
      { name: string; quantity: number; max: number; price: number }
    >,
  });
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(
    null,
  );

  // ================= STATES THÔNG MINH & THANH TOÁN =================
  const [todaySearchQuery, setTodaySearchQuery] = useState<string>("");

  // Hàm tính tổng tiền cho Modal
  const calculateBookingTotal = (booking: BookingItem): number => {
    const room = rooms.find(r => (r.id === booking.roomId || r._id === booking.roomId));
    const roomPrice = Number(room?.price || 0);
    const roomTotal = (booking.durationMins / 60) * roomPrice;
    const eqTotal = (booking.equipments || []).reduce((sum, eq) => sum + (eq.price * eq.quantity), 0);
    return roomTotal + eqTotal;
  };

  // Hàm Xác nhận thanh toán & Hoàn thành ca
  const handleConfirmPayment = async (bookingId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        // Gửi cả cờ completed và trạng thái thanh toán
        body: JSON.stringify({ status: "completed", payment_status: "HOÀN THÀNH" })
      });

      if (!response.ok) throw new Error("Lỗi khi cập nhật thanh toán");

      // Cập nhật State nội bộ ngay lập tức
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "completed", paymentStatus: "HOÀN THÀNH" } : b));
      if (selectedBooking && selectedBooking.id === bookingId) {
         setSelectedBooking({ ...selectedBooking, status: "completed", paymentStatus: "HOÀN THÀNH" });
      }
      
      showToast("Đã thu tiền và hoàn thành ca mượn!", "success");
      setSelectedBooking(null); // Đóng modal
    } catch (e) {
      showToast("Lỗi kết nối khi thanh toán!", "error");
    }
  };

  // ================= STATES THỜI KHÓA BIỂU CỐ ĐỊNH =================
  const [fixedBookings, setFixedBookings] = useState<FixedBookingRule[]>([]);
  const [showFixedModal, setShowFixedModal] = useState(false);
  const [fixedStep, setFixedStep] = useState<"input" | "resolve">("input");
 const [conflictList, setConflictList] = useState<BookingItem[]>([]);
  const [gridRoomFilter, setGridRoomFilter] = useState<string>("");
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null); 

  const [fixedForm, setFixedForm] = useState<Omit<FixedBookingRule, 'id' | 'status'>>({
    roomId: "",
    title: "",
    startDate: selectedDate,
    endDate: "",
    daysOfWeek: [],
    startTime: "07:00",
    endTime: "11:30",
    note: "",
  });

  // HÀM KIỂM TRA TRÙNG LỊCH (CONFLICT CHECKER)
  const handleCheckFixedConflicts = (e: React.FormEvent) => {
    e.preventDefault();
    const { roomId, startDate, endDate, daysOfWeek, startTime, endTime } = fixedForm;
    if (!roomId || daysOfWeek.length === 0 || !startDate || !endDate) return alert("Vui lòng điền đủ thông tin (Phòng, Ngày, Thứ)!");
    if (timeToMins(endTime) <= timeToMins(startTime)) return alert("Giờ kết thúc phải lớn hơn giờ bắt đầu!");

    const startMs = new Date(startDate + "T00:00:00").getTime();
    const endMs = new Date(endDate + "T00:00:00").getTime();
    const newStartMins = timeToMins(startTime);
    const newEndMins = timeToMins(endTime);

    // 1. Tạo danh sách các ngày thực tế sẽ diễn ra lịch cố định
    const generatedDates: string[] = [];
    for (let curr = startMs; curr <= endMs; curr += 86400000) {
      const d = new Date(curr);
      if (daysOfWeek.includes(d.getDay())) {
        generatedDates.push(d.toISOString().split("T")[0]);
      }
    }

    // 2. Quét toàn bộ booking lẻ hiện tại xem có vướng vào các ngày và giờ đó không
    const overlappingBookings = bookings.filter(b => {
      if (b.roomId !== roomId || b.status === "cancelled" || b.status === "rejected") return false;
      const bDate = b.date || selectedDate;
      if (!generatedDates.includes(bDate)) return false;

      const bStartMins = timeToMins(b.startTime);
      const bEndMins = bStartMins + b.durationMins + b.bufferMins;
      return newStartMins < bEndMins && newEndMins > bStartMins;
    });

    setConflictList(overlappingBookings);
    setFixedStep("resolve");
  };

  // HÀM CHỐT TẠO / CẬP NHẬT LỊCH CỐ ĐỊNH
  const handleCreateFixedRule = async (mode: "skip" | "override") => {
    let exceptions = editingRuleId ? fixedBookings.find(r => r.id === editingRuleId)?.exceptionDates || [] : [];

    if (conflictList.length > 0) {
      if (mode === "skip") {
        // Yêu cầu 1: Bỏ qua các ngày bị trùng -> Lấy các ngày bị trùng nhét thẳng vào mảng exceptionDates (Ngoại lệ)
        const conflictingDates = conflictList.map(c => c.date || "").filter(d => d !== "");
        exceptions = Array.from(new Set([...exceptions, ...conflictingDates])); // Lọc trùng lặp
        showToast(`Đã tự động bỏ qua ${conflictingDates.length} ngày bị trùng lịch.`, "success");
      } else if (mode === "override") {
        // Ghi đè: Gọi API hủy các đơn lẻ
        const conflictIds = conflictList.map(c => c.id);
        try {
          await Promise.all(conflictIds.map(id => 
            fetch(`https://booklab247.onrender.com/api/v1/bookings/${id}/status`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
              body: JSON.stringify({ status: "cancelled" })
            })
          ));
          setBookings(prev => prev.map(b => conflictIds.includes(b.id) ? { ...b, status: "cancelled", note: "Hủy tự động" } : b));
          showToast(`Đã ghi đè (Hủy) ${conflictIds.length} đơn đặt lẻ!`, "success");
        } catch(e) {}
      }
    }

    // Gói dữ liệu gửi lên Database
    const payload = {
      room_id: fixedForm.roomId,
      title: fixedForm.title,
      start_date: fixedForm.startDate,
      end_date: fixedForm.endDate,
      days_of_week: fixedForm.daysOfWeek,
      start_time: fixedForm.startTime,
      end_time: fixedForm.endTime,
      note: fixedForm.note || "",
      exception_dates: exceptions,
      status: "active"
    };

    try {
      if (editingRuleId) {
        await fetch(`https://booklab247.onrender.com/api/v1/bookings/fixed/${editingRuleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
          body: JSON.stringify(payload)
        });
        setEditingRuleId(null);
        showToast("Cập nhật Lịch cố định thành công!", "success");
      } else {
        await fetch(`https://booklab247.onrender.com/api/v1/bookings/fixed`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
          body: JSON.stringify(payload)
        });
        showToast("Tạo Chuỗi Thời khóa biểu thành công!", "success");
      }
      setShowFixedModal(false);
      loadData(); // Gọi lại loadData để cập nhật UI đồng bộ với Server
    } catch(e) {
      showToast("Lỗi khi lưu lịch cố định", "error");
    }
  };


  // HÀM TÙY CHỈNH: HỦY 1 NGÀY BẤT KỲ TRONG CHUỖI LỊCH CỐ ĐỊNH
  const handleCancelFixedDate = async (ruleId: string, dateToCancel: string) => {
    if (confirm(`Bạn có chắc chắn muốn HỦY lịch cố định của ngày ${dateToCancel.split('-').reverse().join('/')} không?\nLưu ý: Chỉ hủy riêng ngày này, các ngày khác trong chuỗi vẫn giữ nguyên.`)) {
      const rule = fixedBookings.find(r => r.id === ruleId);
      if (rule) {
        const currentExceptions = rule.exceptionDates || [];
        if (!currentExceptions.includes(dateToCancel)) {
          const newExceptions = [...currentExceptions, dateToCancel];
          try {
            await fetch(`https://booklab247.onrender.com/api/v1/bookings/fixed/${ruleId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("access_token")}` },
              body: JSON.stringify({
                room_id: rule.roomId,
                title: rule.title,
                start_date: rule.startDate,
                end_date: rule.endDate,
                days_of_week: rule.daysOfWeek,
                start_time: rule.startTime,
                end_time: rule.endTime,
                exception_dates: newExceptions,
                status: rule.status
              })
            });
            loadData();
            showToast(`Đã hủy lịch cố định ngày ${dateToCancel}`, "success");
          } catch(e) {}
        }
      }
    }
  };

  // ================= STATES TRA CỨU THÔNG TIN (LOOKUP) =================
  const [lookupTab, setLookupTab] = useState<"customer" | "room" | "equipment">("customer");
  const [lookupSearch, setLookupSearch] = useState<string>("");
  
  // State cho Smart Room Search (Reverse Lookup)
  const [smartRoomForm, setSmartRoomForm] = useState({
    date: selectedDate,
    startTime: "08:00",
    endTime: "11:30",
    minCapacity: 10,
    equipmentId: "" // Bộ lọc thiết bị mở rộng
  });

  // ================= HỆ THỐNG CẢNH BÁO QUÁ HẠN TỰ ĐỘNG =================
  const notifiedOverdues = useRef<Set<string>>(new Set());

  useEffect(() => {
    let hasNewOverdue = false;
    bookings.forEach(b => {
      // Chỉ kiểm tra các ca Đang mượn (Checked-in) và có thiết bị
      if (b.status === "checked-in" && b.equipments && b.equipments.length > 0) {
        const bDate = b.date || selectedDate;
        const endMins = timeToMins(b.startTime) + b.durationMins;
        const endH = Math.floor(endMins / 60) % 24;
        const endM = endMins % 60;
        const returnDateTime = new Date(`${bDate}T${endH.toString().padStart(2,'0')}:${endM.toString().padStart(2,'0')}:00`);

        // Nếu thời gian hiện tại vượt quá giờ trả dự kiến & chưa từng thông báo
        if (currentTime > returnDateTime && !notifiedOverdues.current.has(b.id)) {
          hasNewOverdue = true;
          notifiedOverdues.current.add(b.id);
        }
      }
    });

    if (hasNewOverdue) {
      showToast("Cảnh báo: Có thiết bị mượn đã quá giờ trả!", "error");
    }
  }, [currentTime, bookings]);

  // Mô phỏng lưu trữ ghi chú Khách hàng tại Local (Vì chưa có DB Customer riêng)
  const [customerNotes, setCustomerNotes] = useState<Record<string, { tags: ("VIP"|"Warning"|"Regular")[], note: string }>>({});

  // ================= STATES MAINTENANCE REPORT =================
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    type: "room" | "equipment";
    itemId: string;
    itemName: string;
    reason: string;
  }>({ isOpen: false, type: "room", itemId: "", itemName: "", reason: "" });

  //const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1`;
  //const API_URL = //"https://booklab247.onrender.com/api/v1";
  const API_URL = "http://127.0.0.1:8000/api/v1";
  


  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) router.push("/login");
    else loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    const token = localStorage.getItem("access_token");
    const API_URL = "https://booklab247.onrender.com/api/v1"; // Giữ nguyên link Cloud chạy đúng của bạn


    // ==========================================
    // 1. LUỒNG TẢI LỊCH ĐẶT PHÒNG (BOOKINGS) -> ĐÃ BỔ SUNG
    // ==========================================
    try {
      const bkRes = await fetch(`${API_URL}/bookings`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (bkRes.ok) {
        const bkData = await bkRes.json();
        const rawBookings = Array.isArray(bkData) ? bkData : bkData.data || [];

        // Ép kiểu chuẩn xác, không dùng any
        const formattedBookings = rawBookings.map((b: Record<string, unknown>): BookingItem => ({
          id: String(b.id || b._id || ""),
          roomId: String(b.room_id || b.roomId || ""),
          customerName: String(b.customer_name || b.customerName || "Khách chưa rõ tên"),
          phone: String(b.phone || ""),
          status: String(b.status || "pending"),
          date: String(b.date || ""),
          startTime: String(b.start_time || b.startTime || "00:00"),
          durationMins: Number(b.duration_mins || b.durationMins || 0),
          bufferMins: Number(b.buffer_mins || b.bufferMins || 15),

          note: String(b.note || ""),
          equipments: (b.equipments as BorrowedEquipment[]) || [],
          is_urgent: Boolean(b.is_urgent || false),
          is_conflict: Boolean(b.is_conflict || false),
          conflict_with: String(b.conflict_with || ""),
          cancel_reason: String(b.cancel_reason || ""),
          paymentStatus: (b.payment_status as "CHƯA THANH TOÁN" | "ĐANG CHỜ DUYỆT" | "HOÀN THÀNH") || "CHƯA THANH TOÁN",
        }));
        setBookings(formattedBookings);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải Đơn đặt phòng:", error);
      setBookings([]);
    }

    // ==========================================
    // 2. LUỒNG TẢI PHÒNG LAB (Giữ nguyên của bạn)
    // ==========================================
    try {
      const roomsRes = await fetch(`${API_URL}/labs`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const roomsData = roomsRes.ok ? await roomsRes.json() : [];

      if (roomsData && roomsData.length > 0) {
        setRooms(
          roomsData.map((room: any) => ({
            id: room.id || room._id,
            title: room.name || room.title,
            building: room.building || "Chưa gán",
            floor: room.floor || "Chưa gán",
            capacity: room.capacity || 0,
            imageUrl: room.imageUrl,
            price: room.pricePerHour || room.price || 0,
            maintenanceMode: room.maintenanceMode || false,
            isBooked: room.isBooked || false,
          })),
        );
      } else {
        setRooms([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải Phòng Lab:", error);
      setRooms([]);
    }

    // ==========================================
    // 2,5. LUỒNG TẢI LỊCH CỐ ĐỊNH TỪ DATABASE
    // ==========================================
    try {
      const fixedRes = await fetch(`${API_URL}/bookings/fixed`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      });
      if (fixedRes.ok) {
        const fixedData = await fixedRes.json();
        setFixedBookings(fixedData.map((fb: any) => ({
          id: fb.id,
          roomId: fb.room_id,
          title: fb.title,
          startDate: fb.start_date,
          endDate: fb.end_date,
          daysOfWeek: fb.days_of_week,
          startTime: fb.start_time,
          endTime: fb.end_time,
          status: fb.status,
          note: fb.note,
          exceptionDates: fb.exception_dates || []
        })));
      }
    } catch (err) {
      console.error("Lỗi tải lịch cố định:", err);
    }

    // ==========================================
    // 3. LUỒNG TẢI THIẾT BỊ 
    // ==========================================
    try {
      const eqRes = await fetch(`${API_URL}/equipments`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const equipmentsData = eqRes.ok ? await eqRes.json() : [];

      if (equipmentsData && equipmentsData.length > 0) {
        setEquipments(equipmentsData);
      } else {
        setEquipments([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải Thiết bị:", error);
      setEquipments([]);
    }

    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    router.push("/login");
  };

  const timeToMins = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const minsToTime = (mins: number) => {
    const h = Math.floor(mins / 60) % 24;
    const m = Math.floor(mins % 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const toggleEquipment = (
    eqId: string,
    eqName: string,
    available: number,
    price: number,
  ) => {
    const currentEqs = { ...quickBookData.equipments };
    if (currentEqs[eqId]) delete currentEqs[eqId];
    else
      currentEqs[eqId] = {
        name: eqName,
        quantity: 1,
        max: available,
        price: price,
      };
    setQuickBookData({ ...quickBookData, equipments: currentEqs });
  };

  const calculateTotalCost = () => {
const startObj = new Date(
      `${quickBookData.startDate}T${quickBookData.startTime}`
    );
    const endObj = new Date(
      `${quickBookData.endDate}T${quickBookData.endTime}`
    );
    const diffMins = Math.max(
      0,
      (endObj.getTime() - startObj.getTime()) / 60000
    );

    const selectedRoom = rooms.find(
      (r) => (r.id || r._id) === quickBookData.roomId
    );
    // Giữ lại logic ưu tiên lấy pricePerHour của bạn
    const roomPricePerHour = Number(
      selectedRoom?.pricePerHour || selectedRoom?.price || 100000
    );
    const roomTotal = (diffMins / 60) * roomPricePerHour;
    const eqTotal = Object.values(quickBookData.equipments).reduce(
      (sum, eq) => sum + eq.price * eq.quantity,
      0,
    );

    return roomTotal + eqTotal;
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
    };

    try {
      const submitBtn = document.getElementById(
        "btn-submit-quickbook",
      ) as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Đang lưu...";
      }

      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Lỗi lưu Database");

      const responseData = await response.json();

      const newBooking: BookingItem = {
        id: responseData.data?.id || `b${Date.now()}`,
        roomId: targetId,
        customerName: quickBookData.customerName,
        phone: quickBookData.phone,
        status: "checked-in",
        date: quickBookData.startDate,
        startTime: quickBookData.startTime,
        durationMins: durationMins,
        bufferMins: 15,
        note: quickBookData.note,
        equipments: borrowedEquipments,
      };

      const updatedEquipments = equipments.map((eq) => {
        const eqId = eq.id || eq._id || "";
        if (quickBookData.equipments[eqId]) {
          return {
            ...eq,
            inUseQuantity:
              (eq.inUseQuantity || 0) + quickBookData.equipments[eqId].quantity,
          };
        }
        return eq;
      });

      setEquipments(updatedEquipments);
      setBookings([...bookings, newBooking]);
      setShowQuickBook(false);
      setQuickBookData({
        ...quickBookData,
        customerName: "",
        phone: "",
        equipments: {},
      });
      alert("✅ Đã lưu ca đặt phòng thành công!");
    } catch (err: any) {
      alert(`⛔ LỖI SERVER:\n${err.message}`);
    } finally {
      const submitBtn = document.getElementById(
        "btn-submit-quickbook",
      ) as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = "Xác nhận Check-in & Thanh toán";
      }
    }
  };

  // ================= XỬ LÝ DUYỆT / TỪ CHỐI ĐƠN =================
  // ================= XỬ LÝ DUYỆT / TỪ CHỐI ĐƠN =================
  const handleUpdateStatus = (bookingId: string, newStatus: string) => {
    // Nếu bấm từ chối, mở bảng Xác nhận đẹp thay vì dùng window.confirm
    if (newStatus === "cancelled") {
      setConfirmCancel({ isOpen: true, bookingId });
      return;
    }
    // Nếu duyệt, gọi thẳng hàm xử lý
    executeUpdateStatus(bookingId, newStatus);
  };

  const executeUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const API_URL = "https://booklab247.onrender.com/api/v1";
      //const API_URL = "http://localhost:8000/api/v1";

      const response = await fetch(`${API_URL}/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Lỗi HTTP ${response.status}`);
      }

      // Cập nhật lại UI ngay lập tức
      setBookings((prevBookings) =>
        prevBookings.map((b) =>
          b.id === bookingId ? { ...b, status: newStatus } : b,
        ),
      );

      // Hiển thị thông báo nổi xịn sò
      showToast(
        newStatus === "confirmed"
          ? "Đã duyệt đơn thành công!"
          : "Đã từ chối đơn hàng.",
        "success",
      );
    } catch (error: any) {
      showToast(`Lỗi chi tiết: ${error.message}`, "error");
    }
  };

  // ================= XỬ LÝ BÁO CÁO BẢO TRÌ =================
  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModal.reason.trim()) return alert("Vui lòng nhập lý do!");

    if (reportModal.type === "room") {
      setRooms(
        rooms.map((r) =>
          r.id === reportModal.itemId || r._id === reportModal.itemId
            ? { ...r, maintenanceMode: true }
            : r,
        ),
      );
    } else {
      setEquipments(
        equipments.map((eq) =>
          eq.id === reportModal.itemId || eq._id === reportModal.itemId
            ? { ...eq, status: "maintenance" }
            : eq,
        ),
      );
    }

    alert(`✅ Đã gửi báo cáo bảo trì cho: ${reportModal.itemName}`);
    setReportModal({ ...reportModal, isOpen: false, reason: "" });
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  // ================= GIAO DIỆN LABS & EQUIPMENTS =================
  const renderLabsTable = () => (
    <>
    <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Quản lý Phòng Lab</h2>
          <p className="text-gray-500 font-medium text-sm mt-1">Kiểm soát trạng thái phòng Lab của hệ thống.</p>
        </div>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-md">+ Thêm Phòng</button>
      </div>
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm">
              <th className="p-4 font-bold text-gray-600">Tên Phòng</th>
              <th className="p-4 font-bold text-gray-600">
                Vị trí(Tòa Nhà - Tầng)
              </th>
              <th className="p-4 font-bold text-gray-600">Sức chứa</th>
              <th className="p-4 font-bold text-gray-600">Trạng thái</th>
              <th className="p-4 font-bold text-gray-600 text-center">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rooms.map((room) => (
              <tr
                key={room.id || room._id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="p-4 font-bold text-gray-900 flex items-center gap-3">
                  {room.imageUrl ? (
                    <img
                      src={room.imageUrl}
                      alt={room.name || room.title}
                      className="w-10 h-10 rounded-lg object-cover border border-gray-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <DoorOpen className="w-5 h-5" />
                    </div>
                  )}
                  {room.name || room.title}
                </td>
                <td className="p-4 text-gray-600">
                  {room.building || "Chưa gán"} - {room.floor || "Chưa gán"}
                </td>
                <td className="p-4 text-gray-600">
                  {room.capacity || 0} người
                </td>
                <td className="p-4">
                  {room.maintenanceMode ? (
                    <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-100">
                      <Wrench className="w-3.5 h-3.5" /> Bảo trì
                    </span>
                  ) : room.isBooked ? (
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-100">
                      <Clock className="w-3.5 h-3.5" /> Đã đặt
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng
                    </span>
                  )}
                </td>
                <td className="p-4 text-center">
                  {/* YÊU CẦU 4: Bật/Tắt bảo trì cho Phòng */}
                  {room.maintenanceMode ? (
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Xác nhận hoàn tất bảo trì phòng ${room.name || room.title}?`,
                          )
                        ) {
                          const currentRoomId = room.id || room._id;
                          setRooms(
                            rooms.map((r) =>
                              (r.id || r._id) === currentRoomId
                                ? { ...r, maintenanceMode: false }
                                : r,
                            ),
                          );
                        }
                      }}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Hoàn tất bảo trì"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        setReportModal({
                          isOpen: true,
                          type: "room",
                          itemId: room.id || room._id || "",
                          itemName: room.title || room.name || "",
                          reason: "",
                        })
                      }
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Báo cáo bảo trì/sửa chữa"
                    >
                      <Wrench className="w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>
  );

  const renderEquipmentsTable = () => (
    <>
    
    <div className="flex justify-between items-end mb-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Quản lý Thiết bị</h2>
        <p className="text-gray-500 font-medium text-sm mt-1">Kiểm soát trạng thái Thiết bị của hệ thống.</p>
      </div>
      <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-md">+ Thêm Phòng</button>
    </div>
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm">
              <th className="p-4 font-bold text-gray-600">Tên Thiết bị</th>
              <th className="p-4 font-bold text-gray-600">Danh mục</th>
              <th className="p-4 font-bold text-gray-600">Số lượng (Kho)</th>
              <th className="p-4 font-bold text-gray-600">Trạng thái</th>
              <th className="p-4 font-bold text-gray-600">Vị trí phòng</th>
              <th className="p-4 font-bold text-gray-600 text-center">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {equipments.map((eq) => {
              const matchedRoom = rooms.find(
                (r) => (r.id || r._id) === eq.roomId,
              );
              const roomName = matchedRoom
                ? matchedRoom.name || matchedRoom.title
                : "Trong kho";
              const availableQty =
                (eq.totalQuantity || 0) - (eq.inUseQuantity || 0);

              return (
                <tr
                  key={eq.id || eq._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4 font-bold text-gray-900 flex items-center gap-3">
                    {eq.imageUrl ? (
                      <img
                        src={eq.imageUrl}
                        alt={eq.name}
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                    {eq.name}
                  </td>
                  <td className="p-4">
                    <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold">
                      {eq.category || "Vật tư"}
                    </span>
                  </td>

                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                      Còn: {availableQty}/{eq.totalQuantity}
                    </span>
                  </td>

                  <td className="p-4">
                    {eq.status === "available" ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng
                      </span>
                    ) : eq.status === "maintenance" ? (
                      <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-100">
                        <Wrench className="w-3.5 h-3.5" /> Bảo trì
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
                        Thanh lý
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-gray-600 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" /> {roomName}
                  </td>
                  <td className="p-4 text-center">
                    {/* YÊU CẦU 4: Bật/Tắt sửa chữa cho Thiết bị */}
                    {eq.status === "maintenance" ? (
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Xác nhận hoàn tất sửa chữa thiết bị ${eq.name}?`,
                            )
                          ) {
                            const currentEqId = eq.id || eq._id;
                            setEquipments(
                              equipments.map((e) =>
                                (e.id || e._id) === currentEqId
                                  ? { ...e, status: "available" }
                                  : e,
                              ),
                            );
                          }
                        }}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Hoàn tất sửa chữa"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          setReportModal({
                            isOpen: true,
                            type: "equipment",
                            itemId: eq.id || eq._id || "",
                            itemName: eq.name,
                            reason: "",
                          })
                        }
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Báo cáo bảo trì/sửa chữa"
                      >
                        <Wrench className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );

  const renderDashboard = () => {
    const usedRoomsCount = rooms.filter((l) => l.isBooked).length;
    const maintenanceRoomsCount = rooms.filter((l) => l.maintenanceMode).length;
    const maintenanceEqsCount = equipments.filter(
      (e) => e.status === "maintenance",
    ).length;
    const totalMaintenance = maintenanceRoomsCount + maintenanceEqsCount;
    const itemsOut = equipments.reduce(
      (sum, eq) => sum + (eq.inUseQuantity || 0),
      0,
    );

    // 2. HÀM TÌM TÊN PHÒNG CHO ĐƠN ĐẶT
    const getRoomName = (bookingRoomId: string) => {
      if (!bookingRoomId) return "Phòng chưa xác định";
      const cleanBookingId = String(bookingRoomId).trim();
      const foundRoom = rooms.find(
        (r) => String(r.id || r._id).trim() === cleanBookingId,
      );
      return foundRoom
        ? foundRoom.title || foundRoom.name
        : "Phòng chưa xác định";
    };

    // 3. LỌC ĐƠN HÀNG CHỜ DUYỆT VÀ CA HÔM NAY
    const pendingBookings = bookings.filter((b) => b.status === "pending");
    const pendingCount = pendingBookings.length;

    const todayStr = new Date().toISOString().split("T")[0];
    const upcomingBookings = bookings
      .filter((b) => (b.date === todayStr || !b.date) && (b.status === "confirmed" || b.status === "checked-in" || b.status === "completed"))
      .filter(b => {
         if (!todaySearchQuery) return true;
         const q = todaySearchQuery.toLowerCase();
         // Smart Search: Quét cả Tên và SĐT
         return b.customerName.toLowerCase().includes(q) || b.phone.includes(q);
      })
      .sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));

    return (
      <div className="space-y-6 pb-10">
        {/* THANH TOP BAR */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              Giám sát Trực tiếp
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Cập nhật trạng thái phòng và thiết bị realtime.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-black transition-colors">
              <QrCode className="w-4 h-4" /> Quét mã QR
            </button> */}
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 w-full sm:w-auto items-center overflow-x-auto scrollbar-hide">
              {[
                { id: "today", label: "Hôm nay" },
                { id: "yesterday", label: "Hôm qua" },
                { id: "7days", label: "7 Ngày" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setTimeFilter(f.id as TimeFilter);
                    setCustomDate("");
                  }}
                  className={`px-4 py-1.5 text-sm font-bold rounded-lg whitespace-nowrap transition-all ${timeFilter === f.id && !customDate ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {f.label}
                </button>
              ))}
              <div className="h-4 w-px bg-gray-300 mx-2"></div>
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setTimeFilter("custom");
                }}
                className={`px-3 py-1 text-sm font-bold rounded-lg bg-transparent outline-none cursor-pointer ${customDate ? "text-emerald-600 bg-white shadow-sm" : "text-gray-500"}`}
              />
            </div>
          </div>
        </div>

        {/* THỐNG KÊ TỔNG QUAN */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-300">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 mb-1">ĐANG SỬ DỤNG</p>
            <h3 className="text-2xl font-black text-emerald-600">
              {usedRoomsCount}/{rooms.length}{" "}
              <span className="text-sm font-medium text-gray-400">Phòng</span>
            </h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 mb-1">CHỜ DUYỆT</p>
            <h3 className="text-2xl font-black text-amber-500">
              {pendingCount}{" "}
              <span className="text-sm font-medium text-gray-400">Đơn</span>
            </h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 mb-1">
              THIẾT BỊ RỜI KHO
            </p>
            <h3 className="text-2xl font-black text-blue-600">
              {itemsOut}{" "}
              <span className="text-sm font-medium text-gray-400">Món</span>
            </h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-500 mb-1">
              BẢO TRÌ ĐỘT XUẤT
            </p>
            <h3 className="text-2xl font-black text-red-500">
              {totalMaintenance}{" "}
              <span className="text-sm font-medium text-gray-400">Sự cố</span>
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
          {/* CỘT 1: LỊCH CA HÔM NAY */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[350px]">
            <div className="p-4 border-b border-gray-100 flex flex-col gap-3 shrink-0">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-500" /> Các ca hoạt động hôm nay
              </h3>

              {/* SMART SEARCH BAR */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm Tên hoặc SĐT (Ví dụ: 098...)"
                  value={todaySearchQuery}
                  onChange={(e) => setTodaySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              {upcomingBookings.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-10">
                  Không có lịch học nào hôm nay.
                </div>
              ) : (
                upcomingBookings.map((booking) => {
                  const roomName = getRoomName(booking.roomId);
                  return (
                    <div
                      key={booking.id}
                      className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {booking.customerName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Phòng:{" "}
                          <span className="font-bold text-gray-700">
                            {roomName}
                          </span>
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2 shrink-0">
                        <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-sm shadow-sm">
                          {booking.startTime}
                        </span>
                        {/* TAG TRẠNG THÁI THANH TOÁN */}
                        {booking.paymentStatus === "HOÀN THÀNH" ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                             <CheckCircle2 className="w-3 h-3"/> Đã thu
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                             <AlertTriangle className="w-3 h-3"/> Nợ
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>


          {/* CỘT 1: LỊCH CA HÔM NAY (Hiển thị Timeline kèm trạng thái hủy) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[350px]">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-500" /> Các ca hoạt động hôm nay
              </h3>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              {bookings.filter(b => b.date === todayStr && ['confirmed', 'checked-in', 'cancelled'].includes(b.status)).length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-10">Không có hoạt động nào hôm nay.</div>
              ) : (
                bookings
                  .filter(b => b.date === todayStr && ['confirmed', 'checked-in', 'cancelled'].includes(b.status))
                  .sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime))
                  .map((booking) => {
                    const roomName = getRoomName(booking.roomId);
                    const isCancelled = booking.status === 'cancelled';
                    return (
                      <div
                        key={booking.id}
                        className={`border p-3 rounded-xl flex justify-between items-center cursor-pointer transition-colors ${
                          isCancelled ? "bg-gray-50 border-dashed border-gray-200 opacity-60" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                        }`}
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <div className={isCancelled ? "line-through text-gray-400" : ""}>
                          <p className={`font-bold text-sm ${isCancelled ? "text-gray-500" : "text-gray-900"}`}>{booking.customerName}</p>
                          <p className="text-xs mt-0.5">Phòng: <span className="font-bold">{roomName}</span></p>
                          {isCancelled && <p className="text-[10px] text-red-500 font-bold mt-1">❌ Đã hủy</p>}
                        </div>
                        <div className="text-right">
                          <span className={`font-black px-2 py-1 rounded-lg text-sm shadow-sm ${
                            isCancelled ? "bg-gray-200 text-gray-500" : "bg-emerald-50 text-emerald-600"
                          }`}>
                            {booking.startTime}
                          </span>
                        </div>
                      </div>
                    );
                })
              )}
            </div>
          </div>

          {/* CỘT 2: ĐƠN CHỜ DUYỆT KHẨN (Hiển thị Tag Khẩn cấp & Cảnh báo trùng lịch) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[350px] overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-amber-50/30">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 text-amber-500 ${pendingCount > 0 ? "animate-pulse" : ""}`} /> 
                Đơn chờ duyệt
              </h3>
              
              {/* BADGE THÔNG BÁO ĐỎ CÓ SỐ LƯỢNG */}
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-md shadow-red-500/30 animate-bounce">
                  {pendingCount} đơn mới
                </span>
              )}
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              {pendingBookings.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-10">Không có đơn chờ duyệt.</div>
              ) : (
                pendingBookings.map((booking) => {
                  const roomName = getRoomName(booking.roomId);
                  
                  // 1. TÍNH TOÁN GIỜ KẾT THÚC CHÍNH XÁC
                  const endTimeStr = minsToTime(timeToMins(booking.startTime) + booking.durationMins);

                  return (
                    <div key={booking.id} className={`p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden transition-all ${
                      booking.is_conflict 
                        ? "bg-red-50 border border-red-200" 
                        : "bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300"
                    }`}>
                      {booking.is_urgent && (
                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl animate-pulse shadow-sm">
                          DÙNG HÔM NAY
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start">
                        <div className="w-full">
                          {/* 2. HIỂN THỊ TÊN NGƯỜI ĐẶT (To, rõ và đậm hơn) */}
                          <p className="font-black text-slate-900 text-lg">
                            {booking.customerName || "Khách chưa có tên"}
                          </p>
                          
                          {/* 3. HIỂN THỊ NGÀY VÀ KHOẢNG THỜI GIAN (Tăng size, thêm Icon) */}
                          <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-1.5 flex-wrap">
                            <CalendarDays className="w-4 h-4 text-slate-400" /> {booking.date} 
                            <span className="text-slate-300 mx-1">|</span> 
                            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100/50 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {booking.startTime} - {endTimeStr}
                            </span>
                          </p>
                          
                          <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            Phòng: <span className="font-black text-slate-800">{roomName}</span>
                          </p>

                          {/* 4. HIỂN THỊ DANH SÁCH THIẾT BỊ MƯỢN KÈM (Tăng size tag) */}
                          {booking.equipments && booking.equipments.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-100">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Thiết bị mượn kèm:</p>
                              <div className="flex flex-wrap gap-2">
                                {booking.equipments.map((eq: any, idx: number) => (
                                  <span key={idx} className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-sm">
                                    <Package className="w-3.5 h-3.5 text-slate-500" />
                                    {eq.name} <span className="font-black text-blue-600 ml-0.5">x{eq.quantity}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Cảnh báo trùng lịch */}
                      {booking.is_conflict && (
                        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl font-medium border border-red-200 mt-1">
                          <AlertTriangle className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                          <b>Trùng lịch:</b> Khung giờ này đã được duyệt cho khách <b>{booking.conflict_with}</b>.
                        </div>
                      )}

                      {/* Nút hành động (To hơn, bo góc mạnh hơn) */}
                      <div className="flex gap-3 mt-2 pt-2">
                        <button
                          onClick={() => handleUpdateStatus(booking.id, "confirmed")}
                          disabled={booking.is_conflict}
                          className={`flex-1 text-white text-sm font-black py-3 rounded-xl transition-all shadow-sm ${
                            booking.is_conflict ? "bg-slate-300 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600 hover:shadow-md active:scale-95"
                          }`}
                        >
                          Duyệt đơn
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(booking.id, "cancelled")}
                          className="flex-1 bg-white hover:bg-red-50 text-red-600 border-2 border-red-100 hover:border-red-200 text-sm font-black py-3 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  const renderReports = () => (
    <div className="p-6 bg-white rounded-2xl border border-gray-100 text-center py-20 text-gray-400">
      Giao diện Báo cáo sự cố
    </div>
  );
  // ================= GIAO DIỆN TRA CỨU THÔNG TIN (OMNI-LOOKUP) =================
  const renderLookup = () => {
    // 1. DATA: KHÁCH HÀNG (Giữ nguyên)
    const generateCustomerProfiles = (): CustomerProfile[] => {
      const profileMap: Record<string, CustomerProfile> = {};
      bookings.forEach(b => {
        const phone = b.phone || "Không có SĐT";
        if (!profileMap[phone]) {
          const savedData = customerNotes[phone] || { tags: ["Regular"], note: "" };
          profileMap[phone] = {
            phone, fullName: b.customerName,
            totalBookings: 0, completed: 0, cancelled: 0,
            tags: savedData.tags, internalNote: savedData.note, bookingHistory: []
          };
        }
        profileMap[phone].totalBookings += 1;
        if (b.status === "completed") profileMap[phone].completed += 1;
        if (b.status === "cancelled" || b.status === "rejected") profileMap[phone].cancelled += 1;
        profileMap[phone].bookingHistory.push(b);
        profileMap[phone].fullName = b.customerName; 
      });
      return Object.values(profileMap).filter(c => !lookupSearch || c.phone.includes(lookupSearch) || c.fullName.toLowerCase().includes(lookupSearch.toLowerCase()));
    };

    // 2. DATA: TRUY VẾT THIẾT BỊ (ĐÃ FIX GOM NHÓM & TRẠNG THÁI)
    const generateEquipmentTracking = (): EquipmentTrackingInfo[] => {
      // BƯỚC 1: Gom nhóm thiết bị trong kho theo TÊN (tránh hiển thị 3 dòng Máy Chiếu bị tách rời)
      const groupedEqs: Record<string, EquipmentItem> = {};
      equipments.forEach(eq => {
        const name = eq.name.trim();
        if (!groupedEqs[name]) {
          groupedEqs[name] = { ...eq };
        } else {
          groupedEqs[name].totalQuantity = (groupedEqs[name].totalQuantity || 0) + (eq.totalQuantity || 0);
          // Lưu gộp các ID lại để lát nữa quét xem khách mượn ID nào cũng tính
          groupedEqs[name].id = `${groupedEqs[name].id || groupedEqs[name]._id},${eq.id || eq._id}`;
        }
      });

      // BƯỚC 2: Quét tìm người mượn
      return Object.values(groupedEqs).filter(eq => !lookupSearch || eq.name.toLowerCase().includes(lookupSearch.toLowerCase())).map(eq => {
        const eqIds = String(eq.id || "").split(','); // Danh sách các ID của thiết bị này
        const borrowerMap: Record<string, EquipmentTrackingInfo["currentlyBorrowedBy"][0]> = {};
        let actualInUse = 0; 
        
        // Quét các booking đang mượn (Bao gồm cả 'checked-in' và 'DANG_MUON' từ Backend)
        bookings.filter(b => ["checked-in", "DANG_MUON", "confirmed"].includes(b.status)).forEach(b => {
          // Tìm xem booking này có mượn món đồ nào khớp với danh sách ID không
          const usedEq = b.equipments?.find(e => eqIds.includes(String(e.id || (e as any)._id || "")));
          
          if (usedEq && usedEq.quantity > 0) {
            actualInUse += Number(usedEq.quantity);
            const rName = rooms.find(r => String(r.id || r._id) === String(b.roomId))?.title || "Chưa rõ";
            
            const bDate = b.date || selectedDate;
            const endMs = timeToMins(b.startTime) + b.durationMins;
            const endH = Math.floor(endMs / 60) % 24;
            const endM = endMs % 60;
            const returnTimeStr = `${endH.toString().padStart(2,'0')}:${endM.toString().padStart(2,'0')}`;
            const [yyyy, mm, dd] = bDate.split('-');
            const displayTime = `${dd}/${mm} - ${returnTimeStr}`; 
            
            const returnDateTime = new Date(`${bDate}T${returnTimeStr}:00`);
            const isOverdue = currentTime > returnDateTime;

            if (borrowerMap[b.id]) {
              borrowerMap[b.id].quantity += Number(usedEq.quantity);
            } else {
              borrowerMap[b.id] = {
                bookingId: b.id,
                roomName: rName,
                customerName: b.customerName,
                quantity: Number(usedEq.quantity),
                expectedReturnTime: displayTime,
                isOverdue: isOverdue,
                originalBooking: b
              };
            }
          }
        });

        return {
          equipmentId: eqIds[0],
          name: eq.name,
          inStock: Math.max(0, (eq.totalQuantity || 0) - actualInUse), // Trừ chính xác
          total: eq.totalQuantity || 0,
          currentlyBorrowedBy: Object.values(borrowerMap)
        };
      });
    };

    // 3. DATA: TÌM PHÒNG THÔNG MINH
    const generateAvailableRooms = () => {
      const searchStartMins = timeToMins(smartRoomForm.startTime);
      const searchEndMins = timeToMins(smartRoomForm.endTime);
      if (searchEndMins <= searchStartMins) return []; // Auto chặn các case lỗi giờ (ví dụ 12h - 02h)

      // Lọc thiết bị nếu có yêu cầu
      if (smartRoomForm.equipmentId) {
        const requiredEq = equipments.find(e => (e.id || e._id) === smartRoomForm.equipmentId);
        const eqAvailable = (requiredEq?.totalQuantity || 0) - (requiredEq?.inUseQuantity || 0);
        if (eqAvailable <= 0) return []; // Kho hết đồ -> Không trả ra phòng nào
      }

      return rooms.filter(room => {
        if (room.maintenanceMode) return false;
        if (Number(room.capacity || 0) < smartRoomForm.minCapacity) return false;
        const roomIdStr = room.id || room._id;
        
        const isConflictNormal = bookings.some(b => {
          if (b.roomId !== roomIdStr || b.status === "cancelled") return false;
          if ((b.date || selectedDate) !== smartRoomForm.date) return false;
          const bStartMins = timeToMins(b.startTime);
          const bEndMins = bStartMins + b.durationMins + b.bufferMins;
          return searchStartMins < bEndMins && searchEndMins > bStartMins;
        });
        if (isConflictNormal) return false;

        const isConflictFixed = fixedBookings.some(fb => {
          if (fb.roomId !== roomIdStr || fb.status !== "active") return false;
          if (fb.exceptionDates?.includes(smartRoomForm.date)) return false;
          const targetDayNum = new Date(smartRoomForm.date + "T00:00:00").getDay();
          if (!fb.daysOfWeek.includes(targetDayNum)) return false;
          if (smartRoomForm.date < fb.startDate || smartRoomForm.date > fb.endDate) return false;

          const fStartMins = timeToMins(fb.startTime);
          const fEndMins = timeToMins(fb.endTime);
          return searchStartMins < fEndMins && searchEndMins > fStartMins;
        });
        return !isConflictFixed;
      });
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* THANH OMNIBOX (Giữ nguyên) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6">
          <div className="relative w-full max-w-3xl mx-auto">
            <Search className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
            <input 
              type="text" 
              placeholder="Gõ SĐT khách hàng hoặc Tên thiết bị để tra cứu nhanh..." 
              value={lookupSearch}
              onChange={(e) => {
                setLookupSearch(e.target.value);
                if (/[0-9]{3}/.test(e.target.value)) setLookupTab("customer");
                else if (e.target.value) setLookupTab("equipment");
              }}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-lg font-bold outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
            />
          </div>
          <div className="flex justify-center gap-2">
            {[ { id: "customer", label: "Khách hàng (CRM)" }, { id: "room", label: "Tìm Phòng (Smart)" }, { id: "equipment", label: "Truy vết Thiết bị" } ].map(t => (
              <button 
                key={t.id} onClick={() => setLookupTab(t.id as any)}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${lookupTab === t.id ? "bg-slate-900 text-white shadow-md" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: KHÁCH HÀNG (Giữ nguyên HTML cũ) */}
        {lookupTab === "customer" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {generateCustomerProfiles().length === 0 ? (
              <div className="col-span-full py-10 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">Không tìm thấy khách hàng nào khớp với tìm kiếm.</div>
            ) : generateCustomerProfiles().map(customer => (
              <div key={customer.phone} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2"><UserCircle className="w-5 h-5 text-blue-500"/> {customer.fullName}</h3>
                    <p className="text-gray-500 font-bold text-sm mt-0.5">{customer.phone}</p>
                  </div>
                  <div className="flex gap-1">
                    {customer.tags.map(tag => (
                      <span key={tag} className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${tag==='VIP'?'bg-amber-100 text-amber-700':tag==='Warning'?'bg-red-100 text-red-700':'bg-gray-100 text-gray-600'}`}>{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                  <div><p className="text-xl font-black text-blue-600">{customer.totalBookings}</p><p className="text-[10px] font-bold text-gray-400 uppercase">Tổng ca</p></div>
                  <div><p className="text-xl font-black text-emerald-600">{customer.completed}</p><p className="text-[10px] font-bold text-gray-400 uppercase">Hoàn thành</p></div>
                  <div><p className="text-xl font-black text-red-500">{customer.cancelled}</p><p className="text-[10px] font-bold text-gray-400 uppercase">Hủy / Bùng</p></div>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1"><Tag className="w-3 h-3"/> Ghi chú nội bộ</p>
                  <textarea 
                    className="w-full text-sm p-2 bg-yellow-50/50 border border-yellow-200 rounded-lg outline-none focus:border-yellow-400 text-yellow-900 placeholder:text-yellow-400" 
                    rows={2} placeholder="Thêm ghi chú riêng về khách này..."
                    defaultValue={customer.internalNote}
                    onBlur={(e) => {
                      setCustomerNotes({...customerNotes, [customer.phone]: { ...customerNotes[customer.phone], tags: customer.tags, note: e.target.value }})
                    }}
                  />
                </div>

                <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 sticky top-0"><tr><th className="p-2 font-bold text-slate-600">Ngày</th><th className="p-2 font-bold text-slate-600">Phòng</th><th className="p-2 font-bold text-slate-600 text-right">Tình trạng</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {customer.bookingHistory.sort((a,b)=> new Date(b.date||"").getTime() - new Date(a.date||"").getTime()).map(h => {
                         const rName = rooms.find(r=>(r.id||r._id) === h.roomId)?.title || "Phòng";
                         return (
                           <tr key={h.id} className="hover:bg-slate-50">
                             <td className="p-2 text-gray-600 font-medium">{h.date?.split('-').reverse().join('/')}</td>
                             <td className="p-2 font-bold text-gray-800 capitalize">{rName}</td>
                             <td className="p-2 text-right">
                               <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${h.paymentStatus==='HOÀN THÀNH'?'bg-emerald-50 text-emerald-600':h.status==='cancelled'?'bg-red-50 text-red-500':'bg-amber-50 text-amber-600'}`}>
                                  {h.paymentStatus==='HOÀN THÀNH' ? 'Đã thu' : h.status==='cancelled' ? 'Hủy' : 'Chưa thu'}
                               </span>
                             </td>
                           </tr>
                         )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: TÌM PHÒNG THÔNG MINH (Đã cải thiện Độ Tương Phản & Bổ sung Dropdown Thiết Bị) */}
        {lookupTab === "room" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-md flex flex-wrap gap-4 items-end">
               <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-blue-200 mb-1.5 uppercase tracking-wider">Ngày cần thuê</label>
                  <input type="date" value={smartRoomForm.date} onChange={e => setSmartRoomForm({...smartRoomForm, date: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none text-gray-900 font-bold" />
               </div>
               <div className="w-full md:w-32">
                  <label className="block text-xs font-bold text-blue-200 mb-1.5 uppercase tracking-wider">Từ giờ</label>
                  <input type="time" value={smartRoomForm.startTime} onChange={e => setSmartRoomForm({...smartRoomForm, startTime: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none text-gray-900 font-bold" />
               </div>
               <div className="w-full md:w-32">
                  <label className="block text-xs font-bold text-blue-200 mb-1.5 uppercase tracking-wider">Đến giờ</label>
                  <input type="time" value={smartRoomForm.endTime} onChange={e => setSmartRoomForm({...smartRoomForm, endTime: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none text-gray-900 font-bold" />
               </div>
               <div className="w-full md:w-32">
                  <label className="block text-xs font-bold text-blue-200 mb-1.5 uppercase tracking-wider">Sức chứa &ge;</label>
                  <input type="number" min={1} value={smartRoomForm.minCapacity} onChange={e => setSmartRoomForm({...smartRoomForm, minCapacity: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none text-gray-900 font-bold" />
               </div>
               {/* Ô DROPDOWN TÌM THIẾT BỊ MỞ RỘNG */}
               <div className="w-full md:w-48">
                  <label className="block text-xs font-bold text-blue-200 mb-1.5 uppercase tracking-wider">Thiết bị kèm theo</label>
                  <select value={smartRoomForm.equipmentId} onChange={e => setSmartRoomForm({...smartRoomForm, equipmentId: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none text-gray-900 font-bold">
                     <option value="">Không yêu cầu</option>
                     {equipments.map(eq => <option key={eq.id || eq._id} value={eq.id || eq._id}>{eq.name}</option>)}
                  </select>
               </div>
            </div>

            {timeToMins(smartRoomForm.endTime) <= timeToMins(smartRoomForm.startTime) && (
              <div className="bg-amber-50 text-amber-700 p-3 rounded-lg text-sm font-bold border border-amber-200 flex items-center gap-2">
                 <AlertTriangle className="w-5 h-5"/> Giờ kết thúc đang nhỏ hơn hoặc bằng giờ bắt đầu. Vui lòng nhập định dạng 24h (Ví dụ: 14:30 thay vì 02:30).
              </div>
            )}

            <h3 className="font-black text-gray-900 text-lg">Kết quả: {generateAvailableRooms().length} phòng trống</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {generateAvailableRooms().map(room => (
                <div key={room.id||room._id} className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                   <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl">Trống lịch</div>
                   <h4 className="font-black text-lg text-gray-900 mt-2 capitalize">{room.title||room.name}</h4>
                   <p className="text-sm text-gray-500 font-medium mt-1"><MapPin className="w-3.5 h-3.5 inline text-gray-400"/> {room.building} - {room.floor}</p>
                   <p className="text-sm text-gray-500 font-medium mt-1"><Users className="w-3.5 h-3.5 inline text-gray-400"/> Sức chứa: <span className="font-bold text-gray-800">{room.capacity}</span> người</p>
                   <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                      <span className="font-black text-emerald-600">{Number(room.price||0).toLocaleString()}đ<span className="text-xs text-gray-400 font-medium">/h</span></span>
                      
                      {/* FIX UX QUICK BOOK: Auto Fill Data */}
                      <button onClick={() => {
                         setQuickBookData({
                           ...quickBookData, 
                           roomId: String(room.id||room._id), 
                           startDate: smartRoomForm.date, 
                           endDate: smartRoomForm.date,
                           startTime: smartRoomForm.startTime, 
                           endTime: smartRoomForm.endTime,
                           equipments: {} // Có thể bổ sung auto check thiết bị ở đây nếu muốn
                         });
                         setShowQuickBook(true);
                      }} className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white font-bold rounded-xl text-sm transition-colors">
                        Book ngay
                      </button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TRUY VẾT THIẾT BỊ (Đã nâng cấp Cảnh báo Đỏ & Clickable UI) */}
        {lookupTab === "equipment" && (
          <div className="space-y-4">
             {generateEquipmentTracking().map(eq => (
               <div key={eq.equipmentId} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 p-4 flex justify-between items-center border-b border-gray-200">
                     <h3 className="font-black text-lg text-gray-900 flex items-center gap-2"><Package className="w-5 h-5 text-indigo-500"/> {eq.name}</h3>
                     <div className="flex gap-4 text-sm font-bold">
                        <span className="text-gray-500">Tổng: {eq.total}</span>
                        <span className={eq.inStock > 0 ? "text-emerald-600" : "text-red-500"}>Sẵn sàng: {eq.inStock}</span>
                     </div>
                  </div>
                  <div className="p-4">
                     {eq.currentlyBorrowedBy.length === 0 ? (
                       <p className="text-sm text-gray-500 italic flex items-center gap-2"><Info className="w-4 h-4"/> Tất cả thiết bị đang nằm trong kho.</p>
                     ) : (
                       <table className="w-full text-left text-sm">
                         <thead><tr className="text-gray-400"><th className="pb-2">Đang mượn bởi</th><th className="pb-2">Phòng sử dụng</th><th className="pb-2 text-center">Số lượng</th><th className="pb-2 text-right">Giờ trả dự kiến</th></tr></thead>
                         <tbody className="divide-y divide-gray-100">
                            {eq.currentlyBorrowedBy.sort((a,b)=> timeToMins(a.expectedReturnTime.split('- ')[1]) - timeToMins(b.expectedReturnTime.split('- ')[1])).map((b, i) => (
                              <tr key={i}>
                                <td className="py-3 font-bold text-gray-900">{b.customerName}</td>
                                <td className="py-3">
                                   {/* Room Clickable -> Mở Modal Chi tiết */}
                                   <button 
                                      onClick={() => setSelectedBooking(b.originalBooking)}
                                      className="text-indigo-600 hover:text-indigo-800 hover:underline font-bold bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors capitalize"
                                   >
                                      {b.roomName}
                                   </button>
                                </td>
                                <td className="py-3 text-center font-black">{b.quantity}</td>
                                <td className="py-3 text-right">
                                   {/* UI Cảnh báo Đỏ nếu quá hạn */}
                                   {b.isOverdue ? (
                                     <span className="text-red-600 font-bold bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 inline-flex items-center gap-1 shadow-sm animate-pulse">
                                       <AlertTriangle className="w-3.5 h-3.5"/> Quá hạn ({b.expectedReturnTime})
                                     </span>
                                   ) : (
                                     <span className="text-amber-600 font-bold bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                                       <Clock className="w-3.5 h-3.5 inline mr-1"/> {b.expectedReturnTime}
                                     </span>
                                   )}
                                </td>
                              </tr>
                            ))}
                         </tbody>
                       </table>
                     )}
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    );
  };

  // ================= GIAO DIỆN MASTER SCHEDULE (THỜI KHÓA BIỂU) =================
  const renderMasterSchedule = () => {
    const WEEK_DAYS = [{id:1, label:"Thứ 2"}, {id:2, label:"Thứ 3"}, {id:3, label:"Thứ 4"}, {id:4, label:"Thứ 5"}, {id:5, label:"Thứ 6"}, {id:6, label:"Thứ 7"}, {id:0, label:"Chủ Nhật"}];

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex justify-between items-end bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Thời Khóa Biểu (Cố Định)</h2>
            <p className="text-gray-500 text-sm mt-1">Quản lý các lớp học/sự kiện lặp lại hàng tuần.</p>
          </div>
          <button onClick={() => { 
            setFixedForm({
              roomId: "", title: "", startDate: selectedDate, endDate: "", daysOfWeek: [], startTime: "07:00", endTime: "11:30", note: ""
            });
            setEditingRuleId(null);
            setFixedStep("input"); 
            setShowFixedModal(true); 
          }} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-md">
            <Plus className="w-4 h-4" /> Tạo Lịch Cố Định
          </button>
        </div>

        {/* DANH SÁCH QUY TẮC */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-bold text-gray-600 text-sm">Lớp / Sự kiện</th>
                <th className="p-4 font-bold text-gray-600 text-sm">Phòng Lab</th>
                <th className="p-4 font-bold text-gray-600 text-sm">Lịch học</th>
                <th className="p-4 font-bold text-gray-600 text-sm">Thời hạn</th>
                <th className="p-4 font-bold text-gray-600 text-sm text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fixedBookings.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Chưa có lịch cố định nào được tạo.</td></tr>
              ) : (
                fixedBookings.map(rule => {
                  const rName = rooms.find(r => (r.id || r._id) === rule.roomId)?.title || "Chưa rõ"; // FIX TÊN PHÒNG Ở ĐÂY
                  const daysStr = rule.daysOfWeek.map(d => d === 0 ? "CN" : `T${d+1}`).join(", ");
                  return (
                    <tr key={rule.id} className="hover:bg-gray-50">
                      <td className="p-4 font-black text-gray-900 flex items-center gap-2"><Lock className="w-4 h-4 text-purple-600"/> {rule.title}</td>
                      <td className="p-4 font-bold text-gray-700">{rName}</td>
                      <td className="p-4"><span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-xs font-bold mr-2">{daysStr}</span> {rule.startTime} - {rule.endTime}</td>
                      <td className="p-4 text-sm text-gray-500">{rule.startDate.split('-').reverse().join('/')} đến {rule.endDate.split('-').reverse().join('/')}</td>
                      <td className="p-4 text-center flex justify-center items-center gap-2">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${rule.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {rule.status === 'active' ? "Đang chạy" : "Tạm dừng"}
                        </span>
                        
                        {/* NÚT CHỈNH SỬA */}
                        <button 
                          onClick={() => {
                            setFixedForm({
                              roomId: rule.roomId, title: rule.title, startDate: rule.startDate, endDate: rule.endDate,
                              daysOfWeek: rule.daysOfWeek, startTime: rule.startTime, endTime: rule.endTime, note: rule.note || ""
                            });
                            setEditingRuleId(rule.id);
                            setFixedStep("input");
                            setShowFixedModal(true);
                          }}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Chỉnh sửa chuỗi lịch"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* NÚT XÓA DATABASE */}
                        <button 
                          onClick={async () => {
                            if(confirm("Bạn có chắc chắn muốn xóa TOÀN BỘ chuỗi lịch cố định này khỏi hệ thống?")) {
                              try {
                                await fetch(`https://booklab247.onrender.com/api/v1/bookings/fixed/${rule.id}`, {
                                  method: "DELETE",
                                  headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
                                });
                                loadData();
                                showToast("Đã xóa chuỗi lịch cố định!", "success");
                              } catch(e) {}
                            }
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa toàn bộ chuỗi"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* CHẾ ĐỘ XEM DẠNG LƯỚI TUẦN (WEEKLY GRID) */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-gray-900">Xem dạng Lưới Tuần (Weekly Grid)</h3>
             <select value={gridRoomFilter} onChange={e => setGridRoomFilter(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-bold bg-gray-50 outline-none">
                <option value="">-- Chọn phòng xem lịch --</option>
                {rooms.map(r => <option key={r.id||r._id} value={r.id||r._id}>{r.name||r.title}</option>)}
             </select>
          </div>
          {gridRoomFilter ? (
            <div className="grid grid-cols-7 gap-3">
              {WEEK_DAYS.map(day => (
                <div key={day.id} className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                   <div className="bg-slate-200 p-2 text-center text-sm font-black text-gray-700 border-b border-gray-200">{day.label}</div>
                   <div className="p-2 space-y-2 min-h-[150px]">
                      {fixedBookings.filter(fb => fb.roomId === gridRoomFilter && fb.status === 'active' && fb.daysOfWeek.includes(day.id)).map(fb => (
                        <div key={fb.id} className="bg-purple-100 border border-purple-200 rounded-lg p-2 text-xs">
                          <p className="font-black text-purple-900 truncate">{fb.title}</p>
                          <p className="text-purple-700 font-bold mt-1">{fb.startTime} - {fb.endTime}</p>
                        </div>
                      ))}
                   </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-6">Vui lòng chọn phòng để xem lưới lịch.</p>}
        </div>

        {/* MODAL TẠO LỊCH CỐ ĐỊNH & CONFLICT RESOLUTION */}
        <AnimatePresence>
          {showFixedModal && (
            <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
                <div className="bg-purple-700 p-5 flex justify-between items-center text-white shrink-0">
                  <h3 className="font-black text-xl flex items-center gap-2"><CalendarRange className="w-5 h-5"/> Tạo Lịch Cố Định</h3>
                  <button onClick={() => setShowFixedModal(false)} className="hover:bg-purple-800 p-1 rounded-full"><X className="w-6 h-6" /></button>
                </div>
                
                {fixedStep === "input" ? (
                  <form onSubmit={handleCheckFixedConflicts} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Tên Lớp / Sự kiện *</label>
                        <input type="text" required placeholder="VD: Thực hành Mạng máy tính" value={fixedForm.title} onChange={e => setFixedForm({...fixedForm, title: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Chọn Phòng Lab *</label>
                        <select required value={fixedForm.roomId} onChange={e => setFixedForm({...fixedForm, roomId: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none">
                          <option value="" disabled>-- Chọn phòng --</option>
                          {rooms.map(r => <option key={r.id||r._id} value={r.id||r._id}>{r.name||r.title}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-2">
                         <label className="block text-sm font-bold text-gray-700">Tần suất (Lặp lại vào) *</label>
                         <button type="button" onClick={() => setFixedForm({...fixedForm, daysOfWeek: [1,2,3,4,5,6,0]})} className="text-xs font-bold text-purple-600 hover:underline">
                           Chọn tất cả (Hàng ngày)
                         </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {WEEK_DAYS.map(d => (
                          <label key={d.id} className={`px-4 py-2 border rounded-xl cursor-pointer font-bold text-sm transition-colors ${fixedForm.daysOfWeek.includes(d.id) ? 'bg-purple-100 border-purple-500 text-purple-700' : 'bg-white hover:bg-gray-50 text-gray-600'}`}>
                            <input type="checkbox" className="hidden" checked={fixedForm.daysOfWeek.includes(d.id)} onChange={(e) => {
                              const newDays = e.target.checked ? [...fixedForm.daysOfWeek, d.id] : fixedForm.daysOfWeek.filter(x => x !== d.id);
                              setFixedForm({...fixedForm, daysOfWeek: newDays});
                            }} /> {d.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-purple-50 p-4 rounded-xl border border-purple-100">
                      <div>
                         <label className="block text-xs font-bold text-purple-900 mb-1 uppercase">Bắt đầu chuỗi từ</label>
                         <input type="date" required value={fixedForm.startDate} onChange={e => setFixedForm({...fixedForm, startDate: e.target.value})} className="w-full px-3 py-2 bg-white rounded-lg outline-none" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-purple-900 mb-1 uppercase">Kết thúc chuỗi ngày</label>
                         <input type="date" required value={fixedForm.endDate} onChange={e => setFixedForm({...fixedForm, endDate: e.target.value})} className="w-full px-3 py-2 bg-white rounded-lg outline-none" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-purple-900 mb-1 uppercase">Giờ vào lớp</label>
                         <input type="time" required value={fixedForm.startTime} onChange={e => setFixedForm({...fixedForm, startTime: e.target.value})} className="w-full px-3 py-2 bg-white rounded-lg outline-none" />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-purple-900 mb-1 uppercase">Giờ tan lớp</label>
                         <input type="time" required value={fixedForm.endTime} onChange={e => setFixedForm({...fixedForm, endTime: e.target.value})} className="w-full px-3 py-2 bg-white rounded-lg outline-none" />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                       <button type="button" onClick={() => setShowFixedModal(false)} className="px-6 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Hủy</button>
                       <button type="submit" className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md">Kiểm tra Khả dụng</button>
                    </div>
                  </form>
                ) : (
                  <div className="p-6 flex flex-col items-center text-center">
                    {conflictList.length === 0 ? (
                      <>
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4"><CheckCircle2 className="w-8 h-8"/></div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">Không phát hiện trùng lịch!</h3>
                        <p className="text-sm text-gray-500 mb-6">Chuỗi thời gian bạn chọn hoàn toàn trống. Bạn có thể tạo lịch ngay.</p>
                        <div className="w-full flex gap-3">
                          <button onClick={() => setFixedStep("input")} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl">Quay lại</button>
                          <button onClick={() => handleCreateFixedRule('skip')} className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-md">Hoàn tất Tạo Lịch</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="w-8 h-8"/></div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">Phát hiện Trùng Lịch!</h3>
                        <p className="text-sm text-gray-500 mb-4">Hệ thống tìm thấy <b>{conflictList.length}</b> đơn đặt phòng lẻ đã tồn tại trong chuỗi thời gian bạn cấu hình.</p>
                        
                        <div className="w-full bg-red-50 border border-red-100 rounded-xl max-h-40 overflow-y-auto p-2 mb-6 space-y-2 text-left">
                          {conflictList.map(c => (
                            <div key={c.id} className="bg-white p-2 rounded-lg text-xs shadow-sm flex justify-between">
                              <span><b>{c.customerName}</b> ({c.startTime} - {c.durationMins}p)</span>
                              <span className="text-red-500 font-bold">{c.date?.split('-').reverse().join('/')}</span>
                            </div>
                          ))}
                        </div>

                        <div className="w-full flex gap-3">
                          <button onClick={() => setFixedStep("input")} className="w-1/4 py-3 bg-gray-100 font-bold rounded-xl text-sm">Sửa lại</button>
                          <button onClick={() => handleCreateFixedRule('skip')} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm"><SkipForward className="w-4 h-4"/> Bỏ qua & Tạo</button>
                          <button onClick={() => handleCreateFixedRule('override')} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-md text-sm">Ghi đè (Hủy đơn cũ)</button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // ================= GIAO DIỆN TIMELINE EXCEL XUYÊN NGÀY =================
  const renderTimeline = () => {
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
    const filteredRooms = rooms.filter((room) => {
      const roomIdStr = room.id || room._id || "";
      
      // 1. Kiểm tra Lịch đặt lẻ
      const hasNormalBooking = bookings.some((b) => {
        if (b.roomId !== roomIdStr || b.status === "cancelled") return false;
        const existDate = b.date || selectedDate;
        const bStartMs = new Date(`${existDate}T${b.startTime}`).getTime();
        const bEndMsWithBuffer = bStartMs + (b.durationMins + b.bufferMins) * 60000;
        return bStartMs < viewEndMs && bEndMsWithBuffer > viewStartMs;
      });

      // 2. Kiểm tra Lịch cố định (SỬA LỖI 1)
      const hasFixedBooking = fixedBookings.some((fb) => {
        if (fb.roomId !== roomIdStr || fb.status !== "active") return false;
        const currentDayNum = new Date(selectedDate + "T00:00:00").getDay();
        const isException = fb.exceptionDates?.includes(selectedDate); // Bỏ qua nếu ngày này đã bị xóa
        return !isException &&
               fb.daysOfWeek.includes(currentDayNum) && 
               selectedDate >= fb.startDate && 
               selectedDate <= fb.endDate;
      });

      // Nếu phòng không có đơn lẻ VÀ cũng không có lịch cố định -> Ẩn đi
      if (!hasNormalBooking && !hasFixedBooking) return false;

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
                                <Lock className="w-3 h-3"/> {fb.title}
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

  // ================= SIDEBAR =================
  const renderSidebar = () => (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 shrink-0 shadow-2xl z-30 hidden md:flex">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-emerald-500" />
          Manager<span className="text-emerald-500">Ops</span>
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {[
          {
            id: "dashboard",
            icon: LayoutDashboard,
            label: "Giám sát Vận hành",
          },
          { id: "labs", icon: DoorOpen, label: "Phòng Thực hành" },
          { id: "equipments", icon: Package, label: "Thiết Bị" },
          { id: "timeline", icon: CalendarDays, label: "Lịch Điều phối" },
          { id: "master-schedule", icon: CalendarRange, label: "Thời Khóa Biểu" },
          { id: "reports", icon: FileText, label: "Báo cáo Sự cố" },
          { id: "lookup", icon: Search, label: "Tra cứu Thông tin" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveMenu(item.id as MenuTab)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeMenu === item.id ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" : "hover:bg-slate-800"}`}
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

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {renderSidebar()}

      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 relative bg-slate-50/50">
        {/* ================= TIÊU ĐỀ GIAO DIỆN LUNG LINH ================= */}
        <div className="mb-6 md:mb-8 relative rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Hiệu ứng ánh sáng (Orbs) bay lơ lửng */}
          <div className="absolute top-[-50%] left-[-10%] w-64 h-64 bg-white/20 blur-3xl rounded-full mix-blend-overlay animate-pulse"></div>
          <div className="absolute bottom-[-50%] right-[-10%] w-64 h-64 bg-yellow-300/30 blur-3xl rounded-full mix-blend-overlay"></div>
          
          <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 w-full">
            {/* Cột trái: Lời chào */}
            <div className="text-white text-center md:text-left w-full md:w-auto">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center justify-center md:justify-start gap-3 drop-shadow-md">
                <Sparkles className="w-8 h-8 text-yellow-300 animate-bounce" />
                Hệ Thống Manager<span className="text-yellow-300">Ops</span>
              </h2>
              <p className="mt-2 text-white/90 font-medium text-sm md:text-base">
                Xin chào! Chúc bạn một ngày làm việc hiệu quả và tràn đầy năng lượng 🚀
              </p>
            </div>
            
            {/* Cột phải: Đồng hồ & Nút Đăng xuất */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-2xl flex flex-col items-center md:items-end shadow-inner">
                <div className="flex items-center gap-2 text-yellow-300 font-black text-xl md:text-2xl drop-shadow-sm">
                  <Clock className="w-5 h-5" />
                  {currentTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <span className="text-white/90 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-0.5">
                  {currentTime.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long" })}
                </span>
              </div>

              {/* Nút Đăng xuất ở Mobile đem lên đây để tiết kiệm không gian */}
              <button
                onClick={handleLogout}
                className="md:hidden p-3 text-white bg-white/10 border border-white/20 hover:bg-red-500 rounded-2xl backdrop-blur-sm transition-all shadow-md"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>


        {/* Mobile Nav Tabs */}
        <div className="md:hidden flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
          {[
            { id: "dashboard", label: "Giám sát" },
            { id: "timeline", label: "Điều phối" },
            { id: "master-schedule", label: "Cố định" },
            { id: "labs", label: "Phòng" },
            { id: "equipments", label: "Thiết bị" },
            { id: "reports", label: "Báo cáo" },
            { id: "lookup", label: "Tra cứu" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveMenu(t.id as MenuTab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${activeMenu === t.id ? "bg-emerald-600 text-white" : "bg-white text-gray-500 border border-gray-200"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
          ) : (
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeMenu === "dashboard" && renderDashboard()}
              {activeMenu === "labs" && renderLabsTable()}
              {activeMenu === "equipments" && renderEquipmentsTable()}
              {activeMenu === "timeline" && renderTimeline()}
              {activeMenu === "reports" && renderReports()}
              {activeMenu === "lookup" && renderLookup()}
              {activeMenu === "master-schedule" && renderMasterSchedule()}
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

        {/* ================= MODAL XEM CHI TIẾT CA ĐẶT ================= */}
        {/* ================= MODAL XEM CHI TIẾT CA ĐẶT ================= */}
        <AnimatePresence>
          {selectedBooking && (
            <div
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setSelectedBooking(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
              >
                <div className="bg-slate-900 p-5 flex justify-between items-center text-white shrink-0">
                  <h3 className="font-black text-xl flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" /> Chi tiết Ca
                    đặt phòng
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(null)}
                    className="hover:bg-slate-700 p-1 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h4 className="text-2xl font-black text-gray-900">
                        {selectedBooking.customerName}
                      </h4>
                      <p className="text-sm font-medium text-gray-500 mt-1">
                        SĐT: {selectedBooking.phone}
                      </p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider">
                      {selectedBooking.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* 🚀 ĐÃ NÂNG CẤP: TỰ ĐỘNG TÍNH NGÀY KẾT THÚC & CHỐNG TRÀN 24H */}
                    {(() => {
                      // Lấy ngày bắt đầu (nếu không có thì lấy ngày hôm nay làm mốc chuẩn)
                      const startDateStr =
                        selectedBooking.date ||
                        new Date().toISOString().split("T")[0];
                      const startDateTime = new Date(
                        `${startDateStr}T${selectedBooking.startTime}`,
                      );

                      // Cộng thêm số phút mượn (Javascript sẽ tự động đẩy sang ngày hôm sau nếu vượt 24h)
                      const endDateTime = new Date(
                        startDateTime.getTime() +
                          selectedBooking.durationMins * 60000,
                      );

                      const endHour = endDateTime
                        .getHours()
                        .toString()
                        .padStart(2, "0");
                      const endMin = endDateTime
                        .getMinutes()
                        .toString()
                        .padStart(2, "0");
                      const endTimeStr = `${endHour}:${endMin}`;

                      // Kiểm tra xem ngày kết thúc có lệch với ngày bắt đầu không
                      const isNextDay =
                        startDateTime.getDate() !== endDateTime.getDate() ||
                        startDateTime.getMonth() !== endDateTime.getMonth();

                      // Nếu qua ngày mới, in thêm (DD/MM)
                      const endDateDisplay = isNextDay
                        ? ` (${endDateTime.getDate().toString().padStart(2, "0")}/${(endDateTime.getMonth() + 1).toString().padStart(2, "0")})`
                        : "";

                      return (
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                            Thời gian mượn
                          </p>
                          <p className="text-lg font-black text-gray-900 flex items-baseline gap-1 flex-wrap">
                            {selectedBooking.startTime} - {endTimeStr}
                            <span className="text-sm text-blue-600 font-bold whitespace-nowrap">
                              {endDateDisplay}
                            </span>
                          </p>
                          <p className="text-xs font-medium text-amber-600 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Dọn dẹp:{" "}
                            {selectedBooking.bufferMins} phút
                          </p>
                        </div>
                      );
                    })()}

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                        Phòng Lab
                      </p>
                      <p className="text-lg font-black text-gray-900 line-clamp-1">
                        {rooms.find(
                          (r) =>
                            r.id === selectedBooking.roomId ||
                            r._id === selectedBooking.roomId,
                        )?.title ||
                          rooms.find(
                            (r) =>
                              r.id === selectedBooking.roomId ||
                              r._id === selectedBooking.roomId,
                          )?.name ||
                          "Phòng học"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-500" /> Thiết bị
                      mượn kèm
                    </h5>
                    {!selectedBooking.equipments ||
                    selectedBooking.equipments.length === 0 ? (
                      <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-100">
                        Không mượn thêm thiết bị.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {selectedBooking.equipments.map((eq, idx) => (
                          <li
                            key={idx}
                            className="flex justify-between items-center bg-blue-50/50 border border-blue-100 p-3 rounded-xl"
                          >
                            <span className="font-bold text-gray-800 text-sm">
                              {eq.name}
                            </span>
                            <span className="bg-blue-100 text-blue-700 font-black px-3 py-1 rounded-lg text-xs">
                              x{eq.quantity}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {selectedBooking.note && (
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                      <p className="text-xs font-bold text-amber-800 uppercase mb-1">
                        Ghi chú vận hành:
                      </p>
                      <p className="text-sm font-medium text-amber-900">
                        {selectedBooking.note}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-5 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng tiền cần thu:</p>
                    <p className="text-2xl font-black text-emerald-600 leading-none mt-1">
                      {calculateBookingTotal(selectedBooking).toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedBooking(null)}
                      className="flex-1 sm:flex-none px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors shadow-sm"
                    >
                      Đóng lại
                    </button>
                    {selectedBooking.paymentStatus !== "HOÀN THÀNH" && (
                      <button
                        type="button"
                        onClick={() => handleConfirmPayment(selectedBooking.id)}
                        className="flex-1 sm:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Banknote className="w-5 h-5" /> Nhận tiền & Kết thúc
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* === MODAL BÁO CÁO BẢO TRÌ (ĐÃ CHUYỂN RA NGOÀI VÀ SẼ HIỂN THỊ Ở MỌI TAB) === */}
        <AnimatePresence>
          {reportModal.isOpen && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm z-[999]">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
              >
                <div className="bg-red-600 p-5 flex justify-between items-center text-white shrink-0">
                  <h3 className="font-black text-xl flex items-center gap-2">
                    <Wrench className="w-5 h-5" /> Báo Cáo Sửa Chữa
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setReportModal({ ...reportModal, isOpen: false })
                    }
                    className="hover:bg-red-700 p-1 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleReportSubmit} className="p-6 space-y-4">
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                    <p className="text-sm text-red-800 font-bold">
                      Đối tượng: {reportModal.itemName}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      Hệ thống sẽ chuyển trạng thái của đối tượng này sang Bảo
                      trì/Sửa chữa.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Mô tả tình trạng hỏng hóc *
                    </label>
                    <textarea
                      required
                      value={reportModal.reason}
                      onChange={(e) =>
                        setReportModal({
                          ...reportModal,
                          reason: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-500 resize-none"
                      placeholder="Ví dụ: Điều hòa không mát, máy chiếu mờ..."
                    ></textarea>
                  </div>
                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setReportModal({ ...reportModal, isOpen: false })
                      }
                      className="px-5 py-2.5 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
                    >
                      Xác nhận Báo hỏng
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* ================= GIAO DIỆN XÁC NHẬN TỪ CHỐI ĐƠN ================= */}
        <AnimatePresence>
          {confirmCancel.isOpen && (
            <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center"
              >
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">
                  Xác nhận từ chối
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Bạn có chắc chắn muốn từ chối và hủy đơn đặt phòng này không?
                  Hành động này không thể hoàn tác.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      setConfirmCancel({ isOpen: false, bookingId: "" })
                    }
                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={() => {
                      executeUpdateStatus(confirmCancel.bookingId, "cancelled");
                      setConfirmCancel({ isOpen: false, bookingId: "" });
                    }}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-md"
                  >
                    Từ chối đơn
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ================= THÔNG BÁO NỔI (TOAST MESSAGE) ================= */}
        <AnimatePresence>
          {toast.show && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className={`fixed bottom-8 right-8 z-[9999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
                toast.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              )}
              <span className="font-bold text-sm">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
